'use client';

import { ConNegritas, esOscuro, VistaBloque } from '@/components/bloques/Bloques';
import { Logo } from '@/components/Logo';
import { filasUsadas, ubicacionesEfectivas } from '@/lib/disposicion';
import { conMes, nombrePeriodo } from '@/lib/periodos';
import type { Diapositiva as TipoDiapositiva, IdPeriodo, Presentacion } from '@/lib/tipos';

// Todas las diapositivas se dibujan sobre un lienzo fijo de 1280 x 720 px que
// luego se escala al tamaño disponible (ver Lienzo). Por eso las medidas de
// este archivo y de los bloques están en px: son px del lienzo, no de pantalla.
export const ANCHO = 1280;
export const ALTO = 720;

interface Props {
  presentacion: Presentacion;
  diapositiva: TipoDiapositiva;
  periodo: IdPeriodo;
  numero: number;
}

export function Diapositiva(props: Props) {
  const { diapositiva } = props;
  if (diapositiva.tipo === 'portada') return <Portada {...props} />;
  if (diapositiva.tipo === 'cierre') return <Cierre {...props} />;
  return <Contenido {...props} />;
}

function PanelMarca({ logo }: { logo: string }) {
  return (
    <div className="flex h-full w-[470px] shrink-0 items-center justify-center" style={{ background: 'var(--vp-degradado)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt="Presente Fondo de Empleados" className="w-[330px]" />
    </div>
  );
}

/** Fondo elegido para la diapositiva y, si es oscuro, letra clara. */
function fondoDe(d: TipoDiapositiva): { className: string; style?: React.CSSProperties } {
  if (!d.fondo) return { className: 'bg-white' };
  const oscuro = esOscuro(d.fondo);
  return {
    className: oscuro ? 'vp-color-texto' : '',
    style: { background: d.fondo, ...(oscuro ? { '--vp-texto': '#FFFFFF' } : {}) } as React.CSSProperties,
  };
}

function Portada({ presentacion, diapositiva, periodo }: Props) {
  const fondo = fondoDe(diapositiva);
  return (
    <div className={`flex h-full w-full ${fondo.className}`} style={fondo.style}>
      <PanelMarca logo={presentacion.tema.logo} />
      <div className="flex min-w-0 flex-1 flex-col justify-center px-[76px]">
        <h1 className="text-[78px] font-bold leading-[1.02] tracking-[-0.03em] text-tinta"><ConNegritas texto={conMes(diapositiva.titulo, periodo)} /></h1>
        {diapositiva.subtitulo && <p className="mt-[22px] text-[34px] font-medium text-primario"><ConNegritas texto={conMes(diapositiva.subtitulo, periodo)} /></p>}
      </div>
    </div>
  );
}

function Cierre({ presentacion, diapositiva, periodo }: Props) {
  const fondo = fondoDe(diapositiva);
  return (
    <div className={`flex h-full w-full ${fondo.className}`} style={fondo.style}>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-[76px]">
        <h1 className="text-[78px] font-bold leading-[1.02] tracking-[-0.03em] text-tinta"><ConNegritas texto={conMes(diapositiva.titulo, periodo)} /></h1>
        {diapositiva.subtitulo && <p className="mt-[22px] text-[30px] font-medium text-tinta-suave"><ConNegritas texto={conMes(diapositiva.subtitulo, periodo)} /></p>}
      </div>
      <PanelMarca logo={presentacion.tema.logo} />
    </div>
  );
}

function Contenido({ presentacion, diapositiva, periodo, numero }: Props) {
  const { bloques, disposicion = 'una' } = diapositiva;
  const vista = (indice: number) => <VistaBloque bloque={bloques[indice]} presentacion={presentacion} periodo={periodo} />;

  let cuerpo: React.ReactNode;
  if (disposicion === 'columnas') {
    cuerpo = (
      <div className="grid h-full gap-[32px]" style={{ gridTemplateColumns: `repeat(${bloques.length}, minmax(0, 1fr))` }}>
        {bloques.map((b, i) => <div key={b.id} className="min-h-0 min-w-0">{vista(i)}</div>)}
      </div>
    );
  } else if (disposicion === 'filas') {
    cuerpo = (
      <div className="flex h-full flex-col gap-[30px]">
        {bloques.map((b, i) => <div key={b.id} className={i === bloques.length - 1 ? 'min-h-0 flex-1' : 'shrink-0'}>{vista(i)}</div>)}
      </div>
    );
  } else if (disposicion === 'principal-lateral') {
    cuerpo = (
      // Un costado solo de cifras queda angosto, para que el principal tenga más espacio.
      <div
        className="grid h-full gap-[32px]"
        style={{ gridTemplateColumns: bloques.length > 1 && bloques.slice(1).every((b) => b.tipo === 'cifras') ? 'minmax(0, 1fr) 300px' : 'minmax(0, 2fr) minmax(0, 1fr)' }}
      >
        <div className="min-h-0 min-w-0">{bloques[0] && vista(0)}</div>
        <div className="flex min-h-0 min-w-0 flex-col gap-[24px]">
          {bloques.slice(1).map((b, i) => <div key={b.id} className="min-h-0 flex-1">{vista(i + 1)}</div>)}
        </div>
      </div>
    );
  } else if (disposicion === 'libre') {
    // Cada bloque en su rectángulo de una cuadrícula de 12 columnas.
    const lugares = ubicacionesEfectivas(bloques);
    cuerpo = (
      <div
        className="grid h-full gap-x-[28px] gap-y-[14px]"
        style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gridTemplateRows: `repeat(${filasUsadas(lugares)}, minmax(0, 1fr))` }}
      >
        {bloques.map((b, i) => {
          const u = lugares[i];
          return (
            <div key={b.id} className="min-h-0 min-w-0" style={{ gridColumn: `${u.columna} / span ${u.ancho}`, gridRow: `${u.fila} / span ${u.alto}` }}>
              {vista(i)}
            </div>
          );
        })}
      </div>
    );
  } else if (disposicion === 'cuadricula') {
    // Cada bloque en un recuadro, de a dos por fila.
    cuerpo = (
      <div className="grid h-full grid-cols-2 gap-[22px]" style={{ gridTemplateRows: `repeat(${Math.max(1, Math.ceil(bloques.length / 2))}, minmax(0, 1fr))` }}>
        {bloques.map((b, i) => (
          <div key={b.id} className="min-h-0 min-w-0 rounded-[14px] border border-linea px-[24px] py-[18px]">{vista(i)}</div>
        ))}
      </div>
    );
  } else {
    cuerpo = <div className="h-full min-h-0">{bloques[0] && vista(0)}</div>;
  }

  const fondo = fondoDe(diapositiva);
  return (
    <div className={`flex h-full w-full flex-col px-[64px] pb-[26px] pt-[46px] ${fondo.className}`} style={fondo.style}>
      <header className="flex shrink-0 gap-[20px]">
        <span aria-hidden className="w-[6px] shrink-0 rounded-full" style={{ background: 'var(--vp-degradado)' }} />
        <div className="min-w-0">
          <h2 className="text-[38px] font-bold leading-[1.12] tracking-[-0.02em] text-tinta"><ConNegritas texto={conMes(diapositiva.titulo, periodo)} /></h2>
          {diapositiva.subtitulo && <p className="mt-[5px] text-[19px] text-tinta-suave"><ConNegritas texto={conMes(diapositiva.subtitulo, periodo)} /></p>}
        </div>
      </header>
      <div className="mt-[28px] min-h-0 flex-1">{cuerpo}</div>
      <footer className="mt-[18px] flex shrink-0 items-center gap-[20px] text-[15px] text-tinta-suave">
        <Logo alto={26} src={presentacion.tema.logo} />
        <span className="ml-auto">{nombrePeriodo(periodo)}</span>
        <span className="min-w-[24px] text-right font-semibold text-tinta">{numero}</span>
      </footer>
    </div>
  );
}
