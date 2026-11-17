'use client';

// Panel de edición: va a la derecha del visor. Se edita aquí y el resultado se
// ve al instante en la diapositiva. Dos pestañas: la diapositiva elegida y la
// presentación (meses y colores). Ver "Pantalla de edición" en PLAN.md (2A y 2B).

import { useState } from 'react';
import { ArrowDown, ArrowUp, ChartColumn, ClipboardCopy, ClipboardPaste, Copy, FileSpreadsheet, Hash, LayoutGrid, Plus, Table2, Trash2, Type, X } from 'lucide-react';
import { copiarDiapositiva, opsPegarDiapositiva } from '@/lib/edicion/portapapeles';
import { usarPortapapeles } from './usarPortapapeles';
import { conjuntoDe, filasDe } from '@/lib/datos';
import type { Operacion } from '@/lib/edicion/operaciones';
import { diapositivaNueva, idsEnUso, opsCambiarDisposicion, opsDuplicarBloque, opsDuplicarDiapositiva, opsQuitarBloque, opsQuitarDiapositiva } from '@/lib/edicion/plantillas';
import { TOPES } from '@/lib/edicion/validar';
import type { DestinoExcel } from '@/lib/excel/cargar';
import { nombrePeriodo } from '@/lib/periodos';
import type { Bloque, Diapositiva, Disposicion, IdPeriodo, Presentacion } from '@/lib/tipos';
import { AgregarBloque } from './AgregarBloque';
import { EditorAspecto } from './EditorAspecto';
import { EditorCifras } from './EditorCifras';
import { EditorGrafico, FORMAS_INFO } from './EditorGrafico';
import { EditorTabla } from './EditorTabla';
import { EditorTarjetas } from './EditorTarjetas';
import { EditorTexto } from './EditorTexto';
import { PanelPresentacion } from './PanelPresentacion';
import { BotonConfirmar, BotonIcono, Campo, CLASE_BOTON, CLASE_BOTON_PRINCIPAL, Opcion } from './piezas';

interface Props {
  presentacion: Presentacion;
  diapositiva: Diapositiva;
  periodo: IdPeriodo;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
  /** Abre el editor de datos de un conjunto. */
  onEditarDatos: (conjunto: string) => void;
  /** Abre la ventana para cargar datos desde Excel. */
  onCargarExcel: (destino: DestinoExcel) => void;
  /** Lleva el visor a esa diapositiva (cuando aparece después del cambio). */
  onIrA: (diapositiva: string) => void;
  onPeriodo: (periodo: IdPeriodo) => void;
  onCerrar: () => void;
  className?: string;
}

const NOMBRES: Record<Bloque['tipo'], string> = { grafico: 'Gráfico', tabla: 'Tabla', texto: 'Texto', cifras: 'Cifras', tarjetas: 'Tarjetas' };
const ICONOS = { grafico: ChartColumn, tabla: Table2, texto: Type, cifras: Hash, tarjetas: LayoutGrid };
const TIPOS_DIAPOSITIVA: { valor: Diapositiva['tipo']; nombre: string }[] = [
  { valor: 'portada', nombre: 'Portada' },
  { valor: 'contenido', nombre: 'Contenido (gráficos, tablas, textos)' },
  { valor: 'cierre', nombre: 'Cierre' },
];

export function PanelEdicion(props: Props) {
  const { presentacion, periodo, cambiar, onPeriodo, onCerrar, className = '' } = props;
  const [pestana, setPestana] = useState<'diapositiva' | 'presentacion'>('diapositiva');
  const boton = (activa: boolean) =>
    `h-8 flex-1 rounded-full text-[14px] transition-colors ${activa ? 'bg-white font-semibold text-tinta shadow-sm' : 'text-tinta-suave hover:text-tinta'}`;

  return (
    <aside aria-label="Edición" className={`w-[380px] shrink-0 flex-col border-l border-linea bg-white ${className}`}>
      <div className="shrink-0 space-y-3 border-b border-linea px-5 py-3">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 text-[15px] text-tinta-suave">
            Editando: <strong className="text-tinta">{nombrePeriodo(periodo)}</strong>
          </p>
          <BotonIcono etiqueta="Cerrar la edición" onClick={onCerrar}><X size={20} /></BotonIcono>
        </div>
        <div role="tablist" aria-label="Qué editar" className="flex gap-0.5 rounded-full bg-fondo-app p-0.5">
          <button type="button" role="tab" aria-selected={pestana === 'diapositiva'} className={boton(pestana === 'diapositiva')} onClick={() => setPestana('diapositiva')}>Diapositiva</button>
          <button type="button" role="tab" aria-selected={pestana === 'presentacion'} className={boton(pestana === 'presentacion')} onClick={() => setPestana('presentacion')}>Presentación</button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {pestana === 'diapositiva'
          ? <PestanaDiapositiva {...props} />
          : <PanelPresentacion presentacion={presentacion} periodo={periodo} cambiar={cambiar} onPeriodo={onPeriodo} />}
      </div>
    </aside>
  );
}

