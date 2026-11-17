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

import type { Bloque, Cifra, Columna, ConjuntoDatos, Fila, IdPeriodo, PorPeriodo, Presentacion } from '../tipos';

export type Operacion =
  | { op: 'presentacion.nombre'; valor: string }
  /** '' quita la descripción. */
  | { op: 'presentacion.descripcion'; valor: string }
  | { op: 'diapositiva.titulo'; diapositiva: string; valor: string }
  /** '' quita el subtítulo. */
  | { op: 'diapositiva.subtitulo'; diapositiva: string; valor: string }
  | { op: 'texto.contenido'; bloque: string; periodo: IdPeriodo | null; valor: string | null }
  | { op: 'cifras.valor'; bloque: string; periodo: IdPeriodo | null; valor: Cifra[] | null }
  | { op: 'datos.filas'; conjunto: string; periodo: IdPeriodo | null; valor: Fila[] | null }
  /** Solo cambia los campos presentes. `decimales: null` y `unidad: ''` los quitan. */
  | { op: 'datos.columna'; conjunto: string; clave: string; nombre?: string; decimales?: number | null; unidad?: string }
  /**
   * Cambia entre "igual en todos los meses" (false) y "propio de cada mes"
   * (true). A true copia el valor único a todos los meses; a false deja como
   * único el valor de `periodo` y descarta los demás.
   */
  | { op: 'porPeriodo'; destino: { bloque: string } | { conjunto: string }; valor: boolean; periodo: IdPeriodo };

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

/** El dato por mes de un bloque de texto o de cifras; los demás bloques no tienen. */
function datoDeBloque(bloque: Bloque): PorPeriodo<string> | PorPeriodo<Cifra[]> | undefined {
  if (bloque.tipo === 'texto') return bloque.contenido;
  if (bloque.tipo === 'cifras') return bloque.cifras;
  return undefined;
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
        throw new OperacionNoAplicable(`El bloque "${id}" no tiene contenido por mes.`);
      });
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
      return [];
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
      return `${op.op}|${op.bloque}|${op.periodo ?? ''}`;
    case 'datos.filas':
      return `${op.op}|${op.conjunto}|${op.periodo ?? ''}`;
    case 'datos.columna': {
      const campos = (['nombre', 'decimales', 'unidad'] as const).filter((campo) => op[campo] !== undefined);
      return `${op.op}|${op.conjunto}|${op.clave}|${campos.join(',')}`;
    }
    case 'porPeriodo':
      // Cambia el significado de las operaciones vecinas: nunca se compacta.
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
