// Piezas que comparten los dibujos de gráficos (Grafico.tsx y GraficosEspeciales.tsx).

import type { BloqueGrafico, Columna, ConjuntoDatos, Fila, Tema } from '@/lib/tipos';

export const TINTA = '#241A20';
export const SUAVE = '#675C63';
export const LINEA = '#ECE7EA';
export const BLANCO = '#FFFFFF';

export interface PropsGrafico {
  bloque: BloqueGrafico;
  conjunto: ConjuntoDatos;
  filas: Fila[];
  tema: Tema;
}

export interface SerieLista {
  clave: string;
  nombre: string;
  color: string;
  columna?: Columna;
  /** Solo en el combinado. */
  tipo?: 'barras' | 'lineas';
  punteada?: boolean;
}

/** Trazo de una línea punteada. */
export const PUNTEADA = '7 6';

/** Parte una etiqueta en a lo sumo `lineas` renglones que quepan en `ancho` px. */
export function partirTexto(texto: string, tamano: number, ancho: number, lineas = 2): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const renglones: string[] = [];
  let actual = '';
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && anchoTexto(prueba, tamano) > ancho) {
      renglones.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) renglones.push(actual);
  if (renglones.length <= lineas) return renglones;
  const resto = renglones.slice(lineas - 1).join(' ');
  return [...renglones.slice(0, lineas - 1), resto.length > 18 ? `${resto.slice(0, 17)}…` : resto];
}

export function reducirMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Recharts mide el texto ya escalado por el lienzo y se queda corto, así que
// el ancho de los ejes se calcula aquí, en px del lienzo.
let pincel: CanvasRenderingContext2D | null = null;
export function anchoTexto(texto: string, tamano: number, peso = 400): number {
  const estimado = texto.length * tamano * 0.58;
  if (typeof document === 'undefined') return estimado;
  pincel ??= document.createElement('canvas').getContext('2d');
  if (!pincel) return estimado;
  pincel.font = `${peso} ${tamano}px "Figtree Variable", sans-serif`;
  return pincel.measureText(texto).width * 1.06;
}

/** Marcas del eje: sin decimales de relleno ("9,5%" y no "9,50%"). */
export function marcaEje(valor: number, columna?: Columna): string {
  const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(valor);
  if (columna?.tipo === 'porcentaje') return `${numero}%`;
  if (columna?.tipo === 'moneda') return `$${numero}`;
  return numero;
}


export const ejeValores = { tick: { fontSize: 15, fill: SUAVE }, axisLine: false, tickLine: false } as const;
export const ejeCategorias = { tick: { fontSize: 15, fill: SUAVE }, axisLine: { stroke: LINEA }, tickLine: false } as const;

/** Muestra de color de una leyenda que no se puede ocultar. */
export function Muestra({ color, nombre, linea = false }: { color: string; nombre: React.ReactNode; linea?: boolean }) {
  return (
    <li className="flex items-center gap-[9px]">
      <span aria-hidden className={linea ? 'h-[4px] w-[18px] rounded-full' : 'h-[12px] w-[12px] rounded-[3px]'} style={{ background: color }} />
      {nombre}
    </li>
  );
}

/** Recuadro del globo (lo que aparece al pasar el mouse). */
export function CajaGlobo({ titulo, children }: { titulo?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-[220px] rounded-[10px] border border-linea-fuerte bg-white px-[16px] py-[12px] text-[15px] shadow-[0_8px_24px_-8px_rgba(36,26,32,0.25)]">
      {titulo !== undefined && <p className="mb-[8px] text-[16px] font-semibold text-tinta">{titulo}</p>}
      <table className="w-full"><tbody>{children}</tbody></table>
    </div>
  );
}

export function FilaGlobo({ nombre, valor, color, fuerte = true }: { nombre: React.ReactNode; valor: React.ReactNode; color?: string; fuerte?: boolean }) {
  return (
    <tr>
      <td className="py-[2px] pr-[20px] text-tinta-suave">
        {color && <span aria-hidden className="mr-[8px] inline-block h-[10px] w-[10px] rounded-[2px] align-baseline" style={{ background: color }} />}
        {nombre}
      </td>
      <td className={`py-[2px] text-right text-tinta ${fuerte ? 'font-semibold' : ''}`}>{valor}</td>
    </tr>
  );
}
