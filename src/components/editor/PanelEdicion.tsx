'use client';

// Panel de edición: va a la derecha del visor. Se edita aquí y el resultado se
// ve al instante en la diapositiva. Ver "Pantalla de edición" en PLAN.md.

import { ChartColumn, Download, Hash, Table2, Type, X } from 'lucide-react';
import { conjuntoDe, filasDe } from '@/lib/datos';
import type { Operacion } from '@/lib/edicion/operaciones';
import { TOPES } from '@/lib/edicion/validar';
import { nombrePeriodo } from '@/lib/periodos';
import type { Bloque, Diapositiva, IdPeriodo, Presentacion } from '@/lib/tipos';
import { EditorCifras } from './EditorCifras';
import { EditorTexto } from './EditorTexto';
import { BotonIcono, Campo, CLASE_BOTON } from './piezas';

interface Props {
  presentacion: Presentacion;
  diapositiva: Diapositiva;
  periodo: IdPeriodo;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
  /** Abre el editor de datos de un conjunto. */
  onEditarDatos: (conjunto: string) => void;
  onCerrar: () => void;
  className?: string;
}

const NOMBRES: Record<Bloque['tipo'], string> = { grafico: 'Gráfico', tabla: 'Tabla', texto: 'Texto', cifras: 'Cifras' };
const ICONOS = { grafico: ChartColumn, tabla: Table2, texto: Type, cifras: Hash };
const TIPOS_DIAPOSITIVA: Record<Diapositiva['tipo'], string> = { portada: 'Portada', contenido: 'Diapositiva', cierre: 'Cierre' };

export function PanelEdicion({ presentacion, diapositiva, periodo, cambiar, onEditarDatos, onCerrar, className = '' }: Props) {
  return (
    <aside aria-label="Edición" className={`w-[380px] shrink-0 flex-col border-l border-linea bg-white ${className}`}>
      <div className="flex shrink-0 items-center gap-2 border-b border-linea px-5 py-3">
        <p className="min-w-0 flex-1 text-[15px] text-tinta-suave">
          Editando: <strong className="text-tinta">{nombrePeriodo(periodo)}</strong>
        </p>
        <BotonIcono etiqueta="Cerrar la edición" onClick={onCerrar}><X size={20} /></BotonIcono>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <section aria-labelledby="panel-diapositiva" className="space-y-3">
          <h2 id="panel-diapositiva" className="text-[13px] font-semibold uppercase tracking-wide text-tinta-suave">{TIPOS_DIAPOSITIVA[diapositiva.tipo]}</h2>
          <Campo
            etiqueta="Título"
            valor={diapositiva.titulo}
            multilinea
            filas={2}
            maximo={TOPES.titulo}
            onCambiar={(valor) => cambiar({ op: 'diapositiva.titulo', diapositiva: diapositiva.id, valor })}
          />
          <Campo
            etiqueta="Subtítulo"
            valor={diapositiva.subtitulo ?? ''}
            multilinea
            filas={2}
            maximo={TOPES.titulo}
            marcador="Opcional"
            onCambiar={(valor) => cambiar({ op: 'diapositiva.subtitulo', diapositiva: diapositiva.id, valor })}
            nota={<>El título y el subtítulo son iguales en todos los meses. Escribe <code>{'{mes}'}</code> donde deba ir el mes elegido.</>}
          />
        </section>

        {diapositiva.bloques.map((bloque) => {
          const Icono = ICONOS[bloque.tipo];
          return (
            <section key={bloque.id} aria-label={NOMBRES[bloque.tipo]} className="space-y-3 border-t border-linea pt-5">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-tinta-suave">
                <Icono size={16} aria-hidden /> {NOMBRES[bloque.tipo]}
              </h2>
              {bloque.tipo === 'texto' && <EditorTexto key={`${bloque.id}|${periodo}`} presentacion={presentacion} bloque={bloque} periodo={periodo} cambiar={cambiar} />}
              {bloque.tipo === 'cifras' && <EditorCifras presentacion={presentacion} bloque={bloque} periodo={periodo} cambiar={cambiar} />}
              {(bloque.tipo === 'grafico' || bloque.tipo === 'tabla') && (
                <ResumenDatos presentacion={presentacion} conjuntoId={bloque.datos} periodo={periodo} onEditar={() => onEditarDatos(bloque.datos)} />
              )}
            </section>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-linea px-5 py-3">
        <a
          href={`/api/presentaciones/${encodeURIComponent(presentacion.id)}?descargar=1`}
          download
          className="inline-flex items-center gap-1.5 text-sm text-tinta-suave underline decoration-linea-fuerte underline-offset-4 hover:text-tinta"
          title="Descarga un archivo con toda la presentación, como respaldo"
        >
          <Download size={15} aria-hidden /> Descargar copia
        </a>
      </div>
    </aside>
  );
}

function ResumenDatos({ presentacion, conjuntoId, periodo, onEditar }: { presentacion: Presentacion; conjuntoId: string; periodo: IdPeriodo; onEditar: () => void }) {
  const conjunto = conjuntoDe(presentacion, conjuntoId);
  if (!conjunto) return <p className="text-sm text-tinta-suave">Este bloque no tiene datos asociados.</p>;
  const filas = filasDe(conjunto, periodo);
  const cuantas = filas ? `${filas.length} ${filas.length === 1 ? 'fila' : 'filas'}` : `sin datos en ${nombrePeriodo(periodo)}`;
  return (
    <div className="rounded-lg border border-linea p-3">
      <p className="text-[15px] font-semibold text-tinta">{conjunto.nombre}</p>
      <p className="mt-0.5 text-[13px] text-tinta-suave">
        {conjunto.porPeriodo ? 'Propio de cada mes' : 'Igual en todos los meses'} · {cuantas}
      </p>
      <button type="button" className={`${CLASE_BOTON} mt-3`} onClick={onEditar}>
        <Table2 size={16} aria-hidden /> Editar datos
      </button>
    </div>
  );
}
