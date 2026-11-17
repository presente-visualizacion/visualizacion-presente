'use client';

import { useMemo, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { columnaDe } from '@/lib/datos';
import { formatear } from '@/lib/formato';
import type { BloqueGrafico, Columna, ConjuntoDatos, Fila, Tema } from '@/lib/tipos';

const TINTA = '#241A20';
const SUAVE = '#675C63';
const LINEA = '#ECE7EA';
const BLANCO = '#FFFFFF';

interface Props {
  bloque: BloqueGrafico;
  conjunto: ConjuntoDatos;
  filas: Fila[];
  tema: Tema;
}

interface SerieLista {
  clave: string;
  nombre: string;
  color: string;
  columna?: Columna;
}

function reducirMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Recharts mide el texto ya escalado por el lienzo y se queda corto, así que
// el ancho de los ejes se calcula aquí, en px del lienzo.
let pincel: CanvasRenderingContext2D | null = null;
function anchoTexto(texto: string, tamano: number, peso = 400): number {
  const estimado = texto.length * tamano * 0.58;
  if (typeof document === 'undefined') return estimado;
  pincel ??= document.createElement('canvas').getContext('2d');
  if (!pincel) return estimado;
  pincel.font = `${peso} ${tamano}px "Figtree Variable", sans-serif`;
  return pincel.measureText(texto).width * 1.06;
}

/** Marcas del eje: sin decimales de relleno ("9,5%" y no "9,50%"). */
function marcaEje(valor: number, columna?: Columna): string {
  const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(valor);
  if (columna?.tipo === 'porcentaje') return `${numero}%`;
  if (columna?.tipo === 'moneda') return `$${numero}`;
  return numero;
}

export default function Grafico({ bloque, conjunto, filas, tema }: Props) {
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());

  // El color sigue a la serie, no a su posición visible: ocultar una serie no
  // cambia el color de las demás.
  const series: SerieLista[] = useMemo(
    () => bloque.series.map((s, i) => {
      const columna = columnaDe(conjunto, s.clave);
      return { clave: s.clave, nombre: columna?.nombre ?? s.clave, color: s.color ?? tema.series[i % tema.series.length], columna };
    }),
    [bloque.series, conjunto, tema.series],
  );
  const visibles = series.filter((s) => !ocultas.has(s.clave));
  const columnaValor = series[0]?.columna;
  const columnaX = columnaDe(conjunto, bloque.ejeX);
  const animar = !reducirMovimiento();
  const horizontal = bloque.forma === 'barrasHorizontales';
  const deTiempo = bloque.forma === 'lineas' || bloque.forma === 'area';
  const ultima = filas[filas.length - 1];

  const alternar = (clave: string) =>
    setOcultas((previas) => {
      const nuevas = new Set(previas);
      if (nuevas.has(clave)) nuevas.delete(clave);
      else nuevas.add(clave);
      return nuevas;
    });

  // Columnas del conjunto que no están graficadas: se muestran como detalle en
  // el globo cuando el gráfico tiene una sola serie.
  const columnasDetalle = series.length === 1
    ? conjunto.columnas.filter((c) => c.clave !== bloque.ejeX && c.clave !== series[0].clave)
    : [];

  // Ancho del eje de valores: lo que ocupa la marca más larga.
  const extremos = useMemo(() => {
    let maximo = 0;
    let minimo = 0;
    for (const fila of filas) {
      const valores = visibles.map((v) => fila[v.clave]).filter((v): v is number => typeof v === 'number');
      if (!valores.length) continue;
      maximo = Math.max(maximo, bloque.apilado ? valores.reduce((a, b) => a + b, 0) : Math.max(...valores));
      minimo = Math.min(minimo, ...valores);
    }
    return { maximo, minimo };
  }, [filas, visibles, bloque.apilado]);
  const anchoValores = Math.ceil(
    Math.max(
      anchoTexto(marcaEje(Math.ceil(extremos.maximo * 1.2), columnaValor), 15),
      anchoTexto(marcaEje(Math.floor(extremos.minimo), columnaValor), 15),
      anchoTexto(columnaValor?.tipo === 'porcentaje' ? '00,5%' : '0', 15),
    ) + 14,
  );
  const anchoCategorias = Math.ceil(Math.min(380, Math.max(...filas.map((f) => anchoTexto(String(f[bloque.ejeX] ?? ''), 16))) + 16));
  const anchoEtiqueta = bloque.etiquetas && series[0]
    ? Math.ceil(Math.max(...filas.map((f) => anchoTexto(formatear(f[series[0].clave], series[0].columna), 16, 600))) + 22)
    : 24;

  const ejeValores = { tick: { fontSize: 15, fill: SUAVE }, axisLine: false, tickLine: false } as const;
  const ejeCategorias = { tick: { fontSize: 15, fill: SUAVE }, axisLine: { stroke: LINEA }, tickLine: false } as const;

  const globo = (
    <Tooltip
      cursor={deTiempo ? { stroke: '#CFC6CB', strokeWidth: 1 } : { fill: '#F5EFF2' }}
      isAnimationActive={false}
      content={(p: any) => (
        <Globo activo={p.active} entradas={p.payload} etiqueta={p.label} series={series} total={Boolean(bloque.apilado)} detalle={columnasDetalle} columnaX={columnaX} />
      )}
    />
  );

  let grafico: React.ReactElement;

  if (horizontal) {
    grafico = (
      <BarChart data={filas} layout="vertical" margin={{ top: 4, right: anchoEtiqueta, bottom: 0, left: 0 }} barCategoryGap="28%">
        <CartesianGrid horizontal={false} stroke={LINEA} />
        <XAxis type="number" domain={[0, 'auto']} tickFormatter={(v: number) => marcaEje(v, columnaValor)} {...ejeValores} />
        <YAxis type="category" dataKey={bloque.ejeX} width={anchoCategorias} interval={0} {...ejeCategorias} tick={{ fontSize: 16, fill: TINTA }} />
        {globo}
        {visibles.map((s) => (
          <Bar key={s.clave} dataKey={s.clave} name={s.nombre} fill={s.color} radius={[0, 4, 4, 0]} maxBarSize={26} isAnimationActive={animar} animationDuration={450}>
            {bloque.resaltar && filas.map((f, i) => (
              <Cell key={i} fill={String(f[bloque.resaltar!.columna]) === bloque.resaltar!.valor ? tema.primario : tema.neutro} />
            ))}
            {bloque.etiquetas && (
              <LabelList dataKey={s.clave} position="right" offset={10} fontSize={16} fontWeight={600} fill={TINTA} formatter={(v: any) => formatear(v, s.columna)} />
            )}
          </Bar>
        ))}
      </BarChart>
    );
  } else if (bloque.forma === 'barras') {
    const cima = visibles[visibles.length - 1]?.clave;
    grafico = (
      <BarChart data={filas} margin={{ top: 8, right: 16, bottom: 0, left: 0 }} barCategoryGap="24%">
        <CartesianGrid vertical={false} stroke={LINEA} />
        <XAxis dataKey={bloque.ejeX} minTickGap={24} {...ejeCategorias} />
        <YAxis width={anchoValores} domain={[0, 'auto']} tickFormatter={(v: number) => marcaEje(v, columnaValor)} {...ejeValores} />
        {globo}
        {visibles.map((s) => (
          <Bar
            key={s.clave} dataKey={s.clave} name={s.nombre} fill={s.color}
            stackId={bloque.apilado ? 'pila' : undefined}
            // El borde del color del fondo separa los tramos de la pila.
            stroke={BLANCO} strokeWidth={bloque.apilado ? 2 : 0}
            radius={!bloque.apilado || s.clave === cima ? [4, 4, 0, 0] : 0}
            maxBarSize={28} isAnimationActive={animar} animationDuration={450}
          />
        ))}
      </BarChart>
    );
  } else if (bloque.forma === 'area') {
    grafico = (
      <AreaChart data={filas} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={LINEA} />
        <XAxis dataKey={bloque.ejeX} minTickGap={24} {...ejeCategorias} />
        <YAxis width={anchoValores} domain={[0, 'auto']} tickFormatter={(v: number) => marcaEje(v, columnaValor)} {...ejeValores} />
        {globo}
        {visibles.map((s) => (
          <Area
            key={s.clave} dataKey={s.clave} name={s.nombre} type="monotone" stroke={s.color} strokeWidth={2.5} fill={s.color} fillOpacity={0.1}
            dot={false} activeDot={{ r: 5, stroke: BLANCO, strokeWidth: 2 }} isAnimationActive={animar} animationDuration={450}
          />
        ))}
      </AreaChart>
    );
  } else {
    grafico = (
      <LineChart data={filas} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={LINEA} />
        <XAxis dataKey={bloque.ejeX} minTickGap={24} {...ejeCategorias} />
        <YAxis width={anchoValores} domain={['auto', 'auto']} tickFormatter={(v: number) => marcaEje(v, columnaValor)} {...ejeValores} />
        {globo}
        {visibles.map((s) => (
          <Line
            key={s.clave} dataKey={s.clave} name={s.nombre} type="monotone" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
            dot={false} activeDot={{ r: 5, stroke: BLANCO, strokeWidth: 2 }} isAnimationActive={animar} animationDuration={450}
          />
        ))}
      </LineChart>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {series.length > 1 && (
        <ul className="mb-[14px] flex flex-wrap gap-x-[8px] gap-y-[6px]">
          {series.map((s) => {
            const oculta = ocultas.has(s.clave);
            return (
              <li key={s.clave}>
                <button
                  type="button"
                  onClick={() => alternar(s.clave)}
                  aria-pressed={!oculta}
                  title={oculta ? `Mostrar ${s.nombre}` : `Ocultar ${s.nombre}`}
                  className={`flex items-center gap-[9px] rounded-full px-[12px] py-[5px] text-[16px] transition-colors hover:bg-fondo-app ${oculta ? 'text-tinta-suave line-through decoration-1' : 'text-tinta'}`}
                >
                  <span
                    aria-hidden
                    className={deTiempo ? 'h-[4px] w-[18px] rounded-full' : 'h-[12px] w-[12px] rounded-[3px]'}
                    style={oculta ? { boxShadow: `inset 0 0 0 1.5px ${s.color}` } : { background: s.color }}
                  />
                  <span>{s.nombre}</span>
                  {deTiempo && !oculta && ultima && (
                    <span className="font-semibold">{formatear(ultima[s.clave], s.columna)}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {bloque.resaltar && series.length === 1 && (
        <ul className="mb-[14px] flex gap-x-[24px] text-[16px] text-tinta">
          <li className="flex items-center gap-[9px]"><span aria-hidden className="h-[12px] w-[12px] rounded-[3px]" style={{ background: tema.primario }} />{bloque.resaltar.valor}</li>
          <li className="flex items-center gap-[9px]"><span aria-hidden className="h-[12px] w-[12px] rounded-[3px]" style={{ background: tema.neutro }} />Los demás</li>
        </ul>
      )}
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {grafico}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface PropsGlobo {
  activo?: boolean;
  entradas?: { dataKey?: string | number; value?: number | string | null; payload?: Fila }[];
  etiqueta?: string | number;
  series: SerieLista[];
  total: boolean;
  detalle: Columna[];
  columnaX?: Columna;
}

/** Recuadro con las cifras que aparece al pasar por encima del gráfico. */
function Globo({ activo, entradas, etiqueta, series, total, detalle }: PropsGlobo) {
  if (!activo || !entradas?.length) return null;
  const fila = entradas[0]?.payload;
  const filasGlobo = entradas
    .map((e) => ({ serie: series.find((s) => s.clave === e.dataKey), valor: e.value }))
    .filter((e): e is { serie: SerieLista; valor: number | string | null | undefined } => Boolean(e.serie));
  const suma = filasGlobo.reduce((acumulado, e) => acumulado + (typeof e.valor === 'number' ? e.valor : 0), 0);

  return (
    <div className="min-w-[220px] rounded-[10px] border border-linea-fuerte bg-white px-[16px] py-[12px] text-[15px] shadow-[0_8px_24px_-8px_rgba(36,26,32,0.25)]">
      <p className="mb-[8px] text-[16px] font-semibold text-tinta">{etiqueta}</p>
      <table className="w-full">
        <tbody>
          {filasGlobo.map(({ serie, valor }) => (
            <tr key={serie.clave}>
              <td className="py-[2px] pr-[20px] text-tinta-suave">
                <span aria-hidden className="mr-[8px] inline-block h-[10px] w-[10px] rounded-[2px] align-baseline" style={{ background: serie.color }} />
                {serie.nombre}
              </td>
              <td className="py-[2px] text-right font-semibold text-tinta">{formatear(valor, serie.columna)}</td>
            </tr>
          ))}
          {total && filasGlobo.length > 1 && (
            <tr className="border-t border-linea">
              <td className="pt-[6px] pr-[20px] text-tinta-suave">Total</td>
              <td className="pt-[6px] text-right font-semibold text-tinta">{formatear(suma, filasGlobo[0].serie.columna)}</td>
            </tr>
          )}
          {fila && detalle.map((c) => (
            <tr key={c.clave}>
              <td className="py-[2px] pr-[20px] text-tinta-suave">{c.nombre}</td>
              <td className="py-[2px] text-right text-tinta">{formatear(fila[c.clave], c)}{c.unidad && fila[c.clave] != null ? ` ${c.unidad}` : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
