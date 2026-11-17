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
