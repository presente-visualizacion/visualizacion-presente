import { describe, expect, it } from 'vitest';
import { hacerLugar, lugarLibre, ubicacionArrastrada } from '@/lib/disposicion';
import { presentacionLeyRescate } from '@/lib/edicion/nueva';
import { aplicar, inversa, type Operacion } from '@/lib/edicion/operaciones';
import { lugaresLibres, opsInsertarBloque, opsUbicarBloque } from '@/lib/edicion/plantillas';
import { validarOperaciones, validarPresentacion } from '@/lib/edicion/validar';
import { fuenteCss, FUENTES } from '@/lib/fuentes';
import type { Presentacion } from '@/lib/tipos';
import { muestra } from './muestra';

const aplicarTodas = (p: Presentacion, ops: Operacion[]) => ops.reduce(aplicar, p);
function hacer(p: Presentacion, ops: Operacion[]) {
  const deshacer: Operacion[] = [];
  for (const op of ops) { deshacer.unshift(...inversa(p, op)); p = aplicar(p, op); }
  return { p, deshacer };
}

describe('plantilla de la Ley de Rescate', () => {
  it('es una presentación válida con la diapositiva en disposición libre', () => {
    const p = presentacionLeyRescate({ nombre: 'Ley de Rescate', periodo: '2026-11', tema: muestra().tema, ahora: '2026-11-18T12:00:00.000Z' });
    expect(validarPresentacion(p).ok).toBe(true);
    const d = p.diapositivas[1];
    expect(d.disposicion).toBe('libre');
    expect(d.bloques.map((b) => b.tipo)).toEqual(['texto', 'cifras', 'grafico', 'texto', 'texto']);
    // Nada se pisa.
    const u = lugaresLibres(d);
    for (let i = 0; i < u.length; i++) for (let j = i + 1; j < u.length; j++) {
      const a = u[i], b = u[j];
      const cruzan = a.columna < b.columna + b.ancho && b.columna < a.columna + a.ancho && a.fila < b.fila + b.alto && b.fila < a.fila + a.alto;
      expect(cruzan, `${d.bloques[i].id} y ${d.bloques[j].id}`).toBe(false);
    }
  });
});

describe('ocultar diapositivas y tipos de letra', () => {
  it('ocultar y mostrar se guarda, valida y deshace', () => {
    const p0 = muestra();
    const { p: p1, deshacer } = hacer(p0, [{ op: 'diapositiva.oculta', diapositiva: 'macro', valor: true }]);
    expect(p1.diapositivas[1].oculta).toBe(true);
    expect(validarPresentacion(p1).ok).toBe(true);
    expect(aplicarTodas(p1, deshacer)).toEqual(p0);
    expect(aplicar(p1, { op: 'diapositiva.oculta', diapositiva: 'macro', valor: false }).diapositivas[1]).not.toHaveProperty('oculta');
  });

  it('letra de la presentación y de un bloque: solo las de la lista', () => {
    const p0 = muestra();
    const bloque = p0.diapositivas[1].bloques[0].id;
    expect(validarOperaciones([{ op: 'bloque.letra', bloque, valor: 'montserrat' }]).ok).toBe(true);
    expect(validarOperaciones([{ op: 'bloque.letra', bloque, valor: 'comic-sans' }]).ok).toBe(false);
    const { p: p1, deshacer } = hacer(p0, [
      { op: 'bloque.letra', bloque, valor: 'lora' },
      { op: 'tema', valor: { ...p0.tema, fuente: 'inter' } },
    ]);
    expect(p1.diapositivas[1].bloques[0].fuente).toBe('lora');
    expect(validarPresentacion(p1).ok).toBe(true);
    expect(validarPresentacion({ ...p1, tema: { ...p1.tema, fuente: 'otra' } }).ok).toBe(false);
    expect(aplicarTodas(p1, deshacer)).toEqual(p0);
  });

  it('Figtree va por defecto y cada letra tiene su familia', () => {
    expect(fuenteCss(undefined)).toContain('Figtree');
    expect(fuenteCss('no-existe')).toContain('Figtree');
    expect(new Set(FUENTES.map((f) => f.clave)).size).toBe(FUENTES.length);
    expect(fuenteCss('playfair')).toContain('Playfair Display');
  });
});

