import type { IdPeriodo } from './tipos';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function partes(id: IdPeriodo): { anio: number; mes: number } {
  const [anio, mes] = id.split('-').map(Number);
  return { anio, mes };
}

/** "2026-09" -> "Septiembre 2026" */
export function nombrePeriodo(id: IdPeriodo): string {
  const { anio, mes } = partes(id);
  return `${MESES[mes - 1] ?? id} ${anio}`;
}

/** "2026-09" -> "Sep" */
export function nombreCorto(id: IdPeriodo): string {
  return (MESES[partes(id).mes - 1] ?? id).slice(0, 3);
}

/** Agrupa los períodos por año conservando el orden. */
export function porAnio(periodos: IdPeriodo[]): { anio: number; periodos: IdPeriodo[] }[] {
  const grupos: { anio: number; periodos: IdPeriodo[] }[] = [];
  for (const p of periodos) {
    const { anio } = partes(p);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.anio === anio) ultimo.periodos.push(p);
    else grupos.push({ anio, periodos: [p] });
  }
  return grupos;
}

/** Reemplaza {mes} por el nombre del período seleccionado. */
export function conMes(texto: string, periodo: IdPeriodo): string {
  return texto.replaceAll('{mes}', nombrePeriodo(periodo));
}

/**
 * Mes del que conviene copiar cuando `periodo` está vacío: el más cercano
 * hacia atrás que tenga contenido o, si no hay, el más cercano hacia adelante.
 */
export function mesParaCopiar(periodos: IdPeriodo[], periodo: IdPeriodo, tiene: (p: IdPeriodo) => boolean): IdPeriodo | null {
  const anteriores = periodos.filter((p) => p < periodo && tiene(p));
  if (anteriores.length) return anteriores[anteriores.length - 1];
  return periodos.find((p) => p > periodo && tiene(p)) ?? null;
}

/** El mes anterior a `periodo` en la lista, o null si es el primero. */
export function mesAnterior(periodos: IdPeriodo[], periodo: IdPeriodo): IdPeriodo | null {
  const i = periodos.indexOf(periodo);
  return i > 0 ? periodos[i - 1] : null;
}
