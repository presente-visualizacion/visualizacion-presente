// Copiar una diapositiva y pegarla en otra presentación (o en la misma). La
// copia lleva la diapositiva y todos los datos que usa; al pegar se les dan
// ids nuevos y los meses se ajustan a los de la presentación de destino. Sin
// React: el navegador la guarda en localStorage (ver usarPortapapeles). Ver
// "Copiar y pegar diapositivas" en PLAN.md.

import type { Bloque, Cifra, ConjuntoDatos, Diapositiva, IdPeriodo, PorPeriodo, Presentacion } from '../tipos';
import type { Operacion } from './operaciones';
import { idsEnUso, nuevoId } from './plantillas';
import { TOPES } from './validar';

export const CLAVE_PORTAPAPELES = 'vp-portapapeles-diapositiva';

export interface CopiaDiapositiva {
  version: 1;
  origen: { presentacion: string; nombre: string };
  /** Mes que se estaba viendo al copiar: es el que se pega si el destino no tiene los mismos meses. */
  periodo: IdPeriodo;
  diapositiva: Diapositiva;
  /** Los conjuntos que usan sus gráficos, tablas y cifras. */
  conjuntos: ConjuntoDatos[];
  copiado: string;
}

/** Ids de los conjuntos que usa la diapositiva (gráficos, tablas y cifras que salen de datos). */
function conjuntosDe(d: Diapositiva): Set<string> {
  const ids = new Set<string>();
  const deCifras = (cifras: Cifra[] | undefined) => cifras?.forEach((c) => c.desde && ids.add(c.desde.conjunto));
  for (const b of d.bloques) {
    if (b.tipo === 'grafico' || b.tipo === 'tabla') ids.add(b.datos);
    if (b.tipo === 'cifras') {
      deCifras(b.cifras.valor);
      Object.values(b.cifras.valores ?? {}).forEach(deCifras);
    }
  }
  return ids;
}

export function copiarDiapositiva(p: Presentacion, diapositiva: string, periodo: IdPeriodo, ahora = new Date().toISOString()): CopiaDiapositiva | null {
  const d = p.diapositivas.find((x) => x.id === diapositiva);
  if (!d) return null;
  const conjuntos = [...conjuntosDe(d)].filter((id) => Object.hasOwn(p.datos, id)).map((id) => structuredClone(p.datos[id]));
  return {
    version: 1,
    origen: { presentacion: p.id, nombre: p.nombre },
    periodo,
    diapositiva: structuredClone(d),
    conjuntos,
    copiado: ahora,
  };
}

/** Lee lo guardado; null si no es una copia de diapositiva. El servidor vuelve a validar al pegar. */
export function leerCopia(dato: unknown): CopiaDiapositiva | null {
  if (!dato || typeof dato !== 'object') return null;
  const c = dato as Partial<CopiaDiapositiva>;
  if (c.version !== 1 || typeof c.periodo !== 'string' || !c.diapositiva || !Array.isArray(c.diapositiva.bloques)) return null;
  if (!Array.isArray(c.conjuntos) || !c.origen || typeof c.origen.nombre !== 'string') return null;
  return c as CopiaDiapositiva;
}

/**
 * Lo que vale por mes, llevado a los meses del destino: se quedan los meses
 * que existen en ambas; si el mes que se ve en el destino no estaba, recibe
 * el que se veía al copiar.
 */
function aMeses<T>(valores: Record<IdPeriodo, T> | undefined, periodos: IdPeriodo[], mesCopia: IdPeriodo, mesDestino: IdPeriodo): { valores: Record<IdPeriodo, T>; ajustado: boolean } {
  const fuente = valores ?? {};
  const salida: Record<IdPeriodo, T> = {};
  for (const m of periodos) if (Object.hasOwn(fuente, m)) salida[m] = structuredClone(fuente[m]);
  if (!Object.hasOwn(salida, mesDestino) && Object.hasOwn(fuente, mesCopia)) salida[mesDestino] = structuredClone(fuente[mesCopia]);
  const perdidos = Object.keys(fuente).some((m) => !periodos.includes(m));
  const prestado = !Object.hasOwn(fuente, mesDestino) && Object.hasOwn(fuente, mesCopia);
  return { valores: salida, ajustado: perdidos || prestado };
}

/**
 * Operaciones para pegar la copia después de `despues` (null = al principio),
 * en un solo paso de deshacer. `avisos` explica lo que hubo que ajustar.
 */
export function opsPegarDiapositiva(
  p: Presentacion, copia: CopiaDiapositiva, despues: string | null, mesDestino: IdPeriodo,
): { ops: Operacion[]; id: string; avisos: string[] } | { error: string } {
  if (p.diapositivas.length >= TOPES.diapositivas) return { error: `La presentación ya tiene ${TOPES.diapositivas} diapositivas.` };
  const enUso = idsEnUso(p);
  let ajustado = false;

  const porMes = <T>(dato: PorPeriodo<T>): PorPeriodo<T> => {
    if (!dato.porPeriodo) return structuredClone(dato);
    const r = aMeses(dato.valores, p.periodos, copia.periodo, mesDestino);
    ajustado ||= r.ajustado;
    return { porPeriodo: true, valores: r.valores };
  };

  // Conjuntos con id nuevo y sus filas en los meses del destino.
  const nuevos = new Map<string, ConjuntoDatos>();
  for (const c of copia.conjuntos) {
    const nuevo: ConjuntoDatos = { ...structuredClone(c), id: nuevoId('c', enUso) };
    if (c.porPeriodo) {
      const r = aMeses(c.filasPorPeriodo, p.periodos, copia.periodo, mesDestino);
      ajustado ||= r.ajustado;
      nuevo.filasPorPeriodo = r.valores;
    }
    nuevos.set(c.id, nuevo);
  }
  const conjuntoNuevo = (id: string) => nuevos.get(id)?.id ?? id;
  const cifraNueva = (c: Cifra): Cifra => (c.desde ? { ...c, desde: { ...c.desde, conjunto: conjuntoNuevo(c.desde.conjunto) } } : c);

  const bloques = copia.diapositiva.bloques.map((b): Bloque => {
    const base = { ...structuredClone(b), id: nuevoId('b', enUso) };
    switch (base.tipo) {
      case 'grafico':
      case 'tabla':
        return { ...base, datos: conjuntoNuevo(base.datos) };
      case 'texto':
        return { ...base, contenido: porMes(base.contenido) };
      case 'tarjetas':
        return { ...base, tarjetas: porMes(base.tarjetas) };
      case 'cifras': {
        const cifras = porMes(base.cifras);
        return {
          ...base,
          cifras: cifras.porPeriodo
            ? { ...cifras, valores: Object.fromEntries(Object.entries(cifras.valores ?? {}).map(([m, v]) => [m, v.map(cifraNueva)])) }
            : { ...cifras, valor: cifras.valor?.map(cifraNueva) },
        };
      }
    }
  });

  const diapositiva: Diapositiva = { ...structuredClone(copia.diapositiva), id: nuevoId('d', enUso), bloques };
  const avisos: string[] = [];
  if (ajustado) {
    avisos.push('Lo que cambiaba por mes se pegó en los meses que esta presentación comparte con la original; el mes que estás viendo recibió el que se veía al copiar.');
  }
  return {
    id: diapositiva.id,
    avisos,
    ops: [
      ...[...nuevos.values()].map((c): Operacion => ({ op: 'conjunto.poner', conjunto: c })),
      { op: 'diapositiva.poner', diapositiva, despues },
    ],
  };
}
