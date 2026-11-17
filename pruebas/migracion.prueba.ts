// Conversión de la presentación original con un JSON INVENTADO de la misma
// forma que la exportación real (nombres y cifras ficticias). El respaldo de
// datos reales nunca se usa en las pruebas: ver "Datos reales" en PLAN.md.

import { describe, expect, it } from 'vitest';
import { filasDe, resolverCifra } from '@/lib/datos';
import { validarPresentacion } from '@/lib/edicion/validar';
import { migrarOriginal } from '@/lib/migracion/original';
import { armarTabla } from '@/lib/tablas';
import type { BloqueCifras, BloqueGrafico, BloqueTabla, BloqueTarjetas, BloqueTexto, Presentacion } from '@/lib/tipos';

const ENTIDADES = ['PRESENTE', 'Banco Uno', 'Banco Dos'];

function benchmarking(desplazamiento: number) {
  return [
    { entity: '3 entidades', amount: 1000 + desplazamiento, tpp: 15 + desplazamiento, disbursements_num: 90 },
    { entity: 'Banco Uno', amount: 600, tpp: 14.5, disbursements_num: 50 },
    { entity: 'PRESENTE', amount: 40, tpp: 13 + desplazamiento, disbursements_num: 5 },
  ];
}

function creditos(base: number) {
  const fila = (entity: string, k: number) => ({ entity, vis_tasa: base + k, novis_tasa: base + 1 + k, vehiculo_tasa: null, cc_desde: base + 2 - k, cc_hasta: base + 9 });
  return { banks: ENTIDADES.map((e, k) => fila(e, k)), cooperatives: [fila('PRESENTE', 0), fila('Cooperativa Tres', 0.5)] };
}

function cdats(base: number) {
  return {
    groups: [
      { name: 'Bancos', entities: ENTIDADES.map((entity, k) => ({ entity, d90: base - k, d180: base + 0.2 - k, d360: null, d540: base, d721: base, d1081: base, p90: 9 })) },
      { name: 'Otras', entities: [{ entity: 'Banco Tres', d90: base + 1, d180: null, d360: null, d540: null, d721: null, d1081: null }] },
    ],
  };
}

