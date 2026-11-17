// Bloques y opciones de la etapa 4: título y nota, tarjetas, cifras que salen
// de los datos, tablas con secciones y columnas calculadas.

import { describe, expect, it } from 'vitest';
import { partesDeTexto } from '@/components/bloques/Bloques';
import { resolverCifra } from '@/lib/datos';
import { aplicar, aplicarVarias, bloqueDe, columnasUsadas, compactar, inversa, OperacionNoAplicable, type Operacion } from '@/lib/edicion/operaciones';
import { opsDuplicarDiapositiva } from '@/lib/edicion/plantillas';
import { validarOperaciones, validarPresentacion } from '@/lib/edicion/validar';
import { armarTabla } from '@/lib/tablas';
import type { Bloque, BloqueCifras, BloqueTabla, BloqueTarjetas, ConjuntoDatos, Presentacion } from '@/lib/tipos';
import { muestra } from './muestra';

function idaYVuelta(p: Presentacion, op: Operacion): Presentacion {
  const vuelta = inversa(p, op);
  const cambiada = aplicar(p, op);
  expect(vuelta.length).toBeGreaterThan(0);
  expect(vuelta.reduce(aplicar, cambiada)).toEqual(p);
  return cambiada;
}

const CONJUNTO: ConjuntoDatos = {
  id: 'c-prueba',
  nombre: 'Prueba',
  columnas: [
    { clave: 'grupo', nombre: 'Grupo', tipo: 'texto' },
    { clave: 'entidad', nombre: 'Entidad', tipo: 'texto' },
    { clave: 'tasa', nombre: 'Tasa', tipo: 'porcentaje', grupo: 'Plazo 90' },
    { clave: 'monto', nombre: 'Monto', tipo: 'moneda', unidad: 'millones' },
  ],
  porPeriodo: true,
  filasPorPeriodo: {
    '2026-09': [
      { grupo: 'A', entidad: 'Uno', tasa: 10, monto: 5 },
      { grupo: 'A', entidad: 'Dos', tasa: 12, monto: 3 },
    ],
    '2026-10': [
      { grupo: 'A', entidad: 'Uno', tasa: 10.5, monto: 6 },
      { grupo: 'A', entidad: 'dos ', tasa: 11, monto: 4 },
      { grupo: 'B', entidad: 'Tres', tasa: 9, monto: null },
    ],
  },
};

/** La muestra con un conjunto de prueba, una tabla, cifras y tarjetas en una diapositiva nueva. */
function conPiezas(): Presentacion {
  const p = muestra();
  const bloques: Bloque[] = [
    {
      id: 'b-tabla', tipo: 'tabla', datos: 'c-prueba', secciones: 'grupo', titulo: 'Tabla de prueba',
      calculadas: [{ tipo: 'variacion', columna: 'tasa' }, { tipo: 'posicion', columna: 'tasa', orden: 'desc' }],
    },
    {
      id: 'b-cifras', tipo: 'cifras', cifras: {
        porPeriodo: false,
        valor: [
          { etiqueta: 'Monto', valor: '—', desde: { conjunto: 'c-prueba', columna: 'monto', fila: { columna: 'entidad', valor: 'Uno' } } },
          { etiqueta: 'Tasa', valor: '—', detalle: 'contra Dos', desde: { conjunto: 'c-prueba', columna: 'tasa', fila: 'primera', comparar: { columna: 'entidad', valor: 'DOS' } } },
          { etiqueta: 'Último', valor: '—', desde: { conjunto: 'c-prueba', columna: 'tasa', fila: 'ultima', detalle: 'entidad' } },
        ],
      },
    },
    { id: 'b-tarjetas', tipo: 'tarjetas', tarjetas: { porPeriodo: true, valores: { '2026-10': [{ titulo: 'Una', texto: 'Texto' }] } } },
  ];
  const r = aplicarVarias(p, [
    { op: 'conjunto.poner', conjunto: CONJUNTO },
    { op: 'diapositiva.poner', diapositiva: { id: 'd-prueba', tipo: 'contenido', titulo: 'Prueba', disposicion: 'cuadricula', bloques }, despues: null },
  ]);
  expect(r.omitidas).toBe(0);
  return r.presentacion;
}

describe('presentación con las piezas nuevas', () => {
  it('es válida', () => {
    const v = validarPresentacion(conPiezas());
    expect(v.ok ? [] : v.errores).toEqual([]);
  });

  it('revisa las columnas de las cifras y de las tablas', () => {
    const p = conPiezas();
    const cifras = bloqueDe(p, 'b-cifras') as BloqueCifras;
    cifras.cifras.valor![0].desde!.columna = 'no-existe';
    const tabla = bloqueDe(p, 'b-tabla') as BloqueTabla;
    tabla.secciones = 'tasa';
    const v = validarPresentacion(p);
    expect(v.ok).toBe(false);
    if (!v.ok) {
      expect(v.errores.join(' ')).toMatch(/usa la columna "no-existe"/);
      expect(v.errores.join(' ')).toMatch(/secciones deben salir de una columna de texto/);
    }
  });
});

