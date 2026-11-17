// Escritor mínimo de archivos .xlsx, para el respaldo en Excel (etapa 5).
//
// Un .xlsx es un zip con archivos XML. Aquí se arma con `fflate` (la misma
// librería que usa el lector) y solo lo necesario: textos en línea, números
// con formato, encabezado en negrita y fijo, y ancho de columnas.
//
// No depende de React ni del DOM, para poder probarlo en Node.

import { strToU8, zipSync } from 'fflate';

/** Formato de un número. `porcentaje` recibe 14.5 y lo guarda como 14,5 %. */
export interface FormatoCelda {
  tipo: 'numero' | 'porcentaje' | 'moneda';
  decimales?: number;
}

export type CeldaNueva = string | number | null | undefined | { valor: number; formato: FormatoCelda };

export interface HojaNueva {
  nombre: string;
  filas: CeldaNueva[][];
  /** La primera fila va en negrita y queda fija al bajar. */
  encabezado?: boolean;
  /** Ancho de cada columna, en caracteres. Si falta, se calcula. */
  anchos?: number[];
}

const TOPE_NOMBRE = 31;

/**
 * Nombre de hoja que Excel acepta: sin []:*?/\, sin apóstrofo al principio
 * o al final, hasta 31 caracteres y distinto de los ya usados (sin importar
 * mayúsculas).
 */
export function nombreDeHoja(deseado: string, usados: Set<string>): string {
  let base = deseado.replace(/[[\]:*?/\\]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^'+|'+$/g, '');
  if (!base) base = 'Hoja';
  base = base.slice(0, TOPE_NOMBRE).trim();
  let nombre = base;
  for (let i = 2; usados.has(nombre.toLowerCase()); i++) {
    const sufijo = ` (${i})`;
    nombre = base.slice(0, TOPE_NOMBRE - sufijo.length).trim() + sufijo;
  }
  usados.add(nombre.toLowerCase());
  return nombre;
}

/** "A", "B", ... "Z", "AA"... */
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

function escapar(texto: string): string {
  return texto
    // Caracteres de control que XML no admite.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Código de formato de Excel para un número. */
function codigoFormato(f: FormatoCelda): string {
  const decimales = Math.min(Math.max(f.decimales ?? (f.tipo === 'porcentaje' ? 2 : 0), 0), 10);
  const parte = decimales > 0 ? `.${'0'.repeat(decimales)}` : '';
  if (f.tipo === 'porcentaje') return `0${parte}%`;
  if (f.tipo === 'moneda') return `"$"\\ #,##0${parte}`;
  return `#,##0${parte}`;
}

/** Estilos del libro: 0 normal, 1 negrita, y uno por cada formato de número usado. */
class Estilos {
  private codigos: string[] = [];

  indice(f: FormatoCelda): number {
    const codigo = codigoFormato(f);
    let i = this.codigos.indexOf(codigo);
    if (i < 0) i = this.codigos.push(codigo) - 1;
    return 2 + i;
  }

  xml(): string {
    const formatos = this.codigos.map((c, i) => `<numFmt numFmtId="${164 + i}" formatCode="${escapar(c)}"/>`).join('');
    const xfs = this.codigos.map((_, i) => `<xf numFmtId="${164 + i}" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`).join('');
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      (this.codigos.length ? `<numFmts count="${this.codigos.length}">${formatos}</numFmts>` : '') +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      `<cellXfs count="${2 + this.codigos.length}">` +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      xfs +
      '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>'
    );
  }
}

/** Ancho aproximado que necesita lo que se ve en la celda. */
function largoVisible(celda: CeldaNueva): number {
  if (celda === null || celda === undefined) return 0;
  if (typeof celda === 'string') return Math.max(...celda.split('\n').map((l) => l.length));
  if (typeof celda === 'number') return String(celda).length + 2;
  return String(Math.round(celda.valor)).length + (celda.formato.decimales ?? 2) + 4;
}

function xmlHoja(hoja: HojaNueva, estilos: Estilos): string {
  const columnas = Math.max(0, ...hoja.filas.map((f) => f.length));
  const anchos = Array.from({ length: columnas }, (_, c) => {
    const dado = hoja.anchos?.[c];
    if (dado) return dado;
    const mayor = Math.max(0, ...hoja.filas.slice(0, 500).map((f) => largoVisible(f[c])));
    return Math.min(Math.max(mayor + 2, 8), 70);
  });

  const filas = hoja.filas.map((fila, f) => {
    const negrita = hoja.encabezado && f === 0;
    const celdas = fila.map((celda, c) => {
      const ref = `${letraColumna(c)}${f + 1}`;
      if (celda === null || celda === undefined || celda === '') return '';
      if (typeof celda === 'string') {
        return `<c r="${ref}" t="inlineStr"${negrita ? ' s="1"' : ''}><is><t xml:space="preserve">${escapar(celda)}</t></is></c>`;
      }
      if (typeof celda === 'number') {
        return Number.isFinite(celda) ? `<c r="${ref}"${negrita ? ' s="1"' : ''}><v>${celda}</v></c>` : '';
      }
      if (!Number.isFinite(celda.valor)) return '';
      // Excel guarda los porcentajes como fracción: 14,5 % es 0.145.
      const valor = celda.formato.tipo === 'porcentaje' ? Math.round(celda.valor * 1e10) / 1e12 : celda.valor;
      return `<c r="${ref}" s="${estilos.indice(celda.formato)}"><v>${valor}</v></c>`;
    });
    return `<row r="${f + 1}">${celdas.join('')}</row>`;
  });

  const fijo = hoja.encabezado && hoja.filas.length > 1
    ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
  const cols = columnas
    ? `<cols>${anchos.map((a, i) => `<col min="${i + 1}" max="${i + 1}" width="${a}" customWidth="1"/>`).join('')}</cols>`
    : '';

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    fijo +
    cols +
    `<sheetData>${filas.join('')}</sheetData>` +
    '</worksheet>'
  );
}

/** Arma el archivo .xlsx con las hojas dadas, en ese orden. */
export function escribirLibro(hojas: HojaNueva[]): Uint8Array {
  if (!hojas.length) throw new Error('El libro necesita al menos una hoja.');
  const usados = new Set<string>();
  const nombres = hojas.map((h) => nombreDeHoja(h.nombre, usados));
  const estilos = new Estilos();
  const archivos: Record<string, Uint8Array> = {};

  hojas.forEach((hoja, i) => {
    archivos[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(xmlHoja(hoja, estilos));
  });

  archivos['[Content_Types].xml'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      hojas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
      '</Types>',
  );
  archivos['_rels/.rels'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>',
  );
  archivos['xl/workbook.xml'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      `<sheets>${nombres.map((n, i) => `<sheet name="${escapar(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>` +
      '</workbook>',
  );
  archivos['xl/_rels/workbook.xml.rels'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      hojas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
      `<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      '</Relationships>',
  );
  // Los estilos van al final: se conocen después de escribir las hojas.
  archivos['xl/styles.xml'] = strToU8(estilos.xml());

  return zipSync(archivos, { level: 6 });
}
