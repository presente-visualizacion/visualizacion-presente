'use client';

import { AArrowDown, AArrowUp, RotateCcw } from 'lucide-react';
import { TOPES } from '@/lib/edicion/validar';

/** Pasos del tamaño de letra, en %. */
const PASOS = [40, 50, 60, 70, 80, 90, 100, 110, 120, 135, 150, 175, 200, 250, 300];

/** Tamaño de letra en % con botones para achicar y agrandar; null = 100 %. */
export function ElegirTamano({ etiqueta, valor, onCambiar, nota }: {
  etiqueta: string;
  valor: number | null;
  onCambiar: (valor: number | null) => void;
  nota?: string;
}) {
  const actual = valor ?? 100;
  const menor = [...PASOS].reverse().find((p) => p < actual) ?? TOPES.letraMinima;
  const mayor = PASOS.find((p) => p > actual) ?? TOPES.letraMaxima;
  const poner = (v: number) => onCambiar(v === 100 ? null : v);
  const boton = 'flex h-9 w-10 items-center justify-center rounded-lg border border-linea-fuerte bg-white text-tinta transition-colors hover:bg-fondo-app disabled:opacity-40 disabled:hover:bg-white';
  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-tinta">{etiqueta}</span>
      <div className="flex items-center gap-2">
        <button type="button" className={boton} onClick={() => poner(menor)} disabled={actual <= TOPES.letraMinima} title="Letra más chica" aria-label="Letra más chica">
          <AArrowDown size={18} aria-hidden />
        </button>
        <output className="min-w-16 text-center text-[15px] font-semibold tabular-nums text-tinta" aria-live="polite">{actual} %</output>
        <button type="button" className={boton} onClick={() => poner(mayor)} disabled={actual >= TOPES.letraMaxima} title="Letra más grande" aria-label="Letra más grande">
          <AArrowUp size={18} aria-hidden />
        </button>
        {actual !== 100 && (
          <button type="button" className="ml-1 flex h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] text-tinta-suave hover:bg-fondo-app hover:text-tinta" onClick={() => onCambiar(null)}>
            <RotateCcw size={14} aria-hidden /> 100 %
          </button>
        )}
      </div>
      {nota && <span className="mt-1 block text-[13px] leading-snug text-tinta-suave">{nota}</span>}
    </div>
  );
}
