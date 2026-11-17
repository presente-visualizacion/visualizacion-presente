'use client';

import { useEffect, useRef } from 'react';
import { conMes } from '@/lib/periodos';
import type { Diapositiva, IdPeriodo } from '@/lib/tipos';

interface Props {
  diapositivas: Diapositiva[];
  indice: number;
  periodo: IdPeriodo;
  onIr: (indice: number) => void;
  /** En pantallas angostas la lista va en una tira horizontal bajo la diapositiva. */
  horizontal?: boolean;
}

export function ListaDiapositivas({ diapositivas, indice, periodo, onIr, horizontal = false }: Props) {
  const activa = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activa.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [indice]);

  return (
    <ol className={horizontal ? 'sin-barra flex gap-1.5 overflow-x-auto px-3 pb-3' : 'space-y-0.5 p-3'}>
      {diapositivas.map((d, i) => {
        const elegida = i === indice;
        return (
          <li key={d.id} className={horizontal ? 'shrink-0' : ''}>
            <button
              ref={elegida ? activa : undefined}
              type="button"
              onClick={() => onIr(i)}
              aria-current={elegida ? 'true' : undefined}
              className={`flex w-full items-baseline gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] leading-snug transition-colors ${
                elegida ? 'bg-tinte font-semibold text-tinta' : 'text-tinta-suave hover:bg-fondo-app hover:text-tinta'
              } ${horizontal ? 'max-w-56 border border-linea bg-white' : ''}`}
            >
              <span className={`w-5 shrink-0 text-right text-sm ${elegida ? 'text-primario' : ''}`}>{i + 1}</span>
              <span className={horizontal ? 'truncate' : ''}>{conMes(d.titulo, periodo)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
