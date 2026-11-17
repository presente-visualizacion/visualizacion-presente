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
  /** En tablas: encabezado agrupado que va sobre esta columna ("Vivienda VIS"). */
  grupo?: string;
  /** En tablas: "+" delante de los positivos, en verde; los negativos en rojo. */
  signo?: boolean;
}

export type Fila = Record<string, string | number | null>;

/** Cómo se muestra una fecha leída de Excel: "31/10/2026", "Oct 26" o "2026". */
export type FormatoFecha = 'dia' | 'mes' | 'anio';

/**
 * De dónde salieron los datos la última vez que se cargaron desde Excel. Se
 * recuerda para proponer lo mismo con el archivo del mes siguiente (ver
 * "Diseño de la etapa 3" en PLAN.md).
 */
export interface OrigenExcel {
  /** Nombre del último archivo cargado, solo para mostrarlo. */
  archivo: string;
  hoja: string;
  /** Encabezados en una fila (lo normal) o en una columna. */
  orientacion: 'filas' | 'columnas';
  /** Número de esa fila o columna, desde 1 como en Excel. */
  encabezados: number;
  /** De qué encabezado del archivo sale cada columna del conjunto. */
  columnas: { clave: string; encabezado: string; fechas?: FormatoFecha }[];
  /** Leer hasta la primera fila vacía o todas las filas. */
  hasta: 'vacia' | 'final';
  /** Dar vuelta el orden de las filas. */
  invertir?: boolean;
  /** Si hay más filas que el tope: cuáles se quedan. */
  sobrantes?: 'primeras' | 'ultimas';
  /** Fecha y hora de la última carga (ISO). */
  cargado: string;
  /** Mes en que se cargó; null si los datos son iguales en todos los meses. */
  periodo: IdPeriodo | null;
}

export interface ConjuntoDatos {
  id: string;
  nombre: string;
  columnas: Columna[];
  /** true: hay un juego de filas por mes. false: las mismas filas en todos los meses. */
  porPeriodo: boolean;
  filas?: Fila[];
  filasPorPeriodo?: Record<IdPeriodo, Fila[]>;
  /** Configuración de la última carga desde Excel (etapa 3). */
  origen?: OrigenExcel;
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
  /** Línea punteada (en líneas, área y las líneas del combinado). */
  punteada?: boolean;
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

/** Lo que comparten todos los bloques. */
interface BaseBloque {
  id: string;
  /** Encabezado chico arriba del bloque. Admite {mes}. */
  titulo?: string;
  /** Texto chico debajo del bloque (fuentes, aclaraciones). Admite {mes}. */
  nota?: string;
}

export interface BloqueGrafico extends BaseBloque {
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
  /** Columna que se escribe debajo de cada categoría del eje ("TPP 18,29%"). */
  detalleEje?: string;
}

/**
 * Columna que la tabla calcula y muestra justo después de `columna`:
 * - variacion: el valor del mes menos el del mes anterior que tenga datos,
 *   para la misma fila (misma sección y mismo primer texto).
 * - posicion: 1, 2, 3... dentro de la sección; 'asc' (lo normal) = el menor es 1.
 */
export interface ColumnaCalculada {
  tipo: 'variacion' | 'posicion';
  columna: string;
  orden?: 'asc' | 'desc';
}

export interface BloqueTabla extends BaseBloque {
  tipo: 'tabla';
  datos: string;
  /** Columnas a mostrar, en orden. Si falta, se muestran todas. */
  columnas?: string[];
  resaltar?: Resaltado;
  /** Columna de texto que agrupa las filas: se muestra como fila de título de cada grupo. */
  secciones?: string;
  calculadas?: ColumnaCalculada[];
}

export interface BloqueTexto extends BaseBloque {
  tipo: 'texto';
  /**
   * Párrafos separados por línea en blanco; las líneas que empiezan con "- "
   * son viñetas y las que empiezan con "# ", letra grande. **así** es negrita.
   */
  contenido: PorPeriodo<string>;
}

/** Qué fila de un conjunto: la primera, la última o la que tenga ese valor en esa columna. */
export type SelectorFila = 'primera' | 'ultima' | { columna: string; valor: string };

/** De dónde sale el valor de una cifra cuando no se escribe a mano. */
export interface FuenteCifra {
  conjunto: string;
  columna: string;
  fila: SelectorFila;
  /** Columna de la misma fila que va como detalle (por ejemplo, el mes). */
  detalle?: string;
  /** El detalle muestra la diferencia contra esta otra fila, seguida del detalle escrito. */
  comparar?: SelectorFila;
}

export interface Cifra {
  etiqueta: string;
  /** Lo que se muestra; con `desde`, lo que se muestra si los datos no lo tienen. */
  valor: string;
  detalle?: string;
  desde?: FuenteCifra;
}

export interface BloqueCifras extends BaseBloque {
  tipo: 'cifras';
  cifras: PorPeriodo<Cifra[]>;
}

export interface Tarjeta {
  titulo: string;
  texto: string;
}

/** Recuadros con título y texto, lado a lado (o uno debajo del otro si no caben). */
export interface BloqueTarjetas extends BaseBloque {
  tipo: 'tarjetas';
  tarjetas: PorPeriodo<Tarjeta[]>;
}

export type Bloque = BloqueGrafico | BloqueTabla | BloqueTexto | BloqueCifras | BloqueTarjetas;

/**
 * Cómo se reparten los bloques en la diapositiva:
 * - una: el primer bloque ocupa todo.
 * - columnas: todos los bloques lado a lado.
 * - filas: uno debajo del otro; el último ocupa el espacio restante.
 * - principal-lateral: el primero a dos tercios, los demás apilados a la derecha.
 * - cuadricula: dos columnas; los bloques se reparten en filas del mismo alto.
 */
export type Disposicion = 'una' | 'columnas' | 'filas' | 'principal-lateral' | 'cuadricula';

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
