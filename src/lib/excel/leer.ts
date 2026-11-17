// Lector de archivos de Excel (.xlsx, .xlsm) y CSV.
//
// Corre en el navegador: el archivo no se sube a ninguna parte. Un .xlsx es un
// zip con archivos XML; se descomprime con `fflate` y se leen solo las partes
// que hacen falta (hojas, textos compartidos y formatos de número). Ver
// "Diseño de la etapa 3" en PLAN.md.
//
// No depende de React ni del DOM, para poder probarlo en Node.

import { unzipSync } from 'fflate';

/** Formato de número de una celda, tal como lo trae Excel. */
export interface FormatoNumero {
  porcentaje?: boolean;
  moneda?: boolean;
  decimales?: number;
}

/**
 * Celda leída. `null` es una celda vacía, un error de Excel (#N/A) o una
 * fórmula sin valor calculado.
 * - n: número (`v` tal como lo guarda Excel: 14,5 % llega como 0.145).
 * - d: fecha, como "AAAA-MM-DD".
 * - s: texto (los valores lógicos llegan como "VERDADERO" o "FALSO").
 */
export type Celda =
  | { t: 'n'; v: number; formato?: FormatoNumero }
  | { t: 'd'; v: string }
  | { t: 's'; v: string }
  | null;

export interface Hoja {
  nombre: string;
  oculta: boolean;
  /** Filas de celdas, desde la fila 1. Las filas pueden tener largos distintos. */
  celdas: Celda[][];
  /** true si la hoja tenía más filas o columnas que los topes de lectura. */
  recortada: boolean;
}

export interface Libro {
  archivo: string;
  hojas: Hoja[];
}

export const TOPES_LECTURA = {
  bytes: 30 * 1024 * 1024,
  filas: 20_000,
  columnas: 256,
} as const;

/** Error con un mensaje para mostrar tal cual a la persona. */
export class ArchivoNoLegible extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ArchivoNoLegible';
  }
}

const GUARDAR_COMO = 'Ábrelo en Excel y guárdalo como "Libro de Excel (.xlsx)", y vuelve a cargarlo.';

/** Lee un archivo. `nombre` es el nombre del archivo (decide si es CSV). */
export function leerArchivo(nombre: string, bytes: Uint8Array): Libro {
  if (bytes.length > TOPES_LECTURA.bytes) {
    throw new ArchivoNoLegible(`El archivo pesa ${Math.round(bytes.length / 1024 / 1024)} MB y el máximo es ${TOPES_LECTURA.bytes / 1024 / 1024} MB.`);
  }
  if (bytes.length === 0) throw new ArchivoNoLegible('El archivo está vacío.');
  const extension = /\.([^.]+)$/.exec(nombre)?.[1]?.toLowerCase() ?? '';

  // Los zip empiezan con "PK".
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    if (extension === 'ods') throw new ArchivoNoLegible(`Es un archivo de LibreOffice (.ods). ${GUARDAR_COMO}`);
    if (extension === 'xlsb') throw new ArchivoNoLegible(`Es un libro binario de Excel (.xlsb). ${GUARDAR_COMO}`);
    return { archivo: nombre, hojas: leerXlsx(bytes) };
  }
  // Los .xls de antes de 2007 y los .xlsx con clave son archivos "OLE".
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    throw new ArchivoNoLegible(`Es un Excel antiguo (.xls) o un archivo protegido con clave. ${GUARDAR_COMO}`);
  }
  if (['csv', 'txt', 'tsv'].includes(extension)) return { archivo: nombre, hojas: [leerCsv(nombre, bytes)] };
  throw new ArchivoNoLegible('No es un archivo de Excel (.xlsx) ni un CSV.');
}

// ---------------------------------------------------------------------------
// XML
//
// Los XML de un .xlsx los escriben programas, no personas: alcanza con
// expresiones regulares sobre las pocas etiquetas que se leen. Algunos
// programas les ponen prefijo ("x:c"), así que se acepta cualquiera.

