// De una hoja leída a filas de un conjunto de datos: dónde están los
// encabezados, qué filas son datos, qué tipo tiene cada columna y cómo se
// convierte cada celda. Sin React: se prueba aparte. Ver "Cómo se lee una
// hoja" en PLAN.md.

import { interpretarNumero, numeroEditable } from '../formato';
import { TOPES } from '../edicion/validar';
import type { Columna, Fila, FormatoFecha, OrigenExcel, TipoColumna } from '../tipos';
import type { Celda, Hoja } from './leer';

export type Orientacion = OrigenExcel['orientacion'];

export interface Lectura {
  orientacion: Orientacion;
  /** Fila (o columna) de los encabezados, desde 1. */
  encabezados: number;
  hasta: OrigenExcel['hasta'];
  invertir: boolean;
}

/** Columna del archivo, ya con la orientación aplicada. */
export interface ColumnaArchivo {
  /** Posición en la rejilla, desde 0. */
  indice: number;
  /** Nombre único en la hoja: "Tasa", "Tasa (2)", "Columna G". */
  encabezado: string;
  /** Cómo se llama en Excel: "G" si los encabezados van en una fila; "7" si van en una columna. */
  posicion: string;
}

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** 0 → "A", 26 → "AA". */
export function letraColumna(indice: number): string {
  let n = indice + 1;
  let letras = '';
  while (n > 0) {
    const resto = (n - 1) % 26;
    letras = String.fromCharCode(65 + resto) + letras;
    n = Math.floor((n - 1) / 26);
  }
  return letras;
}

/** Número sin errores de coma flotante: 0.145 * 100 da 14.5, no 14.499999999999998. */
export function redondear(valor: number): number {
  return Number(valor.toPrecision(15));
}

/** "2026-10-31" → "31/10/2026", "Oct 26" o "2026". */
export function formatearFecha(iso: string, formato: FormatoFecha): string {
  const [anio, mes, dia] = iso.split('-');
  if (formato === 'anio') return anio;
  if (formato === 'mes') return `${MESES_CORTOS[Number(mes) - 1]} ${anio.slice(2)}`;
  return `${dia}/${mes}/${anio}`;
}

/** Texto con que se muestra una celda tal como viene (en la vista del archivo). */
export function textoCelda(celda: Celda): string {
  if (!celda) return '';
  if (celda.t === 's') return celda.v;
  if (celda.t === 'd') return formatearFecha(celda.v, 'dia');
  const { formato } = celda;
  const valor = formato?.porcentaje ? redondear(celda.v * 100) : celda.v;
  const texto = new Intl.NumberFormat('es-CO', { maximumFractionDigits: formato?.decimales ?? 6, minimumFractionDigits: formato?.decimales ?? 0 }).format(valor);
  return `${formato?.moneda ? '$' : ''}${texto}${formato?.porcentaje ? '%' : ''}`;
}

/** Para comparar encabezados: sin mayúsculas, tildes ni espacios de más. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Rejilla, encabezados y filas

/** Celdas de la hoja; con los encabezados en una columna, transpuestas. */
export function rejillaDe(hoja: Hoja, orientacion: Orientacion): Celda[][] {
  if (orientacion === 'filas') return hoja.celdas;
  const ancho = Math.max(0, ...hoja.celdas.map((f) => f.length));
  return Array.from({ length: ancho }, (_, j) => {
    const fila = hoja.celdas.map((f) => f[j] ?? null);
    while (fila.length && fila[fila.length - 1] === null) fila.pop();
    return fila;
  });
}

const vacia = (fila: Celda[] | undefined) => !fila || fila.every((c) => c === null);

/** Texto de una celda usada como encabezado. */
function textoEncabezado(celda: Celda): string {
  if (!celda) return '';
  if (celda.t === 'n') return textoCelda(celda);
  return textoCelda(celda).replace(/\s+/g, ' ').trim();
}

/**
 * Columnas del archivo con su encabezado. Las que no tienen encabezado pero sí
 * datos se llaman "Columna G"; las repetidas llevan "(2)", "(3)"...
 */
