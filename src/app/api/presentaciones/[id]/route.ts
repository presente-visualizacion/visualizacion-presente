// GET /api/presentaciones/[id]
//   sin parámetros   { presentacion, revision }
//   ?solo=revision   { revision }: para saber si alguien más cambió algo
//   ?descargar=1     el mismo contenido como archivo .json ("Descargar copia")

import { obtenerAlmacen } from '@/lib/almacen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIN_CACHE = { 'Cache-Control': 'no-store' };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const consulta = new URL(request.url).searchParams;
  const almacen = await obtenerAlmacen();

  if (consulta.get('solo') === 'revision') {
    const revision = await almacen.revision(id);
    if (revision === null) return Response.json({ error: 'No existe esa presentación.' }, { status: 404, headers: SIN_CACHE });
    return Response.json({ revision }, { headers: SIN_CACHE });
  }

  const guardada = await almacen.obtener(id);
  if (!guardada) return Response.json({ error: 'No existe esa presentación.' }, { status: 404, headers: SIN_CACHE });

  if (consulta.has('descargar')) {
    const fecha = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(guardada, null, 2), {
      headers: {
        ...SIN_CACHE,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${id}-${fecha}.json"`,
      },
    });
  }

  return Response.json(guardada, { headers: SIN_CACHE });
}