describe('operaciones nuevas', () => {
  it('bloque.marco pone y quita título y nota, y se deshace', () => {
    const p = conPiezas();
    const q = idaYVuelta(p, { op: 'bloque.marco', bloque: 'b-tarjetas', titulo: 'Propuestas', nota: 'Fuente: prueba' });
    expect(bloqueDe(q, 'b-tarjetas')).toMatchObject({ titulo: 'Propuestas', nota: 'Fuente: prueba' });
    const r = idaYVuelta(q, { op: 'bloque.marco', bloque: 'b-tarjetas', titulo: '', nota: '' });
    expect(bloqueDe(r, 'b-tarjetas')).not.toHaveProperty('titulo');
    expect(bloqueDe(r, 'b-tarjetas')).not.toHaveProperty('nota');
  });

  it('tabla.config conserva el título del bloque', () => {
    const p = conPiezas();
    const q = aplicar(p, { op: 'tabla.config', bloque: 'b-tabla', valor: { datos: 'c-prueba' } });
    expect(bloqueDe(q, 'b-tabla')).toEqual({ id: 'b-tabla', tipo: 'tabla', datos: 'c-prueba', titulo: 'Tabla de prueba' });
    // La inversa no lleva el título (el esquema de la configuración no lo admite).
    const vuelta = inversa(p, { op: 'tabla.config', bloque: 'b-tabla', valor: { datos: 'c-prueba' } });
    expect(validarOperaciones(vuelta).ok).toBe(true);
  });

  it('tarjetas.valor, porPeriodo y "Nuevo mes" con tarjetas', () => {
    const p = conPiezas();
    const q = idaYVuelta(p, { op: 'tarjetas.valor', bloque: 'b-tarjetas', periodo: '2026-09', valor: [{ titulo: 'Sep', texto: '' }] });
    expect((bloqueDe(q, 'b-tarjetas') as BloqueTarjetas).tarjetas.valores?.['2026-09']).toEqual([{ titulo: 'Sep', texto: '' }]);
    const unico = idaYVuelta(q, { op: 'porPeriodo', destino: { bloque: 'b-tarjetas' }, valor: false, periodo: '2026-10' });
    expect((bloqueDe(unico, 'b-tarjetas') as BloqueTarjetas).tarjetas).toEqual({ porPeriodo: false, valor: [{ titulo: 'Una', texto: 'Texto' }] });
    const nuevo = aplicar(p, { op: 'periodo.agregar', periodo: '2026-11', copiarDe: '2026-10' });
    expect((bloqueDe(nuevo, 'b-tarjetas') as BloqueTarjetas).tarjetas.valores?.['2026-11']).toEqual([{ titulo: 'Una', texto: 'Texto' }]);
    expect(() => aplicar(p, { op: 'tarjetas.valor', bloque: 'b-cifras', periodo: null, valor: [] })).toThrow(OperacionNoAplicable);
  });

  it('datos.columna cambia grupo y signo y se deshace', () => {
    const p = conPiezas();
    const q = idaYVuelta(p, { op: 'datos.columna', conjunto: 'c-prueba', clave: 'monto', grupo: 'Saldos', signo: true });
    expect(q.datos['c-prueba'].columnas[3]).toMatchObject({ grupo: 'Saldos', signo: true });
    const r = aplicar(q, { op: 'datos.columna', conjunto: 'c-prueba', clave: 'monto', grupo: '', signo: false });
    expect(r.datos['c-prueba'].columnas[3]).not.toHaveProperty('grupo');
    expect(r.datos['c-prueba'].columnas[3]).not.toHaveProperty('signo');
  });

  it('compacta bloque.marco y tarjetas.valor seguidos', () => {
    const ops: Operacion[] = [
      { op: 'bloque.marco', bloque: 'b', titulo: 'P', nota: '' },
      { op: 'bloque.marco', bloque: 'b', titulo: 'Pr', nota: '' },
      { op: 'tarjetas.valor', bloque: 'b', periodo: null, valor: [] },
      { op: 'tarjetas.valor', bloque: 'b', periodo: null, valor: [{ titulo: 'x', texto: '' }] },
    ];
    expect(compactar(ops)).toEqual([ops[1], ops[3]]);
  });

  it('las columnas de cifras, secciones y calculadas cuentan como usadas', () => {
    const p = conPiezas();
    const usadas = columnasUsadas(p, 'c-prueba');
    expect([...usadas.keys()].sort()).toEqual(['entidad', 'grupo', 'monto', 'tasa']);
    expect(() => aplicar(p, { op: 'datos.columnas', conjunto: 'c-prueba', valor: CONJUNTO.columnas.filter((c) => c.clave !== 'monto') })).toThrow(OperacionNoAplicable);
    // Sin la tabla, las cifras todavía usan el conjunto: no se puede quitar.
    const sinTabla = aplicar(p, { op: 'bloque.quitar', bloque: 'b-tabla' });
    expect(() => aplicar(sinTabla, { op: 'conjunto.quitar', conjunto: 'c-prueba' })).toThrow(OperacionNoAplicable);
  });

  it('al duplicar una diapositiva las cifras apuntan a la copia de los datos', () => {
    const p = conPiezas();
    const r = opsDuplicarDiapositiva(p, 'd-prueba')!;
    const q = aplicarVarias(p, r.ops).presentacion;
    const copia = q.diapositivas.find((d) => d.id === r.id)!;
    const tabla = copia.bloques[0] as BloqueTabla;
    const cifras = copia.bloques[1] as BloqueCifras;
    expect(tabla.datos).not.toBe('c-prueba');
    expect(cifras.cifras.valor!.every((c) => c.desde?.conjunto === tabla.datos)).toBe(true);
    expect(validarPresentacion(q).ok).toBe(true);
  });
});

