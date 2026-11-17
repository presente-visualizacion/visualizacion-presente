'use client';

// Configuración de una tabla: qué columnas se ven, en qué orden, y qué fila se
// resalta. Cada cambio es una operación `tabla.config`.

import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ConfigTabla, Operacion } from '@/lib/edicion/operaciones';
import type { BloqueTabla, ColumnaCalculada, IdPeriodo, Presentacion } from '@/lib/tipos';
import { SelectorResaltado } from './EditorGrafico';
import { BotonIcono, Opcion, Subtitulo } from './piezas';

interface Props {
  presentacion: Presentacion;
  bloque: BloqueTabla;
  periodo: IdPeriodo;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
}

export function EditorTabla({ presentacion, bloque, periodo, cambiar }: Props) {
  const conjunto = presentacion.datos[bloque.datos];
  if (!conjunto) return null;
  const { id: _id, tipo: _tipo, titulo: _titulo, nota: _nota, ...actual } = bloque;
  const poner = (cambios: Partial<ConfigTabla>) => {
    const valor: ConfigTabla = { ...actual, ...cambios };
    if (!valor.resaltar) delete valor.resaltar;
    if (!valor.columnas) delete valor.columnas;
    if (!valor.secciones) delete valor.secciones;
    if (!valor.calculadas?.length) delete valor.calculadas;
    cambiar({ op: 'tabla.config', bloque: bloque.id, valor });
  };

  // Sin lista propia se ven todas, en el orden del conjunto.
  const visibles = bloque.columnas ?? conjunto.columnas.map((c) => c.clave);
  const ocultas = conjunto.columnas.filter((c) => !visibles.includes(c.clave));
  const nombre = (clave: string) => conjunto.columnas.find((c) => c.clave === clave)?.nombre || clave;
  const ponerColumnas = (columnas: string[]) => {
    const todas = columnas.length === conjunto.columnas.length && columnas.every((c, i) => c === conjunto.columnas[i].clave);
    poner({ columnas: todas ? undefined : columnas });
  };
  const mover = (i: number, destino: number) => {
    const nuevas = visibles.slice();
    nuevas.splice(destino, 0, ...nuevas.splice(i, 1));
    ponerColumnas(nuevas);
  };

  return (
    <div className="space-y-4">
      <div>
        <Subtitulo>Columnas que se ven</Subtitulo>
        <ul className="mt-1.5 divide-y divide-linea rounded-lg border border-linea">
          {visibles.map((clave, i) => (
            <li key={clave} className="flex items-center gap-2 px-2.5 py-1">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-[15px] text-tinta">
                <input
                  type="checkbox"
                  checked
                  disabled={visibles.length === 1}
                  onChange={() => ponerColumnas(visibles.filter((c) => c !== clave))}
                  className="h-4 w-4 shrink-0 accent-primario"
                />
                <span className="truncate">{nombre(clave)}</span>
              </label>
              <BotonIcono etiqueta={`Subir ${nombre(clave)}`} onClick={() => mover(i, i - 1)} inactivo={i === 0}><ArrowUp size={15} /></BotonIcono>
              <BotonIcono etiqueta={`Bajar ${nombre(clave)}`} onClick={() => mover(i, i + 1)} inactivo={i === visibles.length - 1}><ArrowDown size={15} /></BotonIcono>
            </li>
          ))}
          {ocultas.map((c) => (
            <li key={c.clave} className="px-2.5 py-1.5">
              <label className="flex cursor-pointer items-center gap-2 text-[15px] text-tinta-suave">
                <input type="checkbox" checked={false} onChange={() => ponerColumnas([...visibles, c.clave])} className="h-4 w-4 shrink-0 accent-primario" />
                <span className="truncate">{c.nombre || c.clave}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <Opcion
        etiqueta="Agrupar las filas por"
        valor={bloque.secciones ?? ''}
        opciones={[{ valor: '', nombre: 'No agrupar' }, ...conjunto.columnas.filter((c) => c.tipo === 'texto').map((c) => ({ valor: c.clave, nombre: c.nombre || c.clave }))]}
        onCambiar={(secciones) => poner({ secciones: secciones || undefined })}
        nota={bloque.secciones ? 'Cada valor de esa columna es un título de sección; la columna no se muestra.' : 'Por ejemplo "Bancos" y "Cooperativas", con un título para cada grupo.'}
      />
      <Calculadas
        columnas={visibles.flatMap((k) => {
          const c = conjunto.columnas.find((x) => x.clave === k);
          return c && c.tipo !== 'texto' ? [{ clave: c.clave, nombre: c.grupo ? `${c.grupo} · ${c.nombre}` : c.nombre || c.clave }] : [];
        })}
        calculadas={bloque.calculadas ?? []}
        porPeriodo={conjunto.porPeriodo}
        onCambiar={(calculadas) => poner({ calculadas })}
      />
      <SelectorResaltado conjunto={conjunto} periodo={periodo} resaltar={bloque.resaltar} onCambiar={(resaltar) => poner({ resaltar })} />
    </div>
  );
}

/** Columnas que la tabla calcula: variación contra el mes anterior y posición. */
function Calculadas({ columnas, calculadas, porPeriodo, onCambiar }: {
  columnas: { clave: string; nombre: string }[];
  calculadas: ColumnaCalculada[];
  porPeriodo: boolean;
  onCambiar: (calculadas: ColumnaCalculada[]) => void;
}) {
  if (!columnas.length) return null;
  const tiene = (tipo: ColumnaCalculada['tipo'], clave: string) => calculadas.find((c) => c.tipo === tipo && c.columna === clave);
  const alternar = (tipo: ColumnaCalculada['tipo'], clave: string, si: boolean) => {
    const resto = calculadas.filter((c) => !(c.tipo === tipo && c.columna === clave));
    onCambiar(si ? [...resto, tipo === 'posicion' ? { tipo, columna: clave, orden: 'asc' } : { tipo, columna: clave }] : resto);
  };
  const orden = (clave: string, valor: 'asc' | 'desc') =>
    onCambiar(calculadas.map((c) => (c.tipo === 'posicion' && c.columna === clave ? { ...c, orden: valor } : c)));

  return (
    <div>
      <Subtitulo>Columnas calculadas</Subtitulo>
      <p className="mb-1 text-[13px] leading-snug text-tinta-suave">
        Se agregan al lado de cada columna. "Var." es el cambio contra el mes anterior con datos{porPeriodo ? '' : ' (estos datos son iguales en todos los meses, así que queda vacía)'}; "Pos." ordena las filas de cada grupo.
      </p>
      <ul className="divide-y divide-linea rounded-lg border border-linea">
        {columnas.map((c) => {
          const posicion = tiene('posicion', c.clave);
          return (
            <li key={c.clave} className="px-2.5 py-1.5">
              <p className="truncate text-[14px] text-tinta">{c.nombre}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-tinta-suave">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input type="checkbox" checked={Boolean(tiene('variacion', c.clave))} onChange={(e) => alternar('variacion', c.clave, e.target.checked)} className="h-4 w-4 accent-primario" />
                  Var.
                </label>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input type="checkbox" checked={Boolean(posicion)} onChange={(e) => alternar('posicion', c.clave, e.target.checked)} className="h-4 w-4 accent-primario" />
                  Pos.
                </label>
                {posicion && (
                  <select
                    aria-label={`Orden de la posición de ${c.nombre}`}
                    value={posicion.orden ?? 'asc'}
                    onChange={(e) => orden(c.clave, e.target.value as 'asc' | 'desc')}
                    className="h-7 rounded border border-linea-fuerte bg-white px-1 text-[13px] text-tinta"
                  >
                    <option value="asc">el menor es 1</option>
                    <option value="desc">el mayor es 1</option>
                  </select>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
