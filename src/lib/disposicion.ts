// La disposición "libre": cada bloque ocupa un rectángulo de una cuadrícula de
// 48 columnas y 32 filas (la "fina", desde el 2026-11-19; antes 12 x 8, ver
// rejilla.ts). Ver "Disposición libre" y "Cuadrícula fina" en PLAN.md.

import { COLUMNAS_LIBRE, FILAS_LIBRE } from './edicion/validar';
import type { Bloque, Disposicion, Ubicacion } from './tipos';

export { COLUMNAS_LIBRE, FILAS_LIBRE };

/** Una casilla de la cuadrícula vieja de 12 x 8, en casillas finas: las medidas de abajo se piensan en esas. */
const C = COLUMNAS_LIBRE / 12;
const F = FILAS_LIBRE / 8;

/**
 * Lo mínimo que puede medir un bloque, en casillas finas (2026-11-19: antes
 * 3 x 3). Dos filas dejan lugar a una línea de texto chico.
 */
export const MIN_ANCHO = 2;
export const MIN_ALTO = 2;

/** Reparte `total` en `partes` enteros que suman `total` (los primeros, uno más). */
function repartir(total: number, partes: number): number[] {
  const base = Math.floor(total / partes);
  const sobra = total - base * partes;
  return Array.from({ length: partes }, (_, i) => Math.max(1, base + (i < sobra ? 1 : 0)));
}

/** Uno debajo del otro, a lo ancho de `columna`..`columna+ancho-1`, entre las filas `desde` y la 8. */
function apilados(n: number, columna: number, ancho: number, desde = 1): Ubicacion[] {
  if (n === 0) return [];
  const disponibles = FILAS_LIBRE - desde + 1;
  if (n > disponibles) {
    // No caben: cada uno en una fila; los que sobran comparten la última.
    return Array.from({ length: n }, (_, i) => ({ columna, ancho, fila: Math.min(desde + i, FILAS_LIBRE), alto: 1 }));

  }
  let fila = desde;
  return repartir(disponibles, n).map((alto) => {
    const u = { columna, ancho, fila, alto };
    fila += alto;
    return u;
  });
}

/**
 * Lo que ocupa cada bloque con la disposición libre. Los que no tienen
 * ubicación van debajo de todo, a lo ancho.
 */
export function ubicacionesEfectivas(bloques: Bloque[]): Ubicacion[] {
  const fijas = bloques.map((b) => b.ubicacion).filter((u): u is Ubicacion => Boolean(u));
  let libre = fijas.length ? Math.max(...fijas.map((u) => u.fila + u.alto)) : 1;
  return bloques.map((b) => {
    if (b.ubicacion) return b.ubicacion;
    const fila = Math.min(libre, FILAS_LIBRE);
    const alto = Math.max(1, Math.min(2 * F, FILAS_LIBRE - fila + 1));
    libre = fila + alto;
    return { columna: 1, ancho: COLUMNAS_LIBRE, fila, alto };
  });
}

/** Cuántas filas usa la cuadrícula (la última fila ocupada). */
export function filasUsadas(ubicaciones: Ubicacion[]): number {
  return Math.max(1, ...ubicaciones.map((u) => u.fila + u.alto - 1));
}

/**
 * Al pasar a "libre", lo que ya se veía: cada disposición traducida a
 * rectángulos de la cuadrícula.
 */
export function ubicacionesDesde(disposicion: Disposicion, bloques: Bloque[]): Ubicacion[] {
  const n = bloques.length;
  if (n === 0) return [];
  switch (disposicion) {
    case 'libre':
      return ubicacionesEfectivas(bloques);
    case 'columnas': {
      let columna = 1;
      const anchos = n <= COLUMNAS_LIBRE ? repartir(COLUMNAS_LIBRE, n) : Array(n).fill(1);
      return anchos.map((ancho) => {
        const u = { columna: Math.min(columna, COLUMNAS_LIBRE), ancho, fila: 1, alto: FILAS_LIBRE };
        columna += ancho;
        return u;
      });
    }
    case 'principal-lateral': {
      if (n === 1) return [{ columna: 1, ancho: COLUMNAS_LIBRE, fila: 1, alto: FILAS_LIBRE }];
      return [{ columna: 1, ancho: 8 * C, fila: 1, alto: FILAS_LIBRE }, ...apilados(n - 1, 8 * C + 1, 4 * C)];
    }
    case 'cuadricula': {
      const filas = Math.ceil(n / 2);
      const altos = filas <= FILAS_LIBRE ? repartir(FILAS_LIBRE, filas) : Array(filas).fill(1);
      const inicio = altos.map((_, i) => 1 + altos.slice(0, i).reduce((a, b) => a + b, 0));
      return bloques.map((_, i) => {
        const f = Math.floor(i / 2);
        return { columna: i % 2 === 0 ? 1 : 6 * C + 1, ancho: 6 * C, fila: Math.min(inicio[f] ?? FILAS_LIBRE, FILAS_LIBRE), alto: altos[f] ?? 1 };
      });
    }
    default:
      // 'una' con un solo bloque, o 'filas'.
      return apilados(n, 1, COLUMNAS_LIBRE);
  }
}

