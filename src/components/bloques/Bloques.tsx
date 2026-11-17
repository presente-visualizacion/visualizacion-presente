'use client';

import dynamic from 'next/dynamic';
import { useLayoutEffect, useRef, useState } from 'react';
import { columnaDe, conjuntoDe, filasDe, valorDe } from '@/lib/datos';
import { formatear } from '@/lib/formato';
import { conMes } from '@/lib/periodos';
import type { Bloque, BloqueCifras, BloqueGrafico, BloqueTabla, BloqueTexto, Columna, Fila, IdPeriodo, Presentacion, Resaltado } from '@/lib/tipos';
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

export function VistaBloque({ bloque, ...contexto }: Contexto & { bloque: Bloque }) {
  switch (bloque.tipo) {
    case 'grafico': return <VistaGrafico bloque={bloque} {...contexto} />;
    case 'tabla': return <VistaTabla bloque={bloque} {...contexto} />;
    case 'texto': return <VistaTexto bloque={bloque} {...contexto} />;
    case 'cifras': return <VistaCifras bloque={bloque} {...contexto} />;
  }
}

function VistaGrafico({ bloque, presentacion, periodo }: Contexto & { bloque: BloqueGrafico }) {
  const conjunto = conjuntoDe(presentacion, bloque.datos);
  const filas = filasDe(conjunto, periodo);
  if (!conjunto || !filas?.length) return <SinDatos periodo={periodo} />;
  return <Grafico bloque={bloque} conjunto={conjunto} filas={filas} tema={presentacion.tema} />;
}

function VistaTabla({ bloque, presentacion, periodo }: Contexto & { bloque: BloqueTabla }) {
  const conjunto = conjuntoDe(presentacion, bloque.datos);
  const filas = filasDe(conjunto, periodo);
  if (!conjunto || !filas?.length) return <SinDatos periodo={periodo} />;

  const columnas = bloque.columnas
    ? bloque.columnas.map((clave) => columnaDe(conjunto, clave)).filter((c) => c !== undefined)
    : conjunto.columnas;

  return <Tabla columnas={columnas} filas={filas} resaltar={bloque.resaltar} />;
}

const ALTO_ENCABEZADO = 46;

function Tabla({ columnas, filas, resaltar }: { columnas: Columna[]; filas: Fila[]; resaltar?: Resaltado }) {
  // Las filas se reparten el alto disponible para que la tabla quepa completa
  // en la diapositiva; solo aparece desplazamiento si hay demasiadas filas.
  const caja = useRef<HTMLDivElement>(null);
  const [alto, setAlto] = useState(0);
  useLayoutEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => setAlto(el.clientHeight);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const altoFila = Math.min(54, Math.max(26, Math.floor((alto - ALTO_ENCABEZADO - 2) / filas.length)));
  const letra = altoFila >= 40 ? 18 : altoFila >= 34 ? 17 : altoFila >= 29 ? 15 : 13.5;

  return (
    <div ref={caja} className="h-full overflow-auto rounded-[10px] border border-linea">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ height: ALTO_ENCABEZADO }}>
            {columnas.map((c) => (
              <th key={c.clave} scope="col" className={`sticky top-0 border-b border-linea-fuerte bg-white px-[18px] text-[15px] font-semibold text-tinta-suave ${c.tipo === 'texto' ? 'text-left' : 'text-right'}`}>
                {c.nombre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ fontSize: letra }}>
          {filas.map((fila, i) => {
            const destacada = resaltar && String(fila[resaltar.columna]) === resaltar.valor;
            return (
              <tr key={i} style={{ height: altoFila }} className={destacada ? 'bg-tinte font-semibold' : 'hover:bg-fondo-app'}>
                {columnas.map((c, j) => (
                  <td
                    key={c.clave}
                    className={`px-[18px] ${i < filas.length - 1 ? 'border-b border-linea' : ''} ${c.tipo === 'texto' ? 'text-left' : 'text-right'}`}
                    style={destacada && j === 0 ? { boxShadow: 'inset 4px 0 0 var(--vp-primario)' } : undefined}
                  >
                    {formatear(fila[c.clave], c)}
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

function VistaTexto({ bloque, periodo }: Contexto & { bloque: BloqueTexto }) {
  const contenido = valorDe(bloque.contenido, periodo);
  if (!contenido?.trim()) return <SinDatos periodo={periodo} que="texto" />;

  // Párrafos separados por línea en blanco; las líneas con "- " forman viñetas.
  const partes: { tipo: 'parrafo' | 'lista'; lineas: string[] }[] = [];
  for (const linea of conMes(contenido, periodo).split('\n')) {
    const texto = linea.trim();
    if (!texto) continue;
    const esVineta = texto.startsWith('- ');
    const ultima = partes[partes.length - 1];
    if (esVineta && ultima?.tipo === 'lista') ultima.lineas.push(texto.slice(2));
    else partes.push({ tipo: esVineta ? 'lista' : 'parrafo', lineas: [esVineta ? texto.slice(2) : texto] });
  }

  return (
    <div className="h-full max-w-[1040px] overflow-auto text-[23px] leading-[1.5] text-tinta">
      {partes.map((parte, i) =>
        parte.tipo === 'lista' ? (
          <ul key={i} className="space-y-[16px]">
            {parte.lineas.map((linea, j) => (
              <li key={j} className="relative pl-[30px]">
                <span aria-hidden className="absolute left-0 top-[13px] h-[9px] w-[9px] rounded-full bg-primario" />
                {linea}
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="mb-[16px]">{parte.lineas[0]}</p>
        ),
      )}
    </div>
  );
}

function VistaCifras({ bloque, periodo }: Contexto & { bloque: BloqueCifras }) {
  const cifras = valorDe(bloque.cifras, periodo);
  if (!cifras?.length) return <SinDatos periodo={periodo} que="cifras" />;
  return (
    <dl className="grid divide-x divide-linea-fuerte" style={{ gridTemplateColumns: `repeat(${cifras.length}, minmax(0, 1fr))` }}>
      {cifras.map((cifra, i) => (
        <div key={i} className="px-[28px] first:pl-0">
          <dt className="text-[17px] text-tinta-suave">{cifra.etiqueta}</dt>
          <dd className="mt-[4px] text-[46px] font-bold leading-[1.1] tracking-[-0.02em] text-tinta">{cifra.valor}</dd>
          {cifra.detalle && <dd className="mt-[6px] text-[16px] text-tinta-suave">{cifra.detalle}</dd>}
        </div>
      ))}
    </dl>
  );
}
