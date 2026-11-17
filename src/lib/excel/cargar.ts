// Operaciones que hace "Cargar" en la ventana de Excel. Todo lo de una carga
// va en una sola tanda, que es un solo paso de deshacer. Sin React.

import type { Operacion } from '../edicion/operaciones';
import { configPara, esNumerica, idsEnUso, motivoNoDisponible, nuevoId, opsDisposicionPara } from '../edicion/plantillas';
import type { BloqueGrafico, Columna, ConjuntoDatos, Fila, FormaGrafico, IdPeriodo, OrigenExcel, Presentacion } from '../tipos';

/** A qué mes va la carga. `nuevo`: es el mes siguiente al último y hay que agregarlo. */
export interface DestinoMes {
  periodo: IdPeriodo;
  nuevo: boolean;
}

/** Agrega el mes, si es nuevo, copiando el último (igual que el botón "Nuevo mes"). */
function opsMes(p: Presentacion, mes: DestinoMes | null): Operacion[] {
  if (!mes?.nuevo || p.periodos.includes(mes.periodo)) return [];
  return [{ op: 'periodo.agregar', periodo: mes.periodo, copiarDe: p.periodos.at(-1) ?? null }];
}

export interface CargaNueva {
  tipo: 'grafico' | 'tabla';
  diapositiva: string;
  /** Nombre de los datos. */
  nombre: string;
  /** Columnas del conjunto nuevo. En un gráfico la primera es el eje y las numéricas, las series. */
  columnas: Columna[];
  filas: Fila[];
  forma?: FormaGrafico;
  /** null: iguales en todos los meses. */
  mes: DestinoMes | null;
  origen: OrigenExcel;
}

/** Por qué no se puede hacer ese gráfico con esas columnas; null si se puede. */
export function motivoForma(forma: FormaGrafico, columnas: Columna[]): string | null {
  if (columnas.length < 2) return 'Elige el eje y al menos una serie.';
  const series = columnas.slice(1).filter(esNumerica);
  if (!series.length) return 'Las series tienen que ser columnas numéricas.';
  if (forma === 'dispersion' && !esNumerica(columnas[0])) return 'En la dispersión el eje tiene que ser una columna numérica.';
  return motivoNoDisponible(forma, { id: '', nombre: '', columnas, porPeriodo: false });
}

/** Conjunto y bloque nuevos, al final de la diapositiva. */
export function opsBloqueDesdeExcel(p: Presentacion, carga: CargaNueva): { ops: Operacion[]; bloque: string; conjunto: string } | null {
  const d = p.diapositivas.find((x) => x.id === carga.diapositiva);
  if (!d) return null;
  const enUso = idsEnUso(p);
  const conjunto: ConjuntoDatos = {
    id: nuevoId('c', enUso),
    nombre: carga.nombre,
    columnas: carga.columnas,
    porPeriodo: carga.mes !== null,
    ...(carga.mes ? { filasPorPeriodo: { [carga.mes.periodo]: carga.filas } } : { filas: carga.filas }),
    origen: carga.origen,
  };
  const id = nuevoId('b', enUso);
  let bloque;
  if (carga.tipo === 'tabla') {
    bloque = { id, tipo: 'tabla' as const, datos: conjunto.id };
  } else {
    const forma = carga.forma ?? 'barras';
    const [eje, ...resto] = carga.columnas;
    const base: BloqueGrafico = {
      id, tipo: 'grafico', datos: conjunto.id, forma, ejeX: eje.clave,
      series: resto.filter(esNumerica).slice(0, 12).map((c) => ({ clave: c.clave })),
    };
    bloque = { id, tipo: 'grafico' as const, ...configPara(forma, base, conjunto) };
  }
  return {
    bloque: id,
    conjunto: conjunto.id,
    ops: [
      ...opsMes(p, carga.mes),
      { op: 'conjunto.poner', conjunto },
      { op: 'bloque.poner', diapositiva: d.id, bloque, despues: d.bloques.at(-1)?.id ?? null },
      ...opsDisposicionPara(d, d.bloques.length + 1),
    ],
  };
}

/** Filas nuevas para un conjunto que ya existe, en el mes elegido, y la configuración recordada. */
export function opsActualizarDesdeExcel(p: Presentacion, conjunto: string, filas: Fila[], mes: DestinoMes | null, origen: OrigenExcel): Operacion[] {
  const c = Object.hasOwn(p.datos, conjunto) ? p.datos[conjunto] : undefined;
  if (!c) return [];
  if (c.porPeriodo && !mes) return [];
  return [
    ...(c.porPeriodo ? opsMes(p, mes) : []),
    { op: 'datos.filas', conjunto, periodo: c.porPeriodo ? mes!.periodo : null, valor: filas },
    { op: 'datos.origen', conjunto, valor: origen },
  ];
}

/** Qué abre la ventana de carga: un bloque nuevo en una diapositiva o unos datos que ya existen. */
export type DestinoExcel =
  | { modo: 'nuevo'; diapositiva: string; tipo: 'grafico' | 'tabla' }
  | { modo: 'conjunto'; conjunto: string };
