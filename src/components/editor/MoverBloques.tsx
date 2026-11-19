'use client';

// Mover y agrandar bloques arrastrando sobre la diapositiva (al editar).
// Cada bloque tiene un marco: se arrastra para moverlo y se tira de los bordes
// o las esquinas para cambiar su tamaño. Todo se acomoda a la cuadrícula libre
// de 12 columnas x 8 filas; si la diapositiva no era libre, pasa a serlo con
// todo donde estaba. Ver "Mover bloques en la diapositiva" en PLAN.md.

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ChartColumn, Hash, LayoutGrid, Pencil, Table2, Trash2, Type } from 'lucide-react';
import { COLUMNAS_LIBRE, FILAS_LIBRE, ubicacionArrastrada, type Bordes } from '@/lib/disposicion';
import type { Operacion } from '@/lib/edicion/operaciones';
import { lugaresLibres, opsQuitarBloque, opsUbicarBloque } from '@/lib/edicion/plantillas';
import type { Bloque, Diapositiva, Presentacion, Ubicacion } from '@/lib/tipos';

const ESPACIO_X = 28;
const ESPACIO_Y = 14;
const NOMBRES: Record<Bloque['tipo'], string> = { grafico: 'Gráfico', tabla: 'Tabla', texto: 'Texto', cifras: 'Cifras', tarjetas: 'Tarjetas' };
export const ICONOS_BLOQUE = { grafico: ChartColumn, tabla: Table2, texto: Type, cifras: Hash, tarjetas: LayoutGrid };

interface Caja { x: number; y: number; w: number; h: number }
interface Arrastre {
  bloque: string;
  bordes: Bordes | null; // null: mover
  x0: number;
  y0: number;
  desde: Ubicacion;
  ahora: Ubicacion;
  movio: boolean;
}

const igual = (a: Ubicacion, b: Ubicacion) => a.columna === b.columna && a.ancho === b.ancho && a.fila === b.fila && a.alto === b.alto;

const TIRADORES: { nombre: string; bordes: Bordes; clase: string; cursor: string }[] = [
  { nombre: 'esquina de arriba a la izquierda', bordes: { izq: true, der: false, arr: true, aba: false }, clase: '-left-[7px] -top-[7px]', cursor: 'nwse-resize' },
  { nombre: 'esquina de arriba a la derecha', bordes: { izq: false, der: true, arr: true, aba: false }, clase: '-right-[7px] -top-[7px]', cursor: 'nesw-resize' },
  { nombre: 'esquina de abajo a la izquierda', bordes: { izq: true, der: false, arr: false, aba: true }, clase: '-bottom-[7px] -left-[7px]', cursor: 'nesw-resize' },
  { nombre: 'esquina de abajo a la derecha', bordes: { izq: false, der: true, arr: false, aba: true }, clase: '-bottom-[7px] -right-[7px]', cursor: 'nwse-resize' },
  { nombre: 'borde de arriba', bordes: { izq: false, der: false, arr: true, aba: false }, clase: 'left-1/2 -top-[7px] -translate-x-1/2', cursor: 'ns-resize' },
  { nombre: 'borde de abajo', bordes: { izq: false, der: false, arr: false, aba: true }, clase: 'left-1/2 -bottom-[7px] -translate-x-1/2', cursor: 'ns-resize' },
  { nombre: 'borde izquierdo', bordes: { izq: true, der: false, arr: false, aba: false }, clase: '-left-[7px] top-1/2 -translate-y-1/2', cursor: 'ew-resize' },
  { nombre: 'borde derecho', bordes: { izq: false, der: true, arr: false, aba: false }, clase: '-right-[7px] top-1/2 -translate-y-1/2', cursor: 'ew-resize' },
];

