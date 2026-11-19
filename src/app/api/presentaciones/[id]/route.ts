// GET /api/presentaciones/[id]
//   sin parámetros   { presentacion, revision }
//   ?solo=revision   { revision }: para saber si alguien más cambió algo
//     &sesion=…      además marca que esa pestaña está editando y responde
//                    { revision, otros } (otras pestañas editando); &salir=1 la quita
//   ?descargar=1     el mismo contenido como archivo .json ("Descargar copia")

import { puedeEditar } from '@/lib/acceso';
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
    const sesion = consulta.get('sesion');
    if (!sesion || !/^[A-Za-z0-9-]{8,64}$/.test(sesion) || almacen.soloLectura || !(await puedeEditar())) {
      return Response.json({ revision }, { headers: SIN_CACHE });
    }
    const otros = await almacen.presencia(id, sesion, consulta.has('salir')).catch(() => 0);
    return Response.json({ revision, otros }, { headers: SIN_CACHE });
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
