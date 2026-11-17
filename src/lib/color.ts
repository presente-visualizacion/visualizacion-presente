// Contraste entre colores (fórmula de WCAG 2), para avisar cuando un color del
// tema se lee mal sobre el fondo blanco.

function canal(valor: number): number {
  const c = valor / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminancia(hex: string): number {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}

/** Contraste entre dos colores, de 1 (iguales) a 21 (negro sobre blanco). */
export function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Lo mínimo para gráficos y elementos gráficos sobre blanco (WCAG 1.4.11). */
export const CONTRASTE_MINIMO = 3;

export const esColor = (texto: string) => /^#[0-9A-Fa-f]{6}$/.test(texto);
