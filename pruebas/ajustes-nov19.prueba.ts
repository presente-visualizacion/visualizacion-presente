import { describe, expect, it } from 'vitest';
import { presentacionLeyRescate } from '@/lib/edicion/nueva';
import { aplicar, configGraficoDe, inversa, type Operacion } from '@/lib/edicion/operaciones';
import { opsInsertarBloque } from '@/lib/edicion/plantillas';
import { opsVaciarBloque, opsVaciarMes } from '@/lib/edicion/vaciar';
import { validarOperaciones, validarPresentacion } from '@/lib/edicion/validar';
import { vacioEnMes } from '@/components/bloques/Bloques';
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

describe('tamaño de letra', () => {
  it('bloque, título y presentación se guardan, validan y deshacen', () => {
    const p0 = muestra();
    const b = p0.diapositivas[1].bloques[0];
    const d = p0.diapositivas[1];
    const ops: Operacion[] = [
      { op: 'bloque.tamano', bloque: b.id, valor: 80 },
      { op: 'diapositiva.tamano', diapositiva: d.id, valor: 120 },
      { op: 'tema', valor: { ...p0.tema, letra: 110 } },
    ];
    expect(validarOperaciones(ops).ok).toBe(true);
    let p = p0;
    const deshacer: Operacion[] = [];
    for (const op of ops) { deshacer.unshift(...inversa(p, op)); p = aplicar(p, op); }
    expect(p.diapositivas[1].bloques[0].letra).toBe(80);
    expect(p.diapositivas[1].letra).toBe(120);
    expect(p.tema.letra).toBe(110);
    expect(validarPresentacion(p).ok).toBe(true);
    const vuelta = deshacer.reduce(aplicar, p);
    expect(vuelta.diapositivas[1].bloques[0].letra).toBeUndefined();
    expect(vuelta.diapositivas[1].letra).toBeUndefined();
    // 100 % es lo de siempre: no queda guardado.
    expect(aplicar(p, { op: 'bloque.tamano', bloque: b.id, valor: 100 }).diapositivas[1].bloques[0].letra).toBeUndefined();
    expect(validarOperaciones([{ op: 'bloque.tamano', bloque: b.id, valor: 20 }]).ok).toBe(false);
  });

  it('cambiar la configuración de un gráfico conserva su tamaño de letra', () => {
    const p0 = presentacionLeyRescate({ nombre: 'Ley', periodo: '2026-11', tema: muestra().tema, ahora: '2026-11-19T12:00:00.000Z' });
    const g = graficoLibre(p0);
    const p1 = aplicar(p0, { op: 'bloque.tamano', bloque: g.id, valor: 150 });
    const g1 = graficoLibre(p1);
    const p2 = aplicar(p1, { op: 'grafico.config', bloque: g.id, valor: { ...configGraficoDe(g1), etiquetas: true } });
    expect(graficoLibre(p2).letra).toBe(150);
  });
});

describe('lo nuevo nace propio del mes', () => {
  it('texto, cifras, tarjetas y datos nuevos solo tienen el mes en que se crean', () => {
    const p0 = muestra();
    const mes = p0.periodos[p0.periodos.length - 1];
    const d = p0.diapositivas.find((x) => x.tipo === 'contenido')!;
    for (const tipo of ['texto', 'cifras', 'tarjetas', 'grafico'] as const) {
      const r = opsInsertarBloque(p0, d.id, tipo, mes)!;
      const p1 = r.ops.reduce(aplicar, p0);
      expect(validarPresentacion(p1).ok).toBe(true);
      const b = p1.diapositivas.flatMap((x) => x.bloques).find((x) => x.id === r.bloque.id)!;
      expect(vacioEnMes(b, p1, mes)).toBe(false);
      expect(vacioEnMes(b, p1, p0.periodos[0])).toBe(true);
      // "Nuevo mes" lo copia al siguiente.
      const p2 = aplicar(p1, { op: 'periodo.agregar', periodo: '2099-01', copiarDe: mes });
      expect(vacioEnMes(b.tipo === 'grafico' ? b : p2.diapositivas.flatMap((x) => x.bloques).find((x) => x.id === b.id)!, p2, '2099-01')).toBe(false);
    }
  });

  it('al pasarlo a igual en todos los meses queda el de ese mes en todos', () => {
    const p0 = muestra();
    const mes = p0.periodos[p0.periodos.length - 1];
    const d = p0.diapositivas.find((x) => x.tipo === 'contenido')!;
    const r = opsInsertarBloque(p0, d.id, 'texto', mes)!;
    let p = r.ops.reduce(aplicar, p0);
    p = aplicar(p, { op: 'texto.contenido', bloque: r.bloque.id, periodo: mes, valor: '{azul:Hola} **mundo**' });
    p = aplicar(p, { op: 'porPeriodo', destino: { bloque: r.bloque.id }, valor: false, periodo: mes });
    const b = p.diapositivas.flatMap((x) => x.bloques).find((x) => x.id === r.bloque.id)!;
    for (const m of p.periodos) expect(vacioEnMes(b, p, m)).toBe(false);
    expect(b.tipo === 'texto' && b.contenido.valor).toBe('{azul:Hola} **mundo**');
  });
});

describe('dejar en blanco', () => {
  it('vacía los números y deja filas, nombres y etiquetas', () => {
    const p0 = muestra();
    const mes = p0.periodos[p0.periodos.length - 1];
    const ops = opsVaciarMes(p0, mes);
    expect(ops.length).toBeGreaterThan(0);
    expect(validarOperaciones(ops.slice(0, 150)).ok).toBe(true);
    const p1 = ops.reduce(aplicar, p0);
    expect(validarPresentacion(p1).ok).toBe(true);
    for (const c of Object.values(p1.datos)) {
      if (!c.porPeriodo) { expect(c).toEqual(p0.datos[c.id]); continue; }
      const antes = p0.datos[c.id].filasPorPeriodo?.[mes];
      const ahora = c.filasPorPeriodo?.[mes];
      expect(ahora?.length).toBe(antes?.length);
      for (const [i, f] of (ahora ?? []).entries()) {
        for (const col of c.columnas) {
          if (col.tipo === 'texto') expect(f[col.clave]).toEqual(antes![i][col.clave]);
          else expect(f[col.clave]).toBeNull();
        }
      }
      // Los demás meses no cambian.
      const otro = p0.periodos[0];
      if (otro !== mes) expect(c.filasPorPeriodo?.[otro]).toEqual(p0.datos[c.id].filasPorPeriodo?.[otro]);
    }
  });

  it('un texto propio del mes queda vacío solo en ese mes', () => {
    const p0 = muestra();
    const mes = p0.periodos[p0.periodos.length - 1];
    const d = p0.diapositivas.find((x) => x.tipo === 'contenido')!;
    const r = opsInsertarBloque(p0, d.id, 'cifras', mes)!;
    const p1 = r.ops.reduce(aplicar, p0);
    const b = p1.diapositivas.flatMap((x) => x.bloques).find((x) => x.id === r.bloque.id)!;
    const p2 = opsVaciarBloque(p1, b, mes).reduce(aplicar, p1);
    const b2 = p2.diapositivas.flatMap((x) => x.bloques).find((x) => x.id === r.bloque.id)!;
    expect(b2.tipo === 'cifras' && b2.cifras.valores?.[mes]).toEqual([{ etiqueta: 'Indicador', valor: '' }]);
  });
});
