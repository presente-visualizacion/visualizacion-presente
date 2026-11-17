import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Impresion } from '@/components/visor/Impresion';
import { obtenerAlmacen } from '@/lib/almacen';

// /p/[id]/pdf?mes=2026-10        todas las diapositivas de octubre
// /p/[id]/pdf?mes=2026-10&d=3    solo la tercera
// &auto=1                        abre la ventana de imprimir al estar lista

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ d?: string; mes?: string; auto?: string }>;
};

export const metadata: Metadata = { title: 'PDF' };

export default async function PaginaPdf({ params, searchParams }: Props) {
  const [{ id }, { d, mes, auto }] = await Promise.all([params, searchParams]);
  const guardada = await (await obtenerAlmacen()).obtener(id);
  if (!guardada) notFound();
  const { presentacion } = guardada;

  const periodo = mes && presentacion.periodos.includes(mes) ? mes : presentacion.periodos[presentacion.periodos.length - 1];
  const numero = Number(d);
  const solo = Number.isInteger(numero) && numero >= 1 && numero <= presentacion.diapositivas.length ? numero - 1 : null;

  return <Impresion presentacion={presentacion} periodoInicial={periodo} soloInicial={solo} auto={auto === '1'} />;
}
