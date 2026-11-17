import { nombrePeriodo } from '@/lib/periodos';
import type { IdPeriodo } from '@/lib/tipos';

/** Se muestra cuando el mes seleccionado no tiene información para un bloque. */
export function SinDatos({ periodo, que = 'datos' }: { periodo: IdPeriodo; que?: string }) {
  return (
    <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-[10px] border border-dashed border-linea-fuerte px-[32px] text-center">
      <p className="text-[22px] font-semibold text-tinta">Sin {que} para {nombrePeriodo(periodo)}</p>
      <p className="mt-[6px] text-[17px] text-tinta-suave">Elige otro mes en la barra de meses.</p>
    </div>
  );
}
