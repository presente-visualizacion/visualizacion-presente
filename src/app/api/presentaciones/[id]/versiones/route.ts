// /api/presentaciones/[id]/versiones
//   GET              { versiones }: el historial, la copia más reciente primero
//   POST { nota }    guarda el estado actual como copia con nombre
//
//   403 sin permiso   404 no existe   415 no es JSON   400 nombre inválido

import { puedeEditar } from '@/lib/acceso';
import { obtenerAlmacen } from '@/lib/almacen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOPE_NOTA = 120;

function respuesta(status: number, cuerpo: object) {
  return Response.json(cuerpo, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const almacen = await obtenerAlmacen();
  if (!(await almacen.revision(id))) return respuesta(404, { error: 'No existe esa presentación.' });
  return respuesta(200, { versiones: await almacen.listarVersiones(id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!request.headers.get('content-type')?.includes('application/json')) return respuesta(415, { ok: false, error: 'El envío debe ser JSON.' });
  if (!(await puedeEditar())) return respuesta(403, { ok: false, error: 'No tienes permiso para editar.' });
  const almacen = await obtenerAlmacen();
  if (almacen.soloLectura) return respuesta(403, { ok: false, error: 'Todavía no hay base de datos conectada.' });

  const cuerpo = (await request.json().catch(() => null)) as { nota?: unknown } | null;
  const nota = typeof cuerpo?.nota === 'string' ? cuerpo.nota.replace(/\s+/g, ' ').trim() : '';
  if (!nota) return respuesta(400, { ok: false, error: 'Escribe un nombre para la copia.' });
  if (nota.length > TOPE_NOTA) return respuesta(400, { ok: false, error: `El nombre puede tener hasta ${TOPE_NOTA} caracteres.` });

  const version = await almacen.guardarVersion(id, nota);
  if (!version) return respuesta(404, { ok: false, error: 'No existe esa presentación.' });
  return respuesta(200, { ok: true, version });
}
