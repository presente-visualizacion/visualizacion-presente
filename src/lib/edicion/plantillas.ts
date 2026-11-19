// Piezas nuevas para la edición de estructura (etapa 2B): ids, bloques y
// conjuntos de ejemplo, copias para duplicar y el ajuste de la configuración
// de un gráfico cuando cambia de tipo. Sin React: se prueba aparte.

import type {
  Bloque, BloqueGrafico, Cifra, Columna, ConjuntoDatos, Diapositiva, Disposicion, FormaGrafico, IdPeriodo, Presentacion, Serie, Ubicacion,
} from '../tipos';
import { hacerLugar, ubicacionesDesde, ubicacionesEfectivas, ubicacionNueva } from '../disposicion';
import type { ConfigGrafico, Operacion } from './operaciones';
import { SERIES_POR_FORMA, TOPES } from './validar';

const LETRAS = 'abcdefghijkmnpqrstuvwxyz23456789';

/** Id nuevo con prefijo: "d-k3f9x2ab". Comprueba que no esté en uso. */
export function nuevoId(prefijo: 'd' | 'b' | 'c', enUso: Set<string> = new Set()): string {
  for (;;) {
    const azar = new Uint8Array(8);
    crypto.getRandomValues(azar);
    const id = `${prefijo}-${Array.from(azar, (n) => LETRAS[n % LETRAS.length]).join('')}`;
    if (!enUso.has(id)) {
      enUso.add(id);
      return id;
    }
  }
}

/**
 * Todos los ids de la presentación (diapositivas, bloques y conjuntos),
 * también los de las diapositivas guardadas: así, al volver a poner una, sus
 * ids siguen libres.
 */
export function idsEnUso(p: Presentacion): Set<string> {
  const guardadas = p.guardadas ?? [];
  return new Set([
    ...p.diapositivas.map((d) => d.id),
    ...p.diapositivas.flatMap((d) => d.bloques.map((b) => b.id)),
    ...Object.keys(p.datos),
    ...guardadas.map((g) => g.diapositiva.id),
    ...guardadas.flatMap((g) => g.diapositiva.bloques.map((b) => b.id)),
    ...guardadas.flatMap((g) => g.conjuntos.map((c) => c.id)),
  ]);
}

/** Ids de los conjuntos que usa la diapositiva (gráficos, tablas y cifras que salen de datos). */
export function conjuntosDeDiapositiva(d: Diapositiva): Set<string> {
  const ids = new Set<string>();
  const deCifras = (cifras: Cifra[] | undefined) => cifras?.forEach((c) => c.desde && ids.add(c.desde.conjunto));
  for (const b of d.bloques) {
    if (b.tipo === 'grafico' || b.tipo === 'tabla') ids.add(b.datos);
    if (b.tipo === 'cifras') {
      deCifras(b.cifras.valor);
      Object.values(b.cifras.valores ?? {}).forEach(deCifras);
    }
  }
  return ids;
}

/** Primera clave libre del tipo "col1", "col2"... */
export function claveLibre(columnas: Columna[]): string {
  const usadas = new Set(columnas.map((c) => c.clave));
  for (let i = 1; ; i++) if (!usadas.has(`col${i}`)) return `col${i}`;
}

export const esNumerica = (c: Columna) => c.tipo !== 'texto';

// ---------------------------------------------------------------------------
// Diapositivas y bloques nuevos

export function diapositivaNueva(tipo: Diapositiva['tipo'], enUso: Set<string>): Diapositiva {
  const id = nuevoId('d', enUso);
  if (tipo === 'portada') return { id, tipo, titulo: 'Título de la presentación', subtitulo: '{mes}', bloques: [] };
  if (tipo === 'cierre') return { id, tipo, titulo: 'Gracias', bloques: [] };
  return { id, tipo, titulo: 'Título de la diapositiva', disposicion: 'una', bloques: [] };
}

export type TipoNuevo = 'grafico' | 'tabla' | 'texto' | 'cifras' | 'tarjetas';

