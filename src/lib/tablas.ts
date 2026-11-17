// Lo que muestra una tabla: columnas (con las calculadas), filas (con las de
// sección) y encabezados agrupados. Sin React, para poder probarlo.

import { columnaDe, filasDe } from './datos';
import type { BloqueTabla, Columna, ColumnaCalculada, ConjuntoDatos, Fila, IdPeriodo, Presentacion } from './tipos';

export interface ColumnaVista {
  /** Clave del valor en la fila armada: la de la columna o "variacion:tasa". */
  clave: string;
  columna: Columna;
  calculada?: ColumnaCalculada;
}

export type FilaVista =
  | { tipo: 'seccion'; titulo: string }
  | { tipo: 'datos'; fila: Fila; seccion: string | null };

export interface GrupoEncabezado {
  /** null: columnas sin grupo (su encabezado ocupa las dos filas). */
  nombre: string | null;
  columnas: number;
}

export interface TablaArmada {
  columnas: ColumnaVista[];
  filas: FilaVista[];
  /** null si ninguna columna tiene grupo: el encabezado es de una sola fila. */
  grupos: GrupoEncabezado[] | null;
  /** Mes contra el que se calculó la variación, si hay. */
  mesAnterior: IdPeriodo | null;
}

export const claveCalculada = (c: ColumnaCalculada) => `${c.tipo}:${c.columna}`;

/** Mes anterior a `periodo` en que el conjunto tiene filas; null si no hay. */
export function mesAnteriorCon(p: Presentacion, conjunto: ConjuntoDatos, periodo: IdPeriodo): IdPeriodo | null {
  if (!conjunto.porPeriodo) return null;
  const anteriores = p.periodos.filter((m) => m < periodo && (conjunto.filasPorPeriodo?.[m]?.length ?? 0) > 0);
  return anteriores[anteriores.length - 1] ?? null;
}

/** Cómo se reconoce la misma fila en otro mes: sección y primer texto. */
function identidad(fila: Fila, seccion: string | undefined, nombre: string | undefined): string {
  return `${seccion ? String(fila[seccion] ?? '') : ''}|${nombre ? String(fila[nombre] ?? '').trim().toLowerCase() : ''}`;
}

export function armarTabla(p: Presentacion, bloque: BloqueTabla, conjunto: ConjuntoDatos, periodo: IdPeriodo): TablaArmada | null {
  const filas = filasDe(conjunto, periodo);
  if (!filas?.length) return null;

  const seccion = bloque.secciones && columnaDe(conjunto, bloque.secciones) ? bloque.secciones : undefined;
  const claves = (bloque.columnas ?? conjunto.columnas.map((c) => c.clave)).filter((k) => k !== seccion);
  const base = claves.map((k) => columnaDe(conjunto, k)).filter((c): c is Columna => c !== undefined);
  const nombre = base.find((c) => c.tipo === 'texto')?.clave;

  // Columnas, con cada calculada justo después de la suya.
  const calculadas = (bloque.calculadas ?? []).filter((c) => {
    const col = columnaDe(conjunto, c.columna);
    return col && col.tipo !== 'texto';
  });
  const columnas: ColumnaVista[] = [];
  for (const col of base) {
    columnas.push({ clave: col.clave, columna: col });
    for (const c of calculadas.filter((x) => x.columna === col.clave)) {
      columnas.push({
        clave: claveCalculada(c),
        calculada: c,
        columna: c.tipo === 'variacion'
          ? { clave: claveCalculada(c), nombre: 'Var.', tipo: col.tipo, decimales: col.decimales, signo: true, grupo: col.grupo }
          : { clave: claveCalculada(c), nombre: 'Pos.', tipo: 'numero', decimales: 0, grupo: col.grupo },
      });
    }
  }

  // Valores del mes anterior para la variación.
  const mesAnterior = calculadas.some((c) => c.tipo === 'variacion') ? mesAnteriorCon(p, conjunto, periodo) : null;
  const anteriores = new Map<string, Fila>();
  for (const f of mesAnterior ? conjunto.filasPorPeriodo?.[mesAnterior] ?? [] : []) anteriores.set(identidad(f, seccion, nombre), f);

  // Posiciones: por sección, entre los valores distintos (iguales comparten puesto).
  const posiciones = new Map<string, Map<number, number>>();
  for (const c of calculadas.filter((x) => x.tipo === 'posicion')) {
    const porSeccion = new Map<string, number[]>();
    for (const f of filas) {
      const v = f[c.columna];
      if (typeof v !== 'number') continue;
      const s = seccion ? String(f[seccion] ?? '') : '';
      porSeccion.set(s, [...(porSeccion.get(s) ?? []), v]);
    }
    for (const [s, valores] of porSeccion) {
      const distintos = [...new Set(valores)].sort((a, b) => (c.orden === 'desc' ? b - a : a - b));
      posiciones.set(`${claveCalculada(c)}|${s}`, new Map(distintos.map((v, i) => [v, i + 1])));
    }
  }

  const resultado: FilaVista[] = [];
  let ultimaSeccion: string | null = null;
  for (const f of filas) {
    const s = seccion ? String(f[seccion] ?? '').trim() : null;
    if (seccion && s && s !== ultimaSeccion) resultado.push({ tipo: 'seccion', titulo: s });
    ultimaSeccion = s;
    const armada: Fila = { ...f };
    for (const c of calculadas) {
      const v = f[c.columna];
      let calculado: number | null = null;
      if (typeof v === 'number') {
        if (c.tipo === 'variacion') {
          const antes = anteriores.get(identidad(f, seccion, nombre))?.[c.columna];
          if (typeof antes === 'number') calculado = Math.round((v - antes) * 1e6) / 1e6;
        } else {
          calculado = posiciones.get(`${claveCalculada(c)}|${s ?? ''}`)?.get(v) ?? null;
        }
      }
      armada[claveCalculada(c)] = calculado;
    }
    resultado.push({ tipo: 'datos', fila: armada, seccion: s });
  }

  // Encabezados agrupados: columnas seguidas con el mismo grupo se juntan.
  let grupos: GrupoEncabezado[] | null = null;
  if (columnas.some((c) => c.columna.grupo)) {
    grupos = [];
    for (const c of columnas) {
      const g = c.columna.grupo?.trim() || null;
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && g !== null && ultimo.nombre === g) ultimo.columnas++;
      else grupos.push({ nombre: g, columnas: 1 });
    }
  }

  return { columnas, filas: resultado, grupos, mesAnterior };
}
