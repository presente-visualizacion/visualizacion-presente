// Almacén de presentaciones.
//
// Todo el resto de la aplicación lee y guarda presentaciones a través de esta
// interfaz. Hay dos implementaciones: la de base de datos (`bd.ts`) y la de
// muestra (`muestra.ts`), de solo lectura, que sirve mientras no se haya
// conectado una base. El diseño está en "Diseño de la etapa 2A" de PLAN.md.

import type { Operacion } from '../edicion/operaciones';
import type { Presentacion, ResumenPresentacion } from '../tipos';

export interface Guardada {
  presentacion: Presentacion;
  /** Sube en 1 con cada guardado. */
  revision: number;
}

export type ResultadoGuardado =
  | {
      ok: true;
      revision: number;
      actualizado: string;
      /** Otra persona guardó desde `revisionBase`: hay que traer la presentación de nuevo. */
      ajenos: boolean;
      /** Operaciones que se saltaron porque su destino ya no existe o cambió. */
      omitidas: number;
    }
  | { ok: false; motivo: 'no-existe' | 'invalido' | 'ocupado'; detalle?: string };

/** Una copia del historial, sin su contenido. */
export interface ResumenVersion {
  id: number;
  /** Revisión que tenía la presentación cuando se hizo la copia. */
  revision: number;
  /**
   * - auto: estado antes de una tanda de cambios (se hace sola cada 10 minutos de edición).
   * - manual: guardada a mano con un nombre.
   * - restauracion: estado justo antes de volver a otra copia.
   * - importacion: estado antes de importar encima.
   */
  motivo: 'auto' | 'manual' | 'restauracion' | 'importacion';
  nota?: string;
  creado: string;
  diapositivas: number;
  periodos: string[];
  /** Bytes que ocupa en la base (ya comprimida). */
  tamano: number;
}

export type ResultadoRestaurar =
  | { ok: true; revision: number }
  | { ok: false; motivo: 'no-existe' | 'invalido'; detalle?: string };

export interface Almacen {
  /** true en el almacén de muestra: el visor esconde "Editar". */
  soloLectura: boolean;
  listar(): Promise<ResumenPresentacion[]>;
  obtener(id: string): Promise<Guardada | null>;
  /** Solo el número de revisión, para saber si hay cambios sin traer todo. */
  revision(id: string): Promise<number | null>;
  /**
   * Marca que esa pestaña está editando (o que salió, con `salir`) y dice
   * cuántas otras pestañas editan la misma presentación en este momento.
   */
  presencia(id: string, sesion: string, salir?: boolean): Promise<number>;
  /** Aplica las operaciones sobre la versión más reciente y guarda. */
  aplicar(id: string, revisionBase: number, ops: Operacion[]): Promise<ResultadoGuardado>;
  /** Para importar presentaciones completas (etapas 3 a 5). */
  crear(presentacion: Presentacion): Promise<void>;
  /** La manda a la papelera: no se borra, deja de verse y se puede recuperar. false si no existe. */
  eliminar(id: string): Promise<boolean>;
  /** La saca de la papelera. false si no estaba eliminada. */
  recuperar(id: string): Promise<boolean>;
  /** Las que están en la papelera, la más reciente primero. */
  listarEliminadas(): Promise<ResumenPresentacion[]>;
  /** Copias del historial, la más reciente primero. */
  listarVersiones(id: string): Promise<ResumenVersion[]>;
  /** Una copia con su contenido. null si no existe o es de otra presentación. */
  obtenerVersion(id: string, version: number): Promise<(ResumenVersion & { presentacion: Presentacion }) | null>;
  /** Guarda el estado actual como copia con nombre. null si la presentación no existe. */
  guardarVersion(id: string, nota: string): Promise<ResumenVersion | null>;
  /** Vuelve a una copia. Antes deja el estado actual en el historial. */
  restaurar(id: string, version: number, nota: string): Promise<ResultadoRestaurar>;
}

// El almacén se guarda en `globalThis` para que sobreviva a las recargas de
// `next dev`: la base local (PGlite) no admite dos instancias sobre la misma
// carpeta.
const global = globalThis as typeof globalThis & { __vpAlmacen?: Promise<Almacen> };

async function crearAlmacen(): Promise<Almacen> {
  const { almacenMuestra, presentacionMuestra } = await import('./muestra');
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  // Producción sin base conectada: el sitio sigue funcionando, solo lectura.
  if (!url && process.env.NODE_ENV === 'production') return almacenMuestra;

  const { almacenBd } = await import('./bd');
  const { motorNeon, motorPglite } = await import('./motor');
  return almacenBd(() => (url ? motorNeon(url) : motorPglite('.datos-locales/pg')), { muestra: presentacionMuestra });
}

/**
 * - Con `DATABASE_URL` (o `POSTGRES_URL`): base de datos de Neon.
 * - Sin ella, en desarrollo: base local en `.datos-locales/` (ignorada por git).
 * - Sin ella, en producción: presentación de muestra, solo lectura.
 */
export function obtenerAlmacen(): Promise<Almacen> {
  // Si falla al crearse, el siguiente pedido lo intenta de nuevo.
  global.__vpAlmacen ??= crearAlmacen().catch((error) => {
    global.__vpAlmacen = undefined;
    throw error;
  });
  return global.__vpAlmacen;
}