/** Conjunto con columnas y tres filas de ejemplo, según lo que pide la forma. */
export function conjuntoEjemplo(id: string, forma: FormaGrafico | 'tabla'): ConjuntoDatos {
  const texto = (clave: string, nombre: string): Columna => ({ clave, nombre, tipo: 'texto' });
  const numero = (clave: string, nombre: string): Columna => ({ clave, nombre, tipo: 'numero' });
  let columnas: Columna[];
  let filas: Record<string, string | number>[];
  switch (forma) {
    case 'dispersion':
      columnas = [texto('col1', 'Nombre'), numero('col2', 'Variable X'), numero('col3', 'Variable Y')];
      filas = [{ col1: 'Ejemplo A', col2: 10, col3: 22 }, { col1: 'Ejemplo B', col2: 18, col3: 15 }, { col1: 'Ejemplo C', col2: 25, col3: 30 }];
      break;
    case 'circular':
      columnas = [texto('col1', 'Categoría'), numero('col2', 'Valor')];
      filas = [{ col1: 'Ejemplo A', col2: 50 }, { col1: 'Ejemplo B', col2: 30 }, { col1: 'Ejemplo C', col2: 20 }];
      break;
    case 'cascada':
      columnas = [texto('col1', 'Concepto'), numero('col2', 'Variación')];
      filas = [{ col1: 'Inicio', col2: 100 }, { col1: 'Sube', col2: 30 }, { col1: 'Baja', col2: -20 }];
      break;
    default:
      columnas = [texto('col1', 'Categoría'), numero('col2', 'Serie 1'), numero('col3', 'Serie 2')];
      filas = [{ col1: 'Ejemplo A', col2: 12, col3: 8 }, { col1: 'Ejemplo B', col2: 18, col3: 14 }, { col1: 'Ejemplo C', col2: 15, col3: 20 }];
  }
  return { id, nombre: 'Datos nuevos', columnas, porPeriodo: false, filas };
}

/**
 * Bloque nuevo. Para gráfico y tabla, `conjunto` es el que mostrará (nuevo o
 * uno que ya existe).
 */
export function bloqueNuevo(tipo: TipoNuevo, enUso: Set<string>, conjunto?: ConjuntoDatos): Bloque {
  const id = nuevoId('b', enUso);
  if (tipo === 'texto') return { id, tipo, contenido: { porPeriodo: false, valor: 'Escribe aquí el texto.' } };
  if (tipo === 'cifras') return { id, tipo, cifras: { porPeriodo: false, valor: [{ etiqueta: 'Indicador', valor: '0' }] } };
  if (tipo === 'tarjetas') return { id, tipo, tarjetas: { porPeriodo: false, valor: [{ titulo: 'Título', texto: 'Escribe aquí el texto.' }] } };
  if (!conjunto) throw new Error('Un gráfico o una tabla necesita un conjunto de datos.');
  if (tipo === 'tabla') return { id, tipo, datos: conjunto.id };
  const eje = conjunto.columnas.find((c) => !esNumerica(c)) ?? conjunto.columnas[0];
  const series = conjunto.columnas.filter((c) => esNumerica(c) && c.clave !== eje.clave).map((c) => ({ clave: c.clave }));
  const base: BloqueGrafico = { id, tipo, datos: conjunto.id, forma: 'barras', ejeX: eje.clave, series };
  return { ...base, ...configPara('barras', base, conjunto) };
}

// ---------------------------------------------------------------------------
// Ajuste al cambiar de forma

/** Formas con un eje de valores al que se le puede fijar el rango. */
/** Formas que pueden mostrar fijo el detalle de una fila (las de Grafico.tsx). */
export const CON_DETALLE_FIJO: FormaGrafico[] = ['lineas', 'barras', 'barrasHorizontales', 'area', 'combinado'];

export const CON_RANGO_EJE: FormaGrafico[] = ['lineas', 'barras', 'barrasHorizontales', 'area', 'combinado', 'dispersion', 'radar', 'cascada'];

/** Formas que dibujan líneas de referencia. */
export const CON_REFERENCIAS: FormaGrafico[] = ['lineas', 'barras', 'barrasHorizontales', 'area', 'combinado', 'cascada'];

