import { describe, expect, it } from 'vitest';
import { aplicar, aplicarVarias, bloqueDe, compactar, inversa, OperacionNoAplicable, type Operacion } from '@/lib/edicion/operaciones';
import { validarPresentacion } from '@/lib/edicion/validar';
import type { BloqueCifras, BloqueTexto, Presentacion } from '@/lib/tipos';
import { muestra } from './muestra';

const MES = '2026-10';
const OTRO = '2026-09';

/** Aplica la operación y luego su inversa: debe quedar igual que al principio. */
function idaYVuelta(p: Presentacion, op: Operacion): Presentacion {
  const vuelta = inversa(p, op);
  const cambiada = aplicar(p, op);
  expect(vuelta.length).toBeGreaterThan(0);
  expect(vuelta.reduce(aplicar, cambiada)).toEqual(p);
  return cambiada;
}

function texto(p: Presentacion, id = 'macro-texto'): BloqueTexto {
  return bloqueDe(p, id) as BloqueTexto;
}
function cifras(p: Presentacion, id = 'macro-cifras'): BloqueCifras {
  return bloqueDe(p, id) as BloqueCifras;
}

describe('aplicar', () => {
  it('no modifica la presentación recibida', () => {
    const p = muestra();
    const copia = structuredClone(p);
    aplicar(p, { op: 'diapositiva.titulo', diapositiva: 'macro', valor: 'Otro' });
    aplicar(p, { op: 'datos.filas', conjunto: 'benchmarking-vis', periodo: MES, valor: [] });
    expect(p).toEqual(copia);
  });

  it('cambia nombre y descripción, y los devuelve', () => {
    const p = muestra();
    expect(idaYVuelta(p, { op: 'presentacion.nombre', valor: 'Comité nuevo' }).nombre).toBe('Comité nuevo');
    const sin = idaYVuelta(p, { op: 'presentacion.descripcion', valor: '' });
    expect('descripcion' in sin).toBe(false);
  });

  it('cambia título y subtítulo; subtítulo vacío lo quita', () => {
    const p = muestra();
    const q = idaYVuelta(p, { op: 'diapositiva.titulo', diapositiva: 'macro', valor: 'Macro {mes}' });
    expect(q.diapositivas.find((d) => d.id === 'macro')?.titulo).toBe('Macro {mes}');
    const r = idaYVuelta(q, { op: 'diapositiva.subtitulo', diapositiva: 'portada', valor: '' });
    expect('subtitulo' in r.diapositivas[0]).toBe(false);
  });

  it('el texto de un mes no toca los otros meses', () => {
    const p = muestra();
    expect(texto(p).contenido.porPeriodo).toBe(true);
    const q = idaYVuelta(p, { op: 'texto.contenido', bloque: 'macro-texto', periodo: MES, valor: 'Nuevo' });
    expect(texto(q).contenido.valores?.[MES]).toBe('Nuevo');
    expect(texto(q).contenido.valores?.[OTRO]).toBe(texto(p).contenido.valores?.[OTRO]);
  });

  it('valor null borra el contenido de ese mes', () => {
    const p = muestra();
    const q = idaYVuelta(p, { op: 'cifras.valor', bloque: 'macro-cifras', periodo: MES, valor: null });
    expect(cifras(q).cifras.valores && MES in cifras(q).cifras.valores!).toBe(false);
  });

  it('cambia las filas de un mes y las de un conjunto único', () => {
    const p = muestra();
    const filas = [{ entidad: 'Fondo Ejemplo', tpp: 12.5, desembolsos: 10, monto: 100 }];
    const q = idaYVuelta(p, { op: 'datos.filas', conjunto: 'benchmarking-vis', periodo: MES, valor: filas });
    expect(q.datos['benchmarking-vis'].filasPorPeriodo?.[MES]).toEqual(filas);
    expect(q.datos['benchmarking-vis'].filasPorPeriodo?.[OTRO]).toEqual(p.datos['benchmarking-vis'].filasPorPeriodo?.[OTRO]);

    const unicas = p.datos['saldo-cartera'].filas!.slice(0, 3);
    const r = idaYVuelta(p, { op: 'datos.filas', conjunto: 'saldo-cartera', periodo: null, valor: unicas });
    expect(r.datos['saldo-cartera'].filas).toEqual(unicas);
  });

  it('cambia solo los campos de columna que llegan', () => {
    const p = muestra();
    const q = idaYVuelta(p, { op: 'datos.columna', conjunto: 'benchmarking-vis', clave: 'tpp', nombre: 'TPP', decimales: null });
    const col = q.datos['benchmarking-vis'].columnas.find((c) => c.clave === 'tpp')!;
    expect(col.nombre).toBe('TPP');
    expect('decimales' in col).toBe(false);
    expect(col.tipo).toBe('porcentaje');
    const r = idaYVuelta(p, { op: 'datos.columna', conjunto: 'benchmarking-vis', clave: 'monto', unidad: '' });
    expect('unidad' in r.datos['benchmarking-vis'].columnas.find((c) => c.clave === 'monto')!).toBe(false);
  });

  it('aplicar dos veces la misma operación da lo mismo', () => {
    const p = muestra();
    const ops: Operacion[] = [
      { op: 'diapositiva.titulo', diapositiva: 'macro', valor: 'X' },
      { op: 'texto.contenido', bloque: 'macro-texto', periodo: MES, valor: 'Y' },
      { op: 'datos.filas', conjunto: 'benchmarking-vis', periodo: MES, valor: [] },
      { op: 'porPeriodo', destino: { bloque: 'macro-texto' }, valor: false, periodo: MES },
      { op: 'porPeriodo', destino: { conjunto: 'saldo-cartera' }, valor: true, periodo: MES },
    ];
    for (const op of ops) {
      const una = aplicar(p, op);
      expect(aplicar(una, op)).toEqual(una);
    }
  });

  it('rechaza destinos que no existen o que no coinciden', () => {
    const p = muestra();
    const malas: Operacion[] = [
      { op: 'diapositiva.titulo', diapositiva: 'no-existe', valor: 'X' },
      { op: 'texto.contenido', bloque: 'no-existe', periodo: MES, valor: 'X' },
      { op: 'texto.contenido', bloque: 'macro-cifras', periodo: MES, valor: 'X' },
      { op: 'texto.contenido', bloque: 'macro-texto', periodo: null, valor: 'X' },
      { op: 'texto.contenido', bloque: 'macro-texto', periodo: '2031-01', valor: 'X' },
      { op: 'datos.filas', conjunto: 'saldo-cartera', periodo: MES, valor: [] },
      { op: 'datos.filas', conjunto: 'benchmarking-vis', periodo: null, valor: [] },
      { op: 'datos.filas', conjunto: '__proto__', periodo: null, valor: [] },
      { op: 'datos.columna', conjunto: 'saldo-cartera', clave: 'no-existe', nombre: 'X' },
      { op: 'porPeriodo', destino: { bloque: 'g-vis' }, valor: true, periodo: MES },
    ];
    for (const op of malas) {
      expect(() => aplicar(p, op), JSON.stringify(op)).toThrow(OperacionNoAplicable);
      expect(inversa(p, op).length === 0 || op.op === 'texto.contenido' || op.op === 'datos.filas').toBe(true);
    }
    const { presentacion, omitidas } = aplicarVarias(p, [malas[0], { op: 'presentacion.nombre', valor: 'Sigue' }, malas[5]]);
    expect(omitidas).toBe(2);
    expect(presentacion.nombre).toBe('Sigue');
  });
});