function PestanaDiapositiva({ presentacion, diapositiva, periodo, cambiar, onEditarDatos, onCargarExcel, onIrA }: Props) {
  const { diapositivas } = presentacion;
  const indice = diapositivas.findIndex((d) => d.id === diapositiva.id);
  const contenido = diapositiva.tipo === 'contenido';
  const disposicion = diapositiva.disposicion ?? 'una';

  return (
    <div className="space-y-6">
      <AccionesDiapositiva presentacion={presentacion} diapositiva={diapositiva} indice={indice} periodo={periodo} cambiar={cambiar} onIrA={onIrA} />

      <section aria-label="Diapositiva" className="space-y-3">
        <Opcion
          etiqueta="Tipo"
          valor={diapositiva.tipo}
          opciones={TIPOS_DIAPOSITIVA}
          onCambiar={(valor) => cambiar({ op: 'diapositiva.tipo', diapositiva: diapositiva.id, valor })}
          nota={!contenido && diapositiva.bloques.length ? 'La portada y el cierre no muestran bloques: se conservan por si vuelves a "Contenido".' : undefined}
        />
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
        {contenido && (
          <SelectorDisposicion
            valor={disposicion}
            bloques={diapositiva.bloques.length}
            onCambiar={(valor) => cambiar(opsCambiarDisposicion(diapositiva, valor))}
          />
        )}
      </section>

      {contenido && diapositiva.bloques.map((bloque, i) => (
        <TarjetaBloque
          key={bloque.id}
          presentacion={presentacion}
          diapositiva={diapositiva}
          bloque={bloque}
          indice={i}
          periodo={periodo}
          cambiar={cambiar}
          onEditarDatos={onEditarDatos}
          onCargarExcel={onCargarExcel}
          oculto={disposicion === 'una' && i > 0}
        />
      ))}

      {contenido && (
        <div className="border-t border-linea pt-5">
          <AgregarBloque
            presentacion={presentacion}
            diapositiva={diapositiva}
            cambiar={cambiar}
            onDatosNuevos={onEditarDatos}
            onDesdeExcel={(tipo) => onCargarExcel({ modo: 'nuevo', diapositiva: diapositiva.id, tipo })}
          />
        </div>
      )}
    </div>
  );
}

