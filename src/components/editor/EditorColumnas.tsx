'use client';

// Columnas de un conjunto de datos: nombre, tipo, decimales, unidad, orden;
// agregar y quitar. Quitar o cambiar entre texto y número una columna que usa
// un bloque no se permite (la operación se saltaría): se explica cuál la usa.

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { columnasUsadas, type Operacion } from '@/lib/edicion/operaciones';
import { claveLibre } from '@/lib/edicion/plantillas';
import { TOPES } from '@/lib/edicion/validar';
import type { Columna, ConjuntoDatos, Presentacion, TipoColumna } from '@/lib/tipos';
import { BotonIcono, CLASE_BOTON, CLASE_CAMPO } from './piezas';

const TIPOS: { valor: TipoColumna; nombre: string }[] = [
  { valor: 'texto', nombre: 'Texto' },
  { valor: 'numero', nombre: 'Número' },
  { valor: 'porcentaje', nombre: 'Porcentaje' },
  { valor: 'moneda', nombre: 'Moneda' },
];

interface Props {
  presentacion: Presentacion;
  conjunto: ConjuntoDatos;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
}

export function EditorColumnas({ presentacion, conjunto, cambiar }: Props) {
  const { columnas } = conjunto;
  const usadas = columnasUsadas(presentacion, conjunto.id);
  const ponerColumnas = (valor: Columna[]) => cambiar({ op: 'datos.columnas', conjunto: conjunto.id, valor });
  const mover = (i: number, destino: number) => {
    const nuevas = columnas.slice();
    nuevas.splice(destino, 0, ...nuevas.splice(i, 1));
    ponerColumnas(nuevas);
  };
  const dondeSeUsa = (clave: string) => {
    const bloques = usadas.get(clave) ?? [];
    const numeros = presentacion.diapositivas.flatMap((d, i) => (d.bloques.some((b) => bloques.includes(b.id)) ? [i + 1] : []));
    return numeros.length === 1 ? `la diapositiva ${numeros[0]}` : `las diapositivas ${numeros.join(', ')}`;
  };

  return (
    <div className="space-y-3">
      <table className="w-full border-separate border-spacing-y-1 text-[14px]">
        <thead>
          <tr className="text-left text-[12px] text-tinta-suave">
            <th className="px-1 font-normal">Nombre</th>
            <th className="w-36 px-1 font-normal">Tipo</th>
            <th className="w-24 px-1 font-normal">Decimales</th>
            <th className="w-36 px-1 font-normal">Unidad</th>
            <th className="w-28" aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {columnas.map((c, i) => {
            const usada = usadas.has(c.clave);
            return (
              <tr key={c.clave}>
                <td className="px-1">
                  <input
                    aria-label={`Nombre de la columna ${i + 1}`}
                    value={c.nombre}
                    maxLength={TOPES.titulo}
                    onChange={(e) => cambiar({ op: 'datos.columna', conjunto: conjunto.id, clave: c.clave, nombre: e.target.value })}
                    className={`${CLASE_CAMPO} h-9 py-0`}
                  />
                </td>
                <td className="px-1">
                  <select
                    aria-label={`Tipo de ${c.nombre}`}
                    value={c.tipo}
                    onChange={(e) => ponerColumnas(columnas.map((x) => (x.clave === c.clave ? { ...x, tipo: e.target.value as TipoColumna } : x)))}
                    title={usada ? `Se usa en ${dondeSeUsa(c.clave)}: no puede pasar entre texto y número.` : undefined}
                    className={`${CLASE_CAMPO} h-9 py-0`}
                  >
                    {TIPOS.map((t) => (
                      <option key={t.valor} value={t.valor} disabled={usada && (t.valor === 'texto') !== (c.tipo === 'texto')}>{t.nombre}</option>
                    ))}
                  </select>
                </td>
                <td className="px-1">
                  {c.tipo !== 'texto' && (
                    <input
                      aria-label={`Decimales de ${c.nombre}`}
                      type="number"
                      min={0}
                      max={6}
                      value={c.decimales ?? ''}
                      placeholder="Auto"
                      onChange={(e) => {
                        const n = e.target.value === '' ? null : Math.min(6, Math.max(0, Math.round(Number(e.target.value))));
                        cambiar({ op: 'datos.columna', conjunto: conjunto.id, clave: c.clave, decimales: n });
                      }}
                      className={`${CLASE_CAMPO} h-9 py-0`}
                    />
                  )}
                </td>
                <td className="px-1">
                  {c.tipo !== 'texto' && (
                    <input
                      aria-label={`Unidad de ${c.nombre}`}
                      value={c.unidad ?? ''}
                      maxLength={40}
                      placeholder="Ej.: millones"
                      onChange={(e) => cambiar({ op: 'datos.columna', conjunto: conjunto.id, clave: c.clave, unidad: e.target.value })}
                      className={`${CLASE_CAMPO} h-9 py-0`}
                    />
                  )}
                </td>
                <td>
                  <div className="flex justify-end">
                    <BotonIcono etiqueta={`Subir ${c.nombre}`} onClick={() => mover(i, i - 1)} inactivo={i === 0}><ArrowUp size={16} /></BotonIcono>
                    <BotonIcono etiqueta={`Bajar ${c.nombre}`} onClick={() => mover(i, i + 1)} inactivo={i === columnas.length - 1}><ArrowDown size={16} /></BotonIcono>
                    <BotonIcono
                      etiqueta={usada ? `No se puede quitar: se usa en ${dondeSeUsa(c.clave)}` : `Quitar la columna ${c.nombre}`}
                      onClick={() => ponerColumnas(columnas.filter((x) => x.clave !== c.clave))}
                      inactivo={usada || columnas.length === 1}
                    >
                      <Trash2 size={16} />
                    </BotonIcono>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={CLASE_BOTON}
          disabled={columnas.length >= TOPES.columnas}
          onClick={() => ponerColumnas([...columnas, { clave: claveLibre(columnas), nombre: 'Columna nueva', tipo: 'numero' }])}
        >
          <Plus size={16} aria-hidden /> Agregar columna
        </button>
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-tinta-suave">
          El orden de arriba abajo es el de izquierda a derecha en la tabla. Cambiar el tipo convierte las celdas de todos los meses (lo que no se entienda como número queda vacío). Las columnas que usa un gráfico o una tabla no se pueden quitar.
        </p>
      </div>
    </div>
  );
}
