// POST /api/presentaciones/[id]/versiones/[version]/restaurar
// Vuelve a esa copia. El estado actual queda en el historial ("restauracion"),
// así que restaurar también se puede deshacer.
//
//   200 { ok: true, revision }   403 sin permiso   404 no existe   415 no es JSON   422 copia inválida

import { puedeEditar } from '@/lib/acceso';
import { obtenerAlmacen } from '@/lib/almacen';
import { fechaHora } from '@/lib/fechas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function respuesta(status: number, cuerpo: object) {
  return Response.json(cuerpo, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; version: string }> }) {
  const { id, version } = await params;
  if (!request.headers.get('content-type')?.includes('application/json')) return respuesta(415, { ok: false, error: 'El envío debe ser JSON.' });
  if (!(await puedeEditar())) return respuesta(403, { ok: false, error: 'No tienes permiso para editar.' });
  const almacen = await obtenerAlmacen();
  if (almacen.soloLectura) return respuesta(403, { ok: false, error: 'Todavía no hay base de datos conectada.' });

  const numero = Number(version);
  const copia = Number.isSafeInteger(numero) ? await almacen.obtenerVersion(id, numero) : null;
  if (!copia) return respuesta(404, { ok: false, error: 'No existe esa copia.' });

  const resultado = await almacen.restaurar(id, numero, `Antes de volver a la copia del ${fechaHora(copia.creado)}`);
  if (resultado.ok) return respuesta(200, resultado);
  if (resultado.motivo === 'invalido') return respuesta(422, { ok: false, error: `La copia no se pudo restaurar: ${resultado.detalle ?? ''}`.trim() });
  return respuesta(404, { ok: false, error: 'No existe esa presentación.' });
}
