'use client';

// Ventana "Cargar desde Excel". Dos caminos (ver "Diseño de la etapa 3" en
// PLAN.md):
// - bloque nuevo: se eligen eje, series (o columnas), tipos y tipo de gráfico;
// - datos que ya existen: para cada columna del conjunto se elige de qué
//   columna del archivo sale. Se propone lo de la última carga.
//
// El archivo se lee aquí, en el navegador; solo se guardan las filas que
// resultan, con las operaciones de siempre.

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, FileSpreadsheet, TriangleAlert, Upload, X } from 'lucide-react';
import { Diapositiva } from '@/components/diapositivas/Diapositiva';
import { Lienzo } from '@/components/visor/Lienzo';
import { filasDe } from '@/lib/datos';
import { aplicarVarias, bloquesQueUsan, type Operacion } from '@/lib/edicion/operaciones';
import { mesSiguiente } from '@/lib/edicion/plantillas';
import { pesoJson, SERIES_POR_FORMA, TOPES, validarPresentacion } from '@/lib/edicion/validar';
import { motivoForma, opsActualizarDesdeExcel, opsBloqueDesdeExcel, type DestinoExcel, type DestinoMes } from '@/lib/excel/cargar';
import type { Libro } from '@/lib/excel/leer';
import {
  armarFilas, buscarEncabezado, columnasDelArchivo, filasDeDatos, letraColumna, proponerEncabezados, proponerTipo, rejillaDe,
  relocalizarEncabezados, textoCelda, type ColumnaArchivo, type Lectura, type Mapeo, type TipoPropuesto,
} from '@/lib/excel/tabla';
import { formatear } from '@/lib/formato';
import { nombrePeriodo } from '@/lib/periodos';
import type { Columna, FormaGrafico, FormatoFecha, IdPeriodo, OrigenExcel, Presentacion, TipoColumna } from '@/lib/tipos';
import { FORMAS_INFO } from './EditorGrafico';
import { BotonIcono, Casilla, CLASE_BOTON, CLASE_BOTON_PRINCIPAL, CLASE_CAMPO, Opcion, Subtitulo } from './piezas';

interface Props {
  presentacion: Presentacion;
  destino: DestinoExcel;
  /** Mes elegido en la barra. */
  periodo: IdPeriodo;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
  onPeriodo: (periodo: IdPeriodo) => void;
  onCerrar: () => void;
}

/** El último archivo leído en esta pestaña, para no tener que elegirlo otra vez. */
let ultimoLibro: Libro | null = null;

/** Un envío de guardado lleva como mucho esto (ver usarEdicion). */
const TOPE_ENVIO = 180_000;
const FILAS_A_LA_VISTA = 200;
const COLUMNAS_A_LA_VISTA = 60;

const TIPOS: { valor: TipoColumna; nombre: string }[] = [
  { valor: 'texto', nombre: 'Texto' },
  { valor: 'numero', nombre: 'Número' },
  { valor: 'porcentaje', nombre: 'Porcentaje' },
  { valor: 'moneda', nombre: 'Moneda' },
];
const FECHAS: { valor: FormatoFecha; nombre: string }[] = [
  { valor: 'mes', nombre: 'Mes y año (Oct 26)' },
  { valor: 'dia', nombre: 'Día (31/10/2026)' },
  { valor: 'anio', nombre: 'Año (2026)' },
];
const ORDEN_FORMAS: FormaGrafico[] = ['barras', 'lineas', 'barrasHorizontales', 'area', 'combinado', 'circular', 'dispersion', 'radar', 'cascada'];

type LecturaHoja = Lectura & { hoja: string; sobrantes: 'primeras' | 'ultimas' };
type Ajuste = { tipo?: TipoColumna; fechas?: FormatoFecha };

const esNumerico = (t: TipoColumna) => t !== 'texto';

/** Nombre propuesto para los datos: el de la hoja o, si hay una sola, el del archivo. */
const nombreSugerido = (l: Libro, hoja: string) => (l.hojas.length > 1 ? hoja : l.archivo.replace(/\.[^.]+$/, '')).slice(0, TOPES.titulo);

function analizar(libro: Libro, lectura: LecturaHoja) {
  const hoja = libro.hojas.find((h) => h.nombre === lectura.hoja) ?? libro.hojas[0];
  const rejilla = rejillaDe(hoja, lectura.orientacion);
  const columnas = columnasDelArchivo(rejilla, lectura.encabezados, lectura.orientacion);
  const datos = filasDeDatos(rejilla, lectura);
  const propuestos = new Map<number, TipoPropuesto>(columnas.map((c) => [c.indice, proponerTipo(datos.map((f) => f[c.indice] ?? null))]));
  return { hoja, rejilla, columnas, datos, propuestos };
}

