import { redirect } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { claveConfigurada, destinoSeguro } from '@/lib/clave';

// Pantalla de entrada: pide la clave del sitio (variable CLAVE_EDICION en
// Vercel). El formulario va a /api/entrar, que pone la cookie y vuelve a la
// página de la que venía.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Entrar · Visualización Presente' };

export default async function Entrar({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!claveConfigurada()) redirect('/');
  const params = await searchParams;
  const desde = destinoSeguro(typeof params.desde === 'string' ? params.desde : '/');
  const fallo = params.error === '1';

  return (
    <div className="min-h-full bg-white">
      <div className="h-1.5" style={{ background: 'var(--vp-degradado-h)' }} />
      <main className="mx-auto flex max-w-md flex-col px-5 py-14 sm:py-20">
        <div className="flex items-center gap-3">
          <Logo alto={40} />
          <span className="text-lg font-semibold">Visualización Presente</span>
        </div>

        <h1 className="mt-12 text-3xl font-bold tracking-tight">Entrar</h1>
        <p className="mt-2 text-tinta-suave">Escribe la clave para ver y editar las presentaciones.</p>

        <form method="post" action="/api/entrar" className="mt-8 flex flex-col gap-4">
          <input type="hidden" name="desde" value={desde} />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Clave</span>
            <input
              type="password"
              name="clave"
              required
              autoFocus
              autoComplete="current-password"
              aria-invalid={fallo || undefined}
              aria-describedby={fallo ? 'error-clave' : undefined}
              className="rounded-lg border border-linea-fuerte px-3 py-2.5 text-base focus:border-primario"
            />
          </label>
          {fallo && (
            <p id="error-clave" role="alert" className="text-sm font-medium text-primario">
              La clave no es correcta. Inténtalo de nuevo.
            </p>
          )}
          <button
            type="submit"
            className="rounded-lg bg-primario px-4 py-2.5 font-semibold text-white transition-opacity hover:opacity-90"
          >
            Entrar
          </button>
        </form>
      </main>
    </div>
  );
}
