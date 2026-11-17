// Presentaciones nuevas desde el inicio: en blanco o como copia de otra.
// Lo usa POST /api/presentaciones. Ver "Crear y eliminar presentaciones" en
// PLAN.md.

import type { IdPeriodo, Presentacion, Tema } from '../tipos';
import { diapositivaNueva } from './plantillas';
import { TOPES } from './validar';

/** Id para el enlace (/p/[id]) a partir del nombre: "Comité Diciembre" → "comite-diciembre". */
export function idDesdeNombre(nombre: string): string {
  const id = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return id || 'presentacion';
}

export function nombreLimpio(nombre: unknown): string | null {
  if (typeof nombre !== 'string') return null;
  const limpio = nombre.replace(/\s+/g, ' ').trim();
  return limpio && limpio.length <= TOPES.nombre ? limpio : null;
}

/** Portada, una diapositiva de contenido vacía y cierre, con un solo mes. */
export function presentacionEnBlanco({ nombre, periodo, tema, ahora = new Date().toISOString() }: {
  nombre: string;
  periodo: IdPeriodo;
  tema: Tema;
  ahora?: string;
}): Presentacion {
  const enUso = new Set<string>();
  const portada = { ...diapositivaNueva('portada', enUso), titulo: nombre };
  enUso.add(portada.id);
  const contenido = diapositivaNueva('contenido', enUso);
  enUso.add(contenido.id);
  const cierre = diapositivaNueva('cierre', enUso);
  return {
    formato: 1,
    id: idDesdeNombre(nombre),
    nombre,
    tema: structuredClone(tema),
    periodos: [periodo],
    diapositivas: [portada, contenido, cierre],
    datos: {},
    actualizado: ahora,
  };
}

/** Copia completa (diapositivas, datos y meses) con otro nombre. */
export function copiaDePresentacion(original: Presentacion, nombre: string, ahora = new Date().toISOString()): Presentacion {
  return { ...structuredClone(original), id: idDesdeNombre(nombre), nombre, actualizado: ahora };
}
