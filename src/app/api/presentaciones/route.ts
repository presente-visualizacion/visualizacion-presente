// POST /api/presentaciones
// Crea una presentación completa (por ahora, la que arma el importador de la
// presentación anterior; ver "Diseño de la etapa 4" en PLAN.md). Recibe
// { presentacion } y responde { id } con el id que quedó (si el pedido ya
// existe, se le agrega "-2", "-3", ...).
//
//   200  creada                400  no es válida          403  sin permiso
//   413  demasiado grande      415  no es JSON

import { puedeEditar } from '@/lib/acceso';
import { obtenerAlmacen } from '@/lib/almacen';
import { validarPresentacion } from '@/lib/edicion/validar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Tope del envío al crear: una presentación completa con todos sus meses. */
const TOPE_CREAR = 2_000_000;

function error(status: number, mensaje: string) {
  return Response.json({ ok: false, error: mensaje }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) return error(415, 'El envío debe ser JSON.');
  if (!(await puedeEditar())) return error(403, 'No tienes permiso para editar.');

  const almacen = await obtenerAlmacen();
  if (almacen.soloLectura) return error(403, 'No se puede crear: todavía no hay base de datos conectada.');

  if (Number(request.headers.get('content-length') ?? 0) > TOPE_CREAR) return error(413, 'La presentación es demasiado grande.');
  const cuerpo = await request.text();
  if (new TextEncoder().encode(cuerpo).length > TOPE_CREAR) return error(413, 'La presentación es demasiado grande.');

  let datos: unknown;
  try {
    datos = JSON.parse(cuerpo);
  } catch {
    return error(400, 'El envío no es JSON válido.');
  }
  const validacion = validarPresentacion((datos as { presentacion?: unknown } | null)?.presentacion);
  if (!validacion.ok) return error(400, validacion.errores.slice(0, 5).join(' '));

  // Id libre: el pedido o, si ya existe, el mismo con un número.
  const base = validacion.valor.id.slice(0, 74);
  for (let n = 1; n <= 50; n++) {
    const id = n === 1 ? base : `${base}-${n}`;
    if ((await almacen.revision(id)) !== null) continue;
    try {
      await almacen.crear({ ...validacion.valor, id, actualizado: new Date().toISOString() });
      return Response.json({ ok: true, id }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (e) {
      // Alguien la creó en ese instante: se prueba con el siguiente número.
      if (!(e instanceof Error && e.message.startsWith('Ya existe'))) throw e;
    }
  }
  return error(409, 'No se encontró un nombre libre para la presentación.');
}
