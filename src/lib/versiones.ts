import type { ResumenVersion } from './almacen';

/** Cómo se nombra una copia del historial en pantalla. */
export function etiquetaVersion(v: Pick<ResumenVersion, 'motivo' | 'nota'>): string {
  if (v.motivo === 'manual') return v.nota ?? 'Copia guardada a mano';
  if (v.motivo === 'restauracion') return v.nota ?? 'Antes de volver a otra copia';
  if (v.motivo === 'importacion') return 'Antes de importar';
  return 'Copia automática, antes de editar';
}
