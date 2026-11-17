'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { valorDe } from '@/lib/datos';
import type { Operacion } from '@/lib/edicion/operaciones';
import { TOPES } from '@/lib/edicion/validar';
import { mesParaCopiar } from '@/lib/periodos';
import type { BloqueCifras, Cifra, IdPeriodo, Presentacion } from '@/lib/tipos';
import { BotonIcono, CLASE_BOTON, CLASE_CAMPO, MesVacio, SelectorModo } from './piezas';

interface Props {
  presentacion: Presentacion;
  bloque: BloqueCifras;
  periodo: IdPeriodo;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
}

export function EditorCifras({ presentacion, bloque, periodo, cambiar }: Props) {
  const dato = bloque.cifras;
  const cifras = valorDe(dato, periodo);
  const poner = (valor: Cifra[] | null): Operacion => ({ op: 'cifras.valor', bloque: bloque.id, periodo: dato.porPeriodo ? periodo : null, valor });

  const cambiarCampo = (indice: number, campo: keyof Cifra, texto: string) => {
    const nuevas = (cifras ?? []).map((cifra, i) => {
      if (i !== indice) return cifra;
      const { detalle: _detalle, ...sinDetalle } = cifra;
      if (campo === 'detalle') return texto ? { ...sinDetalle, detalle: texto } : sinDetalle;
      return { ...cifra, [campo]: texto };
    });
    // Escribir seguido en un mismo campo es un solo paso de deshacer.
    cambiar(poner(nuevas), `cifra|${bloque.id}|${periodo}|${indice}|${campo}`);
  };
  const mover = (indice: number, destino: number) => {
    const nuevas = (cifras ?? []).slice();
    nuevas.splice(destino, 0, ...nuevas.splice(indice, 1));
    cambiar(poner(nuevas));
  };

  return (
    <div className="space-y-3">
      <SelectorModo
        porPeriodo={dato.porPeriodo}
        periodo={periodo}
        que="las cifras"
        onCambiar={(porPeriodo) => cambiar({ op: 'porPeriodo', destino: { bloque: bloque.id }, valor: porPeriodo, periodo })}
      />
      {dato.porPeriodo && cifras === undefined ? (
        <MesVacio
          periodo={periodo}
          que="cifras"
          origen={mesParaCopiar(presentacion.periodos, periodo, (m) => Boolean(dato.valores?.[m]?.length))}
          onCopiar={(origen) => cambiar(poner(dato.valores?.[origen] ?? []))}
          onVacio={() => cambiar(poner([{ etiqueta: '', valor: '' }]))}
        />
      ) : (
        <>
          <ol className="space-y-2">
            {(cifras ?? []).map((cifra, i, todas) => (
              <li key={i} className="rounded-lg border border-linea p-2.5">
                <div className="flex items-center gap-1">
                  <span className="mr-auto text-[13px] font-semibold text-tinta-suave">Cifra {i + 1}</span>
                  <BotonIcono etiqueta="Subir" onClick={() => mover(i, i - 1)} inactivo={i === 0}><ArrowUp size={16} /></BotonIcono>
                  <BotonIcono etiqueta="Bajar" onClick={() => mover(i, i + 1)} inactivo={i === todas.length - 1}><ArrowDown size={16} /></BotonIcono>
                  <BotonIcono etiqueta={`Quitar la cifra ${i + 1}`} onClick={() => cambiar(poner(todas.filter((_, j) => j !== i)))}><Trash2 size={16} /></BotonIcono>
                </div>
                <div className="mt-1 grid grid-cols-[1fr_7.5rem] gap-2">
                  <input aria-label={`Etiqueta de la cifra ${i + 1}`} placeholder="Etiqueta" maxLength={80} value={cifra.etiqueta} onChange={(e) => cambiarCampo(i, 'etiqueta', e.target.value)} className={CLASE_CAMPO} />
                  <input aria-label={`Valor de la cifra ${i + 1}`} placeholder="Valor" maxLength={40} value={cifra.valor} onChange={(e) => cambiarCampo(i, 'valor', e.target.value)} className={`${CLASE_CAMPO} font-semibold`} />
                </div>
                <input aria-label={`Detalle de la cifra ${i + 1}`} placeholder="Detalle (opcional)" maxLength={120} value={cifra.detalle ?? ''} onChange={(e) => cambiarCampo(i, 'detalle', e.target.value)} className={`${CLASE_CAMPO} mt-2`} />
              </li>
            ))}
          </ol>
          <button
            type="button"
            className={CLASE_BOTON}
            disabled={(cifras?.length ?? 0) >= TOPES.cifrasPorBloque}
            onClick={() => cambiar(poner([...(cifras ?? []), { etiqueta: '', valor: '' }]))}
          >
            <Plus size={16} aria-hidden /> Agregar cifra
          </button>
        </>
      )}
    </div>
  );
}