/** Exportación ficticia con la forma de la original (versión 2). */
export function exportacionFicticia() {
  const meses = ['nov-24', 'dic-24', 'ene-25'];
  return {
    id: 'main-presentation-v1',
    updatedAt: '2026-11-13T00:00:00.000Z',
    data: {
      metadata: { title: 'COMITÉ DE PRECIOS Octubre 2026', subtitle: 'Octubre 2026' },
      slideOrder: [
        'cover', 'macroeconomic', 'historicalRates', 'referenceRates', 'inflationRepo', 'deficitFiscal', 'portfolioBalance',
        'portfolioStockRates', 'monthlyDisbursements', 'disbursementRates', 'benchmarkingSummary', 'benchmarkingCredits',
        'benchmarkingLibreInversion', 'benchmarkingNoVis', 'benchmarkingVis', 'totalLiabilities', 'tppCaptacion', 'ingresosMensuales',
        'tppIngresosAhorro', 'benchmarkingCDATs', 'daviviendaDaviplata', 'servicioCredito', 'tppLibreInversion', 'cierre', 'rateChangeProposal',
      ],
      slideTitles: {
        cover: { title: 'COMITÉ DE PRECIOS Octubre 2026', subtitle: 'Octubre 2026' },
        macroeconomic: { title: 'Análisis Macroeconómico', subtitle: 'Contexto' },
        benchmarkingVis: { title: 'Benchmarking Vivienda VIS', subtitle: 'Comparativo VIS' },
      },
      macroAnalysis: ['Primer párrafo con **negrita**.', 'Segundo párrafo.'],
      historicalRatesV2: [{ date: '2021-01-29', rate1: 1, rate2: 2, rate3: 3 }, { date: '2021-02-26', rate1: 1.1, rate2: 2.1, rate3: 3.1 }],
      referenceRates: meses.map((month, i) => ({ month, dtf: 9 + i, ibr: 9.5, ipc: 5, repo: 10 })),
      inflationRepo: [{ date: '2001-01-01', repo: 12, inflation: 8.5 }, { date: '2001-02-01', repo: 11, inflation: null }],
      deficitFiscal: [{ year: '2024', total: -6.7, enero: 0.1 }, { year: '2025', total: -6.4 }],
      portfolioBalanceByLine: meses.map((month, i) => ({ month, consumo: 100, rotativos: 50, vivienda: 40, total: 190 + i })),
      portfolioStockRates: meses.map((month) => ({ month, consumo: 20, usura: 26, rotativos: 25, vivienda: 11, total: 19 })),
      monthlyDisbursements: meses.map((month) => ({ month, consumo: 7, tarjeta: 5, vivienda: 2, total: 14 })),
      disbursementRates: meses.map((month) => ({ month, consumo: 22, tarjeta: 26, usura: 26, tpp: 22.5, vivienda: 11 })),
      benchmarkingSummaryHeaders: { segmento: 'monto desembolso en SMLV', entidades: 'EntidadeS', tasaProm: 'tasa Prom. sector (EA).' },
      benchmarkingSummaryData: [
        { mes: 'Diciembre', segmento: 'Hasta 1 SMLV', entidades: 25, monto: '$54.01 mil M', desembolsos: '80.130', tasaProm: '45,64%', tasaPresente: '22,59%', variacion: '↑ 23,05%', desembolsosPresente: '309 M' },
        { mes: 'Octubre', segmento: 'Hasta 1 SMLV', entidades: 27, monto: '$60 mil M', desembolsos: '90.000', tasaProm: '46,00%', tasaPresente: '26,00%', variacion: '', desembolsosPresente: '390 M' },
      ],
      benchmarkingCredits: creditos(14),
      benchmarkingCreditsSeptiembre: creditos(15),
      benchmarkingCreditsOctubre: creditos(15.5),
      benchmarkingLibreInversion: benchmarking(0),
      benchmarkingLibreInversionOctubre: benchmarking(1),
      benchmarkingViviendaNoVisHasta20Octubre: benchmarking(0),
      benchmarkingViviendaVisHasta20: benchmarking(0),
      benchmarkingViviendaVisHasta20Octubre: benchmarking(2),
      totalLiabilitiesBalance: meses.map((month) => ({ month, fut: 50, disp: 50, prog: 9, cdats: 87, total: 200 })),
      tppCaptacionSaldos: meses.map((month) => ({ month, saldo_cap: 200, saldo_cdat: 87, tpp_cap: 7.7, tpp_cdat: 10.8 })),
      ingresosMensuales: [{ periodo: 'ago-25', cdats: 19, futuroCredito: 1.5, extra: 3.6 }, { periodo: 'sep-25', cdats: 20, futuroCredito: 1.6, extra: 3.7 }],
      ingresosMensualesExtra: { etiqueta: 'Ahorro Programado' },
      tppIngresosAhorro: [{ periodo: 'ago-25', costoCdats: 10.4, costoFuturo: 9.7, extra: 3.5 }],
      benchmarkingCDATs: cdats(10),
      benchmarkingCDATsOctubre: cdats(11),
      benchmarkingDavivienda: {
        libranzaTable: [{ product: 'Producto A', rate: '15,00%' }],
        creditoDigitalTable: [{ product: 'Producto B', rate: '0% + $10.000 fijo' }],
        creditoDigitalNote: 'Nota de prueba',
        ahorroBolsillosStat: '1% → 2% → 3%',
        ahorroBolsillosSubtitle: 'Subtítulo',
        ahorroBolsillosBullets: ['Misión 1', '', 'Misión 2'],
        tarjetaCreditoTitle: 'Tarjeta A', tarjetaCreditoText: 'Texto A',
        tarjetaDebitoTitle: 'Tarjeta B', tarjetaDebitoText: 'Texto B',
      },
      servicioCreditoCostoAhorro: [{ periodo: 'ene-25', costo: 1335, servicio: 5357 }],
      tppLibreInversionHistorico: [{ periodo: 'ene-25', valor: 9.45 }, { periodo: 'feb-25', valor: 9.1 }],
      rateChangeProposal: {
        intro1: 'Intro uno.', intro2: 'Intro dos.', proposalTitle: 'Se propone lo siguiente:',
        proposals: [{ icon: '🏦', category: 'CDATs', text: 'Texto de la propuesta.' }],
      },
    },
  };
}

function convertir(): Presentacion {
  return migrarOriginal(exportacionFicticia(), { ahora: '2026-11-17T00:00:00.000Z' }).presentacion;
}

