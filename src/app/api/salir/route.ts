// POST /api/salir  (botón "Salir" del inicio)
// Borra la cookie de la clave y lleva a la pantalla de entrada.

import { NextResponse } from 'next/server';
import { NOMBRE_COOKIE } from '@/lib/clave';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const respuesta = NextResponse.redirect(new URL('/entrar', request.url), 303);
  respuesta.cookies.set(NOMBRE_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return respuesta;
}
