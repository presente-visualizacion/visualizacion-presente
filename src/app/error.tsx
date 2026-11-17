'use client';

// Se muestra si una página falla al cargar, por ejemplo si la base de datos no
// responde. La base gratuita se duerme cuando nadie la usa; reintentar basta.
export default function ErrorDePagina({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col justify-center px-5 py-16">
      <h1 className="text-3xl font-bold tracking-tight">No se pudo cargar</h1>
      <p className="mt-3 text-tinta-suave">Puede ser un problema pasajero de conexión con la base de datos.</p>
      <div className="mt-6">
        <button type="button" onClick={reset} className="h-10 rounded-full bg-primario px-5 font-semibold text-white transition-[filter] hover:brightness-90">
          Reintentar
        </button>
      </div>
    </main>
  );
}
