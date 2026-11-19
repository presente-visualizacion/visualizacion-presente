import { useContext } from 'react';
import { nombrePeriodo } from '@/lib/periodos';
import type { IdPeriodo } from '@/lib/tipos';
import { Editando } from './graficoComun';

/**
 * Lo que se ve cuando el mes elegido no tiene información para un bloque: al
 * editar, un recuadro que lo avisa; al ver, presentar y en el PDF, nada.
 */
export function SinDatos({ periodo, que = 'datos' }: { periodo: IdPeriodo; que?: string }) {
  if (!useContext(Editando)) return null;
  return (
    // En un cuadro chico queda solo el borde punteado (los textos no cabrían).
    <div title={`Sin ${que} en ${nombrePeriodo(periodo)}`} className="@container flex h-full min-h-0 flex-col items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-linea-fuerte px-[12px] text-center">
      <p className="hidden text-[18px] font-semibold leading-tight text-tinta @[160px]:block">Sin {que} en {nombrePeriodo(periodo)}</p>
      <p className="mt-[4px] hidden text-[14px] leading-snug text-tinta-suave @[260px]:block">Al presentar no se ve en este mes. Llénalo en el panel o elige otro mes.</p>
    </div>
  );
}
