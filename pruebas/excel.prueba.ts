// Carga desde Excel (etapa 3): lector, interpretación de la hoja y
// operaciones. Los archivos de pruebas/archivos/ son inventados; ver
// scripts/crear-archivos-prueba.py.

import { readFileSync } from 'node:fs';
import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { aplicar, aplicarVarias, bloqueDe, compactar, inversa, type Operacion } from '@/lib/edicion/operaciones';
import { validarOperaciones, validarPresentacion } from '@/lib/edicion/validar';
import { motivoForma, opsActualizarDesdeExcel, opsBloqueDesdeExcel } from '@/lib/excel/cargar';
import { analizarFormato, ArchivoNoLegible, fechaDeSerie, leerArchivo, separadorCsv, type Celda, type Hoja, type Libro } from '@/lib/excel/leer';
import {
  armarFilas, buscarEncabezado, columnasDelArchivo, convertirCelda, filasDeDatos, formatearFecha, letraColumna, proponerEncabezados,
  proponerTipo, rejillaDe, relocalizarEncabezados, type Lectura,
} from '@/lib/excel/tabla';
import type { BloqueGrafico, Columna, OrigenExcel, Presentacion } from '@/lib/tipos';
import { muestra } from './muestra';

const abrir = (archivo: string): Libro => leerArchivo(archivo, new Uint8Array(readFileSync(`pruebas/archivos/${archivo}`)));
const hoja = (libro: Libro, nombre: string): Hoja => libro.hojas.find((h) => h.nombre === nombre)!;
const valida = (p: Presentacion) => {
  const r = validarPresentacion(p);
  if (!r.ok) throw new Error(r.errores.join('\n'));
};
const lectura = (encabezados: number, cambios: Partial<Lectura> = {}): Lectura => ({ orientacion: 'filas', encabezados, hasta: 'vacia', invertir: false, ...cambios });

