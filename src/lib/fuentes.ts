// Tipos de letra de las diapositivas. Figtree es la de siempre (la que usa
// toda la herramienta y el estilo de Presente) y la que va por defecto.
// Las de @fontsource se instalan con la aplicación (no dependen de Google);
// el navegador solo descarga la que se usa. Ver "Tipos de letra" en PLAN.md.

export interface Fuente {
  clave: string;
  nombre: string;
  /** Valor de font-family. */
  css: string;
  grupo: 'Sin remates' | 'Con remates' | 'Del computador';
}

export const FUENTE_POR_DEFECTO = 'figtree';

export const FUENTES: Fuente[] = [
  { clave: 'figtree', nombre: 'Figtree (por defecto)', css: '"Figtree Variable", ui-sans-serif, system-ui, sans-serif', grupo: 'Sin remates' },
  { clave: 'inter', nombre: 'Inter', css: '"Inter Variable", sans-serif', grupo: 'Sin remates' },
  { clave: 'montserrat', nombre: 'Montserrat', css: '"Montserrat Variable", sans-serif', grupo: 'Sin remates' },
  { clave: 'poppins', nombre: 'Poppins', css: 'Poppins, sans-serif', grupo: 'Sin remates' },
  { clave: 'lato', nombre: 'Lato', css: 'Lato, sans-serif', grupo: 'Sin remates' },
  { clave: 'open-sans', nombre: 'Open Sans', css: '"Open Sans Variable", sans-serif', grupo: 'Sin remates' },
  { clave: 'roboto', nombre: 'Roboto', css: '"Roboto Variable", sans-serif', grupo: 'Sin remates' },
  { clave: 'nunito', nombre: 'Nunito', css: '"Nunito Variable", sans-serif', grupo: 'Sin remates' },
  { clave: 'raleway', nombre: 'Raleway', css: '"Raleway Variable", sans-serif', grupo: 'Sin remates' },
  { clave: 'dm-sans', nombre: 'DM Sans', css: '"DM Sans Variable", sans-serif', grupo: 'Sin remates' },
  { clave: 'manrope', nombre: 'Manrope', css: '"Manrope Variable", sans-serif', grupo: 'Sin remates' },
  { clave: 'source-serif', nombre: 'Source Serif', css: '"Source Serif 4 Variable", Georgia, serif', grupo: 'Con remates' },
  { clave: 'merriweather', nombre: 'Merriweather', css: '"Merriweather Variable", Georgia, serif', grupo: 'Con remates' },
  { clave: 'lora', nombre: 'Lora', css: '"Lora Variable", Georgia, serif', grupo: 'Con remates' },
  { clave: 'playfair', nombre: 'Playfair Display', css: '"Playfair Display Variable", Georgia, serif', grupo: 'Con remates' },
  { clave: 'arial', nombre: 'Arial', css: 'Arial, Helvetica, sans-serif', grupo: 'Del computador' },
  { clave: 'calibri', nombre: 'Calibri (si el computador la tiene)', css: 'Calibri, Carlito, Arial, sans-serif', grupo: 'Del computador' },
  { clave: 'georgia', nombre: 'Georgia', css: 'Georgia, "Times New Roman", serif', grupo: 'Del computador' },
];

export const CLAVES_FUENTE = FUENTES.map((f) => f.clave) as [string, ...string[]];

const POR_CLAVE = new Map(FUENTES.map((f) => [f.clave, f]));

/** font-family de una clave; la de por defecto si no existe. */
export function fuenteCss(clave: string | undefined): string {
  return (POR_CLAVE.get(clave ?? FUENTE_POR_DEFECTO) ?? POR_CLAVE.get(FUENTE_POR_DEFECTO)!).css;
}