function AccionesDiapositiva({ presentacion, diapositiva, indice, periodo, cambiar, onIrA }: {
  presentacion: Presentacion;
  diapositiva: Diapositiva;
  indice: number;
  periodo: IdPeriodo;
  cambiar: Props['cambiar'];
  onIrA: Props['onIrA'];
}) {
  const [agregando, setAgregando] = useState(false);
  const [tipo, setTipo] = useState<Diapositiva['tipo']>('contenido');
  const { diapositivas } = presentacion;
  const llenas = diapositivas.length >= TOPES.diapositivas;

  const agregar = () => {
    const nueva = diapositivaNueva(tipo, idsEnUso(presentacion));
    cambiar({ op: 'diapositiva.poner', diapositiva: nueva, despues: diapositiva.id });
    setAgregando(false);
    onIrA(nueva.id);
  };
  const duplicar = () => {
    const r = opsDuplicarDiapositiva(presentacion, diapositiva.id);
    if (!r) return;
    cambiar(r.ops);
    onIrA(r.id);
  };
  // Mover a la posición `destino` (desde 0): queda después de la que ocupe
  // ese lugar una vez sacada la actual.
  const moverA = (destino: number) => {
    if (destino === indice || destino < 0 || destino >= diapositivas.length) return;
    const despues = destino === 0 ? null : destino > indice ? diapositivas[destino].id : diapositivas[destino - 1].id;
    cambiar({ op: 'diapositiva.mover', diapositiva: diapositiva.id, despues });
    // El visor sigue la diapositiva por su lugar: se le dice que la acompañe.
    onIrA(diapositiva.id);
  };
  const { copia, guardar } = usarPortapapeles();
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null);
  const copiar = () => {
    const nueva = copiarDiapositiva(presentacion, diapositiva.id, periodo);
    if (!nueva) return;
    setAviso(guardar(nueva)
      ? { texto: 'Diapositiva copiada. Ábrela en cualquier presentación (o aquí) y aprieta "Pegar".' }
      : { texto: 'El navegador no dejó guardar la copia (¿ventana privada?).', error: true });
  };
  const pegar = () => {
    if (!copia) return;
    const r = opsPegarDiapositiva(presentacion, copia, diapositiva.id, periodo);
    if ('error' in r) return setAviso({ texto: r.error, error: true });
    cambiar(r.ops);
    onIrA(r.id);
    setAviso({ texto: ['Pegada después de esta diapositiva.', ...r.avisos].join(' ') });
  };
  const quitar = () => {
    const vecina = diapositivas[indice + 1] ?? diapositivas[indice - 1];
    cambiar(opsQuitarDiapositiva(presentacion, diapositiva.id));
    if (vecina) onIrA(vecina.id);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" className={CLASE_BOTON} onClick={() => setAgregando((a) => !a)} disabled={llenas} aria-expanded={agregando}>
          <Plus size={16} aria-hidden /> Nueva
        </button>
        <BotonIcono etiqueta="Duplicar la diapositiva" onClick={duplicar} inactivo={llenas}><Copy size={17} /></BotonIcono>
        <BotonIcono etiqueta="Subir la diapositiva" onClick={() => moverA(indice - 1)} inactivo={indice === 0}><ArrowUp size={17} /></BotonIcono>
        <BotonIcono etiqueta="Bajar la diapositiva" onClick={() => moverA(indice + 1)} inactivo={indice === diapositivas.length - 1}><ArrowDown size={17} /></BotonIcono>
        <BotonIcono etiqueta="Copiar la diapositiva (para pegarla aquí o en otra presentación)" onClick={copiar}><ClipboardCopy size={17} /></BotonIcono>
        <BotonIcono
          etiqueta={copia ? `Pegar "${copia.diapositiva.titulo}" después de esta` : 'Pegar (primero copia una diapositiva)'}
          onClick={pegar}
          inactivo={!copia || llenas}
        >
          <ClipboardPaste size={17} />
        </BotonIcono>
        <span className="ml-auto" />
        <BotonConfirmar
          etiqueta="Quitar la diapositiva"
          pregunta={`Se quitará la diapositiva ${indice + 1} con todo lo que tiene.`}
          confirmar="Quitar"
          icono={<Trash2 size={17} />}
          compacto
          inactivo={diapositivas.length === 1}
          onConfirmar={quitar}
        />
      </div>
      {aviso && (
        <p role="status" className={`text-[13px] leading-snug ${aviso.error ? 'text-[#8E1015]' : 'text-tinta-suave'}`}>{aviso.texto}</p>
      )}
      {copia && !aviso && (
        <p className="text-[13px] leading-snug text-tinta-suave">
          Para pegar: <span className="font-semibold text-tinta">{copia.diapositiva.titulo || 'Sin título'}</span>
          {copia.origen.presentacion !== presentacion.id && <> (de {copia.origen.nombre})</>}
        </p>
      )}
      {diapositivas.length > 2 && (
        <label className="flex items-center gap-2 text-[13px] text-tinta-suave">
          Mover a la posición
          <select
            value={indice}
            onChange={(e) => moverA(Number(e.target.value))}
            className="h-8 rounded-lg border border-linea-fuerte bg-white px-2 text-[13px] text-tinta hover:border-tinta-suave focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25"
            aria-label="Mover la diapositiva a la posición"
          >
            {diapositivas.map((d, i) => (
              <option key={d.id} value={i}>{i + 1}{i === indice ? ' (aquí)' : ''}</option>
            ))}
          </select>
          <span>de {diapositivas.length}</span>
        </label>
      )}
      {agregando && (
        <div className="space-y-3 rounded-lg border border-linea-fuerte p-3">
          <Opcion etiqueta="Diapositiva nueva, después de esta" valor={tipo} opciones={TIPOS_DIAPOSITIVA} onCambiar={setTipo} />
          <div className="flex justify-end gap-2">
            <button type="button" className={CLASE_BOTON} onClick={() => setAgregando(false)}>Cancelar</button>
            <button type="button" className={CLASE_BOTON_PRINCIPAL} onClick={agregar}>Agregar</button>
          </div>
        </div>
      )}
    </div>
  );
}

