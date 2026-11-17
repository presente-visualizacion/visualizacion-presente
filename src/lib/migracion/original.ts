// Conversión de la presentación original del Comité de Precios (la página
// /presentation/v2, con sus datos de /api/presentation/shared) al formato de
// Visualización Presente. El diseño está en "Diseño de la etapa 4" de PLAN.md.
//
// Este archivo solo conoce la FORMA de los datos originales: no trae ninguna
// cifra. Los datos llegan en el archivo que elige la usuaria y van directo a
// la base de datos.

import { interpretarNumero } from '../formato';
import { TEMA_PRESENTE } from '../tema';
import type {
  Bloque, BloqueCifras, BloqueGrafico, BloqueTabla, Cifra, Columna, ConjuntoDatos, Diapositiva, Disposicion, Fila, IdPeriodo,
  PorPeriodo, Presentacion, Serie, Tarjeta,
} from '../tipos';

export interface ResultadoMigracion {
  presentacion: Presentacion;
  /** Lo que no se encontró o no se pudo pasar, en palabras. */
  avisos: string[];
}

type Datos = Record<string, unknown>;

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Orden y títulos por defecto de la original (DEFAULT_SLIDE_ORDER). */
const ORDEN_POR_DEFECTO = [
  'cover', 'macroeconomic', 'historicalRates', 'referenceRates', 'inflationRepo', 'deficitFiscal', 'portfolioStockRates',
  'disbursementRates', 'monthlyDisbursements', 'portfolioBalance', 'benchmarkingSummary', 'benchmarkingVis', 'benchmarkingNoVis',
  'benchmarkingLibreInversion', 'benchmarkingCDATs', 'benchmarkingCredits', 'daviviendaDaviplata', 'totalLiabilities',
  'tppCaptacion', 'tppLibreInversion', 'servicioCredito', 'rateChangeProposal', 'ingresosMensuales', 'tppIngresosAhorro', 'cierre',
];

// ---------------------------------------------------------------------------
// Lectura tolerante

const esObjeto = (v: unknown): v is Datos => typeof v === 'object' && v !== null && !Array.isArray(v);
const lista = (v: unknown): Datos[] => (Array.isArray(v) ? v.filter(esObjeto) : []);

function numero(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const n = interpretarNumero(v.replace(/[↑↓]/g, ''));
  return n === null || Number.isNaN(n) ? null : n;
}

function texto(v: unknown, tope = 200): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t ? t.slice(0, tope) : null;
}

/** "↑ 15,08%" -> 15.08 y "↓ 2%" -> -2. */
function variacion(v: unknown): number | null {
  const n = numero(v);
  if (n === null) return null;
  return typeof v === 'string' && v.includes('↓') ? -Math.abs(n) : n;
}

/** "2021-01-29" -> "ene-21". Si no tiene esa forma, queda igual. */
function mesDeFecha(v: unknown): string | null {
  const t = texto(v);
  const m = t && /^(\d{4})-(\d{2})/.exec(t);
  if (!m) return t;
  return `${CORTOS[Number(m[2]) - 1] ?? m[2]}-${m[1].slice(2)}`;
}

