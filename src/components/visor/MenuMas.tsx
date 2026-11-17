'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Ellipsis, FileDown, FileJson, FileSpreadsheet, History } from 'lucide-react';
import type { IdPeriodo } from '@/lib/tipos';

interface Props {
  id: string;
  periodo: IdPeriodo;
  /** Diapositiva que se está viendo (desde 1), para el PDF de una sola. */
  numero: number;
  /** Muestra el historial (solo quien puede editar). */
  historial: boolean;
}

/** Menú "Más": PDF, respaldo en Excel, copia completa e historial (etapa 5). */
export function MenuMas({ id, periodo, numero, historial }: Props) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const ruta = encodeURIComponent(id);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    window.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      window.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const cerrar = () => setAbierto(false);
  const clase = 'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-tinte focus:bg-tinte focus:outline-none';

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        title="Descargar PDF o Excel, historial de versiones"
        className="flex h-10 items-center gap-1.5 rounded-full border border-linea-fuerte bg-white px-3 font-semibold text-tinta transition-colors hover:bg-tinte"
      >
        <Ellipsis size={18} aria-hidden />
        <span className="hidden sm:inline">Más</span>
      </button>
      {abierto && (
        <div role="menu" className="absolute right-0 top-12 z-40 w-80 rounded-xl border border-linea bg-white p-1.5 shadow-xl">
          <a role="menuitem" href={`/p/${ruta}/pdf?mes=${periodo}&auto=1`} target="_blank" rel="noopener" onClick={cerrar} className={clase}>
            <FileDown size={19} className="mt-0.5 shrink-0 text-primario" aria-hidden />
            <span><span className="block font-semibold">Descargar PDF</span><span className="block text-sm text-tinta-suave">Todas las del mes que estás viendo, sin enlace ni fecha en los bordes</span></span>
          </a>
          <a role="menuitem" href={`/p/${ruta}/pdf?mes=${periodo}&d=${numero}&auto=1`} target="_blank" rel="noopener" onClick={cerrar} className={clase}>
            <FileDown size={19} className="mt-0.5 shrink-0 text-tinta-suave" aria-hidden />
            <span><span className="block font-semibold">PDF solo de esta diapositiva</span><span className="block text-sm text-tinta-suave">La {numero}, en el mes que estás viendo</span></span>
          </a>
          <a role="menuitem" href={`/api/presentaciones/${ruta}/excel`} download onClick={cerrar} className={clase}>
            <FileSpreadsheet size={19} className="mt-0.5 shrink-0 text-[#0B7A4B]" aria-hidden />
            <span><span className="block font-semibold">Respaldo en Excel</span><span className="block text-sm text-tinta-suave">Todos los datos de todos los meses, con textos y cifras</span></span>
          </a>
          <a role="menuitem" href={`/api/presentaciones/${ruta}?descargar=1`} download onClick={cerrar} className={clase}>
            <FileJson size={19} className="mt-0.5 shrink-0 text-tinta-suave" aria-hidden />
            <span><span className="block font-semibold">Copia completa (.json)</span><span className="block text-sm text-tinta-suave">Para volver a importarla tal cual desde el inicio</span></span>
          </a>
          {historial && (
            <>
              <div className="my-1 h-px bg-linea" />
              <Link role="menuitem" href={`/p/${ruta}/historial`} onClick={cerrar} className={clase}>
                <History size={19} className="mt-0.5 shrink-0 text-tinta-suave" aria-hidden />
                <span><span className="block font-semibold">Historial de versiones</span><span className="block text-sm text-tinta-suave">Ver copias anteriores y volver a una</span></span>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
