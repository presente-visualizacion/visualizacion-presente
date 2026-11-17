import Link from 'next/link';
import { EliminarPresentacion, NuevaPresentacion, RecuperarPresentacion } from '@/components/inicio/Gestion';
import { Importar } from '@/components/inicio/Importar';
import { Logo } from '@/components/Logo';
import { hayClave, puedeEditar } from '@/lib/acceso';
import { obtenerAlmacen } from '@/lib/almacen';
import { nombrePeriodo } from '@/lib/periodos';

// La lista sale de la base de datos: se arma en cada visita, no al compilar.
export const dynamic = 'force-dynamic';

const fecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' });

export default async function Inicio() {
  const almacen = await obtenerAlmacen();
  const presentaciones = await almacen.listar();
  const editable = !almacen.soloLectura && (await puedeEditar());
  const eliminadas = editable ? await almacen.listarEliminadas() : [];
  const breves = presentaciones.map((p) => ({ id: p.id, nombre: p.nombre }));

  return (
    <div className="min-h-full bg-white">
      <div className="h-1.5" style={{ background: 'var(--vp-degradado-h)' }} />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <div className="flex items-center gap-3">
          <Logo alto={40} />
          <span className="text-lg font-semibold">Visualización Presente</span>
          {hayClave() && (
            <form method="post" action="/api/salir" className="ml-auto">
              <button type="submit" className="text-sm text-tinta-suave underline-offset-4 hover:text-primario hover:underline">
                Salir
              </button>
            </form>
          )}
        </div>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Presentaciones</h1>
          {editable && (
            <div className="flex flex-wrap gap-2">
              <Importar />
              <NuevaPresentacion presentaciones={breves} />
            </div>
          )}
        </div>

        <ul className="mt-8 divide-y divide-linea border-y border-linea">
          {presentaciones.map((p) => {
            const primero = p.periodos[0];
            const ultimo = p.periodos[p.periodos.length - 1];
            return (
              <li key={p.id} className="flex items-center gap-1 transition-colors hover:bg-tinte sm:pr-3">
                <Link href={`/p/${p.id}`} className="group block min-w-0 flex-1 py-6 sm:px-4">
                  <h2 className="text-2xl font-semibold group-hover:text-primario">{p.nombre}</h2>
                  {p.descripcion && <p className="mt-1 text-tinta-suave">{p.descripcion}</p>}
                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-tinta-suave">
                    <div><dt className="sr-only">Diapositivas</dt><dd>{p.diapositivas} diapositivas</dd></div>
                    {primero && (
                      <div>
                        <dt className="sr-only">Meses</dt>
                        <dd>{primero === ultimo ? nombrePeriodo(ultimo) : `${nombrePeriodo(primero)} a ${nombrePeriodo(ultimo)}`}</dd>
                      </div>
                    )}
                    <div><dt className="sr-only">Última actualización</dt><dd>Actualizada el {fecha.format(new Date(p.actualizado))}</dd></div>
                  </dl>
                </Link>
                {editable && (
                  <div className="flex shrink-0 items-center">
                    <NuevaPresentacion presentaciones={breves} copiaDe={{ id: p.id, nombre: p.nombre }} compacto />
                    <EliminarPresentacion presentacion={{ id: p.id, nombre: p.nombre }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {!presentaciones.length && (
          <p className="mt-6 text-tinta-suave">
            No hay presentaciones. {editable ? 'Crea una con "Nueva presentación" o recupera una de la papelera.' : ''}
          </p>
        )}

        {eliminadas.length > 0 && (
          <details className="mt-12 rounded-xl border border-linea">
            <summary className="cursor-pointer select-none px-4 py-3 text-[15px] font-semibold text-tinta-suave hover:text-tinta">
              Papelera ({eliminadas.length})
            </summary>
            <ul className="divide-y divide-linea border-t border-linea">
              {eliminadas.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{p.nombre}</p>
                    <p className="text-[13px] text-tinta-suave">
                      {p.diapositivas} diapositivas · eliminada el {fecha.format(new Date(p.eliminado ?? p.actualizado))}
                    </p>
                  </div>
                  <RecuperarPresentacion presentacion={{ id: p.id, nombre: p.nombre }} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </main>
    </div>
  );
}
