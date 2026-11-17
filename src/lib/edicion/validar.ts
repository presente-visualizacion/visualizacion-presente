// Validación de presentaciones y de operaciones de edición.
//
// La edición está abierta, así que el servidor no confía en lo que llega:
// revisa cada operación y la presentación que resulta antes de guardarla. El
// mismo validador sirve para lo que se importe más adelante (Excel, migración).
//
// Los esquemas se atan a `tipos.ts` con `satisfies`: si un día dejan de
// coincidir con los tipos, el compilador avisa.

import { z } from 'zod';
import type { Bloque, Cifra, Columna, ConjuntoDatos, Diapositiva, Fila, Presentacion, Tema } from '../tipos';
import type { Operacion } from './operaciones';

// Mensajes de error en español.
z.config(z.locales.es());

/** Topes para que nadie infle la base por error o a propósito. */
export const TOPES = {
  nombre: 120,
  descripcion: 300,
  titulo: 200,
  texto: 5_000,
  cifrasPorBloque: 8,
  filasPorMes: 500,
  celdaTexto: 200,
  columnas: 40,
  periodos: 240,
  diapositivas: 200,
  bloquesPorDiapositiva: 8,
  conjuntos: 300,
  /** Tamaño de la presentación completa, en bytes de su JSON. */
  presentacion: 3_000_000,
  /** Tamaño de un envío de guardado, en bytes. */
  envio: 256_000,
  operacionesPorEnvio: 200,
} as const;

// ---------------------------------------------------------------------------
// Piezas

const id = z.string().min(1).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/, 'solo letras, números, guion, punto y guion bajo');
const idPeriodo = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'debe tener la forma AAAA-MM');
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'debe ser un color como #D4145A');
const clave = z.string().min(1).max(80);

const tema = z.strictObject({
  primario: color,
  degradado: z.array(color).min(1).max(8),
  series: z.array(color).min(1).max(12),
  neutro: color,
  // Ruta del propio sitio o dirección https; nada de `javascript:` ni `data:`.
  logo: z.string().max(300).regex(/^(\/(?!\/)|https:\/\/)/, 'debe ser una ruta del sitio o una dirección https'),
}) satisfies z.ZodType<Tema>;

const columna = z.strictObject({
  clave,
  nombre: z.string().max(TOPES.titulo),
  tipo: z.enum(['texto', 'numero', 'porcentaje', 'moneda']),
  decimales: z.number().int().min(0).max(6).optional(),
  unidad: z.string().max(40).optional(),
}) satisfies z.ZodType<Columna>;

const celda = z.union([z.string().max(TOPES.celdaTexto), z.number(), z.null()]);
const fila = z.record(clave, celda) satisfies z.ZodType<Fila>;
const filas = z.array(fila).max(TOPES.filasPorMes);

const conjunto = z.strictObject({
  id,
  nombre: z.string().max(TOPES.titulo),
  columnas: z.array(columna).min(1).max(TOPES.columnas),
  porPeriodo: z.boolean(),
  filas: filas.optional(),
  filasPorPeriodo: z.record(idPeriodo, filas).optional(),
}) satisfies z.ZodType<ConjuntoDatos>;

const cifra = z.strictObject({
  etiqueta: z.string().max(80),
  valor: z.string().max(40),
  detalle: z.string().max(120).optional(),
}) satisfies z.ZodType<Cifra>;
const cifras = z.array(cifra).max(TOPES.cifrasPorBloque);
const texto = z.string().max(TOPES.texto);

function porPeriodo<T extends z.ZodType>(valor: T) {
  return z.strictObject({
    porPeriodo: z.boolean(),
    valor: valor.optional(),
    valores: z.record(idPeriodo, valor).optional(),
  });
}

const resaltado = z.strictObject({ columna: clave, valor: z.string().max(TOPES.celdaTexto) });

const bloque = z.discriminatedUnion('tipo', [
  z.strictObject({
    id,
    tipo: z.literal('grafico'),
    datos: id,
    forma: z.enum(['lineas', 'barras', 'barrasHorizontales', 'area']),
    ejeX: clave,
    series: z.array(z.strictObject({ clave, color: color.optional() })).min(1).max(12),
    apilado: z.boolean().optional(),
    etiquetas: z.boolean().optional(),
    resaltar: resaltado.optional(),
  }),
  z.strictObject({
    id,
    tipo: z.literal('tabla'),
    datos: id,
    columnas: z.array(clave).min(1).max(TOPES.columnas).optional(),
    resaltar: resaltado.optional(),
  }),
  z.strictObject({ id, tipo: z.literal('texto'), contenido: porPeriodo(texto) }),
  z.strictObject({ id, tipo: z.literal('cifras'), cifras: porPeriodo(cifras) }),
]) satisfies z.ZodType<Bloque>;

