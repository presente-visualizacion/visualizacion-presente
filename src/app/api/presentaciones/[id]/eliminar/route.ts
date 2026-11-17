// POST /api/presentaciones/[id]/eliminar
// Manda la presentación a la papelera: deja de verse en el inicio pero no se
// borra (se puede recuperar con /recuperar). Pide JSON, como las demás rutas
// que cambian algo, para que otro sitio no lo pueda hacer con un formulario.
//
//   200  { ok: true }      403  sin permiso      404  no existe      415  no es JSON

import { puedeEditar } from '@/lib/acceso';
import { obtenerAlmacen } from '@/lib/almacen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function respuesta(status: number, cuerpo: object) {
  return Response.json(cuerpo, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!request.headers.get('content-type')?.includes('application/json')) return respuesta(415, { ok: false, error: 'El envío debe ser JSON.' });
  if (!(await puedeEditar())) return respuesta(403, { ok: false, error: 'No tienes permiso para editar.' });
  const almacen = await obtenerAlmacen();
  if (almacen.soloLectura) return respuesta(403, { ok: false, error: 'Todavía no hay base de datos conectada.' });
  if (!(await almacen.eliminar(id))) return respuesta(404, { ok: false, error: 'No existe esa presentación.' });
  return respuesta(200, { ok: true });
}
