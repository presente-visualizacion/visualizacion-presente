'use client';

// Gráficos de una sola serie con dibujo propio: circular (dona), dispersión y
// cascada. Los de varias series están en Grafico.tsx. Qué usa cada uno está
// en "Tipos de gráfico" de PLAN.md.

import { useContext } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts';
import { columnaDe } from '@/lib/datos';
import { formatear } from '@/lib/formato';
import {
  anchoTexto, BLANCO, L, CajaGlobo, DetalleFijo, dominioEje, ejeCategorias, lineasReferencia, ejeValores, FilaGlobo, LINEA, marcaEje, Muestra, usarAnimar, usarFuenteMedida, SUAVE, TINTA,
  type PropsGrafico,
} from './graficoComun';

const porcentaje = (parte: number, total: number) =>
  `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(total ? (parte / total) * 100 : 0)}%`;

// ---------------------------------------------------------------------------
// Circular

/** Más porciones que esto no se leen: las menores se juntan en "Otros". */
const MAX_PORCIONES = 6;

export function Circular({ bloque, conjunto, filas, tema }: PropsGrafico) {
  const serie = bloque.series[0];
  const columna = columnaDe(conjunto, serie.clave);
  const animar = usarAnimar();
  usarFuenteMedida();
  // En el PDF no hay mouse: sin globos.
  const enPdf = useContext(DetalleFijo);

  let porciones = filas
    .map((f) => ({ nombre: formatear(f[bloque.ejeX], columnaDe(conjunto, bloque.ejeX)) || '—', valor: f[serie.clave] }))
    .filter((p): p is { nombre: string; valor: number } => typeof p.valor === 'number' && p.valor > 0);
  if (porciones.length > MAX_PORCIONES) {
    const ordenadas = [...porciones].sort((a, b) => b.valor - a.valor);
    const resto = ordenadas.slice(MAX_PORCIONES - 1).reduce((suma, p) => suma + p.valor, 0);
    porciones = [...ordenadas.slice(0, MAX_PORCIONES - 1), { nombre: 'Otros', valor: resto }];
  }
  const total = porciones.reduce((suma, p) => suma + p.valor, 0);
  const datos = porciones.map((p, i) => ({ ...p, fill: i === 0 && serie.color ? serie.color : tema.series[i % tema.series.length] }));

  return (
    <div className="flex h-full min-h-0 items-center gap-[40px]">
      <div className="relative h-full min-h-0 min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos} dataKey="valor" nameKey="nombre" innerRadius="58%" outerRadius="92%" paddingAngle={1}
              stroke={BLANCO} strokeWidth={2} startAngle={90} endAngle={-270} isAnimationActive={animar} animationDuration={450}
            />
            {!enPdf && (
              <Tooltip
                isAnimationActive={false}
                content={(p: any) => {
                  const e = p.active && p.payload?.[0]?.payload;
                  if (!e) return null;
                  return (
                    <CajaGlobo titulo={e.nombre}>
                      <FilaGlobo nombre={columna?.nombre ?? serie.clave} valor={formatear(e.valor, columna)} color={e.fill} />
                      <FilaGlobo nombre="Participación" valor={porcentaje(e.valor, total)} fuerte={false} />
                    </CajaGlobo>
                  );
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[length:calc(16px*var(--vp-letra,1))] text-tinta-suave">Total</span>
          <span className="text-[length:calc(30px*var(--vp-letra,1))] font-bold leading-tight tracking-[-0.01em] text-tinta">{formatear(total, columna)}</span>
        </div>
      </div>
      <ul className="w-[340px] shrink-0 space-y-[12px] text-[length:calc(17px*var(--vp-letra,1))]">
        {datos.map((d, i) => (
          <li key={i} className="flex items-baseline gap-[10px]">
            <span aria-hidden className="h-[12px] w-[12px] shrink-0 translate-y-[1px] rounded-[3px]" style={{ background: d.fill }} />
            <span className="min-w-0 flex-1 text-tinta">{d.nombre}</span>
            <span className="font-semibold text-tinta">{porcentaje(d.valor, total)}</span>
            {bloque.etiquetas && <span className="w-[110px] text-right text-tinta-suave">{formatear(d.valor, columna)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dispersión

export function Dispersion({ bloque, conjunto, filas, tema }: PropsGrafico) {
  const serie = bloque.series[0];
  const columnaY = columnaDe(conjunto, serie.clave);
  const columnaX = columnaDe(conjunto, bloque.ejeX);
  const columnaNombre = bloque.nombres ? columnaDe(conjunto, bloque.nombres) : undefined;
  const animar = usarAnimar();
  usarFuenteMedida();
  // En el PDF no hay mouse: sin globos.
  const enPdf = useContext(DetalleFijo);
  const color = serie.color ?? tema.series[0];
  const destacado = (f: Record<string, unknown>) => Boolean(bloque.resaltar && String(f[bloque.resaltar.columna]) === bloque.resaltar.valor);

  const puntos = filas.filter((f) => typeof f[bloque.ejeX] === 'number' && typeof f[serie.clave] === 'number');
  const maximoY = Math.max(0, ...puntos.map((f) => f[serie.clave] as number));
  const minimoY = Math.min(0, ...puntos.map((f) => f[serie.clave] as number));
  const anchoY = Math.ceil(Math.max(anchoTexto(marcaEje(Math.ceil(maximoY * 1.2), columnaY), L(15)), anchoTexto(marcaEje(Math.floor(minimoY), columnaY), L(15))) + 14);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ul className="mb-[14px] flex flex-wrap gap-x-[24px] text-[length:calc(16px*var(--vp-letra,1))] text-tinta-suave">
        <li>Vertical: <strong className="font-semibold text-tinta">{columnaY?.nombre}</strong></li>
        <li>Horizontal: <strong className="font-semibold text-tinta">{columnaX?.nombre}</strong></li>
        {bloque.resaltar && (
          <>
            <Muestra color={tema.primario} nombre={bloque.resaltar.valor} />
            <Muestra color={tema.neutro} nombre="Los demás" />
          </>
        )}
      </ul>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 34, right: 48, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={LINEA} />
            <XAxis type="number" dataKey={bloque.ejeX} name={columnaX?.nombre} domain={['auto', 'auto']} tickFormatter={(v: number) => marcaEje(v, columnaX)} {...ejeCategorias()} />
            <YAxis type="number" dataKey={serie.clave} name={columnaY?.nombre} width={anchoY} {...dominioEje(bloque.rangoEje, ['auto', 'auto'])} tickFormatter={(v: number) => marcaEje(v, columnaY)} {...ejeValores()} />
            {!enPdf && (
              <Tooltip
                isAnimationActive={false}
                cursor={{ stroke: '#CFC6CB', strokeDasharray: '4 4' }}
                content={(p: any) => {
                  const f = p.active && p.payload?.[0]?.payload;
                  if (!f) return null;
                  return (
                    <CajaGlobo titulo={columnaNombre ? String(f[columnaNombre.clave] ?? '') : undefined}>
                      <FilaGlobo nombre={columnaY?.nombre} valor={formatear(f[serie.clave], columnaY)} />
                      <FilaGlobo nombre={columnaX?.nombre} valor={formatear(f[bloque.ejeX], columnaX)} />
                    </CajaGlobo>
                  );
                }}
              />
            )}
            <Scatter data={puntos} fill={color} isAnimationActive={animar} animationDuration={450}
              shape={(props: any) => {
                const resaltado = destacado(props.payload);
                const relleno = bloque.resaltar ? (resaltado ? tema.primario : tema.neutro) : color;
                return <circle cx={props.cx} cy={props.cy} r={resaltado ? 9 : 7} fill={relleno} stroke={BLANCO} strokeWidth={1.5} />;
              }}
            >
              {bloque.etiquetas && columnaNombre && (
                <LabelList dataKey={columnaNombre.clave} position="top" offset={12} fontSize={L(14)} fill={TINTA} />
              )}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cascada

interface Escalon {
  nombre: string;
  /** Donde empieza la barra (invisible: es la base de la pila). */
  base: number;
  alto: number;
  variacion: number;
  acumulado: number;
  clase: 'sube' | 'baja' | 'total';
  /** Texto sobre la barra: "+30", "-20" o el total. */
  etiqueta: string;
}

export function Cascada({ bloque, conjunto, filas, tema }: PropsGrafico) {
  const serie = bloque.series[0];
  const columna = columnaDe(conjunto, serie.clave);
  const animar = usarAnimar();
  usarFuenteMedida();
  // En el PDF no hay mouse: sin globos.
  const enPdf = useContext(DetalleFijo);
  const colores = { sube: tema.series[3 % tema.series.length], baja: tema.primario, total: SUAVE };

  const conSigno = (v: number) => (v < 0 ? '' : '+') + formatear(v, columna);
  const escalones: Escalon[] = [];
  let acumulado = 0;
  for (const f of filas) {
    const v = f[serie.clave];
    if (typeof v !== 'number') continue;
    const inicio = acumulado;
    acumulado += v;
    escalones.push({ nombre: String(f[bloque.ejeX] ?? ''), base: Math.min(inicio, acumulado), alto: Math.abs(v), variacion: v, acumulado, clase: v >= 0 ? 'sube' : 'baja', etiqueta: conSigno(v) });
  }
  if (bloque.total) escalones.push({ nombre: 'Total', base: Math.min(0, acumulado), alto: Math.abs(acumulado), variacion: acumulado, acumulado, clase: 'total', etiqueta: formatear(acumulado, columna) });

  const maximo = Math.max(0, ...escalones.map((e) => e.base + e.alto));
  const minimo = Math.min(0, ...escalones.map((e) => e.base));
  const anchoY = Math.ceil(Math.max(anchoTexto(marcaEje(Math.ceil(maximo * 1.2), columna), L(15)), anchoTexto(marcaEje(Math.floor(minimo), columna), L(15))) + 14);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ul className="mb-[14px] flex gap-x-[24px] text-[length:calc(16px*var(--vp-letra,1))] text-tinta">
        <Muestra color={colores.sube} nombre="Sube" />
        <Muestra color={colores.baja} nombre="Baja" />
        {bloque.total && <Muestra color={colores.total} nombre="Total" />}
      </ul>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={escalones} margin={{ top: 24, right: 16, bottom: 0, left: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={LINEA} />
            <XAxis dataKey="nombre" interval={0} {...ejeCategorias()} />
            <YAxis width={anchoY} {...dominioEje(bloque.rangoEje, [minimo < 0 ? 'auto' : 0, 'auto'])} tickFormatter={(v: number) => marcaEje(v, columna)} {...ejeValores()} />
            {!enPdf && (
              <Tooltip
                isAnimationActive={false}
                cursor={{ fill: '#F5EFF2' }}
                content={(p: any) => {
                  const e: Escalon | undefined = p.active ? p.payload?.[0]?.payload : undefined;
                  if (!e) return null;
                  return (
                    <CajaGlobo titulo={e.nombre}>
                      {e.clase === 'total' ? (
                        <FilaGlobo nombre="Total" valor={formatear(e.acumulado, columna)} color={colores.total} />
                      ) : (
                        <>
                          <FilaGlobo nombre="Variación" valor={e.etiqueta} color={colores[e.clase]} />
                          <FilaGlobo nombre="Acumulado" valor={formatear(e.acumulado, columna)} fuerte={false} />
                        </>
                      )}
                    </CajaGlobo>
                  );
                }}
              />
            )}
            <Bar dataKey="base" stackId="cascada" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="alto" stackId="cascada" radius={[3, 3, 3, 3]} maxBarSize={56} isAnimationActive={animar} animationDuration={450}>
              {escalones.map((e, i) => <Cell key={i} fill={colores[e.clase]} />)}
              {bloque.etiquetas && (
                <LabelList dataKey="etiqueta" position="top" offset={8} fontSize={L(15)} fontWeight={600} fill={TINTA} />
              )}
            </Bar>
            {lineasReferencia(bloque, columna, 'y')}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
