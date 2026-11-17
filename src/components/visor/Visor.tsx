'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Maximize, Pencil, Redo2, Undo2, X } from 'lucide-react';
import { Diapositiva } from '@/components/diapositivas/Diapositiva';
import { EstadoGuardado } from '@/components/editor/EstadoGuardado';
import { usarEdicion } from '@/components/editor/usarEdicion';
import { TOPES } from '@/lib/edicion/validar';
import { Logo } from '@/components/Logo';
import { nombrePeriodo } from '@/lib/periodos';
import { degradadoCss } from '@/lib/tema';
import type { IdPeriodo, Presentacion } from '@/lib/tipos';
import { BarraMeses } from './BarraMeses';
import { Lienzo } from './Lienzo';
import { ListaDiapositivas } from './ListaDiapositivas';

// El panel y el editor de datos solo se descargan al entrar a editar.
const PanelEdicion = dynamic(() => import('@/components/editor/PanelEdicion').then((m) => m.PanelEdicion), { ssr: false });
const EditorDatos = dynamic(() => import('@/components/editor/EditorDatos').then((m) => m.EditorDatos), { ssr: false });

interface Props {
  presentacion: Presentacion;
  /** Revisión con la que se cargó la página. */
  revision: number;
  /** Si se muestra el botón "Editar". */
  editable: boolean;
  indiceInicial: number;
  periodoInicial: IdPeriodo;
}

