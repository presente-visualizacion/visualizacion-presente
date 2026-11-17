// Respaldo en Excel (etapa 5): toda la presentación en un libro legible.
//
// - "Contenido": nombre, meses y la lista de diapositivas con sus bloques y
//   de qué hoja salen sus datos.
// - Una hoja por conjunto de datos, con todos los meses (columna "Mes").
// - "Textos": textos, cifras y tarjetas de cada mes.
//
// Es un respaldo para leer y para volver a cargar datos con "Cargar Excel".
// La copia completa, que se puede importar tal cual, es "Descargar copia"
// (.json).

import { nombreDeHoja, type CeldaNueva, type HojaNueva } from './excel/escribir';
import { nombrePeriodo } from './periodos';
import type { Bloque, Columna, ConjuntoDatos, PorPeriodo, Presentacion } from './tipos';

const NOMBRES_BLOQUE: Record<Bloque['tipo'], string> = {
  grafico: 'Gráfico',
  tabla: 'Tabla',
  texto: 'Texto',
  cifras: 'Cifras',
  tarjetas: 'Tarjetas',
};

const NOMBRES_DIAPOSITIVA = { portada: 'Portada', contenido: 'Contenido', cierre: 'Cierre' } as const;

function celdaDe(valor: string | number | null | undefined, columna: Columna): CeldaNueva {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'string' || columna.tipo === 'texto') return String(valor);
  return { valor, formato: { tipo: columna.tipo, decimales: columna.decimales } };
}

/** Encabezado de la columna: "Saldo (millones)". */
function encabezado(columna: Columna): string {
  return columna.unidad ? `${columna.nombre} (${columna.unidad})` : columna.nombre;
}

function hojaDeConjunto(nombre: string, conjunto: ConjuntoDatos, periodos: string[]): HojaNueva {
  const titulos = conjunto.columnas.map(encabezado);
  if (!conjunto.porPeriodo) {
    return {
      nombre,
      encabezado: true,
      filas: [titulos, ...(conjunto.filas ?? []).map((fila) => conjunto.columnas.map((c) => celdaDe(fila[c.clave], c)))],
    };
  }
  const filas: CeldaNueva[][] = [['Mes', ...titulos]];
  // En el orden de la barra de meses; si hay meses fuera de ella, al final.
  const meses = [...periodos, ...Object.keys(conjunto.filasPorPeriodo ?? {}).filter((m) => !periodos.includes(m)).sort()];
  for (const mes of meses) {
    for (const fila of conjunto.filasPorPeriodo?.[mes] ?? []) {
      filas.push([nombrePeriodo(mes), ...conjunto.columnas.map((c) => celdaDe(fila[c.clave], c))]);
    }
  }
  return { nombre, encabezado: true, filas };
}

/** Pares [mes, valor] de un PorPeriodo, en el orden de los meses. */
function porMes<T>(dato: PorPeriodo<T>, periodos: string[]): [string, T][] {
  if (!dato.porPeriodo) return dato.valor === undefined ? [] : [['Todos los meses', dato.valor]];
  const valores = dato.valores ?? {};
  const meses = [...periodos.filter((m) => m in valores), ...Object.keys(valores).filter((m) => !periodos.includes(m)).sort()];
  return meses.map((m) => [nombrePeriodo(m), valores[m]]);
}

/** Hojas del respaldo, listas para `escribirLibro`. */
export function hojasDeRespaldo(p: Presentacion, ahora = new Date()): HojaNueva[] {
  // Nombres reservados primero, para que un conjunto no se llame igual.
  const usados = new Set<string>(['contenido', 'textos']);
  const hojaDe: Record<string, string> = {};
  for (const [id, conjunto] of Object.entries(p.datos)) hojaDe[id] = nombreDeHoja(conjunto.nombre || id, usados);

  const contenido: CeldaNueva[][] = [
    ['Presentación', p.nombre],
    ...(p.descripcion ? [['Descripción', p.descripcion] as CeldaNueva[]] : []),
    ['Meses', p.periodos.map(nombrePeriodo).join(', ')],
    ['Descargado', ahora.toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'long', timeStyle: 'short' })],
    [],
    ['N.°', 'Tipo', 'Título', 'Subtítulo', 'Bloque', 'Título del bloque', 'Hoja de datos'],
  ];
  p.diapositivas.forEach((d, i) => {
    const base: CeldaNueva[] = [i + 1, NOMBRES_DIAPOSITIVA[d.tipo], d.titulo, d.subtitulo ?? ''];
    if (!d.bloques.length) {
      contenido.push(base);
      return;
    }
    d.bloques.forEach((b, j) => {
      const datos = 'datos' in b ? hojaDe[b.datos] ?? '' : '';
      contenido.push([...(j === 0 ? base : [null, null, null, null]), NOMBRES_BLOQUE[b.tipo], b.titulo ?? '', datos]);
    });
  });

  const textos: CeldaNueva[][] = [['N.°', 'Diapositiva', 'Bloque', 'Mes', 'Contenido']];
  p.diapositivas.forEach((d, i) => {
    for (const b of d.bloques) {
      const nombre = b.titulo ? `${NOMBRES_BLOQUE[b.tipo]}: ${b.titulo}` : NOMBRES_BLOQUE[b.tipo];
      let pares: [string, string][] = [];
      if (b.tipo === 'texto') pares = porMes(b.contenido, p.periodos);
      else if (b.tipo === 'cifras') {
        pares = porMes(b.cifras, p.periodos).map(([mes, cifras]) => [
          mes,
          cifras.map((c) => `${c.etiqueta}: ${c.desde ? `(de los datos) ${c.valor}` : c.valor}${c.detalle ? ` · ${c.detalle}` : ''}`).join('\n'),
        ]);
      } else if (b.tipo === 'tarjetas') {
        pares = porMes(b.tarjetas, p.periodos).map(([mes, tarjetas]) => [mes, tarjetas.map((t) => `${t.titulo}: ${t.texto}`).join('\n')]);
      }
      for (const [mes, valor] of pares) textos.push([i + 1, d.titulo, nombre, mes, valor]);
    }
  });

  return [
    { nombre: 'Contenido', filas: contenido, anchos: [14, 12, 40, 30, 12, 34, 28] },
    ...Object.entries(p.datos).map(([id, conjunto]) => hojaDeConjunto(hojaDe[id], conjunto, p.periodos)),
    { nombre: 'Textos', filas: textos, encabezado: true, anchos: [6, 36, 30, 18, 90] },
  ];
}