/** Por qué el conjunto no sirve para esa forma; null si sirve. */
export function motivoNoDisponible(forma: FormaGrafico, conjunto: ConjuntoDatos): string | null {
  const numericas = conjunto.columnas.filter(esNumerica).length;
  if (forma === 'dispersion') return numericas >= 2 ? null : 'Necesita dos columnas numéricas.';
  return numericas >= 1 ? null : 'Necesita al menos una columna numérica.';
}

/**
 * Configuración válida para `forma` partiendo de la actual: conserva lo que
 * se pueda (eje, series, colores) y corrige lo demás. Supone que
 * `motivoNoDisponible` es null.
 */
export function configPara(forma: FormaGrafico, actual: ConfigGrafico, conjunto: ConjuntoDatos): ConfigGrafico {
  const columna = (clave?: string) => conjunto.columnas.find((c) => c.clave === clave);
  const numericas = conjunto.columnas.filter(esNumerica);

  // Eje: numérico en la dispersión; en los demás, mejor uno de texto.
  let ejeX = actual.ejeX;
  if (forma === 'dispersion') {
    if (!columna(ejeX) || !esNumerica(columna(ejeX)!)) ejeX = numericas[0].clave;
  } else if (!columna(ejeX) || (actual.forma === 'dispersion' && esNumerica(columna(ejeX)!))) {
    // Al salir de la dispersión el eje vuelve a una columna de texto, si hay.
    ejeX = (conjunto.columnas.find((c) => !esNumerica(c)) ?? columna(ejeX) ?? conjunto.columnas[0]).clave;
  }

  // Series: numéricas, sin repetir y distintas del eje.
  let series: Serie[] = actual.series.filter((s, i, todas) => {
    const c = columna(s.clave);
    return c && esNumerica(c) && s.clave !== ejeX && todas.findIndex((x) => x.clave === s.clave) === i;
  });
  if (!series.length) {
    const primera = numericas.find((c) => c.clave !== ejeX) ?? numericas[0];
    series = [{ clave: primera.clave }];
  }
  const [, maximo] = SERIES_POR_FORMA[forma];
  series = series.slice(0, maximo).map(({ tipo: _tipo, ...s }) => s);
  if (forma === 'combinado') {
    const previas = new Map(actual.series.map((s) => [s.clave, s.tipo]));
    series = series.map((s, i) => ({ ...s, tipo: previas.get(s.clave) ?? (i === 0 ? 'barras' : 'lineas') }));
  }

  const config: ConfigGrafico = { datos: actual.datos, forma, ejeX, series };
  if (actual.apilado && (forma === 'barras' || forma === 'area')) config.apilado = true;
  if (actual.etiquetas && ['barras', 'barrasHorizontales', 'combinado', 'cascada', 'circular', 'dispersion'].includes(forma)) config.etiquetas = true;
  if (actual.resaltar && ['barras', 'barrasHorizontales', 'dispersion'].includes(forma) && columna(actual.resaltar.columna)) config.resaltar = actual.resaltar;
  if (actual.detalleEje && (forma === 'barras' || forma === 'combinado') && columna(actual.detalleEje)) config.detalleEje = actual.detalleEje;
  if (actual.rangoEje && CON_RANGO_EJE.includes(forma)) config.rangoEje = actual.rangoEje;
  if (actual.referencias && CON_REFERENCIAS.includes(forma)) config.referencias = actual.referencias;
  if (actual.detalleFijo && CON_DETALLE_FIJO.includes(forma)) config.detalleFijo = true;
  if (forma === 'cascada') config.total = actual.forma === 'cascada' ? Boolean(actual.total) : true;
  if (forma === 'dispersion') {
    const nombres = columna(actual.nombres)?.tipo === 'texto' ? actual.nombres : conjunto.columnas.find((c) => !esNumerica(c))?.clave;
    if (nombres) config.nombres = nombres;
  }
  return config;
}

// ---------------------------------------------------------------------------
// Duplicar

/** Copia del conjunto con id y nombre nuevos. */
export function copiaDeConjunto(conjunto: ConjuntoDatos, enUso: Set<string>): ConjuntoDatos {
  return { ...structuredClone(conjunto), id: nuevoId('c', enUso), nombre: `${conjunto.nombre} (copia)`.slice(0, 200) };
}

