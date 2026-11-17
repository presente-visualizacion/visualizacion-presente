// Almacén sobre Postgres. El diseño está en "Diseño de la etapa 2A" de PLAN.md.
//
// - Una fila por presentación, con todo su contenido en `contenido` (jsonb).
// - `revision` sube en 1 con cada guardado. Se guarda solo si la revisión no
//   cambió desde que se leyó; si cambió, se vuelve a leer y a aplicar.
// - Al empezar cada tanda de cambios se deja una copia del estado anterior en
//   `versiones`, para el historial.

import { aplicarVarias, type Operacion } from '../edicion/operaciones';
import { validarPresentacion } from '../edicion/validar';
import type { Presentacion, ResumenPresentacion } from '../tipos';
import type { Almacen, Guardada, ResultadoGuardado } from './index';
import { prepararEsquema } from './esquema';
import type { Motor } from './motor';

export interface OpcionesBd {
  /** Presentación que se inserta si la base está vacía. */
  muestra?: Presentacion;
  /** Minutos entre copias automáticas para el historial. */
  minutosEntreCopias?: number;
  /** Copias automáticas que se conservan por presentación. */
  topeCopias?: number;
  /** Solo para pruebas: se llama entre leer y guardar. */
  antesDeGuardar?: () => Promise<void>;
}

