import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Visor } from '@/components/visor/Visor';
import { obtenerAlmacen } from '@/lib/almacen';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ d?: string; mes?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const presentacion = await obtenerAlmacen().obtener(id);
  return { title: presentacion?.nombre ?? 'Presentación' };
}

export default async function PaginaPresentacion({ params, searchParams }: Props) {
  const [{ id }, { d, mes }] = await Promise.all([params, searchParams]);
  const presentacion = await obtenerAlmacen().obtener(id);
  if (!presentacion) notFound();

  // El enlace puede apuntar a una diapositiva y a un mes: /p/comite?d=3&mes=2026-08
  const indice = Math.min(Math.max((Number(d) || 1) - 1, 0), presentacion.diapositivas.length - 1);
  const periodo = mes && presentacion.periodos.includes(mes) ? mes : presentacion.periodos[presentacion.periodos.length - 1];

  return <Visor presentacion={presentacion} indiceInicial={indice} periodoInicial={periodo} />;
}
