import { NextResponse, type NextRequest } from 'next/server';
import { NOMBRE_COOKIE, claveConfigurada, fichaValida, rutaLibre } from '@/lib/clave';

// Antes de cada página o ruta: si hay clave y el navegador no trae una ficha
// válida, a la pantalla de entrada (o un 401 si es la API). Sin clave
// configurada, todo pasa como antes.
export async function proxy(request: NextRequest) {
  const clave = claveConfigurada();
  if (!clave) return NextResponse.next();

  const ruta = request.nextUrl.pathname;
  if (rutaLibre(ruta)) return NextResponse.next();

  if (await fichaValida(request.cookies.get(NOMBRE_COOKIE)?.value, clave)) return NextResponse.next();

  if (ruta.startsWith('/api/')) {
    return NextResponse.json({ error: 'Hace falta la clave para entrar.' }, { status: 401 });
  }

  const entrar = new URL('/entrar', request.url);
  const desde = ruta + request.nextUrl.search;
  if (desde !== '/') entrar.searchParams.set('desde', desde);
  return NextResponse.redirect(entrar);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|icon.png|favicon.ico).*)'],
};
