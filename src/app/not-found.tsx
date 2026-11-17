import Link from 'next/link';

export default function NoEncontrada() {
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col justify-center px-5 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Esta página no existe</h1>
      <p className="mt-3 text-tinta-suave">El enlace puede estar mal escrito o la presentación fue eliminada.</p>
      <Link href="/" className="mt-6 font-semibold text-primario underline underline-offset-4">Ver todas las presentaciones</Link>
    </main>
  );
}
