// GET /api/presentaciones/[id]/excel
// Respaldo en Excel: todos los datos de todos los meses, textos y cifras.
// Ver "Diseño de la etapa 5" en PLAN.md.

import { obtenerAlmacen } from '@/lib/almacen';
import { escribirLibro } from '@/lib/excel/escribir';
import { hojasDeRespaldo } from '@/lib/respaldo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guardada = await (await obtenerAlmacen()).obtener(id);
  if (!guardada) return Response.json({ error: 'No existe esa presentación.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });

  const bytes = escribirLibro(hojasDeRespaldo(guardada.presentacion));
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(bytes as BodyInit, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${id}-${fecha}.xlsx"`,
    },
  });
}
