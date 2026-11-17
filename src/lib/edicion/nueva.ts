// Presentaciones nuevas desde el inicio: en blanco o como copia de otra.
// Lo usa POST /api/presentaciones. Ver "Crear y eliminar presentaciones" en
// PLAN.md.

import type { IdPeriodo, Presentacion, Tema } from '../tipos';
import { diapositivaNueva } from './plantillas';
import { TOPES } from './validar';

/** Id para el enlace (/p/[id]) a partir del nombre: "Comité Diciembre" → "comite-diciembre". */
export function idDesdeNombre(nombre: string): string {
  const id = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return id || 'presentacion';
}

export function nombreLimpio(nombre: unknown): string | null {
  if (typeof nombre !== 'string') return null;
  const limpio = nombre.replace(/\s+/g, ' ').trim();
  return limpio && limpio.length <= TOPES.nombre ? limpio : null;
}

/** Portada, una diapositiva de contenido vacía y cierre, con un solo mes. */
export function presentacionEnBlanco({ nombre, periodo, tema, ahora = new Date().toISOString() }: {
  nombre: string;
  periodo: IdPeriodo;
  tema: Tema;
  ahora?: string;
}): Presentacion {
  const enUso = new Set<string>();
  const portada = { ...diapositivaNueva('portada', enUso), titulo: nombre };
  enUso.add(portada.id);
  const contenido = diapositivaNueva('contenido', enUso);
  enUso.add(contenido.id);
  const cierre = diapositivaNueva('cierre', enUso);
  return {
    formato: 1,
    id: idDesdeNombre(nombre),
    nombre,
    tema: structuredClone(tema),
    periodos: [periodo],
    diapositivas: [portada, contenido, cierre],
    datos: {},
    actualizado: ahora,
  };
}

/** Copia completa (diapositivas, datos y meses) con otro nombre. */
export function copiaDePresentacion(original: Presentacion, nombre: string, ahora = new Date().toISOString()): Presentacion {
  return { ...structuredClone(original), id: idDesdeNombre(nombre), nombre, actualizado: ahora };
}

// ---------------------------------------------------------------------------
// Plantilla: Paraguay (Ueno Bank)
//
// Ejemplo armado con la disposición libre, fondos y una línea de referencia.
// Cifras públicas de prensa e informes de calificación de la entidad (nov.
// 2026); no son datos de Presente. Fuentes en la nota de la diapositiva y en
// PLAN.md ("Plantilla de Paraguay").

export { PLANTILLAS, type Plantilla } from './nombresPlantillas';

export function presentacionParaguay({ nombre, periodo, tema, ahora = new Date().toISOString() }: {
  nombre: string;
  periodo: IdPeriodo;
  tema: Tema;
  ahora?: string;
}): Presentacion {
  const base = presentacionEnBlanco({ nombre, periodo, tema, ahora });
  const [portada, , cierre] = base.diapositivas;
  const clientes = 'c-paraguay-clientes';
  const car = 'c-paraguay-car';
  return {
    ...base,
    datos: {
      [clientes]: {
        id: clientes,
        nombre: 'Clientes de Ueno Bank',
        porPeriodo: false,
        columnas: [
          { clave: 'fecha', nombre: 'Fecha', tipo: 'texto' },
          { clave: 'clientes', nombre: 'Clientes', tipo: 'numero', decimales: 1, unidad: 'M' },
        ],
        filas: [
          { fecha: 'Dic. 2023', clientes: 0.5 },
          { fecha: 'Oct. 2024', clientes: 2.0 },
          { fecha: '2026', clientes: 2.9 },
        ],
      },
      [car]: {
        id: car,
        nombre: 'Solvencia (CAR) de Ueno Bank',
        porPeriodo: false,
        columnas: [
          { clave: 'corte', nombre: 'Corte', tipo: 'texto' },
          { clave: 'car', nombre: 'CAR', tipo: 'porcentaje', decimales: 2 },
        ],
        filas: [
          { corte: 'Dic-24', car: 21.05 },
          { corte: 'Mar-25', car: 19.91 },
          { corte: 'Jun-25', car: 16.49 },
          { corte: 'Sep-25', car: 14.76 },
          { corte: 'Dic-25', car: 15.84 },
          { corte: 'BCP nov-26', car: 5.56 },
        ],
      },
    },
    diapositivas: [
      { ...portada, titulo: nombre, subtitulo: 'Caso Paraguay · {mes}' },
      {
        id: 'd-paraguay',
        tipo: 'contenido',
        titulo: 'Paraguay: la intervención de Ueno Bank',
        subtitulo: 'El BCP intervino el 3 de noviembre de 2026 al banco con más clientes del país',
        disposicion: 'libre',
        bloques: [
          {
            id: 'b-paraguay-clientes',
            tipo: 'grafico',
            titulo: 'Cómo creció: de 0,5 a 2,9 millones de clientes',
            datos: clientes,
            forma: 'barrasHorizontales',
            ejeX: 'fecha',
            series: [{ clave: 'clientes' }],
            etiquetas: true,
            ubicacion: { columna: 1, ancho: 6, fila: 1, alto: 2 },
          },
          {
            id: 'b-paraguay-depositos',
            tipo: 'cifras',
            cifras: {
              porPeriodo: false,
              valor: [
                { etiqueta: 'Depósitos 2025', valor: '+54 %' },
                { etiqueta: 'Públicos en Gs. 2025', valor: '+130 %' },
              ],
            },
            ubicacion: { columna: 1, ancho: 6, fila: 3, alto: 1 },
          },
          {
            id: 'b-paraguay-condiciones',
            tipo: 'texto',
            titulo: 'Condiciones que atraían clientes',
            fondo: 'tinte',
            contenido: {
              porPeriodo: false,
              valor: '- Reintegros de hasta 40 % en compras con tarjeta\n- Apertura digital de cuentas y atención 24 h\n- Descuentos y promociones con comercios',
            },
            ubicacion: { columna: 1, ancho: 6, fila: 4, alto: 2 },
          },
          {
            id: 'b-paraguay-car',
            tipo: 'grafico',
            titulo: 'Por qué cayó: solvencia (CAR) frente al mínimo',
            nota: 'Dic-24 a dic-25: informes de calificación de la entidad. Nov-26: BCP, después de ajustes contables.',
            datos: car,
            forma: 'barras',
            ejeX: 'corte',
            series: [{ clave: 'car' }],
            etiquetas: true,
            resaltar: { columna: 'corte', valor: 'BCP nov-26' },
            referencias: [{ valor: 12, etiqueta: 'Mínimo 12 %' }],
            ubicacion: { columna: 7, ancho: 6, fila: 1, alto: 5 },
          },
          {
            id: 'b-paraguay-conclusion',
            tipo: 'texto',
            fondo: 'oscuro',
            nota: 'Fuentes: informes de calificación de Ueno Bank (dic-24 a dic-25); BCP vía La Nación e Infobae (nov-26).',
            contenido: {
              porPeriodo: false,
              valor:
                'El BCP detectó préstamos a empresas vinculadas y ajustes contables por más de **Gs. 1,6 billones**: el CAR quedó en **5,56 %**. ' +
                'Hay **2,9 M de clientes** sin acceso a sus cuentas y **US$ 800–850 M** de fondos públicos congelados.',
            },
            ubicacion: { columna: 1, ancho: 12, fila: 6, alto: 2 },
          },
        ],
      },
      cierre,
    ],
  };
}