const DISPOSICIONES: { valor: Disposicion; nombre: string; dibujo: React.ReactNode }[] = [
  { valor: 'una', nombre: 'Un bloque', dibujo: <rect x="3" y="3" width="30" height="18" rx="2" /> },
  { valor: 'columnas', nombre: 'Columnas', dibujo: <><rect x="3" y="3" width="14" height="18" rx="2" /><rect x="19" y="3" width="14" height="18" rx="2" /></> },
  { valor: 'filas', nombre: 'Filas', dibujo: <><rect x="3" y="3" width="30" height="6" rx="2" /><rect x="3" y="11" width="30" height="10" rx="2" /></> },
  { valor: 'principal-lateral', nombre: 'Principal y lateral', dibujo: <><rect x="3" y="3" width="19" height="18" rx="2" /><rect x="24" y="3" width="9" height="8" rx="2" /><rect x="24" y="13" width="9" height="8" rx="2" /></> },
  { valor: 'cuadricula', nombre: 'Cuadrícula', dibujo: <><rect x="3" y="3" width="14" height="8" rx="2" /><rect x="19" y="3" width="14" height="8" rx="2" /><rect x="3" y="13" width="14" height="8" rx="2" /><rect x="19" y="13" width="14" height="8" rx="2" /></> },
  { valor: 'libre', nombre: 'Libre', dibujo: <><rect x="3" y="3" width="11" height="10" rx="2" /><rect x="16" y="3" width="17" height="10" rx="2" /><rect x="3" y="15" width="30" height="6" rx="2" /></> },
];