/** Un rectángulo que cabe en la cuadrícula (recorta lo que se salga). */
export function ajustarUbicacion(u: Ubicacion): Ubicacion {
  const columna = Math.min(Math.max(1, Math.round(u.columna)), COLUMNAS_LIBRE);
  const fila = Math.min(Math.max(1, Math.round(u.fila)), FILAS_LIBRE);
  return {
    columna,
    fila,
    ancho: Math.min(Math.max(MIN_ANCHO, Math.round(u.ancho)), COLUMNAS_LIBRE - columna + 1),
    alto: Math.min(Math.max(MIN_ALTO, Math.round(u.alto)), FILAS_LIBRE - fila + 1),
  };
}

/** Lugar para un bloque nuevo en una diapositiva libre: debajo de todo, a lo ancho, si hay filas. */
export function ubicacionNueva(bloques: Bloque[]): Ubicacion {
  const usadas = ubicacionesEfectivas(bloques);
  const libre = lugarLibre(usadas);
  if (libre) return libre;
  // Sin lugar libre: abajo de todo, encima de lo que haya, para moverlo.
  return { columna: 1, ancho: COLUMNAS_LIBRE, fila: FILAS_LIBRE - 2 * F + 1, alto: 2 * F };
}

function seCruzan(a: Ubicacion, b: Ubicacion): boolean {
  return a.columna < b.columna + b.ancho && b.columna < a.columna + a.ancho && a.fila < b.fila + b.alto && b.fila < a.fila + a.alto;
}

/**
 * El primer rectángulo libre (sin pisar ningún bloque), probando de mayor a
 * menor tamaño y de arriba hacia abajo. null si no queda lugar.
 */
export function lugarLibre(ocupados: Ubicacion[]): Ubicacion | null {
  // En casillas viejas (12 x 8), de mayor a menor; se buscan en pasos finos.
  const tamanos = ([[6, 3], [6, 2], [4, 3], [4, 2], [3, 2], [12, 1], [6, 1], [3, 1], [2, 1]] as const).map(([a, h]) => [a * C, h * F] as const);
  for (const [ancho, alto] of tamanos) {
    for (let fila = 1; fila + alto - 1 <= FILAS_LIBRE; fila++) {
      for (let columna = 1; columna + ancho - 1 <= COLUMNAS_LIBRE; columna++) {
        const u = { columna, ancho, fila, alto };
        if (!ocupados.some((o) => seCruzan(o, u))) return u;
      }
    }
  }
  return null;
}

/**
 * Lugar para un bloque nuevo en una diapositiva libre. Si no hay espacio
 * libre, achica lo que llega hasta abajo para dejar las 2 últimas filas
 * (`cambios`); si ni así, el bloque va encima, al centro, para moverlo.
 */
export function hacerLugar(ocupados: { id: string; ubicacion: Ubicacion }[]): { ubicacion: Ubicacion; cambios: { id: string; ubicacion: Ubicacion }[] } {
  const libre = lugarLibre(ocupados.map((o) => o.ubicacion));
  if (libre) return { ubicacion: libre, cambios: [] };
  const alto = 2 * F;
  const tope = FILAS_LIBRE - alto;
  const cambios: { id: string; ubicacion: Ubicacion }[] = [];
  for (const o of ocupados) {
    const u = o.ubicacion;
    if (u.fila + u.alto - 1 <= tope) continue;
    if (u.fila > tope) return { ubicacion: { columna: 3 * C + 1, ancho: 6 * C, fila: 2 * F + 1, alto: 3 * F }, cambios: [] };
    cambios.push({ id: o.id, ubicacion: { ...u, alto: tope - u.fila + 1 } });
  }
  return { ubicacion: { columna: 1, ancho: COLUMNAS_LIBRE, fila: tope + 1, alto }, cambios };
}

/** Bordes de los que se tira para cambiar el tamaño (null: se mueve entero). */
export interface Bordes { izq: boolean; der: boolean; arr: boolean; aba: boolean }

const limitar = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** La ubicación después de correr `dc` columnas y `df` filas, moviendo o tirando de los bordes. */
export function ubicacionArrastrada(u: Ubicacion, dc: number, df: number, bordes: Bordes | null): Ubicacion {
  if (!bordes) {
    return {
      ...u,
      columna: limitar(u.columna + dc, 1, COLUMNAS_LIBRE - u.ancho + 1),
      fila: limitar(u.fila + df, 1, FILAS_LIBRE - u.alto + 1),
    };
  }
  let { columna, ancho, fila, alto } = u;
  // No más chico que el mínimo (salvo que ya lo fuera).
  const minAncho = Math.min(MIN_ANCHO, u.ancho);
  const minAlto = Math.min(MIN_ALTO, u.alto);
  if (bordes.der) ancho = limitar(u.ancho + dc, minAncho, COLUMNAS_LIBRE - u.columna + 1);
  if (bordes.izq) {
    columna = limitar(u.columna + dc, 1, u.columna + u.ancho - minAncho);
    ancho = u.ancho - (columna - u.columna);
  }
  if (bordes.aba) alto = limitar(u.alto + df, minAlto, FILAS_LIBRE - u.fila + 1);
  if (bordes.arr) {
    fila = limitar(u.fila + df, 1, u.fila + u.alto - minAlto);
    alto = u.alto - (fila - u.fila);
  }
  return { columna, ancho, fila, alto };
}

