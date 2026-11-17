'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { ALTO, ANCHO } from '@/components/diapositivas/Diapositiva';

/**
 * Escala la diapositiva (dibujada a 1280 x 720) para que quepa completa en el
 * espacio disponible, sin deformarla. Así se ve igual en el visor, en pantalla
 * completa y, más adelante, en el PDF.
 */
export function Lienzo({ children, marco = true }: { children: React.ReactNode; marco?: boolean }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0);

  useLayoutEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const medir = () => setEscala(Math.min(el.clientWidth / ANCHO, el.clientHeight / ALTO));
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={contenedor} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {escala > 0 && (
        <div
          className={`relative shrink-0 overflow-hidden bg-white ${marco ? 'rounded-md shadow-[0_1px_2px_rgba(36,26,32,0.06),0_16px_40px_-16px_rgba(36,26,32,0.22)] ring-1 ring-linea' : ''}`}
          style={{ width: ANCHO * escala, height: ALTO * escala }}
        >
          <div style={{ width: ANCHO, height: ALTO, transform: `scale(${escala})`, transformOrigin: 'top left' }}>{children}</div>
        </div>
      )}
    </div>
  );
}
