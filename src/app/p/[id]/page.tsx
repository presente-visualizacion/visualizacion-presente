import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Visor } from '@/components/visor/Visor';
import { puedeEditar } from '@/lib/acceso';
import { obtenerAlmacen } from '@/lib/almacen';

// `generateMetadata` y la página piden lo mismo: con `cache` se consulta una vez.
const cargar = cache(async (id: string) => (await obtenerAlmacen()).obtener(id));

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ d?: string; mes?: string; comparar?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const guardada = await cargar(id);
  return { title: guardada?.presentacion.nombre ?? 'Presentación' };
}

export default async function PaginaPresentacion({ params, searchParams }: Props) {
  const [{ id }, { d, mes, comparar }] = await Promise.all([params, searchParams]);
  const guardada = await cargar(id);
  if (!guardada) notFound();
  const { presentacion, revision } = guardada;
  const editable = !(await obtenerAlmacen()).soloLectura && (await puedeEditar());

  // El enlace puede apuntar a una diapositiva y a un mes: /p/comite?d=3&mes=2026-08
  const indice = Math.min(Math.max((Number(d) || 1) - 1, 0), presentacion.diapositivas.length - 1);
  const periodo = mes && presentacion.periodos.includes(mes) ? mes : presentacion.periodos[presentacion.periodos.length - 1];

  // ?comparar=anterior o ?comparar=2026-08: abre comparando con ese mes.
  const compararInicial = comparar === undefined ? false : presentacion.periodos.includes(comparar) ? comparar : true;

  return <Visor presentacion={presentacion} revision={revision} editable={editable} indiceInicial={indice} periodoInicial={periodo} compararInicial={compararInicial} />;
}
