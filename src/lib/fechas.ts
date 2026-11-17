// Fechas y horas para mostrar, siempre en hora de Colombia (el servidor corre
// en UTC y el navegador puede estar en otra zona).

const ZONA = 'America/Bogota';

/** "17 nov 2026, 12:40 p. m." */
export function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { timeZone: ZONA, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** "martes, 17 de noviembre de 2026": para agrupar listas por día. */
export function dia(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { timeZone: ZONA, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** "12:40 p. m." */
export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { timeZone: ZONA, hour: 'numeric', minute: '2-digit' });
}
