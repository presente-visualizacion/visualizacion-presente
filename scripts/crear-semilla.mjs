// Crea la presentación de muestra (src/datos/semilla/comite-precios.json) con
// datos INVENTADOS. No lee ningún archivo: todas las cifras y entidades salen
// de este script, para que el repositorio pueda ser público.
//
// Uso: node scripts/crear-semilla.mjs
//
// Los números se generan con una semilla fija, así que cada ejecución produce
// el mismo archivo. Las entidades del benchmarking son ficticias y "Fondo
// Ejemplo" hace el papel de la entidad propia que se resalta.
//
// La migración de las 25 diapositivas con los datos reales es la etapa 4 y no
// pasa por este archivo (ver PLAN.md).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(raiz, 'src/datos/semilla/comite-precios.json');

// ---------------------------------------------------------------------------
// Azar reproducible

function crearAzar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const azar = crearAzar(20261116);
/** Número aleatorio entre -1 y 1. */
const ruido = () => azar() * 2 - 1;
const redondear = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const coma = (n, d = 2) => n.toFixed(d).replace('.', ',');
const miles = (n) => Math.round(n).toLocaleString('es-CO');

// ---------------------------------------------------------------------------
// Meses

const ANIO = 2026;
const ULTIMO_MES = 10; // octubre
const ABREV = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const NOMBRES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const periodos = Array.from({ length: ULTIMO_MES }, (_, i) => `${ANIO}-${String(i + 1).padStart(2, '0')}`);
const ULTIMO = periodos[periodos.length - 1];

// Las series de tiempo van de noviembre de 2024 a octubre de 2026 (24 meses).
const mesesSerie = [];
for (let i = 0; i < 24; i++) {
  const total = 2024 * 12 + 10 + i; // 10 = noviembre (base 0)
  const anio = Math.floor(total / 12);
  const mes = total % 12;
  mesesSerie.push({ etiqueta: `${ABREV[mes]} ${String(anio).slice(2)}`, periodo: `${anio}-${String(mes + 1).padStart(2, '0')}` });
}

// ---------------------------------------------------------------------------
// Series de tiempo

const tasas = [];
{
  let repo = 9.5;
  let ipc = 5.4;
  mesesSerie.forEach(({ etiqueta }, i) => {
    // La tasa de política baja durante el primer año y sube un poco después.
    if (i > 0 && i % 2 === 0) repo += i < 12 ? -0.25 : i < 18 ? 0 : 0.25;
    ipc += -0.04 + ruido() * 0.12 + (i > 14 ? 0.06 : 0);
    tasas.push({
      mes: etiqueta,
      repo: redondear(repo),
      ibr: redondear(repo - 0.15 + ruido() * 0.08),
      dtf: redondear(repo - 0.45 + ruido() * 0.12),
      ipc: redondear(ipc),
    });
  });
}

const cartera = [];
{
  let consumo = 152000;
  let rotativos = 71000;
  let vivienda = 78000;
  mesesSerie.forEach(({ etiqueta }) => {
    consumo *= 1.006 + ruido() * 0.004;
    rotativos *= 1.004 + ruido() * 0.012;
    vivienda *= 1.009 + ruido() * 0.003;
    cartera.push({ mes: etiqueta, consumo: Math.round(consumo), rotativos: Math.round(rotativos), vivienda: Math.round(vivienda) });
  });
}

const pasivos = [];
{
  let cdats = 71000;
  let fut = 44000;
  let disp = 41000;
  let prog = 7600;
  mesesSerie.forEach(({ etiqueta }) => {
    const diciembre = etiqueta.startsWith('Dic');
    cdats *= 1.007 + ruido() * 0.005;
    fut *= 1.002 + ruido() * 0.003;
    disp *= 1.004 + ruido() * 0.02;
    prog *= 1.008 + ruido() * 0.01;
    // En diciembre los asociados retiran parte de sus ahorros disponibles.
    pasivos.push({ mes: etiqueta, cdats: Math.round(cdats), fut: Math.round(fut), disp: Math.round(diciembre ? disp * 0.7 : disp), prog: Math.round(prog) });
  });
}

const filaDe = (lista, periodo) => lista[mesesSerie.findIndex((m) => m.periodo === periodo)];
const filaAnterior = (lista, periodo) => lista[mesesSerie.findIndex((m) => m.periodo === periodo) - 1];

// ---------------------------------------------------------------------------
// Benchmarking (entidades ficticias)

const PROPIA = 'Fondo Ejemplo';