describe('tablas armadas', () => {
  it('secciones, variación contra el mes anterior y posición', () => {
    const p = conPiezas();
    const t = armarTabla(p, bloqueDe(p, 'b-tabla') as BloqueTabla, p.datos['c-prueba'], '2026-10')!;
    expect(t.columnas.map((c) => c.clave)).toEqual(['entidad', 'tasa', 'variacion:tasa', 'posicion:tasa', 'monto']);
    expect(t.columnas[2].columna).toMatchObject({ nombre: 'Var.', tipo: 'porcentaje', signo: true, grupo: 'Plazo 90' });
    expect(t.grupos).toEqual([{ nombre: null, columnas: 1 }, { nombre: 'Plazo 90', columnas: 3 }, { nombre: null, columnas: 1 }]);
    const filas = t.filas.map((f) => (f.tipo === 'seccion' ? `§${f.titulo}` : `${f.fila.entidad}|${f.fila['variacion:tasa']}|${f.fila['posicion:tasa']}`));
    // "dos " se reconoce como "Dos" del mes anterior; la sección B empieza su propia posición.
    expect(filas).toEqual(['§A', 'Uno|0.5|2', 'dos |-1|1', '§B', 'Tres|null|1']);
  });

  it('el primer mes con datos no tiene variación', () => {
    const p = conPiezas();
    const t = armarTabla(p, bloqueDe(p, 'b-tabla') as BloqueTabla, p.datos['c-prueba'], '2026-09')!;
    expect(t.mesAnterior).toBeNull();
    expect(t.filas.flatMap((f) => (f.tipo === 'datos' ? [f.fila['variacion:tasa']] : []))).toEqual([null, null]);
  });
});

describe('cifras que salen de los datos', () => {
  it('fila por valor, diferencia en puntos y detalle de otra columna', () => {
    const p = conPiezas();
    const [monto, tasa, ultimo] = (bloqueDe(p, 'b-cifras') as BloqueCifras).cifras.valor!;
    expect(resolverCifra(p, monto, '2026-10')).toEqual({ valor: '$6', unidad: 'millones' });
    expect(resolverCifra(p, tasa, '2026-10')).toEqual({ valor: '10,50%', detalle: '−0,50 pp contra Dos' });
    expect(resolverCifra(p, ultimo, '2026-10')).toEqual({ valor: '9,00%', detalle: 'Tres' });
    expect(resolverCifra(p, ultimo, '2026-08')).toEqual({ valor: '—', sinDato: true });
  });

  it('una cifra escrita queda como está', () => {
    const p = conPiezas();
    expect(resolverCifra(p, { etiqueta: 'x', valor: '12', detalle: 'd' }, '2026-10')).toEqual({ valor: '12', detalle: 'd' });
  });
});

describe('texto', () => {
  it('reconoce párrafos, viñetas y líneas grandes', () => {
    expect(partesDeTexto('# 1% → 3%\nSubtítulo\n\n- uno\n- dos\nFinal')).toEqual([
      { tipo: 'grande', lineas: ['1% → 3%'] },
      { tipo: 'parrafo', lineas: ['Subtítulo'] },
      { tipo: 'lista', lineas: ['uno', 'dos'] },
      { tipo: 'parrafo', lineas: ['Final'] },
    ]);
  });
});
