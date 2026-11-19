'use client';

// Pestaña "Presentación" del panel: descripción, meses y colores del tema.

import { CalendarMinus, CalendarPlus, Download, Eraser, RotateCcw, TriangleAlert } from 'lucide-react';
import { contraste, CONTRASTE_MINIMO, esColor } from '@/lib/color';
import type { Operacion } from '@/lib/edicion/operaciones';
import { mesSiguiente } from '@/lib/edicion/plantillas';
import { TOPES } from '@/lib/edicion/validar';
import { nombrePeriodo } from '@/lib/periodos';
import { TEMA_PRESENTE } from '@/lib/tema';
import type { IdPeriodo, Presentacion, Tema } from '@/lib/tipos';
import { BotonConfirmar, Campo, CLASE_BOTON, CLASE_BOTON_PRINCIPAL, Subtitulo } from './piezas';
import { ElegirFuente } from './ElegirFuente';
import { ElegirTamano } from './ElegirTamano';
import { opsVaciarMes } from '@/lib/edicion/vaciar';

interface Props {
  presentacion: Presentacion;
  periodo: IdPeriodo;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
  /** Lleva la barra de meses a ese mes. */
  onPeriodo: (periodo: IdPeriodo) => void;
}

export function PanelPresentacion({ presentacion, periodo, cambiar, onPeriodo }: Props) {
  const { periodos, tema } = presentacion;
  const ultimo = periodos[periodos.length - 1];
  const siguiente = mesSiguiente(ultimo);
  const lleno = periodos.length >= TOPES.periodos;

  const nuevoMes = () => {
    cambiar({ op: 'periodo.agregar', periodo: siguiente, copiarDe: ultimo });
    onPeriodo(siguiente);
  };
  const quitarMes = () => {
    const resto = periodos.filter((m) => m !== periodo);
    cambiar({ op: 'periodo.quitar', periodo });
    onPeriodo(resto[Math.min(periodos.indexOf(periodo), resto.length - 1)]);
  };
  const ponerTema = (cambios: Partial<Tema>) => cambiar({ op: 'tema', valor: { ...tema, ...cambios } });
  const igualAPresente = ['primario', 'neutro'].every((k) => tema[k as 'primario'] === TEMA_PRESENTE[k as 'primario'])
    && tema.series.join() === TEMA_PRESENTE.series.join();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Campo
          etiqueta="Descripción"
          valor={presentacion.descripcion ?? ''}
          multilinea
          filas={2}
          maximo={TOPES.descripcion}
          marcador="Opcional: se ve en la lista de presentaciones"
          onCambiar={(valor) => cambiar({ op: 'presentacion.descripcion', valor })}
        />
      </section>

      <section aria-labelledby="panel-meses" className="space-y-3 border-t border-linea pt-5">
        <h2 id="panel-meses" className="text-[13px] font-semibold uppercase tracking-wide text-tinta-suave">Meses</h2>
        <p className="text-[15px] text-tinta">
          {periodos.length === 1 ? 'Un mes' : `${periodos.length} meses`}: de {nombrePeriodo(periodos[0])} a {nombrePeriodo(ultimo)}.
        </p>
        <div>
          <button type="button" className={CLASE_BOTON_PRINCIPAL} onClick={nuevoMes} disabled={lleno}>
            <CalendarPlus size={16} aria-hidden /> Nuevo mes: {nombrePeriodo(siguiente)}
          </button>
          <p className="mt-1.5 text-[13px] leading-snug text-tinta-suave">
            Copia en el mes nuevo todo lo que es propio de cada mes en {nombrePeriodo(ultimo)} (datos, textos y cifras), para que solo cambies lo que se movió.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotonConfirmar
            etiqueta={`Dejar en blanco las cifras de ${nombrePeriodo(periodo)}`}
            pregunta={`Se borrarán los números de ${nombrePeriodo(periodo)} en los datos y en las cifras escritas a mano que son propios de cada mes. Quedan las filas, los nombres, las etiquetas y los textos, listos para llenar. Lo que es igual en todos los meses no se toca.`}
            confirmar="Dejar en blanco"
            icono={<Eraser size={16} aria-hidden />}
            inactivo={!opsVaciarMes(presentacion, periodo).length}
            onConfirmar={() => cambiar(opsVaciarMes(presentacion, periodo))}
          />
          <BotonConfirmar
            etiqueta={`Quitar ${nombrePeriodo(periodo)}`}
            pregunta={`Se quitará ${nombrePeriodo(periodo)} con todos sus datos, textos y cifras propios.`}
            confirmar="Quitar el mes"
            icono={<CalendarMinus size={16} aria-hidden />}
            inactivo={periodos.length === 1}
            onConfirmar={quitarMes}
          />
        </div>
      </section>

      <section className="border-t border-linea pt-5">
        <ElegirFuente
          etiqueta="Tipo de letra de las diapositivas"
          valor={tema.fuente && tema.fuente !== 'figtree' ? tema.fuente : null}
          onCambiar={(fuente) => {
            const { fuente: _f, ...resto } = tema;
            cambiar({ op: 'tema', valor: fuente ? { ...resto, fuente } : resto });
          }}
          nota="Figtree es la de siempre. Cada bloque puede tener la suya (en el bloque, Aspecto)."
        />
        <div className="mt-4">
          <ElegirTamano
            etiqueta="Tamaño de toda la letra"
            valor={tema.letra ?? null}
            onCambiar={(letra) => {
              const { letra: _l, ...resto } = tema;
              cambiar({ op: 'tema', valor: letra ? { ...resto, letra } : resto }, 'tamano-tema');
            }}
            nota="Títulos, textos, cifras, tablas y gráficos de todas las diapositivas. Cada bloque y cada título pueden ajustarse aparte."
          />
        </div>
      </section>

      <section aria-labelledby="panel-colores" className="space-y-3 border-t border-linea pt-5">
        <h2 id="panel-colores" className="text-[13px] font-semibold uppercase tracking-wide text-tinta-suave">Colores</h2>
        <FilaColor nombre="Principal" nota="Títulos, mes elegido y lo que se resalta" color={tema.primario} onCambiar={(primario) => ponerTema({ primario })} />
        <div>
          <Subtitulo>Series de los gráficos</Subtitulo>
          <p className="mb-2 text-[13px] leading-snug text-tinta-suave">En este orden se asignan a las series que no tienen color propio.</p>
          <div className="space-y-2">
            {tema.series.map((c, i) => (
              <FilaColor
                key={i}
                nombre={`Serie ${i + 1}`}
                color={c}
                onCambiar={(color) => ponerTema({ series: tema.series.map((x, j) => (j === i ? color : x)) })}
              />
            ))}
          </div>
        </div>
        <FilaColor nombre="Neutro" nota="Barras y puntos que no se resaltan" color={tema.neutro} onCambiar={(neutro) => ponerTema({ neutro })} sinAviso />
        <button
          type="button"
          className={CLASE_BOTON}
          disabled={igualAPresente}
          onClick={() => ponerTema({ primario: TEMA_PRESENTE.primario, series: TEMA_PRESENTE.series, neutro: TEMA_PRESENTE.neutro })}
        >
          <RotateCcw size={15} aria-hidden /> Volver a los colores de Presente
        </button>
        <p className="text-[13px] leading-snug text-tinta-suave">
          Los colores de Presente están elegidos para que se distingan también con daltonismo. Si los cambias, revisa que las series se sigan diferenciando.
        </p>
      </section>

      <section className="border-t border-linea pt-5">
        <a
          href={`/api/presentaciones/${encodeURIComponent(presentacion.id)}?descargar=1`}
          download
          className="inline-flex items-center gap-1.5 text-sm text-tinta-suave underline decoration-linea-fuerte underline-offset-4 hover:text-tinta"
          title="Descarga un archivo con toda la presentación, como respaldo"
        >
          <Download size={15} aria-hidden /> Descargar copia
        </a>
      </section>
    </div>
  );
}

