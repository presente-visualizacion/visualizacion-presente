'use client';

import { useEffect, useRef } from 'react';
import { nombreCorto, nombrePeriodo, porAnio } from '@/lib/periodos';
import type { IdPeriodo } from '@/lib/tipos';

interface Props {
  periodos: IdPeriodo[];
  actual: IdPeriodo;
  onCambiar: (periodo: IdPeriodo) => void;
}

/** Barra de meses: siempre visible; al elegir un mes cambia toda la presentación. */
export function BarraMeses({ periodos, actual, onCambiar }: Props) {
  const activo = useRef<HTMLButtonElement>(null);

  // En pantallas angostas la barra se desplaza; el mes elegido queda a la vista.
  useEffect(() => {
    activo.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [actual]);

  return (
    <nav aria-label="Mes de la presentación" className="sin-barra flex items-center gap-4 overflow-x-auto px-4 pb-3 lg:px-6">
      {porAnio(periodos).map((grupo) => (
        <div key={grupo.anio} className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-semibold text-tinta-suave">{grupo.anio}</span>
          <div className="flex gap-0.5 rounded-full bg-fondo-app p-1">
            {grupo.periodos.map((p) => {
              const elegido = p === actual;
              return (
                <button
                  key={p}
                  ref={elegido ? activo : undefined}
                  type="button"
                  onClick={() => onCambiar(p)}
                  aria-pressed={elegido}
                  title={nombrePeriodo(p)}
                  className={`h-8 rounded-full px-3.5 text-[15px] transition-colors ${elegido ? 'bg-primario font-semibold text-white' : 'text-tinta hover:bg-white'}`}
                >
                  {nombreCorto(p)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
