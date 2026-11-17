// GET /api/presentaciones/[id]/versiones/[version]
//   { version }: la copia con su contenido
//   ?descargar=1  la copia como archivo .json (se puede importar desde el inicio)

import { obtenerAlmacen } from '@/lib/almacen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIN_CACHE = { 'Cache-Control': 'no-store' };

export async function GET(request: Request, { params }: { params: Promise<{ id: string; version: string }> }) {
  const { id, version } = await params;
  const numero = Number(version);
  const copia = Number.isSafeInteger(numero) ? await (await obtenerAlmacen()).obtenerVersion(id, numero) : null;
  if (!copia) return Response.json({ error: 'No existe esa copia.' }, { status: 404, headers: SIN_CACHE });

  if (new URL(request.url).searchParams.has('descargar')) {
    const fecha = copia.creado.slice(0, 10);
    return new Response(JSON.stringify({ presentacion: copia.presentacion, revision: copia.revision }, null, 2), {
      headers: {
        ...SIN_CACHE,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${id}-copia-${fecha}-${copia.id}.json"`,
      },
    });
  }
  return Response.json({ version: copia }, { headers: SIN_CACHE });
}
