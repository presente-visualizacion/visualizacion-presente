// Operaciones de la etapa 2B: estructura, configuración de bloques, columnas,
// tema y meses; y las plantillas que usa el panel.

import { describe, expect, it } from 'vitest';
import { aplicar, aplicarVarias, bloqueDe, compactar, inversa, OperacionNoAplicable, type Operacion } from '@/lib/edicion/operaciones';
import {
  bloqueNuevo, configPara, conjuntoEjemplo, copiaDeDiapositiva, diapositivaNueva, idsEnUso, mesSiguiente, motivoNoDisponible, nuevoId,
} from '@/lib/edicion/plantillas';
import { FORMAS, validarOperaciones, validarPresentacion } from '@/lib/edicion/validar';
import type { BloqueGrafico, BloqueTexto, Presentacion } from '@/lib/tipos';
import { muestra } from './muestra';

/** Aplica y deshace: debe quedar igual. Devuelve la presentación cambiada. */
function idaYVuelta(p: Presentacion, op: Operacion): Presentacion {
  const vuelta = inversa(p, op);
  const cambiada = aplicar(p, op);
  expect(vuelta.length).toBeGreaterThan(0);
  expect(vuelta.reduce(aplicar, cambiada)).toEqual(p);
  return cambiada;
}

const valida = (p: Presentacion) => {
  const r = validarPresentacion(p);
  if (!r.ok) throw new Error(r.errores.join('\n'));
};

const ids = (p: Presentacion) => p.diapositivas.map((d) => d.id);

describe('diapositivas', () => {
  it('pone una nueva después de otra, y se deshace', () => {
    const p = muestra();
    const nueva = diapositivaNueva('contenido', idsEnUso(p));
    const r = idaYVuelta(p, { op: 'diapositiva.poner', diapositiva: nueva, despues: 'macro' });
    expect(ids(r).indexOf(nueva.id)).toBe(ids(r).indexOf('macro') + 1);
    valida(r);
  });

  it('poner dos veces da lo mismo, y al principio con null', () => {
    const p = muestra();
    const nueva = diapositivaNueva('cierre', idsEnUso(p));
    const op: Operacion = { op: 'diapositiva.poner', diapositiva: nueva, despues: null };
    const una = aplicar(p, op);
    expect(aplicar(una, op)).toEqual(una);
    expect(ids(una)[0]).toBe(nueva.id);
  });

  it('quita y devuelve en el mismo lugar', () => {
    const p = muestra();
    const r = idaYVuelta(p, { op: 'diapositiva.quitar', diapositiva: 'saldo-cartera' });
    expect(ids(r)).not.toContain('saldo-cartera');
  });

  it('mueve y devuelve', () => {
    const p = muestra();
    const r = idaYVuelta(p, { op: 'diapositiva.mover', diapositiva: 'cierre', despues: 'portada' });
    expect(ids(r)[1]).toBe('cierre');
    idaYVuelta(p, { op: 'diapositiva.mover', diapositiva: 'macro', despues: null });
  });

  it('se salta lo que no se puede: destino inexistente, la única diapositiva', () => {
    const p = muestra();
    expect(() => aplicar(p, { op: 'diapositiva.quitar', diapositiva: 'no-existe' })).toThrow(OperacionNoAplicable);
    expect(() => aplicar(p, { op: 'diapositiva.mover', diapositiva: 'macro', despues: 'no-existe' })).toThrow(OperacionNoAplicable);
    expect(() => aplicar(p, { op: 'diapositiva.mover', diapositiva: 'macro', despues: 'macro' })).toThrow(OperacionNoAplicable);
    const sola = { ...p, diapositivas: [p.diapositivas[0]] };
    expect(() => aplicar(sola, { op: 'diapositiva.quitar', diapositiva: sola.diapositivas[0].id })).toThrow(OperacionNoAplicable);
  });

  it('cambia tipo y disposición', () => {
    const p = muestra();
    expect(idaYVuelta(p, { op: 'diapositiva.tipo', diapositiva: 'macro', valor: 'cierre' }).diapositivas[1].tipo).toBe('cierre');
    idaYVuelta(p, { op: 'diapositiva.disposicion', diapositiva: 'macro', valor: 'columnas' });
  });

  it('duplica una diapositiva con copia de sus datos', () => {
    const p = muestra();
    const original = p.diapositivas.find((d) => d.id === 'saldo-cartera')!;
    const { diapositiva, conjuntos } = copiaDeDiapositiva(p, original, idsEnUso(p));
    expect(conjuntos).toHaveLength(1);
    const ops: Operacion[] = [...conjuntos.map((c): Operacion => ({ op: 'conjunto.poner', conjunto: c })), { op: 'diapositiva.poner', diapositiva, despues: original.id }];
    const r = aplicarVarias(p, ops).presentacion;
    valida(r);
    const copia = r.diapositivas.find((d) => d.id === diapositiva.id)!;
    expect((copia.bloques[0] as BloqueGrafico).datos).toBe(conjuntos[0].id);
    expect(conjuntos[0].filas).toEqual(p.datos['saldo-cartera'].filas);
  });
});

