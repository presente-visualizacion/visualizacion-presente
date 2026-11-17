'use client';

// Diapositivas quitadas: quedan guardadas en la presentación para volver a
// ponerlas sin empezar de cero. Ver "Diapositivas quitadas" en PLAN.md.

import { useState } from 'react';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import { Diapositiva } from '@/components/diapositivas/Diapositiva';
import { Lienzo } from '@/components/visor/Lienzo';
import type { Operacion } from '@/lib/edicion/operaciones';
import { opsVolverAPoner } from '@/lib/edicion/portapapeles';
import { fechaHora } from '@/lib/fechas';
import { conMes } from '@/lib/periodos';
import { sinFormato } from '@/lib/formatoTexto';
import type { Diapositiva as TipoDiapositiva, DiapositivaGuardada, IdPeriodo, Presentacion } from '@/lib/tipos';
import { BotonConfirmar, CLASE_BOTON } from './piezas';

interface Props {
  presentacion: Presentacion;
  diapositiva: TipoDiapositiva;
  periodo: IdPeriodo;
  cambiar: (ops: Operacion | Operacion[]) => void;
  onIrA: (id: string) => void;
}

export function DiapositivasGuardadas({ presentacion, diapositiva, periodo, cambiar, onIrA }: Props) {
  const guardadas = presentacion.guardadas ?? [];
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!guardadas.length) return null;

  const volver = (g: DiapositivaGuardada) => {
    const r = opsVolverAPoner(presentacion, g.diapositiva.id, diapositiva.id, periodo);
    if ('error' in r) return setError(r.error);
    setError(null);
    cambiar(r.ops);
    onIrA(r.id);
  };

  return (
    <details open={abierto} onToggle={(e) => setAbierto((e.target as HTMLDetailsElement).open)} className="rounded-lg border border-linea-fuerte">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-tinta">
        Diapositivas quitadas ({guardadas.length})
      </summary>
      {abierto && (
        <div className="space-y-2 border-t border-linea p-2">
          <p className="px-1 text-[13px] leading-snug text-tinta-suave">
            Las que quitas quedan aquí con sus datos. &quot;Poner aquí&quot; la devuelve después de la diapositiva que estás viendo.
          </p>
          {error && <p role="alert" className="px-1 text-[13px] text-[#8E1015]">{error}</p>}
          <ul className="space-y-2">
            {guardadas.map((g) => (
              <li key={g.diapositiva.id} className="flex gap-2.5 rounded-lg p-1.5 hover:bg-fondo-app">
                <Miniatura presentacion={presentacion} guardada={g} periodo={periodo} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-tinta">{sinFormato(conMes(g.diapositiva.titulo, periodo)) || 'Sin título'}</p>
                  <p className="text-[12px] text-tinta-suave">Quitada el {fechaHora(g.quitada)}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <button type="button" className={`${CLASE_BOTON} h-8 px-2.5 text-[13px]`} onClick={() => volver(g)}>
                      <ArchiveRestore size={15} aria-hidden /> Poner aquí
                    </button>
                    <BotonConfirmar
                      etiqueta="Borrar para siempre"
                      pregunta="Se borrará para siempre (se puede deshacer con Ctrl+Z mientras no cierres)."
                      confirmar="Borrar"
                      icono={<Trash2 size={15} />}
                      compacto
                      onConfirmar={() => cambiar({ op: 'guardada.quitar', diapositiva: g.diapositiva.id })}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}

/** Dibujo chico de la diapositiva guardada, con sus datos. */
function Miniatura({ presentacion, guardada, periodo }: { presentacion: Presentacion; guardada: DiapositivaGuardada; periodo: IdPeriodo }) {
  const conDatos: Presentacion = {
    ...presentacion,
    datos: { ...Object.fromEntries(guardada.conjuntos.map((c) => [c.id, c])), ...presentacion.datos },
  };
  return (
    <div className="relative aspect-video w-28 shrink-0" aria-hidden>
      <Lienzo>
        <Diapositiva presentacion={conDatos} diapositiva={guardada.diapositiva} periodo={periodo} numero={0} />
      </Lienzo>
    </div>
  );
}
