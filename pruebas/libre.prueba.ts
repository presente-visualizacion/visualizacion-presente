// Disposición libre, fondos, líneas de referencia, copiar y pegar
// diapositivas, y la plantilla de Paraguay.

import { describe, expect, it } from 'vitest';
import { ubicacionesDesde, ubicacionesEfectivas, ubicacionNueva } from '@/lib/disposicion';
import { aplicar, inversa, type Operacion } from '@/lib/edicion/operaciones';
import { presentacionParaguay } from '@/lib/edicion/nueva';
import { opsAgregarBloque, opsCambiarDisposicion } from '@/lib/edicion/plantillas';
import { copiarDiapositiva, leerCopia, opsPegarDiapositiva } from '@/lib/edicion/portapapeles';
import { validarOperaciones, validarPresentacion } from '@/lib/edicion/validar';
import type { Bloque, BloqueGrafico, BloqueTexto, Presentacion } from '@/lib/tipos';
import { muestra } from './muestra';

const todas = (p: Presentacion, ops: Operacion[]) => ops.reduce(aplicar, p);
const bloqueDe = (p: Presentacion, id: string) => p.diapositivas.flatMap((d) => d.bloques).find((b) => b.id === id) as Bloque;
const paraguay = () => presentacionParaguay({ nombre: 'Caso Paraguay', periodo: '2026-10', tema: muestra().tema, ahora: '2026-11-17T00:00:00.000Z' });

describe('plantilla de Paraguay', () => {
  it('es válida y usa la disposición libre, fondos y una línea de referencia', () => {
    const p = paraguay();
    const r = validarPresentacion(p);
    expect(r.ok, JSON.stringify(r)).toBe(true);
    const d = p.diapositivas[1];
    expect(d.disposicion).toBe('libre');
    expect(d.bloques.every((b) => b.ubicacion)).toBe(true);
    expect(d.bloques.map((b) => b.fondo).filter(Boolean)).toEqual(['tinte', 'oscuro']);
    expect((bloqueDe(p, 'b-paraguay-car') as BloqueGrafico).referencias).toEqual([{ valor: 12, etiqueta: 'Mínimo 12 %' }]);
  });
});

describe('disposición libre', () => {
  it('valida la ubicación dentro de la cuadrícula de 12 x 8', () => {
    const op = (ubicacion: unknown) => validarOperaciones([{ op: 'bloque.aspecto', bloque: 'b-x', fondo: null, ubicacion }]);
    expect(op({ columna: 1, ancho: 12, fila: 1, alto: 8 }).ok).toBe(true);
    expect(op({ columna: 7, ancho: 7, fila: 1, alto: 1 }).ok).toBe(false);
    expect(op({ columna: 1, ancho: 1, fila: 8, alto: 2 }).ok).toBe(false);
    expect(op({ columna: 0, ancho: 1, fila: 1, alto: 1 }).ok).toBe(false);
    expect(op(null).ok).toBe(true);
    expect(validarOperaciones([{ op: 'bloque.aspecto', bloque: 'b-x', fondo: 'neon', ubicacion: null }]).ok).toBe(false);
  });

  it('bloque.aspecto pone y quita fondo y lugar, y se deshace', () => {
    const p = paraguay();
    const op: Operacion = { op: 'bloque.aspecto', bloque: 'b-paraguay-clientes', fondo: 'recuadro', ubicacion: { columna: 2, ancho: 4, fila: 2, alto: 3 } };
    const vuelta = inversa(p, op);
    const q = aplicar(p, op);
    expect(bloqueDe(q, 'b-paraguay-clientes')).toMatchObject({ fondo: 'recuadro', ubicacion: { columna: 2, ancho: 4, fila: 2, alto: 3 } });
    expect(todas(q, vuelta)).toEqual(p);
    const sinNada = aplicar(p, { op: 'bloque.aspecto', bloque: 'b-paraguay-condiciones', fondo: null, ubicacion: null });
    const b = bloqueDe(sinNada, 'b-paraguay-condiciones');
    expect('fondo' in b || 'ubicacion' in b).toBe(false);
  });

  it('cambiar la configuración del gráfico conserva fondo, lugar y título', () => {
    const p = paraguay();
    const b = bloqueDe(p, 'b-paraguay-car') as BloqueGrafico;
    const { id: _i, tipo: _t, titulo: _ti, nota: _n, fondo: _f, ubicacion: _u, ...valor } = b;
    const q = aplicar(p, { op: 'grafico.config', bloque: b.id, valor: { ...valor, etiquetas: false } });
    expect(bloqueDe(q, b.id)).toMatchObject({ ubicacion: b.ubicacion, titulo: b.titulo, nota: b.nota, etiquetas: false });
  });

  it('al pasar a libre, cada bloque recibe el lugar que ya tenía', () => {
    expect(ubicacionesDesde('columnas', [{} as Bloque, {} as Bloque, {} as Bloque])).toEqual([
      { columna: 1, ancho: 4, fila: 1, alto: 8 }, { columna: 5, ancho: 4, fila: 1, alto: 8 }, { columna: 9, ancho: 4, fila: 1, alto: 8 },
    ]);
    expect(ubicacionesDesde('principal-lateral', [{} as Bloque, {} as Bloque, {} as Bloque])).toEqual([
      { columna: 1, ancho: 8, fila: 1, alto: 8 }, { columna: 9, ancho: 4, fila: 1, alto: 4 }, { columna: 9, ancho: 4, fila: 5, alto: 4 },
    ]);
    expect(ubicacionesDesde('cuadricula', Array(3).fill({}) as Bloque[])).toEqual([
      { columna: 1, ancho: 6, fila: 1, alto: 4 }, { columna: 7, ancho: 6, fila: 1, alto: 4 }, { columna: 1, ancho: 6, fila: 5, alto: 4 },
    ]);
    const p = muestra();
    const d = p.diapositivas.find((x) => x.bloques.length > 1)!;
    const q = todas(p, opsCambiarDisposicion(d, 'libre'));
    const nueva = q.diapositivas.find((x) => x.id === d.id)!;
    expect(nueva.disposicion).toBe('libre');
    expect(nueva.bloques.every((b) => b.ubicacion)).toBe(true);
    expect(validarPresentacion(q).ok).toBe(true);
  });

  it('sin ubicación, los bloques van debajo de los demás; un bloque nuevo va al primer lugar libre', () => {
    const fijo = { ubicacion: { columna: 1, ancho: 12, fila: 1, alto: 3 } } as Bloque;
    expect(ubicacionesEfectivas([fijo, {} as Bloque])[1]).toEqual({ columna: 1, ancho: 12, fila: 4, alto: 2 });
    expect(ubicacionNueva([fijo])).toEqual({ columna: 1, ancho: 6, fila: 4, alto: 3 });
    const p = paraguay();
    const r = opsAgregarBloque(p, 'd-paraguay', 'texto')!;
    expect(r.bloque.ubicacion).toEqual({ columna: 1, ancho: 12, fila: 8, alto: 1 });
    expect(validarPresentacion(todas(p, r.ops)).ok).toBe(true);
  });
});

