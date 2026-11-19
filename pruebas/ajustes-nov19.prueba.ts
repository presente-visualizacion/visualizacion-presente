import { describe, expect, it } from 'vitest';
import { presentacionLeyRescate } from '@/lib/edicion/nueva';
import { aplicar, configGraficoDe, inversa, type Operacion } from '@/lib/edicion/operaciones';
import { validarOperaciones, validarPresentacion } from '@/lib/edicion/validar';
import type { BloqueGrafico, Presentacion } from '@/lib/tipos';
import { muestra } from './muestra';

function graficoLibre(p: Presentacion): BloqueGrafico {
  for (const d of p.diapositivas) for (const b of d.bloques) if (b.tipo === 'grafico' && b.ubicacion) return b;
  throw new Error('sin gráfico en disposición libre');
}

describe('rango del eje en un gráfico con lugar, colores y fondo', () => {
  const p0 = presentacionLeyRescate({ nombre: 'Ley', periodo: '2026-11', tema: muestra().tema, ahora: '2026-11-19T12:00:00.000Z' });

  it('la configuración no lleva el marco y se guarda', () => {
    const g = graficoLibre(p0);
    const op: Operacion = { op: 'grafico.config', bloque: g.id, valor: { ...configGraficoDe(g), rangoEje: { desde: 3 } } };
    expect(validarOperaciones([op]).ok).toBe(true);
    const p1 = aplicar(p0, op);
    const g1 = graficoLibre(p1);
    expect(g1.rangoEje).toEqual({ desde: 3 });
    expect(g1.ubicacion).toEqual(g.ubicacion);
    // Deshacer también se puede guardar.
    expect(validarOperaciones(inversa(p0, op)).ok).toBe(true);
    expect(validarPresentacion(p1).ok).toBe(true);
  });

  it('si llega el marco (pestaña con la versión anterior) se ignora en vez de descartar el cambio', () => {
    const g = graficoLibre(p0);
    const { id: _id, tipo: _tipo, ...todo } = g;
    const valor = { ...todo, ubicacion: { columna: 1, ancho: 4, fila: 1, alto: 4 }, colorFondo: '#000000', rangoEje: { hasta: 20 } };
    const v = validarOperaciones([{ op: 'grafico.config', bloque: g.id, valor }]);
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const p1 = aplicar(p0, v.valor[0]);
    const g1 = graficoLibre(p1);
    expect(g1.rangoEje).toEqual({ hasta: 20 });
    expect(g1.ubicacion).toEqual(g.ubicacion);
    expect(g1.colorFondo).toBe(g.colorFondo);
  });
});
