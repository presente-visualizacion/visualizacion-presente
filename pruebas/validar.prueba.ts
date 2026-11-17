import { describe, expect, it } from 'vitest';
import { TOPES, revisarReferencias, validarOperaciones, validarPresentacion } from '@/lib/edicion/validar';
import type { BloqueGrafico, Presentacion } from '@/lib/tipos';
import { muestra } from './muestra';

function errores(p: unknown): string[] {
  const v = validarPresentacion(p);
  return v.ok ? [] : v.errores;
}

describe('validarPresentacion', () => {
  it('acepta la presentación de muestra tal como está', () => {
    expect(errores(muestra())).toEqual([]);
  });

  it('rechaza campos desconocidos y formas equivocadas', () => {
    expect(errores({ ...muestra(), extra: 1 })).not.toEqual([]);
    expect(errores({ ...muestra(), formato: 2 })).not.toEqual([]);
    expect(errores({ ...muestra(), periodos: ['2026-13'] })).not.toEqual([]);
    expect(errores(null)).not.toEqual([]);
    const p = muestra();
    p.tema.logo = 'javascript:alert(1)';
    expect(errores(p)).not.toEqual([]);
    p.tema.logo = '//otro.sitio/logo.png';
    expect(errores(p)).not.toEqual([]);
  });

  it('detecta ids repetidos', () => {
    const p = muestra();
    p.diapositivas[2].bloques[0].id = 'macro-texto';
    expect(revisarReferencias(p).join(' ')).toContain('macro-texto');
  });

  it('detecta bloques que apuntan a conjuntos o columnas que no existen', () => {
    const p = muestra();
    const grafico = p.diapositivas.find((d) => d.id === 'benchmarking-vis')!.bloques[0] as BloqueGrafico;
    grafico.series[0].clave = 'no-existe';
    expect(revisarReferencias(p).join(' ')).toContain('no-existe');
    grafico.datos = 'tampoco';
    expect(revisarReferencias(p).join(' ')).toContain('tampoco');
  });

  it('detecta meses fuera de la lista y meses desordenados', () => {
    const p = muestra();
    p.datos['benchmarking-vis'].filasPorPeriodo!['2031-01'] = [];
    expect(revisarReferencias(p).join(' ')).toContain('2031-01');
    const q = muestra();
    q.periodos.reverse();
    expect(revisarReferencias(q)).not.toEqual([]);
  });

  it('detecta celdas que no corresponden al tipo de la columna', () => {
    const p = muestra();
    p.datos['benchmarking-vis'].filasPorPeriodo!['2026-10'][0].tpp = '14,5';
    expect(revisarReferencias(p).join(' ')).toContain('tpp');
    const q = muestra();
    q.datos['benchmarking-vis'].filasPorPeriodo!['2026-10'][0].entidad = 7;
    expect(revisarReferencias(q).join(' ')).toContain('entidad');
    const r = muestra();
    r.datos['benchmarking-vis'].filasPorPeriodo!['2026-10'][0].inventada = 1;
    expect(revisarReferencias(r).join(' ')).toContain('inventada');
  });

  it('rechaza números que no son finitos y textos que pasan el tope', () => {
    const p = muestra() as Presentacion;
    p.datos['saldo-cartera'].filas![0][p.datos['saldo-cartera'].columnas[1].clave] = Infinity;
    expect(errores(p)).not.toEqual([]);
    const q = muestra();
    q.diapositivas[1].titulo = 'x'.repeat(TOPES.titulo + 1);
    expect(errores(q)).not.toEqual([]);
  });
});

describe('validarOperaciones', () => {
  it('acepta operaciones bien formadas', () => {
    const v = validarOperaciones([
      { op: 'presentacion.nombre', valor: 'Comité' },
      { op: 'diapositiva.subtitulo', diapositiva: 'macro', valor: '' },
      { op: 'texto.contenido', bloque: 'macro-texto', periodo: '2026-10', valor: null },
      { op: 'cifras.valor', bloque: 'macro-cifras', periodo: null, valor: [{ etiqueta: 'IPC', valor: '5,1 %' }] },
      { op: 'datos.filas', conjunto: 'benchmarking-vis', periodo: '2026-10', valor: [{ entidad: 'A', tpp: 1.5, monto: null }] },
      { op: 'datos.columna', conjunto: 'benchmarking-vis', clave: 'tpp', decimales: null },
      { op: 'porPeriodo', destino: { conjunto: 'saldo-cartera' }, valor: true, periodo: '2026-10' },
    ]);
    expect(v.ok, v.ok ? '' : v.errores.join('\n')).toBe(true);
  });

  it('rechaza lo que no reconoce o pasa los topes', () => {
    const malas: unknown[] = [
      [],
      'hola',
      [{ op: 'borrar.todo' }],
      [{ op: 'presentacion.nombre', valor: '   ' }],
      [{ op: 'presentacion.nombre', valor: 'x', extra: true }],
      [{ op: 'diapositiva.titulo', diapositiva: 'macro', valor: 'x'.repeat(TOPES.titulo + 1) }],
      [{ op: 'texto.contenido', bloque: 'b', periodo: 'octubre', valor: 'x' }],
      [{ op: 'texto.contenido', bloque: 'b', periodo: null, valor: 'x'.repeat(TOPES.texto + 1) }],
      [{ op: 'cifras.valor', bloque: 'b', periodo: null, valor: Array(TOPES.cifrasPorBloque + 1).fill({ etiqueta: 'a', valor: '1' }) }],
      [{ op: 'datos.filas', conjunto: 'c', periodo: null, valor: Array(TOPES.filasPorMes + 1).fill({}) }],
      [{ op: 'datos.filas', conjunto: 'c', periodo: null, valor: [{ a: { anidado: 1 } }] }],
      [{ op: 'datos.filas', conjunto: 'c', periodo: null, valor: [{ a: NaN }] }],
      [{ op: 'porPeriodo', destino: { bloque: 'b', conjunto: 'c' }, valor: true, periodo: '2026-10' }],
      Array(TOPES.operacionesPorEnvio + 1).fill({ op: 'presentacion.nombre', valor: 'x' }),
    ];
    for (const mala of malas) expect(validarOperaciones(mala).ok, JSON.stringify(mala).slice(0, 80)).toBe(false);
  });

  it('los mensajes de error están en español', () => {
    const v = validarOperaciones([{ op: 'diapositiva.titulo', diapositiva: 'macro', valor: 5 }]);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errores[0]).toMatch(/0\.valor: .*(inválid|esperaba)/i);
  });
});
