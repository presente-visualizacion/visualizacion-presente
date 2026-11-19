// Operaciones de edición.
//
// Cada cambio que hace una persona en el editor es una operación pequeña
// ("este es el título de esta diapositiva", "estas son las filas de octubre de
// este conjunto"). El navegador las aplica al instante para mostrar el
// resultado y las envía al servidor, que las aplica con esta misma función
// sobre la versión más reciente de la presentación.
//
// Reglas (ver "Operaciones de edición" en PLAN.md):
// 1. Todas son del tipo "dejar este valor": aplicarlas dos veces da lo mismo.
// 2. Los destinos se nombran por id, nunca por posición.
// 3. Lo más fino que se guarda es el valor de un bloque o las filas de un
//    conjunto en un mes.
//
// Este archivo no depende de React ni de la base de datos.

import { interpretarNumero, numeroEditable } from '../formato';
import { marcadaFina, migrarDiapositiva } from '../rejilla';
import type {
  Bloque, BloqueGrafico, BloqueTabla, Cifra, Columna, ConjuntoDatos, Diapositiva, DiapositivaGuardada, Disposicion, Fila, IdPeriodo,
  FondoBloque, OrigenExcel, PorPeriodo, Presentacion, SelectorFila, Tarjeta, Tema, TipoColumna, Ubicacion,
} from '../tipos';

/**
 * El título y la nota van por `bloque.marco`, y el fondo y la ubicación por
 * `bloque.aspecto`; no por la configuración del gráfico o la tabla.
 */
type Marco = 'id' | 'tipo' | 'titulo' | 'nota' | 'fondo' | 'ubicacion' | 'colorFondo' | 'colorTexto' | 'fuente' | 'letra';
export type ConfigGrafico = Omit<BloqueGrafico, Marco>;
export type ConfigTabla = Omit<BloqueTabla, Marco>;

export type Operacion =
  | { op: 'presentacion.nombre'; valor: string }
  /** '' quita la descripción. */
  | { op: 'presentacion.descripcion'; valor: string }
  | { op: 'diapositiva.titulo'; diapositiva: string; valor: string }
  /** '' quita el subtítulo. */
  | { op: 'diapositiva.subtitulo'; diapositiva: string; valor: string }
  | { op: 'texto.contenido'; bloque: string; periodo: IdPeriodo | null; valor: string | null }
  | { op: 'cifras.valor'; bloque: string; periodo: IdPeriodo | null; valor: Cifra[] | null }
  // --- Etapa 4
  | { op: 'tarjetas.valor'; bloque: string; periodo: IdPeriodo | null; valor: Tarjeta[] | null }
  /** Título (arriba) y nota (debajo) de cualquier bloque. '' los quita. */
  | { op: 'bloque.marco'; bloque: string; titulo: string; nota: string }
  /** Fondo y lugar en la disposición libre; null quita cada uno. */
  | { op: 'bloque.aspecto'; bloque: string; fondo: FondoBloque | null; ubicacion: Ubicacion | null }
  /** Color de fondo y de letra propios del bloque; null quita cada uno. */
  | { op: 'bloque.colores'; bloque: string; fondo: string | null; texto: string | null }
  /** Color de fondo de la diapositiva; null la deja en blanco. */
  | { op: 'diapositiva.fondo'; diapositiva: string; valor: string | null }
  /** Ocultar la diapositiva al presentar y en el PDF (sin quitarla). */
  | { op: 'diapositiva.oculta'; diapositiva: string; valor: boolean }
  /** Tipo de letra propio del bloque; null usa el de la presentación. */
  | { op: 'bloque.letra'; bloque: string; valor: string | null }
  /** Tamaño de la letra del bloque en % (null: el de la presentación). */
  | { op: 'bloque.tamano'; bloque: string; valor: number | null }
  /** Tamaño del título y subtítulo de la diapositiva en % (null: el de la presentación). */
  | { op: 'diapositiva.tamano'; diapositiva: string; valor: number | null }
  /** Guarda (o reemplaza) una diapositiva quitada, arriba de la lista. */
  | { op: 'guardada.poner'; guardada: DiapositivaGuardada }
  /** La saca de la lista de guardadas (al volver a ponerla o al borrarla para siempre). */
  | { op: 'guardada.quitar'; diapositiva: string }
  | { op: 'datos.filas'; conjunto: string; periodo: IdPeriodo | null; valor: Fila[] | null }
  /** Solo cambia los campos presentes. `decimales: null`, `unidad: ''`, `grupo: ''` y `signo: false` los quitan. */
  | { op: 'datos.columna'; conjunto: string; clave: string; nombre?: string; decimales?: number | null; unidad?: string; grupo?: string; signo?: boolean }
  /**
   * Cambia entre "igual en todos los meses" (false) y "propio de cada mes"
   * (true). A true copia el valor único a todos los meses; a false deja como
   * único el valor de `periodo` y descarta los demás.
   */
  | { op: 'porPeriodo'; destino: { bloque: string } | { conjunto: string }; valor: boolean; periodo: IdPeriodo }
  // --- Etapa 2B: estructura. `despues` es el id del elemento que queda antes
  // (en la misma lista); null lo deja al principio.
  /** Crea o reemplaza la diapositiva y la deja después de `despues`. */
  | { op: 'diapositiva.poner'; diapositiva: Diapositiva; despues: string | null }
  | { op: 'diapositiva.quitar'; diapositiva: string }
  | { op: 'diapositiva.mover'; diapositiva: string; despues: string | null }
  | { op: 'diapositiva.tipo'; diapositiva: string; valor: Diapositiva['tipo'] }
  | { op: 'diapositiva.disposicion'; diapositiva: string; valor: Disposicion }
  /** Crea o reemplaza el bloque en esa diapositiva, después del bloque `despues`. */
  | { op: 'bloque.poner'; diapositiva: string; bloque: Bloque; despues: string | null }
  | { op: 'bloque.quitar'; bloque: string }
  /** Mueve el bloque dentro de su diapositiva. */
  | { op: 'bloque.mover'; bloque: string; despues: string | null }
  | { op: 'grafico.config'; bloque: string; valor: ConfigGrafico }
  | { op: 'tabla.config'; bloque: string; valor: ConfigTabla }
  /** Crea o reemplaza un conjunto de datos completo. */
  | { op: 'conjunto.poner'; conjunto: ConjuntoDatos }
  /** Se salta si algún bloque todavía usa el conjunto. */
  | { op: 'conjunto.quitar'; conjunto: string }
  | { op: 'datos.nombre'; conjunto: string; valor: string }
  /**
   * Lista completa de columnas. Las filas se ajustan en todos los meses. Se
   * salta si quita una columna que usa un bloque o la cambia entre texto y
   * número.
   */
  | { op: 'datos.columnas'; conjunto: string; valor: Columna[] }
  | { op: 'tema'; valor: Tema }
  /** Agrega el mes (si no existe) y copia en él lo propio de cada mes de `copiarDe`. */
  | { op: 'periodo.agregar'; periodo: IdPeriodo; copiarDe: IdPeriodo | null }
  /** Quita el mes y todo lo suyo. Se salta si es el único. */
  | { op: 'periodo.quitar'; periodo: IdPeriodo }
  // --- Etapa 3: de dónde salieron los datos al cargarlos desde Excel.
  /** Deja la configuración recordada del conjunto; null la quita. */
  | { op: 'datos.origen'; conjunto: string; valor: OrigenExcel | null };

