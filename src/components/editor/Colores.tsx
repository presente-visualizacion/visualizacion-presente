'use client';

// Elegir colores en el panel: fondo y letra de un bloque, fondo de una
// diapositiva, y color o negrita para palabras dentro de un texto.

import { Bold, Check, Paintbrush } from 'lucide-react';
import { useState } from 'react';
import { COLORES_TEXTO, conColor } from '@/lib/formatoTexto';

export const FONDOS_SUGERIDOS: { nombre: string; color: string }[] = [
  { nombre: 'Rosado claro', color: '#FCE8EF' },
  { nombre: 'Azul claro', color: '#E8F1FB' },
  { nombre: 'Durazno', color: '#FDF0E4' },
  { nombre: 'Verde claro', color: '#E6F5F0' },
  { nombre: 'Lila', color: '#F1ECFA' },
  { nombre: 'Gris claro', color: '#F3F1F2' },
  { nombre: 'Magenta', color: '#D4145A' },
  { nombre: 'Azul oscuro', color: '#1F3A5F' },
  { nombre: 'Oscuro', color: '#2A2330' },
];

export const LETRAS_SUGERIDAS: { nombre: string; color: string }[] = [
  { nombre: 'Tinta', color: '#241A20' },
  ...COLORES_TEXTO.map((c) => ({ nombre: c.nombre[0].toUpperCase() + c.nombre.slice(1), color: c.color })),
  { nombre: 'Blanco', color: '#FFFFFF' },
];

/** Muestras de color, "Ninguno" y un color a elección. */
export function ElegirColor({ etiqueta, valor, opciones, onCambiar, ninguno = 'Ninguno', nota }: {
  etiqueta: string;
  valor: string | null;
  opciones: { nombre: string; color: string }[];
  onCambiar: (color: string | null) => void;
  ninguno?: string;
  nota?: React.ReactNode;
}) {
  const propio = valor !== null && !opciones.some((o) => o.color.toUpperCase() === valor.toUpperCase());
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-tinta">{etiqueta}</p>
      <div role="radiogroup" aria-label={etiqueta} className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          role="radio"
          aria-checked={valor === null}
          onClick={() => onCambiar(null)}
          className={`h-8 rounded-full border px-2.5 text-[13px] ${valor === null ? 'border-primario bg-tinte font-semibold text-tinta' : 'border-linea-fuerte text-tinta-suave hover:bg-fondo-app'}`}
        >
          {ninguno}
        </button>
        {opciones.map((o) => {
          const elegido = valor?.toUpperCase() === o.color.toUpperCase();
          return (
            <button
              key={o.color}
              type="button"
              role="radio"
              aria-checked={elegido}
              aria-label={o.nombre}
              title={o.nombre}
              onClick={() => onCambiar(o.color)}
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${elegido ? 'ring-2 ring-primario ring-offset-1' : ''} border-linea-fuerte`}
              style={{ background: o.color }}
            >
              {elegido && <Check size={15} className={o.color === '#FFFFFF' || o.color.startsWith('#F') ? 'text-tinta' : 'text-white'} aria-hidden />}
            </button>
          );
        })}
        <label
          title="Otro color"
          className={`relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-linea-fuerte ${propio ? 'ring-2 ring-primario ring-offset-1' : ''}`}
          style={propio ? { background: valor! } : { background: 'conic-gradient(#D4145A, #E36A0B, #A1790F, #0B9B7A, #2274C4, #8250D6, #D4145A)' }}
        >
          <span className="sr-only">Otro color</span>
          <input
            type="color"
            value={valor ?? '#D4145A'}
            onChange={(e) => onCambiar(e.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
      {nota && <p className="mt-1 text-[13px] leading-snug text-tinta-suave">{nota}</p>}
    </div>
  );
}

/**
 * Botones sobre un campo de texto: negrita y color para lo que esté
 * seleccionado. Escriben las marcas **así** y {azul:así}.
 */
export function FormatoSeleccion({ idCampo, valor, onCambiar }: { idCampo: string; valor: string; onCambiar: (valor: string) => void }) {
  const [aviso, setAviso] = useState(false);
  const aplicar = (envolver: (seleccion: string) => string) => {
    const campo = document.getElementById(idCampo) as HTMLTextAreaElement | HTMLInputElement | null;
    if (!campo) return;
    const desde = campo.selectionStart ?? 0;
    const hasta = campo.selectionEnd ?? 0;
    if (hasta <= desde) {
      setAviso(true);
      campo.focus();
      return;
    }
    setAviso(false);
    // Línea por línea, y sin tocar la marca de viñeta o de letra grande del
    // comienzo ("- ", "# "): si no, la viñeta dejaría de serlo.
    const nuevo = valor.slice(desde, hasta).split('\n').map((linea, i) => {
      const alComienzo = i > 0 || desde === 0 || valor[desde - 1] === '\n';
      const marca = (alComienzo ? /^\s*(?:- |# )?\s*/ : /^\s*/).exec(linea)?.[0] ?? '';
      const resto = linea.slice(marca.length);
      const fin = /\s*$/.exec(resto)?.[0] ?? '';
      const centro = resto.slice(0, resto.length - fin.length);
      return centro ? marca + envolver(centro) + fin : linea;
    }).join('\n');
    onCambiar(valor.slice(0, desde) + nuevo + valor.slice(hasta));
    // Deja seleccionado lo que se acaba de envolver.
    requestAnimationFrame(() => {
      campo.focus();
      campo.setSelectionRange(desde, desde + nuevo.length);
    });
  };
  // mousedown con preventDefault: el campo no pierde la selección al tocar el botón.
  const sinPerderSeleccion = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="mb-1.5">
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onMouseDown={sinPerderSeleccion}
          onClick={() => aplicar((s) => `**${s}**`)}
          title="Negrita para lo seleccionado"
          aria-label="Negrita para lo seleccionado"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-linea-fuerte text-tinta hover:bg-tinte"
        >
          <Bold size={14} aria-hidden />
        </button>
        <span className="ml-1 flex items-center gap-1 text-[12px] text-tinta-suave"><Paintbrush size={13} aria-hidden /> Color:</span>
        {COLORES_TEXTO.map((c) => (
          <button
            key={c.nombre}
            type="button"
            onMouseDown={sinPerderSeleccion}
            onClick={() => aplicar((s) => conColor(s, c.nombre))}
            title={`Pintar lo seleccionado de ${c.nombre}`}
            aria-label={`Pintar lo seleccionado de ${c.nombre}`}
            className="h-6 w-6 rounded-full border border-white ring-1 ring-linea-fuerte hover:scale-110"
            style={{ background: c.color }}
          />
        ))}
      </div>
      {aviso && <p className="mt-1 text-[12px] text-tinta-suave">Primero selecciona en el cuadro las palabras que quieres cambiar.</p>}
    </div>
  );
}
