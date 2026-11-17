import { describe, expect, it } from 'vitest';
import { aplicar, inversa, type Operacion } from '@/lib/edicion/operaciones';
import { opsQuitarDiapositiva } from '@/lib/edicion/plantillas';
import { opsVolverAPoner } from '@/lib/edicion/portapapeles';
import { TOPES, validarOperaciones, validarPresentacion } from '@/lib/edicion/validar';
import type { Presentacion } from '@/lib/tipos';
import { muestra } from './muestra';

/** Aplica las operaciones y devuelve también cómo deshacerlas. */
function hacer(p: Presentacion, ops: Operacion[]): { p: Presentacion; deshacer: Operacion[] } {
  const deshacer: Operacion[] = [];
  for (const op of ops) {
    deshacer.unshift(...inversa(p, op));
    p = aplicar(p, op);
  }
  return { p, deshacer };
}
const aplicarTodas = (p: Presentacion, ops: Operacion[]) => hacer(p, ops).p;

describe('diapositivas quitadas que quedan guardadas', () => {
  it('al quitarla queda guardada con sus datos, aunque el conjunto se borre', () => {
    const p0 = muestra();
    const ops = opsQuitarDiapositiva(p0, 'benchmarking-vis', '2026-11-17T18:00:00.000Z');
    expect(validarOperaciones(ops).ok).toBe(true);
    const p1 = aplicarTodas(p0, ops);
    expect(p1.diapositivas.some((d) => d.id === 'benchmarking-vis')).toBe(false);
    expect(Object.hasOwn(p1.datos, 'benchmarking-vis')).toBe(false);
    expect(p1.guardadas).toHaveLength(1);
    expect(p1.guardadas![0]).toMatchObject({ quitada: '2026-11-17T18:00:00.000Z', despues: 'saldo-cartera' });
    expect(p1.guardadas![0].conjuntos.map((c) => c.id)).toEqual(['benchmarking-vis']);
    expect(validarPresentacion(p1).ok).toBe(true);
  });

  it('vuelve a ponerla con los mismos ids y sus datos, y sale de la lista', () => {
    const p0 = muestra();
    const p1 = aplicarTodas(p0, opsQuitarDiapositiva(p0, 'benchmarking-vis'));
    const r = opsVolverAPoner(p1, 'benchmarking-vis', 'macro', '2026-10');
    if ('error' in r) throw new Error(r.error);
    expect(r.id).toBe('benchmarking-vis');
    const p2 = aplicarTodas(p1, r.ops);
    expect(p2.diapositivas.map((d) => d.id).indexOf('benchmarking-vis')).toBe(2);
    expect(p2.datos['benchmarking-vis']).toEqual(p0.datos['benchmarking-vis']);
    expect(p2.guardadas).toBeUndefined();
    expect(validarPresentacion(p2).ok).toBe(true);
  });

  it('si el conjunto sigue en uso, la diapositiva vuelve conectada al de ahora', () => {
    const p0 = muestra();
    // Otra diapositiva usa el mismo conjunto: no se borra al quitar.
    const dup = structuredClone(p0.diapositivas.find((d) => d.id === 'tasas-referencia')!);
    dup.id = 'otra'; dup.bloques = dup.bloques.map((b) => ({ ...b, id: `${b.id}-otra` }));
    const p1 = aplicarTodas(p0, [{ op: 'diapositiva.poner', diapositiva: dup, despues: null }]);
    const p2 = aplicarTodas(p1, opsQuitarDiapositiva(p1, 'tasas-referencia'));
    expect(Object.hasOwn(p2.datos, 'tasas-referencia')).toBe(true);
    // Cambian los datos después de quitarla.
    const p3 = aplicarTodas(p2, [{ op: 'datos.nombre', conjunto: 'tasas-referencia', valor: 'Actualizado' }]);
    const r = opsVolverAPoner(p3, 'tasas-referencia', null, '2026-10');
    if ('error' in r) throw new Error(r.error);
    const p4 = aplicarTodas(p3, r.ops);
    expect(p4.datos['tasas-referencia'].nombre).toBe('Actualizado');
    expect(Object.keys(p4.datos)).toHaveLength(Object.keys(p3.datos).length);
  });

  it('si sus ids están ocupados, entra como copia con ids nuevos', () => {
    const p0 = muestra();
    const p1 = aplicarTodas(p0, opsQuitarDiapositiva(p0, 'saldo-pasivos'));
    // Alguien deshizo a mano: la diapositiva volvió por otro lado.
    const p2 = aplicarTodas(p1, [
      { op: 'conjunto.poner', conjunto: p0.datos['saldo-pasivos'] },
      { op: 'diapositiva.poner', diapositiva: p0.diapositivas.find((d) => d.id === 'saldo-pasivos')!, despues: null },
    ]);
    const r = opsVolverAPoner(p2, 'saldo-pasivos', null, '2026-10');
    if ('error' in r) throw new Error(r.error);
    expect(r.id).not.toBe('saldo-pasivos');
    const p3 = aplicarTodas(p2, r.ops);
    expect(p3.diapositivas.filter((d) => d.titulo === p0.diapositivas.find((x) => x.id === 'saldo-pasivos')!.titulo)).toHaveLength(2);
    expect(validarPresentacion(p3).ok).toBe(true);
  });

  it('deshacer el quitar la devuelve y la saca de las guardadas', () => {
    const p0 = muestra();
    const { p: p1, deshacer } = hacer(p0, opsQuitarDiapositiva(p0, 'macro'));
    const p2 = aplicarTodas(p1, deshacer);
    expect(p2.diapositivas.map((d) => d.id)).toEqual(p0.diapositivas.map((d) => d.id));
    expect(p2.guardadas ?? []).toEqual([]);
  });

  it('borrar para siempre la saca de la lista; la lista no pasa del tope', () => {
    let p = muestra();
    p = aplicarTodas(p, opsQuitarDiapositiva(p, 'macro'));
    p = aplicarTodas(p, [{ op: 'guardada.quitar', diapositiva: 'macro' }]);
    expect(p.guardadas).toBeUndefined();

    const base = muestra();
    const llenas = Array.from({ length: TOPES.guardadas }, (_, i) => ({
      diapositiva: { ...structuredClone(base.diapositivas[0]), id: `vieja-${i}` }, conjuntos: [], quitada: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`, despues: null,
    }));
    p = { ...base, guardadas: llenas };
    p = aplicarTodas(p, opsQuitarDiapositiva(p, 'macro'));
    expect(p.guardadas).toHaveLength(TOPES.guardadas);
    expect(p.guardadas![0].diapositiva.id).toBe('macro');
    expect(p.guardadas!.some((g) => g.diapositiva.id === `vieja-${TOPES.guardadas - 1}`)).toBe(false);
  });

  it('colores de bloque y fondo de diapositiva: se ponen, se quitan y se deshacen', () => {
    const p0 = muestra();
    const ops: Operacion[] = [
      { op: 'bloque.colores', bloque: p0.diapositivas[1].bloques[1].id, fondo: '#FFF4E5', texto: '#1A3D7C' },
      { op: 'diapositiva.fondo', diapositiva: 'macro', valor: '#F7F2F5' },
    ];
    expect(validarOperaciones(ops).ok).toBe(true);
    expect(validarOperaciones([{ op: 'diapositiva.fondo', diapositiva: 'macro', valor: 'rojo' }]).ok).toBe(false);
    const { p: p1, deshacer } = hacer(p0, ops);
    expect(p1.diapositivas[1]).toMatchObject({ fondo: '#F7F2F5' });
    expect(p1.diapositivas[1].bloques[1]).toMatchObject({ colorFondo: '#FFF4E5', colorTexto: '#1A3D7C' });
    expect(validarPresentacion(p1).ok).toBe(true);
    expect(aplicarTodas(p1, deshacer)).toEqual(p0);
  });
});
