import type { Presentacion } from '../tipos';
import type { Almacen } from './index';
import { resumir } from './resumen';
import comite from '@/datos/semilla/comite-precios.json';

const presentaciones: Presentacion[] = [comite as unknown as Presentacion];

export const almacenMuestra: Almacen = {
  async listar() {
    return presentaciones.map(resumir);
  },
  async obtener(id) {
    return presentaciones.find((p) => p.id === id) ?? null;
  },
};
