// Paso de la cuadrícula libre de 12 x 8 a la fina de 48 x 32 (2026-11-19).
//
// Las diapositivas con `rejilla: 'fina'` tienen sus ubicaciones en la
// cuadrícula fina. Las que no la tienen y traen ubicaciones son de antes: cada
// casilla vieja pasa a 4 x 4 casillas finas, así todo queda donde estaba. Se
// hace al leer de la base, al validar lo que llega (importar, restaurar) y al
// pegar. Ver "Cuadrícula fina" en PLAN.md.

import type { Diapositiva, DiapositivaGuardada, Presentacion, Ubicacion } from './tipos';

/** Casillas finas por cada casilla de la cuadrícula vieja de 12 x 8. */
export const FACTOR_REJILLA = 4;

export function ubicacionFina(u: Ubicacion): Ubicacion {
  return {
    columna: (u.columna - 1) * FACTOR_REJILLA + 1,
    ancho: u.ancho * FACTOR_REJILLA,
    fila: (u.fila - 1) * FACTOR_REJILLA + 1,
    alto: u.alto * FACTOR_REJILLA,
  };
}

/**
 * La diapositiva con sus ubicaciones en la cuadrícula fina (y marcada). Una
 * sin ubicaciones queda igual: no hay nada que pasar. Al ponerle la primera
 * ubicación se marca con `marcadaFina`.
 */
export function migrarDiapositiva(d: Diapositiva): Diapositiva {
  if (d.rejilla === 'fina') return d;
  if (!d.bloques.some((b) => b.ubicacion)) return d;
  return {
    ...d,
    rejilla: 'fina',
    bloques: d.bloques.map((b) => (b.ubicacion ? { ...b, ubicacion: ubicacionFina(b.ubicacion) } : b)),
  };
}

/** Pasada a la fina y marcada siempre: para cuando se le pone una ubicación nueva. */
export function marcadaFina(d: Diapositiva): Diapositiva {
  const m = migrarDiapositiva(d);
  return m.rejilla === 'fina' ? m : { ...m, rejilla: 'fina' };
}

function migrarGuardada(g: DiapositivaGuardada): DiapositivaGuardada {
  const d = migrarDiapositiva(g.diapositiva);
  return d === g.diapositiva ? g : { ...g, diapositiva: d };
}

/** La presentación con todas sus diapositivas (y las guardadas) en la cuadrícula fina. */
export function migrarPresentacion(p: Presentacion): Presentacion {
  const vieja = (d: Diapositiva) => d.rejilla !== 'fina' && d.bloques.some((b) => b.ubicacion);
  const pendientes = p.diapositivas.some(vieja) || p.guardadas?.some((g) => vieja(g.diapositiva));
  if (!pendientes) return p;
  return {
    ...p,
    diapositivas: p.diapositivas.map(migrarDiapositiva),
    ...(p.guardadas ? { guardadas: p.guardadas.map(migrarGuardada) } : {}),
  };
}