describe('porPeriodo', () => {
  it('a "igual en todos" deja el valor del mes elegido, y deshacer devuelve todos los meses', () => {
    const p = muestra();
    const q = idaYVuelta(p, { op: 'porPeriodo', destino: { bloque: 'macro-texto' }, valor: false, periodo: OTRO });
    expect(texto(q).contenido).toEqual({ porPeriodo: false, valor: texto(p).contenido.valores?.[OTRO] });

    const r = idaYVuelta(p, { op: 'porPeriodo', destino: { bloque: 'macro-cifras' }, valor: false, periodo: MES });
    expect(cifras(r).cifras.valor).toEqual(cifras(p).cifras.valores?.[MES]);

    const s = idaYVuelta(p, { op: 'porPeriodo', destino: { conjunto: 'benchmarking-vis' }, valor: false, periodo: MES });
    expect(s.datos['benchmarking-vis'].filas).toEqual(p.datos['benchmarking-vis'].filasPorPeriodo?.[MES]);
    expect('filasPorPeriodo' in s.datos['benchmarking-vis']).toBe(false);
  });

  it('a "propio de cada mes" copia el valor a todos los meses', () => {
    const p = muestra();
    const q = idaYVuelta(p, { op: 'porPeriodo', destino: { conjunto: 'saldo-cartera' }, valor: true, periodo: MES });
    const conjunto = q.datos['saldo-cartera'];
    expect(Object.keys(conjunto.filasPorPeriodo!)).toEqual(p.periodos);
    expect(conjunto.filasPorPeriodo![OTRO]).toEqual(p.datos['saldo-cartera'].filas);
    expect('filas' in conjunto).toBe(false);
    expect(validarPresentacion(q).ok).toBe(true);
  });

  it('las presentaciones que resultan siguen siendo válidas', () => {
    let p = muestra();
    const ops: Operacion[] = [
      { op: 'porPeriodo', destino: { bloque: 'macro-texto' }, valor: false, periodo: MES },
      { op: 'texto.contenido', bloque: 'macro-texto', periodo: null, valor: 'Igual en todos' },
      { op: 'porPeriodo', destino: { bloque: 'macro-texto' }, valor: true, periodo: MES },
      { op: 'texto.contenido', bloque: 'macro-texto', periodo: OTRO, valor: null },
      { op: 'porPeriodo', destino: { conjunto: 'benchmarking-creditos' }, valor: false, periodo: MES },
    ];
    for (const op of ops) {
      p = aplicar(p, op);
      const v = validarPresentacion(p);
      expect(v.ok, v.ok ? '' : v.errores.join('\n')).toBe(true);
    }
  });
});

