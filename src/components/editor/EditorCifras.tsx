'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { filasDe, resolverCifra, valorDe } from '@/lib/datos';
import type { Operacion } from '@/lib/edicion/operaciones';
import { TOPES } from '@/lib/edicion/validar';
import { mesParaCopiar } from '@/lib/periodos';
import type { BloqueCifras, Cifra, FuenteCifra, IdPeriodo, Presentacion, SelectorFila } from '@/lib/tipos';
import { BotonIcono, CLASE_BOTON, CLASE_CAMPO, MesVacio, SelectorModo } from './piezas';

const CLASE_SELECT = `${CLASE_CAMPO} h-9 py-0 text-[14px]`;

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
  const ponerFuente = (indice: number, desde: FuenteCifra | undefined) => {
    const nuevas = (cifras ?? []).map((cifra, i) => {
      if (i !== indice) return cifra;
      const { desde: _desde, ...resto } = cifra;
      return desde ? { ...resto, desde } : resto;
    });
    cambiar(poner(nuevas));
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
                <div className={`mt-1 grid gap-2 ${cifra.desde ? 'grid-cols-1' : 'grid-cols-[1fr_7.5rem]'}`}>
                  <input aria-label={`Etiqueta de la cifra ${i + 1}`} placeholder="Etiqueta" maxLength={80} value={cifra.etiqueta} onChange={(e) => cambiarCampo(i, 'etiqueta', e.target.value)} className={CLASE_CAMPO} />
                  {!cifra.desde && (
                    <input aria-label={`Valor de la cifra ${i + 1}`} placeholder="Valor" maxLength={40} value={cifra.valor} onChange={(e) => cambiarCampo(i, 'valor', e.target.value)} className={`${CLASE_CAMPO} font-semibold`} />
                  )}
                </div>
                <Fuente presentacion={presentacion} periodo={periodo} cifra={cifra} numero={i + 1} onCambiar={(desde) => ponerFuente(i, desde)} />
                <input
                  aria-label={`Detalle de la cifra ${i + 1}`}
                  placeholder={cifra.desde?.comparar ? 'Texto después de la diferencia (ej.: frente al promedio)' : 'Detalle (opcional)'}
                  maxLength={120}
                  value={cifra.detalle ?? ''}
                  onChange={(e) => cambiarCampo(i, 'detalle', e.target.value)}
                  className={`${CLASE_CAMPO} mt-2`}
                />
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

// ---------------------------------------------------------------------------
// Cifra que sale de los datos

const claveSelector = (s: SelectorFila | undefined) => (s === undefined ? '' : typeof s === 'string' ? s : 'valor');

/** Elegir la fila: primera, última o la que tenga un valor en una columna de texto. */
function SelectorDeFila({ presentacion, periodo, fuente, valor, etiqueta, conNinguna = false, onCambiar }: {
  presentacion: Presentacion;
  periodo: IdPeriodo;
  fuente: FuenteCifra;
  valor: SelectorFila | undefined;
  etiqueta: string;
  conNinguna?: boolean;
  onCambiar: (s: SelectorFila | undefined) => void;
}) {
  const conjunto = presentacion.datos[fuente.conjunto];
  const textos = conjunto?.columnas.filter((c) => c.tipo === 'texto') ?? [];
  const filas = filasDe(conjunto, periodo) ?? [];
  const columna = typeof valor === 'object' ? valor.columna : textos[0]?.clave;
  const valores = columna ? [...new Set(filas.map((f) => f[columna]).filter((v): v is string => typeof v === 'string' && v !== ''))] : [];
  if (typeof valor === 'object' && !valores.includes(valor.valor)) valores.unshift(valor.valor);
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-2">
      <span className="text-[13px] text-tinta-suave">{etiqueta}</span>
      <div className="flex gap-1.5">
        <select
          aria-label={etiqueta}
          value={claveSelector(valor)}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '') onCambiar(undefined);
            else if (v === 'primera' || v === 'ultima') onCambiar(v);
            else if (columna && valores[0]) onCambiar({ columna, valor: valores[0] });
          }}
          className={CLASE_SELECT}
        >
          {conNinguna && <option value="">Nada</option>}
          <option value="primera">La primera fila</option>
          <option value="ultima">La última fila</option>
          {textos.length > 0 && <option value="valor">La fila de…</option>}
        </select>
        {typeof valor === 'object' && (
          <select aria-label={`${etiqueta}: cuál`} value={valor.valor} onChange={(e) => onCambiar({ columna: valor.columna, valor: e.target.value })} className={CLASE_SELECT}>
            {valores.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

function Fuente({ presentacion, periodo, cifra, numero, onCambiar }: {
  presentacion: Presentacion;
  periodo: IdPeriodo;
  cifra: Cifra;
  numero: number;
  onCambiar: (desde: FuenteCifra | undefined) => void;
}) {
  const conjuntos = Object.values(presentacion.datos).filter((c) => c.columnas.length > 0);
  const f = cifra.desde;
  const activar = (si: boolean) => {
    if (!si) return onCambiar(undefined);
    const c = conjuntos[0];
    if (!c) return;
    const columna = c.columnas.find((x) => x.tipo !== 'texto') ?? c.columnas[0];
    onCambiar({ conjunto: c.id, columna: columna.clave, fila: 'ultima' });
  };
  const resultado = f ? resolverCifra(presentacion, cifra, periodo) : null;
  const conjunto = f ? presentacion.datos[f.conjunto] : undefined;

  return (
    <div className="mt-2">
      <label className="flex cursor-pointer items-center gap-2 text-[14px] text-tinta">
        <input type="checkbox" checked={Boolean(f)} disabled={!conjuntos.length} onChange={(e) => activar(e.target.checked)} className="h-4 w-4 accent-primario" />
        Sacar el valor de los datos
      </label>
      {f && (
        <div className="mt-2 space-y-1.5 rounded-lg bg-fondo-app p-2.5">
          <div className="grid grid-cols-[6.5rem_1fr] items-center gap-2">
            <span className="text-[13px] text-tinta-suave">Datos</span>
            <select
              aria-label={`Datos de la cifra ${numero}`}
              value={f.conjunto}
              onChange={(e) => {
                const c = presentacion.datos[e.target.value];
                const columna = c?.columnas.find((x) => x.tipo !== 'texto') ?? c?.columnas[0];
                if (c && columna) onCambiar({ conjunto: c.id, columna: columna.clave, fila: 'ultima' });
              }}
              className={CLASE_SELECT}
            >
              {conjuntos.map((c) => <option key={c.id} value={c.id}>{c.nombre || c.id}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-[6.5rem_1fr] items-center gap-2">
            <span className="text-[13px] text-tinta-suave">Columna</span>
            <select aria-label={`Columna de la cifra ${numero}`} value={f.columna} onChange={(e) => onCambiar({ ...f, columna: e.target.value })} className={CLASE_SELECT}>
              {conjunto?.columnas.map((c) => <option key={c.clave} value={c.clave}>{c.grupo ? `${c.grupo} · ` : ''}{c.nombre || c.clave}</option>)}
            </select>
          </div>
          <SelectorDeFila presentacion={presentacion} periodo={periodo} fuente={f} valor={f.fila} etiqueta="Fila" onCambiar={(fila) => fila && onCambiar({ ...f, fila })} />
          <div className="grid grid-cols-[6.5rem_1fr] items-center gap-2">
            <span className="text-[13px] text-tinta-suave">Debajo</span>
            <select
              aria-label={`Qué va debajo de la cifra ${numero}`}
              value={f.comparar ? 'comparar' : f.detalle ? `col:${f.detalle}` : ''}
              onChange={(e) => {
                const { detalle: _d, comparar: _c, ...base } = f;
                const v = e.target.value;
                if (v === 'comparar') onCambiar({ ...base, comparar: 'primera' });
                else if (v.startsWith('col:')) onCambiar({ ...base, detalle: v.slice(4) });
                else onCambiar(base);
              }}
              className={CLASE_SELECT}
            >
              <option value="">Solo el detalle escrito</option>
              <option value="comparar">La diferencia contra otra fila</option>
              {conjunto?.columnas.filter((c) => c.clave !== f.columna).map((c) => <option key={c.clave} value={`col:${c.clave}`}>{c.nombre || c.clave} (de la misma fila)</option>)}
            </select>
          </div>
          {f.comparar && (
            <SelectorDeFila presentacion={presentacion} periodo={periodo} fuente={f} valor={f.comparar} etiqueta="Contra" onCambiar={(comparar) => onCambiar(comparar ? { ...f, comparar } : f)} />
          )}
          <p className="text-[13px] text-tinta-suave">
            En este mes: <strong className="text-tinta">{resultado?.sinDato ? 'sin dato' : `${resultado?.valor ?? ''}${resultado?.unidad ? ` ${resultado.unidad}` : ''}`}</strong>
            {resultado?.detalle && !resultado.sinDato ? ` · ${resultado.detalle}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