describe('bloques', () => {
  it('agrega un gráfico con datos nuevos, y se deshace todo junto', () => {
    const p = muestra();
    const enUso = idsEnUso(p);
    const conjunto = conjuntoEjemplo(nuevoId('c', enUso), 'barras');
    const bloque = bloqueNuevo('grafico', enUso, conjunto);
    const ops: Operacion[] = [{ op: 'conjunto.poner', conjunto }, { op: 'bloque.poner', diapositiva: 'saldo-cartera', bloque, despues: 'g-cartera' }];
    let r = p;
    const vuelta: Operacion[] = [];
    for (const op of ops) {
      vuelta.unshift(...inversa(r, op));
      r = aplicar(r, op);
    }
    valida(r);
    expect(r.diapositivas.find((d) => d.id === 'saldo-cartera')!.bloques.map((b) => b.id)).toEqual(['g-cartera', bloque.id]);
    expect(vuelta.reduce(aplicar, r)).toEqual(p);
  });

  it('quita, mueve y reemplaza bloques', () => {
    const p = muestra();
    idaYVuelta(p, { op: 'bloque.quitar', bloque: 'macro-texto' });
    const r = idaYVuelta(p, { op: 'bloque.mover', bloque: 'macro-texto', despues: null });
    expect(r.diapositivas[1].bloques[0].id).toBe('macro-texto');
    const reemplazo: BloqueTexto = { id: 'macro-texto', tipo: 'texto', contenido: { porPeriodo: false, valor: 'Otro' } };
    idaYVuelta(p, { op: 'bloque.poner', diapositiva: 'macro', bloque: reemplazo, despues: 'macro-cifras' });
  });

  it('un bloque puesto en otra diapositiva sale de la anterior', () => {
    const p = muestra();
    const b = bloqueDe(p, 'macro-texto')!;
    const r = idaYVuelta(p, { op: 'bloque.poner', diapositiva: 'saldo-cartera', bloque: b, despues: 'g-cartera' });
    valida(r);
    expect(r.diapositivas[1].bloques.map((x) => x.id)).toEqual(['macro-cifras']);
  });

  it('cambia la configuración de un gráfico y de una tabla', () => {
    const p = muestra();
    const g = bloqueDe(p, 'g-cartera') as BloqueGrafico;
    const r = idaYVuelta(p, { op: 'grafico.config', bloque: 'g-cartera', valor: { datos: g.datos, forma: 'lineas', ejeX: g.ejeX, series: g.series.slice(0, 1) } });
    expect((bloqueDe(r, 'g-cartera') as BloqueGrafico).forma).toBe('lineas');
    idaYVuelta(p, { op: 'tabla.config', bloque: 't-creditos', valor: { datos: 'benchmarking-creditos', columnas: ['entidad', 'vis'] } });
    expect(() => aplicar(p, { op: 'tabla.config', bloque: 'g-cartera', valor: { datos: 'x' } })).toThrow(OperacionNoAplicable);
  });
});

