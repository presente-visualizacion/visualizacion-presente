'use client';

import dynamic from 'next/dynamic';
import { Fragment, useContext, useLayoutEffect, useState } from 'react';
import { conjuntoDe, filasDe, resolverCifra, valorDe } from '@/lib/datos';
import { formatear } from '@/lib/formato';
import { trozos } from '@/lib/formatoTexto';
import { contraste } from '@/lib/color';
import { fuenteCss } from '@/lib/fuentes';
import { FuenteActual } from './graficoComun';
import { conMes } from '@/lib/periodos';
import { armarTabla, type ColumnaVista, type TablaArmada } from '@/lib/tablas';
import type {
  Bloque, BloqueCifras, BloqueGrafico, BloqueTabla, BloqueTarjetas, BloqueTexto, Fila, IdPeriodo, Presentacion, Resaltado,
} from '@/lib/tipos';
import { SinDatos } from './SinDatos';

// La librería de gráficos solo se descarga cuando una diapositiva la necesita.
const Grafico = dynamic(() => import('./Grafico'), {
  ssr: false,
  loading: () => <div className="h-full rounded-[10px] bg-fondo-app" aria-label="Cargando gráfico" />,
});

interface Contexto {
  presentacion: Presentacion;
  periodo: IdPeriodo;
}

/** Colores de los valores con signo: legibles sobre blanco. */
export const POSITIVO = '#0F7B55';
export const NEGATIVO = '#B42318';

/**
 * Mide el alto y el ancho de una caja (en px del lienzo). Devuelve una ref de
 * función: sigue midiendo aunque la caja aparezca después (por ejemplo, al
 * pasar de un mes sin datos a uno con datos).
 */
function useMedida<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [medida, setMedida] = useState({ ancho: 0, alto: 0 });
  useLayoutEffect(() => {
    if (!el) return;
    const medir = () => setMedida({ ancho: el.clientWidth, alto: el.clientHeight });
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [el]);
  return [setEl, medida] as const;
}

/**
 * Tamaño de letra (en px del lienzo) para que el contenido quepa en su caja
 * sin desplazamiento: prueba tamaños entre `base` y el 60 % de `base` y deja
 * el mayor que cabe. Vuelve a calcular si cambian el contenido o la caja.
 */
function useAjuste<T extends HTMLElement>(clave: string, base: number) {
  const [el, setEl] = useState<T | null>(null);
  const [tamano, setTamano] = useState(base);
  // Otro tipo de letra ocupa otro espacio: se vuelve a calcular al cambiarlo.
  const fuente = useContext(FuenteActual);
  useLayoutEffect(() => {
    if (!el) return;
    const cabe = () => el.scrollHeight <= el.clientHeight + 1;
    const ajustar = () => {
      el.style.fontSize = `${base}px`;
      if (cabe()) return setTamano(base);
      let bajo = base * 0.6;
      let alto = base;
      for (let i = 0; i < 7; i++) {
        const medio = (bajo + alto) / 2;
        el.style.fontSize = `${medio}px`;
        if (cabe()) bajo = medio;
        else alto = medio;
      }
      el.style.fontSize = `${bajo}px`;
      setTamano(Math.floor(bajo * 10) / 10);
    };
    ajustar();
    let ancho = el.offsetWidth;
    let altoCaja = el.offsetHeight;
    const observador = new ResizeObserver(() => {
      if (el.offsetWidth === ancho && el.offsetHeight === altoCaja) return;
      ancho = el.offsetWidth;
      altoCaja = el.offsetHeight;
      ajustar();
    });
    observador.observe(el);
    // Y cuando termina de cargar la letra (al principio se mide con otra).
    let vivo = true;
    const alCargar = () => vivo && ajustar();
    document.fonts?.ready.then(alCargar);
    document.fonts?.addEventListener('loadingdone', alCargar);
    return () => {
      vivo = false;
      observador.disconnect();
      document.fonts?.removeEventListener('loadingdone', alCargar);
    };
  }, [el, clave, base, fuente]);
  return [setEl, tamano, tamano <= base * 0.6 + 0.1] as const;
}

export function VistaBloque({ bloque, ...contexto }: Contexto & { bloque: Bloque }) {
  // data-vp-bloque: lo usa el editor para dibujar el marco que mueve el bloque.
  const interior = <VistaBloqueInterior bloque={bloque} {...contexto} />;
  if (!bloque.fuente) return <div data-vp-bloque={bloque.id} className="h-full min-h-0 min-w-0">{interior}</div>;
  const css = fuenteCss(bloque.fuente);
  return (
    <FuenteActual.Provider value={css}>
      <div data-vp-bloque={bloque.id} className="h-full min-h-0 min-w-0" style={{ fontFamily: css }}>{interior}</div>
    </FuenteActual.Provider>
  );
}

