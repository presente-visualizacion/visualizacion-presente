// La disposición "libre": cada bloque ocupa un rectángulo de una cuadrícula de
// 12 columnas y hasta 8 filas. Ver "Disposición libre" en PLAN.md.

import { COLUMNAS_LIBRE, FILAS_LIBRE } from './edicion/validar';
import type { Bloque, Disposicion, Ubicacion } from './tipos';

export { COLUMNAS_LIBRE, FILAS_LIBRE };

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
    const alto = Math.max(1, Math.min(2, FILAS_LIBRE - fila + 1));
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
      return [{ columna: 1, ancho: 8, fila: 1, alto: FILAS_LIBRE }, ...apilados(n - 1, 9, 4)];
    }
    case 'cuadricula': {
      const filas = Math.ceil(n / 2);
      const altos = filas <= FILAS_LIBRE ? repartir(FILAS_LIBRE, filas) : Array(filas).fill(1);
      const inicio = altos.map((_, i) => 1 + altos.slice(0, i).reduce((a, b) => a + b, 0));
      return bloques.map((_, i) => {
        const f = Math.floor(i / 2);
        return { columna: i % 2 === 0 ? 1 : 7, ancho: 6, fila: Math.min(inicio[f] ?? FILAS_LIBRE, FILAS_LIBRE), alto: altos[f] ?? 1 };
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
    ancho: Math.min(Math.max(1, Math.round(u.ancho)), COLUMNAS_LIBRE - columna + 1),
    alto: Math.min(Math.max(1, Math.round(u.alto)), FILAS_LIBRE - fila + 1),
  };
}

/** Lugar para un bloque nuevo en una diapositiva libre: debajo de todo, a lo ancho, si hay filas. */
export function ubicacionNueva(bloques: Bloque[]): Ubicacion {
  const usadas = ubicacionesEfectivas(bloques);
  const fila = Math.min(usadas.length ? Math.max(...usadas.map((u) => u.fila + u.alto)) : 1, FILAS_LIBRE);
  return { columna: 1, ancho: COLUMNAS_LIBRE, fila, alto: Math.max(1, Math.min(2, FILAS_LIBRE - fila + 1)) };
}
