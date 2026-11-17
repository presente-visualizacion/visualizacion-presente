// Validación de presentaciones y de operaciones de edición.
//
// La edición está abierta, así que el servidor no confía en lo que llega:
// revisa cada operación y la presentación que resulta antes de guardarla. El
// mismo validador sirve para lo que se importe más adelante (Excel, migración).
//
// Los esquemas se atan a `tipos.ts` con `satisfies`: si un día dejan de
// coincidir con los tipos, el compilador avisa.

import { z } from 'zod';
import type {
  Bloque, BloqueGrafico, Cifra, Columna, ConjuntoDatos, Diapositiva, Fila, OrigenExcel, Presentacion, SelectorFila, Tarjeta, Tema,
} from '../tipos';
import { cifrasDe, columnasDeFuente, type ConfigGrafico, type ConfigTabla, type Operacion } from './operaciones';

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
  tarjetasPorBloque: 8,
  tarjetaTexto: 600,
  calculadasPorTabla: 12,
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
  grupo: z.string().max(80).optional(),
  signo: z.boolean().optional(),
}) satisfies z.ZodType<Columna>;

const celda = z.union([z.string().max(TOPES.celdaTexto), z.number(), z.null()]);
const fila = z.record(clave, celda) satisfies z.ZodType<Fila>;
const filas = z.array(fila).max(TOPES.filasPorMes);

// Las claves de `columnas` que ya no estén en el conjunto se ignoran al cargar:
// no se revisan como referencias (ver "Modelo" en el diseño de la etapa 3).
const origen = z.strictObject({
  archivo: z.string().max(200),
  hoja: z.string().max(100),
  orientacion: z.enum(['filas', 'columnas']),
  encabezados: z.number().int().min(1).max(1_048_576),
  columnas: z.array(z.strictObject({
    clave,
    encabezado: z.string().max(TOPES.titulo),
    fechas: z.enum(['dia', 'mes', 'anio']).optional(),
  })).max(TOPES.columnas),
  hasta: z.enum(['vacia', 'final']),
  invertir: z.boolean().optional(),
  sobrantes: z.enum(['primeras', 'ultimas']).optional(),
  cargado: z.string().max(40),
  periodo: idPeriodo.nullable(),
}) satisfies z.ZodType<OrigenExcel>;

const conjunto = z.strictObject({
  id,
  nombre: z.string().max(TOPES.titulo),
  columnas: z.array(columna).min(1).max(TOPES.columnas),
  porPeriodo: z.boolean(),
  filas: filas.optional(),
  filasPorPeriodo: z.record(idPeriodo, filas).optional(),
  origen: origen.optional(),
}) satisfies z.ZodType<ConjuntoDatos>;

const selectorFila = z.union([
  z.literal('primera'),
  z.literal('ultima'),
  z.strictObject({ columna: clave, valor: z.string().max(TOPES.celdaTexto) }),
]) satisfies z.ZodType<SelectorFila>;

const cifra = z.strictObject({
  etiqueta: z.string().max(80),
  valor: z.string().max(40),
  detalle: z.string().max(120).optional(),
  desde: z.strictObject({
    conjunto: id,
    columna: clave,
    fila: selectorFila,
    detalle: clave.optional(),
    comparar: selectorFila.optional(),
  }).optional(),
}) satisfies z.ZodType<Cifra>;
const cifras = z.array(cifra).max(TOPES.cifrasPorBloque);
const texto = z.string().max(TOPES.texto);
const tarjeta = z.strictObject({
  titulo: z.string().max(80),
  texto: z.string().max(TOPES.tarjetaTexto),
}) satisfies z.ZodType<Tarjeta>;
const tarjetas = z.array(tarjeta).max(TOPES.tarjetasPorBloque);

function porPeriodo<T extends z.ZodType>(valor: T) {
  return z.strictObject({
    porPeriodo: z.boolean(),
    valor: valor.optional(),
    valores: z.record(idPeriodo, valor).optional(),
  });
}

const resaltado = z.strictObject({ columna: clave, valor: z.string().max(TOPES.celdaTexto) });

export const FORMAS = ['lineas', 'barras', 'barrasHorizontales', 'area', 'combinado', 'circular', 'dispersion', 'radar', 'cascada'] as const;

