import comite from '@/datos/semilla/comite-precios.json';
import type { Presentacion } from '@/lib/tipos';

/** Copia nueva de la presentación de muestra (datos inventados) para cada prueba. */
export function muestra(): Presentacion {
  return structuredClone(comite) as unknown as Presentacion;
}
