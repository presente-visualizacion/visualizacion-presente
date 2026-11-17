'use client';

// Piezas pequeñas que comparten el panel de edición y el editor de datos.

import { useId, useState } from 'react';
import { nombrePeriodo } from '@/lib/periodos';
import type { IdPeriodo } from '@/lib/tipos';

export const CLASE_CAMPO =
  'w-full rounded-lg border border-linea-fuerte bg-white px-3 py-2 text-[15px] text-tinta placeholder:text-tinta-suave/70 hover:border-tinta-suave focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25';

export const CLASE_BOTON =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-linea-fuerte bg-white px-3.5 text-sm font-semibold text-tinta transition-colors hover:bg-tinte disabled:opacity-40 disabled:hover:bg-white';

export const CLASE_BOTON_PRINCIPAL =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primario px-4 text-sm font-semibold text-white transition-[filter] hover:brightness-90 disabled:opacity-40';

export function BotonIcono({ etiqueta, onClick, inactivo = false, children }: {
  etiqueta: string;
  onClick: () => void;
  inactivo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inactivo}
      aria-label={etiqueta}
      title={etiqueta}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-tinta-suave transition-colors hover:bg-tinte hover:text-tinta disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

export function Campo({ etiqueta, valor, onCambiar, multilinea = false, filas = 3, maximo, nota, marcador }: {
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  multilinea?: boolean;
  filas?: number;
  maximo?: number;
  nota?: React.ReactNode;
  marcador?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-tinta">{etiqueta}</label>
      {multilinea ? (
        <textarea
          id={id}
          value={valor}
          rows={filas}
          maxLength={maximo}
          placeholder={marcador}
          onChange={(e) => onCambiar(e.target.value)}
          className={`${CLASE_CAMPO} resize-y leading-snug`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={valor}
          maxLength={maximo}
          placeholder={marcador}
          onChange={(e) => onCambiar(e.target.value)}
          className={CLASE_CAMPO}
        />
      )}
      {nota && <p className="mt-1 text-[13px] leading-snug text-tinta-suave">{nota}</p>}
    </div>
  );
}

/**
 * Interruptor entre "igual en todos los meses" y "propio de cada mes". Pasar a
 * "igual en todos" descarta lo de los otros meses, así que pide confirmación.
 */
export function SelectorModo({ porPeriodo, periodo, que, onCambiar }: {
  porPeriodo: boolean;
  periodo: IdPeriodo;
  /** Qué se está cambiando, para el mensaje: "el texto", "los datos"... */
  que: string;
  onCambiar: (porPeriodo: boolean) => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const boton = (activo: boolean) =>
    `h-7 flex-1 rounded-full px-2.5 text-[13px] transition-colors ${activo ? 'bg-white font-semibold text-tinta shadow-sm' : 'text-tinta-suave hover:text-tinta'}`;

  return (
    <div>
      <div role="group" aria-label="Cómo cambia con los meses" className="flex gap-0.5 rounded-full bg-fondo-app p-0.5">
        <button type="button" aria-pressed={!porPeriodo} className={boton(!porPeriodo)} onClick={() => porPeriodo && setConfirmando(true)}>
          Igual en todos los meses
        </button>
        <button
          type="button"
          aria-pressed={porPeriodo}
          className={boton(porPeriodo)}
          onClick={() => {
            setConfirmando(false);
            if (!porPeriodo) onCambiar(true);
          }}
        >
          Propio de cada mes
        </button>
      </div>
      {confirmando && porPeriodo && (
        <div role="alert" className="mt-2 rounded-lg border border-linea-fuerte bg-tinte p-3 text-[13px] leading-snug text-tinta">
          <p>
            Quedará {que} de <strong>{nombrePeriodo(periodo)}</strong> en todos los meses y se descartará lo de los demás. Se puede deshacer.
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" className={CLASE_BOTON} onClick={() => setConfirmando(false)}>Cancelar</button>
            <button
              type="button"
              className={CLASE_BOTON_PRINCIPAL}
              onClick={() => {
                setConfirmando(false);
                onCambiar(false);
              }}
            >
              Dejar igual en todos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Lo que se muestra cuando el mes elegido todavía no tiene contenido propio. */
export function MesVacio({ periodo, que, origen, onCopiar, onVacio }: {
  periodo: IdPeriodo;
  /** "texto", "cifras" o "datos". */
  que: string;
  /** Mes del que se puede copiar; null si ninguno tiene contenido. */
  origen: IdPeriodo | null;
  onCopiar: (origen: IdPeriodo) => void;
  onVacio: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-linea-fuerte p-4 text-center">
      <p className="text-[15px] font-semibold text-tinta">{nombrePeriodo(periodo)} no tiene {que}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {origen && (
          <button type="button" className={CLASE_BOTON_PRINCIPAL} onClick={() => onCopiar(origen)}>
            Copiar de {nombrePeriodo(origen)}
          </button>
        )}
        <button type="button" className={CLASE_BOTON} onClick={onVacio}>Empezar vacío</button>
      </div>
    </div>
  );
}