/**
 * La operación no se puede aplicar a esta presentación: el destino ya no
 * existe o no coincide con su estado actual (por ejemplo, trae el valor de un
 * mes para algo que ahora es igual en todos los meses). No es un error del
 * programa: pasa cuando otra persona cambió la presentación entre tanto. Quien
 * aplica decide si la salta.
 */
export class OperacionNoAplicable extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'OperacionNoAplicable';
  }
}

// ---------------------------------------------------------------------------
// Búsquedas

function posicionBloque(p: Presentacion, id: string): { d: number; b: number } | null {
  for (let d = 0; d < p.diapositivas.length; d++) {
    const b = p.diapositivas[d].bloques.findIndex((bloque) => bloque.id === id);
    if (b >= 0) return { d, b };
  }
  return null;
}

export function bloqueDe(p: Presentacion, id: string): Bloque | undefined {
  const pos = posicionBloque(p, id);
  return pos ? p.diapositivas[pos.d].bloques[pos.b] : undefined;
}

function conDiapositiva(p: Presentacion, id: string, cambiar: (d: Presentacion['diapositivas'][number]) => Presentacion['diapositivas'][number]): Presentacion {
  const indice = p.diapositivas.findIndex((d) => d.id === id);
  if (indice < 0) throw new OperacionNoAplicable(`No existe la diapositiva "${id}".`);
  const diapositivas = p.diapositivas.slice();
  diapositivas[indice] = cambiar(diapositivas[indice]);
  return { ...p, diapositivas };
}

function conBloque(p: Presentacion, id: string, cambiar: (b: Bloque) => Bloque): Presentacion {
  const pos = posicionBloque(p, id);
  if (!pos) throw new OperacionNoAplicable(`No existe el bloque "${id}".`);
  const diapositivas = p.diapositivas.slice();
  const bloques = diapositivas[pos.d].bloques.slice();
  bloques[pos.b] = cambiar(bloques[pos.b]);
  diapositivas[pos.d] = { ...diapositivas[pos.d], bloques };
  return { ...p, diapositivas };
}

function conConjunto(p: Presentacion, id: string, cambiar: (c: ConjuntoDatos) => ConjuntoDatos): Presentacion {
  const conjunto = Object.hasOwn(p.datos, id) ? p.datos[id] : undefined;
  if (!conjunto) throw new OperacionNoAplicable(`No existe el conjunto de datos "${id}".`);
  return { ...p, datos: { ...p.datos, [id]: cambiar(conjunto) } };
}

/**
 * Lista con `elemento` justo después del que tiene id `despues` (al principio
 * si es null). Si ya estaba, lo saca de donde estaba.
 */
function ponerDespues<T extends { id: string }>(lista: T[], elemento: T, despues: string | null): T[] {
  if (despues === elemento.id) throw new OperacionNoAplicable('Un elemento no puede ir después de sí mismo.');
  const resto = lista.filter((x) => x.id !== elemento.id);
  if (despues === null) return [elemento, ...resto];
  const indice = resto.findIndex((x) => x.id === despues);
  if (indice < 0) throw new OperacionNoAplicable(`No existe "${despues}" para ubicar "${elemento.id}" después.`);
  return [...resto.slice(0, indice + 1), elemento, ...resto.slice(indice + 1)];
}

/** Id del elemento anterior, o null si es el primero. */
function anteriorDe<T extends { id: string }>(lista: T[], id: string): string | null {
  const indice = lista.findIndex((x) => x.id === id);
  return indice > 0 ? lista[indice - 1].id : null;
}

/** Columnas del conjunto que usa cada bloque, para no quitarlas por debajo. */
export function columnasUsadas(p: Presentacion, conjunto: string): Map<string, string[]> {
  const usadas = new Map<string, string[]>();
  const anotar = (clave: string, bloque: string) => usadas.set(clave, [...(usadas.get(clave) ?? []), bloque]);
  for (const d of p.diapositivas) {
    for (const b of d.bloques) {
      if (b.tipo === 'cifras') {
        for (const cifra of cifrasDe(b)) {
          const f = cifra.desde;
          if (!f || f.conjunto !== conjunto) continue;
          for (const c of columnasDeFuente(f)) anotar(c, b.id);
        }
        continue;
      }
      if ((b.tipo !== 'grafico' && b.tipo !== 'tabla') || b.datos !== conjunto) continue;
      if (b.tipo === 'grafico') {
        anotar(b.ejeX, b.id);
        for (const serie of b.series) anotar(serie.clave, b.id);
        if (b.nombres) anotar(b.nombres, b.id);
        if (b.detalleEje) anotar(b.detalleEje, b.id);
      } else {
        for (const c of b.columnas ?? []) anotar(c, b.id);
        if (b.secciones) anotar(b.secciones, b.id);
        for (const c of b.calculadas ?? []) anotar(c.columna, b.id);
      }
      if (b.resaltar) anotar(b.resaltar.columna, b.id);
    }
  }
  return usadas;
}

/** Todas las cifras de un bloque, de todos los meses. */
export function cifrasDe(b: Extract<Bloque, { tipo: 'cifras' }>): Cifra[] {
  return b.cifras.porPeriodo ? Object.values(b.cifras.valores ?? {}).flat() : b.cifras.valor ?? [];
}

/** Columnas del conjunto que nombra una cifra calculada. */
export function columnasDeFuente(f: NonNullable<Cifra['desde']>): string[] {
  const deFila = (s: SelectorFila | undefined) => (s && typeof s === 'object' ? [s.columna] : []);
  return [f.columna, ...deFila(f.fila), ...deFila(f.comparar), ...(f.detalle ? [f.detalle] : [])];
}

