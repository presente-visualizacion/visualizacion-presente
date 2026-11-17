import { describe, expect, it } from 'vitest';
import { interpretarNumero, numeroEditable } from '@/lib/formato';

describe('interpretarNumero', () => {
  it.each([
    ['1.234,56', 1234.56],
    ['1,234.56', 1234.56],
    ['14,5%', 14.5],
    ['14,50 %', 14.5],
    ['$ 348.893', 348893],
    ['$1.234.567', 1234567],
    ['1,234,567', 1234567],
    ['1.234', 1234],
    ['12.345', 12345],
    ['0.5', 0.5],
    ['1234.567', 1234.567],
    ['0,5', 0.5],
    ['3274', 3274],
    ['-2,5', -2.5],
    ['−2,5', -2.5],
    ['(1.200)', -1200],
    ['+7', 7],
    [' 1 234,5 ', 1234.5],
    ['5,', 5],
  ])('%s → %s', (texto, esperado) => {
    expect(interpretarNumero(texto)).toBe(esperado);
  });

  it.each(['', '   ', '-', '—', '%'])('"%s" es vacío', (texto) => {
    expect(interpretarNumero(texto)).toBeNull();
  });

  it.each(['abc', '1.2.3', '1,2,3', '12a', '1.234,5,6', '1e5', '..', ','])('"%s" no se entiende', (texto) => {
    expect(interpretarNumero(texto)).toBeNaN();
  });

  it('lo que se muestra para editar se vuelve a leer igual', () => {
    for (const n of [0, 14.5, -3.25, 348893, 0.001]) expect(interpretarNumero(numeroEditable(n))).toBe(n);
  });
});