describe('lector', () => {
  it('lee un .xlsx: hojas, textos, porcentajes, moneda, fechas y fórmulas sin calcular', () => {
    const libro = abrir('tasas-octubre.xlsx');
    expect(libro.hojas.map((h) => [h.nombre, h.oculta])).toEqual([['Resumen', false], ['Serie', false], ['Oculta', true]]);
    const r = hoja(libro, 'Resumen').celdas;
    expect(r[0][0]).toEqual({ t: 's', v: 'Benchmarking de tasas (datos inventados)' });
    expect(r[1]).toEqual([]);
    expect(r[2].map((c) => c && c.v)).toEqual(['Entidad', 'Tasa', 'Desembolsos', 'Monto', 'Fecha corte', 'Tasa', null, 'Cálculo']);
    expect(r[3][1]).toEqual({ t: 'n', v: 0.1373, formato: { porcentaje: true, decimales: 2 } });
    expect(r[3][3]).toEqual({ t: 'n', v: 52340, formato: { moneda: true, decimales: 0 } });
    expect(r[3][4]).toEqual({ t: 'd', v: '2026-10-31' });
    // openpyxl no guarda el valor de las fórmulas: la celda queda vacía.
    expect(r[3][7]).toBeUndefined();
    expect(hoja(libro, 'Serie').celdas[1][0]).toEqual({ t: 'd', v: '2025-10-01' });
  });

  it('lee igual lo que guarda LibreOffice, con el valor calculado de las fórmulas', () => {
    const r = hoja(abrir('tasas-octubre-libreoffice.xlsx'), 'Resumen').celdas;
    expect(r[3][1]).toEqual({ t: 'n', v: 0.1373, formato: { porcentaje: true, decimales: 2 } });
    expect(r[3][3]).toEqual({ t: 'n', v: 52340, formato: { moneda: true, decimales: 0 } });
    expect(r[3][4]).toEqual({ t: 'd', v: '2026-10-31' });
    expect(r[3][7]).toEqual({ t: 'n', v: 13.73 });
  });

  it('lee un CSV de Excel en español: punto y coma, comillas y codificación de Windows', () => {
    const [h] = abrir('tasas-octubre.csv').hojas;
    expect(h.nombre).toBe('tasas-octubre');
    expect(h.celdas[0][0]).toEqual({ t: 's', v: 'Compañía' });
    expect(h.celdas[3][0]).toEqual({ t: 's', v: 'Banco; Ficticio' });
    expect(h.celdas[1].map((c) => c && c.v)).toEqual(['Fondo Ejemplo', '13,73%', '412', '$ 52.340']);
    expect(separadorCsv('a,b,c\n1,2,3')).toBe(',');
    expect(separadorCsv('a\tb\n1\t2')).toBe('\t');
    expect(separadorCsv('"x;y",b\n1,2')).toBe(',');
  });

  it('explica qué hacer con un .xls, un .ods u otro archivo', () => {
    expect(() => abrir('tasas-octubre.xls')).toThrow(/Excel antiguo \(\.xls\).*guárdalo como/);
    expect(() => abrir('tasas-octubre.ods')).toThrow(/LibreOffice \(\.ods\)/);
    expect(() => leerArchivo('foto.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toThrow(ArchivoNoLegible);
    expect(() => leerArchivo('vacio.xlsx', new Uint8Array())).toThrow(/vacío/);
    expect(() => leerArchivo('roto.xlsx', new Uint8Array([0x50, 0x4b, 3, 4, 1, 2, 3]))).toThrow(/dañado/);
  });

  it('acepta etiquetas con prefijo, textos en línea y celdas sin posición', () => {
    const ns = 'xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
    const archivos = {
      '[Content_Types].xml': strToU8('<Types/>'),
      '_rels/.rels': strToU8('<Relationships><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/xl/libro.xml"/></Relationships>'),
      'xl/libro.xml': strToU8(`<x:workbook ${ns}><x:workbookPr date1904="1"/><x:sheets><x:sheet name="Datos &amp; más" sheetId="1" r:id="h1"/></x:sheets></x:workbook>`),
      'xl/_rels/libro.xml.rels': strToU8('<Relationships><Relationship Id="h1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="hojas/una.xml"/></Relationships>'),
      'xl/hojas/una.xml': strToU8(`<x:worksheet ${ns}><x:sheetData>
        <x:row><x:c t="inlineStr"><x:is><x:t>Mes</x:t></x:is></x:c><x:c t="inlineStr"><x:is><x:r><x:t>Va</x:t></x:r><x:r><x:t xml:space="preserve">lor_x000D_</x:t></x:r></x:is></x:c></x:row>
        <x:row><x:c t="str"><x:f>A1</x:f><x:v>Ene</x:v></x:c><x:c><x:v>1.5</x:v></x:c><x:c t="e"><x:v>#N/A</x:v></x:c><x:c t="b"><x:v>1</x:v></x:c></x:row>
      </x:sheetData></x:worksheet>`),
    };
    const libro = leerArchivo('a.xlsx', zipSync(archivos));
    expect(libro.hojas[0].nombre).toBe('Datos & más');
    expect(libro.hojas[0].celdas).toEqual([
      [{ t: 's', v: 'Mes' }, { t: 's', v: 'Valor\r' }],
      [{ t: 's', v: 'Ene' }, { t: 'n', v: 1.5 }, null, { t: 's', v: 'VERDADERO' }],
    ]);
  });

  it('pasa los números de serie a fechas, con el error de 1900 de Excel', () => {
    expect(fechaDeSerie(1)).toBe('1900-01-01');
    expect(fechaDeSerie(59)).toBe('1900-02-28');
    expect(fechaDeSerie(61)).toBe('1900-03-01');
    expect(fechaDeSerie(46326)).toBe('2026-10-31');
    expect(fechaDeSerie(46326.75)).toBe('2026-10-31');
    expect(fechaDeSerie(0, true)).toBe('1904-01-01');
    expect(fechaDeSerie(-1)).toBeNull();
  });

  it('entiende los formatos de número', () => {
    expect(analizarFormato('General')).toEqual({ fecha: false });
    expect(analizarFormato('0.00%')).toEqual({ fecha: false, formato: { porcentaje: true, decimales: 2 } });
    expect(analizarFormato('"$"#,##0;[Red]-"$"#,##0')).toEqual({ fecha: false, formato: { moneda: true, decimales: 0 } });
    expect(analizarFormato('\\$#,##0')).toEqual({ fecha: false, formato: { moneda: true, decimales: 0 } });
    expect(analizarFormato('[$$-240A] #,##0.0')).toEqual({ fecha: false, formato: { moneda: true, decimales: 1 } });
    expect(analizarFormato('[$-409]#,##0.000')).toEqual({ fecha: false, formato: { decimales: 3 } });
    expect(analizarFormato('#,##0 "millones"')).toEqual({ fecha: false, formato: { decimales: 0 } });
    expect(analizarFormato('0.00E+00')).toEqual({ fecha: false, formato: { decimales: 2 } });
    for (const fecha of ['dd/mm/yyyy', 'mmm\\-yy', '[$-409]mmmm d, yyyy;@', 'd-mmm', 'yyyy']) expect(analizarFormato(fecha)).toEqual({ fecha: true });
    for (const hora of ['h:mm', 'mm:ss', '[h]:mm:ss']) expect(analizarFormato(hora).fecha).toBe(false);
  });
});

describe('interpretación de la hoja', () => {
  const resumen = hoja(abrir('tasas-octubre.xlsx'), 'Resumen');
  const rejilla = rejillaDe(resumen, 'filas');

  it('propone la fila de encabezados aunque haya un título arriba', () => {
    expect(proponerEncabezados(rejilla)).toBe(3);
    expect(proponerEncabezados(hoja(abrir('tasas-octubre.xlsx'), 'Serie').celdas)).toBe(1);
    expect(proponerEncabezados(hoja(abrir('tasas-noviembre.xlsx'), 'Resumen').celdas)).toBe(4);
  });

  it('nombra las columnas: repetidas con (2) y sin encabezado por su letra', () => {
    expect(columnasDelArchivo(rejilla, 3).map((c) => [c.posicion, c.encabezado])).toEqual([
      ['A', 'Entidad'], ['B', 'Tasa'], ['C', 'Desembolsos'], ['D', 'Monto'], ['E', 'Fecha corte'], ['F', 'Tasa (2)'], ['G', 'Columna G'], ['H', 'Cálculo'],
    ]);
    expect(letraColumna(0)).toBe('A');
    expect(letraColumna(26)).toBe('AA');
    expect(letraColumna(701)).toBe('ZZ');
    expect(buscarEncabezado(columnasDelArchivo(rejilla, 3), '  fecha CORTE ')?.posicion).toBe('E');
  });

  it('lee las filas hasta la primera vacía, o todas; y las da vuelta', () => {
    expect(filasDeDatos(rejilla, lectura(3)).map((f) => f[0]?.v)).toEqual(['Fondo Ejemplo', 'Cooperativa Uno', 'Banco Ficticio', 'Caja Inventada']);
    expect(filasDeDatos(rejilla, lectura(3, { hasta: 'final' })).at(-1)?.[0]?.v).toBe('Fuente: datos inventados para pruebas.');
    expect(filasDeDatos(rejilla, lectura(3, { invertir: true }))[0][0]?.v).toBe('Caja Inventada');
  });

  it('propone el tipo de cada columna', () => {
    const datos = filasDeDatos(rejilla, lectura(3));
    const tipo = (j: number) => proponerTipo(datos.map((f) => f[j] ?? null));
    expect(tipo(0)).toEqual({ tipo: 'texto' });
    expect(tipo(1)).toEqual({ tipo: 'porcentaje', decimales: 2 });
    expect(tipo(2)).toEqual({ tipo: 'numero', decimales: 0 });
    expect(tipo(3)).toEqual({ tipo: 'moneda', decimales: 0 });
    expect(tipo(4)).toEqual({ tipo: 'texto', fechas: 'dia' });
    expect(tipo(5)).toEqual({ tipo: 'numero', decimales: 4 });
    const serie = hoja(abrir('tasas-octubre.xlsx'), 'Serie').celdas.slice(1);
    expect(proponerTipo(serie.map((f) => f[0]))).toEqual({ tipo: 'texto', fechas: 'mes' });
    // En un CSV todo llega como texto: se reconoce por cómo está escrito.
    const csv = abrir('tasas-octubre.csv').hojas[0].celdas.slice(1);
    expect(proponerTipo(csv.map((f) => f[1]))).toEqual({ tipo: 'porcentaje' });
    expect(proponerTipo(csv.map((f) => f[3]))).toEqual({ tipo: 'moneda' });
    expect(proponerTipo([{ t: 's', v: 'A' }, { t: 's', v: 'B' }, { t: 's', v: '3' }])).toEqual({ tipo: 'texto' });
  });

  it('convierte cada celda según el tipo de la columna', () => {
    const pct: Columna = { clave: 'a', nombre: 'A', tipo: 'porcentaje' };
    const texto: Columna = { clave: 'b', nombre: 'B', tipo: 'texto' };
    expect(convertirCelda({ t: 'n', v: 0.145, formato: { porcentaje: true } }, pct)).toEqual({ valor: 14.5, problema: false });
    expect(convertirCelda({ t: 's', v: '14,5%' }, pct)).toEqual({ valor: 14.5, problema: false });
    expect(convertirCelda({ t: 's', v: 'n.d.' }, pct)).toEqual({ valor: null, problema: true });
    expect(convertirCelda({ t: 's', v: '-' }, pct)).toEqual({ valor: null, problema: false });
    expect(convertirCelda({ t: 'd', v: '2026-10-31' }, pct)).toEqual({ valor: null, problema: true });
    expect(convertirCelda({ t: 'd', v: '2026-10-31' }, texto, 'mes')).toEqual({ valor: 'Oct 26', problema: false });
    expect(convertirCelda({ t: 'n', v: 2024 }, texto)).toEqual({ valor: '2024', problema: false });
    expect(convertirCelda(null, texto)).toEqual({ valor: null, problema: false });
    expect(formatearFecha('2026-01-05', 'dia')).toBe('05/01/2026');
    expect(formatearFecha('2026-01-05', 'anio')).toBe('2026');
  });

  it('arma las filas, salta las vacías, marca lo que no entiende y respeta el tope', () => {
    const csv = abrir('tasas-octubre.csv').hojas[0].celdas;
    const mapeo = [
      { columna: { clave: 'col1', nombre: 'Compañía', tipo: 'texto' as const }, indice: 0 },
      { columna: { clave: 'col2', nombre: 'Tasa', tipo: 'porcentaje' as const }, indice: 1 },
      { columna: { clave: 'col3', nombre: 'Monto', tipo: 'moneda' as const }, indice: 3 },
      { columna: { clave: 'col4', nombre: 'Vacía', tipo: 'numero' as const }, indice: null },
    ];
    const r = armarFilas(filasDeDatos(csv, lectura(1)), mapeo);
    expect(r.total).toBe(4);
    expect(r.filas[0]).toEqual({ col1: 'Fondo Ejemplo', col2: 13.73, col3: 52340, col4: null });
    expect(r.filas[2].col1).toBe('Banco; Ficticio');
    expect([...r.problemas]).toEqual(['3|col2']);

    const muchas: Celda[][] = Array.from({ length: 12 }, (_, i) => [{ t: 's', v: `F${i + 1}` }, null, { t: 's', v: 'x' }]);
    muchas.splice(4, 0, [null, null, { t: 's', v: 'solo en otra columna' }]);
    const solo = [{ columna: { clave: 'k', nombre: 'K', tipo: 'texto' as const }, indice: 0 }];
    expect(armarFilas(muchas, solo, 'primeras', 5).filas.map((f) => f.k)).toEqual(['F1', 'F2', 'F3', 'F4', 'F5']);
    const ultimas = armarFilas(muchas, solo, 'ultimas', 5);
    expect(ultimas.total).toBe(12);
    expect(ultimas.filas.map((f) => f.k)).toEqual(['F8', 'F9', 'F10', 'F11', 'F12']);
  });

  it('encuentra los encabezados recordados aunque hayan bajado de fila', () => {
    const noviembre = rejillaDe(hoja(abrir('tasas-noviembre.xlsx'), 'Resumen'), 'filas');
    expect(relocalizarEncabezados(noviembre, ['Entidad', 'Tasa', 'Monto'], 3)).toBe(4);
    expect(relocalizarEncabezados(rejilla, ['Entidad', 'Tasa'], 3)).toBe(3);
    expect(relocalizarEncabezados(rejilla, ['No existe'], 3)).toBe(3);
  });

  it('lee encabezados en una columna, dando vuelta la hoja', () => {
    const vuelta: Hoja = {
      nombre: 'x', oculta: false, recortada: false,
      celdas: [
        [{ t: 's', v: 'Entidad' }, { t: 's', v: 'Uno' }, { t: 's', v: 'Dos' }],
        [{ t: 's', v: 'Tasa' }, { t: 'n', v: 10 }, { t: 'n', v: 12 }],
      ],
    };
    const r = rejillaDe(vuelta, 'columnas');
    expect(columnasDelArchivo(r, 1, 'columnas').map((c) => [c.posicion, c.encabezado])).toEqual([['1', 'Entidad'], ['2', 'Tasa']]);
    expect(filasDeDatos(r, lectura(1, { orientacion: 'columnas' })).map((f) => f.map((c) => c?.v))).toEqual([['Uno', 10], ['Dos', 12]]);
  });
});

const ORIGEN: OrigenExcel = {
  archivo: 'tasas-octubre.xlsx', hoja: 'Resumen', orientacion: 'filas', encabezados: 3,
  columnas: [{ clave: 'col1', encabezado: 'Entidad' }, { clave: 'col2', encabezado: 'Tasa' }],
  hasta: 'vacia', cargado: '2026-11-17T08:00:00.000Z', periodo: '2026-10',
};

describe('operaciones de la carga', () => {
  it('datos.origen se aplica, se deshace, se compacta y se valida', () => {
    const p = muestra();
    const op: Operacion = { op: 'datos.origen', conjunto: 'benchmarking-vis', valor: ORIGEN };
    const vuelta = inversa(p, op);
    const cambiada = aplicar(p, op);
    expect(cambiada.datos['benchmarking-vis'].origen).toEqual(ORIGEN);
    expect(vuelta.reduce(aplicar, cambiada)).toEqual(p);
    expect('origen' in aplicar(cambiada, { op: 'datos.origen', conjunto: 'benchmarking-vis', valor: null }).datos['benchmarking-vis']).toBe(false);
    valida(cambiada);
    const otra: Operacion = { ...op, valor: { ...ORIGEN, hoja: 'Otra' } };
    expect(compactar([op, otra])).toEqual([otra]);
    expect(validarOperaciones([op]).ok).toBe(true);
    expect(validarOperaciones([{ ...op, valor: { ...ORIGEN, orientacion: 'diagonal' } }]).ok).toBe(false);
    expect(validarOperaciones([{ ...op, valor: { ...ORIGEN, encabezados: 0 } }]).ok).toBe(false);
  });

  const columnas: Columna[] = [
    { clave: 'col1', nombre: 'Entidad', tipo: 'texto' },
    { clave: 'col2', nombre: 'Tasa', tipo: 'porcentaje', decimales: 2 },
    { clave: 'col3', nombre: 'Monto', tipo: 'moneda', decimales: 0 },
  ];
  const filas = [{ col1: 'Uno', col2: 13.7, col3: 100 }, { col1: 'Dos', col2: 15.2, col3: 80 }];

  it('crea un gráfico con sus datos en un solo paso, que se deshace entero', () => {
    const p = muestra();
    const r = opsBloqueDesdeExcel(p, { tipo: 'grafico', diapositiva: 'macro', nombre: 'Tasas', columnas, filas, forma: 'barras', mes: { periodo: '2026-10', nuevo: false }, origen: ORIGEN })!;
    const { presentacion: q, omitidas } = aplicarVarias(p, r.ops);
    expect(omitidas).toBe(0);
    valida(q);
    const bloque = bloqueDe(q, r.bloque) as BloqueGrafico;
    expect(bloque).toMatchObject({ tipo: 'grafico', forma: 'barras', ejeX: 'col1', series: [{ clave: 'col2' }, { clave: 'col3' }] });
    expect(q.datos[r.conjunto]).toMatchObject({ nombre: 'Tasas', porPeriodo: true, filasPorPeriodo: { '2026-10': filas }, origen: ORIGEN });
    expect(q.diapositivas.find((d) => d.id === 'macro')!.bloques.at(-1)!.id).toBe(r.bloque);
    // Deshacer: las inversas de cada operación, en orden contrario.
    let x = p;
    const vueltas: Operacion[][] = [];
    for (const op of r.ops) {
      vueltas.unshift(inversa(x, op));
      x = aplicar(x, op);
    }
    expect(vueltas.flat().reduce(aplicar, x)).toEqual(p);
  });

  it('una tabla igual en todos los meses, en un mes nuevo, y una cascada con una sola serie', () => {
    const p = muestra();
    const tabla = opsBloqueDesdeExcel(p, { tipo: 'tabla', diapositiva: 'tasas-referencia', nombre: 'T', columnas, filas, mes: null, origen: { ...ORIGEN, periodo: null } })!;
    const q = aplicarVarias(p, tabla.ops).presentacion;
    valida(q);
    expect(q.datos[tabla.conjunto]).toMatchObject({ porPeriodo: false, filas });
    // La diapositiva tenía un bloque con disposición "una": pasa a columnas.
    expect(q.diapositivas.find((d) => d.id === 'tasas-referencia')!.disposicion).toBe('columnas');

    const nuevo = opsBloqueDesdeExcel(p, { tipo: 'grafico', diapositiva: 'macro', nombre: 'C', columnas, filas, forma: 'cascada', mes: { periodo: '2026-11', nuevo: true }, origen: ORIGEN })!;
    expect(nuevo.ops[0]).toEqual({ op: 'periodo.agregar', periodo: '2026-11', copiarDe: '2026-10' });
    const s = aplicarVarias(p, nuevo.ops).presentacion;
    valida(s);
    expect(s.periodos.at(-1)).toBe('2026-11');
    expect((bloqueDe(s, nuevo.bloque) as BloqueGrafico).series).toEqual([{ clave: 'col2' }]);
  });

  it('dice cuándo las columnas no sirven para un tipo de gráfico', () => {
    expect(motivoForma('barras', columnas.slice(0, 1))).toMatch(/al menos una serie/);
    expect(motivoForma('barras', [columnas[0], { ...columnas[0], clave: 'x' }])).toMatch(/numéricas/);
    expect(motivoForma('dispersion', columnas)).toMatch(/eje tiene que ser una columna numérica/);
    expect(motivoForma('dispersion', [columnas[1], columnas[2]])).toBeNull();
    expect(motivoForma('lineas', columnas)).toBeNull();
  });

  it('actualiza los datos de un mes sin tocar los otros, y recuerda el origen', () => {
    const p = muestra();
    const c = p.datos['benchmarking-vis'];
    const nuevas = [{ entidad: 'Nueva', tpp: 15, desembolsos: 10, monto: 20 }];
    const ops = opsActualizarDesdeExcel(p, c.id, nuevas, { periodo: '2026-10', nuevo: false }, ORIGEN);
    const q = aplicarVarias(p, ops).presentacion;
    valida(q);
    expect(q.datos[c.id].filasPorPeriodo!['2026-10']).toEqual(nuevas);
    expect(q.datos[c.id].filasPorPeriodo!['2026-09']).toEqual(c.filasPorPeriodo!['2026-09']);
    expect(q.datos[c.id].origen).toEqual(ORIGEN);

    // Mes nuevo: se agrega copiando el último y luego se cargan encima los datos.
    const enNuevo = aplicarVarias(p, opsActualizarDesdeExcel(p, c.id, nuevas, { periodo: '2026-11', nuevo: true }, ORIGEN)).presentacion;
    valida(enNuevo);
    expect(enNuevo.datos[c.id].filasPorPeriodo!['2026-11']).toEqual(nuevas);
    expect(enNuevo.datos['benchmarking-creditos'].filasPorPeriodo!['2026-11']).toEqual(p.datos['benchmarking-creditos'].filasPorPeriodo!['2026-10']);

    // Igual en todos los meses: el mes no importa.
    const unico = opsActualizarDesdeExcel(p, 'tasas-referencia', [{ mes: 'Oct 26', repo: 9 }], null, { ...ORIGEN, periodo: null });
    expect(unico[0]).toEqual({ op: 'datos.filas', conjunto: 'tasas-referencia', periodo: null, valor: [{ mes: 'Oct 26', repo: 9 }] });
    expect(opsActualizarDesdeExcel(p, 'no-existe', [], null, ORIGEN)).toEqual([]);
  });
});