function VistaBloqueInterior({ bloque, ...contexto }: Contexto & { bloque: Bloque }) {
  const contenido = (() => {
    switch (bloque.tipo) {
      case 'grafico': return <VistaGrafico bloque={bloque} {...contexto} />;
      case 'tabla': return <VistaTabla bloque={bloque} {...contexto} />;
      case 'texto': return <VistaTexto bloque={bloque} {...contexto} />;
      case 'cifras': return <VistaCifras bloque={bloque} {...contexto} />;
      case 'tarjetas': return <VistaTarjetas bloque={bloque} {...contexto} />;
    }
  })();
  const conMarco = !bloque.titulo && !bloque.nota ? contenido : (
    <div className="flex h-full min-h-0 flex-col">
      {bloque.titulo && (
        <h3 className="mb-[12px] shrink-0 text-[16px] font-bold uppercase tracking-[0.06em] text-primario">{conMes(bloque.titulo, contexto.periodo)}</h3>
      )}
      <div className="min-h-0 flex-1">{contenido}</div>
      {bloque.nota && <p className="mt-[8px] shrink-0 text-[13px] leading-[1.4] text-tinta-suave">{conMes(bloque.nota, contexto.periodo)}</p>}
    </div>
  );
  const { colorFondo } = bloque;
  // Sobre un color oscuro, si no se eligió color de letra, va en blanco.
  const colorTexto = bloque.colorTexto ?? (colorFondo && esOscuro(colorFondo) ? '#FFFFFF' : undefined);
  if (!bloque.fondo && !colorFondo && !colorTexto) return conMarco;
  const relleno = colorFondo || bloque.fondo ? 'rounded-[14px] px-[22px] py-[12px]' : '';
  const clase = colorFondo ? '' : bloque.fondo ? CLASE_FONDO[bloque.fondo] : '';
  const estilo = {
    ...(colorFondo ? { background: colorFondo } : {}),
    ...(colorTexto ? { '--vp-texto': colorTexto } : {}),
  } as React.CSSProperties;
  return <div className={`h-full min-h-0 ${relleno} ${clase} ${colorTexto ? 'vp-color-texto' : ''}`} style={estilo}>{conMarco}</div>;
}

/** true si sobre ese color se lee mejor la letra blanca. */
export function esOscuro(hex: string): boolean {
  return contraste(hex, '#FFFFFF') > contraste(hex, '#241A20');
}

/** Fondos del bloque. El oscuro cambia los colores del texto (ver globals.css). */
const CLASE_FONDO: Record<NonNullable<Bloque['fondo']>, string> = {
  tinte: 'bg-tinte',
  recuadro: 'border border-linea-fuerte',
  oscuro: 'vp-fondo-oscuro',
};

function VistaGrafico({ bloque, presentacion, periodo }: Contexto & { bloque: BloqueGrafico }) {
  const conjunto = conjuntoDe(presentacion, bloque.datos);
  const filas = filasDe(conjunto, periodo);
  if (!conjunto || !filas?.length) return <SinDatos periodo={periodo} />;
  return <Grafico bloque={bloque} conjunto={conjunto} filas={filas} tema={presentacion.tema} />;
}

function VistaTabla({ bloque, presentacion, periodo }: Contexto & { bloque: BloqueTabla }) {
  const conjunto = conjuntoDe(presentacion, bloque.datos);
  const tabla = conjunto ? armarTabla(presentacion, bloque, conjunto, periodo) : null;
  if (!tabla) return <SinDatos periodo={periodo} />;
  return <Tabla tabla={tabla} resaltar={bloque.resaltar} />;
}

