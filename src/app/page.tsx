import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { obtenerAlmacen } from '@/lib/almacen';
import { nombrePeriodo } from '@/lib/periodos';

// La lista sale de la base de datos: se arma en cada visita, no al compilar.
export const dynamic = 'force-dynamic';

const fecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' });

export default async function Inicio() {
  const presentaciones = await (await obtenerAlmacen()).listar();

  return (
    <div className="min-h-full bg-white">
      <div className="h-1.5" style={{ background: 'var(--vp-degradado-h)' }} />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <div className="flex items-center gap-3">
          <Logo alto={40} />
          <span className="text-lg font-semibold">Visualización Presente</span>
        </div>

        <h1 className="mt-12 text-4xl font-bold tracking-tight sm:text-5xl">Presentaciones</h1>

        <ul className="mt-8 divide-y divide-linea border-y border-linea">
          {presentaciones.map((p) => {
            const primero = p.periodos[0];
            const ultimo = p.periodos[p.periodos.length - 1];
            return (
              <li key={p.id}>
                <Link href={`/p/${p.id}`} className="group block py-6 transition-colors hover:bg-tinte sm:px-4">
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
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
