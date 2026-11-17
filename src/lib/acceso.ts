// Quién puede editar.
//
// Hoy edita cualquiera que tenga el enlace (lo acordado con la usuaria). Este
// es el único lugar que lo decide: lo consultan la ruta de guardado y la
// página del visor (para mostrar o no el botón "Editar").
//
// Para poner una clave más adelante: variable `CLAVE_EDICION` en Vercel, una
// pantalla que la pida y la guarde en una cookie, y aquí comparar esa cookie
// (con `cookies()` de `next/headers`, que sirve en páginas y en rutas). No hay
// que tocar nada más. Ver "Acceso" en PLAN.md.

export async function puedeEditar(): Promise<boolean> {
  return true;
}
