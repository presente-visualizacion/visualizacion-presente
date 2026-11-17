/** Logo de Presente sobre su degradado. `alto` es la altura de la placa en px. */
export function Logo({ alto = 36, src = '/logo-presente-blanco.png' }: { alto?: number; src?: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ height: alto, width: alto * 2.5, borderRadius: alto * 0.2, background: 'var(--vp-degradado)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Presente Fondo de Empleados" style={{ height: alto * 0.56 }} />
    </span>
  );
}
