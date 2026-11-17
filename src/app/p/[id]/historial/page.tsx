import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Historial } from '@/components/historial/Historial';
import { puedeEditar } from '@/lib/acceso';
import { obtenerAlmacen } from '@/lib/almacen';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Historial de versiones' };

export default async function PaginaHistorial({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const almacen = await obtenerAlmacen();
  const guardada = await almacen.obtener(id);
  if (!guardada) notFound();
  const editable = !almacen.soloLectura && (await puedeEditar());
  const versiones = await almacen.listarVersiones(id);

  return (
    <div className="min-h-full bg-white">
      <div className="h-1.5" style={{ background: 'var(--vp-degradado-h)' }} />
      <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <Link href={`/p/${encodeURIComponent(id)}`} className="inline-flex items-center gap-1.5 text-[15px] text-tinta-suave hover:text-primario">
          <ArrowLeft size={17} aria-hidden /> Volver a la presentación
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight">Historial de versiones</h1>
        <p className="mt-2 text-lg text-tinta-suave">{guardada.presentacion.nombre}</p>
        <p className="mt-5 leading-relaxed">
          Cada vez que alguien empieza a editar, se guarda sola una copia de cómo estaba la presentación antes (como mucho una cada 10 minutos de edición).
          Puedes ver cualquier copia y volver a ella. Al volver, lo que hay ahora también queda guardado aquí, así que nada se pierde.
          De las copias automáticas se conservan las 150 más recientes.
        </p>
        <Historial id={id} versiones={versiones} editable={editable} />
      </main>
    </div>
  );
}