/** Bloques que muestran el conjunto (incluidas las cifras que salen de él). */
export function bloquesQueUsan(p: Presentacion, conjunto: string): string[] {
  return p.diapositivas.flatMap((d) => d.bloques.filter((b) => {
    if (b.tipo === 'grafico' || b.tipo === 'tabla') return b.datos === conjunto;
    if (b.tipo === 'cifras') return cifrasDe(b).some((c) => c.desde?.conjunto === conjunto);
    return false;
  }).map((b) => b.id));
}

const esTexto = (tipo: TipoColumna) => tipo === 'texto';

function convertirCelda(valor: Fila[string], antes: TipoColumna, despues: TipoColumna): Fila[string] {
  if (valor === null || valor === undefined || esTexto(antes) === esTexto(despues)) return valor ?? null;
  if (esTexto(despues)) return typeof valor === 'number' ? numeroEditable(valor) : valor;
  if (typeof valor === 'number') return valor;
  const numero = interpretarNumero(valor);
  return numero === null || Number.isNaN(numero) ? null : numero;
}

function ajustarFilas(filas: Fila[], antes: Columna[], despues: Columna[]): Fila[] {
  const tipoAntes = new Map(antes.map((c) => [c.clave, c.tipo]));
  return filas.map((fila) => {
    const nueva: Fila = {};
    for (const c of despues) {
      const tipo = tipoAntes.get(c.clave);
      if (tipo === undefined || !Object.hasOwn(fila, c.clave)) continue;
      nueva[c.clave] = convertirCelda(fila[c.clave], tipo, c.tipo);
    }
    return nueva;
  });
}

function exigirPeriodo(p: Presentacion, periodo: IdPeriodo): void {
  if (!p.periodos.includes(periodo)) throw new OperacionNoAplicable(`La presentación no tiene el mes "${periodo}".`);
}

// ---------------------------------------------------------------------------
// Valores únicos o por mes

function sinClave<T>(objeto: Record<string, T> | undefined, clave: string): Record<string, T> {
  const copia: Record<string, T> = { ...objeto };
  delete copia[clave];
  return copia;
}

function ponerValor<T>(p: Presentacion, dato: PorPeriodo<T>, periodo: IdPeriodo | null, valor: T | null): PorPeriodo<T> {
  if (periodo === null) {
    if (dato.porPeriodo) throw new OperacionNoAplicable('El valor es propio de cada mes y llegó sin mes.');
    return valor === null ? { porPeriodo: false } : { porPeriodo: false, valor };
  }
  if (!dato.porPeriodo) throw new OperacionNoAplicable('El valor es igual en todos los meses y llegó con mes.');
  exigirPeriodo(p, periodo);
  const valores = valor === null ? sinClave(dato.valores, periodo) : { ...dato.valores, [periodo]: valor };
  return { porPeriodo: true, valores };
}

function ponerFilas(p: Presentacion, conjunto: ConjuntoDatos, periodo: IdPeriodo | null, valor: Fila[] | null): ConjuntoDatos {
  const { filas: _filas, filasPorPeriodo, ...resto } = conjunto;
  if (periodo === null) {
    if (conjunto.porPeriodo) throw new OperacionNoAplicable('Los datos son propios de cada mes y llegaron sin mes.');
    return valor === null ? resto : { ...resto, filas: valor };
  }
  if (!conjunto.porPeriodo) throw new OperacionNoAplicable('Los datos son iguales en todos los meses y llegaron con mes.');
  exigirPeriodo(p, periodo);
  return { ...resto, filasPorPeriodo: valor === null ? sinClave(filasPorPeriodo, periodo) : { ...filasPorPeriodo, [periodo]: valor } };
}

function cambiarModo<T>(p: Presentacion, dato: PorPeriodo<T>, aPorPeriodo: boolean, periodo: IdPeriodo): PorPeriodo<T> {
  if (dato.porPeriodo === aPorPeriodo) return dato;
  if (aPorPeriodo) {
    if (dato.valor === undefined) return { porPeriodo: true, valores: {} };
    return { porPeriodo: true, valores: Object.fromEntries(p.periodos.map((m) => [m, dato.valor as T])) };
  }
  const valor = dato.valores?.[periodo];
  return valor === undefined ? { porPeriodo: false } : { porPeriodo: false, valor };
}

function cambiarModoConjunto(p: Presentacion, conjunto: ConjuntoDatos, aPorPeriodo: boolean, periodo: IdPeriodo): ConjuntoDatos {
  if (conjunto.porPeriodo === aPorPeriodo) return conjunto;
  const { filas, filasPorPeriodo, ...resto } = conjunto;
  if (aPorPeriodo) {
    return { ...resto, porPeriodo: true, filasPorPeriodo: filas ? Object.fromEntries(p.periodos.map((m) => [m, filas])) : {} };
  }
  const delMes = filasPorPeriodo?.[periodo];
  return delMes ? { ...resto, porPeriodo: false, filas: delMes } : { ...resto, porPeriodo: false };
}

/** El dato por mes de un bloque de texto, cifras o tarjetas; los demás bloques no tienen. */
function datoDeBloque(bloque: Bloque): PorPeriodo<string> | PorPeriodo<Cifra[]> | PorPeriodo<Tarjeta[]> | undefined {
  if (bloque.tipo === 'texto') return bloque.contenido;
  if (bloque.tipo === 'cifras') return bloque.cifras;
  if (bloque.tipo === 'tarjetas') return bloque.tarjetas;
  return undefined;
}

/** Título y nota del bloque, para conservarlos al cambiar su configuración. */
/** Marca como de cuadrícula fina las diapositivas que cumplen `cual`. */
function marcarFina(p: Presentacion, cual: (d: Diapositiva) => boolean): Presentacion {
  return { ...p, diapositivas: p.diapositivas.map((d) => (cual(d) && d.rejilla !== 'fina' ? marcadaFina(d) : d)) };
}

/** La configuración de un gráfico sin su marco (lo que va en `grafico.config`). */
export function configGraficoDe(b: BloqueGrafico): ConfigGrafico {
  const { id: _id, tipo: _tipo, titulo: _t, nota: _n, fondo: _fo, ubicacion: _u, colorFondo: _cf, colorTexto: _ct, fuente: _f, letra: _l, ...config } = b;
  return config;
}

/** La configuración de una tabla sin su marco (lo que va en `tabla.config`). */
export function configTablaDe(b: BloqueTabla): ConfigTabla {
  const { id: _id, tipo: _tipo, titulo: _t, nota: _n, fondo: _fo, ubicacion: _u, colorFondo: _cf, colorTexto: _ct, fuente: _f, letra: _l, ...config } = b;
  return config;
}