function SelectorDisposicion({ valor, bloques, onCambiar }: { valor: Disposicion; bloques: number; onCambiar: (d: Disposicion) => void }) {
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-tinta">Disposición de los bloques</p>
      <div role="radiogroup" aria-label="Disposición de los bloques" className="grid grid-cols-3 gap-1.5">
        {DISPOSICIONES.map((d) => (
          <button
            key={d.valor}
            type="button"
            role="radio"
            aria-checked={valor === d.valor}
            title={d.nombre}
            onClick={() => onCambiar(d.valor)}
            className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[12px] leading-tight ${valor === d.valor ? 'border-primario bg-tinte font-semibold text-tinta' : 'border-linea-fuerte text-tinta-suave hover:bg-fondo-app'}`}
          >
            <svg viewBox="0 0 36 24" className="h-6 w-9" fill="currentColor" opacity={valor === d.valor ? 0.85 : 0.5} aria-hidden>{d.dibujo}</svg>
            {d.nombre}
          </button>
        ))}
      </div>
      {valor === 'libre' && (
        <p className="mt-1.5 text-[13px] leading-snug text-tinta-suave">En cada bloque, abajo, eliges dónde va y cuánto ocupa.</p>
      )}
      {valor === 'una' && bloques > 1 && (
        <p className="mt-1.5 text-[13px] leading-snug text-[#8E1015]">Con "Un bloque" solo se ve el primero. Elige otra disposición para ver los {bloques}.</p>
      )}
    </div>
  );
}

function TarjetaBloque({ presentacion, diapositiva, bloque, indice, periodo, cambiar, onEditarDatos, onCargarExcel, oculto }: {
  presentacion: Presentacion;
  diapositiva: Diapositiva;
  bloque: Bloque;
  indice: number;
  periodo: IdPeriodo;
  cambiar: Props['cambiar'];
  onEditarDatos: Props['onEditarDatos'];
  onCargarExcel: Props['onCargarExcel'];
  oculto: boolean;
}) {
  const Icono = ICONOS[bloque.tipo];
  const { bloques } = diapositiva;
  const nombre = bloque.tipo === 'grafico' ? `Gráfico · ${FORMAS_INFO[bloque.forma].nombre}` : NOMBRES[bloque.tipo];
  const lleno = bloques.length >= TOPES.bloquesPorDiapositiva;

  return (
    <section aria-label={nombre} className={`space-y-3 border-t border-linea pt-5 ${oculto ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-1">
        <h2 className="mr-auto flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-tinta-suave">
          <Icono size={16} aria-hidden /> {indice + 1}. {nombre}
        </h2>
        <BotonIcono etiqueta="Subir el bloque" onClick={() => cambiar({ op: 'bloque.mover', bloque: bloque.id, despues: indice <= 1 ? null : bloques[indice - 2].id })} inactivo={indice === 0}><ArrowUp size={16} /></BotonIcono>
        <BotonIcono etiqueta="Bajar el bloque" onClick={() => cambiar({ op: 'bloque.mover', bloque: bloque.id, despues: bloques[indice + 1]?.id ?? null })} inactivo={indice === bloques.length - 1}><ArrowDown size={16} /></BotonIcono>
        <BotonIcono etiqueta="Duplicar el bloque" onClick={() => cambiar(opsDuplicarBloque(presentacion, bloque.id))} inactivo={lleno}><Copy size={16} /></BotonIcono>
        <BotonConfirmar
          etiqueta="Quitar el bloque"
          pregunta={bloque.tipo === 'grafico' || bloque.tipo === 'tabla' ? 'Se quitará el bloque (y sus datos, si ningún otro bloque los usa).' : 'Se quitará el bloque.'}
          confirmar="Quitar"
          icono={<Trash2 size={16} />}
          compacto
          onConfirmar={() => cambiar(opsQuitarBloque(presentacion, bloque.id))}
        />
      </div>
      {oculto && <p className="text-[13px] text-tinta-suave">No se ve en la diapositiva con la disposición "Un bloque".</p>}
      <MarcoBloque bloque={bloque} cambiar={cambiar} />
      <EditorAspecto diapositiva={diapositiva} bloque={bloque} indice={indice} cambiar={cambiar} />
      {bloque.tipo === 'texto' && <EditorTexto key={`${bloque.id}|${periodo}`} presentacion={presentacion} bloque={bloque} periodo={periodo} cambiar={cambiar} />}
      {bloque.tipo === 'cifras' && <EditorCifras presentacion={presentacion} bloque={bloque} periodo={periodo} cambiar={cambiar} />}
      {bloque.tipo === 'tarjetas' && <EditorTarjetas presentacion={presentacion} bloque={bloque} periodo={periodo} cambiar={cambiar} />}
      {(bloque.tipo === 'grafico' || bloque.tipo === 'tabla') && (
        <ResumenDatos
          presentacion={presentacion}
          conjuntoId={bloque.datos}
          periodo={periodo}
          onEditar={() => onEditarDatos(bloque.datos)}
          onCargarExcel={() => onCargarExcel({ modo: 'conjunto', conjunto: bloque.datos })}
        />
      )}
      {bloque.tipo === 'grafico' && <EditorGrafico presentacion={presentacion} bloque={bloque} periodo={periodo} cambiar={cambiar} />}
      {bloque.tipo === 'tabla' && <EditorTabla presentacion={presentacion} bloque={bloque} periodo={periodo} cambiar={cambiar} />}
    </section>
  );
}

/** Título (arriba) y nota (debajo) del bloque: se abren con un clic para no ocupar espacio. */
function MarcoBloque({ bloque, cambiar }: { bloque: Bloque; cambiar: Props['cambiar'] }) {
  const [abierto, setAbierto] = useState(Boolean(bloque.titulo || bloque.nota));
  const poner = (titulo: string, nota: string, campo: string) =>
    cambiar({ op: 'bloque.marco', bloque: bloque.id, titulo, nota }, `marco|${bloque.id}|${campo}`);
  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="text-[13px] font-semibold text-primario underline-offset-2 hover:underline">
        + Título o nota del bloque
      </button>
    );
  }
  return (
    <div className="grid gap-2">
      <Campo etiqueta="Título del bloque" valor={bloque.titulo ?? ''} maximo={TOPES.titulo} marcador="Opcional: va arriba, en mayúsculas" onCambiar={(v) => poner(v, bloque.nota ?? '', 'titulo')} />
      <Campo etiqueta="Nota" valor={bloque.nota ?? ''} maximo={TOPES.titulo} marcador="Opcional: va debajo, en letra chica (fuentes, aclaraciones)" onCambiar={(v) => poner(bloque.titulo ?? '', v, 'nota')} />
    </div>
  );
}

function ResumenDatos({ presentacion, conjuntoId, periodo, onEditar, onCargarExcel }: {
  presentacion: Presentacion;
  conjuntoId: string;
  periodo: IdPeriodo;
  onEditar: () => void;
  onCargarExcel: () => void;
}) {
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
      {conjunto.origen && (
        <p className="mt-1 truncate text-[13px] text-tinta-suave" title={`${conjunto.origen.archivo} · hoja ${conjunto.origen.hoja}`}>
          Último Excel: {conjunto.origen.archivo} · {conjunto.origen.hoja} · {new Date(conjunto.origen.cargado).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={CLASE_BOTON} onClick={onEditar}>
          <Table2 size={16} aria-hidden /> Editar datos
        </button>
        <button type="button" className={CLASE_BOTON} onClick={onCargarExcel} title={conjunto.origen ? 'Se propone lo mismo que la última vez' : 'Cargar estos datos desde un archivo de Excel'}>
          <FileSpreadsheet size={16} aria-hidden /> Cargar Excel
        </button>
      </div>
    </div>
  );
}
