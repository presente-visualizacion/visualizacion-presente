// La clave del sitio: lo que comparten la pantalla de entrada, el proxy y
// `puedeEditar`. No usa nada de Next, así se prueba sola.
//
// La clave vive solo en la variable `CLAVE_EDICION` de Vercel. Al entrar bien
// se guarda en el navegador una cookie con una "ficha" sacada de la clave
// (HMAC-SHA256), nunca la clave misma. Si se cambia la clave en Vercel, las
// fichas viejas dejan de servir y todos deben volver a entrar.
//
// Sin `CLAVE_EDICION` (desarrollo local, pruebas) el sitio queda abierto como
// antes.

export const NOMBRE_COOKIE = 'vp_acceso';
export const DURACION_SEGUNDOS = 60 * 60 * 24 * 30; // 30 días

const MENSAJE = 'visualizacion-presente:acceso:v1';

/** La clave configurada en el servidor, o null si no hay. */
export function claveConfigurada(): string | null {
  const clave = process.env.CLAVE_EDICION?.trim();
  return clave ? clave : null;
}

/** La ficha que se guarda en la cookie para una clave. */
export async function fichaDe(clave: string): Promise<string> {
  const llave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(clave),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const firma = await crypto.subtle.sign('HMAC', llave, new TextEncoder().encode(MENSAJE));
  return Array.from(new Uint8Array(firma), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compara dos textos tardando lo mismo sin importar dónde difieren. */
export function iguales(a: string, b: string): boolean {
  const largo = Math.max(a.length, b.length);
  let distinto = a.length ^ b.length;
  for (let i = 0; i < largo; i++) distinto |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return distinto === 0;
}

/** ¿La ficha de la cookie corresponde a la clave? */
export async function fichaValida(ficha: string | undefined, clave: string): Promise<boolean> {
  if (!ficha) return false;
  return iguales(ficha, await fichaDe(clave));
}

/** ¿El texto escrito es la clave? Se comparan las fichas para no filtrar el largo. */
export async function claveCorrecta(escrita: string, clave: string): Promise<boolean> {
  return iguales(await fichaDe(escrita.trim()), await fichaDe(clave));
}

/** A dónde volver después de entrar: solo rutas de este mismo sitio. */
export function destinoSeguro(desde: unknown): string {
  if (typeof desde !== 'string') return '/';
  if (!desde.startsWith('/') || desde.startsWith('//') || desde.startsWith('/\\')) return '/';
  if (desde.startsWith('/entrar') || desde.startsWith('/api/')) return '/';
  if (/[\u0000-\u001f]/.test(desde)) return '/';
  return desde;
}

/** Rutas que se ven sin clave: la entrada, salir y los archivos del sitio (logos). */
export function rutaLibre(ruta: string): boolean {
  return (
    ruta === '/entrar' ||
    ruta === '/api/entrar' ||
    ruta === '/api/salir' ||
    ruta.startsWith('/_next/') ||
    ruta === '/icon.png' ||
    ruta === '/favicon.ico' ||
    /^\/logo-presente(-blanco)?\.png$/.test(ruta)
  );
}