function marcoDe(b: Bloque): Pick<Bloque, 'titulo' | 'nota' | 'fondo' | 'ubicacion' | 'colorFondo' | 'colorTexto' | 'fuente' | 'letra'> {
  return {
    ...(b.fuente ? { fuente: b.fuente } : {}),
    ...(b.letra ? { letra: b.letra } : {}),
    ...(b.colorFondo ? { colorFondo: b.colorFondo } : {}),
    ...(b.colorTexto ? { colorTexto: b.colorTexto } : {}),
    ...(b.titulo ? { titulo: b.titulo } : {}),
    ...(b.nota ? { nota: b.nota } : {}),
    ...(b.fondo ? { fondo: b.fondo } : {}),
    ...(b.ubicacion ? { ubicacion: b.ubicacion } : {}),
  };
}

/** Copia del bloque con su dato por mes cambiado (texto, cifras o tarjetas). */
function conDatoDeBloque(b: Bloque, cambiar: <T>(dato: PorPeriodo<T>) => PorPeriodo<T>): Bloque {
  if (b.tipo === 'texto') return { ...b, contenido: cambiar(b.contenido) };
  if (b.tipo === 'cifras') return { ...b, cifras: cambiar(b.cifras) };
  if (b.tipo === 'tarjetas') return { ...b, tarjetas: cambiar(b.tarjetas) };
  return b;
}

// ---------------------------------------------------------------------------
// Aplicar

/**
 * Devuelve una presentación nueva con la operación aplicada; no modifica la
 * recibida. Lanza OperacionNoAplicable si el destino no existe o no coincide.
 */
