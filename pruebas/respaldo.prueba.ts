import { describe, expect, it } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { escribirLibro, letraColumna, nombreDeHoja } from '@/lib/excel/escribir';
import { leerArchivo } from '@/lib/excel/leer';
import { hojasDeRespaldo } from '@/lib/respaldo';
import { nombrePeriodo } from '@/lib/periodos';
import { muestra } from './muestra';

describe('escritor de Excel', () => {
  it('nombra las columnas como Excel', () => {
    expect([0, 25, 26, 27, 701, 702].map(letraColumna)).toEqual(['A', 'Z', 'AA', 'AB', 'ZZ', 'AAA']);
  });

  it('limpia y no repite los nombres de hoja', () => {
    const usados = new Set<string>();
    expect(nombreDeHoja('Tasas [EA]: 2026/10', usados)).toBe('Tasas EA 2026 10');
    expect(nombreDeHoja('tasas ea 2026 10', usados)).toBe('tasas ea 2026 10 (2)');
    const largo = nombreDeHoja('x'.repeat(40), usados);
    expect(largo).toHaveLength(31);
    expect(nombreDeHoja('x'.repeat(40), usados)).toMatch(/^x+ \(2\)$/);
    expect(nombreDeHoja("'''", usados)).toBe('Hoja');
  });

  it('escribe un libro que el lector de la herramienta entiende', () => {
    const bytes = escribirLibro([
      {
        nombre: 'Datos',
        encabezado: true,
        filas: [
          ['Entidad', 'Tasa', 'Saldo'],
          ['Fondo <Ejemplo> & "Cía"', { valor: 14.5, formato: { tipo: 'porcentaje', decimales: 2 } }, { valor: 2940000.5, formato: { tipo: 'moneda', decimales: 1 } }],
          ['Otra', null, 12],
        ],
      },
      { nombre: 'Vacía', filas: [] },
    ]);
    const libro = leerArchivo('prueba.xlsx', bytes);
    expect(libro.hojas.map((h) => h.nombre)).toEqual(['Datos', 'Vacía']);
    const [encabezado, primera, segunda] = libro.hojas[0].celdas;
    expect(encabezado).toEqual([{ t: 's', v: 'Entidad' }, { t: 's', v: 'Tasa' }, { t: 's', v: 'Saldo' }]);
    expect(primera[0]).toEqual({ t: 's', v: 'Fondo <Ejemplo> & "Cía"' });
    expect(primera[1]).toMatchObject({ t: 'n', v: 0.145, formato: { porcentaje: true, decimales: 2 } });
    expect(primera[2]).toMatchObject({ t: 'n', v: 2940000.5 });
    expect(segunda[1]).toBeNull();
    expect(segunda[2]).toMatchObject({ t: 'n', v: 12 });

    // Encabezado fijo al bajar.
    const xml = strFromU8(unzipSync(bytes)['xl/worksheets/sheet1.xml']);
    expect(xml).toContain('state="frozen"');
  });
});

describe('respaldo de la presentación', () => {
  it('trae una hoja por conjunto, con todos los meses, más Contenido y Textos', () => {
    const p = muestra();
    const hojas = hojasDeRespaldo(p, new Date('2026-11-17T15:00:00Z'));
    expect(hojas[0].nombre).toBe('Contenido');
    expect(hojas[hojas.length - 1].nombre).toBe('Textos');
    expect(hojas).toHaveLength(Object.keys(p.datos).length + 2);

    // Un conjunto por mes: una fila por cada fila de cada mes, con su mes.
    const [id, conjunto] = Object.entries(p.datos).find(([, c]) => c.porPeriodo)!;
    const hoja = hojas[1 + Object.keys(p.datos).indexOf(id)];
    const esperadas = Object.values(conjunto.filasPorPeriodo ?? {}).reduce((n, filas) => n + filas.length, 0);
    expect(hoja.filas).toHaveLength(esperadas + 1);
    expect(hoja.filas[0][0]).toBe('Mes');
    const mesesEnHoja = new Set(hoja.filas.slice(1).map((f) => f[0]));
    for (const mes of Object.keys(conjunto.filasPorPeriodo ?? {})) expect(mesesEnHoja.has(nombrePeriodo(mes))).toBe(true);

    // Contenido nombra cada diapositiva.
    const titulos = hojas[0].filas.map((f) => f[2]);
    for (const d of p.diapositivas) expect(titulos).toContain(d.titulo);

    // El libro completo se puede escribir y leer.
    const libro = leerArchivo('respaldo.xlsx', escribirLibro(hojas));
    expect(libro.hojas).toHaveLength(hojas.length);
  });

  it('guarda los porcentajes para que al volver a cargarlos den lo mismo', () => {
    const p = muestra();
    const entrada = Object.entries(p.datos).find(([, c]) => c.columnas.some((col) => col.tipo === 'porcentaje') && (c.filas?.length || Object.keys(c.filasPorPeriodo ?? {}).length));
    expect(entrada).toBeTruthy();
    const [id, conjunto] = entrada!;
    const hojas = hojasDeRespaldo(p);
    const indice = 1 + Object.keys(p.datos).indexOf(id);
    const libro = leerArchivo('r.xlsx', escribirLibro(hojas));
    const columna = conjunto.columnas.findIndex((c) => c.tipo === 'porcentaje') + (conjunto.porPeriodo ? 1 : 0);
    const primeraFila = conjunto.porPeriodo ? conjunto.filasPorPeriodo![p.periodos.find((m) => conjunto.filasPorPeriodo![m]?.length)!][0] : conjunto.filas![0];
    const clave = conjunto.columnas.find((c) => c.tipo === 'porcentaje')!.clave;
    const original = primeraFila[clave];
    const celda = libro.hojas[indice].celdas[1][columna];
    if (typeof original === 'number') {
      expect(celda).toMatchObject({ t: 'n', formato: { porcentaje: true } });
      expect(Math.round((celda as { v: number }).v * 1e8) / 1e6).toBe(original);
    }
  });
});
