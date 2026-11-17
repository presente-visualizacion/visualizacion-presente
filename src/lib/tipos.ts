// Modelo de datos de Visualización Presente.
//
// Una presentación tiene una estructura compartida (diapositivas y bloques) y
// datos que pueden variar por período (mes). La barra de meses solo cambia qué
// período se muestra; la estructura es la misma en todos.

/** Identificador de período con forma "AAAA-MM", por ejemplo "2026-09". */
export type IdPeriodo = string;

export interface Tema {
  /** Color principal de marca (títulos, mes activo, serie destacada). */
  primario: string;
  /** Degradado de marca, de arriba hacia abajo. */
  degradado: string[];
  /** Colores de las series de los gráficos, en orden fijo. */
  series: string[];
  /** Color de las barras o filas que no están destacadas. */
  neutro: string;
  /** Logo blanco con fondo transparente (se muestra sobre el degradado). */
  logo: string;
}

export type TipoColumna = 'texto' | 'numero' | 'porcentaje' | 'moneda';

export interface Columna {
  clave: string;
  nombre: string;
  tipo: TipoColumna;
  decimales?: number;
  /** Texto que acompaña al valor, por ejemplo "millones". */
  unidad?: string;
}

export type Fila = Record<string, string | number | null>;

export interface ConjuntoDatos {
  id: string;
  nombre: string;
  columnas: Columna[];
  /** true: hay un juego de filas por mes. false: las mismas filas en todos los meses. */
  porPeriodo: boolean;
  filas?: Fila[];
  filasPorPeriodo?: Record<IdPeriodo, Fila[]>;
}

/** Valor que puede ser único o distinto en cada mes. */
export interface PorPeriodo<T> {
  porPeriodo: boolean;
  valor?: T;
  valores?: Record<IdPeriodo, T>;
}

export interface Serie {
  /** Clave de la columna del conjunto de datos. */
  clave: string;
  /** Color fijo para esta serie. Si falta, se toma del tema según su posición. */
  color?: string;
  /** Solo en el gráfico combinado: si la serie va en barras o en línea. */
  tipo?: 'barras' | 'lineas';
}

export interface Resaltado {
  columna: string;
  valor: string;
}

/**
 * Qué usa cada forma (ver "Tipos de gráfico" en PLAN.md):
 * - lineas, barras, barrasHorizontales, area, radar: eje de categorías y una o más series.
 * - combinado: como barras, pero cada serie dice si va en barras o en línea; misma escala.
 * - circular: el eje nombra las porciones; una serie con los valores.
 * - dispersion: eje numérico (horizontal) y una serie (vertical); `nombres` nombra los puntos.
 * - cascada: el eje es el concepto; una serie con la variación de cada fila.
 */
export type FormaGrafico =
  | 'lineas' | 'barras' | 'barrasHorizontales' | 'area'
  | 'combinado' | 'circular' | 'dispersion' | 'radar' | 'cascada';

export interface BloqueGrafico {
  id: string;
  tipo: 'grafico';
  datos: string;
  forma: FormaGrafico;
  ejeX: string;
  series: Serie[];
  apilado?: boolean;
  /** Muestra el valor en la punta de cada barra. */
  etiquetas?: boolean;
  /** Pinta con el color principal las barras cuya columna tenga ese valor. */
  resaltar?: Resaltado;
  /** Cascada: agrega al final una barra con la suma. */
  total?: boolean;
  /** Dispersión: columna de texto con el nombre de cada punto. */
  nombres?: string;
}

export interface BloqueTabla {
  id: string;
  tipo: 'tabla';
  datos: string;
  /** Columnas a mostrar, en orden. Si falta, se muestran todas. */
  columnas?: string[];
  resaltar?: Resaltado;
}

export interface BloqueTexto {
  id: string;
  tipo: 'texto';
  /** Párrafos separados por línea en blanco; las líneas que empiezan con "- " son viñetas. */
  contenido: PorPeriodo<string>;
}

export interface Cifra {
  etiqueta: string;
  valor: string;
  detalle?: string;
}

export interface BloqueCifras {
  id: string;
  tipo: 'cifras';
  cifras: PorPeriodo<Cifra[]>;
}

export type Bloque = BloqueGrafico | BloqueTabla | BloqueTexto | BloqueCifras;

/**
 * Cómo se reparten los bloques en la diapositiva:
 * - una: el primer bloque ocupa todo.
 * - columnas: todos los bloques lado a lado.
 * - filas: uno debajo del otro; el último ocupa el espacio restante.
 * - principal-lateral: el primero a dos tercios, los demás apilados a la derecha.
 */
export type Disposicion = 'una' | 'columnas' | 'filas' | 'principal-lateral';

export interface Diapositiva {
  id: string;
  tipo: 'portada' | 'contenido' | 'cierre';
  /** Admite {mes}, que se reemplaza por el mes seleccionado ("Septiembre 2026"). */
  titulo: string;
  subtitulo?: string;
  disposicion?: Disposicion;
  bloques: Bloque[];
}

export interface Presentacion {
  /** Versión del formato, para poder migrarlo más adelante. */
  formato: 1;
  id: string;
  nombre: string;
  descripcion?: string;
  tema: Tema;
  /** Meses disponibles, ordenados del más antiguo al más reciente. */
  periodos: IdPeriodo[];
  diapositivas: Diapositiva[];
  datos: Record<string, ConjuntoDatos>;
  actualizado: string;
}

export interface ResumenPresentacion {
  id: string;
  nombre: string;
  descripcion?: string;
  periodos: IdPeriodo[];
  diapositivas: number;
  actualizado: string;
}