describe('conjuntos y columnas', () => {
  it('no quita un conjunto que se usa', () => {
    const p = muestra();
    expect(() => aplicar(p, { op: 'conjunto.quitar', conjunto: 'saldo-cartera' })).toThrow(OperacionNoAplicable);
    const sin = aplicar(p, { op: 'bloque.quitar', bloque: 'g-cartera' });
    idaYVuelta(sin, { op: 'conjunto.quitar', conjunto: 'saldo-cartera' });
  });

  it('agrega, reordena y quita columnas; las filas se ajustan', () => {
    const p = muestra();
    const c = p.datos['benchmarking-vis'];
    const columnas = [...c.columnas.filter((x) => x.clave !== 'monto').reverse(), { clave: 'col1', nombre: 'Nueva', tipo: 'numero' as const }];
    // `monto` no la usa el gráfico (usa entidad y tpp).
    const r = idaYVuelta(p, { op: 'datos.columnas', conjunto: c.id, valor: columnas });
    valida(r);
    const fila = r.datos['benchmarking-vis'].filasPorPeriodo!['2026-10'][0];
    expect('monto' in fila).toBe(false);
  });

  it('cambia el tipo de una columna convirtiendo las celdas', () => {
    const p = muestra();
    const c = p.datos['benchmarking-vis'];
    const aTexto = c.columnas.map((x) => (x.clave === 'desembolsos' ? { ...x, tipo: 'texto' as const } : x));
    const r = idaYVuelta(p, { op: 'datos.columnas', conjunto: c.id, valor: aTexto });
    valida(r);
    expect(typeof r.datos['benchmarking-vis'].filasPorPeriodo!['2026-10'][0].desembolsos).toBe('string');
    const deVuelta = aplicar(r, { op: 'datos.columnas', conjunto: c.id, valor: c.columnas });
    expect(deVuelta.datos['benchmarking-vis'].filasPorPeriodo!['2026-10'][0].desembolsos).toEqual(p.datos['benchmarking-vis'].filasPorPeriodo!['2026-10'][0].desembolsos);
  });

  it('no quita ni cambia entre texto y número una columna que usa un bloque', () => {
    const p = muestra();
    const c = p.datos['benchmarking-vis'];
    expect(() => aplicar(p, { op: 'datos.columnas', conjunto: c.id, valor: c.columnas.filter((x) => x.clave !== 'tpp') })).toThrow(OperacionNoAplicable);
    const tppTexto = c.columnas.map((x) => (x.clave === 'tpp' ? { ...x, tipo: 'texto' as const } : x));
    expect(() => aplicar(p, { op: 'datos.columnas', conjunto: c.id, valor: tppTexto })).toThrow(OperacionNoAplicable);
    const tppMoneda = c.columnas.map((x) => (x.clave === 'tpp' ? { ...x, tipo: 'moneda' as const } : x));
    valida(aplicar(p, { op: 'datos.columnas', conjunto: c.id, valor: tppMoneda }));
  });

  it('cambia el nombre del conjunto', () => {
    expect(idaYVuelta(muestra(), { op: 'datos.nombre', conjunto: 'saldo-cartera', valor: 'Cartera' }).datos['saldo-cartera'].nombre).toBe('Cartera');
  });
});

