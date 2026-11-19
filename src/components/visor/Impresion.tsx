'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, FileDown, Printer } from 'lucide-react';
import { DetalleFijo, SinAnimacion } from '@/components/bloques/graficoComun';
import { ALTO, ANCHO, Diapositiva } from '@/components/diapositivas/Diapositiva';
import { sinFormato } from '@/lib/formatoTexto';
import { nombrePeriodo } from '@/lib/periodos';
import { variablesTema } from '@/lib/tema';
import type { IdPeriodo, Presentacion } from '@/lib/tipos';

interface Props {
  presentacion: Presentacion;
  periodoInicial: IdPeriodo;
  /** Índice (desde 0) si se pidió una sola diapositiva. */
  soloInicial: number | null;
  /** Descargar el PDF en cuanto esté listo. */
  auto: boolean;
}

/** Qué hacer con una diapositiva que no cabe en 1280 x 720 (una tabla larga). */
type Ajuste = 'crecer' | 'achicar';

interface Tamano {
  ancho: number;
  alto: number;
}

const BASE: Tamano = { ancho: ANCHO, alto: ALTO };
/** Hasta dónde puede crecer una hoja (en px del lienzo). */
const TOPE: Tamano = { ancho: ANCHO * 3, alto: ALTO * 6 };
/** px del lienzo a puntos del PDF (96 px = 72 pt). */
const PUNTOS = 0.75;

/** Cuánto le falta a una diapositiva: lo que se desborda en sus cajas con desplazamiento. */
function desborde(nodo: HTMLElement): Tamano {
  let alto = 0;
  let ancho = 0;
  nodo.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const estilo = getComputedStyle(el);
    if (estilo.overflowY === 'auto' || estilo.overflowY === 'scroll') alto = Math.max(alto, el.scrollHeight - el.clientHeight);
    if (estilo.overflowX === 'auto' || estilo.overflowX === 'scroll') ancho = Math.max(ancho, el.scrollWidth - el.clientWidth);
  });
  return { ancho, alto };
}

const cuadro = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/** Espera a que carguen las letras y dejen de aparecer gráficos. */
async function estable(cancelado: () => boolean): Promise<void> {
  await document.fonts?.ready;
  let anterior = -1;
  let iguales = 0;
  const inicio = Date.now();
  while (!cancelado() && Date.now() - inicio < 8000) {
    await new Promise((r) => setTimeout(r, 200));
    const graficos = document.querySelectorAll('.vp-hoja .recharts-surface').length;
    iguales = graficos === anterior ? iguales + 1 : 0;
    anterior = graficos;
    if (iguales >= 3) break;
  }
}

/**
 * Página del PDF: las diapositivas del mes, una por hoja. "Descargar PDF" lo
 * arma en el navegador (una imagen nítida de cada diapositiva) y lo descarga
 * directo, sin la ventana de imprimir: así no salen el enlace, la fecha ni
 * los márgenes que pone el navegador. Las diapositivas con tablas que no
 * caben van en una hoja más larga (o se achican, si se elige). "Imprimir"
 * sigue disponible. Ver "Diseño de la etapa 5" y "Mejoras del PDF" en PLAN.md.
 */
