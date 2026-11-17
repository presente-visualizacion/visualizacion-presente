// Crear, duplicar, eliminar y recuperar presentaciones; rango del eje.

import { beforeEach, describe, expect, it } from 'vitest';
import { almacenBd } from '@/lib/almacen/bd';
import { motorPglite, type Motor } from '@/lib/almacen/motor';
import { aplicar } from '@/lib/edicion/operaciones';
import { copiaDePresentacion, idDesdeNombre, nombreLimpio, presentacionEnBlanco } from '@/lib/edicion/nueva';
import { configPara } from '@/lib/edicion/plantillas';
import { validarOperaciones, validarPresentacion } from '@/lib/edicion/validar';
import type { BloqueGrafico } from '@/lib/tipos';
import { muestra } from './muestra';

let motor: Motor;
beforeEach(async () => {
  motor = await motorPglite();
});
const almacen = () => almacenBd(async () => motor, { muestra: muestra() });

describe('presentaciones nuevas', () => {
  it('arma el id desde el nombre', () => {
    expect(idDesdeNombre('Comité de Precios — Diciembre 2026')).toBe('comite-de-precios-diciembre-2026');
    expect(idDesdeNombre('  ¿¡!? ')).toBe('presentacion');
    expect(idDesdeNombre('a'.repeat(100))).toHaveLength(60);
    expect(nombreLimpio('  Comité   nuevo ')).toBe('Comité nuevo');
    expect(nombreLimpio('')).toBeNull();
    expect(nombreLimpio('x'.repeat(121))).toBeNull();
  });

  it('en blanco: válida, con portada, contenido y cierre en un mes', () => {
    const p = presentacionEnBlanco({ nombre: 'Comité diciembre', periodo: '2026-11', tema: muestra().tema });
    expect(validarPresentacion(p).ok).toBe(true);
    expect(p.id).toBe('comite-diciembre');
    expect(p.periodos).toEqual(['2026-11']);
    expect(p.diapositivas.map((d) => d.tipo)).toEqual(['portada', 'contenido', 'cierre']);
    expect(p.diapositivas[0].titulo).toBe('Comité diciembre');
    expect(new Set(p.diapositivas.map((d) => d.id)).size).toBe(3);
  });

  it('copia: todo igual salvo id y nombre, y no comparte objetos con la original', () => {
    const original = muestra();
    const copia = copiaDePresentacion(original, 'Comité copia');
    expect(validarPresentacion(copia).ok).toBe(true);
    expect(copia.id).toBe('comite-copia');
    expect(copia.diapositivas).toEqual(original.diapositivas);
    expect(copia.datos).toEqual(original.datos);
    copia.diapositivas[0].titulo = 'otro';
    expect(original.diapositivas[0].titulo).not.toBe('otro');
  });
});

describe('papelera', () => {
  it('eliminar la saca de la lista sin borrarla; recuperar la devuelve', async () => {
    const a = almacen();
    const [primera] = await a.listar();
    expect(await a.eliminar(primera.id)).toBe(true);
    expect(await a.listar()).toHaveLength(0);
    expect(await a.obtener(primera.id)).toBeNull();
    const eliminadas = await a.listarEliminadas();
    expect(eliminadas.map((p) => p.id)).toEqual([primera.id]);
    expect(eliminadas[0].eliminado).toMatch(/^\d{4}-\d\d-\d\dT/);

    // Eliminada no se edita, y eliminarla otra vez no hace nada.
    expect((await a.aplicar(primera.id, 1, [{ op: 'diapositiva.titulo', diapositiva: 'macro', valor: 'x' }])).ok).toBe(false);
    expect(await a.eliminar(primera.id)).toBe(false);

    expect(await a.recuperar(primera.id)).toBe(true);
    expect((await a.listar()).map((p) => p.id)).toEqual([primera.id]);
    expect(await a.listarEliminadas()).toHaveLength(0);
    expect(await a.recuperar(primera.id)).toBe(false);
    expect((await a.obtener(primera.id))?.presentacion.diapositivas.length).toBe(muestra().diapositivas.length);
  });

  it('con todo en la papelera, un nuevo arranque no vuelve a sembrar la muestra', async () => {
    const a = almacen();
    const [primera] = await a.listar();
    await a.eliminar(primera.id);
    expect(await almacen().listar()).toHaveLength(0);
  });
});

describe('rango del eje', () => {
  const grafico = (): BloqueGrafico => {
    for (const d of muestra().diapositivas) for (const b of d.bloques) if (b.tipo === 'grafico' && b.forma === 'lineas') return b;
    throw new Error('La muestra no tiene un gráfico de líneas.');
  };

  it('se valida: números y desde < hasta', () => {
    const b = grafico();
    const { id: _i, tipo: _t, titulo: _ti, nota: _n, ...valor } = b;
    const op = (rangoEje: unknown) => validarOperaciones([{ op: 'grafico.config', bloque: b.id, valor: { ...valor, rangoEje } }]);
    expect(op({ desde: 3 }).ok).toBe(true);
    expect(op({ desde: 3, hasta: 20.5 }).ok).toBe(true);
    expect(op({ hasta: -2 }).ok).toBe(true);
    expect(op({ desde: 5, hasta: 5 }).ok).toBe(false);
    expect(op({ desde: 'tres' }).ok).toBe(false);
    expect(op({ desde: 1, otro: 2 }).ok).toBe(false);
  });

  it('se guarda con la configuración, se deshace y se conserva al cambiar de forma', () => {
    const p = muestra();
    const b = grafico();
    const { id: _i, tipo: _t, titulo: _ti, nota: _n, ...valor } = b;
    const con = aplicar(p, { op: 'grafico.config', bloque: b.id, valor: { ...valor, rangoEje: { desde: 3 } } });
    expect(validarPresentacion(con).ok).toBe(true);
    const guardado = con.diapositivas.flatMap((d) => d.bloques).find((x) => x.id === b.id) as BloqueGrafico;
    expect(guardado.rangoEje).toEqual({ desde: 3 });

    const conjunto = p.datos[b.datos];
    expect(configPara('barras', { ...valor, rangoEje: { desde: 3 } }, conjunto).rangoEje).toEqual({ desde: 3 });
    expect(configPara('circular', { ...valor, rangoEje: { desde: 3 } }, conjunto).rangoEje).toBeUndefined();
  });
});
