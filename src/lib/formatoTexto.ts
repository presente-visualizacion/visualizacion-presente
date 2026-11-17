// Formato dentro de una línea de texto: **negrita** y {color:palabras}.
//
// El color va con su nombre ({azul:así}) o en hexadecimal ({#1A3D7C:así}).
// Vale en textos, tarjetas y títulos de diapositiva. `{mes}` no lleva dos
// puntos, así que no se confunde.

/** Colores con nombre para escribir {nombre:texto}. Los de las series del tema de Presente. */
export const COLORES_TEXTO: { nombre: string; color: string }[] = [
  { nombre: 'magenta', color: '#D4145A' },
  { nombre: 'azul', color: '#2274C4' },
  { nombre: 'naranja', color: '#E36A0B' },
  { nombre: 'verde', color: '#0B9B7A' },
  { nombre: 'morado', color: '#8250D6' },
  { nombre: 'dorado', color: '#A1790F' },
  { nombre: 'rojo', color: '#B42318' },
  { nombre: 'gris', color: '#675C63' },
];

const POR_NOMBRE = new Map(COLORES_TEXTO.map((c) => [c.nombre, c.color]));
const RE_COLOR = /\{(#[0-9A-Fa-f]{6}|[a-záéíóúñ]+)\s*:\s*([^{}]+?)\}/g;

export interface Trozo {
  texto: string;
  negrita: boolean;
  color?: string;
}

function colorDe(clave: string): string | undefined {
  return clave.startsWith('#') ? clave : POR_NOMBRE.get(clave.toLowerCase());
}

function negritas(texto: string, color: string | undefined, negritaAfuera: boolean): Trozo[] {
  return texto.split(/\*\*(.+?)\*\*/g)
    .map((t, i) => ({ texto: t, negrita: negritaAfuera || i % 2 === 1, ...(color ? { color } : {}) }))
    .filter((t) => t.texto);
}

/** Trozos de una línea con su negrita y su color. */
export function trozos(texto: string): Trozo[] {
  // Primero la negrita de afuera (**{azul:x}**), luego los colores, y dentro de cada color, negritas.
  const salida: Trozo[] = [];
  texto.split(/\*\*(.+?)\*\*/g).forEach((parte, i) => {
    const negrita = i % 2 === 1;
    let ultimo = 0;
    for (const m of parte.matchAll(RE_COLOR)) {
      const color = colorDe(m[1]);
      if (!color) continue;
      salida.push(...negritas(parte.slice(ultimo, m.index), undefined, negrita));
      salida.push(...negritas(m[2], color, negrita));
      ultimo = m.index + m[0].length;
    }
    salida.push(...negritas(parte.slice(ultimo), undefined, negrita));
  });
  return salida;
}

/** El texto sin las marcas de formato, para listas y nombres de archivo. */
export function sinFormato(texto: string): string {
  return trozos(texto).map((t) => t.texto).join('');
}

/** Envuelve `seleccion` con el color: {azul:seleccion}. */
export function conColor(seleccion: string, nombreOHex: string): string {
  return `{${nombreOHex}:${seleccion}}`;
}
