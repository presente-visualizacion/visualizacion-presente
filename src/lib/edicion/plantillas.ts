// Piezas nuevas para la edición de estructura (etapa 2B): ids, bloques y
// conjuntos de ejemplo, copias para duplicar y el ajuste de la configuración
// de un gráfico cuando cambia de tipo. Sin React: se prueba aparte.

import type {
  Bloque, BloqueGrafico, Columna, ConjuntoDatos, Diapositiva, FormaGrafico, IdPeriodo, Presentacion, Serie,
} from '../tipos';
import type { ConfigGrafico } from './operaciones';
import { SERIES_POR_FORMA } from './validar';

const LETRAS = 'abcdefghijkmnpqrstuvwxyz23456789';

/** Id nuevo con prefijo: "d-k3f9x2ab". Comprueba que no esté en uso. */
export function nuevoId(prefijo: 'd' | 'b' | 'c', enUso: Set<string> = new Set()): string {
  for (;;) {
    const azar = new Uint8Array(8);
    crypto.getRandomValues(azar);
    const id = `${prefijo}-${Array.from(azar, (n) => LETRAS[n % LETRAS.length]).join('')}`;
    if (!enUso.has(id)) {
      enUso.add(id);
      return id;
    }
  }
}

/** Todos los ids de la presentación (diapositivas, bloques y conjuntos). */
export function idsEnUso(p: Presentacion): Set<string> {
  return new Set([
    ...p.diapositivas.map((d) => d.id),
    ...p.diapositivas.flatMap((d) => d.bloques.map((b) => b.id)),
    ...Object.keys(p.datos),
  ]);
}

/** Primera clave libre del tipo "col1", "col2"... */
export function claveLibre(columnas: Columna[]): string {
  const usadas = new Set(columnas.map((c) => c.clave));
  for (let i = 1; ; i++) if (!usadas.has(`col${i}`)) return `col${i}`;
}

export const esNumerica = (c: Columna) => c.tipo !== 'texto';

// ---------------------------------------------------------------------------
// Diapositivas y bloques nuevos

export function diapositivaNueva(tipo: Diapositiva['tipo'], enUso: Set<string>): Diapositiva {
  const id = nuevoId('d', enUso);
  if (tipo === 'portada') return { id, tipo, titulo: 'Título de la presentación', subtitulo: '{mes}', bloques: [] };
  if (tipo === 'cierre') return { id, tipo, titulo: 'Gracias', bloques: [] };
  return { id, tipo, titulo: 'Título de la diapositiva', disposicion: 'una', bloques: [] };
}

export type TipoNuevo = 'grafico' | 'tabla' | 'texto' | 'cifras';

/** Conjunto con columnas y tres filas de ejemplo, según lo que pide la forma. */
export function conjuntoEjemplo(id: string, forma: FormaGrafico | 'tabla'): ConjuntoDatos {
  const texto = (clave: string, nombre: string): Columna => ({ clave, nombre, tipo: 'texto' });
  const numero = (clave: string, nombre: string): Columna => ({ clave, nombre, tipo: 'numero' });
  let columnas: Columna[];
  let filas: Record<string, string | number>[];
  switch (forma) {
    case 'dispersion':
      columnas = [texto('col1', 'Nombre'), numero('col2', 'Variable X'), numero('col3', 'Variable Y')];
      filas = [{ col1: 'Ejemplo A', col2: 10, col3: 22 }, { col1: 'Ejemplo B', col2: 18, col3: 15 }, { col1: 'Ejemplo C', col2: 25, col3: 30 }];
      break;
    case 'circular':
      columnas = [texto('col1', 'Categoría'), numero('col2', 'Valor')];
      filas = [{ col1: 'Ejemplo A', col2: 50 }, { col1: 'Ejemplo B', col2: 30 }, { col1: 'Ejemplo C', col2: 20 }];
      break;
    case 'cascada':
      columnas = [texto('col1', 'Concepto'), numero('col2', 'Variación')];
      filas = [{ col1: 'Inicio', col2: 100 }, { col1: 'Sube', col2: 30 }, { col1: 'Baja', col2: -20 }];
      break;
    default:
      columnas = [texto('col1', 'Categoría'), numero('col2', 'Serie 1'), numero('col3', 'Serie 2')];
      filas = [{ col1: 'Ejemplo A', col2: 12, col3: 8 }, { col1: 'Ejemplo B', col2: 18, col3: 14 }, { col1: 'Ejemplo C', col2: 15, col3: 20 }];
  }
  return { id, nombre: 'Datos nuevos', columnas, porPeriodo: false, filas };
}

/**
 * Bloque nuevo. Para gráfico y tabla, `conjunto` es el que mostrará (nuevo o
 * uno que ya existe).
 */
export function bloqueNuevo(tipo: TipoNuevo, enUso: Set<string>, conjunto?: ConjuntoDatos): Bloque {
  const id = nuevoId('b', enUso);
  if (tipo === 'texto') return { id, tipo, contenido: { porPeriodo: false, valor: 'Escribe aquí el texto.' } };
  if (tipo === 'cifras') return { id, tipo, cifras: { porPeriodo: false, valor: [{ etiqueta: 'Indicador', valor: '0' }] } };
  if (!conjunto) throw new Error('Un gráfico o una tabla necesita un conjunto de datos.');
  if (tipo === 'tabla') return { id, tipo, datos: conjunto.id };
  const eje = conjunto.columnas.find((c) => !esNumerica(c)) ?? conjunto.columnas[0];
  const base: BloqueGrafico = { id, tipo, datos: conjunto.id, forma: 'barras', ejeX: eje.clave, series: [] };
  return { ...base, ...configPara('barras', base, conjunto) };
}

// ---------------------------------------------------------------------------
// Ajuste al cambiar de forma