export function aplicar(p: Presentacion, op: Operacion): Presentacion {
  switch (op.op) {
    case 'presentacion.nombre':
      return { ...p, nombre: op.valor };

    case 'presentacion.descripcion': {
      const { descripcion: _descripcion, ...resto } = p;
      return op.valor ? { ...resto, descripcion: op.valor } : resto;
    }

    case 'diapositiva.titulo':
      return conDiapositiva(p, op.diapositiva, (d) => ({ ...d, titulo: op.valor }));

    case 'diapositiva.subtitulo':
      return conDiapositiva(p, op.diapositiva, (d) => {
        const { subtitulo: _subtitulo, ...resto } = d;
        return op.valor ? { ...resto, subtitulo: op.valor } : resto;
      });

    case 'texto.contenido':
      return conBloque(p, op.bloque, (b) => {
        if (b.tipo !== 'texto') throw new OperacionNoAplicable(`El bloque "${op.bloque}" no es de texto.`);
        return { ...b, contenido: ponerValor(p, b.contenido, op.periodo, op.valor) };
      });

    case 'cifras.valor':
      return conBloque(p, op.bloque, (b) => {
        if (b.tipo !== 'cifras') throw new OperacionNoAplicable(`El bloque "${op.bloque}" no es de cifras.`);
        return { ...b, cifras: ponerValor(p, b.cifras, op.periodo, op.valor) };
      });

    case 'tarjetas.valor':
      return conBloque(p, op.bloque, (b) => {
        if (b.tipo !== 'tarjetas') throw new OperacionNoAplicable(`El bloque "${op.bloque}" no es de tarjetas.`);
        return { ...b, tarjetas: ponerValor(p, b.tarjetas, op.periodo, op.valor) };
      });

    case 'bloque.marco':
      return conBloque(p, op.bloque, ({ titulo: _titulo, nota: _nota, ...b }) => ({
        ...b,
        ...(op.titulo ? { titulo: op.titulo } : {}),
        ...(op.nota ? { nota: op.nota } : {}),
      }) as Bloque);

    case 'bloque.aspecto': {
      // Las ubicaciones que llegan son de la cuadrícula fina (ver rejilla.ts):
      // primero se pasa la diapositiva, después se pone la nueva.
      const q = op.ubicacion ? marcarFina(p, (d) => d.bloques.some((b) => b.id === op.bloque)) : p;
      return conBloque(q, op.bloque, ({ fondo: _fondo, ubicacion: _ubicacion, ...b }) => ({
        ...b,
        ...(op.fondo ? { fondo: op.fondo } : {}),
        ...(op.ubicacion ? { ubicacion: { ...op.ubicacion } } : {}),
      }) as Bloque);
    }

    case 'bloque.colores':
      return conBloque(p, op.bloque, ({ colorFondo: _f, colorTexto: _t, ...b }) => ({
        ...b,
        ...(op.fondo ? { colorFondo: op.fondo } : {}),
        ...(op.texto ? { colorTexto: op.texto } : {}),
      }) as Bloque);

    case 'diapositiva.fondo':
      return conDiapositiva(p, op.diapositiva, ({ fondo: _fondo, ...d }) => (op.valor ? { ...d, fondo: op.valor } : d));

    case 'diapositiva.oculta':
      return conDiapositiva(p, op.diapositiva, ({ oculta: _oculta, ...d }) => (op.valor ? { ...d, oculta: true } : d));

    case 'bloque.letra':
      return conBloque(p, op.bloque, ({ fuente: _fuente, ...b }) => (op.valor ? { ...b, fuente: op.valor } : b) as Bloque);

    case 'bloque.tamano':
      return conBloque(p, op.bloque, ({ letra: _letra, ...b }) => (op.valor && op.valor !== 100 ? { ...b, letra: op.valor } : b) as Bloque);

    case 'diapositiva.tamano':
      return conDiapositiva(p, op.diapositiva, ({ letra: _letra, ...d }) => (op.valor && op.valor !== 100 ? { ...d, letra: op.valor } : d));

    case 'guardada.poner': {
      const resto = (p.guardadas ?? []).filter((g) => g.diapositiva.id !== op.guardada.diapositiva.id);
      const g = structuredClone(op.guardada);
      return { ...p, guardadas: [{ ...g, diapositiva: migrarDiapositiva(g.diapositiva) }, ...resto] };
    }

    case 'guardada.quitar': {
      if (!p.guardadas?.some((g) => g.diapositiva.id === op.diapositiva)) throw new OperacionNoAplicable(`No hay una diapositiva guardada "${op.diapositiva}".`);
      const { guardadas: _g, ...resto } = p;
      const quedan = p.guardadas.filter((g) => g.diapositiva.id !== op.diapositiva);
      return quedan.length ? { ...resto, guardadas: quedan } : resto;
    }

    case 'datos.filas':
      return conConjunto(p, op.conjunto, (c) => ponerFilas(p, c, op.periodo, op.valor));

    case 'datos.columna':
      return conConjunto(p, op.conjunto, (c) => {
        const indice = c.columnas.findIndex((col) => col.clave === op.clave);
        if (indice < 0) throw new OperacionNoAplicable(`El conjunto "${op.conjunto}" no tiene la columna "${op.clave}".`);
        const columna: Columna = { ...c.columnas[indice] };
        if (op.nombre !== undefined) columna.nombre = op.nombre;
        if (op.decimales === null) delete columna.decimales;
        else if (op.decimales !== undefined) columna.decimales = op.decimales;
        if (op.unidad === '') delete columna.unidad;
        else if (op.unidad !== undefined) columna.unidad = op.unidad;
        if (op.grupo === '') delete columna.grupo;
        else if (op.grupo !== undefined) columna.grupo = op.grupo;
        if (op.signo === false) delete columna.signo;
        else if (op.signo) columna.signo = true;
        const columnas = c.columnas.slice();
        columnas[indice] = columna;
        return { ...c, columnas };
      });

    case 'porPeriodo': {
      exigirPeriodo(p, op.periodo);
      if ('conjunto' in op.destino) {
        return conConjunto(p, op.destino.conjunto, (c) => cambiarModoConjunto(p, c, op.valor, op.periodo));
      }
      const id = op.destino.bloque;
      return conBloque(p, id, (b) => {
        if (b.tipo === 'texto') return { ...b, contenido: cambiarModo(p, b.contenido, op.valor, op.periodo) };
        if (b.tipo === 'cifras') return { ...b, cifras: cambiarModo(p, b.cifras, op.valor, op.periodo) };
        if (b.tipo === 'tarjetas') return { ...b, tarjetas: cambiarModo(p, b.tarjetas, op.valor, op.periodo) };
        throw new OperacionNoAplicable(`El bloque "${id}" no tiene contenido por mes.`);
      });
    }

    case 'diapositiva.poner':
      // Una diapositiva copiada antes de la cuadrícula fina llega con la vieja.
      return { ...p, diapositivas: ponerDespues(p.diapositivas, migrarDiapositiva(op.diapositiva), op.despues) };

    case 'diapositiva.quitar': {
      if (!p.diapositivas.some((d) => d.id === op.diapositiva)) throw new OperacionNoAplicable(`No existe la diapositiva "${op.diapositiva}".`);
      if (p.diapositivas.length === 1) throw new OperacionNoAplicable('No se puede quitar la única diapositiva.');
      return { ...p, diapositivas: p.diapositivas.filter((d) => d.id !== op.diapositiva) };
    }

    case 'diapositiva.mover': {
      const d = p.diapositivas.find((x) => x.id === op.diapositiva);
      if (!d) throw new OperacionNoAplicable(`No existe la diapositiva "${op.diapositiva}".`);
      return { ...p, diapositivas: ponerDespues(p.diapositivas, d, op.despues) };
    }

    case 'diapositiva.tipo':
      return conDiapositiva(p, op.diapositiva, (d) => ({ ...d, tipo: op.valor }));

    case 'diapositiva.disposicion':
      return conDiapositiva(p, op.diapositiva, (d) => ({ ...d, disposicion: op.valor }));

    case 'bloque.poner': {
      if (!p.diapositivas.some((d) => d.id === op.diapositiva)) throw new OperacionNoAplicable(`No existe la diapositiva "${op.diapositiva}".`);
      // Los ids de bloque son únicos en toda la presentación: si ya estaba en
      // otra diapositiva, sale de allá.
      const diapositivas = p.diapositivas.map((d) => {
        if (d.id === op.diapositiva) {
          const conBloqueNuevo = { ...d, bloques: ponerDespues(d.bloques, op.bloque, op.despues) };
          const fina = marcadaFina(d);
          return op.bloque.ubicacion ? { ...fina, bloques: ponerDespues(fina.bloques, op.bloque, op.despues) } : conBloqueNuevo;
        }
        return d.bloques.some((b) => b.id === op.bloque.id) ? { ...d, bloques: d.bloques.filter((b) => b.id !== op.bloque.id) } : d;
      });
      return { ...p, diapositivas };
    }

    case 'bloque.quitar': {
      const pos = posicionBloque(p, op.bloque);
      if (!pos) throw new OperacionNoAplicable(`No existe el bloque "${op.bloque}".`);
      return conDiapositiva(p, p.diapositivas[pos.d].id, (d) => ({ ...d, bloques: d.bloques.filter((b) => b.id !== op.bloque) }));
    }

    case 'bloque.mover': {
      const pos = posicionBloque(p, op.bloque);
      if (!pos) throw new OperacionNoAplicable(`No existe el bloque "${op.bloque}".`);
      const d = p.diapositivas[pos.d];
      return conDiapositiva(p, d.id, (x) => ({ ...x, bloques: ponerDespues(x.bloques, d.bloques[pos.b], op.despues) }));
    }

    case 'grafico.config':
      return conBloque(p, op.bloque, (b) => {
        if (b.tipo !== 'grafico') throw new OperacionNoAplicable(`El bloque "${op.bloque}" no es un gráfico.`);
        return { ...op.valor, ...marcoDe(b), id: b.id, tipo: 'grafico' };
      });

    case 'tabla.config':
      return conBloque(p, op.bloque, (b) => {
        if (b.tipo !== 'tabla') throw new OperacionNoAplicable(`El bloque "${op.bloque}" no es una tabla.`);
        return { ...op.valor, ...marcoDe(b), id: b.id, tipo: 'tabla' };
      });

    case 'conjunto.poner':
      return { ...p, datos: { ...p.datos, [op.conjunto.id]: op.conjunto } };

    case 'conjunto.quitar': {
      if (!Object.hasOwn(p.datos, op.conjunto)) throw new OperacionNoAplicable(`No existe el conjunto de datos "${op.conjunto}".`);
      if (bloquesQueUsan(p, op.conjunto).length) throw new OperacionNoAplicable(`El conjunto "${op.conjunto}" todavía se usa.`);
      return { ...p, datos: sinClave(p.datos, op.conjunto) };
    }

    case 'datos.nombre':
      return conConjunto(p, op.conjunto, (c) => ({ ...c, nombre: op.valor }));

    case 'datos.origen':
      return conConjunto(p, op.conjunto, ({ origen: _origen, ...c }) => (op.valor === null ? c : { ...c, origen: op.valor }));

    case 'datos.columnas':
      return conConjunto(p, op.conjunto, (c) => {
        const nuevas = new Map(op.valor.map((col) => [col.clave, col]));
        for (const [clave] of columnasUsadas(p, op.conjunto)) {
          const antes = c.columnas.find((col) => col.clave === clave);
          const despues = nuevas.get(clave);
          if (!despues) throw new OperacionNoAplicable(`La columna "${clave}" se usa en un bloque.`);
          if (antes && esTexto(antes.tipo) !== esTexto(despues.tipo)) throw new OperacionNoAplicable(`La columna "${clave}" se usa en un bloque y no puede cambiar entre texto y número.`);
        }
        const ajustar = (filas: Fila[]) => ajustarFilas(filas, c.columnas, op.valor);
        const resultado: ConjuntoDatos = { ...c, columnas: op.valor };
        if (c.filas) resultado.filas = ajustar(c.filas);
        if (c.filasPorPeriodo) resultado.filasPorPeriodo = Object.fromEntries(Object.entries(c.filasPorPeriodo).map(([m, f]) => [m, ajustar(f)]));
        return resultado;
      });

    case 'tema':
      return { ...p, tema: op.valor };

    case 'periodo.agregar': {
      if (p.periodos.includes(op.periodo)) return p;
      if (op.copiarDe !== null) exigirPeriodo(p, op.copiarDe);
      const periodos = [...p.periodos, op.periodo].sort();
      const origen = op.copiarDe;
      if (origen === null) return { ...p, periodos };
      const copiar = <T>(dato: PorPeriodo<T>): PorPeriodo<T> =>
        dato.porPeriodo && dato.valores && Object.hasOwn(dato.valores, origen) ? { ...dato, valores: { ...dato.valores, [op.periodo]: dato.valores[origen] } } : dato;
      const datos = Object.fromEntries(Object.entries(p.datos).map(([k, c]) => [
        k,
        c.porPeriodo && c.filasPorPeriodo && Object.hasOwn(c.filasPorPeriodo, origen) ? { ...c, filasPorPeriodo: { ...c.filasPorPeriodo, [op.periodo]: c.filasPorPeriodo[origen] } } : c,
      ]));
      const diapositivas = p.diapositivas.map((d) => ({
        ...d,
        bloques: d.bloques.map((b): Bloque => conDatoDeBloque(b, copiar)),
      }));
      return { ...p, periodos, datos, diapositivas };
    }

    case 'periodo.quitar': {
      exigirPeriodo(p, op.periodo);
      if (p.periodos.length === 1) throw new OperacionNoAplicable('No se puede quitar el único mes.');
      const quitar = <T>(dato: PorPeriodo<T>): PorPeriodo<T> =>
        dato.porPeriodo && dato.valores ? { ...dato, valores: sinClave(dato.valores, op.periodo) } : dato;
      const datos = Object.fromEntries(Object.entries(p.datos).map(([k, c]) => [
        k,
        c.filasPorPeriodo ? { ...c, filasPorPeriodo: sinClave(c.filasPorPeriodo, op.periodo) } : c,
      ]));
      const diapositivas = p.diapositivas.map((d) => ({
        ...d,
        bloques: d.bloques.map((b): Bloque => conDatoDeBloque(b, quitar)),
      }));
      return { ...p, periodos: p.periodos.filter((m) => m !== op.periodo), datos, diapositivas };
    }
  }
}

