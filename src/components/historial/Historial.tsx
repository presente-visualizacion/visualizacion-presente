'use client';

// Pantalla del historial de versiones (etapa 5). Ver "Diseño de la etapa 5"
// en PLAN.md.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, Download, Eye, RotateCcw, Save } from 'lucide-react';
import { CLASE_BOTON, CLASE_BOTON_PRINCIPAL, CLASE_CAMPO } from '@/components/editor/piezas';
import type { ResumenVersion } from '@/lib/almacen';
import { dia, fechaHora, hora } from '@/lib/fechas';
import { nombrePeriodo } from '@/lib/periodos';
import { etiquetaVersion } from '@/lib/versiones';

interface Props {
  id: string;
  versiones: ResumenVersion[];
  editable: boolean;
}

function meses(periodos: string[]): string {
  if (!periodos.length) return 'sin meses';
  const primero = periodos[0];
  const ultimo = periodos[periodos.length - 1];
  return primero === ultimo ? nombrePeriodo(ultimo) : `${nombrePeriodo(primero)} a ${nombrePeriodo(ultimo)}`;
}

function tamano(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('es-CO')} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} MB`;
}

async function enviar(url: string, cuerpo: object): Promise<void> {
  const respuesta = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  const datos = (await respuesta.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!respuesta.ok || datos?.ok === false) throw new Error(datos?.error ?? `No se pudo (error ${respuesta.status}).`);
}

export function Historial({ id, versiones, editable }: Props) {
  const router = useRouter();
  const base = `/api/presentaciones/${encodeURIComponent(id)}/versiones`;
  const [nota, setNota] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<number | null>(null);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nota.trim()) return;
    setOcupado(true);
    setError(null);
    try {
      await enviar(base, { nota });
      setNota('');
      setAviso('Copia guardada.');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOcupado(false);
    }
  };

  const restaurar = async (v: ResumenVersion) => {
    setOcupado(true);
    setError(null);
    try {
      await enviar(`${base}/${v.id}/restaurar`, {});
      setConfirmando(null);
      setAviso(`Listo: la presentación quedó como estaba el ${fechaHora(v.creado)}. Lo que había antes quedó arriba en esta lista, por si quieres volver.`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOcupado(false);
    }
  };

  // Agrupadas por día, en el orden en que llegan (la más reciente primero).
  const grupos: { dia: string; versiones: ResumenVersion[] }[] = [];
  for (const v of versiones) {
    const d = dia(v.creado);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.dia === d) ultimo.versiones.push(v);
    else grupos.push({ dia: d, versiones: [v] });
  }
  const total = versiones.reduce((suma, v) => suma + v.tamano, 0);

  return (
    <div>
      {editable && (
        <form onSubmit={guardar} className="mt-8 rounded-2xl border border-linea p-5">
          <label htmlFor="nota" className="font-semibold">Guardar una copia de cómo está ahora</label>
          <p className="mt-1 text-sm text-tinta-suave">Ponle un nombre que la distinga, por ejemplo &quot;Presentada en el comité de noviembre&quot;. Las copias con nombre no se borran solas.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input id="nota" value={nota} maxLength={120} onChange={(e) => setNota(e.target.value)} placeholder="Nombre de la copia" className={`${CLASE_CAMPO} min-w-0 flex-1`} />
            <button type="submit" disabled={ocupado || !nota.trim()} className={CLASE_BOTON_PRINCIPAL}>
              <Save size={16} aria-hidden /> Guardar copia
            </button>
          </div>
        </form>
      )}

      {(aviso || error) && (
        <div role={error ? 'alert' : 'status'} className={`mt-5 flex items-start gap-3 rounded-xl px-4 py-3 text-[15px] ${error ? 'bg-[#FDECEC] text-[#8A1C1C]' : 'bg-tinte'}`}>
          {!error && <Check size={18} className="mt-0.5 shrink-0 text-primario" aria-hidden />}
          <p className="min-w-0 flex-1">
            {error ?? aviso}{' '}
            {!error && aviso?.startsWith('Listo') && (
              <Link href={`/p/${encodeURIComponent(id)}`} className="font-semibold text-primario underline underline-offset-4">Ver la presentación</Link>
            )}
          </p>
        </div>
      )}

      {!versiones.length ? (
        <p className="mt-10 text-tinta-suave">
          Todavía no hay copias. Se hace una sola cada vez que empiezas a editar, y también puedes guardar una con nombre.
        </p>
      ) : (
        grupos.map((g) => (
          <section key={g.dia} className="mt-10">
            <h2 className="text-sm font-semibold text-tinta-suave first-letter:uppercase">{g.dia}</h2>
            <ul className="mt-2 divide-y divide-linea border-y border-linea">
              {g.versiones.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                  <span className="w-20 shrink-0 text-[15px] tabular-nums text-tinta-suave">{hora(v.creado)}</span>
                  <div className="min-w-0 flex-1 basis-60">
                    <p className="font-semibold">
                      {etiquetaVersion(v)}
                      {v.motivo === 'manual' && <span className="ml-2 rounded-full bg-tinte px-2 py-0.5 text-xs font-semibold text-primario">Con nombre</span>}
                    </p>
                    <p className="mt-0.5 text-sm text-tinta-suave">{v.diapositivas} diapositivas · {meses(v.periodos)}</p>
                  </div>
                  {confirmando === v.id ? (
                    <div className="flex basis-full flex-wrap items-center gap-2 rounded-xl bg-tinte px-4 py-3 sm:basis-auto">
                      <p className="text-[15px]">¿Volver a esta copia? Lo de ahora queda guardado en el historial.</p>
                      <button type="button" disabled={ocupado} onClick={() => restaurar(v)} className={CLASE_BOTON_PRINCIPAL}>Sí, volver a esta</button>
                      <button type="button" disabled={ocupado} onClick={() => setConfirmando(null)} className={CLASE_BOTON}>Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link href={`/p/${encodeURIComponent(id)}/version/${v.id}`} className={CLASE_BOTON}>
                        <Eye size={16} aria-hidden /> Ver
                      </Link>
                      {editable && (
                        <button type="button" onClick={() => { setConfirmando(v.id); setAviso(null); setError(null); }} className={CLASE_BOTON}>
                          <RotateCcw size={16} aria-hidden /> Volver a esta
                        </button>
                      )}
                      <a href={`${base}/${v.id}?descargar=1`} download className={CLASE_BOTON} title="Descargar esta copia como archivo (.json); se puede importar desde el inicio">
                        <Download size={16} aria-hidden /> <span className="sr-only">Descargar</span>
                      </a>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {versiones.length > 0 && (
        <p className="mt-8 text-sm text-tinta-suave">
          {versiones.length} {versiones.length === 1 ? 'copia' : 'copias'}, que ocupan {tamano(total)} en la base de datos.
        </p>
      )}
    </div>
  );
}
