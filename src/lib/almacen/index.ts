// Almacén de presentaciones.
//
// Todo el resto de la aplicación lee y guarda presentaciones a través de esta
// interfaz. En la etapa 1 la única implementación es la de muestra (solo
// lectura, desde un archivo del repositorio). En la etapa 2 se agrega la de
// base de datos sin tocar las pantallas.

import type { Presentacion, ResumenPresentacion } from '../tipos';
import { almacenMuestra } from './muestra';

export interface Almacen {
  listar(): Promise<ResumenPresentacion[]>;
  obtener(id: string): Promise<Presentacion | null>;
}

export function obtenerAlmacen(): Almacen {
  return almacenMuestra;
}