export function Visor({ presentacion: inicial, revision, editable, indiceInicial, periodoInicial }: Props) {
  // La presentación que se dibuja es la del estado de edición: trae aplicados
  // los cambios locales, aunque todavía se estén guardando.
  const edicion = usarEdicion(inicial, revision);
  const { presentacion, cambiar, deshacer, rehacer } = edicion;
  const { diapositivas, periodos, tema } = presentacion;
  const total = diapositivas.length;

  const [indiceElegido, setIndice] = useState(indiceInicial);
  // Otra persona pudo quitar diapositivas o meses mientras tanto.
  const indice = Math.min(indiceElegido, total - 1);
  const [periodoElegido, setPeriodo] = useState(periodoInicial);
  const periodo = periodos.includes(periodoElegido) ? periodoElegido : periodos[periodos.length - 1];
  const [editando, setEditando] = useState(false);
  /** Diapositiva a la que ir en cuanto aparezca (al agregar, duplicar o quitar). */
  const [irA, setIrA] = useState<string | null>(null);
  useEffect(() => {
    if (!irA) return;
    const destino = diapositivas.findIndex((d) => d.id === irA);
    if (destino >= 0) setIndice(destino);
    setIrA(null);
  }, [irA, diapositivas]);
  /** Conjunto de datos abierto en el editor de datos. */
  const [datosAbiertos, setDatosAbiertos] = useState<string | null>(null);
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
    setDatosAbiertos(null);
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
      // Deshacer y rehacer valen también dentro de los campos: el deshacer
      // propio del navegador no sabe de lo que ya se guardó.
      if (editando && (e.metaKey || e.ctrlKey) && !e.altKey) {
        const tecla = e.key.toLowerCase();
        if (tecla === 'z' || tecla === 'y') {
          e.preventDefault();
          if (tecla === 'y' || e.shiftKey) rehacer(); else deshacer();
          return;
        }
      }
      // Con el editor de datos abierto, las teclas son de la cuadrícula.
      if (datosAbiertos) return;
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
  }, [anterior, siguiente, ir, total, presentando, presentar, salir, editando, datosAbiertos, deshacer, rehacer]);

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
          {editando ? (
            <NombreEditable nombre={presentacion.nombre} onCambiar={(valor) => cambiar({ op: 'presentacion.nombre', valor })} />
          ) : (
            <h1 className="min-w-0 truncate text-lg font-semibold">{presentacion.nombre}</h1>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {editando && (
              <div className="hidden items-center gap-1 lg:flex">
                <EstadoGuardado estado={edicion.estado} detalle={edicion.error} />
                <span className="mx-1 h-6 w-px bg-linea" aria-hidden />
                <BotonRedondo etiqueta="Deshacer (Ctrl+Z)" onClick={deshacer} inactivo={!edicion.puedeDeshacer}><Undo2 size={18} /></BotonRedondo>
                <BotonRedondo etiqueta="Rehacer (Ctrl+Y)" onClick={rehacer} inactivo={!edicion.puedeRehacer}><Redo2 size={18} /></BotonRedondo>
              </div>
            )}
            {editable && (
              <button
                type="button"
                onClick={() => setEditando((valor) => !valor)}
                aria-pressed={editando}
                title={editando ? 'Terminar de editar' : 'Editar la presentación'}
                className="hidden h-10 shrink-0 items-center gap-2 rounded-full border border-linea-fuerte bg-white px-4 font-semibold text-tinta transition-colors hover:bg-tinte lg:flex"
              >
                {editando ? <Check size={18} aria-hidden /> : <Pencil size={17} aria-hidden />}
                {editando ? 'Listo' : 'Editar'}
              </button>
            )}
          <button
            type="button"
            onClick={presentar}
            aria-label="Presentar"
            title="Presentar en pantalla completa (tecla F)"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-primario px-3 font-semibold text-white transition-[filter] hover:brightness-90 sm:px-4"
          >
            <Maximize size={18} aria-hidden />
            <span className="hidden sm:inline">Presentar</span>
          </button>
          </div>
        </div>
        <BarraMeses periodos={periodos} actual={periodo} onCambiar={setPeriodo} />
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Al editar en pantallas medianas la lista cede su sitio al panel. */}
        <aside aria-label="Diapositivas" className={`hidden w-72 shrink-0 overflow-y-auto border-r border-linea bg-white ${editando ? 'xl:block' : 'lg:block'}`}>
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
          <div className={editando ? 'xl:hidden' : 'lg:hidden'}>
            <ListaDiapositivas diapositivas={diapositivas} indice={indice} periodo={periodo} onIr={ir} horizontal />
          </div>
        </main>

        {editando && (
          <PanelEdicion
            className="hidden lg:flex"
            presentacion={presentacion}
            diapositiva={diapositivas[indice]}
            periodo={periodo}
            cambiar={cambiar}
            onEditarDatos={setDatosAbiertos}
            onIrA={setIrA}
            onPeriodo={setPeriodo}
            onCerrar={() => setEditando(false)}
          />
        )}
      </div>

      {editando && datosAbiertos && (
        <EditorDatos presentacion={presentacion} conjuntoId={datosAbiertos} periodo={periodo} cambiar={cambiar} onCerrar={() => setDatosAbiertos(null)} />
      )}

      {(edicion.error || edicion.aviso) && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
          <div role={edicion.error ? 'alert' : 'status'} className="pointer-events-auto flex max-w-xl items-start gap-3 rounded-xl bg-tinta px-4 py-3 text-[15px] text-white shadow-lg">
            <p className="min-w-0 flex-1 leading-snug">{edicion.error ?? edicion.aviso}</p>
            <button type="button" onClick={edicion.descartarAviso} aria-label="Cerrar el aviso" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-white/15">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Nombre de la presentación, editable en el encabezado. El nombre no puede
 * quedar vacío: mientras lo esté no se guarda y al salir vuelve el anterior.
 */
function NombreEditable({ nombre, onCambiar }: { nombre: string; onCambiar: (nombre: string) => void }) {
  const [borrador, setBorrador] = useState<string | null>(null);
  return (
    <input
      aria-label="Nombre de la presentación"
      value={borrador ?? nombre}
      maxLength={TOPES.nombre}
      onChange={(e) => {
        const valor = e.target.value;
        if (valor.trim()) {
          setBorrador(null);
          onCambiar(valor);
        } else {
          setBorrador(valor);
        }
      }}
      onBlur={() => setBorrador(null)}
      className="min-w-0 flex-1 truncate rounded-lg border border-linea-fuerte bg-white px-2.5 py-1 text-lg font-semibold hover:border-tinta-suave focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25"
    />
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