const camposGrafico = {
  datos: id,
  forma: z.enum(FORMAS),
  ejeX: clave,
  series: z.array(z.strictObject({
    clave, color: color.optional(), tipo: z.enum(['barras', 'lineas']).optional(), punteada: z.boolean().optional(),
  })).min(1).max(12),
  apilado: z.boolean().optional(),
  etiquetas: z.boolean().optional(),
  resaltar: resaltado.optional(),
  total: z.boolean().optional(),
  nombres: clave.optional(),
  detalleEje: clave.optional(),
};
const camposTabla = {
  datos: id,
  columnas: z.array(clave).min(1).max(TOPES.columnas).optional(),
  resaltar: resaltado.optional(),
  secciones: clave.optional(),
  calculadas: z.array(z.strictObject({
    tipo: z.enum(['variacion', 'posicion']),
    columna: clave,
    orden: z.enum(['asc', 'desc']).optional(),
  })).max(TOPES.calculadasPorTabla).optional(),
};
const marco = {
  titulo: z.string().max(TOPES.titulo).optional(),
  nota: z.string().max(TOPES.titulo).optional(),
};
const configGrafico = z.strictObject(camposGrafico) satisfies z.ZodType<ConfigGrafico>;
const configTabla = z.strictObject(camposTabla) satisfies z.ZodType<ConfigTabla>;

const bloque = z.discriminatedUnion('tipo', [
  z.strictObject({ id, tipo: z.literal('grafico'), ...marco, ...camposGrafico }),
  z.strictObject({ id, tipo: z.literal('tabla'), ...marco, ...camposTabla }),
  z.strictObject({ id, tipo: z.literal('texto'), ...marco, contenido: porPeriodo(texto) }),
  z.strictObject({ id, tipo: z.literal('cifras'), ...marco, cifras: porPeriodo(cifras) }),
  z.strictObject({ id, tipo: z.literal('tarjetas'), ...marco, tarjetas: porPeriodo(tarjetas) }),
]) satisfies z.ZodType<Bloque>;

const tipoDiapositiva = z.enum(['portada', 'contenido', 'cierre']);
export const DISPOSICIONES = ['una', 'columnas', 'filas', 'principal-lateral', 'cuadricula'] as const;
const disposicion = z.enum(DISPOSICIONES);

