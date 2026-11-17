'use client';

// Tarjetas: recuadros con título y texto (propuestas, productos). Cada cambio
// es una operación `tarjetas.valor` con la lista completa del mes (o de todos).

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { valorDe } from '@/lib/datos';
import type { Operacion } from '@/lib/edicion/operaciones';
import { TOPES } from '@/lib/edicion/validar';
import { mesParaCopiar } from '@/lib/periodos';
import type { BloqueTarjetas, IdPeriodo, Presentacion, Tarjeta } from '@/lib/tipos';
import { BotonIcono, CLASE_BOTON, CLASE_CAMPO, MesVacio, SelectorModo } from './piezas';
import { FormatoSeleccion } from './Colores';

interface Props {
  presentacion: Presentacion;
  bloque: BloqueTarjetas;
  periodo: IdPeriodo;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
}

export function EditorTarjetas({ presentacion, bloque, periodo, cambiar }: Props) {
  const dato = bloque.tarjetas;
  const tarjetas = valorDe(dato, periodo);
  const poner = (valor: Tarjeta[] | null): Operacion => ({ op: 'tarjetas.valor', bloque: bloque.id, periodo: dato.porPeriodo ? periodo : null, valor });

  const cambiarCampo = (indice: number, campo: keyof Tarjeta, texto: string) => {
    const nuevas = (tarjetas ?? []).map((t, i) => (i === indice ? { ...t, [campo]: texto } : t));
    // Escribir seguido en un mismo campo es un solo paso de deshacer.
    cambiar(poner(nuevas), `tarjeta|${bloque.id}|${periodo}|${indice}|${campo}`);
  };
  const mover = (indice: number, destino: number) => {
    const nuevas = (tarjetas ?? []).slice();
    nuevas.splice(destino, 0, ...nuevas.splice(indice, 1));
    cambiar(poner(nuevas));
  };

  return (
    <div className="space-y-3">
      <SelectorModo
        porPeriodo={dato.porPeriodo}
        periodo={periodo}
        que="las tarjetas"
        onCambiar={(porPeriodo) => cambiar({ op: 'porPeriodo', destino: { bloque: bloque.id }, valor: porPeriodo, periodo })}
      />
      {dato.porPeriodo && tarjetas === undefined ? (
        <MesVacio
          periodo={periodo}
          que="tarjetas"
          origen={mesParaCopiar(presentacion.periodos, periodo, (m) => Boolean(dato.valores?.[m]?.length))}
          onCopiar={(origen) => cambiar(poner(dato.valores?.[origen] ?? []))}
          onVacio={() => cambiar(poner([{ titulo: '', texto: '' }]))}
        />
      ) : (
        <>
          <ol className="space-y-2">
            {(tarjetas ?? []).map((t, i, todas) => (
              <li key={i} className="rounded-lg border border-linea p-2.5">
                <div className="flex items-center gap-1">
                  <span className="mr-auto text-[13px] font-semibold text-tinta-suave">Tarjeta {i + 1}</span>
                  <BotonIcono etiqueta="Subir" onClick={() => mover(i, i - 1)} inactivo={i === 0}><ArrowUp size={16} /></BotonIcono>
                  <BotonIcono etiqueta="Bajar" onClick={() => mover(i, i + 1)} inactivo={i === todas.length - 1}><ArrowDown size={16} /></BotonIcono>
                  <BotonIcono etiqueta={`Quitar la tarjeta ${i + 1}`} onClick={() => cambiar(poner(todas.filter((_, j) => j !== i)))}><Trash2 size={16} /></BotonIcono>
                </div>
                <input aria-label={`Título de la tarjeta ${i + 1}`} placeholder="Título" maxLength={80} value={t.titulo} onChange={(e) => cambiarCampo(i, 'titulo', e.target.value)} className={`${CLASE_CAMPO} mt-1 font-semibold`} />
                <div className="mt-2">
                  <FormatoSeleccion idCampo={`${bloque.id}-tarjeta-${i}`} valor={t.texto} onCambiar={(texto) => cambiarCampo(i, 'texto', texto)} />
                </div>
                <textarea
                  id={`${bloque.id}-tarjeta-${i}`}
                  aria-label={`Texto de la tarjeta ${i + 1}`}
                  placeholder="Texto"
                  rows={3}
                  maxLength={TOPES.tarjetaTexto}
                  value={t.texto}
                  onChange={(e) => cambiarCampo(i, 'texto', e.target.value)}
                  className={`${CLASE_CAMPO} resize-y leading-snug`}
                />
              </li>
            ))}
          </ol>
          <button
            type="button"
            className={CLASE_BOTON}
            disabled={(tarjetas?.length ?? 0) >= TOPES.tarjetasPorBloque}
            onClick={() => cambiar(poner([...(tarjetas ?? []), { titulo: '', texto: '' }]))}
          >
            <Plus size={16} aria-hidden /> Agregar tarjeta
          </button>
          <p className="text-[13px] leading-snug text-tinta-suave">Van lado a lado si caben; si no, una debajo de la otra. **Así** se escribe en negrita.</p>
        </>
      )}
    </div>
  );
}