/**
 * Aplica varias operaciones en orden, saltando las que no se puedan aplicar.
 * `omitidas` dice cuántas se saltaron.
 */
export function aplicarVarias(p: Presentacion, ops: Operacion[]): { presentacion: Presentacion; omitidas: number } {
  let presentacion = p;
  let omitidas = 0;
  for (const op of ops) {
    try {
      presentacion = aplicar(presentacion, op);
    } catch (error) {
      if (!(error instanceof OperacionNoAplicable)) throw error;
      omitidas++;
    }
  }
  return { presentacion, omitidas };
}

// ---------------------------------------------------------------------------
// Deshacer

/**
 * Operaciones que deshacen `op`. Hay que calcularlas ANTES de aplicarla, con
 * la presentación tal como estaba. Devuelve [] si `op` no se puede aplicar.
 */
export function inversa(p: Presentacion, op: Operacion): Operacion[] {
  switch (op.op) {
    case 'presentacion.nombre':
      return [{ op: op.op, valor: p.nombre }];

    case 'presentacion.descripcion':
      return [{ op: op.op, valor: p.descripcion ?? '' }];

    case 'diapositiva.titulo': {
      const d = p.diapositivas.find((x) => x.id === op.diapositiva);
      return d ? [{ op: op.op, diapositiva: d.id, valor: d.titulo }] : [];
    }

    case 'diapositiva.subtitulo': {
      const d = p.diapositivas.find((x) => x.id === op.diapositiva);
      return d ? [{ op: op.op, diapositiva: d.id, valor: d.subtitulo ?? '' }] : [];
    }

    case 'texto.contenido': {
      const b = bloqueDe(p, op.bloque);
      if (b?.tipo !== 'texto') return [];
      const antes = op.periodo === null ? b.contenido.valor : b.contenido.valores?.[op.periodo];
      return [{ op: op.op, bloque: op.bloque, periodo: op.periodo, valor: antes ?? null }];
    }

    case 'cifras.valor': {
      const b = bloqueDe(p, op.bloque);
      if (b?.tipo !== 'cifras') return [];
      const antes = op.periodo === null ? b.cifras.valor : b.cifras.valores?.[op.periodo];
      return [{ op: op.op, bloque: op.bloque, periodo: op.periodo, valor: antes ?? null }];
    }

    case 'tarjetas.valor': {
      const b = bloqueDe(p, op.bloque);
      if (b?.tipo !== 'tarjetas') return [];
      const antes = op.periodo === null ? b.tarjetas.valor : b.tarjetas.valores?.[op.periodo];
      return [{ op: op.op, bloque: op.bloque, periodo: op.periodo, valor: antes ?? null }];
    }

    case 'bloque.marco': {
      const b = bloqueDe(p, op.bloque);
      return b ? [{ op: op.op, bloque: b.id, titulo: b.titulo ?? '', nota: b.nota ?? '' }] : [];
    }

    case 'bloque.aspecto': {
      const b = bloqueDe(p, op.bloque);
      return b ? [{ op: op.op, bloque: b.id, fondo: b.fondo ?? null, ubicacion: b.ubicacion ?? null }] : [];
    }

    case 'bloque.colores': {
      const b = bloqueDe(p, op.bloque);
      return b ? [{ op: op.op, bloque: b.id, fondo: b.colorFondo ?? null, texto: b.colorTexto ?? null }] : [];
    }

    case 'diapositiva.fondo': {
      const d = p.diapositivas.find((x) => x.id === op.diapositiva);
      return d ? [{ op: op.op, diapositiva: d.id, valor: d.fondo ?? null }] : [];
    }

    case 'diapositiva.oculta': {
      const d = p.diapositivas.find((x) => x.id === op.diapositiva);
      return d ? [{ op: op.op, diapositiva: d.id, valor: Boolean(d.oculta) }] : [];
    }

    case 'bloque.letra': {
      const b = bloqueDe(p, op.bloque);
      return b ? [{ op: op.op, bloque: b.id, valor: b.fuente ?? null }] : [];
    }

    case 'bloque.tamano': {
      const b = bloqueDe(p, op.bloque);
      return b ? [{ op: op.op, bloque: b.id, valor: b.letra ?? null }] : [];
    }

    case 'diapositiva.tamano': {
      const d = p.diapositivas.find((x) => x.id === op.diapositiva);
      return d ? [{ op: op.op, diapositiva: d.id, valor: d.letra ?? null }] : [];
    }

    case 'guardada.poner': {
      const antes = p.guardadas?.find((g) => g.diapositiva.id === op.guardada.diapositiva.id);
      return antes ? [{ op: op.op, guardada: antes }] : [{ op: 'guardada.quitar', diapositiva: op.guardada.diapositiva.id }];
    }

    case 'guardada.quitar': {
      const antes = p.guardadas?.find((g) => g.diapositiva.id === op.diapositiva);
      return antes ? [{ op: 'guardada.poner', guardada: antes }] : [];
    }

    case 'datos.filas': {
      const c = Object.hasOwn(p.datos, op.conjunto) ? p.datos[op.conjunto] : undefined;
      if (!c) return [];
      const antes = op.periodo === null ? c.filas : c.filasPorPeriodo?.[op.periodo];
      return [{ op: op.op, conjunto: op.conjunto, periodo: op.periodo, valor: antes ?? null }];
    }

    case 'datos.columna': {
      const c = Object.hasOwn(p.datos, op.conjunto) ? p.datos[op.conjunto] : undefined;
      const columna = c?.columnas.find((col) => col.clave === op.clave);
      if (!columna) return [];
      const vuelta: Extract<Operacion, { op: 'datos.columna' }> = { op: op.op, conjunto: op.conjunto, clave: op.clave };
      if (op.nombre !== undefined) vuelta.nombre = columna.nombre;
      if (op.decimales !== undefined) vuelta.decimales = columna.decimales ?? null;
      if (op.unidad !== undefined) vuelta.unidad = columna.unidad ?? '';
      if (op.grupo !== undefined) vuelta.grupo = columna.grupo ?? '';
      if (op.signo !== undefined) vuelta.signo = Boolean(columna.signo);
      return [vuelta];
    }

    case 'porPeriodo': {
      if ('conjunto' in op.destino) {
        const id = op.destino.conjunto;
        const c = Object.hasOwn(p.datos, id) ? p.datos[id] : undefined;
        if (!c || c.porPeriodo === op.valor) return [];
        const volver: Operacion = { op: 'porPeriodo', destino: op.destino, valor: c.porPeriodo, periodo: op.periodo };
        if (!c.porPeriodo) return [volver];
        // Pasa a "igual en todos": para deshacer hay que devolver cada mes.
        return [volver, ...p.periodos.map((m): Operacion => ({ op: 'datos.filas', conjunto: id, periodo: m, valor: c.filasPorPeriodo?.[m] ?? null }))];
      }
      const id = op.destino.bloque;
      const b = bloqueDe(p, id);
      const dato = b && datoDeBloque(b);
      if (!b || !dato || dato.porPeriodo === op.valor) return [];
      const volver: Operacion = { op: 'porPeriodo', destino: op.destino, valor: dato.porPeriodo, periodo: op.periodo };
      if (!dato.porPeriodo) return [volver];
      if (b.tipo === 'texto') {
        return [volver, ...p.periodos.map((m): Operacion => ({ op: 'texto.contenido', bloque: id, periodo: m, valor: b.contenido.valores?.[m] ?? null }))];
      }
      if (b.tipo === 'cifras') {
        return [volver, ...p.periodos.map((m): Operacion => ({ op: 'cifras.valor', bloque: id, periodo: m, valor: b.cifras.valores?.[m] ?? null }))];
      }
      if (b.tipo === 'tarjetas') {
        return [volver, ...p.periodos.map((m): Operacion => ({ op: 'tarjetas.valor', bloque: id, periodo: m, valor: b.tarjetas.valores?.[m] ?? null }))];
      }
      return [];
    }

    case 'diapositiva.poner': {
      const antes = p.diapositivas.find((d) => d.id === op.diapositiva.id);
      if (!antes) return [{ op: 'diapositiva.quitar', diapositiva: op.diapositiva.id }];
      return [{ op: 'diapositiva.poner', diapositiva: antes, despues: anteriorDe(p.diapositivas, antes.id) }];
    }

    case 'diapositiva.quitar': {
      const antes = p.diapositivas.find((d) => d.id === op.diapositiva);
      return antes ? [{ op: 'diapositiva.poner', diapositiva: antes, despues: anteriorDe(p.diapositivas, antes.id) }] : [];
    }

    case 'diapositiva.mover':
      return p.diapositivas.some((d) => d.id === op.diapositiva)
        ? [{ op: op.op, diapositiva: op.diapositiva, despues: anteriorDe(p.diapositivas, op.diapositiva) }]
        : [];

    case 'diapositiva.tipo': {
      const d = p.diapositivas.find((x) => x.id === op.diapositiva);
      return d ? [{ op: op.op, diapositiva: d.id, valor: d.tipo }] : [];
    }

    case 'diapositiva.disposicion': {
      const d = p.diapositivas.find((x) => x.id === op.diapositiva);
      return d ? [{ op: op.op, diapositiva: d.id, valor: d.disposicion ?? 'una' }] : [];
    }

    case 'bloque.poner': {
      const pos = posicionBloque(p, op.bloque.id);
      if (!pos) return [{ op: 'bloque.quitar', bloque: op.bloque.id }];
      const d = p.diapositivas[pos.d];
      return [{ op: 'bloque.poner', diapositiva: d.id, bloque: d.bloques[pos.b], despues: anteriorDe(d.bloques, op.bloque.id) }];
    }

    case 'bloque.quitar': {
      const pos = posicionBloque(p, op.bloque);
      if (!pos) return [];
      const d = p.diapositivas[pos.d];
      return [{ op: 'bloque.poner', diapositiva: d.id, bloque: d.bloques[pos.b], despues: anteriorDe(d.bloques, op.bloque) }];
    }

    case 'bloque.mover': {
      const pos = posicionBloque(p, op.bloque);
      return pos ? [{ op: op.op, bloque: op.bloque, despues: anteriorDe(p.diapositivas[pos.d].bloques, op.bloque) }] : [];
    }

    case 'grafico.config': {
      const b = bloqueDe(p, op.bloque);
      if (b?.tipo !== 'grafico') return [];
      return [{ op: op.op, bloque: op.bloque, valor: configGraficoDe(b) }];
    }

    case 'tabla.config': {
      const b = bloqueDe(p, op.bloque);
      if (b?.tipo !== 'tabla') return [];
      return [{ op: op.op, bloque: op.bloque, valor: configTablaDe(b) }];
    }

    case 'conjunto.poner': {
      const antes = Object.hasOwn(p.datos, op.conjunto.id) ? p.datos[op.conjunto.id] : undefined;
      return antes ? [{ op: 'conjunto.poner', conjunto: antes }] : [{ op: 'conjunto.quitar', conjunto: op.conjunto.id }];
    }

    case 'conjunto.quitar': {
      const antes = Object.hasOwn(p.datos, op.conjunto) ? p.datos[op.conjunto] : undefined;
      return antes ? [{ op: 'conjunto.poner', conjunto: antes }] : [];
    }

    case 'datos.nombre': {
      const c = Object.hasOwn(p.datos, op.conjunto) ? p.datos[op.conjunto] : undefined;
      return c ? [{ op: op.op, conjunto: c.id, valor: c.nombre }] : [];
    }

    case 'datos.origen': {
      const c = Object.hasOwn(p.datos, op.conjunto) ? p.datos[op.conjunto] : undefined;
      return c ? [{ op: op.op, conjunto: c.id, valor: c.origen ?? null }] : [];
    }

    case 'datos.columnas': {
      const c = Object.hasOwn(p.datos, op.conjunto) ? p.datos[op.conjunto] : undefined;
      if (!c) return [];
      // Las columnas primero: las filas de vuelta usan las claves de antes.
      const vuelta: Operacion[] = [{ op: 'datos.columnas', conjunto: c.id, valor: c.columnas }];
      if (!c.porPeriodo) vuelta.push({ op: 'datos.filas', conjunto: c.id, periodo: null, valor: c.filas ?? null });
      else for (const m of p.periodos) vuelta.push({ op: 'datos.filas', conjunto: c.id, periodo: m, valor: c.filasPorPeriodo?.[m] ?? null });
      return vuelta;
    }

    case 'tema':
      return [{ op: 'tema', valor: p.tema }];

    case 'periodo.agregar':
      return p.periodos.includes(op.periodo) ? [] : [{ op: 'periodo.quitar', periodo: op.periodo }];

    case 'periodo.quitar': {
      const m = op.periodo;
      if (!p.periodos.includes(m) || p.periodos.length === 1) return [];
      const vuelta: Operacion[] = [{ op: 'periodo.agregar', periodo: m, copiarDe: null }];
      for (const c of Object.values(p.datos)) {
        const filas = c.porPeriodo ? c.filasPorPeriodo?.[m] : undefined;
        if (filas) vuelta.push({ op: 'datos.filas', conjunto: c.id, periodo: m, valor: filas });
      }
      for (const d of p.diapositivas) {
        for (const b of d.bloques) {
          if (b.tipo === 'texto' && b.contenido.porPeriodo && b.contenido.valores?.[m] !== undefined) {
            vuelta.push({ op: 'texto.contenido', bloque: b.id, periodo: m, valor: b.contenido.valores[m] });
          }
          if (b.tipo === 'cifras' && b.cifras.porPeriodo && b.cifras.valores?.[m] !== undefined) {
            vuelta.push({ op: 'cifras.valor', bloque: b.id, periodo: m, valor: b.cifras.valores[m] });
          }
          if (b.tipo === 'tarjetas' && b.tarjetas.porPeriodo && b.tarjetas.valores?.[m] !== undefined) {
            vuelta.push({ op: 'tarjetas.valor', bloque: b.id, periodo: m, valor: b.tarjetas.valores[m] });
          }
        }
      }
      return vuelta;
    }
  }
}

