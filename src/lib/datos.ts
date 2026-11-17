import type { Columna, ConjuntoDatos, Fila, IdPeriodo, PorPeriodo, Presentacion } from './tipos';

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