describe('tema y meses', () => {
  it('cambia el tema', () => {
    const p = muestra();
    idaYVuelta(p, { op: 'tema', valor: { ...p.tema, primario: '#2274C4' } });
  });

  it('"Nuevo mes" copia lo propio de cada mes y se deshace', () => {
    const p = muestra();
    const ultimo = p.periodos.at(-1)!;
    const nuevo = mesSiguiente(ultimo);
    const r = idaYVuelta(p, { op: 'periodo.agregar', periodo: nuevo, copiarDe: ultimo });
    valida(r);
    expect(r.periodos.at(-1)).toBe(nuevo);
    expect(r.datos['benchmarking-vis'].filasPorPeriodo![nuevo]).toEqual(p.datos['benchmarking-vis'].filasPorPeriodo![ultimo]);
    // Si el mes ya existe no hace nada (reenviarla no pisa lo editado después).
    const editada = aplicar(r, { op: 'datos.filas', conjunto: 'benchmarking-vis', periodo: nuevo, valor: [] });
    expect(aplicar(editada, { op: 'periodo.agregar', periodo: nuevo, copiarDe: ultimo })).toEqual(editada);
  });

  it('agrega un mes en medio, en orden', () => {
    const p = { ...muestra(), periodos: ['2026-01', '2026-03'] };
    expect(aplicar(p, { op: 'periodo.agregar', periodo: '2026-02', copiarDe: null }).periodos).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  it('quita un mes con todo lo suyo y lo devuelve al deshacer', () => {
    const p = muestra();
    const mes = p.periodos.at(-1)!;
    const r = idaYVuelta(p, { op: 'periodo.quitar', periodo: mes });
    valida(r);
    expect(r.datos['benchmarking-vis'].filasPorPeriodo![mes]).toBeUndefined();
    const solo = { ...p, periodos: [p.periodos[0]] };
    expect(() => aplicar(solo, { op: 'periodo.quitar', periodo: solo.periodos[0] })).toThrow(OperacionNoAplicable);
  });

  it('mesSiguiente pasa de año', () => {
    expect(mesSiguiente('2026-12')).toBe('2027-01');
    expect(mesSiguiente('2026-09')).toBe('2026-10');
  });
});

describe('formas de gráfico', () => {
  it('todas las formas se pueden configurar sobre datos de ejemplo y validan', () => {
    for (const forma of FORMAS) {
      const p = muestra();
      const enUso = idsEnUso(p);
      const conjunto = conjuntoEjemplo(nuevoId('c', enUso), forma);
      const bloque = bloqueNuevo('grafico', enUso, conjunto) as BloqueGrafico;
      const { id: _id, tipo: _tipo, ...actual } = bloque;
      const config = configPara(forma, actual, conjunto);
      const r = aplicarVarias(p, [
        { op: 'conjunto.poner', conjunto },
        { op: 'bloque.poner', diapositiva: 'saldo-cartera', bloque: { ...config, id: bloque.id, tipo: 'grafico' }, despues: 'g-cartera' },
      ]).presentacion;
      valida(r);
    }
  });

  it('pasar de un gráfico de varias series a circular deja una sola', () => {
    const p = muestra();
    const g = bloqueDe(p, 'g-tasas') as BloqueGrafico;
    const { id: _id, tipo: _tipo, ...actual } = g;
    const conjunto = p.datos[g.datos];
    expect(configPara('circular', actual, conjunto).series).toHaveLength(1);
    const combinado = configPara('combinado', actual, conjunto);
    expect(combinado.series.map((s) => s.tipo)).toEqual(['barras', 'lineas', 'lineas', 'lineas']);
    const disp = configPara('dispersion', actual, conjunto);
    expect(conjunto.columnas.find((c) => c.clave === disp.ejeX)!.tipo).not.toBe('texto');
    valida(aplicar(p, { op: 'grafico.config', bloque: g.id, valor: disp }));
  });

  it('el validador exige lo de cada forma', () => {
    const p = muestra();
    const g = bloqueDe(p, 'g-tasas') as BloqueGrafico;
    const { id: _id, tipo: _tipo, ...actual } = g;
    const mal = aplicar(p, { op: 'grafico.config', bloque: g.id, valor: { ...actual, forma: 'circular' } });
    expect(validarPresentacion(mal).ok).toBe(false);
    const ejeTexto = aplicar(p, { op: 'grafico.config', bloque: g.id, valor: { ...actual, forma: 'dispersion', series: actual.series.slice(0, 1) } });
    expect(validarPresentacion(ejeTexto).ok).toBe(false);
  });

  it('dice qué formas no sirven para un conjunto', () => {
    const solo = { id: 'c', nombre: 'c', porPeriodo: false, columnas: [{ clave: 'a', nombre: 'a', tipo: 'texto' as const }, { clave: 'b', nombre: 'b', tipo: 'numero' as const }] };
    expect(motivoNoDisponible('dispersion', solo)).not.toBeNull();
    expect(motivoNoDisponible('barras', solo)).toBeNull();
  });
});

describe('compactar y validar operaciones nuevas', () => {
  it('compacta configuraciones del mismo bloque, nunca a través de estructura', () => {
    const p = muestra();
    const g = bloqueDe(p, 'g-cartera') as BloqueGrafico;
    const { id: _id, tipo: _tipo, ...valor } = g;
    const a: Operacion = { op: 'grafico.config', bloque: g.id, valor: { ...valor, forma: 'lineas' } };
    const b: Operacion = { op: 'grafico.config', bloque: g.id, valor: { ...valor, forma: 'area' } };
    const mover: Operacion = { op: 'diapositiva.mover', diapositiva: 'macro', despues: null };
    expect(compactar([a, b])).toEqual([b]);
    expect(compactar([a, mover, b])).toEqual([a, mover, b]);
  });

  it('el validador acepta las operaciones nuevas y rechaza ids raros', () => {
    const p = muestra();
    const ops: Operacion[] = [
      { op: 'diapositiva.poner', diapositiva: diapositivaNueva('contenido', idsEnUso(p)), despues: null },
      { op: 'diapositiva.quitar', diapositiva: 'macro' },
      { op: 'bloque.mover', bloque: 'macro-texto', despues: null },
      { op: 'tema', valor: p.tema },
      { op: 'periodo.agregar', periodo: '2026-11', copiarDe: '2026-10' },
      { op: 'datos.columnas', conjunto: 'saldo-cartera', valor: p.datos['saldo-cartera'].columnas },
    ];
    expect(validarOperaciones(ops).ok).toBe(true);
    expect(validarOperaciones([{ op: 'diapositiva.quitar', diapositiva: '../x' }]).ok).toBe(false);
    expect(validarOperaciones([{ op: 'tema', valor: { ...p.tema, logo: 'javascript:alert(1)' } }]).ok).toBe(false);
  });
});

describe('acciones del panel', () => {
  it('quitar el único bloque que usa un conjunto quita también el conjunto, y se deshace junto', async () => {
    const { opsQuitarBloque, opsQuitarDiapositiva, opsDuplicarBloque, opsAgregarBloque } = await import('@/lib/edicion/plantillas');
    const p = muestra();
    const ops = opsQuitarBloque(p, 'g-cartera');
    expect(ops.map((o) => o.op)).toEqual(['bloque.quitar', 'conjunto.quitar']);
    let r = p;
    const vuelta: Operacion[] = [];
    for (const op of ops) {
      vuelta.unshift(...inversa(r, op));
      r = aplicar(r, op);
    }
    valida(r);
    expect(vuelta.reduce(aplicar, r)).toEqual(p);

    expect(opsQuitarDiapositiva(p, 'benchmarking-vis').map((o) => o.op)).toEqual(['diapositiva.quitar', 'conjunto.quitar']);

    const dup = aplicarVarias(p, opsDuplicarBloque(p, 'g-cartera')).presentacion;
    valida(dup);
    const d = dup.diapositivas.find((x) => x.id === 'saldo-cartera')!;
    expect(d.bloques).toHaveLength(2);
    expect(d.disposicion).toBe('columnas');

    const nuevo = opsAgregarBloque(p, 'macro', 'tabla', 'saldo-cartera')!;
    const conTabla = aplicarVarias(p, nuevo.ops).presentacion;
    valida(conTabla);
    expect(nuevo.conjuntoNuevo).toBeNull();
    expect(conTabla.diapositivas[1].bloques).toHaveLength(3);
  });
});

describe('volver de la dispersión', () => {
  it('el eje vuelve a una columna de texto', () => {
    const p = muestra();
    const g = bloqueDe(p, 'g-vis') as BloqueGrafico;
    const { id: _id, tipo: _tipo, ...actual } = g;
    const conjunto = p.datos[g.datos];
    const disp = configPara('dispersion', actual, conjunto);
    expect(configPara('barrasHorizontales', disp, conjunto).ejeX).toBe('entidad');
  });
});