describe('copiar y pegar diapositivas', () => {
  it('pega en otra presentación con datos e ids nuevos', () => {
    const origen = paraguay();
    const copia = copiarDiapositiva(origen, 'd-paraguay', '2026-10')!;
    expect(leerCopia(JSON.parse(JSON.stringify(copia)))).toEqual(copia);
    expect(copia.conjuntos.map((c) => c.id).sort()).toEqual(['c-paraguay-car', 'c-paraguay-clientes']);

    const destino = muestra();
    const despues = destino.diapositivas[1].id;
    const r = opsPegarDiapositiva(destino, copia, despues, destino.periodos.at(-1)!);
    if ('error' in r) throw new Error(r.error);
    expect(validarOperaciones(r.ops).ok).toBe(true);
    const q = todas(destino, r.ops);
    expect(validarPresentacion(q).ok).toBe(true);
    expect(q.diapositivas[2].id).toBe(r.id);
    const pegada = q.diapositivas[2];
    expect(pegada.titulo).toBe('Paraguay: la intervención de Ueno Bank');
    for (const b of pegada.bloques) {
      expect(b.id.startsWith('b-paraguay')).toBe(false);
      if (b.tipo === 'grafico') expect(q.datos[b.datos].filas?.length).toBeGreaterThan(0);
    }
    expect(r.avisos).toEqual([]);
    // La original no cambia.
    expect(origen.diapositivas[1].bloques[0].id).toBe('b-paraguay-clientes');
  });

  it('pegar dos veces en la misma presentación no repite ids', () => {
    const p = paraguay();
    const copia = copiarDiapositiva(p, 'd-paraguay', '2026-10')!;
    const r1 = opsPegarDiapositiva(p, copia, 'd-paraguay', '2026-10');
    if ('error' in r1) throw new Error(r1.error);
    const q = todas(p, r1.ops);
    const r2 = opsPegarDiapositiva(q, copia, 'd-paraguay', '2026-10');
    if ('error' in r2) throw new Error(r2.error);
    const z = todas(q, r2.ops);
    expect(validarPresentacion(z).ok).toBe(true);
    const ids = z.diapositivas.flatMap((d) => [d.id, ...d.bloques.map((b) => b.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lo que cambia por mes se lleva a los meses del destino', () => {
    const p = paraguay();
    // El texto de condiciones pasa a ser propio de cada mes en la original.
    const q = aplicar(p, { op: 'porPeriodo', destino: { bloque: 'b-paraguay-condiciones' }, valor: true, periodo: '2026-10' });
    const copia = copiarDiapositiva(q, 'd-paraguay', '2026-10')!;
    const destino = { ...muestra() };
    const mes = destino.periodos.includes('2026-10') ? '2026-11' : destino.periodos.at(-1)!;
    const sinOctubre: Presentacion = { ...destino, periodos: destino.periodos.filter((m) => m !== '2026-10') };
    const r = opsPegarDiapositiva(sinOctubre, copia, null, mes);
    if ('error' in r) throw new Error(r.error);
    const z = todas(sinOctubre, r.ops);
    const texto = z.diapositivas[0].bloques.find((b) => b.tipo === 'texto' && b.fondo === 'tinte') as BloqueTexto;
    expect(texto.contenido.porPeriodo).toBe(true);
    expect(Object.keys(texto.contenido.valores ?? {})).toEqual([mes]);
    expect(r.avisos.length).toBe(1);
  });
});