const diapositiva = (p: Presentacion, clave: string) => {
  const d = p.diapositivas.find((x) => x.id.endsWith(`-${clave}`));
  if (!d) throw new Error(`Falta la diapositiva ${clave}`);
  return d;
};

describe('migrarOriginal', () => {
  it('arma las 25 diapositivas en el orden original y el resultado es válido', () => {
    const { presentacion, avisos } = migrarOriginal(exportacionFicticia());
    expect(presentacion.diapositivas).toHaveLength(25);
    expect(presentacion.diapositivas[0].tipo).toBe('portada');
    expect(presentacion.diapositivas[23].tipo).toBe('cierre');
    expect(presentacion.diapositivas.at(-1)!.id).toMatch(/rateChangeProposal$/);
    expect(avisos).toEqual([]);
    const validacion = validarPresentacion(presentacion);
    expect(validacion.ok ? [] : validacion.errores).toEqual([]);
  });

  it('pone los meses desde diciembre del año anterior hasta el de la portada', () => {
    const p = convertir();
    expect(p.periodos).toEqual(['2025-12', '2026-09', '2026-10']);
    const vis = p.datos['c-benchmarking-vis'];
    expect(Object.keys(vis.filasPorPeriodo ?? {}).sort()).toEqual(['2025-12', '2026-10']);
  });

  it('usa los títulos guardados y los de la portada con {mes}', () => {
    const p = convertir();
    expect(p.diapositivas[0]).toMatchObject({ titulo: 'Comité de Precios', subtitulo: '{mes}' });
    expect(diapositiva(p, 'benchmarkingVis')).toMatchObject({ titulo: 'Benchmarking Vivienda VIS', subtitulo: 'Comparativo VIS' });
    // Sin título guardado queda el nombre de la diapositiva.
    expect(diapositiva(p, 'deficitFiscal').titulo).toBe('Déficit fiscal');
  });

  it('deja los textos solo en el mes de la presentación', () => {
    const p = convertir();
    const texto = diapositiva(p, 'macroeconomic').bloques[0] as BloqueTexto;
    expect(texto.contenido).toEqual({ porPeriodo: true, valores: { '2026-10': 'Primer párrafo con **negrita**.\n\nSegundo párrafo.' } });
  });

  it('convierte fechas en meses y calcula la diferencia REPO − inflación', () => {
    const p = convertir();
    expect(p.datos['c-tes'].filas?.map((f) => f.fecha)).toEqual(['ene-21', 'feb-21']);
    expect(p.datos['c-inflacion-repo'].filas).toEqual([
      { fecha: 'ene-01', repo: 12, inflation: 8.5, diferencia: 3.5 },
      { fecha: 'feb-01', repo: 11, inflation: null, diferencia: null },
    ]);
    const tes = diapositiva(p, 'historicalRates').bloques[0] as BloqueGrafico;
    expect(tes.series.find((s) => s.clave === 'rate3')?.punteada).toBe(true);
  });

  it('pasa el resumen a números y completa la variación que falta', () => {
    const p = convertir();
    const c = p.datos['c-resumen-benchmarking'];
    expect(c.columnas.find((x) => x.clave === 'entidades')?.nombre).toBe('Entidades');
    expect(c.columnas.find((x) => x.clave === 'segmento')?.nombre).toBe('Monto desembolso en SMLV');
    expect(c.filasPorPeriodo?.['2025-12'][0]).toMatchObject({ desembolsos: 80130, tasaProm: 45.64, variacion: 23.05, monto: '$54.01 mil M' });
    expect(c.filasPorPeriodo?.['2026-10'][0].variacion).toBe(20);
  });

  it('arma el benchmarking de barras con cifras que salen de los datos', () => {
    const p = convertir();
    const d = diapositiva(p, 'benchmarkingVis');
    expect(d.disposicion).toBe('principal-lateral');
    const g = d.bloques[0] as BloqueGrafico;
    expect(g).toMatchObject({ forma: 'barras', ejeX: 'entidad', detalleEje: 'tpp', resaltar: { columna: 'entidad', valor: 'PRESENTE' } });
    const cifras = (d.bloques[1] as BloqueCifras).cifras.valor!;
    const presente = resolverCifra(p, cifras[4], '2026-10');
    expect(presente).toEqual({ valor: '15,00%', detalle: '−2,00 pp frente al promedio' });
    expect(resolverCifra(p, cifras[1], '2026-10')).toMatchObject({ valor: '$1.002', unidad: 'millones' });
    expect(resolverCifra(p, cifras[0], '2026-09').sinDato).toBe(true);
  });

  it('calcula Var. y posición en créditos, por sección y contra el mes anterior', () => {
    const p = convertir();
    const b = diapositiva(p, 'benchmarkingCredits').bloques[0] as BloqueTabla;
    const tabla = armarTabla(p, b, p.datos[b.datos], '2026-10')!;
    expect(tabla.mesAnterior).toBe('2026-09');
    expect(tabla.filas[0]).toEqual({ tipo: 'seccion', titulo: 'Entidades bancarias' });
    const presente = tabla.filas[1];
    expect(presente.tipo === 'datos' && presente.fila).toMatchObject({ entidad: 'PRESENTE', vis_tasa: 15.5, 'variacion:vis_tasa': 0.5, 'posicion:vis_tasa': 1 });
    const cooperativa = tabla.filas.find((f) => f.tipo === 'datos' && f.fila.entidad === 'Cooperativa Tres');
    expect(cooperativa?.tipo === 'datos' && cooperativa.fila['posicion:vis_tasa']).toBe(2);
    expect(tabla.grupos?.map((g) => g.nombre)).toEqual([null, 'Vivienda VIS', 'Vivienda No VIS', 'Consumo vehículo', 'Compra cartera']);
  });

  it('calcula la posición de los CDATs con la tasa más alta primero', () => {
    const p = convertir();
    const b = diapositiva(p, 'benchmarkingCDATs').bloques[0] as BloqueTabla;
    expect(p.datos[b.datos].columnas.some((c) => c.clave.startsWith('p'))).toBe(false);
    const tabla = armarTabla(p, b, p.datos[b.datos], '2026-10')!;
    const posiciones = tabla.filas.flatMap((f) => (f.tipo === 'datos' ? [[f.fila.entidad, f.fila['posicion:d90']]] : []));
    expect(posiciones).toEqual([['PRESENTE', 1], ['Banco Uno', 2], ['Banco Dos', 3], ['Banco Tres', 1]]);
    expect(b.nota).toBeUndefined();
  });

  it('arma Davivienda en cuadrícula y la propuesta con tarjetas', () => {
    const p = convertir();
    const d = diapositiva(p, 'daviviendaDaviplata');
    expect(d.disposicion).toBe('cuadricula');
    expect(d.bloques.map((b) => b.tipo)).toEqual(['tabla', 'texto', 'tabla', 'tarjetas']);
    expect((d.bloques[1] as BloqueTexto).contenido.valores?.['2026-10']).toBe('# 1% → 2% → 3%\n\nSubtítulo\n\n- Misión 1\n- Misión 2');
    expect(d.bloques[2].nota).toBe('Nota de prueba');
    const propuesta = diapositiva(p, 'rateChangeProposal');
    const tarjetas = propuesta.bloques[1] as BloqueTarjetas;
    expect(tarjetas.titulo).toBe('Se propone lo siguiente:');
    expect(tarjetas.tarjetas.valores?.['2026-10']).toEqual([{ titulo: '🏦 CDATs', texto: 'Texto de la propuesta.' }]);
  });

  it('separa saldos y tasas de TPP captación en dos gráficos', () => {
    const p = convertir();
    const d = diapositiva(p, 'tppCaptacion');
    expect(d.disposicion).toBe('columnas');
    expect(d.bloques.map((b) => (b as BloqueGrafico).series.map((s) => s.clave))).toEqual([['saldo_cdat', 'saldo_cap'], ['tpp_cdat', 'tpp_cap']]);
  });

  it('avisa lo que falta y rechaza un archivo que no es de la presentación', () => {
    const e = exportacionFicticia();
    const { benchmarkingDavivienda: _quitado, ...resto } = e.data;
    const { presentacion, avisos } = migrarOriginal({ data: resto });
    expect(presentacion.diapositivas).toHaveLength(24);
    expect(avisos).toEqual(['Davivienda / DaviPlata: el archivo no trae sus datos; no se pasó.']);
    expect(() => migrarOriginal({ nombre: 'otra cosa' })).toThrow(/no parece una exportación/);
  });

  it('las series de tiempo valen para todos los meses', () => {
    const p = convertir();
    expect(filasDe(p.datos['c-tasas-referencia'], '2025-12')).toHaveLength(3);
    expect(filasDe(p.datos['c-tasas-referencia'], '2026-10')).toHaveLength(3);
  });
});