export function CargarExcel({ presentacion, destino, periodo, cambiar, onPeriodo, onCerrar }: Props) {
  const conjunto = destino.modo === 'conjunto' && Object.hasOwn(presentacion.datos, destino.conjunto) ? presentacion.datos[destino.conjunto] : undefined;
  const nuevo = destino.modo === 'nuevo' ? destino : null;
  const origen = conjunto?.origen;
  const dialogo = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const idEntrada = useId();

  const [libro, setLibro] = useState<Libro | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [pestana, setPestana] = useState<'archivo' | 'resultado'>('archivo');
  const [lectura, setLectura] = useState<LecturaHoja>({ hoja: '', orientacion: 'filas', encabezados: 1, hasta: 'vacia', invertir: false, sobrantes: 'primeras' });
  // Bloque nuevo: eje (solo gráficos), columnas marcadas en orden y ajustes de tipo.
  const [eje, setEje] = useState<number | null>(null);
  const [marcadas, setMarcadas] = useState<number[]>([]);
  const [ajustes, setAjustes] = useState<Record<number, Ajuste>>({});
  const [forma, setForma] = useState<FormaGrafico>('barras');
  const [nombre, setNombre] = useState('');
  /** Mientras no se escriba un nombre, se usa el de la hoja. */
  const [nombreEscrito, setNombreEscrito] = useState(false);
  const [porPeriodo, setPorPeriodo] = useState(true);
  // Datos que ya existen: de qué columna del archivo sale cada columna del conjunto.
  const [mapa, setMapa] = useState<Record<string, number | null>>({});
  const [fechasMapa, setFechasMapa] = useState<Record<string, FormatoFecha>>({});
  const [mes, setMes] = useState<IdPeriodo | 'nuevo'>(periodo);

  // Otra persona pudo quitar esos datos mientras tanto.
  const sinDestino = destino.modo === 'conjunto' && !conjunto;
  useEffect(() => {
    if (sinDestino) onCerrar();
  }, [sinDestino, onCerrar]);

  // Al abrir, el foco entra a la ventana; al cerrar, vuelve a donde estaba.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    dialogo.current?.focus();
    return () => anterior?.focus?.();
  }, []);

  const analisis = useMemo(() => (libro ? analizar(libro, lectura) : null), [libro, lectura]);

  /** Propone todo para una hoja: encabezados (si no se dan), columnas y tipos. */
  const preparar = (l: Libro, base: LecturaHoja, encabezados?: number) => {
    const notas: string[] = [];
    let lect = base;
    if (encabezados === undefined) {
      const hoja = l.hojas.find((h) => h.nombre === base.hoja) ?? l.hojas[0];
      const rejilla = rejillaDe(hoja, base.orientacion);
      const propuesta = proponerEncabezados(rejilla);
      let fila = propuesta;
      if (conjunto) {
        const buscados = origen ? origen.columnas.map((c) => c.encabezado) : conjunto.columnas.map((c) => c.nombre);
        fila = relocalizarEncabezados(rejilla, buscados, origen?.encabezados ?? propuesta, base.orientacion);
        if (origen && fila !== origen.encabezados) {
          const que = base.orientacion === 'filas' ? 'la fila' : 'la columna';
          notas.push(`Los encabezados estaban en ${que} ${origen.encabezados}; en este archivo están en ${que} ${fila}.`);
        }
      }
      lect = { ...base, encabezados: fila };
    } else {
      lect = { ...base, encabezados };
    }
    const a = analizar(l, lect);
    if (conjunto) {
      const nuevoMapa: Record<string, number | null> = {};
      const nuevasFechas: Record<string, FormatoFecha> = {};
      const faltan: string[] = [];
      for (const c of conjunto.columnas) {
        const recordada = origen?.columnas.find((x) => x.clave === c.clave);
        const encontrada = (recordada && buscarEncabezado(a.columnas, recordada.encabezado)) ?? buscarEncabezado(a.columnas, c.nombre);
        nuevoMapa[c.clave] = encontrada?.indice ?? null;
        if (recordada?.fechas) nuevasFechas[c.clave] = recordada.fechas;
        if (!encontrada) faltan.push(recordada ? `"${c.nombre}" (antes salía de "${recordada.encabezado}")` : `"${c.nombre}"`);
      }
      if (faltan.length === 1) notas.push(`No encontré en el archivo de dónde sale la columna ${faltan[0]}: elígela abajo o quedará vacía.`);
      else if (faltan.length) notas.push(`No encontré en el archivo de dónde salen las columnas ${faltan.join(', ')}: elígelas abajo o quedarán vacías.`);
      setMapa(nuevoMapa);
      setFechasMapa(nuevasFechas);
    } else if (nuevo) {
      const textos = a.columnas.filter((c) => a.propuestos.get(c.indice)?.tipo === 'texto');
      const numericas = a.columnas.filter((c) => esNumerico(a.propuestos.get(c.indice)?.tipo ?? 'texto'));
      if (nuevo.tipo === 'grafico') {
        const ejeElegido = (textos[0] ?? a.columnas[0])?.indice ?? null;
        setEje(ejeElegido);
        // Un solo eje de valores: se proponen las series del mismo tipo que la
        // primera (todos porcentajes, por ejemplo), para que se lean juntas.
        const series = numericas.filter((c) => c.indice !== ejeElegido);
        const tipo = series[0] && a.propuestos.get(series[0].indice)?.tipo;
        setMarcadas(series.filter((c) => a.propuestos.get(c.indice)?.tipo === tipo).slice(0, SERIES_POR_FORMA[forma][1]).map((c) => c.indice));
        if (ejeElegido !== null && a.propuestos.get(ejeElegido)?.fechas && forma === 'barras') setForma('lineas');
      } else {
        setMarcadas(a.columnas.slice(0, TOPES.columnas).map((c) => c.indice));
      }
      setAjustes({});
    }
    setLectura(lect);
    return notas;
  };

  const abrirLibro = (l: Libro) => {
    ultimoLibro = l;
    setLibro(l);
    setError(null);
    const notas: string[] = [];
    const visibles = l.hojas.filter((h) => !h.oculta && h.celdas.length);
    let hoja = (visibles[0] ?? l.hojas[0]).nombre;
    if (origen) {
      if (l.hojas.some((h) => h.nombre === origen.hoja)) hoja = origen.hoja;
      else notas.push(`El archivo no tiene la hoja "${origen.hoja}" de la última vez: elegí "${hoja}". Cámbiala si no es esa.`);
    }
    if (nuevo && !nombreEscrito) setNombre(nombreSugerido(l, hoja));
    const base: LecturaHoja = {
      hoja,
      orientacion: origen?.orientacion ?? 'filas',
      encabezados: 1,
      hasta: origen?.hasta ?? 'vacia',
      invertir: origen?.invertir ?? false,
      sobrantes: origen?.sobrantes ?? 'primeras',
    };
    notas.push(...preparar(l, base));
    const recortada = l.hojas.find((h) => h.nombre === hoja)?.recortada;
    if (recortada) notas.push('La hoja es muy grande: se leyeron las primeras 20.000 filas y 256 columnas.');
    setAvisos(notas);
    setPestana(origen ? 'resultado' : 'archivo');
  };

  const leer = async (archivo: File) => {
    setLeyendo(true);
    setError(null);
    try {
      const [{ leerArchivo, ArchivoNoLegible }, bytes] = await Promise.all([import('@/lib/excel/leer'), archivo.arrayBuffer()]);
      try {
        abrirLibro(leerArchivo(archivo.name, new Uint8Array(bytes)));
      } catch (e) {
        setError(e instanceof ArchivoNoLegible ? e.message : 'No se pudo leer el archivo. Ábrelo en Excel, guárdalo como .xlsx y vuelve a intentarlo.');
      }
    } catch {
      setError('No se pudo abrir el archivo.');
    } finally {
      setLeyendo(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Resultado: columnas, filas, operaciones y la presentación como quedaría.

  const ultimo = presentacion.periodos.at(-1)!;
  const mesNuevo = mesSiguiente(ultimo);
  const usaMes = conjunto ? conjunto.porPeriodo : porPeriodo;
  const destinoMes: DestinoMes | null = !usaMes ? null : mes === 'nuevo' ? { periodo: mesNuevo, nuevo: true } : { periodo: presentacion.periodos.includes(mes) ? mes : periodo, nuevo: false };

  const columnaArchivo = (indice: number | null) => (indice === null ? undefined : analisis?.columnas.find((c) => c.indice === indice));
  const fechasDe = (indice: number, ajuste?: FormatoFecha) => ajuste ?? analisis?.propuestos.get(indice)?.fechas ?? 'dia';

  /** Tipo con que entra una columna del archivo en un bloque nuevo. */
  const tipoNuevo = (indice: number, papel: 'eje' | 'serie' | 'columna'): { tipo: TipoColumna; decimales?: number } => {
    const propuesto = analisis?.propuestos.get(indice) ?? { tipo: 'texto' as const };
    let tipo = ajustes[indice]?.tipo;
    if (!tipo) {
      if (papel === 'eje') tipo = forma === 'dispersion' ? (esNumerico(propuesto.tipo) ? propuesto.tipo : 'numero') : 'texto';
      else if (papel === 'serie') tipo = esNumerico(propuesto.tipo) ? propuesto.tipo : 'numero';
      else tipo = propuesto.tipo;
    }
    return tipo === propuesto.tipo && propuesto.decimales !== undefined ? { tipo, decimales: propuesto.decimales } : { tipo };
  };

  const resultado = useMemo(() => {
    if (!analisis || !libro) return null;
    const mapeo: (Mapeo & { encabezado?: string })[] = [];
    if (conjunto) {
      for (const c of conjunto.columnas) {
        const indice = mapa[c.clave] ?? null;
        mapeo.push({ columna: c, indice, fechas: indice === null ? undefined : fechasDe(indice, fechasMapa[c.clave]), encabezado: columnaArchivo(indice)?.encabezado });
      }
    } else if (nuevo) {
      const elegidas: { indice: number; papel: 'eje' | 'serie' | 'columna' }[] = nuevo.tipo === 'grafico'
        ? [...(eje === null ? [] : [{ indice: eje, papel: 'eje' as const }]), ...marcadas.filter((i) => i !== eje).map((indice) => ({ indice, papel: 'serie' as const }))]
        : marcadas.map((indice) => ({ indice, papel: 'columna' as const }));
      elegidas.forEach(({ indice, papel }, i) => {
        const archivo = columnaArchivo(indice);
        if (!archivo) return;
        const columna: Columna = { clave: `col${i + 1}`, nombre: archivo.encabezado, ...tipoNuevo(indice, papel) };
        mapeo.push({ columna, indice, fechas: fechasDe(indice, ajustes[indice]?.fechas), encabezado: archivo.encabezado });
      });
    }
    const armadas = armarFilas(analisis.datos, mapeo, lectura.sobrantes);
    const nuevoOrigen: OrigenExcel = {
      archivo: libro.archivo.slice(0, 200),
      hoja: analisis.hoja.nombre.slice(0, 100),
      orientacion: lectura.orientacion,
      encabezados: lectura.encabezados,
      columnas: mapeo.filter((m) => m.encabezado).map((m) => ({
        clave: m.columna.clave,
        encabezado: m.encabezado!,
        ...(m.columna.tipo === 'texto' && m.indice !== null && analisis.propuestos.get(m.indice)?.fechas ? { fechas: m.fechas } : {}),
      })),
      hasta: lectura.hasta,
      ...(lectura.invertir ? { invertir: true } : {}),
      ...(armadas.total > TOPES.filasPorMes ? { sobrantes: lectura.sobrantes } : {}),
      cargado: new Date().toISOString(),
      periodo: destinoMes?.periodo ?? null,
    };

    let ops: Operacion[] = [];
    let motivo: string | null = null;
    let diapositiva: string | undefined;
    if (conjunto) {
      ops = opsActualizarDesdeExcel(presentacion, conjunto.id, armadas.filas, destinoMes, nuevoOrigen);
      const usa = new Set(bloquesQueUsan(presentacion, conjunto.id));
      diapositiva = presentacion.diapositivas.find((d) => d.bloques.some((b) => usa.has(b.id)))?.id;
      if (mapeo.every((m) => m.indice === null)) motivo = 'Elige de qué columnas del archivo salen los datos.';
    } else if (nuevo) {
      const columnas = mapeo.map((m) => m.columna);
      if (nuevo.tipo === 'grafico') motivo = eje === null ? 'Elige la columna del eje.' : motivoForma(forma, columnas);
      else if (!columnas.length) motivo = 'Elige al menos una columna.';
      if (!motivo) {
        const r = opsBloqueDesdeExcel(presentacion, {
          tipo: nuevo.tipo, diapositiva: nuevo.diapositiva, nombre: nombre.trim() || analisis.hoja.nombre, columnas, filas: armadas.filas,
          forma, mes: destinoMes, origen: nuevoOrigen,
        });
        if (r) ops = r.ops;
        else motivo = 'La diapositiva ya no existe: alguien la quitó mientras tanto.';
      }
      diapositiva = nuevo.diapositiva;
    }
    if (!motivo && !armadas.filas.length) motivo = 'No hay filas con datos debajo de los encabezados.';

    const previa = ops.length ? aplicarVarias(presentacion, ops).presentacion : presentacion;
    if (!motivo && ops.length) {
      const validacion = validarPresentacion(previa);
      if (!validacion.ok) motivo = `No se puede cargar así: ${validacion.errores[0]}`;
      else if (pesoJson(ops) > TOPE_ENVIO) motivo = 'Son demasiados datos para cargar de una vez: elige menos columnas o filas.';
    }
    return { mapeo, armadas, ops, motivo, previa, diapositiva };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analisis, libro, conjunto, nuevo, mapa, fechasMapa, eje, marcadas, ajustes, forma, nombre, lectura, destinoMes?.periodo, destinoMes?.nuevo, presentacion]);

  const cargar = () => {
    if (!resultado || resultado.motivo || !resultado.ops.length) return;
    cambiar(resultado.ops);
    if (destinoMes && destinoMes.periodo !== periodo) onPeriodo(destinoMes.periodo);
    onCerrar();
  };

  // ---------------------------------------------------------------------------

  const titulo = conjunto ? `Cargar Excel en "${conjunto.nombre}"` : nuevo?.tipo === 'tabla' ? 'Tabla nueva desde Excel' : 'Gráfico nuevo desde Excel';
  const filasExistentes = conjunto && destinoMes && !destinoMes.nuevo ? filasDe(conjunto, destinoMes.periodo)?.length ?? 0 : conjunto && !conjunto.porPeriodo ? filasDe(conjunto, periodo)?.length ?? 0 : 0;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-tinta/45 p-4 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cargar-excel-titulo"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onCerrar();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setArrastrando(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          const archivo = e.dataTransfer.files[0];
          if (archivo) void leer(archivo);
        }}
        className={`flex h-full max-h-[880px] w-full max-w-[1240px] flex-col rounded-2xl bg-white shadow-[0_24px_64px_-16px_rgba(36,26,32,0.45)] focus:outline-none ${arrastrando ? 'ring-4 ring-primario/40' : ''}`}
      >
        <header className="flex shrink-0 items-center gap-4 border-b border-linea px-6 py-4">
          <FileSpreadsheet size={22} className="shrink-0 text-primario" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 id="cargar-excel-titulo" className="truncate text-xl font-bold tracking-tight text-tinta">{titulo}</h2>
            {libro && (
              <p className="mt-0.5 truncate text-sm text-tinta-suave">
                {libro.archivo}
                <button type="button" className="ml-2 font-semibold text-primario hover:underline" onClick={() => entrada.current?.click()}>Cambiar archivo</button>
              </p>
            )}
          </div>
          <BotonIcono etiqueta="Cerrar" onClick={onCerrar}><X size={20} /></BotonIcono>
        </header>

        <input
          ref={entrada}
          id={idEntrada}
          type="file"
          accept=".xlsx,.xlsm,.csv,.txt,.xls,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            e.target.value = '';
            if (archivo) void leer(archivo);
          }}
        />

        {!libro || !analisis ? (
          <ElegirArchivo
            leyendo={leyendo}
            error={error}
            origen={origen}
            ultimo={ultimoLibro}
            onElegir={() => entrada.current?.click()}
            onUsarUltimo={() => ultimoLibro && abrirLibro(ultimoLibro)}
          />
        ) : (
          <div className="flex min-h-0 flex-1">
            <aside aria-label="Configuración" className="w-[390px] shrink-0 space-y-6 overflow-y-auto border-r border-linea px-6 py-5">
              {error && <Aviso tipo="error">{error}</Aviso>}
              {avisos.map((a) => <Aviso key={a}>{a}</Aviso>)}

              <section className="space-y-3">
                <Subtitulo>Hoja y encabezados</Subtitulo>
                {libro.hojas.length > 1 && (
                  <Opcion
                    etiqueta="Hoja"
                    valor={analisis.hoja.nombre}
                    opciones={libro.hojas.map((h) => ({ valor: h.nombre, nombre: `${h.nombre}${h.oculta ? ' (oculta)' : ''}${h.celdas.length ? '' : ' (vacía)'}` }))}
                    onCambiar={(hoja) => {
                      if (nuevo && !nombreEscrito) setNombre(nombreSugerido(libro, hoja));
                      setAvisos(preparar(libro, { ...lectura, hoja }));
                    }}
                  />
                )}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Opcion
                      etiqueta="Los encabezados están"
                      valor={lectura.orientacion}
                      opciones={[{ valor: 'filas', nombre: 'En una fila (lo normal)' }, { valor: 'columnas', nombre: 'En una columna' }]}
                      onCambiar={(orientacion) => setAvisos(preparar(libro, { ...lectura, orientacion }))}
                    />
                  </div>
                  <NumeroEncabezados
                    orientacion={lectura.orientacion}
                    valor={lectura.encabezados}
                    maximo={Math.max(1, analisis.rejilla.length)}
                    onCambiar={(n) => {
                      preparar(libro, lectura, n);
                      setAvisos([]);
                    }}
                  />
                </div>
                <p className="text-[13px] leading-snug text-tinta-suave">
                  {lectura.orientacion === 'filas' ? 'También puedes hacer clic en el número de la fila en la pestaña "Archivo".' : 'Los datos de cada columna del conjunto se leen hacia la derecha.'}
                </p>
              </section>

              {nuevo && (
                <ColumnasNuevas
                  tipo={nuevo.tipo}
                  columnas={analisis.columnas}
                  propuestos={analisis.propuestos}
                  eje={eje}
                  marcadas={marcadas}
                  forma={forma}
                  ajustes={ajustes}
                  tipoDe={tipoNuevo}
                  onEje={(i) => {
                    setEje(i);
                    setMarcadas((m) => m.filter((x) => x !== i));
                  }}
                  onMarcadas={setMarcadas}
                  onAjuste={(i, a) => setAjustes((x) => ({ ...x, [i]: { ...x[i], ...a } }))}
                />
              )}
              {conjunto && (
                <ColumnasConjunto
                  columnas={conjunto.columnas}
                  archivo={analisis.columnas}
                  propuestos={analisis.propuestos}
                  mapa={mapa}
                  fechas={fechasMapa}
                  onMapa={(clave, indice) => setMapa((m) => ({ ...m, [clave]: indice }))}
                  onFechas={(clave, f) => setFechasMapa((m) => ({ ...m, [clave]: f }))}
                />
              )}

              {nuevo?.tipo === 'grafico' && (
                <section className="space-y-2">
                  <Subtitulo>Tipo de gráfico</Subtitulo>
                  <div role="radiogroup" aria-label="Tipo de gráfico" className="grid grid-cols-3 gap-1.5">
                    {ORDEN_FORMAS.map((f) => {
                      const { nombre: n, icono: Icono } = FORMAS_INFO[f];
                      return (
                        <button
                          key={f}
                          type="button"
                          role="radio"
                          aria-checked={forma === f}
                          onClick={() => {
                            setForma(f);
                            setMarcadas((m) => m.slice(0, SERIES_POR_FORMA[f][1]));
                          }}
                          className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[12px] leading-tight ${forma === f ? 'border-primario bg-tinte font-semibold text-tinta' : 'border-linea-fuerte text-tinta-suave hover:bg-fondo-app hover:text-tinta'}`}
                        >
                          <Icono size={20} aria-hidden /> {n}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[13px] leading-snug text-tinta-suave">{FORMAS_INFO[forma].ayuda} Después se cambia en el panel.</p>
                </section>
              )}

              {nuevo && (
                <section className="space-y-3">
                  <Subtitulo>Datos</Subtitulo>
                  <div>
                    <label htmlFor="excel-nombre" className="mb-1 block text-sm font-semibold text-tinta">Nombre de los datos</label>
                    <input id="excel-nombre" value={nombre} maxLength={TOPES.titulo} onChange={(e) => {
                        setNombre(e.target.value);
                        setNombreEscrito(true);
                      }} className={CLASE_CAMPO} />
                  </div>
                  <div role="group" aria-label="Cómo cambian con los meses" className="flex gap-0.5 rounded-full bg-fondo-app p-0.5">
                    {[{ valor: true, nombre: 'Propios de cada mes' }, { valor: false, nombre: 'Iguales en todos' }].map((o) => (
                      <button
                        key={String(o.valor)}
                        type="button"
                        aria-pressed={porPeriodo === o.valor}
                        onClick={() => setPorPeriodo(o.valor)}
                        className={`h-7 flex-1 rounded-full px-2.5 text-[13px] transition-colors ${porPeriodo === o.valor ? 'bg-white font-semibold text-tinta shadow-sm' : 'text-tinta-suave hover:text-tinta'}`}
                      >
                        {o.nombre}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <Subtitulo>Mes</Subtitulo>
                {usaMes ? (
                  <Opcion
                    etiqueta="Cargar en"
                    valor={mes === 'nuevo' ? 'nuevo' : destinoMes!.periodo}
                    opciones={[
                      ...[...presentacion.periodos].reverse().map((m) => ({ valor: m, nombre: nombrePeriodo(m) })),
                      ...(presentacion.periodos.length < TOPES.periodos ? [{ valor: 'nuevo', nombre: `Nuevo mes: ${nombrePeriodo(mesNuevo)}` }] : []),
                    ]}
                    onCambiar={(m) => setMes(m)}
                    nota={
                      mes === 'nuevo'
                        ? `Se agrega ${nombrePeriodo(mesNuevo)} copiando ${nombrePeriodo(ultimo)} (como "Nuevo mes") y se cargan estos datos encima.`
                        : filasExistentes ? `Reemplaza ${filasExistentes === 1 ? 'la fila' : `las ${filasExistentes} filas`} que hay en ${nombrePeriodo(destinoMes!.periodo)}.` : undefined
                    }
                  />
                ) : (
                  <p className="text-[15px] leading-snug text-tinta">
                    Estos datos son <strong>iguales en todos los meses</strong>{filasExistentes ? ': se reemplazan para todos.' : '.'}
                  </p>
                )}
              </section>

              <section className="space-y-3">
                <Subtitulo>Filas</Subtitulo>
                <Casilla
                  etiqueta="Terminar en la primera fila vacía"
                  nota="Lo que va debajo (notas, fuente) no se carga."
                  marcada={lectura.hasta === 'vacia'}
                  onCambiar={(si) => setLectura((l) => ({ ...l, hasta: si ? 'vacia' : 'final' }))}
                />
                <Casilla
                  etiqueta="Dar vuelta el orden"
                  nota="Si el archivo tiene lo más reciente arriba."
                  marcada={lectura.invertir}
                  onCambiar={(invertir) => setLectura((l) => ({ ...l, invertir }))}
                />
                {resultado && resultado.armadas.total > TOPES.filasPorMes && (
                  <Opcion
                    etiqueta={`Hay ${resultado.armadas.total.toLocaleString('es-CO')} filas y el máximo es ${TOPES.filasPorMes}`}
                    valor={lectura.sobrantes}
                    opciones={[{ valor: 'primeras', nombre: `Quedarse con las primeras ${TOPES.filasPorMes}` }, { valor: 'ultimas', nombre: `Quedarse con las últimas ${TOPES.filasPorMes}` }]}
                    onCambiar={(sobrantes) => setLectura((l) => ({ ...l, sobrantes }))}
                  />
                )}
              </section>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col">
              <div role="tablist" aria-label="Vista previa" className="flex shrink-0 gap-1 border-b border-linea px-6 pt-3">
                {(['archivo', 'resultado'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="tab"
                    aria-selected={pestana === p}
                    onClick={() => setPestana(p)}
                    className={`-mb-px h-10 border-b-2 px-3 text-[15px] ${pestana === p ? 'border-primario font-semibold text-tinta' : 'border-transparent text-tinta-suave hover:text-tinta'}`}
                  >
                    {p === 'archivo' ? 'Archivo' : 'Resultado'}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                {pestana === 'archivo' ? (
                  <VistaArchivo
                    hoja={analisis.hoja.celdas}
                    lectura={lectura}
                    usadas={new Set(resultado?.mapeo.map((m) => m.indice).filter((i) => i !== null) ?? [])}
                    onEncabezados={(n) => {
                      preparar(libro, lectura, n);
                      setAvisos([]);
                    }}
                  />
                ) : resultado ? (
                  <VistaResultado
                    presentacion={resultado.previa}
                    diapositiva={resultado.diapositiva}
                    periodo={destinoMes?.periodo ?? periodo}
                    columnas={resultado.mapeo.map((m) => m.columna)}
                    filas={resultado.armadas.filas}
                    problemas={resultado.armadas.problemas}
                    motivo={resultado.motivo}
                  />
                ) : null}
              </div>
            </main>
          </div>
        )}

        <footer className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-linea px-6 py-3">
          <p className="min-w-0 flex-1 text-[14px] leading-snug text-tinta-suave" role={resultado?.motivo ? 'alert' : 'status'}>
            {resultado && (resultado.motivo ? (
              <strong className="text-[#8E1015]">{resultado.motivo}</strong>
            ) : (
              <>
                Se cargarán <strong className="text-tinta">{resultado.armadas.filas.length} {resultado.armadas.filas.length === 1 ? 'fila' : 'filas'}</strong>
                {destinoMes ? <> en <strong className="text-tinta">{nombrePeriodo(destinoMes.periodo)}</strong></> : ' para todos los meses'}.
                {resultado.armadas.problemas.size > 0 && (
                  <> <span className="text-[#8E1015]">{resultado.armadas.problemas.size === 1 ? '1 celda no se entendió y queda vacía' : `${resultado.armadas.problemas.size} celdas no se entendieron y quedan vacías`} (en rojo en "Resultado").</span></>
                )}
                {resultado.mapeo.some((m) => m.indice === null) && (
                  <> Quedan vacías: {resultado.mapeo.filter((m) => m.indice === null).map((m) => m.columna.nombre).join(', ')}.</>
                )}
              </>
            ))}
          </p>
          <button type="button" className={CLASE_BOTON} onClick={onCerrar}>Cancelar</button>
          <button type="button" className={CLASE_BOTON_PRINCIPAL} onClick={cargar} disabled={!resultado || Boolean(resultado.motivo) || !resultado.ops.length}>
            <Upload size={16} aria-hidden /> Cargar
          </button>
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Aviso({ tipo = 'aviso', children }: { tipo?: 'aviso' | 'error'; children: React.ReactNode }) {
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`flex gap-2 rounded-lg border p-3 text-[13px] leading-snug ${tipo === 'error' ? 'border-[#C4161C]/40 bg-[#FDECEC] text-[#8E1015]' : 'border-linea-fuerte bg-tinte text-tinta'}`}>
      <TriangleAlert size={16} className="mt-px shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

function ElegirArchivo({ leyendo, error, origen, ultimo, onElegir, onUsarUltimo }: {
  leyendo: boolean;
  error: string | null;
  origen?: OrigenExcel;
  ultimo: Libro | null;
  onElegir: () => void;
  onUsarUltimo: () => void;
}) {
  const fecha = origen ? new Date(origen.cargado).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
      <div className="w-full max-w-lg space-y-4 rounded-2xl border-2 border-dashed border-linea-fuerte p-8 text-center">
        <FileSpreadsheet size={40} className="mx-auto text-tinta-suave" aria-hidden />
        <p className="text-lg font-semibold text-tinta">{leyendo ? 'Leyendo el archivo…' : 'Elige un archivo de Excel o arrástralo aquí'}</p>
        <p className="text-[14px] leading-snug text-tinta-suave">Libros de Excel (.xlsx, .xlsm) y archivos CSV.</p>
        {error && <Aviso tipo="error">{error}</Aviso>}
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className={CLASE_BOTON_PRINCIPAL} onClick={onElegir} disabled={leyendo}>
            <Upload size={16} aria-hidden /> Elegir archivo
          </button>
          {ultimo && (
            <button type="button" className={CLASE_BOTON} onClick={onUsarUltimo} disabled={leyendo} title="El último archivo que se eligió en esta pestaña">
              Usar el mismo: {ultimo.archivo.length > 32 ? `${ultimo.archivo.slice(0, 30)}…` : ultimo.archivo}
            </button>
          )}
        </div>
        {origen && (
          <p className="text-[14px] leading-snug text-tinta">
            La última vez se cargó <strong>{origen.archivo}</strong>, hoja <strong>{origen.hoja}</strong>, el {fecha}. Se propondrá lo mismo con el archivo nuevo.
          </p>
        )}
        <p className="text-[13px] leading-snug text-tinta-suave">El archivo se lee en este computador y no se sube a ninguna parte. Solo se guardan los datos que cargues.</p>
      </div>
    </div>
  );
}

function NumeroEncabezados({ orientacion, valor, maximo, onCambiar }: { orientacion: Lectura['orientacion']; valor: number; maximo: number; onCambiar: (n: number) => void }) {
  const id = useId();
  const [borrador, setBorrador] = useState<string | null>(null);
  const confirmar = (texto: string) => {
    let n: number;
    if (orientacion === 'columnas' && /^[A-Za-z]{1,3}$/.test(texto.trim())) {
      n = 0;
      for (const letra of texto.trim().toUpperCase()) n = n * 26 + (letra.charCodeAt(0) - 64);
    } else {
      n = Number(texto);
    }
    setBorrador(null);
    if (Number.isInteger(n) && n >= 1 && n <= maximo && n !== valor) onCambiar(n);
  };
  return (
    <div className="w-24 shrink-0">
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-tinta">{orientacion === 'filas' ? 'Fila' : 'Columna'}</label>
      <input
        id={id}
        inputMode={orientacion === 'filas' ? 'numeric' : 'text'}
        value={borrador ?? (orientacion === 'filas' ? String(valor) : letraColumna(valor - 1))}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={(e) => confirmar(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirmar(e.currentTarget.value);
        }}
        className={`${CLASE_CAMPO} h-10 text-right`}
      />
    </div>
  );
}

const CLASE_SELECT_CHICO = 'h-8 rounded-md border border-linea-fuerte bg-white px-1.5 text-[13px] text-tinta hover:border-tinta-suave focus:border-primario focus:outline-none';

function SelectorFechas({ valor, onCambiar, etiqueta }: { valor: FormatoFecha; onCambiar: (f: FormatoFecha) => void; etiqueta: string }) {
  return (
    <select aria-label={etiqueta} value={valor} onChange={(e) => onCambiar(e.target.value as FormatoFecha)} className={CLASE_SELECT_CHICO}>
      {FECHAS.map((f) => <option key={f.valor} value={f.valor}>{f.nombre}</option>)}
    </select>
  );
}

function ColumnasNuevas({ tipo, columnas, propuestos, eje, marcadas, forma, ajustes, tipoDe, onEje, onMarcadas, onAjuste }: {
  tipo: 'grafico' | 'tabla';
  columnas: ColumnaArchivo[];
  propuestos: Map<number, TipoPropuesto>;
  eje: number | null;
  marcadas: number[];
  forma: FormaGrafico;
  ajustes: Record<number, Ajuste>;
  tipoDe: (indice: number, papel: 'eje' | 'serie' | 'columna') => { tipo: TipoColumna };
  onEje: (indice: number) => void;
  onMarcadas: (m: number[]) => void;
  onAjuste: (indice: number, a: Ajuste) => void;
}) {
  const grafico = tipo === 'grafico';
  const maximo = grafico ? SERIES_POR_FORMA[forma][1] : TOPES.columnas;
  const unaSola = maximo === 1;
  const candidatas = columnas.filter((c) => !grafico || c.indice !== eje);
  // Primero las marcadas en su orden; después las demás como vienen en el archivo.
  const orden = new Map(marcadas.map((i, k) => [i, k]));
  const ordenadas = [...candidatas].sort((a, b) => (orden.get(a.indice) ?? 1e6 + a.indice) - (orden.get(b.indice) ?? 1e6 + b.indice));
  const mover = (indice: number, paso: number) => {
    const k = marcadas.indexOf(indice);
    const nuevas = marcadas.slice();
    nuevas.splice(k, 1);
    nuevas.splice(k + paso, 0, indice);
    onMarcadas(nuevas);
  };
  const tiposPara = (papel: 'eje' | 'serie' | 'columna') => (papel === 'serie' ? TIPOS.filter((t) => t.valor !== 'texto') : TIPOS);

  const filaTipo = (c: ColumnaArchivo, papel: 'eje' | 'serie' | 'columna') => {
    const { tipo: t } = tipoDe(c.indice, papel);
    const fechas = propuestos.get(c.indice)?.fechas;
    return (
      <span className="flex shrink-0 gap-1">
        <select aria-label={`Tipo de ${c.encabezado}`} value={t} onChange={(e) => onAjuste(c.indice, { tipo: e.target.value as TipoColumna })} className={CLASE_SELECT_CHICO}>
          {tiposPara(papel).map((o) => <option key={o.valor} value={o.valor}>{o.nombre}</option>)}
        </select>
        {fechas && t === 'texto' && (
          <SelectorFechas etiqueta={`Fechas de ${c.encabezado}`} valor={ajustes[c.indice]?.fechas ?? fechas} onCambiar={(f) => onAjuste(c.indice, { fechas: f })} />
        )}
      </span>
    );
  };

  return (
    <section className="space-y-3">
      <Subtitulo>Columnas</Subtitulo>
      {!columnas.length && <p className="text-[14px] text-tinta-suave">No hay columnas en esa fila de encabezados.</p>}
      {grafico && columnas.length > 0 && (
        <div>
          <label htmlFor="excel-eje" className="mb-1 block text-sm font-semibold text-tinta">{forma === 'dispersion' ? 'Eje horizontal (numérico)' : 'Eje (categorías o fechas)'}</label>
          <div className="flex gap-1.5">
            <select id="excel-eje" value={eje ?? ''} onChange={(e) => onEje(Number(e.target.value))} className={`${CLASE_CAMPO} h-10 min-w-0 flex-1 py-0`}>
              {eje === null && <option value="">Elige una columna</option>}
              {columnas.map((c) => <option key={c.indice} value={c.indice}>{c.posicion} · {c.encabezado}</option>)}
            </select>
          </div>
          {eje !== null && <div className="mt-1.5 flex justify-end">{filaTipo(columnas.find((c) => c.indice === eje)!, 'eje')}</div>}
        </div>
      )}
      {columnas.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-semibold text-tinta">
            {grafico ? (unaSola ? 'Serie (una sola en este tipo)' : `Series (hasta ${maximo})`) : 'Columnas de la tabla'}
          </p>
          <ul className="divide-y divide-linea rounded-lg border border-linea">
            {ordenadas.map((c) => {
              const k = orden.get(c.indice);
              const marcada = k !== undefined;
              const papel = grafico ? 'serie' : 'columna';
              const propuesto = propuestos.get(c.indice)?.tipo ?? 'texto';
              return (
                <li key={c.indice} className="flex items-center gap-2 px-2.5 py-1.5">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-[14px] text-tinta">
                    <input
                      type={unaSola ? 'radio' : 'checkbox'}
                      name={unaSola ? 'excel-serie' : undefined}
                      checked={marcada}
                      disabled={!marcada && !unaSola && marcadas.length >= maximo}
                      onChange={(e) => {
                        if (unaSola) onMarcadas([c.indice]);
                        else onMarcadas(e.target.checked ? [...marcadas, c.indice] : marcadas.filter((i) => i !== c.indice));
                      }}
                      className="h-4 w-4 shrink-0 accent-primario"
                    />
                    <span className="min-w-0 truncate" title={c.encabezado}>
                      <span className="text-tinta-suave">{c.posicion} · </span>{c.encabezado}
                      {grafico && !marcada && propuesto === 'texto' && <span className="text-tinta-suave"> (texto)</span>}
                    </span>
                  </label>
                  {marcada && (
                    <>
                      {filaTipo(c, papel)}
                      {!unaSola && (
                        <span className="flex shrink-0">
                          <BotonIcono etiqueta={`Subir ${c.encabezado}`} onClick={() => mover(c.indice, -1)} inactivo={k === 0}><ArrowUp size={15} /></BotonIcono>
                          <BotonIcono etiqueta={`Bajar ${c.encabezado}`} onClick={() => mover(c.indice, 1)} inactivo={k === marcadas.length - 1}><ArrowDown size={15} /></BotonIcono>
                        </span>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function ColumnasConjunto({ columnas, archivo, propuestos, mapa, fechas, onMapa, onFechas }: {
  columnas: Columna[];
  archivo: ColumnaArchivo[];
  propuestos: Map<number, TipoPropuesto>;
  mapa: Record<string, number | null>;
  fechas: Record<string, FormatoFecha>;
  onMapa: (clave: string, indice: number | null) => void;
  onFechas: (clave: string, f: FormatoFecha) => void;
}) {
  return (
    <section className="space-y-3">
      <Subtitulo>De dónde sale cada columna</Subtitulo>
      <ul className="space-y-2.5">
        {columnas.map((c) => {
          const indice = mapa[c.clave] ?? null;
          const conFechas = c.tipo === 'texto' && indice !== null ? propuestos.get(indice)?.fechas : undefined;
          return (
            <li key={c.clave}>
              <label htmlFor={`excel-col-${c.clave}`} className="mb-1 flex items-baseline justify-between gap-2 text-sm font-semibold text-tinta">
                <span className="truncate">{c.nombre || c.clave}</span>
                <span className="shrink-0 text-[12px] font-normal text-tinta-suave">{TIPOS.find((t) => t.valor === c.tipo)?.nombre}</span>
              </label>
              <select
                id={`excel-col-${c.clave}`}
                value={indice ?? ''}
                onChange={(e) => onMapa(c.clave, e.target.value === '' ? null : Number(e.target.value))}
                className={`${CLASE_CAMPO} h-10 py-0 ${indice === null ? 'border-[#C4161C]/50 text-tinta-suave' : ''}`}
              >
                <option value="">— Dejar vacía —</option>
                {archivo.map((a) => <option key={a.indice} value={a.indice}>{a.posicion} · {a.encabezado}</option>)}
              </select>
              {conFechas && (
                <div className="mt-1.5 flex justify-end">
                  <SelectorFechas etiqueta={`Fechas de ${c.nombre}`} valor={fechas[c.clave] ?? conFechas} onCambiar={(f) => onFechas(c.clave, f)} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-[13px] leading-snug text-tinta-suave">Para cargar una columna que el conjunto no tiene, agrégala primero en "Editar datos" → "Columnas" con el mismo nombre que en el archivo.</p>
    </section>
  );
}

function VistaArchivo({ hoja, lectura, usadas, onEncabezados }: {
  hoja: ReturnType<typeof rejillaDe>;
  lectura: LecturaHoja;
  usadas: Set<number>;
  onEncabezados: (n: number) => void;
}) {
  // La vista muestra la hoja como en Excel (sin dar vuelta).
  const porFilas = lectura.orientacion === 'filas';
  const filas = hoja.slice(0, FILAS_A_LA_VISTA);
  const ancho = Math.min(COLUMNAS_A_LA_VISTA, Math.max(1, ...filas.map((f) => f.length)));
  const esEncabezado = (i: number, j: number) => (porFilas ? i + 1 === lectura.encabezados : j + 1 === lectura.encabezados);
  const esUsada = (i: number, j: number) => (porFilas ? usadas.has(j) && i + 1 > lectura.encabezados : usadas.has(i) && j + 1 > lectura.encabezados);

  return (
    <div className="p-4">
      <table className="border-separate border-spacing-0 text-[13px]">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-20 h-7 min-w-10 border-b border-r border-linea-fuerte bg-fondo-app" aria-label="Fila" />
            {Array.from({ length: ancho }, (_, j) => (
              <th
                key={j}
                scope="col"
                className={`sticky top-0 z-10 h-7 min-w-24 border-b border-r border-linea-fuerte px-2 font-semibold ${!porFilas && j + 1 === lectura.encabezados ? 'bg-primario text-white' : 'bg-fondo-app text-tinta-suave'}`}
              >
                {porFilas ? letraColumna(j) : (
                  <button type="button" className="w-full hover:underline" title="Usar esta columna como encabezados" onClick={() => onEncabezados(j + 1)}>{letraColumna(j)}</button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i}>
              <th scope="row" className={`sticky left-0 z-10 border-b border-r border-linea-fuerte px-1 text-right font-normal ${porFilas && i + 1 === lectura.encabezados ? 'bg-primario text-white' : 'bg-fondo-app text-tinta-suave'}`}>
                {porFilas ? (
                  <button type="button" className="w-full px-1 hover:underline" title="Usar esta fila como encabezados" onClick={() => onEncabezados(i + 1)}>{i + 1}</button>
                ) : i + 1}
              </th>
              {Array.from({ length: ancho }, (_, j) => {
                const celda = fila[j] ?? null;
                return (
                  <td
                    key={j}
                    className={`max-w-56 truncate border-b border-r border-linea px-2 py-1 ${celda?.t === 'n' ? 'text-right' : ''} ${esEncabezado(i, j) ? 'bg-tinte font-semibold text-tinta' : esUsada(i, j) ? 'bg-[#F4F8FD] text-tinta' : 'text-tinta-suave'}`}
                    title={celda ? textoCelda(celda) : undefined}
                  >
                    {textoCelda(celda)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {hoja.length > FILAS_A_LA_VISTA && <p className="mt-3 text-[13px] text-tinta-suave">Se ven las primeras {FILAS_A_LA_VISTA} filas de {hoja.length.toLocaleString('es-CO')}.</p>}
    </div>
  );
}

function VistaResultado({ presentacion, diapositiva, periodo, columnas, filas, problemas, motivo }: {
  presentacion: Presentacion;
  diapositiva?: string;
  periodo: IdPeriodo;
  columnas: Columna[];
  filas: ReturnType<typeof armarFilas>['filas'];
  problemas: Set<string>;
  motivo: string | null;
}) {
  const indice = presentacion.diapositivas.findIndex((d) => d.id === diapositiva);
  return (
    <div className="space-y-5 p-6">
      {indice >= 0 && !motivo && (
        <div>
          <p className="mb-2 text-sm font-semibold text-tinta">Así se verá la diapositiva {indice + 1} en {nombrePeriodo(periodo)}</p>
          <div className="relative aspect-video w-full max-w-[720px]">
            <Lienzo>
              <Diapositiva presentacion={presentacion} diapositiva={presentacion.diapositivas[indice]} periodo={periodo} numero={indice + 1} />
            </Lienzo>
          </div>
        </div>
      )}
      {motivo && <Aviso tipo="error">{motivo}</Aviso>}
      {columnas.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-tinta">{filas.length} {filas.length === 1 ? 'fila' : 'filas'}</p>
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-0 text-[14px]">
              <thead>
                <tr>
                  <th className="w-10 border-b border-linea-fuerte" aria-label="Fila" />
                  {columnas.map((c) => (
                    <th key={c.clave} scope="col" className={`border-b border-linea-fuerte px-3 pb-1.5 font-semibold text-tinta ${c.tipo === 'texto' ? 'text-left' : 'text-right'}`}>
                      <span className="block text-[12px] font-normal text-tinta-suave">{TIPOS.find((t) => t.valor === c.tipo)?.nombre}</span>
                      {c.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.slice(0, FILAS_A_LA_VISTA).map((f, i) => (
                  <tr key={i}>
                    <th scope="row" className="border-b border-linea pr-2 text-right text-[12px] font-normal text-tinta-suave">{i + 1}</th>
                    {columnas.map((c) => {
                      const mal = problemas.has(`${i}|${c.clave}`);
                      return (
                        <td
                          key={c.clave}
                          title={mal ? 'No se entendió como número: queda vacía' : undefined}
                          className={`whitespace-nowrap border-b border-linea px-3 py-1.5 ${c.tipo === 'texto' ? 'text-left' : 'text-right'} ${mal ? 'bg-[#FDECEC] text-[#8E1015]' : 'text-tinta'}`}
                        >
                          {mal ? 'sin dato' : formatear(f[c.clave], c)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filas.length > FILAS_A_LA_VISTA && <p className="mt-2 text-[13px] text-tinta-suave">Se ven las primeras {FILAS_A_LA_VISTA}.</p>}
        </div>
      )}
    </div>
  );
}