function FilaColor({ nombre, nota, color, onCambiar, sinAviso = false }: {
  nombre: string;
  nota?: string;
  color: string;
  onCambiar: (color: string) => void;
  sinAviso?: boolean;
}) {
  const bajo = !sinAviso && contraste(color, '#FFFFFF') < CONTRASTE_MINIMO;
  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={`Color ${nombre}`}
          value={color}
          onChange={(e) => onCambiar(e.target.value.toUpperCase())}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-linea-fuerte bg-white p-0.5"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] text-tinta">{nombre}</p>
          {nota && <p className="text-[12.5px] leading-snug text-tinta-suave">{nota}</p>}
        </div>
        <input
          aria-label={`Código del color ${nombre}`}
          defaultValue={color}
          key={color}
          maxLength={7}
          onBlur={(e) => {
            const valor = e.target.value.trim().toUpperCase();
            const conNumeral = valor.startsWith('#') ? valor : `#${valor}`;
            if (esColor(conNumeral) && conNumeral !== color) onCambiar(conNumeral);
            else e.target.value = color;
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="w-[86px] rounded-md border border-linea-fuerte px-2 py-1 font-mono text-[13px] uppercase text-tinta focus:border-primario focus:outline-none"
        />
      </div>
      {bajo && (
        <p className="mt-1 flex items-start gap-1.5 text-[12.5px] leading-snug text-[#8E1015]">
          <TriangleAlert size={14} className="mt-px shrink-0" aria-hidden /> Contrasta poco con el fondo blanco: puede verse mal.
        </p>
      )}
    </div>
  );
}
