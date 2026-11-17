import type { Presentacion } from '../tipos';
import type { Almacen } from './index';
import { resumir } from './resumen';
import comite from '@/datos/semilla/comite-precios.json';

/** Presentación de muestra, con datos inventados. */
export const presentacionMuestra = comite as unknown as Presentacion;

const presentaciones: Presentacion[] = [presentacionMuestra];

/** Almacén de solo lectura: se usa en producción mientras no haya base de datos. */
export const almacenMuestra: Almacen = {
  soloLectura: true,
  async listar() {
    return presentaciones.map(resumir);
  },
  async obtener(id) {
    const presentacion = presentaciones.find((p) => p.id === id);
    return presentacion ? { presentacion, revision: 1 } : null;
  },
  async revision(id) {
    return presentaciones.some((p) => p.id === id) ? 1 : null;
  },
  async aplicar() {
    throw new Error('El almacén de muestra es de solo lectura.');
  },
  async crear() {
    throw new Error('El almacén de muestra es de solo lectura.');
  },
};
