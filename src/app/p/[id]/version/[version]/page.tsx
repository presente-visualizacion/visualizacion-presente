import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Visor } from '@/components/visor/Visor';
import { puedeEditar } from '@/lib/acceso';
import { obtenerAlmacen } from '@/lib/almacen';
import { fechaHora } from '@/lib/fechas';
import { etiquetaVersion } from '@/lib/versiones';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Copia del historial' };

type Props = {
  params: Promise<{ id: string; version: string }>;
  searchParams: Promise<{ d?: string; mes?: string }>;
};

/** Una copia del historial en el visor, sin poder editarla. */
export default async function PaginaVersion({ params, searchParams }: Props) {
  const [{ id, version }, { d, mes }] = await Promise.all([params, searchParams]);
  const almacen = await obtenerAlmacen();
  const numero = Number(version);
  const copia = Number.isSafeInteger(numero) ? await almacen.obtenerVersion(id, numero) : null;
  if (!copia) notFound();
  const { presentacion } = copia;
  const editable = !almacen.soloLectura && (await puedeEditar());

  const indice = Math.min(Math.max((Number(d) || 1) - 1, 0), presentacion.diapositivas.length - 1);
  const periodo = mes && presentacion.periodos.includes(mes) ? mes : presentacion.periodos[presentacion.periodos.length - 1];

  return (
    <Visor
      presentacion={presentacion}
      revision={copia.revision}
      editable={false}
      indiceInicial={indice}
      periodoInicial={periodo}
      copia={{ id: copia.id, etiqueta: `${etiquetaVersion(copia)} · ${fechaHora(copia.creado)}`, restaurable: editable }}
    />
  );
}
