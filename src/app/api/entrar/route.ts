// POST /api/entrar  (formulario de /entrar: campos "clave" y "desde")
// Si la clave es la de CLAVE_EDICION, pone la cookie con la ficha y vuelve a
// "desde". Si no, espera un segundo y vuelve a /entrar con el aviso.

import { NextResponse } from 'next/server';
import { DURACION_SEGUNDOS, NOMBRE_COOKIE, claveConfigurada, claveCorrecta, destinoSeguro, fichaDe } from '@/lib/clave';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  const clave = claveConfigurada();
  if (!clave) return NextResponse.redirect(new URL('/', request.url), 303);

  let escrita = '';
  let desde = '/';
  try {
    const form = await request.formData();
    escrita = String(form.get('clave') ?? '').slice(0, 500);
    desde = destinoSeguro(form.get('desde'));
  } catch {
    // Envío que no es un formulario: se trata como clave vacía.
  }

  if (!escrita || !(await claveCorrecta(escrita, clave))) {
    await espera(1000); // frena a quien pruebe claves al azar
    const volver = new URL('/entrar', request.url);
    volver.searchParams.set('error', '1');
    if (desde !== '/') volver.searchParams.set('desde', desde);
    return NextResponse.redirect(volver, 303);
  }

  const respuesta = NextResponse.redirect(new URL(desde, request.url), 303);
  respuesta.cookies.set(NOMBRE_COOKIE, await fichaDe(clave), {
    httpOnly: true,
    secure: new URL(request.url).protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACION_SEGUNDOS,
  });
  return respuesta;
}
