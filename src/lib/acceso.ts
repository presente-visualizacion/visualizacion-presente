// Quién puede editar.
//
// Si hay `CLAVE_EDICION` en Vercel, solo quien entró con la clave (cookie con
// la ficha válida). Sin la variable, cualquiera con el enlace, como al inicio.
// El proxy (src/proxy.ts) ya cierra el sitio entero sin clave; esto es la
// segunda revisión que hacen la ruta de guardado y las páginas antes de
// mostrar "Editar". Ver "Acceso" en PLAN.md.

import { cookies } from 'next/headers';
import { NOMBRE_COOKIE, claveConfigurada, fichaValida } from './clave';

export async function puedeEditar(): Promise<boolean> {
  const clave = claveConfigurada();
  if (!clave) return true;
  const ficha = (await cookies()).get(NOMBRE_COOKIE)?.value;
  return fichaValida(ficha, clave);
}

/** ¿El sitio está protegido con clave? (para mostrar "Salir"). */
export function hayClave(): boolean {
  return claveConfigurada() !== null;
}
