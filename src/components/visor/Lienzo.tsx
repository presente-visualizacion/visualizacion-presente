'use client';

import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { ALTO, ANCHO } from '@/components/diapositivas/Diapositiva';

/**
 * Escala la diapositiva (dibujada a 1280 x 720) para que quepa completa en el
 * espacio disponible, sin deformarla. Así se ve igual en el visor, en pantalla
 * completa y en el PDF.
 *
 * `zoom` agranda (o achica) sobre ese tamaño: con más de 1 la diapositiva no
 * cabe y el espacio se desplaza (rueda, barras o arrastrando; ver Visor).
 */
export const Lienzo = forwardRef<HTMLDivElement, { children: React.ReactNode; marco?: boolean; zoom?: number }>(function Lienzo(
  { children, marco = true, zoom = 1 },
  ref,
) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const [ajuste, setAjuste] = useState(0);

  useLayoutEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    // offsetWidth incluye las barras de desplazamiento: así el tamaño que cabe
    // no cambia cuando aparecen al hacer zoom.
    const medir = () => setAjuste(Math.min(el.offsetWidth / ANCHO, el.offsetHeight / ALTO));
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // Al cambiar el zoom, el mismo punto queda en el centro de la vista.
  const centro = useRef({ x: 0.5, y: 0.5 });
  useLayoutEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const alDesplazar = () => {
      if (el.scrollWidth > el.clientWidth) centro.current.x = (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth;
      if (el.scrollHeight > el.clientHeight) centro.current.y = (el.scrollTop + el.clientHeight / 2) / el.scrollHeight;
    };
    el.addEventListener('scroll', alDesplazar, { passive: true });
    return () => el.removeEventListener('scroll', alDesplazar);
  }, []);
  useLayoutEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    if (zoom <= 1) { centro.current = { x: 0.5, y: 0.5 }; return; }
    el.scrollLeft = centro.current.x * el.scrollWidth - el.clientWidth / 2;
    el.scrollTop = centro.current.y * el.scrollHeight - el.clientHeight / 2;
  }, [zoom, ajuste]);

  const escala = ajuste * zoom;
  const unir = (el: HTMLDivElement | null) => {
    contenedor.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  return (
    // m-auto centra la diapositiva cuando cabe y, si es más grande, deja
    // desplazarse desde el borde (con justify-center se cortaría la izquierda).
    <div ref={unir} data-vp-lienzo className={`absolute inset-0 flex ${zoom > 1 ? 'overflow-auto overscroll-contain' : 'overflow-hidden'}`}>
      {escala > 0 && (
        <div
          className={`relative m-auto shrink-0 overflow-hidden bg-white ${marco ? 'rounded-md shadow-[0_1px_2px_rgba(36,26,32,0.06),0_16px_40px_-16px_rgba(36,26,32,0.22)] ring-1 ring-linea' : ''}`}
          style={{ width: ANCHO * escala, height: ALTO * escala }}
        >
          <div style={{ width: ANCHO, height: ALTO, transform: `scale(${escala})`, transformOrigin: 'top left' }}>{children}</div>
        </div>
      )}
    </div>
  );
});
