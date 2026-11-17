'use client';

// Configuración de un gráfico: tipo, eje, series, colores y opciones. Cada
// cambio es una operación `grafico.config` con la configuración completa.
// Qué usa cada tipo está en "Tipos de gráfico" de PLAN.md.

import { useEffect, useId, useState } from 'react';
import {
  ArrowDown, ArrowUp, ChartArea, ChartBar, ChartColumn, ChartColumnDecreasing, ChartLine, ChartNoAxesCombined, ChartPie,
  ChartRadar, ChartScatter, X, type LucideIcon,
} from 'lucide-react';
import { columnaDe, filasDe } from '@/lib/datos';
import { interpretarNumero, numeroEditable } from '@/lib/formato';
import type { ConfigGrafico, Operacion } from '@/lib/edicion/operaciones';
import { CON_DETALLE_FIJO, CON_RANGO_EJE, CON_REFERENCIAS, configPara, esNumerica, motivoNoDisponible } from '@/lib/edicion/plantillas';
import { FORMAS, SERIES_POR_FORMA } from '@/lib/edicion/validar';
import type { BloqueGrafico, Columna, ConjuntoDatos, FormaGrafico, IdPeriodo, Presentacion, RangoEje, Referencia, Resaltado, Serie } from '@/lib/tipos';
import { BotonIcono, Casilla, CLASE_CAMPO, Opcion, Subtitulo } from './piezas';

export const FORMAS_INFO: Record<FormaGrafico, { nombre: string; icono: LucideIcon; ayuda: string }> = {
  lineas: { nombre: 'Líneas', icono: ChartLine, ayuda: 'Para ver cómo cambian una o más series en el tiempo.' },
  barras: { nombre: 'Barras', icono: ChartColumn, ayuda: 'Para comparar valores entre categorías o meses.' },
  barrasHorizontales: { nombre: 'Horizontales', icono: ChartBar, ayuda: 'Para rankings y nombres largos.' },
  area: { nombre: 'Área', icono: ChartArea, ayuda: 'Como líneas, destacando el volumen.' },
  combinado: { nombre: 'Combinado', icono: ChartNoAxesCombined, ayuda: 'Barras y líneas juntas, sobre la misma escala.' },
  circular: { nombre: 'Circular', icono: ChartPie, ayuda: 'Para mostrar cómo se reparte un total.' },
  dispersion: { nombre: 'Dispersión', icono: ChartScatter, ayuda: 'Para comparar dos variables numéricas entre entidades.' },
  radar: { nombre: 'Radar', icono: ChartRadar, ayuda: 'Para comparar perfiles en pocas categorías (3 a 10).' },
  cascada: { nombre: 'Cascada', icono: ChartColumnDecreasing, ayuda: 'Para explicar cómo se llega de un valor a otro.' },
};

const NOMBRE_EJE: Record<FormaGrafico, string> = {
  lineas: 'Eje horizontal', barras: 'Eje horizontal', area: 'Eje horizontal', combinado: 'Eje horizontal',
  barrasHorizontales: 'Categorías', circular: 'Nombres de las porciones', dispersion: 'Eje horizontal (numérico)',
  radar: 'Ejes del radar', cascada: 'Conceptos',
};

const CON_APILADO: FormaGrafico[] = ['barras', 'area'];
const CON_ETIQUETAS: Partial<Record<FormaGrafico, string>> = {
  barras: 'Mostrar el valor sobre cada barra',
  barrasHorizontales: 'Mostrar el valor junto a cada barra',
  combinado: 'Mostrar el valor sobre las barras',
  cascada: 'Mostrar la variación sobre cada barra',
  circular: 'Mostrar también el valor en la lista',
  dispersion: 'Mostrar el nombre junto a cada punto',
};
const CON_RESALTAR: FormaGrafico[] = ['barras', 'barrasHorizontales', 'dispersion'];

/** Quita las claves vacías para que la configuración guardada quede limpia. */
function limpio(config: ConfigGrafico): ConfigGrafico {
  return Object.fromEntries(Object.entries(config).filter(([, v]) => v !== undefined && v !== false)) as unknown as ConfigGrafico;
}

interface Props {
  presentacion: Presentacion;
  bloque: BloqueGrafico;
  periodo: IdPeriodo;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
}