const P = '(?:[A-Za-z_][\\w.-]*:)?';

function decodificar(texto: string): string {
  return texto
    .replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|(amp|lt|gt|quot|apos));/g, (_, hex, dec, nombre) => {
      if (hex) return String.fromCodePoint(parseInt(hex, 16));
      if (dec) return String.fromCodePoint(parseInt(dec, 10));
      return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[nombre as 'amp'];
    })
    // Excel escribe algunos caracteres de control como _x000D_.
    .replace(/_x([0-9a-fA-F]{4})_/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function atributos(texto: string): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const m of texto.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    const nombre = m[1].includes(':') && !m[1].startsWith('xmlns') ? m[1].slice(m[1].indexOf(':') + 1) : m[1];
    resultado[nombre] = decodificar(m[2] ?? m[3]);
  }
  return resultado;
}

const expresiones = new Map<string, RegExp>();

/** Recorre las etiquetas `nombre`: atributos y contenido (vacío si se cierran solas). */
function* etiquetas(xml: string, nombre: string): Generator<{ attrs: Record<string, string>; dentro: string }> {
  let re = expresiones.get(nombre);
  if (!re) {
    re = new RegExp(`<${P}${nombre}(?=[\\s/>])([^>]*?)(?:/>|>([\\s\\S]*?)</${P}${nombre}>)`, 'g');
    expresiones.set(nombre, re);
  }
  // matchAll trabaja sobre una copia de la expresión: se puede compartir.
  for (const m of xml.matchAll(re)) yield { attrs: atributos(m[1]), dentro: m[2] ?? '' };
}

/** Texto de todas las etiquetas <t> (sin las guías fonéticas <rPh>). */
function textoDe(xml: string): string {
  const limpio = xml.replace(new RegExp(`<${P}rPh\\b[\\s\\S]*?</${P}rPh>`, 'g'), '');
  let texto = '';
  for (const t of etiquetas(limpio, 't')) texto += decodificar(t.dentro);
  return texto;
}

// ---------------------------------------------------------------------------
// .xlsx

