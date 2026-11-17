'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, FileDown } from 'lucide-react';
import { SinAnimacion } from '@/components/bloques/graficoComun';
import { ALTO, ANCHO, Diapositiva } from '@/components/diapositivas/Diapositiva';
import { nombrePeriodo } from '@/lib/periodos';
import { variablesTema } from '@/lib/tema';
import type { IdPeriodo, Presentacion } from '@/lib/tipos';

interface Props {
  presentacion: Presentacion;
  periodoInicial: IdPeriodo;
  /** Índice (desde 0) si se pidió una sola diapositiva. */
  soloInicial: number | null;
  /** Abrir la ventana de imprimir en cuanto esté lista. */
  auto: boolean;
}

/**
 * Página para el PDF: todas las diapositivas del mes, una por hoja de 16:9
 * (1280 x 720 px, el mismo lienzo del visor). El PDF lo hace el navegador con
 * "Guardar como PDF" en la ventana de imprimir: así sale nítido, con texto
 * que se puede seleccionar y sin instalar nada. Ver "Diseño de la etapa 5".
 */
export function Impresion({ presentacion, periodoInicial, soloInicial, auto }: Props) {
  const [periodo, setPeriodo] = useState(periodoInicial);
  const [solo, setSolo] = useState<number | null>(soloInicial);
  const [listo, setListo] = useState(false);
  const [escala, setEscala] = useState(1);
  const contenedor = useRef<HTMLDivElement>(null);
  const yaAbierta = useRef(false);

  const indices = solo === null ? presentacion.diapositivas.map((_, i) => i) : [solo];

  // El nombre de la pestaña es el que el navegador propone para el archivo.
  useEffect(() => {
    document.title = `${presentacion.nombre} - ${nombrePeriodo(periodo)}`;
  }, [presentacion.nombre, periodo]);

  // El enlace refleja lo elegido, por si se comparte o se recarga.
  useEffect(() => {
    const parametros = new URLSearchParams({ mes: periodo });
    if (solo !== null) parametros.set('d', String(solo + 1));
    window.history.replaceState(null, '', `?${parametros}`);
  }, [periodo, solo]);

  // En pantalla las hojas se achican para caber; al imprimir van a tamaño real.
  useLayoutEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const medir = () => setEscala(Math.min(1, (el.clientWidth - 32) / ANCHO));
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // Lista cuando cargaron las letras y los gráficos dejaron de aparecer.
  useEffect(() => {
    setListo(false);
    let cancelado = false;
    let anterior = -1;
    let iguales = 0;
    const esperar = async () => {
      await document.fonts?.ready;
      const inicio = Date.now();
      while (!cancelado && Date.now() - inicio < 8000) {
        await new Promise((r) => setTimeout(r, 200));
        const graficos = document.querySelectorAll('.vp-hoja .recharts-surface').length;
        iguales = graficos === anterior ? iguales + 1 : 0;
        anterior = graficos;
        if (iguales >= 3) break;
      }
      if (!cancelado) setListo(true);
    };
    void esperar();
    return () => { cancelado = true; };
  }, [periodo, solo]);

  const imprimir = useCallback(() => window.print(), []);

  useEffect(() => {
    if (auto && listo && !yaAbierta.current) {
      yaAbierta.current = true;
      imprimir();
    }
  }, [auto, listo, imprimir]);

  return (
    <SinAnimacion.Provider value>
      <div className="vp-impresion min-h-dvh bg-fondo-app" style={variablesTema(presentacion.tema) as React.CSSProperties}>
        <header className="vp-solo-pantalla sticky top-0 z-10 border-b border-linea bg-white">
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-3 px-4 py-3">
            <Link href={`/p/${encodeURIComponent(presentacion.id)}?mes=${periodo}`} className="flex h-10 items-center gap-1.5 rounded-full border border-linea-fuerte px-3 text-[15px] hover:bg-tinte">
              <ArrowLeft size={17} aria-hidden /> Volver
            </Link>
            <h1 className="min-w-0 flex-1 basis-48 truncate text-lg font-semibold">PDF de {presentacion.nombre}</h1>
            <label className="flex items-center gap-2 text-[15px]">
              Mes
              <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="h-10 rounded-lg border border-linea-fuerte bg-white px-2">
                {presentacion.periodos.map((p) => <option key={p} value={p}>{nombrePeriodo(p)}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[15px]">
              Diapositivas
              <select
                value={solo === null ? 'todas' : String(solo)}
                onChange={(e) => setSolo(e.target.value === 'todas' ? null : Number(e.target.value))}
                className="h-10 max-w-56 rounded-lg border border-linea-fuerte bg-white px-2"
              >
                <option value="todas">Todas ({presentacion.diapositivas.length})</option>
                {presentacion.diapositivas.map((d, i) => (
                  <option key={d.id} value={i}>Solo la {i + 1}: {d.titulo.replaceAll('{mes}', nombrePeriodo(periodo)).slice(0, 40)}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={imprimir}
              disabled={!listo}
              className="flex h-10 items-center gap-2 rounded-full bg-primario px-4 font-semibold text-white transition-[filter] hover:brightness-90 disabled:opacity-60"
            >
              <FileDown size={18} aria-hidden /> {listo ? 'Guardar como PDF' : 'Preparando…'}
            </button>
          </div>
          <p className="mx-auto max-w-[1320px] px-4 pb-3 text-sm leading-snug text-tinta-suave">
            Se abre la ventana de imprimir: en <strong className="font-semibold text-tinta">Destino</strong> elige <strong className="font-semibold text-tinta">Guardar como PDF</strong> y luego Guardar. Si el navegador lo pide, deja los márgenes en &quot;Ninguno&quot; y activa &quot;Gráficos de fondo&quot;.
          </p>
        </header>

        <div ref={contenedor} className="vp-hojas mx-auto flex max-w-[1320px] flex-col items-center gap-6 px-4 py-6">
          {indices.map((i) => (
            <div
              key={`${presentacion.diapositivas[i].id}-${periodo}`}
              className="vp-hoja relative shrink-0 overflow-hidden bg-white shadow-[0_1px_2px_rgba(36,26,32,0.06),0_16px_40px_-16px_rgba(36,26,32,0.22)] ring-1 ring-linea"
              style={{ width: ANCHO * escala, height: ALTO * escala }}
            >
              <div style={{ width: ANCHO, height: ALTO, transform: `scale(${escala})`, transformOrigin: 'top left' }}>
                <Diapositiva presentacion={presentacion} diapositiva={presentacion.diapositivas[i]} periodo={periodo} numero={i + 1} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SinAnimacion.Provider>
  );
}
