import { beforeEach, describe, expect, it } from 'vitest';
import { almacenBd, type OpcionesBd } from '@/lib/almacen/bd';
import { motorPglite, type Motor } from '@/lib/almacen/motor';
import type { Almacen } from '@/lib/almacen';
import type { Operacion } from '@/lib/edicion/operaciones';
import { muestra } from './muestra';

const ID = 'comite-precios';
const titulo = (valor: string, diapositiva = 'macro'): Operacion => ({ op: 'diapositiva.titulo', diapositiva, valor });

let motor: Motor;
function almacen(opciones: OpcionesBd = {}): Almacen {
  return almacenBd(async () => motor, { muestra: muestra(), ...opciones });
}
async function copias(): Promise<{ revision: number; motivo: string; titulo: string }[]> {
  return motor.consultar(
    `select revision, motivo, contenido->'diapositivas'->1->>'titulo' as titulo from versiones order by id`,
  );
}

beforeEach(async () => {
  motor = await motorPglite();
});

describe('almacén de base de datos', () => {
  it('crea las tablas, siembra la muestra una sola vez y la lista', async () => {
    const a = almacen();
    const lista = await a.listar();
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ id: ID, nombre: muestra().nombre, periodos: muestra().periodos, diapositivas: muestra().diapositivas.length });
    expect(lista[0].actualizado).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);

    // Otro arranque del servidor sobre la misma base no vuelve a sembrar.
    expect(await almacen().listar()).toHaveLength(1);
  });

  it('devuelve la presentación completa con su revisión', async () => {
    const a = almacen();
    const guardada = await a.obtener(ID);
    expect(guardada?.revision).toBe(1);
    expect({ ...guardada!.presentacion, actualizado: '' }).toEqual({ ...muestra(), actualizado: '' });
    expect(await a.obtener('no-existe')).toBeNull();
    expect(await a.revision(ID)).toBe(1);
    expect(await a.revision('no-existe')).toBeNull();
  });

  it('guarda las operaciones y sube la revisión', async () => {
    const a = almacen();
    const r = await a.aplicar(ID, 1, [titulo('Nuevo título'), { op: 'presentacion.nombre', valor: 'Otro nombre' }]);
    expect(r).toMatchObject({ ok: true, revision: 2, ajenos: false, omitidas: 0 });
    const guardada = await a.obtener(ID);
    expect(guardada?.revision).toBe(2);
    expect(guardada?.presentacion.nombre).toBe('Otro nombre');
    expect(guardada?.presentacion.diapositivas[1].titulo).toBe('Nuevo título');
    expect((await a.listar())[0].nombre).toBe('Otro nombre');
  });

  it('dos personas que tocan cosas distintas conservan ambos cambios', async () => {
    const a = almacen();
    // Las dos cargaron la revisión 1.
    await a.aplicar(ID, 1, [titulo('De Ana', 'macro')]);
    const r = await a.aplicar(ID, 1, [{ op: 'texto.contenido', bloque: 'macro-texto', periodo: '2026-10', valor: 'De Luis' }]);
    expect(r).toMatchObject({ ok: true, revision: 3, ajenos: true });
    const p = (await a.obtener(ID))!.presentacion;
    expect(p.diapositivas[1].titulo).toBe('De Ana');
    expect(JSON.stringify(p.diapositivas[1].bloques)).toContain('De Luis');
  });

  it('si alguien guarda justo en medio, reintenta sobre lo más reciente', async () => {
    let choques = 1;
    const a = almacen({
      antesDeGuardar: async () => {
        if (choques-- > 0) await almacen().aplicar(ID, 1, [titulo('Se coló', 'cierre')]);
      },
    });
    const r = await a.aplicar(ID, 1, [titulo('El mío')]);
    expect(r).toMatchObject({ ok: true, revision: 3, ajenos: true });
    const p = (await a.obtener(ID))!.presentacion;
    expect(p.diapositivas[1].titulo).toBe('El mío');
    expect(p.diapositivas.at(-1)?.titulo).toBe('Se coló');
  });

  it('si los choques no paran, responde "ocupado" sin perder nada', async () => {
    let n = 0;
    const a = almacen({ antesDeGuardar: async () => void (await almacen().aplicar(ID, 1, [titulo(`Otro ${++n}`, 'cierre')])) });
    expect(await a.aplicar(ID, 1, [titulo('El mío')])).toEqual({ ok: false, motivo: 'ocupado' });
    expect((await a.obtener(ID))!.presentacion.diapositivas[1].titulo).toBe(muestra().diapositivas[1].titulo);
  });

  it('salta las operaciones cuyo destino no existe y guarda el resto', async () => {
    const a = almacen();
    const r = await a.aplicar(ID, 1, [titulo('X', 'no-existe'), titulo('Sí')]);
    expect(r).toMatchObject({ ok: true, revision: 2, omitidas: 1 });
    const nada = await a.aplicar(ID, 2, [titulo('X', 'no-existe')]);
    expect(nada).toMatchObject({ ok: true, revision: 2, omitidas: 1 });
  });

  it('no guarda un cambio que deja la presentación inválida', async () => {
    const a = almacen();
    const r = await a.aplicar(ID, 1, [{ op: 'datos.filas', conjunto: 'benchmarking-vis', periodo: '2026-10', valor: [{ entidad: 'A', tpp: 'texto' }] }]);
    expect(r).toMatchObject({ ok: false, motivo: 'invalido' });
    expect(await a.revision(ID)).toBe(1);
    expect(await a.aplicar('no-existe', 1, [titulo('X')])).toEqual({ ok: false, motivo: 'no-existe' });
  });

  it('deja una copia del estado anterior al empezar cada tanda, no en cada guardado', async () => {
    const a = almacen();
    await a.aplicar(ID, 1, [titulo('Uno')]);
    await a.aplicar(ID, 2, [titulo('Dos')]);
    await a.aplicar(ID, 3, [titulo('Tres')]);
    expect(await copias()).toEqual([{ revision: 1, motivo: 'auto', titulo: muestra().diapositivas[1].titulo }]);

    // Pasan más de 10 minutos desde la última copia: la siguiente tanda deja otra.
    await motor.consultar(`update versiones set creado = now() - interval '11 minutes'`);
    await a.aplicar(ID, 4, [titulo('Cuatro')]);
    await a.aplicar(ID, 5, [titulo('Cinco')]);
    expect(await copias()).toMatchObject([{ revision: 1 }, { revision: 4, titulo: 'Tres' }]);
  });

  it('conserva solo las copias automáticas más recientes', async () => {
    const a = almacen({ minutosEntreCopias: 0, topeCopias: 3 });
    await motor.consultar(`select 1`);
    for (let i = 1; i <= 6; i++) {
      await a.aplicar(ID, i, [titulo(`Título ${i}`)]);
      // Con 0 minutos cada guardado deja copia; se separan para que el orden sea claro.
      await motor.consultar(`update versiones set creado = creado - interval '1 minute'`);
    }
    const quedan = await copias();
    expect(quedan.map((c) => c.revision)).toEqual([4, 5, 6]);
  });

  it('crea una presentación nueva y rechaza las repetidas o inválidas', async () => {
    const a = almacen();
    await a.crear({ ...muestra(), id: 'otra', nombre: 'Otra' });
    expect((await a.listar()).map((p) => p.id).sort()).toEqual([ID, 'otra']);
    await expect(a.crear({ ...muestra(), id: 'otra' })).rejects.toThrow(/Ya existe/);
    await expect(a.crear({ ...muestra(), id: 'mala', periodos: [] })).rejects.toThrow(/no es válida/);
  });

  it('una presentación eliminada no aparece ni se puede editar', async () => {
    const a = almacen();
    await a.listar();
    await motor.consultar(`update presentaciones set eliminado = now() where id = $1`, [ID]);
    expect(await a.listar()).toEqual([]);
    expect(await a.obtener(ID)).toBeNull();
    expect(await a.aplicar(ID, 1, [titulo('X')])).toEqual({ ok: false, motivo: 'no-existe' });
    // Tampoco se vuelve a sembrar la muestra.
    expect(await almacen().listar()).toEqual([]);
  });
});
