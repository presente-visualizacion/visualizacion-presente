'use client';

import { useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { sinFormato } from '@/lib/formatoTexto';
import { conMes } from '@/lib/periodos';
import type { Diapositiva, IdPeriodo } from '@/lib/tipos';

interface Props {
  diapositivas: Diapositiva[];
  indice: number;
  periodo: IdPeriodo;
  onIr: (indice: number) => void;
  /** En pantallas angostas la lista va en una tira horizontal bajo la diapositiva. */
  horizontal?: boolean;
  /** Si se da, cada diapositiva tiene un botón para ocultarla o mostrarla al presentar. */
  onOcultar?: (id: string, oculta: boolean) => void;
}

export function ListaDiapositivas({ diapositivas, indice, periodo, onIr, horizontal = false, onOcultar }: Props) {
  const activa = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activa.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [indice]);

  return (
    <ol className={horizontal ? 'sin-barra flex gap-1.5 overflow-x-auto px-3 pb-3' : 'space-y-0.5 p-3'}>
      {diapositivas.map((d, i) => {
        const elegida = i === indice;
        return (
          <li key={d.id} className={`group relative ${horizontal ? 'shrink-0' : ''}`}>
            <button
              ref={elegida ? activa : undefined}
              type="button"
              onClick={() => onIr(i)}
              aria-current={elegida ? 'true' : undefined}
              className={`flex w-full items-baseline gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] leading-snug transition-colors ${
                elegida ? 'bg-tinte font-semibold text-tinta' : 'text-tinta-suave hover:bg-fondo-app hover:text-tinta'
              } ${horizontal ? 'max-w-56 border border-linea bg-white' : ''} ${onOcultar && !horizontal ? 'pr-10' : ''} ${d.oculta ? 'opacity-55' : ''}`}
            >
              <span className={`w-5 shrink-0 text-right text-sm ${elegida ? 'text-primario' : ''}`}>{i + 1}</span>
              <span className={`${horizontal ? 'truncate' : ''} ${d.oculta ? 'line-through decoration-tinta-suave/50' : ''}`}>
                {sinFormato(conMes(d.titulo, periodo))}
                {d.oculta && <span className="sr-only"> (oculta al presentar)</span>}
              </span>
              {d.oculta && !onOcultar && <EyeOff size={14} className="ml-auto shrink-0 self-center text-tinta-suave" aria-hidden />}
            </button>
            {onOcultar && !horizontal && (
              <button
                type="button"
                onClick={() => onOcultar(d.id, !d.oculta)}
                title={d.oculta ? 'Mostrar al presentar' : 'Ocultar al presentar (no se borra)'}
                aria-label={d.oculta ? `Mostrar la diapositiva ${i + 1} al presentar` : `Ocultar la diapositiva ${i + 1} al presentar`}
                aria-pressed={Boolean(d.oculta)}
                className={`absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-md transition-opacity hover:bg-white focus:opacity-100 ${
                  d.oculta ? 'text-primario opacity-100' : 'text-tinta-suave opacity-0 group-hover:opacity-100'
                }`}
              >
                {d.oculta ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