const diapositiva = z.strictObject({
  id,
  tipo: z.enum(['portada', 'contenido', 'cierre']),
  titulo: z.string().max(TOPES.titulo),
  subtitulo: z.string().max(TOPES.titulo).optional(),
  disposicion: z.enum(['una', 'columnas', 'filas', 'principal-lateral']).optional(),
  bloques: z.array(bloque).max(TOPES.bloquesPorDiapositiva),
}) satisfies z.ZodType<Diapositiva>;

const presentacion = z.strictObject({
  formato: z.literal(1),
  id,
  nombre: z.string().min(1).max(TOPES.nombre),
  descripcion: z.string().max(TOPES.descripcion).optional(),
  tema,
  periodos: z.array(idPeriodo).min(1).max(TOPES.periodos),
  diapositivas: z.array(diapositiva).min(1).max(TOPES.diapositivas),
  datos: z.record(id, conjunto),
  actualizado: z.string().max(40),
}) satisfies z.ZodType<Presentacion>;

const operacion = z.discriminatedUnion('op', [
  z.strictObject({ op: z.literal('presentacion.nombre'), valor: z.string().trim().min(1).max(TOPES.nombre) }),
  z.strictObject({ op: z.literal('presentacion.descripcion'), valor: z.string().max(TOPES.descripcion) }),
  z.strictObject({ op: z.literal('diapositiva.titulo'), diapositiva: id, valor: z.string().max(TOPES.titulo) }),
  z.strictObject({ op: z.literal('diapositiva.subtitulo'), diapositiva: id, valor: z.string().max(TOPES.titulo) }),
  z.strictObject({ op: z.literal('texto.contenido'), bloque: id, periodo: idPeriodo.nullable(), valor: texto.nullable() }),
  z.strictObject({ op: z.literal('cifras.valor'), bloque: id, periodo: idPeriodo.nullable(), valor: cifras.nullable() }),
  z.strictObject({ op: z.literal('datos.filas'), conjunto: id, periodo: idPeriodo.nullable(), valor: filas.nullable() }),
  z.strictObject({
    op: z.literal('datos.columna'),
    conjunto: id,
    clave,
    nombre: z.string().max(TOPES.titulo).optional(),
    decimales: z.number().int().min(0).max(6).nullable().optional(),
    unidad: z.string().max(40).optional(),
  }),
  z.strictObject({
    op: z.literal('porPeriodo'),
    destino: z.union([z.strictObject({ bloque: id }), z.strictObject({ conjunto: id })]),
    valor: z.boolean(),
    periodo: idPeriodo,
  }),
]) satisfies z.ZodType<Operacion>;

// ---------------------------------------------------------------------------
// Mensajes

function mensajes(error: z.ZodError): string[] {
  return error.issues.slice(0, 20).map((problema) => {
    const donde = problema.path.join('.');
    return donde ? `${donde}: ${problema.message}` : problema.message;
  });
}

export type Validacion<T> = { ok: true; valor: T } | { ok: false; errores: string[] };

// ---------------------------------------------------------------------------
// Referencias

function repetidos(valores: string[]): string[] {
  const vistos = new Set<string>();
  const dobles = new Set<string>();
  for (const v of valores) {
    if (vistos.has(v)) dobles.add(v);
    vistos.add(v);
  }
  return [...dobles];
}

function revisarFilas(conj: ConjuntoDatos, juego: Fila[], donde: string, errores: string[]): void {
  const tipos = new Map(conj.columnas.map((c) => [c.clave, c.tipo]));
  for (let i = 0; i < juego.length; i++) {
    for (const [k, valor] of Object.entries(juego[i])) {
      const tipo = tipos.get(k);
      if (!tipo) {
        errores.push(`${donde}, fila ${i + 1}: la columna "${k}" no existe en el conjunto.`);
      } else if (valor !== null && (tipo === 'texto') !== (typeof valor === 'string')) {
        errores.push(`${donde}, fila ${i + 1}, columna "${k}": se esperaba ${tipo === 'texto' ? 'un texto' : 'un número'}.`);
      }
      if (errores.length > 20) return;
    }
  }
}

/**
 * Revisa lo que los esquemas no ven: ids repetidos, bloques que apuntan a
 * conjuntos o columnas que no existen, meses fuera de la lista y celdas que no
 * corresponden al tipo de su columna. Devuelve la lista de problemas.
 */