export function EditorGrafico({ presentacion, bloque, periodo, cambiar }: Props) {
  const conjunto = presentacion.datos[bloque.datos];
  if (!conjunto) return null;
  const { id: _id, tipo: _tipo, titulo: _titulo, nota: _nota, ...actual } = bloque;
  const { forma } = bloque;
  const poner = (cambios: Partial<ConfigGrafico>) => cambiar({ op: 'grafico.config', bloque: bloque.id, valor: limpio({ ...actual, ...cambios }) });
  const unaSerie = SERIES_POR_FORMA[forma][1] === 1;
  const maximoSeries = SERIES_POR_FORMA[forma][1];

  const columnasEje = conjunto.columnas.filter((c) => forma !== 'dispersion' || esNumerica(c));
  const candidatas = conjunto.columnas.filter((c) => esNumerica(c) && c.clave !== bloque.ejeX);
  const enSerie = new Map(bloque.series.map((s, i) => [s.clave, i]));
  // Primero las series en su orden; después las columnas que se pueden sumar.
  const ordenadas = [...candidatas].sort((a, b) => (enSerie.get(a.clave) ?? 99) - (enSerie.get(b.clave) ?? 99));

  const cambiarSeries = (series: Serie[]) => poner({ series });
  const marcar = (clave: string, si: boolean) => {
    if (unaSerie) return cambiarSeries([{ ...(bloque.series.find((s) => s.clave === clave) ?? { clave }), clave }]);
    if (si) {
      const nueva: Serie = forma === 'combinado' ? { clave, tipo: 'lineas' } : { clave };
      return cambiarSeries([...bloque.series, nueva].slice(0, maximoSeries));
    }
    if (bloque.series.length > 1) cambiarSeries(bloque.series.filter((s) => s.clave !== clave));
  };
  const moverSerie = (indice: number, destino: number) => {
    const series = bloque.series.slice();
    series.splice(destino, 0, ...series.splice(indice, 1));
    cambiarSeries(series);
  };
  const ponerEnSerie = (clave: string, cambios: Partial<Serie>) =>
    cambiarSeries(bloque.series.map((s) => {
      if (s.clave !== clave) return s;
      const nueva = { ...s, ...cambios };
      if (nueva.color === undefined) delete nueva.color;
      if (!nueva.punteada) delete nueva.punteada;
      return nueva;
    }));

  return (
    <div className="space-y-4">
      <div>
        <Subtitulo>Tipo de gráfico</Subtitulo>
        <div role="radiogroup" aria-label="Tipo de gráfico" className="mt-1.5 grid grid-cols-3 gap-1.5">
          {FORMAS.map((f) => {
            const info = FORMAS_INFO[f];
            const motivo = f === forma ? null : motivoNoDisponible(f, conjunto);
            const Icono = info.icono;
            return (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={f === forma}
                disabled={Boolean(motivo)}
                title={motivo ?? info.ayuda}
                onClick={() => f !== forma && cambiar({ op: 'grafico.config', bloque: bloque.id, valor: limpio(configPara(f, actual, conjunto)) })}
                className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[12.5px] transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                  f === forma ? 'border-primario bg-tinte font-semibold text-tinta' : 'border-linea-fuerte text-tinta-suave hover:bg-fondo-app hover:text-tinta'
                }`}
              >
                <Icono size={20} aria-hidden />
                {info.nombre}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-tinta-suave">{FORMAS_INFO[forma].ayuda}</p>
      </div>

      <Opcion
        etiqueta={NOMBRE_EJE[forma]}
        valor={bloque.ejeX}
        opciones={columnasEje.map((c) => ({ valor: c.clave, nombre: c.nombre || c.clave }))}
        onCambiar={(ejeX) => poner(configPara(forma, { ...actual, ejeX, series: bloque.series.filter((s) => s.clave !== ejeX) }, conjunto))}
      />

      <div>
        <Subtitulo>{unaSerie ? (forma === 'dispersion' ? 'Eje vertical' : 'Valores') : 'Series'}</Subtitulo>
        {!unaSerie && <p className="mb-1 text-[13px] text-tinta-suave">Marca las columnas que se dibujan{maximoSeries < 12 ? ` (hasta ${maximoSeries})` : ''}.</p>}
        <ul className="mt-1 divide-y divide-linea rounded-lg border border-linea">
          {ordenadas.map((c) => {
            const indice = enSerie.get(c.clave);
            const serie = indice === undefined ? undefined : bloque.series[indice];
            const colorAuto = presentacion.tema.series[(indice ?? 0) % presentacion.tema.series.length];
            return (
              <li key={c.clave} className="px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-[15px] text-tinta">
                    <input
                      type={unaSerie ? 'radio' : 'checkbox'}
                      name={`series-${bloque.id}`}
                      checked={Boolean(serie)}
                      disabled={!serie && !unaSerie && bloque.series.length >= maximoSeries}
                      onChange={(e) => marcar(c.clave, e.target.checked)}
                      className="h-4 w-4 shrink-0 accent-primario"
                    />
                    <span className="truncate">{c.nombre || c.clave}</span>
                  </label>
                  {serie && !unaSerie && (
                    <>
                      <BotonIcono etiqueta={`Subir ${c.nombre}`} onClick={() => moverSerie(indice!, indice! - 1)} inactivo={indice === 0}><ArrowUp size={15} /></BotonIcono>
                      <BotonIcono etiqueta={`Bajar ${c.nombre}`} onClick={() => moverSerie(indice!, indice! + 1)} inactivo={indice === bloque.series.length - 1}><ArrowDown size={15} /></BotonIcono>
                    </>
                  )}
                  {serie && (forma === 'lineas' || forma === 'area' || (forma === 'combinado' && serie.tipo === 'lineas')) && (
                    <button
                      type="button"
                      aria-pressed={Boolean(serie.punteada)}
                      aria-label={`Línea punteada para ${c.nombre}`}
                      title={serie.punteada ? 'Línea punteada (clic para continua)' : 'Línea continua (clic para punteada)'}
                      onClick={() => ponerEnSerie(c.clave, { punteada: serie.punteada ? undefined : true })}
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${serie.punteada ? 'bg-tinte text-primario' : 'text-tinta-suave hover:bg-fondo-app'}`}
                    >
                      <svg viewBox="0 0 20 4" className="h-1 w-5" aria-hidden>
                        <line x1="1" y1="2" x2="19" y2="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={serie.punteada ? '3 3' : undefined} />
                      </svg>
                    </button>
                  )}
                  {serie && !['circular', 'cascada'].includes(forma) && !(forma === 'dispersion' && bloque.resaltar) && (
                    <SelectorColor color={serie.color} automatico={colorAuto} paleta={presentacion.tema.series} nombre={c.nombre} onCambiar={(color) => ponerEnSerie(c.clave, { color })} />
                  )}
                </div>
                {serie && forma === 'combinado' && (
                  <div role="group" aria-label={`Cómo se dibuja ${c.nombre}`} className="mt-1 ml-6 flex gap-1">
                    {(['barras', 'lineas'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={(serie.tipo ?? 'barras') === t}
                        onClick={() => ponerEnSerie(c.clave, { tipo: t })}
                        className={`h-7 rounded-full px-3 text-[13px] ${(serie.tipo ?? 'barras') === t ? 'bg-tinta text-white' : 'border border-linea-fuerte text-tinta-suave hover:text-tinta'}`}
                      >
                        {t === 'barras' ? 'Barras' : 'Línea'}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
          {!ordenadas.length && <li className="px-3 py-2 text-[13px] text-tinta-suave">No hay columnas numéricas. Agrégalas en "Editar datos".</li>}
        </ul>
        {forma === 'combinado' && (
          <p className="mt-1.5 text-[13px] leading-snug text-tinta-suave">Barras y líneas usan la misma escala. Si las cifras son de magnitudes muy distintas (pesos y porcentaje), es mejor usar dos gráficos.</p>
        )}
        {forma === 'cascada' && (
          <p className="mt-1.5 text-[13px] leading-snug text-tinta-suave">Cada fila es una variación: la primera sale desde cero y las demás suman o restan.</p>
        )}
        {forma === 'circular' && (
          <p className="mt-1.5 text-[13px] leading-snug text-tinta-suave">Se dibujan los valores mayores que cero. Con más de 6 porciones, las menores se juntan en "Otros".</p>
        )}
      </div>

      {forma === 'dispersion' && (
        <Opcion
          etiqueta="Nombre de cada punto"
          valor={bloque.nombres ?? ''}
          opciones={[{ valor: '', nombre: 'Ninguno' }, ...conjunto.columnas.filter((c) => !esNumerica(c)).map((c) => ({ valor: c.clave, nombre: c.nombre }))]}
          onCambiar={(nombres) => poner({ nombres: nombres || undefined })}
        />
      )}

      {(forma === 'barras' || forma === 'combinado') && (
        <Opcion
          etiqueta="Debajo de cada categoría"
          valor={bloque.detalleEje ?? ''}
          opciones={[{ valor: '', nombre: 'Nada' }, ...conjunto.columnas.filter((c) => c.clave !== bloque.ejeX).map((c) => ({ valor: c.clave, nombre: c.nombre || c.clave }))]}
          onCambiar={(detalleEje) => poner({ detalleEje: detalleEje || undefined })}
          nota={bloque.detalleEje ? 'Se escribe el nombre de la columna y su valor, por ejemplo "TPP 18,29%".' : undefined}
        />
      )}

      <div className="space-y-2">
        {CON_APILADO.includes(forma) && bloque.series.length > 1 && (
          <Casilla etiqueta="Apilar las series" marcada={Boolean(bloque.apilado)} onCambiar={(apilado) => poner({ apilado })} nota="Una encima de otra, para ver el total." />
        )}
        {CON_ETIQUETAS[forma] && (forma !== 'barras' || !bloque.apilado) && (
          <Casilla etiqueta={CON_ETIQUETAS[forma]!} marcada={Boolean(bloque.etiquetas)} onCambiar={(etiquetas) => poner({ etiquetas })} />
        )}
        {forma === 'cascada' && (
          <Casilla etiqueta="Agregar una barra de total al final" marcada={Boolean(bloque.total)} onCambiar={(total) => poner({ total })} />
        )}
        {CON_DETALLE_FIJO.includes(forma) && (
          <Casilla
            etiqueta={bloque.resaltar ? `Mostrar siempre debajo las cifras de ${bloque.resaltar.valor}` : 'Mostrar siempre debajo las cifras del último dato'}
            marcada={Boolean(bloque.detalleFijo)}
            onCambiar={(detalleFijo) => poner({ detalleFijo: detalleFijo || undefined })}
            nota="Lo mismo que sale al pasar el mouse. En el PDF sale solo cuando hay cifras que el dibujo no muestra."
          />
        )}
      </div>

      {CON_RANGO_EJE.includes(forma) && (
        <SelectorRangoEje
          rango={bloque.rangoEje}
          columna={columnaDe(conjunto, bloque.series[0]?.clave ?? '')}
          etiqueta={forma === 'barrasHorizontales' ? 'Rango del eje horizontal (valores)' : forma === 'radar' ? 'Rango del radar (del centro al borde)' : 'Rango del eje vertical (valores)'}
          onCambiar={(rangoEje) => poner({ rangoEje })}
        />
      )}

      {CON_REFERENCIAS.includes(forma) && (
        <SelectorReferencias
          referencias={bloque.referencias ?? []}
          columna={columnaDe(conjunto, bloque.series[0]?.clave ?? '')}
          vertical={forma === 'barrasHorizontales'}
          onCambiar={(referencias) => poner({ referencias: referencias.length ? referencias : undefined })}
        />
      )}

      {CON_RESALTAR.includes(forma) && (
        <SelectorResaltado conjunto={conjunto} periodo={periodo} resaltar={bloque.resaltar} onCambiar={(resaltar) => poner({ resaltar })} />
      )}
    </div>
  );
}

/**
 * Líneas punteadas en un valor fijo ("Mínimo 12 %"). El valor se guarda al
 * salir del campo; la etiqueta, al escribir.
 */
function SelectorReferencias({ referencias, columna, vertical, onCambiar }: {
  referencias: Referencia[];
  columna?: Columna;
  vertical: boolean;
  onCambiar: (referencias: Referencia[]) => void;
}) {
  const unidad = columna?.tipo === 'porcentaje' ? ' (%)' : columna?.unidad ? ` (${columna.unidad})` : '';
  const cambiarUna = (i: number, cambio: Partial<Referencia>) =>
    onCambiar(referencias.map((r, j) => {
      if (j !== i) return r;
      const nueva: Referencia = { valor: cambio.valor ?? r.valor };
      const etiqueta = cambio.etiqueta !== undefined ? cambio.etiqueta : r.etiqueta;
      if (etiqueta) nueva.etiqueta = etiqueta;
      return nueva;
    }));
  return (
    <div>
      <Subtitulo>Líneas de referencia</Subtitulo>
      <p className="mb-2 text-[13px] leading-snug text-tinta-suave">
        Una línea punteada {vertical ? 'vertical' : 'horizontal'} en un valor fijo, por ejemplo un mínimo exigido o una meta.
      </p>
      <ul className="space-y-2">
        {referencias.map((r, i) => (
          <li key={i} className="flex items-end gap-2">
            <ValorReferencia valor={r.valor} etiqueta={`Valor${unidad}`} onCambiar={(valor) => cambiarUna(i, { valor })} />
            <label className="min-w-0 flex-[2]">
              <span className="text-[13px] text-tinta-suave">Etiqueta</span>
              <input
                type="text"
                value={r.etiqueta ?? ''}
                maxLength={60}
                placeholder="Mínimo 12 %"
                onChange={(e) => cambiarUna(i, { etiqueta: e.target.value })}
                className={`${CLASE_CAMPO} h-10 py-0`}
              />
            </label>
            <BotonIcono etiqueta="Quitar la línea de referencia" onClick={() => onCambiar(referencias.filter((_, j) => j !== i))}>
              <X size={16} />
            </BotonIcono>
          </li>
        ))}
      </ul>
      {referencias.length < 4 && (
        <button
          type="button"
          onClick={() => onCambiar([...referencias, { valor: 0 }])}
          className="mt-2 text-[13px] font-semibold text-primario underline-offset-2 hover:underline"
        >
          + Agregar línea de referencia
        </button>
      )}
    </div>
  );
}

function ValorReferencia({ valor, etiqueta, onCambiar }: { valor: number; etiqueta: string; onCambiar: (v: number) => void }) {
  const [texto, setTexto] = useState(numeroEditable(valor));
  const [mal, setMal] = useState(false);
  useEffect(() => setTexto(numeroEditable(valor)), [valor]);
  const guardar = () => {
    const n = interpretarNumero(texto);
    if (n === null || Number.isNaN(n)) return setMal(true);
    setMal(false);
    if (n !== valor) onCambiar(n);
  };
  return (
    <label className="min-w-0 flex-1">
      <span className="text-[13px] text-tinta-suave">{etiqueta}</span>
      <input
        type="text"
        inputMode="decimal"
        value={texto}
        aria-invalid={mal || undefined}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={guardar}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); guardar(); } }}
        className={`${CLASE_CAMPO} h-10 py-0 ${mal ? 'border-[#B3261E]' : ''}`}
      />
    </label>
  );
}

/**
 * Desde y hasta dónde va el eje de los valores. Vacío = automático. Se guarda
 * al salir del campo o con Enter, no con cada tecla.
 */
function SelectorRangoEje({ rango, columna, etiqueta, onCambiar }: {
  rango?: RangoEje;
  columna?: Columna;
  etiqueta: string;
  onCambiar: (rango: RangoEje | undefined) => void;
}) {
  const id = useId();
  const comoTexto = (v?: number) => (v === undefined ? '' : numeroEditable(v));
  const [desde, setDesde] = useState(comoTexto(rango?.desde));
  const [hasta, setHasta] = useState(comoTexto(rango?.hasta));
  const [aviso, setAviso] = useState<string | null>(null);
  // Si el rango cambia por fuera (deshacer, otra persona), se muestra el nuevo.
  useEffect(() => {
    setDesde(comoTexto(rango?.desde));
    setHasta(comoTexto(rango?.hasta));
    setAviso(null);
  }, [rango?.desde, rango?.hasta]);

  const unidad = columna?.tipo === 'porcentaje' ? '%' : columna?.unidad ? ` ${columna.unidad}` : '';
  const leer = (texto: string): number | undefined | null => {
    if (texto.trim() === '') return undefined;
    const n = interpretarNumero(texto);
    return n === null || Number.isNaN(n) ? null : n;
  };

  const guardar = (textoDesde = desde, textoHasta = hasta) => {
    const d = leer(textoDesde);
    const h = leer(textoHasta);
    if (d === null || h === null) return setAviso('Escribe un número, por ejemplo 3 o 3,5. Déjalo vacío para que sea automático.');
    if (d !== undefined && h !== undefined && d >= h) return setAviso('"Desde" debe ser menor que "Hasta".');
    setAviso(null);
    if (d === rango?.desde && h === rango?.hasta) return;
    const nuevo: RangoEje = {};
    if (d !== undefined) nuevo.desde = d;
    if (h !== undefined) nuevo.hasta = h;
    onCambiar(d === undefined && h === undefined ? undefined : nuevo);
  };

  const campo = (nombre: string, valor: string, poner: (v: string) => void) => (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[13px] text-tinta-suave">{nombre}{unidad && ` (${unidad.trim()})`}</span>
      <input
        type="text"
        inputMode="decimal"
        value={valor}
        placeholder="Automático"
        aria-describedby={`${id}-nota`}
        aria-invalid={Boolean(aviso) || undefined}
        onChange={(e) => poner(e.target.value)}
        onBlur={() => guardar()}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); guardar(); } }}
        className={`${CLASE_CAMPO} h-10 py-0`}
      />
    </label>
  );

  const fijo = rango?.desde !== undefined || rango?.hasta !== undefined;
  return (
    <div>
      <Subtitulo>{etiqueta}</Subtitulo>
      <div className="mt-1 flex gap-2">
        {campo('Desde', desde, setDesde)}
        {campo('Hasta', hasta, setHasta)}
      </div>
      {aviso ? (
        <p id={`${id}-nota`} role="alert" className="mt-1 text-[13px] leading-snug text-[#8E1015]">{aviso}</p>
      ) : (
        <p id={`${id}-nota`} className="mt-1 text-[13px] leading-snug text-tinta-suave">
          {fijo
            ? 'Rango fijo para todos los meses. Lo que quede por fuera se corta.'
            : 'Vacío = automático. Escribe, por ejemplo, 3 para que el eje empiece en 3 en lugar de 0.'}
          {fijo && (
            <>
              {' '}
              <button type="button" className="underline underline-offset-2 hover:text-tinta" onClick={() => { setDesde(''); setHasta(''); onCambiar(undefined); }}>
                Volver a automático
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}

/** Elegir una fila para destacarla con el color principal. Lo usan gráficos y tablas. */
export function SelectorResaltado({ conjunto, periodo, resaltar, onCambiar }: {
  conjunto: ConjuntoDatos;
  periodo: IdPeriodo;
  resaltar?: Resaltado;
  onCambiar: (resaltar: Resaltado | undefined) => void;
}) {
  const textos = conjunto.columnas.filter((c) => !esNumerica(c));
  if (!textos.length) return null;
  const columna = resaltar?.columna ?? textos[0].clave;
  const filas = filasDe(conjunto, periodo) ?? [];
  const valores = [...new Set(filas.map((f) => f[columna]).filter((v): v is string => typeof v === 'string' && v !== ''))];
  if (resaltar && !valores.includes(resaltar.valor)) valores.unshift(resaltar.valor);

  return (
    <div className="space-y-2">
      <Opcion
        etiqueta="Resaltar una fila"
        valor={resaltar?.valor ?? ''}
        opciones={[{ valor: '', nombre: 'Ninguna' }, ...valores.map((v) => ({ valor: v, nombre: v }))]}
        onCambiar={(valor) => onCambiar(valor ? { columna, valor } : undefined)}
        nota={resaltar && !filas.some((f) => String(f[resaltar.columna]) === resaltar.valor)
          ? `"${resaltar.valor}" no aparece en los datos de este mes: no se resalta nada.`
          : 'Se pinta con el color principal y el resto en gris.'}
      />
      {textos.length > 1 && (
        <Opcion
          etiqueta="Buscar la fila en la columna"
          valor={columna}
          opciones={textos.map((c) => ({ valor: c.clave, nombre: c.nombre }))}
          onCambiar={(col) => onCambiar(resaltar ? { columna: col, valor: resaltar.valor } : undefined)}
        />
      )}
    </div>
  );
}

/** Muestra de color con una paleta para elegir: los colores del tema, otro, o automático. */
function SelectorColor({ color, automatico, paleta, nombre, onCambiar }: {
  color?: string;
  automatico: string;
  paleta: string[];
  nombre: string;
  onCambiar: (color: string | undefined) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Color de ${nombre}`}
        aria-expanded={abierto}
        title="Cambiar el color"
        onClick={() => setAbierto((a) => !a)}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-tinte"
      >
        <span aria-hidden className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: color ?? automatico }} />
      </button>
      {abierto && (
        <div className="absolute right-0 top-9 z-20 w-56 rounded-xl border border-linea-fuerte bg-white p-3 shadow-lg">
          <div className="grid grid-cols-6 gap-1.5">
            {paleta.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Usar ${c}`}
                onClick={() => { onCambiar(c); setAbierto(false); }}
                className={`h-7 w-7 rounded-full ring-offset-2 ${color === c ? 'ring-2 ring-tinta' : 'ring-1 ring-black/10'}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-[13px]">
            <label className="flex items-center gap-1.5 text-tinta-suave">
              Otro
              <input type="color" value={color ?? automatico} onChange={(e) => onCambiar(e.target.value.toUpperCase())} className="h-7 w-9 cursor-pointer rounded border border-linea-fuerte" />
            </label>
            <button type="button" onClick={() => { onCambiar(undefined); setAbierto(false); }} className="text-tinta-suave underline underline-offset-2 hover:text-tinta">
              Automático
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