/** Encabezados escritos raro ("EntidadeS", "tasa Prom."): primera mayúscula y palabras normales. */
function encabezado(v: unknown, porDefecto: string): string {
  const t = texto(v);
  if (!t) return porDefecto;
  const limpio = t.split(' ').map((p) => (/[a-záéíóúñ][A-ZÁÉÍÓÚÑ]/.test(p) ? p.toLowerCase() : p)).join(' ');
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

// ---------------------------------------------------------------------------
// Piezas del formato nuevo

const col = (clave: string, nombre: string, tipo: Columna['tipo'], extra: Partial<Columna> = {}): Columna => ({ clave, nombre, tipo, ...extra });
const pct = (clave: string, nombre: string, extra: Partial<Columna> = {}) => col(clave, nombre, 'porcentaje', { decimales: 2, ...extra });
const millones = (clave: string, nombre: string) => col(clave, nombre, 'moneda', { unidad: 'millones' });

function unico(id: string, nombre: string, columnas: Columna[], filas: Fila[]): ConjuntoDatos {
  return { id, nombre, columnas, porPeriodo: false, filas };
}

function porMes(id: string, nombre: string, columnas: Columna[], filasPorPeriodo: Record<IdPeriodo, Fila[]>): ConjuntoDatos {
  return { id, nombre, columnas, porPeriodo: true, filasPorPeriodo };
}

function soloEn<T>(periodo: IdPeriodo, valor: T): PorPeriodo<T> {
  return { porPeriodo: true, valores: { [periodo]: valor } };
}

const igual = <T>(valor: T): PorPeriodo<T> => ({ porPeriodo: false, valor });

function grafico(id: string, datos: string, forma: BloqueGrafico['forma'], ejeX: string, series: (string | Serie)[], extra: Partial<BloqueGrafico> = {}): BloqueGrafico {
  return { id, tipo: 'grafico', datos, forma, ejeX, series: series.map((s) => (typeof s === 'string' ? { clave: s } : s)), ...extra };
}

const punteada = (clave: string): Serie => ({ clave, punteada: true });

/** Cifra que sale de los datos. */
function cifraDe(etiqueta: string, conjunto: string, columna: string, fila: NonNullable<Cifra['desde']>['fila'], extra: Partial<NonNullable<Cifra['desde']>> = {}, detalle?: string): Cifra {
  return { etiqueta, valor: '—', ...(detalle ? { detalle } : {}), desde: { conjunto, columna, fila, ...extra } };
}

function cifras(id: string, lista: Cifra[]): BloqueCifras {
  return { id, tipo: 'cifras', cifras: igual(lista) };
}

// ---------------------------------------------------------------------------
// Meses

interface Calendario {
  /** Año del mes de la presentación (el de la portada). */
  anio: number;
  /** Mes de la presentación ("2026-10"): los textos quedan en él. */
  actual: IdPeriodo;
}

const id2 = (anio: number, mes: number) => `${anio}-${String(mes).padStart(2, '0')}`;

/** Sufijo de mes de la original ("", "Enero", ...) -> "AAAA-MM". El vacío es diciembre del año anterior. */
function periodoDeSufijo(sufijo: string, cal: Calendario): IdPeriodo | null {
  if (sufijo === '') return id2(cal.anio - 1, 12);
  const i = MESES.findIndex((m) => m.toLowerCase() === sufijo.toLowerCase());
  if (i < 0) return null;
  return i === 11 ? id2(cal.anio - 1, 12) : id2(cal.anio, i + 1);
}

/** Bloques con un juego por mes: `prefijo`, `prefijoEnero`, ... -> { "2025-12": ..., "2026-01": ... }. */
function porSufijo(datos: Datos, prefijo: string, cal: Calendario): Map<IdPeriodo, unknown> {
  const resultado = new Map<IdPeriodo, unknown>();
  for (const clave of Object.keys(datos)) {
    if (!clave.startsWith(prefijo)) continue;
    const resto = clave.slice(prefijo.length);
    if (resto !== '' && !MESES.some((m) => m === resto)) continue;
    const periodo = periodoDeSufijo(resto, cal);
    if (periodo) resultado.set(periodo, datos[clave]);
  }
  return resultado;
}

function calendario(datos: Datos): Calendario {
  const titulos = esObjeto(datos.slideTitles) ? datos.slideTitles : {};
  const portada = esObjeto(titulos.cover) ? titulos.cover : {};
  const meta = esObjeto(datos.metadata) ? datos.metadata : {};
  const pistas = [portada.subtitle, portada.title, meta.subtitle, meta.title].map((v) => texto(v) ?? '');
  for (const pista of pistas) {
    const anio = /(\d{4})/.exec(pista);
    const mes = MESES.findIndex((m) => pista.toLowerCase().includes(m.toLowerCase()));
    if (anio && mes >= 0) return { anio: Number(anio[1]), actual: id2(Number(anio[1]), mes + 1) };
  }
  const hoy = new Date();
  return { anio: hoy.getFullYear(), actual: id2(hoy.getFullYear(), hoy.getMonth() + 1) };
}

// ---------------------------------------------------------------------------
// Conversión

interface Armado {
  diapositiva: Omit<Diapositiva, 'id' | 'titulo' | 'subtitulo'> & { titulo?: string; subtitulo?: string };
  conjuntos: ConjuntoDatos[];
}

type Armador = (datos: Datos, cal: Calendario, n: string) => Armado | null;

const contenido = (disposicion: Disposicion, bloques: Bloque[], conjuntos: ConjuntoDatos[]): Armado => ({
  diapositiva: { tipo: 'contenido', disposicion, bloques },
  conjuntos,
});

/** Serie de tiempo simple: lista de objetos con una columna de mes y varias numéricas. */
function serieDeTiempo(
  datos: Datos, clave: string, id: string, nombre: string, eje: { de: string; a: string; nombre: string; fecha?: boolean },
  columnas: Columna[], extraFila?: (f: Datos) => Fila,
): ConjuntoDatos | null {
  const origen = lista(datos[clave]);
  if (!origen.length) return null;
  const filas = origen.map((f) => {
    const fila: Fila = { [eje.a]: eje.fecha ? mesDeFecha(f[eje.de]) : texto(f[eje.de]) };
    for (const c of columnas) fila[c.clave] = c.tipo === 'texto' ? texto(f[c.clave]) : numero(f[c.clave]);
    return extraFila ? { ...fila, ...extraFila(f) } : fila;
  });
  return unico(id, nombre, [col(eje.a, eje.nombre, 'texto'), ...columnas], filas);
}

/** Benchmarking de desembolsos por entidad (VIS, No VIS, Libre Inversión). */
function benchmarkingBarras(prefijo: string, id: string, nombre: string): Armador {
  return (datos, cal, n) => {
    const meses = porSufijo(datos, prefijo, cal);
    const filasPorPeriodo: Record<IdPeriodo, Fila[]> = {};
    for (const [periodo, valor] of meses) {
      const filas = lista(valor).map((f) => ({
        entidad: texto(f.entity), desembolsos: numero(f.disbursements_num), monto: numero(f.amount), tpp: numero(f.tpp),
      }));
      if (filas.length) filasPorPeriodo[periodo] = filas;
    }
    if (!Object.keys(filasPorPeriodo).length) return null;
    const conjunto = porMes(id, nombre, [
      col('entidad', 'Entidad', 'texto'), col('desembolsos', '# Desembolsos', 'numero'), millones('monto', '$ Desembolsos'), pct('tpp', 'TPP'),
    ], filasPorPeriodo);
    const presente = { columna: 'entidad', valor: 'PRESENTE' };
    return contenido('principal-lateral', [
      grafico(`b-${n}-grafico`, id, 'barras', 'entidad', ['desembolsos', 'monto'], { resaltar: presente, detalleEje: 'tpp' }),
      cifras(`b-${n}-cifras`, [
        cifraDe('Entidades', id, 'entidad', 'primera'),
        cifraDe('Monto total', id, 'monto', 'primera'),
        cifraDe('Desembolsos', id, 'desembolsos', 'primera'),
        cifraDe('Tasa prom. EA', id, 'tpp', 'primera'),
        cifraDe('Presente', id, 'tpp', presente, { comparar: 'primera' }, 'frente al promedio'),
      ]),
    ], [conjunto]);
  };
}

/** Serie mensual con cifras del último mes arriba. */
function serieConCifras(
  clave: string, id: string, nombre: string, columnas: Columna[], cifrasDe: (id: string) => Cifra[], forma: BloqueGrafico['forma'] = 'lineas',
): Armador {
  return (datos, _cal, n) => {
    const conjunto = serieDeTiempo(datos, clave, id, nombre, { de: 'periodo', a: 'periodo', nombre: 'Periodo' }, columnas);
    if (!conjunto) return null;
    const series = columnas.filter((c) => c.tipo !== 'texto').map((c) => c.clave);
    return contenido('filas', [
      cifras(`b-${n}-cifras`, cifrasDe(id)),
      grafico(`b-${n}-grafico`, id, forma, 'periodo', series),
    ], [conjunto]);
  };
}

const ARMADORES: Record<string, Armador> = {
  cover: () => ({ diapositiva: { tipo: 'portada', titulo: 'Comité de Precios', subtitulo: '{mes}', bloques: [] }, conjuntos: [] }),

  cierre: (datos) => {
    const c = esObjeto(datos.cierre) ? datos.cierre : {};
    return {
      diapositiva: { tipo: 'cierre', titulo: texto(c.titulo) ?? '¡Gracias!', subtitulo: texto(c.subtitulo) ?? 'Comité de Precios', bloques: [] },
      conjuntos: [],
    };
  },

  macroeconomic: (datos, cal, n) => {
    const parrafos = (Array.isArray(datos.macroAnalysis) ? datos.macroAnalysis : []).map((p) => texto(p, 2000)).filter(Boolean);
    if (!parrafos.length) return null;
    return contenido('una', [{ id: `b-${n}-texto`, tipo: 'texto', contenido: soloEn(cal.actual, parrafos.join('\n\n')) }], []);
  },

  historicalRates: (datos, _cal, n) => {
    const conjunto = serieDeTiempo(datos, 'historicalRatesV2', 'c-tes', 'Curva TES', { de: 'date', a: 'fecha', nombre: 'Fecha', fecha: true }, [
      pct('rate1', 'TES 1 año'), pct('rate2', 'TES 5 años'), pct('rate3', 'TES 10 años'),
    ]);
    if (!conjunto) return null;
    return contenido('una', [grafico(`b-${n}-grafico`, conjunto.id, 'lineas', 'fecha', ['rate1', 'rate2', punteada('rate3')])], [conjunto]);
  },

  referenceRates: (datos, _cal, n) => {
    const conjunto = serieDeTiempo(datos, 'referenceRates', 'c-tasas-referencia', 'Tasas de referencia', { de: 'month', a: 'mes', nombre: 'Mes' }, [
      pct('dtf', 'DTF'), pct('ibr', 'IBR plazo un mes'), pct('ipc', 'IPC'), pct('repo', 'REPO'),
    ]);
    if (!conjunto) return null;
    return contenido('una', [grafico(`b-${n}-grafico`, conjunto.id, 'lineas', 'mes', ['dtf', 'ibr', 'ipc', 'repo'])], [conjunto]);
  },

  inflationRepo: (datos, _cal, n) => {
    const conjunto = serieDeTiempo(
      datos, 'inflationRepo', 'c-inflacion-repo', 'Inflación y tasa REPO', { de: 'date', a: 'fecha', nombre: 'Fecha', fecha: true },
      [pct('repo', 'Tasa REPO'), pct('inflation', 'Inflación'), pct('diferencia', 'Diferencia (Repo - Inf)')],
      (f) => {
        const repo = numero(f.repo);
        const inflacion = numero(f.inflation);
        return { diferencia: repo !== null && inflacion !== null ? Math.round((repo - inflacion) * 100) / 100 : null };
      },
    );
    if (!conjunto) return null;
    return contenido('una', [grafico(`b-${n}-grafico`, conjunto.id, 'lineas', 'fecha', [punteada('diferencia'), 'inflation', 'repo'])], [conjunto]);
  },

  deficitFiscal: (datos, _cal, n) => {
    const meses = MESES.map((m) => m.toLowerCase());
    const conjunto = serieDeTiempo(datos, 'deficitFiscal', 'c-deficit-fiscal', 'Déficit fiscal', { de: 'year', a: 'anio', nombre: 'Año' }, [
      pct('total', 'Total Déficit Fiscal', { decimales: 1 }),
      ...meses.map((m, i) => pct(m, MESES[i], { decimales: 1 })),
    ]);
    if (!conjunto) return null;
    return contenido('una', [grafico(`b-${n}-grafico`, conjunto.id, 'lineas', 'anio', ['total'])], [conjunto]);
  },

  portfolioBalance: (datos, _cal, n) => {
    const conjunto = serieDeTiempo(datos, 'portfolioBalanceByLine', 'c-saldo-cartera', 'Saldo cartera por línea', { de: 'month', a: 'mes', nombre: 'Mes' }, [
      millones('consumo', 'Consumo'), millones('rotativos', 'Rotativos'), millones('total', 'Total general'), millones('vivienda', 'Vivienda'),
    ]);
    if (!conjunto) return null;
    return contenido('filas', [
      cifras(`b-${n}-cifras`, [cifraDe('Saldo total de cartera', conjunto.id, 'total', 'ultima', { detalle: 'mes' })]),
      grafico(`b-${n}-grafico`, conjunto.id, 'lineas', 'mes', ['consumo', 'rotativos', punteada('total'), 'vivienda']),
    ], [conjunto]);
  },

  portfolioStockRates: (datos, _cal, n) => {
    const conjunto = serieDeTiempo(datos, 'portfolioStockRates', 'c-tpp-cartera', 'TPP saldo de cartera', { de: 'month', a: 'mes', nombre: 'Mes' }, [
      pct('consumo', 'CO - Consumo'), pct('usura', 'TASA DE USURA'), pct('rotativos', 'TP - Rotativos'), pct('total', 'Total general'), pct('vivienda', 'VI - Vivienda'),
    ]);
    if (!conjunto) return null;
    return contenido('una', [grafico(`b-${n}-grafico`, conjunto.id, 'lineas', 'mes', ['consumo', punteada('usura'), 'rotativos', punteada('total'), 'vivienda'])], [conjunto]);
  },

  monthlyDisbursements: (datos, _cal, n) => {
    const conjunto = serieDeTiempo(datos, 'monthlyDisbursements', 'c-desembolsos', 'Desembolsos mensuales', { de: 'month', a: 'mes', nombre: 'Mes' }, [
      millones('consumo', 'CONSUMO'), millones('tarjeta', 'TARJETA'), millones('vivienda', 'VIVIENDA'), millones('total', 'Total'),
    ]);
    if (!conjunto) return null;
    return contenido('una', [grafico(`b-${n}-grafico`, conjunto.id, 'lineas', 'mes', ['consumo', 'tarjeta', 'vivienda'])], [conjunto]);
  },

  disbursementRates: (datos, _cal, n) => {
    const conjunto = serieDeTiempo(datos, 'disbursementRates', 'c-tpp-desembolso', 'TPP desembolso por línea', { de: 'month', a: 'mes', nombre: 'Mes' }, [
      pct('consumo', 'CONSUMO'), pct('tarjeta', 'TARJETA'), pct('usura', 'TASA DE USURA'), pct('tpp', 'TPP'), pct('vivienda', 'VIVIENDA'),
    ]);
    if (!conjunto) return null;
    return contenido('una', [grafico(`b-${n}-grafico`, conjunto.id, 'lineas', 'mes', ['consumo', 'tarjeta', punteada('usura'), punteada('tpp'), 'vivienda'])], [conjunto]);
  },

  benchmarkingSummary: (datos, cal, n) => {
    const h = esObjeto(datos.benchmarkingSummaryHeaders) ? datos.benchmarkingSummaryHeaders : {};
    const filasPorPeriodo: Record<IdPeriodo, Fila[]> = {};
    for (const f of lista(datos.benchmarkingSummaryData)) {
      const periodo = periodoDeSufijo(texto(f.mes) ?? '', cal);
      if (!periodo) continue;
      const tasaProm = numero(f.tasaProm);
      const tasaPresente = numero(f.tasaPresente);
      // Si falta la variación (los meses nuevos la traen vacía), es el promedio menos Presente.
      const dif = variacion(f.variacion) ?? (tasaProm !== null && tasaPresente !== null ? Math.round((tasaProm - tasaPresente) * 100) / 100 : null);
      (filasPorPeriodo[periodo] ??= []).push({
        segmento: texto(f.segmento), entidades: numero(f.entidades), monto: texto(f.monto), desembolsos: numero(f.desembolsos),
        tasaProm, tasaPresente, variacion: dif, desembolsosPresente: texto(f.desembolsosPresente),
      });
    }
    if (!Object.keys(filasPorPeriodo).length) return null;
    const conjunto = porMes('c-resumen-benchmarking', 'Resumen benchmarking', [
      col('segmento', encabezado(h.segmento, 'Segmento de crédito'), 'texto'),
      col('entidades', encabezado(h.entidades, 'Entidades'), 'numero'),
      col('monto', encabezado(h.monto, 'Monto total'), 'texto'),
      col('desembolsos', encabezado(h.desembolsos, 'Desembolsos'), 'numero'),
      pct('tasaProm', encabezado(h.tasaProm, 'Tasa prom. EA')),
      pct('tasaPresente', encabezado(h.tasaPresente, 'Tasa Presente (EA)')),
      pct('variacion', encabezado(h.variacion, 'Variación vs. prom.'), { signo: true }),
      col('desembolsosPresente', encabezado(h.desembolsosPresente, '$ Desembolsos Presente'), 'texto'),
    ], filasPorPeriodo);
    return contenido('una', [{ id: `b-${n}-tabla`, tipo: 'tabla', datos: conjunto.id }], [conjunto]);
  },

  benchmarkingCredits: (datos, cal, n) => {
    const filasPorPeriodo: Record<IdPeriodo, Fila[]> = {};
    for (const [periodo, valor] of porSufijo(datos, 'benchmarkingCredits', cal)) {
      if (!esObjeto(valor)) continue;
      const filas: Fila[] = [];
      for (const [grupo, seccion] of [['banks', 'Entidades bancarias'], ['cooperatives', 'Cooperativas financieras']] as const) {
        for (const f of lista(valor[grupo])) {
          filas.push({
            seccion, entidad: texto(f.entity), vis_tasa: numero(f.vis_tasa), novis_tasa: numero(f.novis_tasa),
            vehiculo_tasa: numero(f.vehiculo_tasa), cc_desde: numero(f.cc_desde), cc_hasta: numero(f.cc_hasta),
          });
        }
      }
      if (filas.length) filasPorPeriodo[periodo] = filas;
    }
    if (!Object.keys(filasPorPeriodo).length) return null;
    const conjunto = porMes('c-benchmarking-creditos', 'Benchmarking créditos', [
      col('seccion', 'Sección', 'texto'), col('entidad', 'Entidad bancaria', 'texto'),
      pct('vis_tasa', 'Tasa', { grupo: 'Vivienda VIS' }), pct('novis_tasa', 'Tasa', { grupo: 'Vivienda No VIS' }),
      pct('vehiculo_tasa', 'Tasa', { grupo: 'Consumo vehículo' }),
      pct('cc_desde', 'Desde', { grupo: 'Compra cartera' }), pct('cc_hasta', 'Hasta', { grupo: 'Compra cartera' }),
    ], filasPorPeriodo);
    const calculadas: BloqueTabla['calculadas'] = ['vis_tasa', 'novis_tasa', 'vehiculo_tasa', 'cc_desde'].flatMap((c) => [
      { tipo: 'variacion' as const, columna: c }, { tipo: 'posicion' as const, columna: c, orden: 'asc' as const },
    ]);
    return contenido('una', [{
      id: `b-${n}-tabla`, tipo: 'tabla', datos: conjunto.id, secciones: 'seccion', calculadas,
      resaltar: { columna: 'entidad', valor: 'PRESENTE' },
    }], [conjunto]);
  },

  benchmarkingCDATs: (datos, cal, n) => {
    const plazos = ['90', '180', '360', '540', '721', '1081'];
    const filasPorPeriodo: Record<IdPeriodo, Fila[]> = {};
    for (const [periodo, valor] of porSufijo(datos, 'benchmarkingCDATs', cal)) {
      const filas: Fila[] = [];
      for (const g of lista(esObjeto(valor) ? valor.groups : [])) {
        const seccion = texto(g.name) ?? 'Otras';
        for (const f of lista(g.entities)) {
          const fila: Fila = { seccion, entidad: texto(f.entity) };
          for (const p of plazos) fila[`d${p}`] = numero(f[`d${p}`]);
          filas.push(fila);
        }
      }
      if (filas.length) filasPorPeriodo[periodo] = filas;
    }
    if (!Object.keys(filasPorPeriodo).length) return null;
    const conjunto = porMes('c-benchmarking-cdats', 'Benchmarking CDATs', [
      col('seccion', 'Sección', 'texto'), col('entidad', 'Entidad bancaria', 'texto'),
      ...plazos.map((p) => pct(`d${p}`, 'Tasa', { grupo: `${p} días` })),
    ], filasPorPeriodo);
    // La posición se calcula (la tasa más alta es 1), como la traían los meses
    // anteriores; los más nuevos ya no la traen escrita.
    return contenido('una', [{
      id: `b-${n}-tabla`, tipo: 'tabla', datos: conjunto.id, secciones: 'seccion',
      calculadas: plazos.flatMap((p) => [
        { tipo: 'variacion' as const, columna: `d${p}` }, { tipo: 'posicion' as const, columna: `d${p}`, orden: 'desc' as const },
      ]),
      resaltar: { columna: 'entidad', valor: 'PRESENTE' },
      // La nota al pie de la original (tasas E.A. y monto) no viene en el
      // archivo y no se copia aquí: el repositorio es público. Se escribe en
      // la nota del bloque.
    }], [conjunto]);
  },

  benchmarkingVis: benchmarkingBarras('benchmarkingViviendaVisHasta20', 'c-benchmarking-vis', 'Benchmarking vivienda VIS'),
  benchmarkingNoVis: benchmarkingBarras('benchmarkingViviendaNoVisHasta20', 'c-benchmarking-no-vis', 'Benchmarking vivienda No VIS'),
  benchmarkingLibreInversion: benchmarkingBarras('benchmarkingLibreInversion', 'c-benchmarking-libre-inversion', 'Benchmarking libre inversión'),

  totalLiabilities: (datos, _cal, n) => {
    const conjunto = serieDeTiempo(datos, 'totalLiabilitiesBalance', 'c-pasivos', 'Saldo total de pasivos', { de: 'month', a: 'mes', nombre: 'Mes' }, [
      millones('fut', 'Ahorro Futuro'), millones('prog', 'Ahorros Programados'), millones('disp', 'Ahorros disponibles'),
      millones('cdats', 'CDATs'), millones('total', 'Saldo total pasivos'),
    ]);
    if (!conjunto) return null;
    return contenido('una', [grafico(`b-${n}-grafico`, conjunto.id, 'lineas', 'mes', ['fut', 'prog', 'disp', 'cdats', 'total'])], [conjunto]);
  },

  tppCaptacion: (datos, _cal, n) => {
    const conjunto = serieDeTiempo(datos, 'tppCaptacionSaldos', 'c-tpp-captacion', 'TPP captación y saldos', { de: 'month', a: 'mes', nombre: 'Mes' }, [
      millones('saldo_cdat', 'Saldo CDATs'), millones('saldo_cap', 'Saldo Captación'), pct('tpp_cdat', 'TPP CDAT'), pct('tpp_cap', 'Total TPP captación'),
    ]);
    if (!conjunto) return null;
    // Saldos ($) y tasas (%) no comparten eje: van en dos gráficos.
    return contenido('columnas', [
      { ...grafico(`b-${n}-saldos`, conjunto.id, 'lineas', 'mes', ['saldo_cdat', 'saldo_cap']), titulo: 'Saldos' },
      { ...grafico(`b-${n}-tpp`, conjunto.id, 'lineas', 'mes', ['tpp_cdat', 'tpp_cap']), titulo: 'TPP' },
    ], [conjunto]);
  },

  ingresosMensuales: (datos, cal, n) => {
    const extra = encabezado(esObjeto(datos.ingresosMensualesExtra) ? datos.ingresosMensualesExtra.etiqueta : null, 'Ahorro Programado');
    return serieConCifras('ingresosMensuales', 'c-ingresos-mensuales', 'Ingresos mensuales', [
      col('cdats', 'CDATs Nuevos', 'moneda'), col('futuroCredito', 'Futuro nueva crédito', 'moneda'), col('extra', extra, 'moneda'),
    ], (id) => [
      cifraDe('CDATs nuevos', id, 'cdats', 'ultima', { detalle: 'periodo' }),
      cifraDe('Futuro n. crédito', id, 'futuroCredito', 'ultima', { detalle: 'periodo' }),
      cifraDe(extra, id, 'extra', 'ultima', { detalle: 'periodo' }),
    ])(datos, cal, n);
  },

  tppIngresosAhorro: (datos, cal, n) => {
    const extra = encabezado(esObjeto(datos.tppIngresosAhorroExtra) ? datos.tppIngresosAhorroExtra.etiqueta : null, 'Costo Ahorro Programado');
    return serieConCifras('tppIngresosAhorro', 'c-tpp-ingresos-ahorro', 'TPP ingresos por tipo de ahorro', [
      pct('costoCdats', 'Costo CDATs EA'), pct('costoFuturo', 'Costo Futuro EA'), pct('extra', extra),
    ], (id) => [
      cifraDe('Costo CDATs', id, 'costoCdats', 'ultima', { detalle: 'periodo' }),
      cifraDe('Costo futuro', id, 'costoFuturo', 'ultima', { detalle: 'periodo' }),
      cifraDe(extra, id, 'extra', 'ultima', { detalle: 'periodo' }),
    ])(datos, cal, n);
  },

  servicioCredito: serieConCifras('servicioCreditoCostoAhorro', 'c-servicio-costo', 'Servicio del crédito y costo del ahorro', [
    col('costo', 'Costo del ahorro $', 'moneda'), col('servicio', 'Servicio del crédito', 'moneda'),
  ], (id) => [
    cifraDe('Servicio crédito', id, 'servicio', 'ultima', { detalle: 'periodo' }),
    cifraDe('Costo ahorro', id, 'costo', 'ultima', { detalle: 'periodo' }),
  ]),

  tppLibreInversion: serieConCifras('tppLibreInversionHistorico', 'c-margen-intermediacion', 'Margen de intermediación', [
    pct('valor', 'TPP Libre Inversión'),
  ], (id) => [cifraDe('Último', id, 'valor', 'ultima', { detalle: 'periodo' })]),

  daviviendaDaviplata: (datos, cal, n) => {
    const d = esObjeto(datos.benchmarkingDavivienda) ? datos.benchmarkingDavivienda : null;
    if (!d) return null;
    const tablaDe = (id: string, nombre: string, valor: unknown): ConjuntoDatos => porMes(id, nombre, [
      col('producto', 'Producto', 'texto'), col('tasa', 'Tasa E.A.', 'texto'),
    ], { [cal.actual]: lista(valor).map((f) => ({ producto: texto(f.product), tasa: texto(f.rate) })) });
    const libranza = tablaDe('c-davivienda-libranza', 'Davivienda: créditos de libranza', d.libranzaTable);
    const digital = tablaDe('c-daviplata-credito', 'DaviPlata: crédito digital', d.creditoDigitalTable);
    const vinetas = (Array.isArray(d.ahorroBolsillosBullets) ? d.ahorroBolsillosBullets : []).map((v) => texto(v, 400)).filter(Boolean);
    const ahorro = [
      texto(d.ahorroBolsillosStat) && `# ${texto(d.ahorroBolsillosStat)}`,
      texto(d.ahorroBolsillosSubtitle, 400),
      vinetas.map((v) => `- ${v}`).join('\n'),
    ].filter(Boolean).join('\n\n');
    const tarjetas: Tarjeta[] = [
      { titulo: texto(d.tarjetaCreditoTitle, 80) ?? '', texto: texto(d.tarjetaCreditoText, 600) ?? '' },
      { titulo: texto(d.tarjetaDebitoTitle, 80) ?? '', texto: texto(d.tarjetaDebitoText, 600) ?? '' },
    ].filter((t) => t.titulo || t.texto);
    const notaLibranza = texto(d.libranzaNote);
    const notaDigital = texto(d.creditoDigitalNote);
    return contenido('cuadricula', [
      { id: `b-${n}-libranza`, tipo: 'tabla', datos: libranza.id, titulo: 'Créditos de libranza — Davivienda', ...(notaLibranza ? { nota: notaLibranza } : {}) },
      { id: `b-${n}-ahorro`, tipo: 'texto', titulo: 'DaviPlata — Ahorro (bolsillos)', contenido: soloEn(cal.actual, ahorro) },
      { id: `b-${n}-credito`, tipo: 'tabla', datos: digital.id, titulo: 'DaviPlata — Crédito digital', ...(notaDigital ? { nota: notaDigital } : {}) },
      { id: `b-${n}-tarjetas`, tipo: 'tarjetas', titulo: 'DaviPlata — Tarjetas 100% digitales', tarjetas: soloEn(cal.actual, tarjetas) },
    ], [libranza, digital]);
  },

  rateChangeProposal: (datos, cal, n) => {
    const r = esObjeto(datos.rateChangeProposal) ? datos.rateChangeProposal : null;
    if (!r) return null;
    const intro = [texto(r.intro1, 2000), texto(r.intro2, 2000)].filter(Boolean).join('\n\n');
    const propuestas: Tarjeta[] = lista(r.proposals).map((p) => ({
      titulo: [texto(p.icon, 8), texto(p.category, 70)].filter(Boolean).join(' '),
      texto: texto(p.text, 600) ?? '',
    }));
    const bloques: Bloque[] = [];
    if (intro) bloques.push({ id: `b-${n}-texto`, tipo: 'texto', contenido: soloEn(cal.actual, intro) });
    if (propuestas.length) {
      bloques.push({ id: `b-${n}-propuestas`, tipo: 'tarjetas', titulo: texto(r.proposalTitle) ?? 'Se propone lo siguiente:', tarjetas: soloEn(cal.actual, propuestas) });
    }
    if (!bloques.length) return null;
    return contenido('filas', bloques, []);
  },
};

/** Nombre de cada diapositiva original, para los avisos. */
const NOMBRES: Record<string, string> = {
  cover: 'Portada', macroeconomic: 'Análisis macroeconómico', historicalRates: 'Curva TES', referenceRates: 'Tasas de referencia',
  inflationRepo: 'Inflación vs. REPO', deficitFiscal: 'Déficit fiscal', portfolioBalance: 'Saldo cartera', portfolioStockRates: 'TPP saldo de cartera',
  monthlyDisbursements: 'Desembolsos mensuales', disbursementRates: 'TPP desembolso', benchmarkingSummary: 'Resumen benchmarking',
  benchmarkingCredits: 'Benchmarking créditos', benchmarkingLibreInversion: 'Benchmarking libre inversión', benchmarkingNoVis: 'Benchmarking No VIS',
  benchmarkingVis: 'Benchmarking VIS', totalLiabilities: 'Saldo total de pasivos', tppCaptacion: 'TPP captación y saldos',
  ingresosMensuales: 'Ingresos mensuales', tppIngresosAhorro: 'TPP ingresos por tipo de ahorro', benchmarkingCDATs: 'Benchmarking CDATs',
  daviviendaDaviplata: 'Davivienda / DaviPlata', servicioCredito: 'Servicio del crédito', tppLibreInversion: 'Margen de intermediación',
  cierre: 'Cierre', rateChangeProposal: 'Propuesta cambio de tasas',
};

/**
 * Convierte la exportación de la presentación original. Acepta el archivo
 * completo (`{ id, data, ... }`) o solo `data`.
 */
export function migrarOriginal(entrada: unknown, opciones: { id?: string; ahora?: string } = {}): ResultadoMigracion {
  const raiz = esObjeto(entrada) && esObjeto(entrada.data) ? entrada.data : entrada;
  if (!esObjeto(raiz) || (!Array.isArray(raiz.slideOrder) && !esObjeto(raiz.slideTitles))) {
    throw new Error('El archivo no parece una exportación de la presentación del Comité (le faltan "slideOrder" y "slideTitles").');
  }
  const datos = raiz;
  const cal = calendario(datos);
  const avisos: string[] = [];
  const orden = (Array.isArray(datos.slideOrder) ? datos.slideOrder : ORDEN_POR_DEFECTO).filter((x): x is string => typeof x === 'string');
  const titulos = esObjeto(datos.slideTitles) ? datos.slideTitles : {};

  const diapositivas: Diapositiva[] = [];
  const conjuntos: Record<string, ConjuntoDatos> = {};
  orden.forEach((clave) => {
    const armar = ARMADORES[clave];
    if (!armar) {
      avisos.push(`La diapositiva "${clave}" no se reconoce y no se pasó.`);
      return;
    }
    const n = String(diapositivas.length + 1).padStart(2, '0');
    let armado: Armado | null = null;
    try {
      armado = armar(datos, cal, n);
    } catch (error) {
      avisos.push(`${NOMBRES[clave] ?? clave}: no se pudo pasar (${error instanceof Error ? error.message : 'error'}).`);
      return;
    }
    if (!armado) {
      avisos.push(`${NOMBRES[clave] ?? clave}: el archivo no trae sus datos; no se pasó.`);
      return;
    }
    const t = esObjeto(titulos[clave]) ? titulos[clave] : {};
    const titulo = armado.diapositiva.titulo ?? texto(t.title) ?? NOMBRES[clave] ?? clave;
    const subtitulo = armado.diapositiva.subtitulo ?? texto(t.subtitle);
    diapositivas.push({ ...armado.diapositiva, id: `d-${n}-${clave}`.slice(0, 80), titulo, ...(subtitulo ? { subtitulo } : {}) });
    for (const c of armado.conjuntos) conjuntos[c.id] = c;
  });

  // Meses: los que tienen datos por mes, más el de la portada.
  const meses = new Set<IdPeriodo>([cal.actual]);
  for (const c of Object.values(conjuntos)) for (const m of Object.keys(c.filasPorPeriodo ?? {})) meses.add(m);
  const periodos = [...meses].sort();

  // Datos de más de 500 filas en un mes: se quedan las últimas (series de tiempo).
  for (const c of Object.values(conjuntos)) {
    if (c.filas && c.filas.length > 500) {
      avisos.push(`"${c.nombre}" tiene ${c.filas.length} filas; se dejaron las últimas 500.`);
      c.filas = c.filas.slice(-500);
    }
  }

  const presentacion: Presentacion = {
    formato: 1,
    id: opciones.id ?? 'comite-de-precios',
    nombre: 'Comité de Precios',
    descripcion: 'Presentación mensual del Comité de Precios, importada de la versión anterior.',
    tema: TEMA_PRESENTE,
    periodos,
    diapositivas,
    datos: conjuntos,
    actualizado: opciones.ahora ?? new Date().toISOString(),
  };
  return { presentacion, avisos };
}