export function columnasDelArchivo(rejilla: Celda[][], encabezados: number, orientacion: Orientacion = 'filas'): ColumnaArchivo[] {
  const fila = rejilla[encabezados - 1] ?? [];
  const debajo = rejilla.slice(encabezados);
  const ancho = Math.min(Math.max(fila.length, ...debajo.map((f) => f.length), 0), 256);
  const vistos = new Map<string, number>();
  const columnas: ColumnaArchivo[] = [];
  for (let j = 0; j < ancho; j++) {
    const posicion = orientacion === 'filas' ? letraColumna(j) : String(j + 1);
    let nombre = textoEncabezado(fila[j] ?? null).slice(0, TOPES.titulo - 5);
    if (!nombre) {
      if (!debajo.some((f) => f[j])) continue;
      nombre = orientacion === 'filas' ? `Columna ${posicion}` : `Fila ${posicion}`;
    }
    const clave = normalizar(nombre);
    const veces = (vistos.get(clave) ?? 0) + 1;
    vistos.set(clave, veces);
    columnas.push({ indice: j, encabezado: veces > 1 ? `${nombre} (${veces})` : nombre, posicion });
  }
  return columnas;
}

/**
 * Fila de encabezados que se propone: la primera, entre las 30 primeras, con
 * al menos dos textos (y casi todo texto) y datos debajo.
 */
export function proponerEncabezados(rejilla: Celda[][]): number {
  const limite = Math.min(rejilla.length, 30);
  for (let i = 0; i < limite; i++) {
    const llenas = rejilla[i].filter((c) => c !== null);
    const textos = llenas.filter((c) => c!.t === 's').length;
    if (textos < 2 || textos < llenas.length * 0.6) continue;
    if (rejilla.slice(i + 1, i + 4).some((f) => !vacia(f))) return i + 1;
  }
  const primera = rejilla.findIndex((f) => !vacia(f));
  return primera >= 0 ? primera + 1 : 1;
}

/**
 * Si los encabezados recordados ya no están en `actual`, los busca en las
 * primeras 50 filas y devuelve la que tenga más.
 */
export function relocalizarEncabezados(rejilla: Celda[][], recordados: string[], actual: number, orientacion: Orientacion = 'filas'): number {
  const buscados = new Set(recordados.map(normalizar));
  if (!buscados.size) return actual;
  const aciertos = (fila: number) => columnasDelArchivo(rejilla, fila, orientacion).filter((c) => buscados.has(normalizar(c.encabezado))).length;
  const enActual = aciertos(actual);
  if (enActual === buscados.size) return actual;
  let mejor = actual;
  let mas = enActual;
  for (let i = 1; i <= Math.min(rejilla.length, 50); i++) {
    const n = aciertos(i);
    if (n > mas) {
      mas = n;
      mejor = i;
    }
  }
  return mejor;
}

export function buscarEncabezado(columnas: ColumnaArchivo[], encabezado: string): ColumnaArchivo | undefined {
  const buscado = normalizar(encabezado);
  return columnas.find((c) => normalizar(c.encabezado) === buscado);
}

/**
 * Filas de datos debajo de los encabezados. Se saltan las vacías del
 * principio; con `hasta: 'vacia'` se termina en la primera vacía después de
 * los datos (lo que va debajo suele ser una nota o la fuente).
 */
export function filasDeDatos(rejilla: Celda[][], lectura: Lectura): Celda[][] {
  const filas: Celda[][] = [];
  for (let i = lectura.encabezados; i < rejilla.length; i++) {
    const fila = rejilla[i];
    if (vacia(fila)) {
      if (lectura.hasta === 'vacia' && filas.length) break;
      continue;
    }
    filas.push(fila);
  }
  return lectura.invertir ? filas.reverse() : filas;
}

// ---------------------------------------------------------------------------
// Tipos

export interface TipoPropuesto {
  tipo: TipoColumna;
  decimales?: number;
  fechas?: FormatoFecha;
}

const esNumeroCelda = (c: NonNullable<Celda>) => c.t === 'n' || (c.t === 's' && typeof interpretarNumero(c.v) === 'number' && !Number.isNaN(interpretarNumero(c.v)));

/** Formato de fecha propuesto: "mes" si no hay dos fechas del mismo mes. */
export function proponerFechas(fechas: string[]): FormatoFecha {
  if (fechas.length > 1 && fechas.every((f) => f.endsWith('-01-01')) && new Set(fechas.map((f) => f.slice(0, 4))).size === fechas.length) return 'anio';
  return new Set(fechas.map((f) => f.slice(0, 7))).size === fechas.length ? 'mes' : 'dia';
}

/**
 * Tipo propuesto para una columna: numérico si más de la mitad de lo que
 * tiene son números (lo demás, como "n.d.", quedará vacío y marcado); fecha
 * si todo son fechas; texto si no.
 */
