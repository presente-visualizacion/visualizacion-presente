'use client';

// Configuración de una tabla: qué columnas se ven, en qué orden, y qué fila se
// resalta. Cada cambio es una operación `tabla.config`.

import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ConfigTabla, Operacion } from '@/lib/edicion/operaciones';
import type { BloqueTabla, IdPeriodo, Presentacion } from '@/lib/tipos';
import { SelectorResaltado } from './EditorGrafico';
import { BotonIcono, Subtitulo } from './piezas';

interface Props {
  presentacion: Presentacion;
  bloque: BloqueTabla;
  periodo: IdPeriodo;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
}

export function EditorTabla({ presentacion, bloque, periodo, cambiar }: Props) {
  const conjunto = presentacion.datos[bloque.datos];
  if (!conjunto) return null;
  const { id: _id, tipo: _tipo, ...actual } = bloque;
  const poner = (cambios: Partial<ConfigTabla>) => {
    const valor: ConfigTabla = { ...actual, ...cambios };
    if (!valor.resaltar) delete valor.resaltar;
    if (!valor.columnas) delete valor.columnas;
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
      <SelectorResaltado conjunto={conjunto} periodo={periodo} resaltar={bloque.resaltar} onCambiar={(resaltar) => poner({ resaltar })} />
    </div>
  );
}
