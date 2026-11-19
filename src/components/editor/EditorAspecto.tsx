'use client';

// Fondo del bloque y, con la disposición "libre", su lugar en la cuadrícula
// de 12 columnas x 8 filas. El minimapa muestra todos los bloques de la
// diapositiva; un clic en una casilla lleva ahí la esquina de arriba a la
// izquierda del bloque. Ver "Disposición libre" en PLAN.md.

import { COLUMNAS_LIBRE, FILAS_LIBRE, ajustarUbicacion, ubicacionesEfectivas } from '@/lib/disposicion';
import type { Operacion } from '@/lib/edicion/operaciones';
import { ElegirColor, FONDOS_SUGERIDOS, LETRAS_SUGERIDAS } from './Colores';
import { ElegirFuente } from './ElegirFuente';
import { ElegirTamano } from './ElegirTamano';
import type { Bloque, Diapositiva, FondoBloque, Ubicacion } from '@/lib/tipos';

const FONDOS: { valor: FondoBloque | ''; nombre: string; soloTexto?: boolean }[] = [
  { valor: '', nombre: 'Sin fondo' },
  { valor: 'tinte', nombre: 'Rosado claro' },
  { valor: 'recuadro', nombre: 'Recuadro con borde' },
  { valor: 'oscuro', nombre: 'Oscuro (franja de conclusión)', soloTexto: true },
];

const CLASE_SELECT =
  'h-9 w-full rounded-lg border border-linea-fuerte bg-white px-2 text-[14px] text-tinta hover:border-tinta-suave focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25';

export function EditorAspecto({ diapositiva, bloque, indice, cambiar, fuentePresentacion }: {
  fuentePresentacion?: string;
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
        <span className="mb-1 block text-sm font-semibold text-tinta">Estilo del fondo</span>
        <select
          value={bloque.fondo ?? ''}
          onChange={(e) => poner((e.target.value || null) as FondoBloque | null, bloque.ubicacion ?? null)}
          className={CLASE_SELECT}
        >
          {fondos.map((f) => <option key={f.valor} value={f.valor}>{f.nombre}</option>)}
        </select>
      </label>

      <ElegirFuente
        etiqueta="Tipo de letra"
        valor={bloque.fuente ?? null}
        heredada={fuentePresentacion ?? 'figtree'}
        onCambiar={(valor) => cambiar({ op: 'bloque.letra', bloque: bloque.id, valor })}
      />
      <ElegirTamano
        etiqueta="Tamaño de la letra"
        valor={bloque.letra ?? null}
        onCambiar={(valor) => cambiar({ op: 'bloque.tamano', bloque: bloque.id, valor }, `tamano-${bloque.id}`)}
        nota={bloque.tipo === 'texto' || bloque.tipo === 'tarjetas'
          ? 'Si el texto no cabe en el cuadro, la letra igual se achica sola para que quepa.'
          : 'Agranda o achica toda la letra del bloque, también la de su título y su nota.'}
      />
      <ElegirColor
        etiqueta="Color de fondo"
        valor={bloque.colorFondo ?? null}
        opciones={FONDOS_SUGERIDOS}
        ninguno={bloque.fondo ? 'El del estilo' : 'Ninguno'}
        onCambiar={(fondo) => cambiar({ op: 'bloque.colores', bloque: bloque.id, fondo, texto: bloque.colorTexto ?? null })}
        nota={bloque.colorFondo && bloque.fondo ? 'El color manda sobre el estilo del fondo.' : undefined}
      />
      <ElegirColor
        etiqueta="Color de la letra"
        valor={bloque.colorTexto ?? null}
        opciones={LETRAS_SUGERIDAS}
        ninguno="Automático"
        onCambiar={(texto) => cambiar({ op: 'bloque.colores', bloque: bloque.id, fondo: bloque.colorFondo ?? null, texto })}
        nota={bloque.tipo === 'grafico' ? 'En los gráficos cambia el título y la nota; los ejes siguen en tinta.' : 'Para pintar solo algunas palabras, usa los colores de arriba del cuadro de texto.'}
      />

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
            Lo más cómodo es arrastrar el bloque sobre la diapositiva. Aquí también puedes tocar el dibujo para llevarlo ahí o ajustar los números: la diapositiva tiene 48 columnas y 32 filas.
          </p>
        </div>
      )}
    </div>
  );
}

/** Dibujo chico de la cuadrícula con todos los bloques numerados. Tocar lleva el bloque ahí. */
function Minimapa({ lugares, actual, onElegir }: { lugares: Ubicacion[]; actual: number; onElegir: (columna: number, fila: number) => void }) {
  const elegir = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const columna = Math.min(COLUMNAS_LIBRE, Math.max(1, Math.floor(((e.clientX - r.left) / r.width) * COLUMNAS_LIBRE) + 1));
    const fila = Math.min(FILAS_LIBRE, Math.max(1, Math.floor(((e.clientY - r.top) / r.height) * FILAS_LIBRE) + 1));
    onElegir(columna, fila);
  };
  return (
    <div
      aria-hidden
      onClick={elegir}
      title="Toca donde quieres que empiece el bloque"
      className="relative grid aspect-[16/9] w-full cursor-crosshair rounded-lg border border-linea-fuerte bg-white"
      style={{
        gridTemplateColumns: `repeat(${COLUMNAS_LIBRE}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${FILAS_LIBRE}, minmax(0, 1fr))`,
        backgroundImage: 'linear-gradient(to right, #EFEAED 1px, transparent 1px), linear-gradient(to bottom, #EFEAED 1px, transparent 1px)',
        backgroundSize: `calc(100% / ${COLUMNAS_LIBRE / 4}) calc(100% / ${FILAS_LIBRE / 4})`,
      }}
    >
      {lugares.map((u, i) => (
        <div
          key={i}
          aria-hidden
          className={`pointer-events-none m-[1px] flex items-center justify-center rounded-[4px] border text-[12px] font-bold ${
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