const entidadesVis = [
  { entidad: 'Banco Cordillera', base: 14.6, desembolsos: 1100 },
  { entidad: 'Banco del Río', base: 15.1, desembolsos: 900 },
  { entidad: 'Banco Sabana', base: 14.2, desembolsos: 650 },
  { entidad: 'Financiera Altamar', base: 15.6, desembolsos: 380 },
  { entidad: 'Cooperativa Horizonte', base: 13.9, desembolsos: 210 },
  { entidad: PROPIA, base: 13.6, desembolsos: 60 },
];

const benchmarkingVis = {};
periodos.forEach((periodo, i) => {
  const tendencia = i < 6 ? -0.05 * i : -0.3 + 0.04 * (i - 6);
  const filas = entidadesVis.map(({ entidad, base, desembolsos }) => {
    const numero = Math.round(desembolsos * (1 + ruido() * 0.2));
    const montoPromedio = 105 + ruido() * 10; // millones por crédito
    return { entidad, tpp: redondear(base + tendencia + ruido() * 0.25), desembolsos: numero, monto: Math.round(numero * montoPromedio) };
  });
  const totalDesembolsos = filas.reduce((s, f) => s + f.desembolsos, 0);
  const totalMonto = filas.reduce((s, f) => s + f.monto, 0);
  const tppSector = filas.reduce((s, f) => s + f.tpp * f.monto, 0) / totalMonto;
  benchmarkingVis[periodo] = [
    { entidad: `Sector (${filas.length} entidades)`, tpp: redondear(tppSector), desembolsos: totalDesembolsos, monto: totalMonto },
    ...filas.sort((a, b) => b.monto - a.monto),
  ];
});

const entidadesCreditos = [
  { entidad: PROPIA, vis: 13.7, novis: 14.1, vehiculo: 16.6, ccDesde: 16.9, ccHasta: 20.5 },
  { entidad: 'Banco Cordillera', vis: 14.5, novis: 14.6, vehiculo: 17.2, ccDesde: 17.1, ccHasta: null },
  { entidad: 'Banco del Río', vis: 15.0, novis: null, vehiculo: 18.9, ccDesde: 16.8, ccHasta: 27.5 },
  { entidad: 'Banco Sabana', vis: 14.1, novis: 14.9, vehiculo: 17.8, ccDesde: 18.2, ccHasta: 26.0 },
  { entidad: 'Banco Pacífico', vis: null, novis: 15.4, vehiculo: 16.9, ccDesde: 17.6, ccHasta: 24.9 },
  { entidad: 'Banco Altiplano', vis: 14.8, novis: 15.2, vehiculo: 18.1, ccDesde: null, ccHasta: null },
  { entidad: 'Financiera Altamar', vis: 15.7, novis: 16.0, vehiculo: 19.4, ccDesde: 19.0, ccHasta: 28.8 },
  { entidad: 'Cooperativa Horizonte', vis: 13.9, novis: 14.4, vehiculo: null, ccDesde: 17.3, ccHasta: 22.1 },
];

const benchmarkingCreditos = {};
periodos.forEach((periodo, i) => {
  const tendencia = i < 6 ? -0.06 * i : -0.36 + 0.05 * (i - 6);
  const mover = (v) => (v == null ? null : redondear(v + tendencia + ruido() * 0.15));
  benchmarkingCreditos[periodo] = entidadesCreditos.map((f) => ({
    entidad: f.entidad,
    vis: mover(f.vis),
    novis: mover(f.novis),
    vehiculo: mover(f.vehiculo),
    ccDesde: mover(f.ccDesde),
    ccHasta: mover(f.ccHasta),
  }));
});

// ---------------------------------------------------------------------------
// Cifras y texto del análisis macro, uno por mes