/**
 * Copia del bloque con id nuevo. Si muestra datos, los copia en un conjunto
 * nuevo (salvo que ya se hayan copiado: `copiados` lleva la cuenta, para que
 * un gráfico y una tabla con los mismos datos sigan compartiéndolos).
 */
export function copiaDeBloque(
  p: Presentacion, bloque: Bloque, enUso: Set<string>, copiados: Map<string, ConjuntoDatos> = new Map(),
): { bloque: Bloque; conjuntos: ConjuntoDatos[] } {
  const copia = { ...structuredClone(bloque), id: nuevoId('b', enUso) };
  if (copia.tipo !== 'grafico' && copia.tipo !== 'tabla') return { bloque: copia, conjuntos: [] };
  const original = p.datos[copia.datos];
  if (!original) return { bloque: copia, conjuntos: [] };
  const previo = copiados.get(original.id);
  if (previo) return { bloque: { ...copia, datos: previo.id }, conjuntos: [] };
  const nuevo = copiaDeConjunto(original, enUso);
  copiados.set(original.id, nuevo);
  return { bloque: { ...copia, datos: nuevo.id }, conjuntos: [nuevo] };
}

export function copiaDeDiapositiva(p: Presentacion, d: Diapositiva, enUso: Set<string>): { diapositiva: Diapositiva; conjuntos: ConjuntoDatos[] } {
  const copiados = new Map<string, ConjuntoDatos>();
  const conjuntos: ConjuntoDatos[] = [];
  const bloques = d.bloques.map((b) => {
    const r = copiaDeBloque(p, b, enUso, copiados);
    conjuntos.push(...r.conjuntos);
    return r.bloque;
  });
  // Las cifras que salen de datos copiados en esta misma diapositiva apuntan a la copia.
  const remitir = (c: Cifra): Cifra => {
    const nuevo = c.desde && copiados.get(c.desde.conjunto);
    return nuevo && c.desde ? { ...c, desde: { ...c.desde, conjunto: nuevo.id } } : c;
  };
  const conCopias = bloques.map((b): Bloque => {
    if (b.tipo !== 'cifras') return b;
    const { cifras } = b;
    return {
      ...b,
      cifras: cifras.porPeriodo
        ? { ...cifras, valores: Object.fromEntries(Object.entries(cifras.valores ?? {}).map(([m, v]) => [m, v.map(remitir)])) }
        : { ...cifras, valor: cifras.valor?.map(remitir) },
    };
  });
  return { diapositiva: { ...structuredClone(d), id: nuevoId('d', enUso), bloques: conCopias }, conjuntos };
}

// ---------------------------------------------------------------------------
// Meses