function leerXlsx(bytes: Uint8Array): Hoja[] {
  let partes: Record<string, Uint8Array>;
  try {
    partes = unzipSync(bytes, {
      // Solo lo que se usa: no se descomprimen imágenes ni gráficos.
      filter: (f) => /^(\[Content_Types\]\.xml|_rels\/\.rels|xl\/.*\.(xml|rels))$/i.test(f.name.replace(/^\//, '')) && !/^xl\/(media|drawings|charts|pivot)/i.test(f.name),
    });
  } catch {
    throw new ArchivoNoLegible(`El archivo está dañado o no es un Excel. ${GUARDAR_COMO}`);
  }
  const decoder = new TextDecoder('utf-8');
  const porNombre = new Map(Object.entries(partes).map(([k, v]) => [k.replace(/^\//, '').toLowerCase(), v]));
  const leer = (ruta: string): string | null => {
    const parte = porNombre.get(ruta.replace(/^\//, '').toLowerCase());
    return parte ? decoder.decode(parte) : null;
  };

  // Dónde está el libro: lo dice _rels/.rels (casi siempre xl/workbook.xml).
  let rutaLibro = 'xl/workbook.xml';
  const raiz = leer('_rels/.rels');
  if (raiz) {
    for (const r of etiquetas(raiz, 'Relationship')) {
      if (/\/officeDocument$/.test(r.attrs.Type ?? '')) rutaLibro = resolver('', r.attrs.Target);
    }
  }
  const libro = leer(rutaLibro);
  if (!libro) {
    if (porNombre.has('word/document.xml')) throw new ArchivoNoLegible('Es un documento de Word, no un Excel.');
    if (porNombre.has('ppt/presentation.xml')) throw new ArchivoNoLegible('Es una presentación de PowerPoint, no un Excel.');
    throw new ArchivoNoLegible(`No encontré hojas en el archivo. ${GUARDAR_COMO}`);
  }
  const carpeta = rutaLibro.includes('/') ? rutaLibro.slice(0, rutaLibro.lastIndexOf('/') + 1) : '';
  const nombreRels = `${carpeta}_rels/${rutaLibro.slice(carpeta.length)}.rels`;

  // Relaciones del libro: id → archivo de la hoja; también textos y estilos.
  const destinos = new Map<string, { tipo: string; ruta: string }>();
  for (const r of etiquetas(leer(nombreRels) ?? '', 'Relationship')) {
    destinos.set(r.attrs.Id, { tipo: r.attrs.Type ?? '', ruta: resolver(carpeta, r.attrs.Target ?? '') });
  }
  const rutaDe = (sufijo: string, porDefecto: string) =>
    [...destinos.values()].find((d) => d.tipo.endsWith(sufijo))?.ruta ?? `${carpeta}${porDefecto}`;

  const textos = leerTextosCompartidos(leer(rutaDe('/sharedStrings', 'sharedStrings.xml')));
  const formatos = leerFormatos(leer(rutaDe('/styles', 'styles.xml')));
  const fecha1904 = /<(?:[\w]+:)?workbookPr\b[^>]*\bdate1904\s*=\s*"(1|true)"/i.test(libro);

  const hojas: Hoja[] = [];
  for (const h of etiquetas(libro, 'sheet')) {
    const destino = destinos.get(h.attrs.id);
    // Las hojas de gráfico y de macros no tienen celdas.
    if (!destino || !destino.tipo.endsWith('/worksheet')) continue;
    const xml = leer(destino.ruta);
    if (xml === null) continue;
    const { celdas, recortada } = leerHoja(xml, textos, formatos, fecha1904);
    hojas.push({ nombre: h.attrs.name ?? `Hoja ${hojas.length + 1}`, oculta: Boolean(h.attrs.state && h.attrs.state !== 'visible'), celdas, recortada });
  }
  if (!hojas.length) throw new ArchivoNoLegible('El archivo no tiene hojas con datos.');
  return hojas;
}

/** Ruta de un destino relativo a una carpeta del zip ("../x" incluido). */
function resolver(carpeta: string, destino: string): string {
  if (destino.startsWith('/')) return destino.slice(1);
  const partes = (carpeta + destino).split('/');
  const salida: string[] = [];
  for (const p of partes) {
    if (p === '..') salida.pop();
    else if (p !== '.' && p !== '') salida.push(p);
  }
  return salida.join('/');
}

function leerTextosCompartidos(xml: string | null): string[] {
  if (!xml) return [];
  return Array.from(etiquetas(xml, 'si'), (si) => textoDe(si.dentro));
}

// --- Formatos de número

/** Formatos que vienen incluidos en Excel (no aparecen en styles.xml). */
const FORMATOS_INCLUIDOS: Record<number, string> = {
  0: 'General', 1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00',
  5: '$#,##0_);($#,##0)', 6: '$#,##0_);[Red]($#,##0)', 7: '$#,##0.00_);($#,##0.00)', 8: '$#,##0.00_);[Red]($#,##0.00)',
  9: '0%', 10: '0.00%', 11: '0.00E+00', 12: '# ?/?', 13: '# ??/??',
  14: 'm/d/yyyy', 15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 18: 'h:mm AM/PM', 19: 'h:mm:ss AM/PM', 20: 'h:mm', 21: 'h:mm:ss', 22: 'm/d/yyyy h:mm',
  37: '#,##0_);(#,##0)', 38: '#,##0_);[Red](#,##0)', 39: '#,##0.00_);(#,##0.00)', 40: '#,##0.00_);[Red](#,##0.00)',
  45: 'mm:ss', 46: '[h]:mm:ss', 47: 'mmss.0', 48: '##0.0E+0', 49: '@',
};
/** Formatos incluidos de fecha según el idioma de Excel (chino, japonés, coreano). */
const FECHAS_INCLUIDAS = new Set([27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 50, 51, 52, 53, 54, 55, 56, 57, 58]);

type InfoFormato = { fecha: true } | { fecha: false; formato?: FormatoNumero };

function leerFormatos(xml: string | null): InfoFormato[] {
  if (!xml) return [];
  const propios = new Map<number, string>();
  for (const f of etiquetas(xml, 'numFmt')) propios.set(Number(f.attrs.numFmtId), f.attrs.formatCode ?? '');
  // Solo cellXfs: cellStyleXfs también tiene <xf> pero no son los de las celdas.
  const bloque = new RegExp(`<${P}cellXfs\\b[^>]*>([\\s\\S]*?)</${P}cellXfs>`).exec(xml)?.[1] ?? '';
  const cache = new Map<number, InfoFormato>();
  return Array.from(etiquetas(bloque, 'xf'), (xf) => {
    const id = Number(xf.attrs.numFmtId ?? 0);
    let info = cache.get(id);
    if (!info) {
      info = FECHAS_INCLUIDAS.has(id) ? { fecha: true } : analizarFormato(propios.get(id) ?? FORMATOS_INCLUIDOS[id] ?? 'General');
      cache.set(id, info);
    }
    return info;
  });
}

/** Qué dice un código de formato ("0.00%", "dd/mm/yyyy", "$ #,##0"...). */
export function analizarFormato(codigo: string): InfoFormato {
  if (/^general$/i.test(codigo.trim()) || codigo.trim() === '@') return { fecha: false };
  // La primera sección es la de los positivos.
  const seccion = partirSecciones(codigo)[0] ?? '';
  // Sin lo que va entre comillas, lo escapado y lo que va entre corchetes,
  // salvo las horas transcurridas ([h], [mm]).
  // Lo literal: entre comillas ("$") o escapado (\$).
  const literal = [...Array.from(seccion.matchAll(/"([^"]*)"/g), (m) => m[1]), ...Array.from(seccion.matchAll(/\\(.)/g), (m) => m[1])].join('');
  const corchetes = Array.from(seccion.matchAll(/\[([^\]]*)\]/g), (m) => m[1]);
  const limpio = seccion
    .replace(/"[^"]*"/g, '')
    .replace(/\\./g, '')
    .replace(/_./g, '')
    .replace(/\*./g, '')
    .replace(/\[(?![hms]+\])[^\]]*\]/gi, '');
  if (/[dmyhse]/i.test(limpio.replace(/\[[hms]+\]/gi, 'h')) && !/^[#0.,\s%]*E[+-]/i.test(limpio)) {
    // Fecha u hora. Las horas solas (h:mm) se dejan como número.
    if (/[dy]/i.test(limpio) || (/m/i.test(limpio) && !/[hs]/i.test(limpio))) return { fecha: true };
    return { fecha: false };
  }
  const formato: FormatoNumero = {};
  if (limpio.includes('%')) formato.porcentaje = true;
  // "$" suelto, entre comillas o como moneda de un idioma ([$$-240A], [$€-C0A]);
  // [$-409] solo dice el idioma.
  if (/[$€¤£]/.test(limpio) || /[$€¤£]/.test(literal) || corchetes.some((c) => /^\$[^-]/.test(c))) formato.moneda = true;
  const decimales = /\.([0#?]+)/.exec(limpio)?.[1].length;
  if (decimales !== undefined) formato.decimales = Math.min(decimales, 6);
  else if (/[0#]/.test(limpio)) formato.decimales = 0;
  return { fecha: false, formato: Object.keys(formato).length ? formato : undefined };
}

function partirSecciones(codigo: string): string[] {
  const secciones: string[] = [];
  let actual = '';
  let comillas = false;
  for (let i = 0; i < codigo.length; i++) {
    const c = codigo[i];
    if (c === '"') comillas = !comillas;
    if (c === '\\' && !comillas) {
      actual += c + (codigo[i + 1] ?? '');
      i++;
      continue;
    }
    if (c === ';' && !comillas) {
      secciones.push(actual);
      actual = '';
    } else {
      actual += c;
    }
  }
  secciones.push(actual);
  return secciones;
}

// --- Fechas

const DIA = 86_400_000;

/** Número de serie de Excel a "AAAA-MM-DD". */
export function fechaDeSerie(serie: number, fecha1904 = false): string | null {
  if (!Number.isFinite(serie) || serie < 0 || serie > 2_958_465) return null;
  const dias = Math.floor(serie + 1e-9);
  let ms: number;
  if (fecha1904) {
    ms = Date.UTC(1904, 0, 1) + dias * DIA;
  } else {
    // Excel cree que 1900 fue bisiesto: del 60 (29 de febrero de 1900, que no
    // existió) en adelante va un día corrido.
    if (dias === 0) return null;
    ms = Date.UTC(1899, 11, dias >= 61 ? 30 : 31) + dias * DIA;
  }
  return new Date(ms).toISOString().slice(0, 10);
}

// --- Hojas

/** "BC12" → { fila: 11, columna: 54 } (desde 0). */
function posicion(ref: string): { fila: number; columna: number } | null {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(ref);
  if (!m) return null;
  let columna = 0;
  for (const letra of m[1].toUpperCase()) columna = columna * 26 + (letra.charCodeAt(0) - 64);
  return { fila: Number(m[2]) - 1, columna: columna - 1 };
}

function leerHoja(xml: string, textos: string[], formatos: InfoFormato[], fecha1904: boolean): { celdas: Celda[][]; recortada: boolean } {
  const datos = new RegExp(`<${P}sheetData\\b[^>]*>([\\s\\S]*)</${P}sheetData>`).exec(xml)?.[1] ?? '';
  const celdas: Celda[][] = [];
  let recortada = false;
  let siguienteFila = 0;
  for (const fila of etiquetas(datos, 'row')) {
    const indiceFila = fila.attrs.r ? Number(fila.attrs.r) - 1 : siguienteFila;
    siguienteFila = indiceFila + 1;
    if (indiceFila >= TOPES_LECTURA.filas) {
      recortada = true;
      break;
    }
    let siguienteColumna = 0;
    const salida: Celda[] = [];
    for (const c of etiquetas(fila.dentro, 'c')) {
      const pos = c.attrs.r ? posicion(c.attrs.r) : null;
      const columna = pos ? pos.columna : siguienteColumna;
      siguienteColumna = columna + 1;
      if (columna >= TOPES_LECTURA.columnas) {
        recortada = true;
        continue;
      }
      const celda = leerCelda(c.attrs, c.dentro, textos, formatos, fecha1904);
      if (celda === null) continue;
      while (salida.length < columna) salida.push(null);
      salida[columna] = celda;
    }
    if (!salida.length) continue;
    while (celdas.length < indiceFila) celdas.push([]);
    celdas[indiceFila] = salida;
  }
  return { celdas, recortada };
}

const RE_V = new RegExp(`<${P}v\\b[^>]*>([\\s\\S]*?)</${P}v>`);
const RE_IS = new RegExp(`<${P}is\\b[^>]*>([\\s\\S]*?)</${P}is>`);

function leerCelda(attrs: Record<string, string>, dentro: string, textos: string[], formatos: InfoFormato[], fecha1904: boolean): Celda {
  const tipo = attrs.t ?? 'n';
  const v = RE_V.exec(dentro)?.[1];
  switch (tipo) {
    case 's': {
      const texto = v === undefined ? undefined : textos[Number(v)];
      return texto === undefined || texto.trim() === '' ? null : { t: 's', v: texto };
    }
    case 'inlineStr': {
      const is = RE_IS.exec(dentro)?.[1];
      const texto = is === undefined ? (v === undefined ? '' : decodificar(v)) : textoDe(is);
      return texto.trim() === '' ? null : { t: 's', v: texto };
    }
    case 'str': {
      const texto = v === undefined ? '' : decodificar(v);
      return texto.trim() === '' ? null : { t: 's', v: texto };
    }
    case 'b':
      return v === undefined ? null : { t: 's', v: v.trim() === '1' ? 'VERDADERO' : 'FALSO' };
    case 'e':
      return null;
    case 'd': {
      // Fecha ISO (archivos "strict"): se queda la parte del día.
      const fecha = v === undefined ? '' : decodificar(v).slice(0, 10);
      return /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? { t: 'd', v: fecha } : null;
    }
    default: {
      if (v === undefined || v.trim() === '') return null;
      const numero = Number(v);
      if (!Number.isFinite(numero)) return null;
      const info = formatos[Number(attrs.s ?? 0)];
      if (info?.fecha) {
        const fecha = fechaDeSerie(numero, fecha1904);
        return fecha ? { t: 'd', v: fecha } : { t: 'n', v: numero };
      }
      return info?.formato ? { t: 'n', v: numero, formato: info.formato } : { t: 'n', v: numero };
    }
  }
}

// ---------------------------------------------------------------------------
// CSV

function decodificarTexto(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  } catch {
    // Excel en español guarda los CSV en la codificación de Windows.
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

/** Separador que se repite igual en las primeras filas: ";", "," o tabulador. */
export function separadorCsv(texto: string): string {
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim() !== '').slice(0, 20);
  let mejor = ',';
  let puntaje = -1;
  for (const sep of [';', '\t', ',']) {
    const cuentas = lineas.map((l) => contarFuera(l, sep));
    const conSep = cuentas.filter((n) => n > 0);
    if (!conSep.length) continue;
    // Gana el que aparece en más líneas con la misma cantidad.
    const moda = Math.max(...Object.values(conSep.reduce<Record<number, number>>((a, n) => ({ ...a, [n]: (a[n] ?? 0) + 1 }), {})));
    if (moda > puntaje) {
      puntaje = moda;
      mejor = sep;
    }
  }
  return mejor;
}

function contarFuera(linea: string, sep: string): number {
  let n = 0;
  let comillas = false;
  for (const c of linea) {
    if (c === '"') comillas = !comillas;
    else if (c === sep && !comillas) n++;
  }
  return n;
}

function leerCsv(nombre: string, bytes: Uint8Array): Hoja {
  const texto = decodificarTexto(bytes);
  const sep = separadorCsv(texto);
  const celdas: Celda[][] = [];
  let recortada = false;
  let fila: Celda[] = [];
  let celda = '';
  let comillas = false;
  let inicio = true;
  const cerrarCelda = () => {
    if (fila.length < TOPES_LECTURA.columnas) fila.push(celda.trim() === '' ? null : { t: 's', v: celda.trim() });
    else recortada = true;
    celda = '';
    inicio = true;
  };
  const cerrarFila = () => {
    cerrarCelda();
    while (fila.length && fila[fila.length - 1] === null) fila.pop();
    celdas.push(fila);
    fila = [];
  };
  const t = texto.replace(/\r\n?/g, '\n');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (comillas) {
      if (c === '"' && t[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') {
        comillas = false;
      } else {
        celda += c;
      }
    } else if (c === '"' && inicio) {
      comillas = true;
      inicio = false;
    } else if (c === sep) {
      cerrarCelda();
    } else if (c === '\n') {
      cerrarFila();
      if (celdas.length >= TOPES_LECTURA.filas) {
        recortada = i < t.length - 1;
        break;
      }
    } else {
      celda += c;
      inicio = false;
    }
  }
  if (celda !== '' || fila.length) cerrarFila();
  const base = nombre.replace(/\.[^.]+$/, '') || 'Hoja 1';
  return { nombre: base.slice(0, 100), oculta: false, celdas, recortada };
}
