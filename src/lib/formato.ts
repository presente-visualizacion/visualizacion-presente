import type { Columna } from './tipos';

const cache = new Map<string, Intl.NumberFormat>();

function formateador(decimales: number, compacto: boolean): Intl.NumberFormat {
  const clave = `${decimales}|${compacto}`;
  let f = cache.get(clave);
  if (!f) {
    f = new Intl.NumberFormat('es-CO', compacto
      ? { notation: 'compact', maximumFractionDigits: 1 }
      : { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
    cache.set(clave, f);
  }
  return f;
}

function decimalesDe(columna: Columna | undefined): number {
  if (columna?.decimales !== undefined) return columna.decimales;
  return columna?.tipo === 'porcentaje' ? 2 : 0;
}

/** Valor listo para mostrar: "12,25%", "$462.520", "4.930" o "—" si no hay dato. */
export function formatear(valor: unknown, columna?: Columna, opciones: { compacto?: boolean } = {}): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor !== 'number') return String(valor);
  const numero = formateador(decimalesDe(columna), Boolean(opciones.compacto)).format(valor);
  if (columna?.tipo === 'porcentaje') return `${numero}%`;
  if (columna?.tipo === 'moneda') return `$${numero}`;
  return numero;
}

/**
 * Lee un número escrito o pegado desde Excel en formato colombiano.
 * Devuelve null si está vacío y NaN si no se entiende.
 *
 * - Quita `$`, `%` y espacios. Un guion solo ("-", "—") cuenta como vacío.
 * - Con punto y coma, el que aparece de último es el decimal: "1.234,56" y
 *   "1,234.56" dan 1234.56.
 * - Solo coma: es decimal ("14,5"); varias comas son miles ("1,234,567").
 * - Solo puntos: si forman grupos de tres son miles ("1.234.567"); si no, el
 *   punto es decimal ("0.5").
 * - Negativos con "-" o entre paréntesis.
 */
export function interpretarNumero(texto: string): number | null {
  let t = texto.replace(/[\s  $%]/g, '');
  if (t === '' || /^[-–—]+$/.test(t)) return null;

  let signo = 1;
  const entreParentesis = /^\((.*)\)$/.exec(t);
  if (entreParentesis) {
    signo = -1;
    t = entreParentesis[1];
  } else if (/^[-−–]/.test(t)) {
    signo = -1;
    t = t.slice(1);
  } else if (t.startsWith('+')) {
    t = t.slice(1);
  }

  const puntos = t.split('.').length - 1;
  const comas = t.split(',').length - 1;
  if (puntos && comas) {
    const decimal = t.lastIndexOf(',') > t.lastIndexOf('.') ? ',' : '.';
    const miles = decimal === ',' ? '.' : ',';
    if (t.split(decimal).length - 1 > 1) return NaN;
    t = t.split(miles).join('').replace(decimal, '.');
  } else if (comas === 1) {
    t = t.replace(',', '.');
  } else if (comas > 1) {
    if (!/^\d{1,3}(,\d{3})+$/.test(t)) return NaN;
    t = t.split(',').join('');
  } else if (puntos > 1 || /^\d{1,3}\.\d{3}$/.test(t)) {
    if (!/^\d{1,3}(\.\d{3})+$/.test(t)) return NaN;
    t = t.split('.').join('');
  }

  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
  return signo * Number(t);
}

/** Número como se escribe en una celda editable: coma decimal, sin miles. */
export function numeroEditable(valor: number): string {
  return String(valor).replace('.', ',');
}