/** El mes siguiente: "2026-12" → "2027-01". */
export function mesSiguiente(periodo: IdPeriodo): IdPeriodo {
  const [anio, mes] = periodo.split('-').map(Number);
  return mes === 12 ? `${anio + 1}-01` : `${anio}-${String(mes + 1).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Acciones del panel: cada una devuelve las operaciones de un solo paso de
// deshacer.

/** Conjuntos que quedarían sin uso si se quitan esos bloques. */
function conjuntosHuerfanos(p: Presentacion, quitados: Set<string>): string[] {
  const usados = new Set<string>();
  const candidatos = new Set<string>();
  for (const d of p.diapositivas) {
    for (const b of d.bloques) {
      if (b.tipo !== 'grafico' && b.tipo !== 'tabla') continue;
      (quitados.has(b.id) ? candidatos : usados).add(b.datos);
    }
  }
  return [...candidatos].filter((c) => !usados.has(c) && Object.hasOwn(p.datos, c));
}

export function opsQuitarBloque(p: Presentacion, bloque: string): Operacion[] {
  return [
    { op: 'bloque.quitar', bloque },
    ...conjuntosHuerfanos(p, new Set([bloque])).map((c): Operacion => ({ op: 'conjunto.quitar', conjunto: c })),
  ];
}

/**
 * Quita la diapositiva y la deja guardada (con copia de sus datos) en
 * `guardadas`, para poder volver a ponerla. Ver "Diapositivas quitadas" en PLAN.md.
 */
export function opsQuitarDiapositiva(p: Presentacion, diapositiva: string, ahora = new Date().toISOString()): Operacion[] {
  const indice = p.diapositivas.findIndex((x) => x.id === diapositiva);
  if (indice < 0) return [];
  const d = p.diapositivas[indice];
  const conjuntos = [...conjuntosDeDiapositiva(d)].filter((c) => Object.hasOwn(p.datos, c)).map((c) => structuredClone(p.datos[c]));
  const guardadas = p.guardadas ?? [];
  // Si la lista está llena, se va la más antigua.
  const sobrantes = guardadas.length >= TOPES.guardadas ? guardadas.slice(TOPES.guardadas - 1) : [];
  return [
    ...sobrantes.map((g): Operacion => ({ op: 'guardada.quitar', diapositiva: g.diapositiva.id })),
    {
      op: 'guardada.poner',
      guardada: { diapositiva: structuredClone(d), conjuntos, quitada: ahora, despues: indice > 0 ? p.diapositivas[indice - 1].id : null },
    },
    { op: 'diapositiva.quitar', diapositiva },
    ...conjuntosHuerfanos(p, new Set(d.bloques.map((b) => b.id))).map((c): Operacion => ({ op: 'conjunto.quitar', conjunto: c })),
  ];
}

export function opsDuplicarDiapositiva(p: Presentacion, diapositiva: string): { ops: Operacion[]; id: string } | null {
  const d = p.diapositivas.find((x) => x.id === diapositiva);
  if (!d) return null;
  const copia = copiaDeDiapositiva(p, d, idsEnUso(p));
  copia.diapositiva.titulo = `${d.titulo} (copia)`.slice(0, 200);
  return {
    id: copia.diapositiva.id,
    ops: [
      ...copia.conjuntos.map((c): Operacion => ({ op: 'conjunto.poner', conjunto: c })),
      { op: 'diapositiva.poner', diapositiva: copia.diapositiva, despues: d.id },
    ],
  };
}

/**
 * Cambiar la disposición. Al pasar a "libre", cada bloque recibe el lugar que
 * ya tenía en pantalla, para que nada salte; después se mueve a gusto.
 */
export function opsCambiarDisposicion(d: Diapositiva, valor: Disposicion): Operacion[] {
  const ops: Operacion[] = [{ op: 'diapositiva.disposicion', diapositiva: d.id, valor }];
  const actual = d.disposicion ?? 'una';
  if (valor === 'libre' && actual !== 'libre') {
    const lugares = ubicacionesDesde(actual === 'una' && d.bloques.length > 1 ? 'filas' : actual, d.bloques);
    d.bloques.forEach((b, i) => ops.push({ op: 'bloque.aspecto', bloque: b.id, fondo: b.fondo ?? null, ubicacion: lugares[i] }));
  }
  return ops;
}

/** Lo que ocupa cada bloque con la disposición libre (si todavía no lo es, lo que se ve ahora). */
export function lugaresLibres(d: Diapositiva): Ubicacion[] {
  const actual = d.disposicion ?? 'una';
  if (actual === 'libre') return ubicacionesEfectivas(d.bloques);
  return ubicacionesDesde(actual === 'una' && d.bloques.length > 1 ? 'filas' : actual, d.bloques);
}

/**
 * Mover o agrandar un bloque arrastrándolo en la diapositiva. Si la
 * diapositiva no es libre, primero pasa a libre (todo queda donde estaba).
 */
export function opsUbicarBloque(d: Diapositiva, bloque: string, ubicacion: Ubicacion): Operacion[] {
  const b = d.bloques.find((x) => x.id === bloque);
  if (!b) return [];
  const ops = (d.disposicion ?? 'una') === 'libre' ? [] : opsCambiarDisposicion(d, 'libre');
  ops.push({ op: 'bloque.aspecto', bloque, fondo: b.fondo ?? null, ubicacion });
  return ops;
}

/**
 * "Insertar" desde la diapositiva: el bloque nuevo va en un lugar libre (la
 * diapositiva pasa a libre si no lo era). Si no hay lugar, se achica lo de
 * abajo para dejar dos filas.
 */
export function opsInsertarBloque(p: Presentacion, diapositiva: string, tipo: TipoNuevo): { ops: Operacion[]; bloque: Bloque } | null {
  const d = p.diapositivas.find((x) => x.id === diapositiva);
  if (!d) return null;
  const agregado = opsAgregarBloque(p, diapositiva, tipo);
  if (!agregado) return null;
  const lugares = lugaresLibres(d);
  const { ubicacion, cambios } = hacerLugar(d.bloques.map((b, i) => ({ id: b.id, ubicacion: lugares[i] })));
  const fondoDe = (id: string) => d.bloques.find((b) => b.id === id)?.fondo ?? null;
  const ops: Operacion[] = [
    ...((d.disposicion ?? 'una') === 'libre' ? [] : opsCambiarDisposicion(d, 'libre')),
    ...cambios.map((c): Operacion => ({ op: 'bloque.aspecto', bloque: c.id, fondo: fondoDe(c.id), ubicacion: c.ubicacion })),
    ...agregado.ops.filter((o) => o.op !== 'diapositiva.disposicion'),
    { op: 'bloque.aspecto', bloque: agregado.bloque.id, fondo: null, ubicacion },
  ];
  return { ops, bloque: { ...agregado.bloque, ubicacion } };
}

/** En una diapositiva libre, el bloque que se agrega va debajo de todo. */
function conLugar(d: Diapositiva, bloque: Bloque): Bloque {
  if (d.disposicion !== 'libre') return bloque;
  return { ...bloque, ubicacion: ubicacionNueva(d.bloques) };
}

/** Con la disposición "una" solo se ve el primer bloque: al pasar de uno, se reparten en columnas. */
export function opsDisposicionPara(d: Diapositiva, bloques: number): Operacion[] {
  return (d.disposicion ?? 'una') === 'una' && bloques > 1 ? [{ op: 'diapositiva.disposicion', diapositiva: d.id, valor: 'columnas' }] : [];
}

export function opsDuplicarBloque(p: Presentacion, bloque: string): Operacion[] {
  const d = p.diapositivas.find((x) => x.bloques.some((b) => b.id === bloque));
  if (!d) return [];
  const copia = copiaDeBloque(p, d.bloques.find((b) => b.id === bloque)!, idsEnUso(p));
  return [
    ...copia.conjuntos.map((c): Operacion => ({ op: 'conjunto.poner', conjunto: c })),
    { op: 'bloque.poner', diapositiva: d.id, bloque: conLugar(d, copia.bloque), despues: bloque },
    ...opsDisposicionPara(d, d.bloques.length + 1),
  ];
}

/**
 * Bloque nuevo al final de la diapositiva. `datos`: 'nuevo' crea un conjunto
 * de ejemplo; si no, el id de un conjunto que ya existe.
 */
export function opsAgregarBloque(
  p: Presentacion, diapositiva: string, tipo: TipoNuevo, datos: 'nuevo' | string = 'nuevo',
): { ops: Operacion[]; bloque: Bloque; conjuntoNuevo: string | null } | null {
  const d = p.diapositivas.find((x) => x.id === diapositiva);
  if (!d) return null;
  const enUso = idsEnUso(p);
  const ops: Operacion[] = [];
  let conjunto: ConjuntoDatos | undefined;
  let conjuntoNuevo: string | null = null;
  if (tipo === 'grafico' || tipo === 'tabla') {
    if (datos === 'nuevo') {
      conjunto = conjuntoEjemplo(nuevoId('c', enUso), tipo === 'tabla' ? 'tabla' : 'barras');
      conjuntoNuevo = conjunto.id;
      ops.push({ op: 'conjunto.poner', conjunto });
    } else {
      conjunto = p.datos[datos];
      if (!conjunto) return null;
    }
  }
  const bloque = conLugar(d, bloqueNuevo(tipo, enUso, conjunto));
  ops.push({ op: 'bloque.poner', diapositiva: d.id, bloque, despues: d.bloques.at(-1)?.id ?? null });
  ops.push(...opsDisposicionPara(d, d.bloques.length + 1));
  return { ops, bloque, conjuntoNuevo };
}