const INTENTOS = 3;
const ISO = `to_char(actualizado at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

const GUARDAR = `
  with anterior as (
    select revision, contenido from presentaciones where id = $1 and revision = $2
  ),
  cambio as (
    update presentaciones
    set contenido = $3::jsonb, revision = revision + 1, actualizado = now()
    where id = $1 and revision = $2 and eliminado is null
    returning revision, ${ISO} as actualizado
  ),
  copia as (
    insert into versiones (presentacion, revision, contenido, motivo)
    select $1, a.revision, a.contenido, 'auto' from anterior a, cambio
    where $4::boolean
    returning id
  )
  select revision, actualizado from cambio`;

async function resumenes(m: Motor, eliminadas: boolean): Promise<ResumenPresentacion[]> {
  const filas = await m.consultar<{ id: string; nombre: string; descripcion: string | null; periodos: unknown; diapositivas: number; actualizado: string; eliminado: string | null }>(
    `select id,
            contenido->>'nombre' as nombre,
            contenido->>'descripcion' as descripcion,
            contenido->'periodos' as periodos,
            jsonb_array_length(contenido->'diapositivas') as diapositivas,
            ${ISO} as actualizado,
            to_char(eliminado at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as eliminado
     from presentaciones
     where ${eliminadas ? 'eliminado is not null' : 'eliminado is null'}
     order by ${eliminadas ? 'eliminado desc' : 'actualizado desc'}, id`,
  );
  return filas.map((f): ResumenPresentacion => ({
    id: f.id,
    nombre: f.nombre,
    descripcion: f.descripcion ?? undefined,
    periodos: json<string[]>(f.periodos),
    diapositivas: Number(f.diapositivas),
    actualizado: f.actualizado,
    ...(f.eliminado ? { eliminado: f.eliminado } : {}),
  }));
}

/** Los motores devuelven jsonb ya leído; por si alguno lo entrega como texto. */
function json<T>(valor: unknown): T {
  return (typeof valor === 'string' ? JSON.parse(valor) : valor) as T;
}

export function almacenBd(obtenerMotor: () => Promise<Motor>, opciones: OpcionesBd = {}): Almacen {
  const { minutosEntreCopias = 10, topeCopias = 150 } = opciones;

  // El motor y las tablas se preparan una vez por arranque del servidor. Si
  // falla (base dormida, sin red), el siguiente pedido lo intenta de nuevo.
  let listo: Promise<Motor> | null = null;
  function motor(): Promise<Motor> {
    listo ??= (async () => {
      const m = await obtenerMotor();
      await prepararEsquema(m, opciones.muestra);
      return m;
    })().catch((error) => {
      listo = null;
      throw error;
    });
    return listo;
  }

  return {
    soloLectura: false,

    async listar() {
      return resumenes(await motor(), false);
    },

    async listarEliminadas() {
      return resumenes(await motor(), true);
    },

    async eliminar(id) {
      const filas = await (await motor()).consultar(
        `update presentaciones set eliminado = now() where id = $1 and eliminado is null returning id`,
        [id],
      );
      return filas.length > 0;
    },

    async recuperar(id) {
      const filas = await (await motor()).consultar(
        `update presentaciones set eliminado = null, actualizado = now() where id = $1 and eliminado is not null returning id`,
        [id],
      );
      return filas.length > 0;
    },

    async obtener(id): Promise<Guardada | null> {
      const [fila] = await (await motor()).consultar<{ contenido: unknown; revision: number; actualizado: string }>(
        `select contenido, revision, ${ISO} as actualizado from presentaciones where id = $1 and eliminado is null`,
        [id],
      );
      if (!fila) return null;
      // La fila manda sobre lo que diga el JSON.
      return { presentacion: { ...json<Presentacion>(fila.contenido), id, actualizado: fila.actualizado }, revision: Number(fila.revision) };
    },

    async revision(id) {
      const [fila] = await (await motor()).consultar<{ revision: number }>(
        `select revision from presentaciones where id = $1 and eliminado is null`,
        [id],
      );
      return fila ? Number(fila.revision) : null;
    },

    async aplicar(id, revisionBase, ops: Operacion[]): Promise<ResultadoGuardado> {
      const m = await motor();
      for (let intento = 0; intento < INTENTOS; intento++) {
        const [fila] = await m.consultar<{ contenido: unknown; revision: number; actualizado: string; copiar: boolean }>(
          `select p.contenido, p.revision, ${ISO} as actualizado,
                  coalesce((select max(v.creado) from versiones v where v.presentacion = p.id)
                           < now() - make_interval(mins => $2::int), true) as copiar
           from presentaciones p
           where p.id = $1 and p.eliminado is null`,
          [id, minutosEntreCopias],
        );
        if (!fila) return { ok: false, motivo: 'no-existe' };

        const revisionLeida = Number(fila.revision);
        const ajenos = revisionLeida !== revisionBase;
        const actual: Presentacion = { ...json<Presentacion>(fila.contenido), id, actualizado: fila.actualizado };
        const { presentacion, omitidas } = aplicarVarias(actual, ops);

        // Nada que guardar: todas las operaciones apuntaban a algo que ya no está.
        if (omitidas === ops.length) return { ok: true, revision: revisionLeida, actualizado: fila.actualizado, ajenos, omitidas };

        const validacion = validarPresentacion(presentacion);
        if (!validacion.ok) return { ok: false, motivo: 'invalido', detalle: validacion.errores.slice(0, 5).join(' ') };

        await opciones.antesDeGuardar?.();
        const [guardado] = await m.consultar<{ revision: number; actualizado: string }>(GUARDAR, [
          id,
          revisionLeida,
          JSON.stringify(validacion.valor),
          Boolean(fila.copiar),
        ]);
        if (guardado) {
          if (fila.copiar) {
            await m.consultar(
              `delete from versiones where id in (
                 select id from versiones where presentacion = $1 and motivo = 'auto'
                 order by creado desc, id desc offset $2::int)`,
              [id, topeCopias],
            );
          }
          return { ok: true, revision: Number(guardado.revision), actualizado: guardado.actualizado, ajenos, omitidas };
        }
        // Alguien guardó entre la lectura y el guardado: se intenta de nuevo
        // sobre lo más reciente.
      }
      return { ok: false, motivo: 'ocupado' };
    },

    async crear(presentacion) {
      const validacion = validarPresentacion(presentacion);
      if (!validacion.ok) throw new Error(`La presentación no es válida: ${validacion.errores.slice(0, 5).join(' ')}`);
      const filas = await (await motor()).consultar(
        `insert into presentaciones (id, contenido) values ($1, $2::jsonb) on conflict (id) do nothing returning id`,
        [presentacion.id, JSON.stringify(validacion.valor)],
      );
      if (!filas.length) throw new Error(`Ya existe una presentación con el id "${presentacion.id}".`);
    },
  };
}
