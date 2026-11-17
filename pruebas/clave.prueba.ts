import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { NOMBRE_COOKIE, claveCorrecta, destinoSeguro, fichaDe, fichaValida, iguales, rutaLibre } from '@/lib/clave';
import { proxy } from '@/proxy';
import { POST as entrar } from '@/app/api/entrar/route';

afterEach(() => vi.unstubAllEnvs());

describe('clave: ayudas', () => {
  it('la ficha no es la clave, es estable y cambia con la clave', async () => {
    const a = await fichaDe('una clave');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain('una clave');
    expect(await fichaDe('una clave')).toBe(a);
    expect(await fichaDe('otra clave')).not.toBe(a);
  });

  it('compara bien', async () => {
    expect(iguales('abc', 'abc')).toBe(true);
    expect(iguales('abc', 'abd')).toBe(false);
    expect(iguales('abc', 'abcd')).toBe(false);
    expect(await claveCorrecta('  secreta ', 'secreta')).toBe(true);
    expect(await claveCorrecta('Secreta', 'secreta')).toBe(false);
    expect(await fichaValida(undefined, 'secreta')).toBe(false);
    expect(await fichaValida(await fichaDe('secreta'), 'secreta')).toBe(true);
  });

  it('solo vuelve a rutas del mismo sitio', () => {
    expect(destinoSeguro('/p/comite')).toBe('/p/comite');
    expect(destinoSeguro('/p/comite?m=2026-10')).toBe('/p/comite?m=2026-10');
    expect(destinoSeguro('https://otro.com')).toBe('/');
    expect(destinoSeguro('//otro.com')).toBe('/');
    expect(destinoSeguro('/\\otro.com')).toBe('/');
    expect(destinoSeguro('/entrar')).toBe('/');
    expect(destinoSeguro('/api/presentaciones')).toBe('/');
    expect(destinoSeguro(null)).toBe('/');
  });

  it('rutas libres', () => {
    expect(rutaLibre('/entrar')).toBe(true);
    expect(rutaLibre('/_next/static/x.js')).toBe(true);
    expect(rutaLibre('/logo-presente-blanco.png')).toBe(true);
    expect(rutaLibre('/')).toBe(false);
    expect(rutaLibre('/p/comite')).toBe(false);
    expect(rutaLibre('/api/presentaciones')).toBe(false);
  });
});

const pedido = (ruta: string, ficha?: string) =>
  new NextRequest(`https://sitio.test${ruta}`, ficha ? { headers: { cookie: `${NOMBRE_COOKIE}=${ficha}` } } : undefined);

describe('clave: proxy', () => {
  it('sin CLAVE_EDICION deja pasar todo', async () => {
    vi.stubEnv('CLAVE_EDICION', '');
    const r = await proxy(pedido('/p/comite'));
    expect(r.headers.get('x-middleware-next')).toBe('1');
  });

  it('con clave y sin cookie: páginas a /entrar, API con 401', async () => {
    vi.stubEnv('CLAVE_EDICION', 'secreta');
    const pagina = await proxy(pedido('/p/comite?m=2026-10'));
    expect(pagina.status).toBe(307);
    const destino = new URL(pagina.headers.get('location')!);
    expect(destino.pathname).toBe('/entrar');
    expect(destino.searchParams.get('desde')).toBe('/p/comite?m=2026-10');

    const inicio = await proxy(pedido('/'));
    expect(new URL(inicio.headers.get('location')!).search).toBe('');

    const api = await proxy(pedido('/api/presentaciones/comite/cambios'));
    expect(api.status).toBe(401);
  });

  it('con clave y cookie válida deja pasar; con cookie vieja no', async () => {
    vi.stubEnv('CLAVE_EDICION', 'secreta');
    const bien = await proxy(pedido('/p/comite', await fichaDe('secreta')));
    expect(bien.headers.get('x-middleware-next')).toBe('1');
    const vieja = await proxy(pedido('/p/comite', await fichaDe('clave anterior')));
    expect(vieja.status).toBe(307);
  });

  it('la pantalla de entrada se ve sin clave', async () => {
    vi.stubEnv('CLAVE_EDICION', 'secreta');
    const r = await proxy(pedido('/entrar'));
    expect(r.headers.get('x-middleware-next')).toBe('1');
  });
});

const formulario = (campos: Record<string, string>) =>
  new Request('https://sitio.test/api/entrar', { method: 'POST', body: new URLSearchParams(campos) });

describe('clave: /api/entrar', () => {
  it('clave correcta: pone la cookie y vuelve a "desde"', async () => {
    vi.stubEnv('CLAVE_EDICION', 'secreta');
    const r = await entrar(formulario({ clave: 'secreta', desde: '/p/comite' }));
    expect(r.status).toBe(303);
    expect(new URL(r.headers.get('location')!).pathname).toBe('/p/comite');
    const cookie = r.headers.get('set-cookie')!;
    expect(cookie).toContain(`${NOMBRE_COOKIE}=${await fichaDe('secreta')}`);
    expect(cookie.toLowerCase()).toContain('httponly');
    expect(cookie.toLowerCase()).toContain('secure');
    expect(cookie).not.toContain('secreta;');
  });

  it('clave incorrecta: vuelve a /entrar con el aviso y sin cookie', async () => {
    vi.stubEnv('CLAVE_EDICION', 'secreta');
    const r = await entrar(formulario({ clave: 'mala', desde: 'https://otro.com' }));
    expect(r.status).toBe(303);
    const destino = new URL(r.headers.get('location')!);
    expect(destino.pathname).toBe('/entrar');
    expect(destino.searchParams.get('error')).toBe('1');
    expect(destino.searchParams.get('desde')).toBeNull();
    expect(r.headers.get('set-cookie')).toBeNull();
  }, 5000);
});