const dolar = {};
const desempleo = {};
{
  let d = 4080;
  let u = 10.2;
  // Arranca un mes antes para tener con qué comparar enero.
  ['2025-12', ...periodos].forEach((p) => {
    d += ruido() * 90 - 12;
    u += ruido() * 0.4 - 0.05;
    dolar[p] = d;
    desempleo[p] = u;
  });
}
const mesAnteriorDe = (periodo) => {
  const [a, m] = periodo.split('-').map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`;
};
const nombreMes = (periodo) => NOMBRES[Number(periodo.split('-')[1]) - 1];

const cifrasPorMes = {};
const textoPorMes = {};
periodos.forEach((periodo) => {
  const t = filaDe(tasas, periodo);
  const tAnt = filaAnterior(tasas, periodo);
  const anterior = mesAnteriorDe(periodo);
  const cambioDolar = ((dolar[periodo] - dolar[anterior]) / dolar[anterior]) * 100;
  const mesAnt = nombreMes(anterior);

  cifrasPorMes[periodo] = [
    { etiqueta: 'Inflación anual', valor: `${coma(t.ipc)}%`, detalle: `${coma(tAnt.ipc)}% en ${mesAnt}` },
    { etiqueta: 'Tasa de política', valor: `${coma(t.repo)}%`, detalle: t.repo === tAnt.repo ? 'Sin cambio' : `Antes ${coma(tAnt.repo)}%` },
    { etiqueta: 'Dólar al cierre', valor: `$${miles(dolar[periodo])}`, detalle: `${cambioDolar >= 0 ? 'Sube' : 'Baja'} ${coma(Math.abs(cambioDolar), 1)}% en el mes` },
    { etiqueta: `Desempleo de ${mesAnt}`, valor: `${coma(desempleo[anterior], 1)}%`, detalle: `${coma(desempleo[anterior] + 0.5, 1)}% un año atrás` },
  ];

  const sube = t.ipc > tAnt.ipc;
  const repoCambia = t.repo !== tAnt.repo;
  textoPorMes[periodo] = [
    `- Datos inventados para mostrar la herramienta: no corresponden a cifras reales.`,
    `- La inflación anual ${sube ? 'subió' : 'bajó'} a ${coma(t.ipc)}% (${coma(tAnt.ipc)}% el mes anterior), ${sube ? 'presionada por alimentos y servicios' : 'con alivio en alimentos y bienes'}.`,
    repoCambia
      ? `- El banco central ${t.repo > tAnt.repo ? 'subió' : 'bajó'} la tasa de política a ${coma(t.repo)}%.`
      : `- El banco central mantuvo la tasa de política en ${coma(t.repo)}%.`,
    `- El dólar cerró en $${miles(dolar[periodo])}, ${cambioDolar >= 0 ? 'por encima' : 'por debajo'} del cierre de ${mesAnt}.`,
    `- Para el comité: revisar si las tasas de captación siguen alineadas con la IBR (${coma(t.ibr)}%).`,
  ].join('\n');
});

// ---------------------------------------------------------------------------
// Presentación

const pct = (clave, nombre) => ({ clave, nombre, tipo: 'porcentaje', decimales: 2 });
const millones = (clave, nombre) => ({ clave, nombre, tipo: 'moneda', decimales: 0, unidad: 'millones' });

const datos = {
  'tasas-referencia': {
    id: 'tasas-referencia',
    nombre: 'Tasas de referencia',
    columnas: [{ clave: 'mes', nombre: 'Mes', tipo: 'texto' }, pct('repo', 'Tasa de política'), pct('ibr', 'IBR'), pct('dtf', 'DTF'), pct('ipc', 'IPC anual')],
    porPeriodo: false,
    filas: tasas,
  },
  'saldo-cartera': {
    id: 'saldo-cartera',
    nombre: 'Saldo de cartera por línea',
    columnas: [{ clave: 'mes', nombre: 'Mes', tipo: 'texto' }, millones('consumo', 'Consumo'), millones('rotativos', 'Rotativos'), millones('vivienda', 'Vivienda')],
    porPeriodo: false,
    filas: cartera,
  },
  'saldo-pasivos': {
    id: 'saldo-pasivos',
    nombre: 'Saldo total de pasivos',
    columnas: [{ clave: 'mes', nombre: 'Mes', tipo: 'texto' }, millones('cdats', 'CDATs'), millones('fut', 'Ahorro futuro'), millones('disp', 'Ahorros disponibles'), millones('prog', 'Ahorros programados')],
    porPeriodo: false,
    filas: pasivos,
  },
  'benchmarking-vis': {
    id: 'benchmarking-vis',
    nombre: 'Benchmarking Vivienda VIS hasta 20 años',
    columnas: [
      { clave: 'entidad', nombre: 'Entidad', tipo: 'texto' },
      pct('tpp', 'Tasa promedio ponderada'),
      { clave: 'desembolsos', nombre: 'Desembolsos', tipo: 'numero' },
      millones('monto', 'Monto desembolsado'),
    ],
    porPeriodo: true,
    filasPorPeriodo: benchmarkingVis,
  },
  'benchmarking-creditos': {
    id: 'benchmarking-creditos',
    nombre: 'Benchmarking de créditos',
    columnas: [
      { clave: 'entidad', nombre: 'Entidad', tipo: 'texto' },
      pct('vis', 'Vivienda VIS'),
      pct('novis', 'Vivienda No VIS'),
      pct('vehiculo', 'Vehículo'),
      pct('ccDesde', 'Compra de cartera desde'),
      pct('ccHasta', 'Compra de cartera hasta'),
    ],
    porPeriodo: true,
    filasPorPeriodo: benchmarkingCreditos,
  },
};

const resaltar = { columna: 'entidad', valor: PROPIA };

const diapositivas = [
  { id: 'portada', tipo: 'portada', titulo: 'Comité de Precios', subtitulo: '{mes}', bloques: [] },
  {
    id: 'macro', tipo: 'contenido', titulo: 'Análisis macroeconómico', subtitulo: 'Contexto económico e inflación, {mes}', disposicion: 'filas',
    bloques: [
      { id: 'macro-cifras', tipo: 'cifras', cifras: { porPeriodo: true, valores: cifrasPorMes } },
      { id: 'macro-texto', tipo: 'texto', contenido: { porPeriodo: true, valores: textoPorMes } },
    ],
  },
  {
    id: 'tasas-referencia', tipo: 'contenido', titulo: 'Tasas de referencia', subtitulo: 'Evolución de IBR, DTF, tasa de política e IPC', disposicion: 'una',
    bloques: [{ id: 'g-tasas', tipo: 'grafico', datos: 'tasas-referencia', forma: 'lineas', ejeX: 'mes', series: [{ clave: 'repo' }, { clave: 'ibr' }, { clave: 'dtf' }, { clave: 'ipc' }] }],
  },
  {
    id: 'saldo-cartera', tipo: 'contenido', titulo: 'Saldo de cartera por línea', subtitulo: 'Distribución del saldo de crédito, en millones de pesos', disposicion: 'una',
    bloques: [{ id: 'g-cartera', tipo: 'grafico', datos: 'saldo-cartera', forma: 'barras', apilado: true, ejeX: 'mes', series: [{ clave: 'consumo' }, { clave: 'rotativos' }, { clave: 'vivienda' }] }],
  },
  {
    id: 'benchmarking-vis', tipo: 'contenido', titulo: 'Benchmarking Vivienda VIS', subtitulo: 'Tasa promedio ponderada de desembolsos hasta 20 años, {mes}', disposicion: 'una',
    bloques: [{ id: 'g-vis', tipo: 'grafico', datos: 'benchmarking-vis', forma: 'barrasHorizontales', ejeX: 'entidad', series: [{ clave: 'tpp' }], etiquetas: true, resaltar }],
  },
  {
    id: 'benchmarking-creditos', tipo: 'contenido', titulo: 'Benchmarking de créditos', subtitulo: 'Tasas de otras entidades frente a la nuestra, {mes}', disposicion: 'una',
    bloques: [{ id: 't-creditos', tipo: 'tabla', datos: 'benchmarking-creditos', resaltar }],
  },
  {
    id: 'saldo-pasivos', tipo: 'contenido', titulo: 'Saldo total de pasivos', subtitulo: 'Evolución por tipo de ahorro, en millones de pesos', disposicion: 'una',
    bloques: [{ id: 'g-pasivos', tipo: 'grafico', datos: 'saldo-pasivos', forma: 'area', ejeX: 'mes', series: [{ clave: 'cdats' }, { clave: 'fut' }, { clave: 'disp' }, { clave: 'prog' }] }],
  },
  { id: 'cierre', tipo: 'cierre', titulo: 'Gracias', subtitulo: 'Comité de Precios, {mes}', bloques: [] },
];

const presentacion = {
  formato: 1,
  id: 'comite-precios',
  nombre: 'Comité de Precios (ejemplo)',
  descripcion: 'Muestra con datos inventados: entidades y cifras ficticias.',
  tema: {
    primario: '#D4145A',
    degradado: ['#AC004A', '#D50058', '#FF0065', '#FF4769', '#FF8E6E'],
    series: ['#D4145A', '#2274C4', '#E36A0B', '#0B9B7A', '#8250D6', '#A1790F'],
    neutro: '#B9C3CF',
    logo: '/logo-presente-blanco.png',
  },
  periodos,
  diapositivas,
  datos,
  actualizado: '2026-11-16',
};

fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, JSON.stringify(presentacion, null, 1) + '\n');
console.log(`Muestra creada: ${path.relative(raiz, destino)} (${diapositivas.length} diapositivas, ${periodos.length} meses, datos inventados)`);
