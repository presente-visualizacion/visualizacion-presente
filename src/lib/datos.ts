import { formatear } from './formato';
import type { Cifra, Columna, ConjuntoDatos, Fila, IdPeriodo, PorPeriodo, Presentacion, SelectorFila } from './tipos';

/** Filas del conjunto para el mes pedido. null si ese mes no tiene datos. */
export function filasDe(conjunto: ConjuntoDatos | undefined, periodo: IdPeriodo): Fila[] | null {
  if (!conjunto) return null;
  if (!conjunto.porPeriodo) return conjunto.filas ?? null;
  return conjunto.filasPorPeriodo?.[periodo] ?? null;
}

/** Valor para el mes pedido. undefined si ese mes no tiene valor. */
export function valorDe<T>(dato: PorPeriodo<T>, periodo: IdPeriodo): T | undefined {
  return dato.porPeriodo ? dato.valores?.[periodo] : dato.valor;
}

export function columnaDe(conjunto: ConjuntoDatos | undefined, clave: string): Columna | undefined {
  return conjunto?.columnas.find((c) => c.clave === clave);
}

export function conjuntoDe(presentacion: Presentacion, id: string): ConjuntoDatos | undefined {
  return presentacion.datos[id];
}

/** La fila que nombra el selector, o undefined si no está. */
export function filaSegun(filas: Fila[], selector: SelectorFila): Fila | undefined {
  if (selector === 'primera') return filas[0];
  if (selector === 'ultima') return filas[filas.length - 1];
  const buscado = selector.valor.trim().toLowerCase();
  return filas.find((f) => String(f[selector.columna] ?? '').trim().toLowerCase() === buscado);
}

/** Valor con su unidad ("$2.940.000 millones"). */
export function conUnidad(valor: Fila[string], columna: Columna | undefined): string {
  const texto = formatear(valor, columna);
  return columna?.unidad && typeof valor === 'number' ? `${texto} ${columna.unidad}` : texto;
}

/**
 * Lo que muestra una cifra en el mes pedido. Si sale de los datos, el valor
 * se lee del conjunto; si no se encuentra, queda el valor escrito.
 */
export function resolverCifra(p: Presentacion, cifra: Cifra, periodo: IdPeriodo): { valor: string; unidad?: string; detalle?: string; sinDato?: boolean } {
  const f = cifra.desde;
  if (!f) return { valor: cifra.valor, detalle: cifra.detalle };
  const conjunto = conjuntoDe(p, f.conjunto);
  const filas = filasDe(conjunto, periodo) ?? [];
  const fila = filaSegun(filas, f.fila);
  const columna = columnaDe(conjunto, f.columna);
  const crudo = fila?.[f.columna];
  // Sin dato no hay nada que comparar: queda el valor escrito y sin detalle.
  if (crudo === null || crudo === undefined || crudo === '') return { valor: cifra.valor || '—', sinDato: true };
  const valor = formatear(crudo, columna);
  const unidad = columna?.unidad && typeof crudo === 'number' ? columna.unidad : undefined;

  const partes: string[] = [];
  if (f.comparar && typeof crudo === 'number') {
    const otro = filaSegun(filas, f.comparar)?.[f.columna];
    if (typeof otro === 'number') {
      const diferencia = Math.round((crudo - otro) * 1e6) / 1e6;
      const signo = diferencia > 0 ? '+' : diferencia < 0 ? '−' : '';
      // En puntos porcentuales: los decimales del porcentaje, sin el signo %.
      const absoluta = formatear(Math.abs(diferencia), columna?.tipo === 'porcentaje' ? { ...columna, tipo: 'numero', decimales: columna.decimales ?? 2 } : columna);
      partes.push(`${signo}${absoluta}${columna?.tipo === 'porcentaje' ? ' pp' : ''}`);
    }
  } else if (f.detalle && fila) {
    const d = fila[f.detalle];
    if (d !== null && d !== undefined && d !== '') partes.push(formatear(d, columnaDe(conjunto, f.detalle)));
  }
  if (cifra.detalle) partes.push(cifra.detalle);
  return { valor, ...(unidad ? { unidad } : {}), ...(partes.length ? { detalle: partes.join(' ') } : {}) };
}