/** Por qué el conjunto no sirve para esa forma; null si sirve. */
export function motivoNoDisponible(forma: FormaGrafico, conjunto: ConjuntoDatos): string | null {
  const numericas = conjunto.columnas.filter(esNumerica).length;
  if (forma === 'dispersion') return numericas >= 2 ? null : 'Necesita dos columnas numéricas.';
  return numericas >= 1 ? null : 'Necesita al menos una columna numérica.';
}

/**
 * Configuración válida para `forma` partiendo de la actual: conserva lo que
 * se pueda (eje, series, colores) y corrige lo demás. Supone que
 * `motivoNoDisponible` es null.
 */
export function configPara(forma: FormaGrafico, actual: ConfigGrafico, conjunto: ConjuntoDatos): ConfigGrafico {
  const columna = (clave?: string) => conjunto.columnas.find((c) => c.clave === clave);
  const numericas = conjunto.columnas.filter(esNumerica);

  // Eje: numérico en la dispersión; en los demás, mejor uno de texto.
  let ejeX = actual.ejeX;
  if (forma === 'dispersion') {
    if (!columna(ejeX) || !esNumerica(columna(ejeX)!)) ejeX = numericas[0].clave;
  } else if (!columna(ejeX)) {
    ejeX = (conjunto.columnas.find((c) => !esNumerica(c)) ?? conjunto.columnas[0]).clave;
  }

  // Series: numéricas, sin repetir y distintas del eje.
  let series: Serie[] = actual.series.filter((s, i, todas) => {
    const c = columna(s.clave);
    return c && esNumerica(c) && s.clave !== ejeX && todas.findIndex((x) => x.clave === s.clave) === i;
  });
  if (!series.length) {
    const primera = numericas.find((c) => c.clave !== ejeX) ?? numericas[0];
    series = [{ clave: primera.clave }];
  }
  const [, maximo] = SERIES_POR_FORMA[forma];
  series = series.slice(0, maximo).map(({ tipo: _tipo, ...s }) => s);
  if (forma === 'combinado') {
    const previas = new Map(actual.series.map((s) => [s.clave, s.tipo]));
    series = series.map((s, i) => ({ ...s, tipo: previas.get(s.clave) ?? (i === 0 ? 'barras' : 'lineas') }));
  }

  const config: ConfigGrafico = { datos: actual.datos, forma, ejeX, series };
  if (actual.apilado && (forma === 'barras' || forma === 'area')) config.apilado = true;
  if (actual.etiquetas && ['barras', 'barrasHorizontales', 'combinado', 'cascada', 'circular', 'dispersion'].includes(forma)) config.etiquetas = true;
  if (actual.resaltar && ['barras', 'barrasHorizontales', 'dispersion'].includes(forma) && columna(actual.resaltar.columna)) config.resaltar = actual.resaltar;
  if (forma === 'cascada') config.total = actual.total ?? true;
  if (forma === 'dispersion') {
    const nombres = columna(actual.nombres)?.tipo === 'texto' ? actual.nombres : conjunto.columnas.find((c) => !esNumerica(c))?.clave;
    if (nombres) config.nombres = nombres;
  }
  return config;
}

// ---------------------------------------------------------------------------
// Duplicar

/** Copia del conjunto con id y nombre nuevos. */
export function copiaDeConjunto(conjunto: ConjuntoDatos, enUso: Set<string>): ConjuntoDatos {
  return { ...structuredClone(conjunto), id: nuevoId('c', enUso), nombre: `${conjunto.nombre} (copia)`.slice(0, 200) };
}

/**
 * Copia del bloque con id nuevo. Si muestra datos, los copia en un conjunto
 * nuevo (salvo que ya se hayan copiado: `copiados` lleva la cuenta, para que
 * un gráfico y una tabla con los mismos datos sigan compartiéndolos).
 */
export function copiaDeBloque(
  p: Presentacion, bloque: Bloque, enUso: Set<string>, copiados: Map<string, ConjuntoDatos> = new Map(),
): { bloque: Bloque; conjuntos: ConjuntoDatos[] } {
  const copia = { ...structuredClone(bloque), id: nuevoId('b', enUso) };
  if (copia.tipo !== 'grafico' && copia.tipo !== 'tabla') return { bloque: copia, conjuntos: [] };
  const original = p.datos[copia.datos];
  if (!original) return { bloque: copia, conjuntos: [] };
  const previo = copiados.get(original.id);
  if (previo) return { bloque: { ...copia, datos: previo.id }, conjuntos: [] };
  const nuevo = copiaDeConjunto(original, enUso);
  copiados.set(original.id, nuevo);
  return { bloque: { ...copia, datos: nuevo.id }, conjuntos: [nuevo] };
}

export function copiaDeDiapositiva(p: Presentacion, d: Diapositiva, enUso: Set<string>): { diapositiva: Diapositiva; conjuntos: ConjuntoDatos[] } {
  const copiados = new Map<string, ConjuntoDatos>();
  const conjuntos: ConjuntoDatos[] = [];
  const bloques = d.bloques.map((b) => {
    const r = copiaDeBloque(p, b, enUso, copiados);
    conjuntos.push(...r.conjuntos);
    return r.bloque;
  });
  return { diapositiva: { ...structuredClone(d), id: nuevoId('d', enUso), bloques }, conjuntos };
}

// ---------------------------------------------------------------------------
// Meses

/** El mes siguiente: "2026-12" → "2027-01". */
export function mesSiguiente(periodo: IdPeriodo): IdPeriodo {
  const [anio, mes] = periodo.split('-').map(Number);
  return mes === 12 ? `${anio + 1}-01` : `${anio}-${String(mes + 1).padStart(2, '0')}`;
}
