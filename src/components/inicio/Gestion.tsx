'use client';

// Crear, duplicar, eliminar y recuperar presentaciones desde el inicio. Ver
// "Crear y eliminar presentaciones" en PLAN.md. Eliminar no borra: manda a la
// papelera, que está al final de la lista.

import { useEffect, useRef, useState } from 'react';
import { Copy, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CLASE_BOTON, CLASE_BOTON_PRINCIPAL, CLASE_CAMPO } from '@/components/editor/piezas';
import { PLANTILLAS } from '@/lib/edicion/nombresPlantillas';
import type { ResumenPresentacion } from '@/lib/tipos';

type Breve = Pick<ResumenPresentacion, 'id' | 'nombre'>;

async function enviar(url: string, cuerpo: object): Promise<{ id?: string }> {
  const respuesta = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  const datos = (await respuesta.json().catch(() => null)) as { ok?: boolean; id?: string; error?: string } | null;
  if (!respuesta.ok || datos?.ok === false) throw new Error(datos?.error ?? `No se pudo (error ${respuesta.status}).`);
  return datos ?? {};
}

/** Mes vencido: el anterior al de hoy, como "AAAA-MM". */
function mesAnterior(): string {
  const hoy = new Date();
  const d = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function Ventana({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCerrar]);
  return (
    <div role="dialog" aria-modal="true" aria-label={titulo} className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <h2 className="min-w-0 flex-1 text-xl font-bold">{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-full text-tinta-suave hover:bg-tinte"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * "Nueva presentación": en blanco (portada, una diapositiva y cierre) o copia
 * de otra con todas sus diapositivas, datos y meses.
 */
export function NuevaPresentacion({ presentaciones, copiaDe, compacto = false }: {
  presentaciones: Breve[];
  /** Abre la ventana ya en "copia de" esta presentación (botón de cada fila). */
  copiaDe?: Breve;
  compacto?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [origen, setOrigen] = useState<string>(copiaDe?.id ?? '');
  const [nombre, setNombre] = useState('');
  const [periodo, setPeriodo] = useState(mesAnterior());
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const router = useRouter();
  const campoNombre = useRef<HTMLInputElement>(null);
  const esCopia = Boolean(origen) && !origen.startsWith('plantilla:');

  const abrir = () => {
    setOrigen(copiaDe?.id ?? '');
    setNombre(copiaDe ? `${copiaDe.nombre} (copia)`.slice(0, 120) : '');
    setPeriodo(mesAnterior());
    setError(null);
    setAbierto(true);
    setTimeout(() => campoNombre.current?.select(), 0);
  };

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return setError('Escribe un nombre.');
    setCreando(true);
    setError(null);
    try {
      const plantilla = origen.startsWith('plantilla:') ? origen.slice('plantilla:'.length) : undefined;
      const { id } = await enviar(
        '/api/presentaciones',
        origen && !plantilla ? { copiaDe: origen, nombre } : { nueva: { nombre, periodo, ...(plantilla ? { plantilla } : {}) } },
      );
      if (!id) throw new Error('No se pudo crear.');
      router.push(`/p/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la presentación.');
      setCreando(false);
    }
  };

  return (
    <>
      {compacto ? (
        <button type="button" onClick={abrir} aria-label={`Duplicar ${copiaDe?.nombre ?? ''}`} title="Duplicar" className="flex h-9 w-9 items-center justify-center rounded-full text-tinta-suave hover:bg-tinte hover:text-tinta">
          <Copy size={17} />
        </button>
      ) : (
        <button type="button" onClick={abrir} className={CLASE_BOTON_PRINCIPAL}>
          <Plus size={16} aria-hidden /> Nueva presentación
        </button>
      )}
      {abierto && (
        <Ventana titulo={esCopia ? 'Duplicar presentación' : 'Nueva presentación'} onCerrar={() => !creando && setAbierto(false)}>
          <form onSubmit={crear} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-tinta">Nombre</span>
              <input ref={campoNombre} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} required className={CLASE_CAMPO} placeholder="Comité de Precios" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-tinta">Partir de</span>
              <select value={origen} onChange={(e) => setOrigen(e.target.value)} className={`${CLASE_CAMPO} h-10 py-0`}>
                <option value="">En blanco</option>
                {Object.entries(PLANTILLAS).map(([clave, titulo]) => <option key={clave} value={`plantilla:${clave}`}>{titulo}</option>)}
                {presentaciones.map((p) => <option key={p.id} value={p.id}>Copia de: {p.nombre}</option>)}
              </select>
              <span className="mt-1 block text-[13px] leading-snug text-tinta-suave">
                {esCopia
                  ? 'Se copian todas las diapositivas, datos y meses. La original no cambia.'
                  : origen
                    ? 'Portada, la diapositiva de ejemplo y cierre. Puedes copiar la diapositiva y pegarla en otra presentación.'
                    : 'Empieza con portada, una diapositiva vacía y cierre. Los demás meses se agregan con "Nuevo mes".'}
              </span>
            </label>
            {!esCopia && (
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-tinta">Primer mes</span>
                <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required className={`${CLASE_CAMPO} h-10 py-0`} />
              </label>
            )}
            {error && <p role="alert" className="rounded-lg bg-[#FDECEC] px-3 py-2 text-[14px] text-[#8E1015]">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className={CLASE_BOTON} onClick={() => setAbierto(false)} disabled={creando}>Cancelar</button>
              <button type="submit" className={CLASE_BOTON_PRINCIPAL} disabled={creando}>{creando ? 'Creando…' : esCopia ? 'Duplicar' : 'Crear'}</button>
            </div>
          </form>
        </Ventana>
      )}
    </>
  );
}

/** Botón de papelera de cada fila, con confirmación. */
export function EliminarPresentacion({ presentacion }: { presentacion: Breve }) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const eliminar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await enviar(`/api/presentaciones/${encodeURIComponent(presentacion.id)}/eliminar`, {});
      setAbierto(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => { setError(null); setAbierto(true); }} aria-label={`Eliminar ${presentacion.nombre}`} title="Eliminar" className="flex h-9 w-9 items-center justify-center rounded-full text-tinta-suave hover:bg-[#FDECEC] hover:text-[#8E1015]">
        <Trash2 size={17} />
      </button>
      {abierto && (
        <Ventana titulo="Eliminar presentación" onCerrar={() => !enviando && setAbierto(false)}>
          <p className="mt-3 text-[15px] leading-relaxed text-tinta-suave">
            <strong className="text-tinta">{presentacion.nombre}</strong> pasará a la papelera, al final de esta página. Desde ahí se puede recuperar con todo lo que tenía.
          </p>
          {error && <p role="alert" className="mt-3 rounded-lg bg-[#FDECEC] px-3 py-2 text-[14px] text-[#8E1015]">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={CLASE_BOTON} onClick={() => setAbierto(false)} disabled={enviando}>Cancelar</button>
            <button type="button" className={`${CLASE_BOTON_PRINCIPAL} bg-[#B3261E]`} onClick={eliminar} disabled={enviando}>
              <Trash2 size={16} aria-hidden /> {enviando ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </Ventana>
      )}
    </>
  );
}

/** Botón "Recuperar" de cada presentación de la papelera. */
export function RecuperarPresentacion({ presentacion }: { presentacion: Breve }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const recuperar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await enviar(`/api/presentaciones/${encodeURIComponent(presentacion.id)}/recuperar`, {});
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo recuperar.');
      setEnviando(false);
    }
  };
  return (
    <span className="flex items-center gap-2">
      {error && <span role="alert" className="text-[13px] text-[#8E1015]">{error}</span>}
      <button type="button" onClick={recuperar} disabled={enviando} className={CLASE_BOTON} aria-label={`Recuperar ${presentacion.nombre}`}>
        <RotateCcw size={15} aria-hidden /> {enviando ? 'Recuperando…' : 'Recuperar'}
      </button>
    </span>
  );
}