describe('mover e insertar bloques en la diapositiva', () => {
  it('arrastrar respeta los bordes de la cuadrícula', () => {
    const u = { columna: 3, ancho: 4, fila: 2, alto: 3 };
    expect(ubicacionArrastrada(u, 20, 20, null)).toEqual({ columna: 9, ancho: 4, fila: 6, alto: 3 });
    expect(ubicacionArrastrada(u, -9, -9, null)).toEqual({ columna: 1, ancho: 4, fila: 1, alto: 3 });
    // Tirar del borde derecho y de abajo.
    expect(ubicacionArrastrada(u, 2, 1, { izq: false, der: true, arr: false, aba: true })).toEqual({ columna: 3, ancho: 6, fila: 2, alto: 4 });
    // Del izquierdo: no puede quedar en cero.
    expect(ubicacionArrastrada(u, 10, 0, { izq: true, der: false, arr: false, aba: false })).toEqual({ columna: 6, ancho: 1, fila: 2, alto: 3 });
    expect(ubicacionArrastrada(u, -5, -5, { izq: true, der: false, arr: true, aba: false })).toEqual({ columna: 1, ancho: 6, fila: 1, alto: 4 });
  });

  it('busca un lugar libre y, si no hay, hace lugar abajo', () => {
    expect(lugarLibre([])).toEqual({ columna: 1, ancho: 6, fila: 1, alto: 3 });
    expect(lugarLibre([{ columna: 1, ancho: 12, fila: 1, alto: 8 }])).toBeNull();
    const r = hacerLugar([{ id: 'a', ubicacion: { columna: 1, ancho: 6, fila: 1, alto: 8 } }, { id: 'b', ubicacion: { columna: 7, ancho: 6, fila: 1, alto: 8 } }]);
    expect(r.ubicacion).toEqual({ columna: 1, ancho: 12, fila: 7, alto: 2 });
    expect(r.cambios).toEqual([
      { id: 'a', ubicacion: { columna: 1, ancho: 6, fila: 1, alto: 6 } },
      { id: 'b', ubicacion: { columna: 7, ancho: 6, fila: 1, alto: 6 } },
    ]);
  });

  it('mover un bloque de una diapositiva en columnas la pasa a libre sin mover lo demás', () => {
    const p0 = muestra();
    const d = p0.diapositivas.find((x) => (x.disposicion ?? 'una') !== 'libre' && x.bloques.length >= 2)!;
    const antes = lugaresLibres(d);
    const ops = opsUbicarBloque(d, d.bloques[0].id, { columna: 2, ancho: 3, fila: 2, alto: 2 });
    expect(validarOperaciones(ops).ok).toBe(true);
    const p1 = aplicarTodas(p0, ops);
    const d1 = p1.diapositivas.find((x) => x.id === d.id)!;
    expect(d1.disposicion).toBe('libre');
    expect(d1.bloques[0].ubicacion).toEqual({ columna: 2, ancho: 3, fila: 2, alto: 2 });
    expect(d1.bloques[1].ubicacion).toEqual(antes[1]);
    expect(validarPresentacion(p1).ok).toBe(true);
  });

  it('insertar un cuadro de texto hace lugar y queda válido', () => {
    const p0 = muestra();
    const d = p0.diapositivas.find((x) => x.id === 'macro')!;
    const r = opsInsertarBloque(p0, d.id, 'texto')!;
    expect(validarOperaciones(r.ops).ok).toBe(true);
    const p1 = aplicarTodas(p0, r.ops);
    const d1 = p1.diapositivas.find((x) => x.id === d.id)!;
    expect(d1.disposicion).toBe('libre');
    expect(d1.bloques).toHaveLength(d.bloques.length + 1);
    expect(d1.bloques.at(-1)!.ubicacion).toEqual(r.bloque.ubicacion);
    expect(validarPresentacion(p1).ok).toBe(true);
    const g = opsInsertarBloque(p1, d.id, 'grafico')!;
    expect(validarPresentacion(aplicarTodas(p1, g.ops)).ok).toBe(true);
  });
});
