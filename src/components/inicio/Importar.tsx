'use client';

// "Importar la presentación anterior": lee el JSON de la presentación original
// del Comité (el archivo de respaldo o lo que devuelve su
// /api/presentation/shared), lo convierte en el navegador y crea la
// presentación en la base. Ver "Diseño de la etapa 4" en PLAN.md.

import { useRef, useState } from 'react';
import { FileUp, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CLASE_BOTON, CLASE_BOTON_PRINCIPAL } from '@/components/editor/piezas';
import type { ResultadoMigracion } from '@/lib/migracion/original';
import { nombrePeriodo } from '@/lib/periodos';

type Estado =
  | { paso: 'elegir'; error?: string }
  | { paso: 'revisar'; archivo: string; resultado: ResultadoMigracion }
  | { paso: 'creando'; archivo: string; resultado: ResultadoMigracion };

export function Importar() {
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<Estado>({ paso: 'elegir' });
  const entrada = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const cerrar = () => {
    setAbierto(false);
    setEstado({ paso: 'elegir' });
  };

  const leer = async (archivo: File) => {
    try {
      if (archivo.size > 20_000_000) throw new Error('El archivo pesa más de 20 MB: no parece la exportación de la presentación.');
      const texto = await archivo.text();
      let json: unknown;
      try {
        json = JSON.parse(texto);
      } catch {
        throw new Error('El archivo no es un JSON válido.');
      }
      // La conversión y la validación se descargan solo al usarlas.
      const [{ migrarOriginal }, { validarPresentacion }] = await Promise.all([import('@/lib/migracion/original'), import('@/lib/edicion/validar')]);
      const resultado = migrarOriginal(json);
      const validacion = validarPresentacion(resultado.presentacion);
      if (!validacion.ok) throw new Error(`El resultado no es válido: ${validacion.errores.slice(0, 3).join(' ')}`);
      setEstado({ paso: 'revisar', archivo: archivo.name, resultado });
    } catch (e) {
      setEstado({ paso: 'elegir', error: e instanceof Error ? e.message : 'No se pudo leer el archivo.' });
    }
  };

  const crear = async () => {
    if (estado.paso !== 'revisar') return;
    setEstado({ ...estado, paso: 'creando' });
    try {
      const respuesta = await fetch('/api/presentaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presentacion: estado.resultado.presentacion }),
      });
      const datos = (await respuesta.json().catch(() => null)) as { ok?: boolean; id?: string; error?: string } | null;
      if (!respuesta.ok || !datos?.id) throw new Error(datos?.error ?? `No se pudo crear (error ${respuesta.status}).`);
      router.push(`/p/${datos.id}`);
    } catch (e) {
      setEstado({ paso: 'elegir', error: e instanceof Error ? e.message : 'No se pudo crear la presentación.' });
    }
  };

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className={CLASE_BOTON}>
        <FileUp size={16} aria-hidden /> Importar la presentación anterior
      </button>
    );
  }

  const p = estado.paso === 'elegir' ? null : estado.resultado.presentacion;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="titulo-importar" className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <h2 id="titulo-importar" className="min-w-0 flex-1 text-xl font-bold">Importar la presentación anterior</h2>
          <button type="button" onClick={cerrar} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-full text-tinta-suave hover:bg-tinte"><X size={20} /></button>
        </div>

        {estado.paso === 'elegir' && (
          <>
            <p className="mt-3 text-[15px] leading-relaxed text-tinta-suave">
              Elige el archivo <strong className="text-tinta">.json</strong> con los datos de la presentación del Comité de Precios
              (el respaldo <code>InfoComite</code>, o lo que se descarga desde <code>/api/presentation/shared</code> del sitio anterior).
              Se crea una presentación nueva con sus diapositivas y sus meses; la que ya tienes no cambia.
            </p>
            <p className="mt-2 text-[13px] leading-snug text-tinta-suave">El archivo se lee aquí, en tu navegador. Solo se guarda la presentación que resulta.</p>
            {estado.error && <p role="alert" className="mt-3 rounded-lg bg-[#FDECEC] px-3 py-2 text-[14px] text-[#8E1015]">{estado.error}</p>}
            <input
              ref={entrada}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              aria-label="Archivo JSON de la presentación anterior"
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                e.target.value = '';
                if (archivo) void leer(archivo);
              }}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={CLASE_BOTON} onClick={cerrar}>Cancelar</button>
              <button type="button" className={CLASE_BOTON_PRINCIPAL} onClick={() => entrada.current?.click()}>Elegir archivo</button>
            </div>
          </>
        )}

        {p && estado.paso !== 'elegir' && (
          <>
            <p className="mt-3 text-[15px] text-tinta-suave">{estado.archivo}</p>
            <dl className="mt-3 grid grid-cols-3 gap-3 rounded-xl bg-fondo-app p-4 text-center">
              <div><dt className="text-[13px] text-tinta-suave">Diapositivas</dt><dd className="text-2xl font-bold">{p.diapositivas.length}</dd></div>
              <div><dt className="text-[13px] text-tinta-suave">Meses</dt><dd className="text-2xl font-bold">{p.periodos.length}</dd></div>
              <div><dt className="text-[13px] text-tinta-suave">Conjuntos de datos</dt><dd className="text-2xl font-bold">{Object.keys(p.datos).length}</dd></div>
            </dl>
            <p className="mt-3 text-[14px] text-tinta-suave">
              De {nombrePeriodo(p.periodos[0])} a {nombrePeriodo(p.periodos[p.periodos.length - 1])}. Se abrirá en el último mes.
            </p>
            {estado.resultado.avisos.length > 0 && (
              <div className="mt-3 rounded-lg border border-[#F1C9A5] bg-[#FFF6EE] px-3 py-2">
                <p className="text-[14px] font-semibold text-tinta">Para revisar</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px] leading-snug text-tinta-suave">
                  {estado.resultado.avisos.slice(0, 8).map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={CLASE_BOTON} onClick={() => setEstado({ paso: 'elegir' })} disabled={estado.paso === 'creando'}>Elegir otro</button>
              <button type="button" className={CLASE_BOTON_PRINCIPAL} onClick={crear} disabled={estado.paso === 'creando'}>
                {estado.paso === 'creando' ? 'Creando…' : 'Crear presentación'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