// ---------------------------------------------------------------------------
// Compactar

/** Operaciones con la misma clave se pisan entre sí: basta con la última. */
export function claveDe(op: Operacion): string | null {
  switch (op.op) {
    case 'presentacion.nombre':
    case 'presentacion.descripcion':
      return op.op;
    case 'diapositiva.titulo':
    case 'diapositiva.subtitulo':
      return `${op.op}|${op.diapositiva}`;
    case 'texto.contenido':
    case 'cifras.valor':
    case 'tarjetas.valor':
      return `${op.op}|${op.bloque}|${op.periodo ?? ''}`;
    case 'bloque.marco':
    case 'bloque.aspecto':
    case 'bloque.colores':
    case 'bloque.letra':
    case 'bloque.tamano':
      return `${op.op}|${op.bloque}`;
    case 'diapositiva.fondo':
    case 'diapositiva.oculta':
    case 'diapositiva.tamano':
      return `${op.op}|${op.diapositiva}`;
    case 'guardada.poner':
    case 'guardada.quitar':
      return `guardada|${op.op === 'guardada.poner' ? op.guardada.diapositiva.id : op.diapositiva}`;
    case 'datos.filas':
      return `${op.op}|${op.conjunto}|${op.periodo ?? ''}`;
    case 'datos.columna': {
      const campos = (['nombre', 'decimales', 'unidad', 'grupo', 'signo'] as const).filter((campo) => op[campo] !== undefined);
      return `${op.op}|${op.conjunto}|${op.clave}|${campos.join(',')}`;
    }
    case 'diapositiva.tipo':
    case 'diapositiva.disposicion':
      return `${op.op}|${op.diapositiva}`;
    case 'grafico.config':
    case 'tabla.config':
      return `${op.op}|${op.bloque}`;
    case 'datos.nombre':
    case 'datos.origen':
      return `${op.op}|${op.conjunto}`;
    case 'tema':
      return op.op;
    case 'porPeriodo':
    case 'diapositiva.poner':
    case 'diapositiva.quitar':
    case 'diapositiva.mover':
    case 'bloque.poner':
    case 'bloque.quitar':
    case 'bloque.mover':
    case 'conjunto.poner':
    case 'conjunto.quitar':
    case 'datos.columnas':
    case 'periodo.agregar':
    case 'periodo.quitar':
      // Cambian el significado de las operaciones vecinas: nunca se compactan.
      return null;
  }
}

/**
 * Quita las operaciones que una posterior deja sin efecto (por ejemplo, las
 * letras intermedias al escribir un título). No cruza un cambio de
 * `porPeriodo`, porque antes y después de él las operaciones significan cosas
 * distintas.
 */
export function compactar(ops: Operacion[]): Operacion[] {
  const resultado: Operacion[] = [];
  const vistas = new Set<string>();
  for (let i = ops.length - 1; i >= 0; i--) {
    const clave = claveDe(ops[i]);
    if (clave === null) {
      vistas.clear();
      resultado.push(ops[i]);
    } else if (!vistas.has(clave)) {
      vistas.add(clave);
      resultado.push(ops[i]);
    }
  }
  return resultado.reverse();
}
