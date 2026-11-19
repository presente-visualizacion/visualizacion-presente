'use client';

import { FUENTES, fuenteCss } from '@/lib/fuentes';

const GRUPOS = ['Sin remates', 'Con remates', 'Del computador'] as const;

/** Lista de tipos de letra, con una muestra de cómo se ve el elegido. */
export function ElegirFuente({ etiqueta, valor, onCambiar, heredada, nota }: {
  etiqueta: string;
  valor: string | null;
  onCambiar: (clave: string | null) => void;
  /** Si se da, la primera opción es "la de la presentación" (valor null). */
  heredada?: string;
  nota?: string;
}) {
  const elegida = valor ?? heredada ?? 'figtree';
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-tinta">{etiqueta}</span>
      <select
        value={valor ?? ''}
        onChange={(e) => onCambiar(e.target.value || null)}
        className="h-10 w-full rounded-lg border border-linea-fuerte bg-white px-2 text-[15px] text-tinta"
      >
        {heredada !== undefined && <option value="">La de la presentación</option>}
        {GRUPOS.map((g) => (
          <optgroup key={g} label={g}>
            {FUENTES.filter((f) => f.grupo === g).map((f) => <option key={f.clave} value={heredada === undefined && f.clave === 'figtree' ? '' : f.clave}>{f.nombre}</option>)}
          </optgroup>
        ))}
      </select>
      <span className="mt-1.5 block truncate rounded-lg bg-fondo-app px-3 py-2 text-[17px] text-tinta" style={{ fontFamily: fuenteCss(elegida) }}>
        <span className="font-bold">Comité de Precios</span> · Tasa 14,5 % · $3.845
      </span>
      {nota && <span className="mt-1 block text-[13px] leading-snug text-tinta-suave">{nota}</span>}
    </label>
  );
}
