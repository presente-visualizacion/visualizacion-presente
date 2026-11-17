import type { Presentacion, ResumenPresentacion } from '../tipos';

export function resumir(p: Presentacion): ResumenPresentacion {
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    periodos: p.periodos,
    diapositivas: p.diapositivas.length,
    actualizado: p.actualizado,
  };
}
