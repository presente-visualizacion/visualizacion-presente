'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize, X } from 'lucide-react';
import { Diapositiva } from '@/components/diapositivas/Diapositiva';
import { Logo } from '@/components/Logo';
import { nombrePeriodo } from '@/lib/periodos';
import { degradadoCss } from '@/lib/tema';
import type { IdPeriodo, Presentacion } from '@/lib/tipos';
import { BarraMeses } from './BarraMeses';
import { Lienzo } from './Lienzo';
import { ListaDiapositivas } from './ListaDiapositivas';

interface Props {
  presentacion: Presentacion;
  /** Revisión con la que se cargó la página. */
  revision: number;
  /** Si se muestra el botón "Editar". */
  editable: boolean;
  indiceInicial: number;
  periodoInicial: IdPeriodo;
}

export function Visor({ presentacion, indiceInicial, periodoInicial }: Props) {
  const { diapositivas, periodos, tema } = presentacion;
  const total = diapositivas.length;

  const [indice, setIndice] = useState(indiceInicial);
  const [periodo, setPeriodo] = useState(periodoInicial);
  const [presentando, setPresentando] = useState(false);
  const [controles, setControles] = useState(true);
  const raiz = useRef<HTMLDivElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toque = useRef<{ x: number; y: number } | null>(null);

  const ir = useCallback((destino: number) => setIndice(Math.min(Math.max(destino, 0), total - 1)), [total]);
  const anterior = useCallback(() => setIndice((i) => Math.max(i - 1, 0)), []);
  const siguiente = useCallback(() => setIndice((i) => Math.min(i + 1, total - 1)), [total]);

  // El enlace siempre refleja la diapositiva y el mes, para poder compartirlo.
  useEffect(() => {
    const parametros = new URLSearchParams({ d: String(indice + 1), mes: periodo });
    window.history.replaceState(null, '', `?${parametros}`);
  }, [indice, periodo]);

  const presentar = useCallback(() => {
    setPresentando(true);
    // En iPhone no existe pantalla completa para páginas; ahí la presentación
    // ocupa toda la ventana del navegador.
    raiz.current?.requestFullscreen?.().catch(() => {});
  }, []);

  const salir = useCallback(() => {
    setPresentando(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    const alCambiar = () => {
      if (!document.fullscreenElement) setPresentando(false);
    };
    document.addEventListener('fullscreenchange', alCambiar);
    return () => document.removeEventListener('fullscreenchange', alCambiar);
  }, []);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      const destino = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || destino?.closest('input, textarea, select, [contenteditable="true"]')) return;
      // Espacio y Enter sobre un botón deben accionar el botón, no pasar de diapositiva.
      const enBoton = Boolean(destino?.closest('button, a'));
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !enBoton)) { e.preventDefault(); siguiente(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); anterior(); }
      else if (e.key === 'Home') { e.preventDefault(); ir(0); }
      else if (e.key === 'End') { e.preventDefault(); ir(total - 1); }
      else if (e.key === 'f' || e.key === 'F') { if (presentando) salir(); else presentar(); }
      else if (e.key === 'Escape' && presentando) salir();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [anterior, siguiente, ir, total, presentando, presentar, salir]);

  // En modo presentación los controles aparecen al mover el mouse o tocar la
  // pantalla y se esconden solos.
  const mostrarControles = useCallback(() => {
    setControles(true);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setControles(false), 2800);
  }, []);

  useEffect(() => {
    if (presentando) mostrarControles();
    return () => { if (temporizador.current) clearTimeout(temporizador.current); };
  }, [presentando, mostrarControles]);

  const alTocar = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    toque.current = { x: t.clientX, y: t.clientY };
  };
  const alSoltar = (e: React.TouchEvent) => {
    if (!toque.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - toque.current.x;
    const dy = t.clientY - toque.current.y;
    toque.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) siguiente(); else anterior();
    }
  };

  const variablesTema = {
    '--vp-primario': tema.primario,
    '--vp-degradado': degradadoCss(tema),
    '--vp-degradado-h': degradadoCss(tema, 'to right'),
  } as React.CSSProperties;

  const diapositiva = (
    <div key={diapositivas[indice].id} className="aparecer h-full w-full">
      <Diapositiva presentacion={presentacion} diapositiva={diapositivas[indice]} periodo={periodo} numero={indice + 1} />
    </div>
  );

  if (presentando) {
    return (
      <div
        ref={raiz}
        style={variablesTema}
        className={`fixed inset-0 z-50 bg-white ${controles ? '' : 'cursor-none'}`}
        onMouseMove={mostrarControles}
        onTouchStart={(e) => { mostrarControles(); alTocar(e); }}
        onTouchEnd={alSoltar}
      >
        <Lienzo marco={false}>{diapositiva}</Lienzo>
        <div
          className={`absolute inset-x-0 bottom-4 flex justify-center px-3 transition-opacity duration-200 focus-within:opacity-100 ${controles ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <div className="flex items-center gap-1 rounded-full bg-tinta/92 p-1.5 text-white shadow-lg">
            <BotonRedondo etiqueta="Diapositiva anterior" onClick={anterior} inactivo={indice === 0} oscuro><ChevronLeft size={20} /></BotonRedondo>
            <span className="min-w-16 text-center text-sm">{indice + 1} de {total}</span>
            <BotonRedondo etiqueta="Diapositiva siguiente" onClick={siguiente} inactivo={indice === total - 1} oscuro><ChevronRight size={20} /></BotonRedondo>
            <label className="ml-1">
              <span className="sr-only">Mes</span>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="h-9 rounded-full bg-white/12 px-3 text-sm text-white hover:bg-white/20"
              >
                {periodos.map((p) => <option key={p} value={p} className="text-tinta">{nombrePeriodo(p)}</option>)}
              </select>
            </label>
            <BotonRedondo etiqueta="Salir de la presentación" onClick={salir} oscuro><X size={20} /></BotonRedondo>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={raiz} style={variablesTema} className="flex h-dvh flex-col bg-fondo-app">
      <header className="shrink-0 border-b border-linea bg-white">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <Link href="/" title="Todas las presentaciones" className="shrink-0 rounded-lg">
            <Logo alto={36} src={tema.logo} />
          </Link>
          <h1 className="min-w-0 truncate text-lg font-semibold">{presentacion.nombre}</h1>
          <button
            type="button"
            onClick={presentar}
            aria-label="Presentar"
            title="Presentar en pantalla completa (tecla F)"
            className="ml-auto flex h-10 shrink-0 items-center gap-2 rounded-full bg-primario px-3 font-semibold text-white transition-[filter] hover:brightness-90 sm:px-4"
          >
            <Maximize size={18} aria-hidden />
            <span className="hidden sm:inline">Presentar</span>
          </button>
        </div>
        <BarraMeses periodos={periodos} actual={periodo} onCambiar={setPeriodo} />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside aria-label="Diapositivas" className="hidden w-72 shrink-0 overflow-y-auto border-r border-linea bg-white lg:block">
          <ListaDiapositivas diapositivas={diapositivas} indice={indice} periodo={periodo} onIr={ir} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="relative m-3 min-h-0 flex-1 lg:mx-8 lg:mt-7" onTouchStart={alTocar} onTouchEnd={alSoltar}>
            <Lienzo>{diapositiva}</Lienzo>
          </div>
          <div className="flex shrink-0 items-center justify-center gap-2 pb-3 lg:pb-5">
            <BotonRedondo etiqueta="Diapositiva anterior" onClick={anterior} inactivo={indice === 0}><ChevronLeft size={20} /></BotonRedondo>
            <span className="min-w-20 text-center text-sm text-tinta-suave">{indice + 1} de {total}</span>
            <BotonRedondo etiqueta="Diapositiva siguiente" onClick={siguiente} inactivo={indice === total - 1}><ChevronRight size={20} /></BotonRedondo>
          </div>
          <div className="lg:hidden">
            <ListaDiapositivas diapositivas={diapositivas} indice={indice} periodo={periodo} onIr={ir} horizontal />
          </div>
        </main>
      </div>
    </div>
  );
}

function BotonRedondo({ etiqueta, onClick, inactivo = false, oscuro = false, children }: {
  etiqueta: string;
  onClick: () => void;
  inactivo?: boolean;
  oscuro?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inactivo}
      aria-label={etiqueta}
      title={etiqueta}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:opacity-35 ${
        oscuro ? 'hover:bg-white/15 disabled:hover:bg-transparent' : 'border border-linea-fuerte bg-white hover:bg-tinte disabled:hover:bg-white'
      }`}
    >
      {children}
    </button>
  );
}
