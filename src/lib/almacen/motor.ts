// Motor de base de datos: lo mínimo que el almacén necesita de Postgres.
//
// Hay dos: Neon (el de verdad, por HTTP, sin conexiones abiertas que
// administrar) y PGlite (Postgres dentro de Node), que corre el mismo SQL en
// desarrollo y en las pruebas, sin red.

export interface Motor {
  /** Ejecuta una sentencia con parámetros `$1`, `$2`... y devuelve sus filas. */
  consultar<T = Record<string, unknown>>(texto: string, valores?: unknown[]): Promise<T[]>;
}

export async function motorNeon(url: string): Promise<Motor> {
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(url);
  return {
    async consultar<T>(texto: string, valores: unknown[] = []) {
      return (await sql.query(texto, valores)) as T[];
    },
  };
}

/**
 * PGlite. Sin `carpeta` vive en memoria (pruebas); con ella guarda en disco
 * (desarrollo). Nunca se usa en producción.
 */
export async function motorPglite(carpeta?: string): Promise<Motor> {
  const { PGlite } = await import('@electric-sql/pglite');
  if (carpeta) {
    const fs = await import('node:fs/promises');
    await fs.mkdir(carpeta, { recursive: true });
  }
  const bd = await PGlite.create(carpeta);
  return {
    async consultar<T>(texto: string, valores: unknown[] = []) {
      return (await bd.query<T>(texto, valores)).rows;
    },
  };
}