describe('compactar', () => {
  it('deja la última operación de cada destino y conserva el orden', () => {
    const ops: Operacion[] = [
      { op: 'diapositiva.titulo', diapositiva: 'macro', valor: 'A' },
      { op: 'texto.contenido', bloque: 'macro-texto', periodo: MES, valor: '1' },
      { op: 'diapositiva.titulo', diapositiva: 'macro', valor: 'AB' },
      { op: 'diapositiva.titulo', diapositiva: 'cierre', valor: 'Z' },
      { op: 'texto.contenido', bloque: 'macro-texto', periodo: OTRO, valor: '2' },
      { op: 'diapositiva.titulo', diapositiva: 'macro', valor: 'ABC' },
    ];
    expect(compactar(ops)).toEqual([ops[1], ops[3], ops[4], ops[5]]);
  });

  it('no cruza un cambio de porPeriodo y da el mismo resultado que sin compactar', () => {
    const p = muestra();
    const ops: Operacion[] = [
      { op: 'texto.contenido', bloque: 'macro-texto', periodo: MES, valor: 'antes' },
      { op: 'porPeriodo', destino: { bloque: 'macro-texto' }, valor: false, periodo: MES },
      { op: 'texto.contenido', bloque: 'macro-texto', periodo: null, valor: 'a' },
      { op: 'texto.contenido', bloque: 'macro-texto', periodo: null, valor: 'ab' },
      { op: 'porPeriodo', destino: { bloque: 'macro-texto' }, valor: true, periodo: MES },
      { op: 'texto.contenido', bloque: 'macro-texto', periodo: MES, valor: 'después' },
    ];
    const compactas = compactar(ops);
    expect(compactas).toHaveLength(5);
    expect(compactas.reduce(aplicar, p)).toEqual(ops.reduce(aplicar, p));
  });

  it('los cambios de distintos campos de una columna no se pisan', () => {
    const ops: Operacion[] = [
      { op: 'datos.columna', conjunto: 'c', clave: 'k', nombre: 'A' },
      { op: 'datos.columna', conjunto: 'c', clave: 'k', decimales: 1 },
      { op: 'datos.columna', conjunto: 'c', clave: 'k', nombre: 'B' },
    ];
    expect(compactar(ops)).toEqual([ops[1], ops[2]]);
  });
});
