import { describe, expect, it } from 'vitest';
import { esRangoPegado, leerTablaPegada } from '@/lib/edicion/pegado';
import { mesParaCopiar } from '@/lib/periodos';

describe('leerTablaPegada', () => {
  it('separa filas y celdas de un rango de Excel', () => {
    expect(leerTablaPegada('Banco A\t14,5%\t1.234\r\nBanco B\t13,2%\t987\r\n')).toEqual([
      ['Banco A', '14,5%', '1.234'],
      ['Banco B', '13,2%', '987'],
    ]);
  });

  it('conserva las celdas vacías', () => {
    expect(leerTablaPegada('a\t\tc\n\tb\t')).toEqual([['a', '', 'c'], ['', 'b', '']]);
  });

  it('entiende celdas entre comillas, con saltos de línea y comillas dentro', () => {
    expect(leerTablaPegada('"Línea 1\nLínea 2"\t5\n"Dijo ""hola"""\t6')).toEqual([
      ['Línea 1\nLínea 2', '5'],
      ['Dijo "hola"', '6'],
    ]);
  });

  it('una comilla en medio de una celda es parte del texto', () => {
    expect(leerTablaPegada('15" de pantalla\t2')).toEqual([['15" de pantalla', '2']]);
  });

  it('distingue una celda suelta de un rango', () => {
    expect(esRangoPegado('14,5')).toBe(false);
    expect(esRangoPegado('14,5\r\n')).toBe(false);
    expect(esRangoPegado('14,5\t3')).toBe(true);
    expect(esRangoPegado('1\n2')).toBe(true);
  });
});

describe('mesParaCopiar', () => {
  const meses = ['2026-01', '2026-02', '2026-03', '2026-04'];
  it('prefiere el mes anterior más cercano con contenido', () => {
    expect(mesParaCopiar(meses, '2026-04', (m) => m !== '2026-03')).toBe('2026-02');
    expect(mesParaCopiar(meses, '2026-01', (m) => m === '2026-03' || m === '2026-04')).toBe('2026-03');
    expect(mesParaCopiar(meses, '2026-02', () => false)).toBeNull();
  });
});