export function proponerTipo(celdas: Celda[]): TipoPropuesto {
  const llenas = celdas.filter((c): c is NonNullable<Celda> => c !== null);
  if (!llenas.length) return { tipo: 'texto' };
  const fechas = llenas.filter((c) => c.t === 'd');
  if (fechas.length === llenas.length) return { tipo: 'texto', fechas: proponerFechas(fechas.map((c) => c.v)) };
  const numeros = llenas.filter(esNumeroCelda);
  if (numeros.length <= llenas.length / 2) return { tipo: 'texto' };

  const porcentaje = numeros.filter((c) => (c.t === 'n' ? c.formato?.porcentaje : c.v.includes('%'))).length;
  const moneda = numeros.filter((c) => (c.t === 'n' ? c.formato?.moneda : c.v.includes('$'))).length;
  const tipo: TipoColumna = porcentaje > numeros.length / 2 ? 'porcentaje' : moneda > numeros.length / 2 ? 'moneda' : 'numero';
  const conFormato = numeros.find((c) => c.t === 'n' && c.formato?.decimales !== undefined);
  const propuesto: TipoPropuesto = { tipo };
  if (conFormato?.t === 'n' && conFormato.formato?.decimales !== undefined) propuesto.decimales = conFormato.formato.decimales;
  return propuesto;
}

// ---------------------------------------------------------------------------
// Conversión

/** Valor de una celda para una columna. `problema`: no se entendió y quedó vacía. */
export function convertirCelda(celda: Celda, columna: Columna, fechas: FormatoFecha = 'dia'): { valor: string | number | null; problema: boolean } {
  if (!celda) return { valor: null, problema: false };
  if (columna.tipo === 'texto') {
    let texto: string;
    if (celda.t === 's') texto = celda.v.trim();
    else if (celda.t === 'd') texto = formatearFecha(celda.v, fechas);
    else texto = celda.formato?.porcentaje ? `${numeroEditable(redondear(celda.v * 100))}%` : numeroEditable(redondear(celda.v));
    return { valor: texto === '' ? null : texto.slice(0, TOPES.celdaTexto), problema: false };
  }
  if (celda.t === 'n') return { valor: celda.formato?.porcentaje ? redondear(celda.v * 100) : celda.v, problema: false };
  if (celda.t === 'd') return { valor: null, problema: true };
  const numero = interpretarNumero(celda.v);
  if (numero === null) return { valor: null, problema: false };
  if (Number.isNaN(numero)) return { valor: null, problema: true };
  return { valor: numero, problema: false };
}

/** Qué columna del archivo llena cada columna del conjunto. */
export interface Mapeo {
  columna: Columna;
  /** Índice en la rejilla; null deja la columna vacía. */
  indice: number | null;
  fechas?: FormatoFecha;
}

export interface FilasArmadas {
  filas: Fila[];
  /** Celdas que no se entendieron: "fila|clave", con la fila ya en el resultado. */
  problemas: Set<string>;
  /** Filas con datos antes de aplicar el tope. */
  total: number;
}

/**
 * Filas del conjunto a partir de las filas de datos. Las filas que quedan sin
 * nada se saltan. Si pasan del tope, quedan las primeras o las últimas.
 */
export function armarFilas(datos: Celda[][], mapeo: Mapeo[], sobrantes: 'primeras' | 'ultimas' = 'primeras', tope: number = TOPES.filasPorMes): FilasArmadas {
  const filas: Fila[] = [];
  const problemasPorFila: string[][] = [];
  for (const celdas of datos) {
    const fila: Fila = {};
    const problemas: string[] = [];
    let alguno = false;
    for (const m of mapeo) {
      const { valor, problema } = m.indice === null ? { valor: null, problema: false } : convertirCelda(celdas[m.indice] ?? null, m.columna, m.fechas);
      fila[m.columna.clave] = valor;
      if (valor !== null) alguno = true;
      if (problema) problemas.push(m.columna.clave);
    }
    if (!alguno && !problemas.length) continue;
    filas.push(fila);
    problemasPorFila.push(problemas);
  }
  const total = filas.length;
  const desde = total > tope && sobrantes === 'ultimas' ? total - tope : 0;
  const hasta = Math.min(total, desde + tope);
  const problemas = new Set<string>();
  for (let i = desde; i < hasta; i++) for (const clave of problemasPorFila[i]) problemas.add(`${i - desde}|${clave}`);
  return { filas: filas.slice(desde, hasta), problemas, total };
}
