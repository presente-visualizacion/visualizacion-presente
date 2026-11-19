// "Dejar en blanco": borra las cifras (o el texto) de un mes sin quitar la
// estructura, para volver a llenarlo. Ver "Dejar en blanco" en PLAN.md.
//
// - Datos: quedan las filas y las columnas de texto (nombres de entidades,
//   fechas escritas); las columnas de números quedan vacías.
// - Cifras escritas a mano: queda la etiqueta, el valor y el detalle quedan
//   vacíos. Las que salen de los datos no se tocan (se vacían con sus datos).
// - Texto: queda vacío. Tarjetas: quedan los títulos, sin texto.

import { filasDe, valorDe } from '../datos';
import type { Bloque, Cifra, ConjuntoDatos, Fila, IdPeriodo, Presentacion, Tarjeta } from '../tipos';
import type { Operacion } from './operaciones';

export function filasEnBlanco(conjunto: ConjuntoDatos, filas: Fila[]): Fila[] {
  const numericas = conjunto.columnas.filter((c) => c.tipo !== 'texto').map((c) => c.clave);
  return filas.map((f) => ({ ...f, ...Object.fromEntries(numericas.map((k) => [k, null])) }));
}

const cifrasEnBlanco = (cifras: Cifra[]): Cifra[] => cifras.map((c) => (c.desde ? c : { ...c, valor: '', ...(c.detalle !== undefined ? { detalle: '' } : {}) }));
const tarjetasEnBlanco = (tarjetas: Tarjeta[]): Tarjeta[] => tarjetas.map((t) => ({ ...t, texto: '' }));

/** Vacía los números de un conjunto en ese mes (o en todos, si es igual en todos). */
export function opsVaciarConjunto(p: Presentacion, conjuntoId: string, periodo: IdPeriodo): Operacion[] {
  const c = Object.hasOwn(p.datos, conjuntoId) ? p.datos[conjuntoId] : undefined;
  const filas = c && filasDe(c, periodo);
  if (!c || !filas?.length) return [];
  return [{ op: 'datos.filas', conjunto: c.id, periodo: c.porPeriodo ? periodo : null, valor: filasEnBlanco(c, filas) }];
}

/** Lo que deja en blanco el bloque en ese mes. Gráficos y tablas: sus datos. */
export function opsVaciarBloque(p: Presentacion, bloque: Bloque, periodo: IdPeriodo): Operacion[] {
  switch (bloque.tipo) {
    case 'texto': {
      const v = valorDe(bloque.contenido, periodo);
      return v ? [{ op: 'texto.contenido', bloque: bloque.id, periodo: bloque.contenido.porPeriodo ? periodo : null, valor: '' }] : [];
    }
    case 'cifras': {
      const v = valorDe(bloque.cifras, periodo);
      return v?.length ? [{ op: 'cifras.valor', bloque: bloque.id, periodo: bloque.cifras.porPeriodo ? periodo : null, valor: cifrasEnBlanco(v) }] : [];
    }
    case 'tarjetas': {
      const v = valorDe(bloque.tarjetas, periodo);
      return v?.length ? [{ op: 'tarjetas.valor', bloque: bloque.id, periodo: bloque.tarjetas.porPeriodo ? periodo : null, valor: tarjetasEnBlanco(v) }] : [];
    }
    default:
      return opsVaciarConjunto(p, bloque.datos, periodo);
  }
}

/**
 * Deja en blanco las cifras de todo un mes: los números de los datos propios
 * de cada mes y las cifras escritas a mano propias de cada mes. Lo que es
 * igual en todos los meses y los textos no se tocan.
 */
export function opsVaciarMes(p: Presentacion, periodo: IdPeriodo): Operacion[] {
  const ops: Operacion[] = [];
  for (const c of Object.values(p.datos)) if (c.porPeriodo) ops.push(...opsVaciarConjunto(p, c.id, periodo));
  for (const d of p.diapositivas) {
    for (const b of d.bloques) if (b.tipo === 'cifras' && b.cifras.porPeriodo) ops.push(...opsVaciarBloque(p, b, periodo));
  }
  return ops;
}
