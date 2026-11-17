import { beforeEach, describe, expect, it } from 'vitest';
import { almacenBd } from '@/lib/almacen/bd';
import { motorPglite, type Motor } from '@/lib/almacen/motor';
import type { Almacen } from '@/lib/almacen';
import { muestra } from './muestra';

const ID = 'comite-precios';
let motor: Motor;
let a: Almacen;

beforeEach(async () => {
  motor = await motorPglite();
  a = almacenBd(async () => motor, { muestra: muestra() });
});

async function titulo(): Promise<string> {
  return (await a.obtener(ID))!.presentacion.diapositivas[1].titulo;
}

describe('historial de versiones', () => {
  it('lista las copias automáticas y las guardadas a mano, la más reciente primero', async () => {
    const original = await titulo();
    await a.aplicar(ID, 1, [{ op: 'diapositiva.titulo', diapositiva: 'macro', valor: 'Uno' }]);
    const manual = await a.guardarVersion(ID, 'Antes del comité');
    expect(manual).toMatchObject({ motivo: 'manual', nota: 'Antes del comité', revision: 2 });
    expect(manual!.tamano).toBeGreaterThan(0);

    const lista = await a.listarVersiones(ID);
    expect(lista.map((v) => v.motivo)).toEqual(['manual', 'auto']);
    expect(lista[1].diapositivas).toBe(muestra().diapositivas.length);
    expect(lista[1].periodos).toEqual(muestra().periodos);

    // La automática guarda el estado anterior al cambio.
    const auto = await a.obtenerVersion(ID, lista[1].id);
    expect(auto!.presentacion.diapositivas[1].titulo).toBe(original);
    expect(auto!.presentacion.id).toBe(ID);
    expect((await a.obtenerVersion(ID, lista[0].id))!.presentacion.diapositivas[1].titulo).toBe('Uno');
  });

  it('restaura una copia y deja el estado de antes en el historial', async () => {
    const original = await titulo();
    await a.aplicar(ID, 1, [{ op: 'diapositiva.titulo', diapositiva: 'macro', valor: 'Cambiado' }]);
    const [auto] = await a.listarVersiones(ID);

    const resultado = await a.restaurar(ID, auto.id, 'Antes de volver a la copia');
    expect(resultado).toEqual({ ok: true, revision: 3 });
    expect(await titulo()).toBe(original);

    const lista = await a.listarVersiones(ID);
    expect(lista[0]).toMatchObject({ motivo: 'restauracion', nota: 'Antes de volver a la copia', revision: 2 });
    expect((await a.obtenerVersion(ID, lista[0].id))!.presentacion.diapositivas[1].titulo).toBe('Cambiado');

    // Y se puede deshacer la restauración volviendo a esa copia.
    await a.restaurar(ID, lista[0].id, 'otra');
    expect(await titulo()).toBe('Cambiado');
  });

  it('no mezcla copias de otras presentaciones ni restaura lo que no existe', async () => {
    await a.aplicar(ID, 1, [{ op: 'diapositiva.titulo', diapositiva: 'macro', valor: 'X' }]);
    const [v] = await a.listarVersiones(ID);
    const otra = { ...muestra(), id: 'otra' };
    await a.crear(otra);
    expect(await a.listarVersiones('otra')).toEqual([]);
    expect(await a.obtenerVersion('otra', v.id)).toBeNull();
    expect(await a.restaurar('otra', v.id, 'n')).toEqual({ ok: false, motivo: 'no-existe' });
    expect(await a.guardarVersion('no-existe', 'n')).toBeNull();
  });

  it('las copias a mano no se borran al pasar el tope de automáticas', async () => {
    const b = almacenBd(async () => motor, { muestra: muestra(), minutosEntreCopias: 0, topeCopias: 2 });
    await b.guardarVersion(ID, 'Fija');
    for (let i = 0; i < 4; i++) {
      const revision = (await b.revision(ID))!;
      await b.aplicar(ID, revision, [{ op: 'diapositiva.titulo', diapositiva: 'macro', valor: `T${i}` }]);
    }
    const lista = await b.listarVersiones(ID);
    expect(lista.filter((v) => v.motivo === 'auto')).toHaveLength(2);
    expect(lista.filter((v) => v.motivo === 'manual').map((v) => v.nota)).toEqual(['Fija']);
  });
});
