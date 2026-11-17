'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Line, LineChart,
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { columnaDe } from '@/lib/datos';
import { formatear } from '@/lib/formato';
import type { Columna, Fila } from '@/lib/tipos';
import {
  anchoTexto, BLANCO, dominioEje, ejeCategorias, ejeValores, LINEA, marcaEje, partirTexto, PUNTEADA, reducirMovimiento, SUAVE, TINTA,
  type PropsGrafico, type SerieLista,
} from './graficoComun';
import { Cascada, Circular, Dispersion } from './GraficosEspeciales';

type Props = PropsGrafico;

export default function Grafico(props: Props) {
  switch (props.bloque.forma) {
    case 'circular': return <Circular {...props} />;
    case 'dispersion': return <Dispersion {...props} />;
    case 'cascada': return <Cascada {...props} />;
    default: return <GraficoSeries {...props} />;
  }
}

/** Gráficos de una o más series sobre un eje de categorías. */
function GraficoSeries({ bloque, conjunto, filas, tema }: Props) {
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  // Ancho del gráfico, para saber cuánto espacio tiene cada categoría del eje.
  const caja = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(0);
  useLayoutEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => setAncho(el.clientWidth);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // El color sigue a la serie, no a su posición visible: ocultar una serie no
  // cambia el color de las demás.
  const series: SerieLista[] = useMemo(
    () => bloque.series.map((s, i) => {
      const columna = columnaDe(conjunto, s.clave);
      return { clave: s.clave, nombre: columna?.nombre ?? s.clave, color: s.color ?? tema.series[i % tema.series.length], columna, tipo: s.tipo, punteada: s.punteada };
    }),
    [bloque.series, conjunto, tema.series],
  );
  const visibles = series.filter((s) => !ocultas.has(s.clave));
  const columnaValor = series[0]?.columna;
  const columnaX = columnaDe(conjunto, bloque.ejeX);
  const animar = !reducirMovimiento();
  const horizontal = bloque.forma === 'barrasHorizontales';
  const deTiempo = bloque.forma === 'lineas' || bloque.forma === 'area';
  const comoLinea = (s: SerieLista) => deTiempo || bloque.forma === 'radar' || (bloque.forma === 'combinado' && s.tipo === 'lineas');
  const apilado = Boolean(bloque.apilado) && (bloque.forma === 'barras' || bloque.forma === 'area');
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
      maximo = Math.max(maximo, apilado ? valores.reduce((a, b) => a + b, 0) : Math.max(...valores));
      minimo = Math.min(minimo, ...valores);
    }
    return { maximo, minimo };
  }, [filas, visibles, apilado]);
  const anchoValores = Math.ceil(
    Math.max(
      anchoTexto(marcaEje(Math.ceil(extremos.maximo * 1.2), columnaValor), 15),
      anchoTexto(marcaEje(bloque.rangoEje?.hasta ?? 0, columnaValor), 15),
      anchoTexto(marcaEje(bloque.rangoEje?.desde ?? 0, columnaValor), 15),
      anchoTexto(marcaEje(Math.floor(extremos.minimo), columnaValor), 15),
      anchoTexto(columnaValor?.tipo === 'porcentaje' ? '00,5%' : '0', 15),
    ) + 14,
  );
  const anchoCategorias = Math.ceil(Math.min(380, Math.max(...filas.map((f) => anchoTexto(String(f[bloque.ejeX] ?? ''), 16))) + 16));
  const anchoEtiqueta = bloque.etiquetas && series[0]
    ? Math.ceil(Math.max(...filas.map((f) => anchoTexto(formatear(f[series[0].clave], series[0].columna), 16, 600))) + 22)
    : 24;


  // Barras con detalle bajo cada categoría o con una categoría resaltada: el
  // eje se dibuja a mano (dos renglones, el detalle y la resaltada en negrita).
  const columnaDetalleEje = bloque.detalleEje ? columnaDe(conjunto, bloque.detalleEje) : undefined;
  const ejeAMano = (bloque.forma === 'barras' || bloque.forma === 'combinado') && (Boolean(columnaDetalleEje) || Boolean(bloque.resaltar));
  const esResaltada = (f: Fila | undefined) => Boolean(bloque.resaltar && f && String(f[bloque.resaltar.columna]) === bloque.resaltar.valor);
  const ejeCategoriasBarras = ejeAMano
    ? {
        ...ejeCategorias,
        interval: 0,
        height: columnaDetalleEje ? 74 : 58,
        tick: (t: any) => {
          const fila: Fila | undefined = filas[t.index] ?? filas.find((f) => String(f[bloque.ejeX]) === String(t.payload?.value));
          const porCategoria = ((ancho || 800) - anchoValores - 16) / Math.max(1, filas.length);
          const letra = porCategoria < 66 ? 11.5 : porCategoria < 90 ? 12.5 : 14;
          const destacada = esResaltada(fila);
          const renglones = partirTexto(String(t.payload?.value ?? ''), letra, Math.max(44, porCategoria - 6), porCategoria < 90 ? 3 : 2);
          return (
            <g transform={`translate(${t.x},${t.y})`}>
              <text textAnchor="middle" fontSize={letra} fill={destacada ? tema.primario : TINTA} fontWeight={destacada ? 700 : 400}>
                {renglones.map((r, i) => <tspan key={i} x={0} dy={i === 0 ? letra + 1 : letra + 2}>{r}</tspan>)}
                {renglones.length === 1 && <tspan x={0} dy={letra + 2}>{' '}</tspan>}
                {columnaDetalleEje && fila && (
                  <tspan x={0} dy={letra + 5} fontSize={letra - 1} fontWeight={destacada ? 700 : 400} fill={destacada ? tema.primario : SUAVE}>
                    {`${columnaDetalleEje.nombre} ${formatear(fila[columnaDetalleEje.clave], columnaDetalleEje)}`}
                  </tspan>
                )}
              </text>
            </g>
          );
        },
      }
    : { ...ejeCategorias, minTickGap: 24 };

  const globo = (
    <Tooltip
      cursor={deTiempo ? { stroke: '#CFC6CB', strokeWidth: 1 } : { fill: '#F5EFF2' }}
      isAnimationActive={false}
      content={(p: any) => (
        <Globo activo={p.active} entradas={p.payload} etiqueta={p.label} series={series} total={apilado} detalle={columnasDetalle} columnaX={columnaX} />
      )}
    />
  );

  let grafico: React.ReactElement;

  if (horizontal) {
    grafico = (
      <BarChart data={filas} layout="vertical" margin={{ top: 4, right: anchoEtiqueta, bottom: 0, left: 0 }} barCategoryGap="28%">
        <CartesianGrid horizontal={false} stroke={LINEA} />
        <XAxis type="number" {...dominioEje(bloque.rangoEje, [0, 'auto'])} tickFormatter={(v: number) => marcaEje(v, columnaValor)} {...ejeValores} />
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
        <XAxis dataKey={bloque.ejeX} {...ejeCategoriasBarras} />
        <YAxis width={anchoValores} {...dominioEje(bloque.rangoEje, [0, 'auto'])} tickFormatter={(v: number) => marcaEje(v, columnaValor)} {...ejeValores} />
        {/* Con varias series, la categoría resaltada lleva una franja de fondo. */}
        {bloque.resaltar && series.length > 1 && filas.filter(esResaltada).map((f, i) => (
          <ReferenceArea key={i} x1={String(f[bloque.ejeX])} x2={String(f[bloque.ejeX])} fill="#FCEEF4" fillOpacity={1} strokeOpacity={0} />
        ))}
        {globo}
        {visibles.map((s) => (
          <Bar
            key={s.clave} dataKey={s.clave} name={s.nombre} fill={s.color}
            stackId={apilado ? 'pila' : undefined}
            // El borde del color del fondo separa los tramos de la pila.
            stroke={BLANCO} strokeWidth={apilado ? 2 : 0}
            radius={!apilado || s.clave === cima ? [4, 4, 0, 0] : 0}
            maxBarSize={28} isAnimationActive={animar} animationDuration={450}
          >
            {bloque.resaltar && series.length === 1 && filas.map((f, i) => (
              <Cell key={i} fill={esResaltada(f) ? tema.primario : tema.neutro} />
            ))}
            {bloque.etiquetas && !apilado && (
              <LabelList dataKey={s.clave} position="top" offset={8} fontSize={15} fontWeight={600} fill={TINTA} formatter={(v: any) => formatear(v, s.columna)} />
            )}
          </Bar>
        ))}
      </BarChart>
    );
  } else if (bloque.forma === 'combinado') {
    const minimo = Math.min(0, extremos.minimo);
    grafico = (
      <ComposedChart data={filas} margin={{ top: 8, right: 16, bottom: 0, left: 0 }} barCategoryGap="24%">
        <CartesianGrid vertical={false} stroke={LINEA} />
        <XAxis dataKey={bloque.ejeX} {...ejeCategoriasBarras} />
        <YAxis width={anchoValores} {...dominioEje(bloque.rangoEje, [minimo < 0 ? 'auto' : 0, 'auto'])} tickFormatter={(v: number) => marcaEje(v, columnaValor)} {...ejeValores} />
        {globo}
        {visibles.map((s) => (s.tipo === 'lineas' ? (
          <Line
            key={s.clave} dataKey={s.clave} name={s.nombre} type="monotone" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={s.punteada ? PUNTEADA : undefined}
            dot={false} activeDot={{ r: 5, stroke: BLANCO, strokeWidth: 2 }} isAnimationActive={animar} animationDuration={450}
          />
        ) : (
          <Bar key={s.clave} dataKey={s.clave} name={s.nombre} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={animar} animationDuration={450}>
            {bloque.etiquetas && (
              <LabelList dataKey={s.clave} position="top" offset={8} fontSize={15} fontWeight={600} fill={TINTA} formatter={(v: any) => formatear(v, s.columna)} />
            )}
          </Bar>
        )))}
      </ComposedChart>
    );
  } else if (bloque.forma === 'radar') {
    grafico = (
      <RadarChart data={filas} outerRadius="78%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke={LINEA} />
        <PolarAngleAxis dataKey={bloque.ejeX} tick={{ fontSize: 15, fill: TINTA }} />
        <PolarRadiusAxis angle={90} {...dominioEje(bloque.rangoEje, [0, 'auto'])} axisLine={false} tick={{ fontSize: 13, fill: SUAVE }} tickFormatter={(v: number) => marcaEje(v, columnaValor)} />
        {globo}
        {visibles.map((s) => (
          <Radar
            key={s.clave} dataKey={s.clave} name={s.nombre} stroke={s.color} strokeWidth={2.5} fill={s.color} fillOpacity={0.12}
            dot={{ r: 3, fill: s.color, strokeWidth: 0 }} isAnimationActive={animar} animationDuration={450}
          />
        ))}
      </RadarChart>
    );
  } else if (bloque.forma === 'area') {
    grafico = (
      <AreaChart data={filas} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={LINEA} />
        <XAxis dataKey={bloque.ejeX} minTickGap={24} {...ejeCategorias} />
        <YAxis width={anchoValores} {...dominioEje(bloque.rangoEje, [0, 'auto'])} tickFormatter={(v: number) => marcaEje(v, columnaValor)} {...ejeValores} />
        {globo}
        {visibles.map((s) => (
          <Area
            key={s.clave} dataKey={s.clave} name={s.nombre} type="monotone" stroke={s.color} strokeWidth={2.5} fill={s.color} fillOpacity={0.1}
            strokeDasharray={s.punteada ? PUNTEADA : undefined}
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
        <YAxis width={anchoValores} {...dominioEje(bloque.rangoEje, ['auto', 'auto'])} tickFormatter={(v: number) => marcaEje(v, columnaValor)} {...ejeValores} />
        {globo}
        {visibles.map((s) => (
          <Line
            key={s.clave} dataKey={s.clave} name={s.nombre} type="monotone" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={s.punteada ? PUNTEADA : undefined}
            dot={false} activeDot={{ r: 5, stroke: BLANCO, strokeWidth: 2 }} isAnimationActive={animar} animationDuration={450}
          />
        ))}
      </LineChart>
    );
  }

  return (
    <div ref={caja} className="flex h-full min-h-0 flex-col">
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
                    className={comoLinea(s) ? 'h-[4px] w-[18px] rounded-full' : 'h-[12px] w-[12px] rounded-[3px]'}
                    style={oculta
                      ? { boxShadow: `inset 0 0 0 1.5px ${s.color}` }
                      : comoLinea(s) && s.punteada
                        ? { background: `repeating-linear-gradient(to right, ${s.color} 0 6px, transparent 6px 9px)` }
                        : { background: s.color }}
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