const diapositiva = z.strictObject({
  id,
  tipo: tipoDiapositiva,
  titulo: z.string().max(TOPES.titulo),
  subtitulo: z.string().max(TOPES.titulo).optional(),
  disposicion: disposicion.optional(),
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
  z.strictObject({ op: z.literal('tarjetas.valor'), bloque: id, periodo: idPeriodo.nullable(), valor: tarjetas.nullable() }),
  z.strictObject({
    op: z.literal('bloque.marco'), bloque: id, titulo: z.string().max(TOPES.titulo), nota: z.string().max(TOPES.titulo),
  }),
  z.strictObject({
    op: z.literal('datos.columna'),
    conjunto: id,
    clave,
    nombre: z.string().max(TOPES.titulo).optional(),
    decimales: z.number().int().min(0).max(6).nullable().optional(),
    unidad: z.string().max(40).optional(),
    grupo: z.string().max(80).optional(),
    signo: z.boolean().optional(),
  }),
  z.strictObject({
    op: z.literal('porPeriodo'),
    destino: z.union([z.strictObject({ bloque: id }), z.strictObject({ conjunto: id })]),
    valor: z.boolean(),
    periodo: idPeriodo,
  }),
  z.strictObject({ op: z.literal('diapositiva.poner'), diapositiva, despues: id.nullable() }),
  z.strictObject({ op: z.literal('diapositiva.quitar'), diapositiva: id }),
  z.strictObject({ op: z.literal('diapositiva.mover'), diapositiva: id, despues: id.nullable() }),
  z.strictObject({ op: z.literal('diapositiva.tipo'), diapositiva: id, valor: tipoDiapositiva }),
  z.strictObject({ op: z.literal('diapositiva.disposicion'), diapositiva: id, valor: disposicion }),
  z.strictObject({ op: z.literal('bloque.poner'), diapositiva: id, bloque, despues: id.nullable() }),
  z.strictObject({ op: z.literal('bloque.quitar'), bloque: id }),
  z.strictObject({ op: z.literal('bloque.mover'), bloque: id, despues: id.nullable() }),
  z.strictObject({ op: z.literal('grafico.config'), bloque: id, valor: configGrafico }),
  z.strictObject({ op: z.literal('tabla.config'), bloque: id, valor: configTabla }),
  z.strictObject({ op: z.literal('conjunto.poner'), conjunto }),
  z.strictObject({ op: z.literal('conjunto.quitar'), conjunto: id }),
  z.strictObject({ op: z.literal('datos.nombre'), conjunto: id, valor: z.string().max(TOPES.titulo) }),
  z.strictObject({ op: z.literal('datos.columnas'), conjunto: id, valor: z.array(columna).min(1).max(TOPES.columnas) }),
  z.strictObject({ op: z.literal('tema'), valor: tema }),
  z.strictObject({ op: z.literal('periodo.agregar'), periodo: idPeriodo, copiarDe: idPeriodo.nullable() }),
  z.strictObject({ op: z.literal('periodo.quitar'), periodo: idPeriodo }),
  z.strictObject({ op: z.literal('datos.origen'), conjunto: id, valor: origen.nullable() }),
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

/** Series que admite cada forma: [mínimo, máximo]. */
export const SERIES_POR_FORMA: Record<(typeof FORMAS)[number], [number, number]> = {
  lineas: [1, 12], barras: [1, 12], barrasHorizontales: [1, 12], area: [1, 12], combinado: [1, 12],
  circular: [1, 1], dispersion: [1, 1], cascada: [1, 1], radar: [1, 6],
};

/** Lo que exige cada forma de gráfico (ver "Tipos de gráfico" en PLAN.md). */
export function problemasDeForma(b: BloqueGrafico, conj: ConjuntoDatos): string[] {
  const errores: string[] = [];
  const tipo = new Map(conj.columnas.map((c) => [c.clave, c.tipo]));
  const [minimo, maximo] = SERIES_POR_FORMA[b.forma];
  if (b.series.length < minimo || b.series.length > maximo) {
    errores.push(minimo === maximo ? `este tipo de gráfico usa exactamente ${minimo} serie.` : `este tipo de gráfico usa de ${minimo} a ${maximo} series.`);
  }
  for (const s of b.series) if (tipo.get(s.clave) === 'texto') errores.push(`la serie "${s.clave}" debe ser una columna numérica.`);
  for (const r of repetidos(b.series.map((s) => s.clave))) errores.push(`la serie "${r}" está repetida.`);
  if (b.forma === 'dispersion' && tipo.get(b.ejeX) === 'texto') errores.push('en la dispersión el eje debe ser una columna numérica.');
  if (b.nombres && tipo.get(b.nombres) !== undefined && tipo.get(b.nombres) !== 'texto') errores.push('los nombres de los puntos deben ser una columna de texto.');
  return errores;
}

/** Lo que exige una tabla con secciones o columnas calculadas. */
export function problemasDeTabla(b: Extract<Bloque, { tipo: 'tabla' }>, conj: ConjuntoDatos): string[] {
  const errores: string[] = [];
  const tipo = new Map(conj.columnas.map((c) => [c.clave, c.tipo]));
  if (b.secciones && tipo.get(b.secciones) !== undefined && tipo.get(b.secciones) !== 'texto') errores.push('las secciones deben salir de una columna de texto.');
  for (const c of b.calculadas ?? []) {
    if (tipo.get(c.columna) === 'texto') errores.push(`la columna calculada sobre "${c.columna}" necesita una columna numérica.`);
  }
  for (const r of repetidos((b.calculadas ?? []).map((c) => `${c.tipo} de "${c.columna}"`))) errores.push(`la ${r} está repetida.`);
  return errores;
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
        const usadas = b.tipo === 'grafico' ? [b.ejeX, ...b.series.map((s) => s.clave)] : [...(b.columnas ?? [])];
        if (b.resaltar) usadas.push(b.resaltar.columna);
        if (b.tipo === 'grafico' && b.nombres) usadas.push(b.nombres);
        if (b.tipo === 'grafico' && b.detalleEje) usadas.push(b.detalleEje);
        if (b.tipo === 'tabla') {
          if (b.secciones) usadas.push(b.secciones);
          usadas.push(...(b.calculadas ?? []).map((c) => c.columna));
          errores.push(...problemasDeTabla(b, conj).map((e) => `${donde}: ${e}`));
        }
        for (const c of usadas) if (!columnas.has(c)) errores.push(`${donde}: la columna "${c}" no existe en "${b.datos}".`);
        if (b.tipo === 'grafico') errores.push(...problemasDeForma(b, conj).map((e) => `${donde}: ${e}`));
      } else {
        if (b.tipo === 'cifras') {
          for (const c of cifrasDe(b)) {
            if (!c.desde) continue;
            const conj = Object.hasOwn(p.datos, c.desde.conjunto) ? p.datos[c.desde.conjunto] : undefined;
            if (!conj) {
              errores.push(`${donde}: la cifra "${c.etiqueta}" usa el conjunto "${c.desde.conjunto}", que no existe.`);
              continue;
            }
            const columnas = new Set(conj.columnas.map((x) => x.clave));
            for (const k of columnasDeFuente(c.desde)) if (!columnas.has(k)) errores.push(`${donde}: la cifra "${c.etiqueta}" usa la columna "${k}", que no existe en "${conj.id}".`);
          }
        }
        const dato = b.tipo === 'texto' ? b.contenido : b.tipo === 'cifras' ? b.cifras : b.tarjetas;
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