export function revisarReferencias(p: Presentacion): string[] {
  const errores: string[] = [];
  const periodos = new Set(p.periodos);

  if (periodos.size !== p.periodos.length) errores.push('Hay meses repetidos.');
  if (p.periodos.some((m, i) => i > 0 && m <= p.periodos[i - 1])) errores.push('Los meses deben ir del más antiguo al más reciente.');

  for (const d of repetidos(p.diapositivas.map((x) => x.id))) errores.push(`El id de diapositiva "${d}" está repetido.`);
  for (const b of repetidos(p.diapositivas.flatMap((x) => x.bloques.map((y) => y.id)))) errores.push(`El id de bloque "${b}" está repetido.`);

  const fueraDeLista = (claves: string[] | undefined) => (claves ?? []).filter((m) => !periodos.has(m));

  if (Object.keys(p.datos).length > TOPES.conjuntos) errores.push('Hay demasiados conjuntos de datos.');
  for (const [nombre, conj] of Object.entries(p.datos)) {
    const donde = `Conjunto "${nombre}"`;
    if (conj.id !== nombre) errores.push(`${donde}: su id ("${conj.id}") no coincide con su clave.`);
    for (const c of repetidos(conj.columnas.map((x) => x.clave))) errores.push(`${donde}: la columna "${c}" está repetida.`);
    if (conj.porPeriodo && conj.filas) errores.push(`${donde}: es propio de cada mes pero trae filas únicas.`);
    if (!conj.porPeriodo && conj.filasPorPeriodo) errores.push(`${donde}: es igual en todos los meses pero trae filas por mes.`);
    for (const m of fueraDeLista(conj.filasPorPeriodo && Object.keys(conj.filasPorPeriodo))) errores.push(`${donde}: tiene datos del mes "${m}", que no está en la presentación.`);
    if (conj.filas) revisarFilas(conj, conj.filas, donde, errores);
    for (const [m, juego] of Object.entries(conj.filasPorPeriodo ?? {})) revisarFilas(conj, juego, `${donde}, ${m}`, errores);
    if (errores.length > 20) return errores;
  }

  for (const d of p.diapositivas) {
    for (const b of d.bloques) {
      const donde = `Bloque "${b.id}"`;
      if (b.tipo === 'grafico' || b.tipo === 'tabla') {
        const conj = Object.hasOwn(p.datos, b.datos) ? p.datos[b.datos] : undefined;
        if (!conj) {
          errores.push(`${donde}: el conjunto de datos "${b.datos}" no existe.`);
          continue;
        }
        const columnas = new Set(conj.columnas.map((c) => c.clave));
        const usadas = b.tipo === 'grafico' ? [b.ejeX, ...b.series.map((s) => s.clave)] : b.columnas ?? [];
        if (b.resaltar) usadas.push(b.resaltar.columna);
        for (const c of usadas) if (!columnas.has(c)) errores.push(`${donde}: la columna "${c}" no existe en "${b.datos}".`);
      } else {
        const dato = b.tipo === 'texto' ? b.contenido : b.cifras;
        if (dato.porPeriodo && dato.valor !== undefined) errores.push(`${donde}: es propio de cada mes pero trae un valor único.`);
        if (!dato.porPeriodo && dato.valores) errores.push(`${donde}: es igual en todos los meses pero trae valores por mes.`);
        for (const m of fueraDeLista(dato.valores && Object.keys(dato.valores))) errores.push(`${donde}: tiene contenido del mes "${m}", que no está en la presentación.`);
      }
    }
  }

  return errores;
}

/** Bytes que ocupa un valor al guardarlo como JSON. */
export function pesoJson(valor: unknown): number {
  return new TextEncoder().encode(JSON.stringify(valor)).length;
}

// ---------------------------------------------------------------------------
// Entradas

/** Forma, topes, referencias y tamaño de una presentación completa. */
export function validarPresentacion(dato: unknown): Validacion<Presentacion> {
  const forma = presentacion.safeParse(dato);
  if (!forma.success) return { ok: false, errores: mensajes(forma.error) };
  const errores = revisarReferencias(forma.data);
  if (errores.length) return { ok: false, errores };
  if (pesoJson(forma.data) > TOPES.presentacion) return { ok: false, errores: ['La presentación pasa del tamaño máximo.'] };
  return { ok: true, valor: forma.data };
}

/** Forma y topes de una lista de operaciones (lo que llega en un guardado). */
export function validarOperaciones(dato: unknown): Validacion<Operacion[]> {
  const forma = z.array(operacion).min(1).max(TOPES.operacionesPorEnvio).safeParse(dato);
  if (!forma.success) return { ok: false, errores: mensajes(forma.error) };
  return { ok: true, valor: forma.data };
}
