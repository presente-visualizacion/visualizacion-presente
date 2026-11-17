import type { Tema } from './tipos';

// Colores tomados del logo de Presente (degradado) y del magenta que ya usaba
// la presentación original. El orden de `series` está validado para daltonismo
// y contraste sobre blanco; no reordenar sin volver a validar.
export const TEMA_PRESENTE: Tema = {
  primario: '#D4145A',
  degradado: ['#AC004A', '#D50058', '#FF0065', '#FF4769', '#FF8E6E'],
  series: ['#D4145A', '#2274C4', '#E36A0B', '#0B9B7A', '#8250D6', '#A1790F'],
  neutro: '#B9C3CF',
  logo: '/logo-presente-blanco.png',
};

export function degradadoCss(tema: Tema, direccion = 'to bottom'): string {
  return `linear-gradient(${direccion}, ${tema.degradado.join(', ')})`;
}