export function Impresion({ presentacion, periodoInicial, soloInicial, auto }: Props) {
  const [periodo, setPeriodo] = useState(periodoInicial);
  const [solo, setSolo] = useState<number | null>(soloInicial);
  const [ajuste, setAjuste] = useState<Ajuste>('crecer');
  const [tamanos, setTamanos] = useState<Record<string, Tamano>>({});
  const [listo, setListo] = useState(false);
  const [progreso, setProgreso] = useState<{ hecho: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disponible, setDisponible] = useState(ANCHO);
  const contenedor = useRef<HTMLDivElement>(null);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const yaDescargado = useRef(false);

  const [conOcultas, setConOcultas] = useState(false);
  const ocultas = presentacion.diapositivas.filter((d) => d.oculta).length;
  // Las ocultas no van, salvo que se pidan (o se pida justo una de ellas).
  const visibles = presentacion.diapositivas.flatMap((d, i) => (d.oculta ? [] : [i]));
  const indices = solo !== null ? [solo] : conOcultas ? presentacion.diapositivas.map((_, i) => i) : visibles;
  const numeroDe = (i: number) => (presentacion.diapositivas[i].oculta ? 0 : visibles.indexOf(i) + 1);
  const titulo = `${sinFormato(presentacion.nombre)} - ${nombrePeriodo(periodo)}`;
  const tamanoDe = (id: string) => tamanos[id] ?? BASE;

  useEffect(() => {
    document.title = titulo;
  }, [titulo]);

  useEffect(() => {
    const parametros = new URLSearchParams({ mes: periodo });
    if (solo !== null) parametros.set('d', String(solo + 1));
    window.history.replaceState(null, '', `?${parametros}`);
  }, [periodo, solo]);

  useLayoutEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const medir = () => setDisponible(el.clientWidth - 32);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // Al cambiar de mes o de diapositivas: medir cuáles no caben y agrandarlas
  // hasta que quepan (pocas pasadas: al crecer, los gráficos y tablas se
  // vuelven a acomodar).
  useEffect(() => {
    let cancelado = false;
    setListo(false);
    setTamanos({});
    const preparar = async () => {
      let actuales: Record<string, Tamano> = {};
      for (let pasada = 0; pasada < 6 && !cancelado; pasada++) {
        await estable(() => cancelado);
        if (cancelado) return;
        const nuevos = { ...actuales };
        let cambio = false;
        for (const [id, nodo] of nodos.current) {
          const falta = desborde(nodo);
          const t = nuevos[id] ?? BASE;
          const siguiente = {
            ancho: Math.min(TOPE.ancho, t.ancho + (falta.ancho > 2 ? Math.ceil(falta.ancho) + 4 : 0)),
            alto: Math.min(TOPE.alto, t.alto + (falta.alto > 2 ? Math.ceil(falta.alto) + 8 : 0)),
          };
          if (siguiente.ancho !== t.ancho || siguiente.alto !== t.alto) {
            nuevos[id] = siguiente;
            cambio = true;
          }
        }
        if (!cambio) break;
        actuales = nuevos;
        setTamanos(nuevos);
        await cuadro();
      }
      if (!cancelado) setListo(true);
    };
    void preparar();
    return () => { cancelado = true; };
  }, [periodo, solo, conOcultas]);

  const descargar = useCallback(async () => {
    setError(null);
    const ids = indices.map((i) => presentacion.diapositivas[i].id);
    setProgreso({ hecho: 0, total: ids.length });
    try {
      // Solo se descargan al pedir el PDF.
      const [{ domToCanvas }, { PDFDocument }] = await Promise.all([import('modern-screenshot'), import('pdf-lib')]);
      const pdf = await PDFDocument.create();
      pdf.setTitle(titulo);
      pdf.setProducer('Visualización Presente');
      for (const [n, id] of ids.entries()) {
        const nodo = nodos.current.get(id);
        if (!nodo) continue;
        const t = tamanoDe(id);
        const lienzo = await domToCanvas(nodo, {
          width: t.ancho,
          height: t.alto,
          scale: 2,
          backgroundColor: '#FFFFFF',
          style: { transform: 'none', left: '0px', top: '0px', position: 'relative' },
        });
        const blob = await new Promise<Blob | null>((r) => lienzo.toBlob(r, 'image/jpeg', 0.92));
        if (!blob) throw new Error('No se pudo dibujar la diapositiva.');
        const imagen = await pdf.embedJpg(await blob.arrayBuffer());
        if (ajuste === 'crecer') {
          const hoja = pdf.addPage([t.ancho * PUNTOS, t.alto * PUNTOS]);
          hoja.drawImage(imagen, { x: 0, y: 0, width: t.ancho * PUNTOS, height: t.alto * PUNTOS });
        } else {
          const hoja = pdf.addPage([ANCHO * PUNTOS, ALTO * PUNTOS]);
          const k = Math.min(ANCHO / t.ancho, ALTO / t.alto);
          const w = t.ancho * k * PUNTOS;
          const h = t.alto * k * PUNTOS;
          hoja.drawImage(imagen, { x: (ANCHO * PUNTOS - w) / 2, y: (ALTO * PUNTOS - h) / 2, width: w, height: h });
        }
        setProgreso({ hecho: n + 1, total: ids.length });
      }
      const bytes = await pdf.save();
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `${titulo.replace(/[\\/:*?"<>|]/g, '-')}.pdf`;
      document.body.append(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      setError(`No se pudo armar el PDF: ${(e as Error).message}. Prueba con "Imprimir".`);
    } finally {
      setProgreso(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indices.join(','), tamanos, ajuste, titulo]);

  useEffect(() => {
    if (auto && listo && !yaDescargado.current) {
      yaDescargado.current = true;
      void descargar();
    }
  }, [auto, listo, descargar]);

  // Al imprimir, cada hoja tiene su propio tamaño de página.
  const paginas = indices.map((i) => {
    const id = presentacion.diapositivas[i].id;
    const t = ajuste === 'crecer' ? tamanoDe(id) : BASE;
    return `.vp-hoja-${i}{page:vp-hoja-${i}}@page vp-hoja-${i}{size:${t.ancho}px ${t.alto}px;margin:0}`;
  }).join('');

  const ocupado = !listo || progreso !== null;

  return (
    <SinAnimacion.Provider value>
      <DetalleFijo.Provider value>
        <style>{`@media print{${paginas}}`}</style>
        <div className="vp-impresion min-h-dvh bg-fondo-app" style={variablesTema(presentacion.tema) as React.CSSProperties}>
          <header className="vp-solo-pantalla sticky top-0 z-10 border-b border-linea bg-white">
            <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-3 px-4 py-3">
              <Link href={`/p/${encodeURIComponent(presentacion.id)}?mes=${periodo}`} className="flex h-10 items-center gap-1.5 rounded-full border border-linea-fuerte px-3 text-[15px] hover:bg-tinte">
                <ArrowLeft size={17} aria-hidden /> Volver
              </Link>
              <h1 className="min-w-0 flex-1 basis-48 truncate text-lg font-semibold">PDF de {presentacion.nombre}</h1>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={ocupado}
                title="Abre la ventana de imprimir (el texto queda seleccionable)"
                className="flex h-10 items-center gap-2 rounded-full border border-linea-fuerte px-3 text-[15px] font-semibold hover:bg-tinte disabled:opacity-50"
              >
                <Printer size={17} aria-hidden /> Imprimir
              </button>
              <button
                type="button"
                onClick={() => void descargar()}
                disabled={ocupado}
                className="flex h-10 items-center gap-2 rounded-full bg-primario px-4 font-semibold text-white transition-[filter] hover:brightness-90 disabled:opacity-60"
              >
                <FileDown size={18} aria-hidden />
                {progreso ? `Armando ${progreso.hecho} de ${progreso.total}…` : listo ? 'Descargar PDF' : 'Preparando…'}
              </button>
            </div>
            <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-5 gap-y-2 px-4 pb-3 text-[15px]">
              <label className="flex items-center gap-2">
                Mes
                <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="h-9 rounded-lg border border-linea-fuerte bg-white px-2">
                  {presentacion.periodos.map((p) => <option key={p} value={p}>{nombrePeriodo(p)}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2">
                Diapositivas
                <select
                  value={solo === null ? 'todas' : String(solo)}
                  onChange={(e) => setSolo(e.target.value === 'todas' ? null : Number(e.target.value))}
                  className="h-9 max-w-60 rounded-lg border border-linea-fuerte bg-white px-2"
                >
                  <option value="todas">Todas ({conOcultas ? presentacion.diapositivas.length : visibles.length})</option>
                  {presentacion.diapositivas.map((d, i) => (
                    <option key={d.id} value={i}>Solo la {i + 1}{d.oculta ? ' (oculta)' : ''}: {sinFormato(d.titulo.replaceAll('{mes}', nombrePeriodo(periodo))).slice(0, 40)}</option>
                  ))}
                </select>
              </label>
              {ocultas > 0 && solo === null && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={conOcultas} onChange={(e) => setConOcultas(e.target.checked)} className="h-4 w-4 accent-primario" />
                  Incluir las ocultas ({ocultas})
                </label>
              )}
              <label className="flex items-center gap-2">
                Si una no cabe
                <select value={ajuste} onChange={(e) => setAjuste(e.target.value as Ajuste)} className="h-9 rounded-lg border border-linea-fuerte bg-white px-2">
                  <option value="crecer">Hoja más larga, para que se vea completa</option>
                  <option value="achicar">Achicarla para que quepa en la hoja</option>
                </select>
              </label>
            </div>
            {error && <p role="alert" className="mx-auto max-w-[1320px] px-4 pb-3 text-[15px] text-[#8E1015]">{error}</p>}
          </header>

          <div ref={contenedor} className="vp-hojas mx-auto flex max-w-[1320px] flex-col items-center gap-6 px-4 py-6">
            {indices.map((i) => {
              const d = presentacion.diapositivas[i];
              const t = tamanoDe(d.id);
              // Lo que ocupa la hoja (en px del lienzo) y la escala del contenido dentro de ella.
              const hoja = ajuste === 'crecer' ? t : BASE;
              const dentro = ajuste === 'crecer' ? 1 : Math.min(ANCHO / t.ancho, ALTO / t.alto);
              const x = (hoja.ancho - t.ancho * dentro) / 2;
              const y = (hoja.alto - t.alto * dentro) / 2;
              const vista = Math.min(1, disponible / hoja.ancho);
              const crecida = t.ancho !== ANCHO || t.alto !== ALTO;
              return (
                <figure key={`${d.id}-${periodo}`} className="m-0 flex flex-col items-center gap-1.5">
                  <div
                    className={`vp-hoja vp-hoja-${i} relative shrink-0 overflow-hidden bg-white shadow-[0_1px_2px_rgba(36,26,32,0.06),0_16px_40px_-16px_rgba(36,26,32,0.22)] ring-1 ring-linea`}
                    style={{
                      width: hoja.ancho * vista,
                      height: hoja.alto * vista,
                      '--hoja-ancho': `${hoja.ancho}px`,
                      '--hoja-alto': `${hoja.alto}px`,
                      '--hoja-escala': `scale(${dentro})`,
                      '--hoja-x': `${x}px`,
                      '--hoja-y': `${y}px`,
                    } as React.CSSProperties}
                  >
                    <div
                      ref={(el) => {
                        if (el) nodos.current.set(d.id, el);
                        else nodos.current.delete(d.id);
                      }}
                      className="vp-hoja-contenido absolute"
                      style={{
                        ...(variablesTema(presentacion.tema) as React.CSSProperties),
                        width: t.ancho,
                        height: t.alto,
                        left: x * vista,
                        top: y * vista,
                        transform: `scale(${dentro * vista})`,
                        transformOrigin: 'top left',
                      }}
                    >
                      <Diapositiva presentacion={presentacion} diapositiva={d} periodo={periodo} numero={numeroDe(i)} />
                    </div>
                  </div>
                  {crecida && (
                    <figcaption className="vp-solo-pantalla text-[13px] text-tinta-suave">
                      Diapositiva {i + 1}: no cabía en la hoja normal; {ajuste === 'crecer' ? 'va en una hoja más larga.' : 'se achicó para que quepa.'}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </div>
      </DetalleFijo.Provider>
    </SinAnimacion.Provider>
  );
}
