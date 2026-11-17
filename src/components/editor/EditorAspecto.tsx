'use client';

// Fondo del bloque y, con la disposición "libre", su lugar en la cuadrícula
// de 12 columnas x 8 filas. El minimapa muestra todos los bloques de la
// diapositiva; un clic en una casilla lleva ahí la esquina de arriba a la
// izquierda del bloque. Ver "Disposición libre" en PLAN.md.

import { COLUMNAS_LIBRE, FILAS_LIBRE, ajustarUbicacion, ubicacionesEfectivas } from '@/lib/disposicion';
import type { Operacion } from '@/lib/edicion/operaciones';
import type { Bloque, Diapositiva, FondoBloque, Ubicacion } from '@/lib/tipos';

const FONDOS: { valor: FondoBloque | ''; nombre: string; soloTexto?: boolean }[] = [
  { valor: '', nombre: 'Sin fondo' },
  { valor: 'tinte', nombre: 'Rosado claro' },
  { valor: 'recuadro', nombre: 'Recuadro con borde' },
  { valor: 'oscuro', nombre: 'Oscuro (franja de conclusión)', soloTexto: true },
];

const CLASE_SELECT =
  'h-9 w-full rounded-lg border border-linea-fuerte bg-white px-2 text-[14px] text-tinta hover:border-tinta-suave focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25';

export function EditorAspecto({ diapositiva, bloque, indice, cambiar }: {
  diapositiva: Diapositiva;
  bloque: Bloque;
  indice: number;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
}) {
  const libre = diapositiva.disposicion === 'libre';
  const lugares = ubicacionesEfectivas(diapositiva.bloques);
  const u = lugares[indice];
  const deTexto = bloque.tipo === 'texto' || bloque.tipo === 'cifras' || bloque.tipo === 'tarjetas';
  const fondos = FONDOS.filter((f) => !f.soloTexto || deTexto || bloque.fondo === f.valor);

  const poner = (fondo: FondoBloque | null, ubicacion: Ubicacion | null) =>
    cambiar({ op: 'bloque.aspecto', bloque: bloque.id, fondo, ubicacion });
  const mover = (cambio: Partial<Ubicacion>) => poner(bloque.fondo ?? null, ajustarUbicacion({ ...u, ...cambio }));

  const numeros = (desde: number, hasta: number) => Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-tinta">Fondo del bloque</span>
        <select
          value={bloque.fondo ?? ''}
          onChange={(e) => poner((e.target.value || null) as FondoBloque | null, bloque.ubicacion ?? null)}
          className={CLASE_SELECT}
        >
          {fondos.map((f) => <option key={f.valor} value={f.valor}>{f.nombre}</option>)}
        </select>
      </label>

      {libre && u && (
        <div>
          <p className="mb-1 text-sm font-semibold text-tinta">Lugar en la diapositiva</p>
          <Minimapa lugares={lugares} actual={indice} onElegir={(columna, fila) => mover({ columna, fila })} />
          <div className="mt-2 grid grid-cols-4 gap-2">
            <label className="block text-[12px] text-tinta-suave">
              Columna
              <select aria-label="Columna donde empieza el bloque" value={u.columna} onChange={(e) => mover({ columna: Number(e.target.value) })} className={CLASE_SELECT}>
                {numeros(1, COLUMNAS_LIBRE).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="block text-[12px] text-tinta-suave">
              Ancho
              <select aria-label="Ancho del bloque en columnas" value={u.ancho} onChange={(e) => mover({ ancho: Number(e.target.value) })} className={CLASE_SELECT}>
                {numeros(1, COLUMNAS_LIBRE - u.columna + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="block text-[12px] text-tinta-suave">
              Fila
              <select aria-label="Fila donde empieza el bloque" value={u.fila} onChange={(e) => mover({ fila: Number(e.target.value) })} className={CLASE_SELECT}>
                {numeros(1, FILAS_LIBRE).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="block text-[12px] text-tinta-suave">
              Alto
              <select aria-label="Alto del bloque en filas" value={u.alto} onChange={(e) => mover({ alto: Number(e.target.value) })} className={CLASE_SELECT}>
                {numeros(1, FILAS_LIBRE - u.fila + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <p className="mt-1 text-[13px] leading-snug text-tinta-suave">
            La diapositiva es una cuadrícula de 12 columnas y hasta 8 filas. Toca una casilla para llevar el bloque ahí; el ancho y el alto se cuentan en casillas.
          </p>
        </div>
      )}
    </div>
  );
}

/** Dibujo chico de la cuadrícula con todos los bloques numerados. */
function Minimapa({ lugares, actual, onElegir }: { lugares: Ubicacion[]; actual: number; onElegir: (columna: number, fila: number) => void }) {
  const casillas: React.ReactNode[] = [];
  for (let fila = 1; fila <= FILAS_LIBRE; fila++) {
    for (let columna = 1; columna <= COLUMNAS_LIBRE; columna++) {
      casillas.push(
        <button
          key={`${fila}-${columna}`}
          type="button"
          aria-label={`Llevar el bloque a la columna ${columna}, fila ${fila}`}
          onClick={() => onElegir(columna, fila)}
          className="rounded-[2px] bg-fondo-app hover:bg-linea-fuerte"
          style={{ gridColumn: columna, gridRow: fila }}
        />,
      );
    }
  }
  return (
    <div
      className="relative grid aspect-[16/9] w-full gap-[2px] rounded-lg border border-linea-fuerte bg-white p-[3px]"
      style={{ gridTemplateColumns: `repeat(${COLUMNAS_LIBRE}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${FILAS_LIBRE}, minmax(0, 1fr))` }}
    >
      {casillas}
      {lugares.map((u, i) => (
        <div
          key={i}
          aria-hidden
          className={`pointer-events-none flex items-center justify-center rounded-[4px] border text-[12px] font-bold ${
            i === actual ? 'z-10 border-primario bg-primario/80 text-white' : 'border-tinta-suave/40 bg-tinta-suave/15 text-tinta-suave'
          }`}
          style={{ gridColumn: `${u.columna} / span ${u.ancho}`, gridRow: `${u.fila} / span ${u.alto}` }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}
