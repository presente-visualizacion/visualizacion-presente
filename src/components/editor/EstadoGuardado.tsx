'use client';

import { Check, CloudOff, LoaderCircle, TriangleAlert } from 'lucide-react';
import type { EstadoGuardado as Estado } from './usarEdicion';

const TEXTOS: Record<Estado, string> = {
  guardado: 'Guardado',
  pendiente: 'Guardando…',
  guardando: 'Guardando…',
  reintentando: 'Sin conexión: reintentando',
  error: 'No se pudo guardar',
};

/** Indicador de guardado: siempre dice si lo que se ve ya está a salvo. */
export function EstadoGuardado({ estado, detalle }: { estado: Estado; detalle?: string | null }) {
  const problema = estado === 'reintentando' || estado === 'error';
  return (
    <span
      role="status"
      title={detalle ?? undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm ${problema ? 'font-semibold text-tinta' : 'text-tinta-suave'}`}
    >
      {estado === 'guardado' && <Check size={16} aria-hidden />}
      {(estado === 'pendiente' || estado === 'guardando') && <LoaderCircle size={16} aria-hidden className="animate-spin motion-reduce:animate-none" />}
      {estado === 'reintentando' && <CloudOff size={16} aria-hidden className="text-primario" />}
      {estado === 'error' && <TriangleAlert size={16} aria-hidden className="text-primario" />}
      {TEXTOS[estado]}
    </span>
  );
}