export function MoverBloques({ presentacion, diapositiva, seleccionado, onSeleccionar, cambiar }: {
  presentacion: Presentacion;
  diapositiva: Diapositiva;
  seleccionado: string | null;
  onSeleccionar: (bloque: string | null) => void;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const [cuerpo, setCuerpo] = useState<Caja | null>(null);
  const [cajas, setCajas] = useState<Record<string, Caja>>({});
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const lugares = lugaresLibres(diapositiva);
  const lugarDe = (id: string) => lugares[diapositiva.bloques.findIndex((b) => b.id === id)];

  // Dónde está cada cosa, en px de la diapositiva (1280 x 720).
  const medir = useCallback(() => {
    const el = raiz.current;
    const lienzo = el?.parentElement;
    if (!el || !lienzo) return;
    const base = el.getBoundingClientRect();
    const escala = base.width / 1280 || 1;
    const relativa = (r: DOMRect): Caja => ({ x: (r.left - base.left) / escala, y: (r.top - base.top) / escala, w: r.width / escala, h: r.height / escala });
    const c = lienzo.querySelector('[data-vp-cuerpo]');
    setCuerpo(c ? relativa(c.getBoundingClientRect()) : null);
    const nuevas: Record<string, Caja> = {};
    lienzo.querySelectorAll<HTMLElement>('[data-vp-bloque]').forEach((b) => {
      const id = b.dataset.vpBloque!;
      if (!b.closest('[data-vp-cuerpo]')) return;
      nuevas[id] = relativa(b.getBoundingClientRect());
    });
    setCajas(nuevas);
  }, []);

  useLayoutEffect(() => {
    medir();
    const t = setTimeout(medir, 400);
    const el = raiz.current;
    const observador = new ResizeObserver(medir);
    if (el) observador.observe(el);
    return () => { clearTimeout(t); observador.disconnect(); };
  }, [medir, diapositiva]);

  if (!cuerpo) return <div ref={raiz} className="pointer-events-none absolute inset-0" />;

  const celdaX = (cuerpo.w - (COLUMNAS_LIBRE - 1) * ESPACIO_X) / COLUMNAS_LIBRE;
  const celdaY = (cuerpo.h - (FILAS_LIBRE - 1) * ESPACIO_Y) / FILAS_LIBRE;
  const cajaDe = (u: Ubicacion): Caja => ({
    x: cuerpo.x + (u.columna - 1) * (celdaX + ESPACIO_X),
    y: cuerpo.y + (u.fila - 1) * (celdaY + ESPACIO_Y),
    w: u.ancho * celdaX + (u.ancho - 1) * ESPACIO_X,
    h: u.alto * celdaY + (u.alto - 1) * ESPACIO_Y,
  });
  const escala = () => (raiz.current?.getBoundingClientRect().width ?? 1280) / 1280;

  const empezar = (e: React.PointerEvent, bloque: string, bordes: Bordes | null) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const desde = lugarDe(bloque);
    onSeleccionar(bloque);
    setArrastre({ bloque, bordes, x0: e.clientX, y0: e.clientY, desde, ahora: desde, movio: false });
  };
  const mover = (e: React.PointerEvent) => {
    if (!arrastre) return;
    const k = escala();
    const dx = (e.clientX - arrastre.x0) / k;
    const dy = (e.clientY - arrastre.y0) / k;
    const ahora = ubicacionArrastrada(arrastre.desde, Math.round(dx / (celdaX + ESPACIO_X)), Math.round(dy / (celdaY + ESPACIO_Y)), arrastre.bordes);
    setArrastre({ ...arrastre, ahora, movio: arrastre.movio || Math.hypot(dx, dy) > 4 });
  };
  const soltar = () => {
    if (!arrastre) return;
    if (!igual(arrastre.ahora, arrastre.desde)) cambiar(opsUbicarBloque(diapositiva, arrastre.bloque, arrastre.ahora));
    setArrastre(null);
  };

  // Con el teclado: flechas mueven el bloque elegido; con Mayúscula, cambian su tamaño.
  const teclear = (e: React.KeyboardEvent, bloque: string) => {
    const pasos: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const paso = pasos[e.key];
    if (!paso) {
      if (e.key === 'Escape') onSeleccionar(null);
      return;
    }
    e.preventDefault();
    const u = lugarDe(bloque);
    const nueva = ubicacionArrastrada(u, paso[0], paso[1], e.shiftKey ? { izq: false, der: true, arr: false, aba: true } : null);
    if (!igual(nueva, u)) cambiar(opsUbicarBloque(diapositiva, bloque, nueva), `teclas-${bloque}`);
  };

  const fantasma = arrastre ? cajaDe(arrastre.ahora) : null;

  return (
    <div
      ref={raiz}
      className="absolute inset-0"
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerCancel={() => setArrastre(null)}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onSeleccionar(null); }}
    >
      {/* La cuadrícula, mientras se arrastra. */}
      {arrastre && (
        <div className="pointer-events-none absolute" style={{ left: cuerpo.x, top: cuerpo.y, width: cuerpo.w, height: cuerpo.h }}>
          {Array.from({ length: COLUMNAS_LIBRE * FILAS_LIBRE }, (_, i) => {
            const c = cajaDe({ columna: (i % COLUMNAS_LIBRE) + 1, fila: Math.floor(i / COLUMNAS_LIBRE) + 1, ancho: 1, alto: 1 });
            return <div key={i} className="absolute rounded-[3px] bg-primario/[0.05] ring-1 ring-primario/15" style={{ left: c.x - cuerpo.x, top: c.y - cuerpo.y, width: c.w, height: c.h }} />;
          })}
        </div>
      )}

      {diapositiva.bloques.map((b, i) => {
        const caja = cajas[b.id];
        if (!caja) return null;
        const elegido = seleccionado === b.id;
        const Icono = ICONOS_BLOQUE[b.tipo];
        const enArrastre = arrastre?.bloque === b.id;
        return (
          <div
            key={b.id}
            role="button"
            tabIndex={0}
            aria-label={`Bloque ${i + 1}, ${NOMBRES[b.tipo]}${b.titulo ? `: ${b.titulo}` : ''}. Arrastra para moverlo; flechas para moverlo, Mayúscula y flechas para cambiar el tamaño.`}
            aria-pressed={elegido}
            onPointerDown={(e) => empezar(e, b.id, null)}
            onKeyDown={(e) => teclear(e, b.id)}
            onFocus={() => onSeleccionar(b.id)}
            className={`group absolute cursor-move rounded-[10px] outline-none transition-[box-shadow] ${
              elegido ? 'z-10 shadow-[0_0_0_3px_var(--color-primario)]' : 'hover:shadow-[0_0_0_2px_rgba(212,20,90,0.45)] focus-visible:shadow-[0_0_0_3px_var(--color-primario)]'
            } ${enArrastre && arrastre?.movio ? 'opacity-40' : ''}`}
            style={{ left: caja.x - 6, top: caja.y - 6, width: caja.w + 12, height: caja.h + 12 }}
          >
            <span className={`absolute -top-[30px] left-0 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primario px-2.5 py-1 text-[13px] font-semibold text-white shadow ${elegido ? '' : 'opacity-0 group-hover:opacity-100'}`}>
              <Icono size={13} aria-hidden /> {i + 1}. {NOMBRES[b.tipo]}
            </span>
            {elegido && !arrastre && (
              <span className="absolute -top-[32px] right-0 flex items-center gap-1">
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => document.getElementById(`editor-bloque-${b.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex h-[26px] items-center gap-1 rounded-full bg-white px-2.5 text-[13px] font-semibold text-tinta shadow ring-1 ring-linea-fuerte hover:bg-tinte"
                >
                  <Pencil size={13} aria-hidden /> Editar
                </button>
                <button
                  type="button"
                  aria-label={`Quitar el bloque ${i + 1}`}
                  title="Quitar el bloque (Ctrl+Z lo devuelve)"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => { cambiar(opsQuitarBloque(presentacion, b.id)); onSeleccionar(null); }}
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white text-[#8E1015] shadow ring-1 ring-linea-fuerte hover:bg-[#FDECEC]"
                >
                  <Trash2 size={13} aria-hidden />
                </button>
              </span>
            )}
            {elegido && TIRADORES.map((t) => (
              <span
                key={t.nombre}
                aria-hidden
                title={`Tirar del ${t.nombre} para cambiar el tamaño`}
                onPointerDown={(e) => empezar(e, b.id, t.bordes)}
                className={`absolute h-[14px] w-[14px] rounded-[4px] border-2 border-primario bg-white ${t.clase}`}
                style={{ cursor: t.cursor }}
              />
            ))}
          </div>
        );
      })}

      {fantasma && arrastre?.movio && (
        <div
          className="pointer-events-none absolute rounded-[10px] border-2 border-dashed border-primario bg-primario/10"
          style={{ left: fantasma.x, top: fantasma.y, width: fantasma.w, height: fantasma.h }}
        >
          <span className="absolute bottom-2 right-2 rounded-full bg-primario px-2 py-0.5 text-[12px] font-semibold text-white">
            {arrastre.ahora.ancho} x {arrastre.ahora.alto}
          </span>
        </div>
      )}
    </div>
  );
}

/** Barra "Insertar" sobre la diapositiva. */
export function BarraInsertar({ onInsertar }: { onInsertar: (tipo: Bloque['tipo']) => void }) {
  const tipos: Bloque['tipo'][] = ['texto', 'grafico', 'tabla', 'cifras', 'tarjetas'];
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[14px]">
      <span className="mr-1 font-semibold text-tinta">Insertar:</span>
      {tipos.map((t) => {
        const Icono = ICONOS_BLOQUE[t];
        return (
          <button
            key={t}
            type="button"
            onClick={() => onInsertar(t)}
            className="flex h-8 items-center gap-1.5 rounded-full border border-linea-fuerte bg-white px-3 text-tinta hover:bg-tinte"
          >
            <Icono size={15} aria-hidden /> {t === 'texto' ? 'Cuadro de texto' : NOMBRES[t]}
          </button>
        );
      })}
    </div>
  );
}
