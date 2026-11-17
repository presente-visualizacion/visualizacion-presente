// POST /api/presentaciones/[id]/cambios
// Recibe { revisionBase, operaciones } y responde con el resultado del guardado.
//
//   200  guardado: { ok: true, revision, actualizado, ajenos, omitidas }
//   400  lo enviado no es válido          403  sin permiso para editar
//   404  no existe la presentación        409  no se pudo por choques; reintentar
//   413  el envío pasa del tamaño máximo  415  no es JSON

import { puedeEditar } from '@/lib/acceso';
import { obtenerAlmacen } from '@/lib/almacen';
import { TOPES, validarOperaciones } from '@/lib/edicion/validar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function error(status: number, mensaje: string) {
  return Response.json({ ok: false, error: mensaje }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Exigir JSON impide que otro sitio envíe cambios con un formulario simple.
  if (!request.headers.get('content-type')?.includes('application/json')) return error(415, 'El envío debe ser JSON.');
  if (!(await puedeEditar())) return error(403, 'No tienes permiso para editar.');

  const almacen = await obtenerAlmacen();
  if (almacen.soloLectura) return error(403, 'Esta presentación es de solo lectura: todavía no hay base de datos conectada.');

  if (Number(request.headers.get('content-length') ?? 0) > TOPES.envio) return error(413, 'El envío es demasiado grande.');
  const cuerpo = await request.text();
  if (new TextEncoder().encode(cuerpo).length > TOPES.envio) return error(413, 'El envío es demasiado grande.');

  let datos: unknown;
  try {
    datos = JSON.parse(cuerpo);
  } catch {
    return error(400, 'El envío no es JSON válido.');
  }
  const { revisionBase, operaciones } = (datos ?? {}) as { revisionBase?: unknown; operaciones?: unknown };
  if (!Number.isInteger(revisionBase) || (revisionBase as number) < 1) return error(400, 'Falta la revisión base.');
  const validas = validarOperaciones(operaciones);
  if (!validas.ok) return error(400, validas.errores.slice(0, 5).join(' '));

  const resultado = await almacen.aplicar(id, revisionBase as number, validas.valor);
  if (resultado.ok) return Response.json(resultado, { headers: { 'Cache-Control': 'no-store' } });
  if (resultado.motivo === 'no-existe') return error(404, 'No existe esa presentación.');
  if (resultado.motivo === 'invalido') return error(400, resultado.detalle ?? 'El cambio deja la presentación en un estado no válido.');
  return error(409, 'Otra persona estaba guardando al mismo tiempo. Se intentará de nuevo.');
}