/** Texto con aspecto de número ("$101.110 mil M", "↑ 0,5%"): va a la derecha. */
const pareceNumero = (v: Fila[string]) => typeof v === 'string' && /^[\s$+\-−↑↓(]*\d/.test(v);

function Celda({ valor, columna }: { valor: Fila[string]; columna: ColumnaVista['columna'] }) {
  if (columna.signo && typeof valor === 'number') {
    const texto = formatear(valor, columna);
    return <span style={{ color: valor > 0 ? POSITIVO : valor < 0 ? NEGATIVO : undefined }}>{valor > 0 ? `+${texto}` : texto}</span>;
  }
  return <>{formatear(valor, columna)}</>;
}

function Tabla({ tabla, resaltar }: { tabla: TablaArmada; resaltar?: Resaltado }) {
  // Las filas se reparten el alto disponible para que la tabla quepa completa
  // en la diapositiva; solo aparece desplazamiento si hay demasiadas filas.
  const [caja, { alto }] = useMedida<HTMLDivElement>();
  const { columnas, filas, grupos } = tabla;
  // Densa: muchas columnas, o poco alto para tantas filas (como en una cuadrícula).
  const densa = columnas.length > 10 || (alto > 0 && (alto - (grupos ? 92 : 46)) / filas.length < 26);
  const altoEncabezado = densa ? 34 : 46;
  const encabezados = grupos ? altoEncabezado * 2 : altoEncabezado;
  const minimo = densa ? 21 : 26;
  const altoFila = Math.min(54, Math.max(minimo, Math.floor((alto - encabezados - 2) / filas.length)));
  const letra = densa
    ? (altoFila >= 30 ? 14 : altoFila >= 26 ? 13 : 12)
    : (altoFila >= 40 ? 18 : altoFila >= 34 ? 17 : altoFila >= 29 ? 15 : 13.5);
  const margen = densa ? 'px-[7px]' : 'px-[18px]';
  const letraEncabezado = densa ? 'text-[12.5px]' : 'text-[15px]';

  // Alineación: la primera columna de texto a la izquierda; números (y textos
  // con forma de número) a la derecha.
  const derecha = columnas.map((c, j) => {
    if (c.columna.tipo !== 'texto') return true;
    if (j === 0) return false;
    const valores = filas.flatMap((f) => (f.tipo === 'datos' && f.fila[c.clave] !== null && f.fila[c.clave] !== '' ? [f.fila[c.clave]] : []));
    return valores.length > 0 && valores.every(pareceNumero);
  });
  const alinear = (j: number) => (derecha[j] ? 'text-right' : 'text-left');
  const separador = (j: number) => (grupos && j > 0 && columnas[j].columna.grupo !== columnas[j - 1].columna.grupo ? 'border-l border-linea' : '');

  return (
    <div ref={caja} className="h-full overflow-auto rounded-[10px] border border-linea">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-[1] bg-white">
          {grupos && (
            <tr style={{ height: altoEncabezado }}>
              {(() => {
                let inicio = 0;
                return grupos.map((g, i) => {
                  const desde = inicio;
                  inicio += g.columnas;
                  if (g.nombre === null) {
                    return columnas.slice(desde, desde + g.columnas).map((c, k) => (
                      <th key={`${i}-${k}`} rowSpan={2} scope="col" className={`border-b border-linea-fuerte ${margen} ${letraEncabezado} font-semibold text-tinta-suave ${alinear(desde + k)} ${separador(desde + k)}`}>
                        {c.columna.nombre}
                      </th>
                    ));
                  }
                  return (
                    <th key={i} colSpan={g.columnas} scope="colgroup" className={`border-b border-linea ${margen} text-center ${letraEncabezado} font-bold uppercase tracking-[0.04em] text-primario ${desde > 0 ? 'border-l' : ''}`}>
                      {g.nombre}
                    </th>
                  );
                });
              })()}
            </tr>
          )}
          <tr style={{ height: altoEncabezado }}>
            {columnas.map((c, j) => (grupos && !c.columna.grupo?.trim() ? null : (
              <th key={c.clave} scope="col" className={`border-b border-linea-fuerte ${margen} ${letraEncabezado} font-semibold text-tinta-suave ${alinear(j)} ${separador(j)}`}>
                {c.columna.nombre}
              </th>
            )))}
          </tr>
        </thead>
        <tbody style={{ fontSize: letra }}>
          {filas.map((f, i) => {
            const ultima = i === filas.length - 1;
            if (f.tipo === 'seccion') {
              return (
                <tr key={i} style={{ height: altoFila }} className="bg-fondo-app">
                  <th colSpan={columnas.length} scope="rowgroup" className={`${margen} border-b border-linea text-left text-[0.85em] font-bold uppercase tracking-[0.06em] text-tinta`}>
                    {f.titulo}
                  </th>
                </tr>
              );
            }
            const destacada = resaltar && String(f.fila[resaltar.columna]) === resaltar.valor;
            return (
              <tr key={i} style={{ height: altoFila }} className={destacada ? 'bg-tinte font-semibold' : 'hover:bg-fondo-app'}>
                {columnas.map((c, j) => (
                  <td
                    key={c.clave}
                    className={`${margen} ${ultima ? '' : 'border-b border-linea'} ${alinear(j)} ${derecha[j] ? 'whitespace-nowrap' : ''} ${separador(j)} ${c.calculada ? 'text-[0.9em]' : ''} ${destacada && j === 0 ? 'text-primario' : ''}`}
                    style={destacada && j === 0 ? { boxShadow: 'inset 4px 0 0 var(--vp-primario)' } : undefined}
                  >
                    <Celda valor={f.fila[c.clave]} columna={c.columna} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** "**así**" se escribe en negrita y "{azul:así}" en color (ver formatoTexto.ts). */
export function ConNegritas({ texto }: { texto: string }) {
  return (
    <>
      {trozos(texto).map((t, i) => {
        if (!t.negrita && !t.color) return <Fragment key={i}>{t.texto}</Fragment>;
        const estilo = t.color ? { color: t.color } : undefined;
        return t.negrita
          ? <strong key={i} className="font-bold" style={estilo}>{t.texto}</strong>
          : <span key={i} style={estilo}>{t.texto}</span>;
      })}
    </>
  );
}

/** Párrafos, viñetas ("- ") y líneas grandes ("# ") de un texto. */
export function partesDeTexto(contenido: string): { tipo: 'parrafo' | 'lista' | 'grande'; lineas: string[] }[] {
  const partes: { tipo: 'parrafo' | 'lista' | 'grande'; lineas: string[] }[] = [];
  for (const linea of contenido.split('\n')) {
    const texto = linea.trim();
    if (!texto) continue;
    if (texto.startsWith('# ')) {
      partes.push({ tipo: 'grande', lineas: [texto.slice(2)] });
      continue;
    }
    const esVineta = texto.startsWith('- ');
    const ultima = partes[partes.length - 1];
    if (esVineta && ultima?.tipo === 'lista') ultima.lineas.push(texto.slice(2));
    else partes.push({ tipo: esVineta ? 'lista' : 'parrafo', lineas: [esVineta ? texto.slice(2) : texto] });
  }
  return partes;
}

function VistaTexto({ bloque, periodo }: Contexto & { bloque: BloqueTexto }) {
  const [medir, { ancho }] = useMedida<HTMLDivElement>();
  const contenido = valorDe(bloque.contenido, periodo);
  // En una caja angosta (cuadrícula, lateral) la letra baja un poco; si aun
  // así no cabe, se achica hasta que quepa.
  const chico = ancho > 0 && ancho < 640;
  const [ajustar, tamano, alMinimo] = useAjuste<HTMLDivElement>(contenido ?? '', chico ? 18 : 23);
  if (!contenido?.trim()) return <SinDatos periodo={periodo} que="texto" />;

  const partes = partesDeTexto(conMes(contenido, periodo));
  const caja = (el: HTMLDivElement | null) => {
    medir(el);
    ajustar(el);
  };

  return (
    // Sin barra de desplazamiento mientras se ajusta (la barra cambia el ancho y
    // haría volver a empezar); solo si al mínimo aún no cabe.
    <div ref={caja} className={`h-full max-w-[1040px] leading-[1.5] text-tinta [&>*:last-child]:mb-0 ${alMinimo ? 'overflow-auto' : 'overflow-hidden'}`} style={{ fontSize: tamano }}>
      {partes.map((parte, i) => {
        if (parte.tipo === 'grande') {
          return <p key={i} className="mb-[0.4em] font-bold leading-[1.15] tracking-[-0.02em]" style={{ fontSize: '2.2em' }}><ConNegritas texto={parte.lineas[0]} /></p>;
        }
        if (parte.tipo === 'lista') {
          return (
            <ul key={i} className="mb-[0.7em] space-y-[0.55em]">
              {parte.lineas.map((linea, j) => (
                <li key={j} className="relative pl-[1.3em]">
                  <span aria-hidden className="absolute left-0 top-[0.55em] h-[0.4em] w-[0.4em] rounded-full bg-primario" />
                  <ConNegritas texto={linea} />
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="mb-[0.7em]"><ConNegritas texto={parte.lineas[0]} /></p>;
      })}
    </div>
  );
}

function VistaCifras({ bloque, presentacion, periodo }: Contexto & { bloque: BloqueCifras }) {
  const [caja, { ancho, alto }] = useMedida<HTMLDivElement>();
  const cifras = valorDe(bloque.cifras, periodo);
  if (!cifras?.length) return <SinDatos periodo={periodo} que="cifras" />;

  const vistas = cifras.map((c) => ({ etiqueta: c.etiqueta, ...resolverCifra(presentacion, c, periodo) }));
  // Todas salen de los datos y el mes no los tiene: el aviso de siempre.
  if (vistas.every((v) => v.sinDato)) return <SinDatos periodo={periodo} />;
  // Una al lado de la otra si caben (al menos 190 px cada una); si no, una
  // debajo de la otra, como en el costado de una diapositiva.
  const vertical = ancho > 0 && ancho / cifras.length < 190;
  // En una franja baja (disposición libre) el número se achica para caber.
  const base = vertical ? (alto > 0 && alto / cifras.length < 100 ? 30 : 36) : alto > 0 && alto < 95 ? 32 : 46;
  // Y que el número más largo quepa en una línea y en el alto: si no, se
  // salía de su caja y pisaba el bloque de abajo.
  const largo = Math.max(...vistas.map((v) => `${v.valor}${v.unidad ? ` ${v.unidad}` : ''}`.length), 1);
  const anchoColumna = vertical ? ancho - 28 : ancho / cifras.length - 56;
  const conDetalle = vistas.some((v) => v.detalle);
  const chica = !vertical && alto > 0 && alto < 130;
  const porAncho = anchoColumna > 0 ? anchoColumna / (largo * 0.6) : base;
  const porAlto = !vertical && alto > 0 ? (alto - (chica ? 20 : 26) - (conDetalle ? (chica ? 22 : 28) : 0)) / 1.12 : base;
  const valorGrande = Math.round(Math.max(20, Math.min(base, porAncho, porAlto)));

  return (
    <div ref={caja} className="h-full">
      <dl
        className={vertical ? 'flex h-full flex-col justify-center gap-[18px] border-l border-linea-fuerte pl-[28px]' : 'grid divide-x divide-linea-fuerte'}
        style={vertical ? undefined : { gridTemplateColumns: `repeat(${cifras.length}, minmax(0, 1fr))` }}
      >
        {vistas.map((cifra, i) => (
          <div key={i} className={vertical ? '' : 'px-[28px] first:pl-0'}>
            <dt className={`${chica ? 'text-[15px]' : 'text-[17px]'} text-tinta-suave`}>{cifra.etiqueta}</dt>
            <dd className="mt-[4px] font-bold leading-[1.1] tracking-[-0.02em] text-tinta" style={{ fontSize: valorGrande }}>
              {cifra.valor}
              {cifra.unidad && <span className="ml-[0.25em] text-[0.5em] font-semibold tracking-normal text-tinta-suave">{cifra.unidad}</span>}
            </dd>
            {cifra.detalle && <dd className={`${chica ? 'mt-[2px] text-[14px]' : 'mt-[6px] text-[16px]'} text-tinta-suave`}>{cifra.detalle}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}

function VistaTarjetas({ bloque, periodo }: Contexto & { bloque: BloqueTarjetas }) {
  const [medir, { ancho }] = useMedida<HTMLDivElement>();
  const tarjetas = valorDe(bloque.tarjetas, periodo);
  // Lado a lado si cada una tiene al menos 260 px; si no, una debajo de la otra.
  const cuantas = tarjetas?.length ?? 0;
  const columnas = ancho > 0 ? Math.max(1, Math.min(cuantas, Math.floor((ancho + 20) / 280))) : cuantas;
  const [ajustar, tamano, alMinimo] = useAjuste<HTMLDivElement>(`${JSON.stringify(tarjetas ?? null)}|${columnas}`, 17);
  if (!tarjetas?.length) return <SinDatos periodo={periodo} que="tarjetas" />;
  const caja = (el: HTMLDivElement | null) => {
    medir(el);
    ajustar(el);
  };
  return (
    <div ref={caja} className={`h-full ${alMinimo ? 'overflow-auto' : 'overflow-hidden'}`} style={{ fontSize: tamano }}>
      <ul className="grid gap-[1.1em]" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
        {tarjetas.map((t, i) => (
          <li key={i} className="rounded-[12px] border border-linea bg-white px-[1.4em] py-[1.1em]">
            {t.titulo && <p className="text-[1.24em] font-bold leading-[1.25] text-tinta"><ConNegritas texto={conMes(t.titulo, periodo)} /></p>}
            {t.texto && <p className={`${t.titulo ? 'mt-[0.45em]' : ''} whitespace-pre-line leading-[1.5] text-tinta-suave`}><ConNegritas texto={conMes(t.texto, periodo)} /></p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
