// Tablas de la base de datos.
//
// Se crean solas al primer uso: basta conectar la base en Vercel. Todas las
// sentencias se pueden repetir sin daño. Para cambiar las tablas más adelante,
// agregar aquí sentencias del mismo estilo (`create ... if not exists`,
// `alter table ... add column if not exists`); no editar las existentes.

import type { Presentacion } from '../tipos';
import type { Motor } from './motor';

const SENTENCIAS = [
  `create table if not exists presentaciones (
     id          text primary key,
     contenido   jsonb not null,
     revision    integer not null default 1,
     creado      timestamptz not null default now(),
     actualizado timestamptz not null default now(),
     eliminado   timestamptz
   )`,
  `create table if not exists versiones (
     id           bigint generated always as identity primary key,
     presentacion text not null references presentaciones(id) on delete cascade,
     revision     integer not null,
     contenido    jsonb not null,
     motivo       text not null,
     autor        text,
     creado       timestamptz not null default now()
   )`,
  `create index if not exists versiones_por_presentacion on versiones (presentacion, creado desc)`,
  // Etapa 5: nombre de las copias guardadas a mano.
  `alter table versiones add column if not exists nota text`,
  // 2026-11-19: quién está editando ahora (una fila por pestaña, se renueva
  // cada pocos segundos). Ver "Varias personas a la vez" en PLAN.md.
  `create table if not exists presencia (
     presentacion text not null,
     sesion       text not null,
     visto        timestamptz not null default now(),
     primary key (presentacion, sesion)
   )`,
];

/**
 * Crea las tablas si faltan y, si no hay ninguna presentación (ni siquiera
 * eliminada), inserta la de muestra para que el sitio no quede vacío.
 */
export async function prepararEsquema(motor: Motor, muestra?: Presentacion): Promise<void> {
  for (const sentencia of SENTENCIAS) await motor.consultar(sentencia);
  if (muestra) {
    await motor.consultar(
      `insert into presentaciones (id, contenido)
       select $1, $2::jsonb where not exists (select 1 from presentaciones)
       on conflict (id) do nothing`,
      [muestra.id, JSON.stringify(muestra)],
    );
  }
}
