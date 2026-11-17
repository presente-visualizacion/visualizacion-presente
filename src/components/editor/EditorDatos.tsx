'use client';

// Editor de datos: una cuadrícula para las filas de un conjunto de datos en el
// mes elegido. Admite pegar un rango copiado de Excel.
//
// Cómo se guarda: al salir de una celda, al pegar o al mover, agregar o quitar
// una fila, se envía una sola operación con todas las filas del conjunto en ese
// mes. Una celda con un número que no se entiende queda en rojo y no se guarda
// hasta corregirla; el resto sí.

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Columns3, Plus, Trash2, X } from 'lucide-react';
import { filasDe } from '@/lib/datos';
import type { Operacion } from '@/lib/edicion/operaciones';
import { esRangoPegado, leerTablaPegada } from '@/lib/edicion/pegado';
import { TOPES } from '@/lib/edicion/validar';
import { formatear, interpretarNumero, numeroEditable } from '@/lib/formato';
import { mesParaCopiar, nombrePeriodo } from '@/lib/periodos';
import type { Columna, Fila, IdPeriodo, Presentacion } from '@/lib/tipos';
import { EditorColumnas } from './EditorColumnas';
import { BotonIcono, CLASE_BOTON, CLASE_BOTON_PRINCIPAL, MesVacio, SelectorModo } from './piezas';

interface Props {
  presentacion: Presentacion;
  conjuntoId: string;
  periodo: IdPeriodo;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
  onCerrar: () => void;
}

const TIPOS: Record<Columna['tipo'], string> = { texto: 'Texto', numero: 'Número', porcentaje: 'Porcentaje', moneda: 'Moneda' };

const llave = (fila: number, clave: string) => `${fila}|${clave}`;

export function EditorDatos({ presentacion, conjuntoId, periodo, cambiar, onCerrar }: Props) {
  const conjunto = presentacion.datos[conjuntoId];
  const filas = filasDe(conjunto, periodo);
  const columnas = conjunto?.columnas ?? [];

  // Lo que se está escribiendo en una celda y todavía no se ha guardado, o lo
  // que quedó sin guardar porque no se entiende.
  const [borradores, setBorradores] = useState<Record<string, string>>({});
  const [foco, setFoco] = useState<string | null>(null);
  const [viendoColumnas, setViendoColumnas] = useState(false);
  const dialogo = useRef<HTMLDivElement>(null);
  const tabla = useRef<HTMLTableElement>(null);
  const enfocarAlDibujar = useRef<string | null>(null);

  // Al abrir, el foco entra a la ventana; al cerrar, vuelve a donde estaba.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    (tabla.current?.querySelector<HTMLElement>('[data-celda]') ?? dialogo.current)?.focus();
    return () => anterior?.focus?.();
  }, []);

  // Al cambiar de mes dentro del editor no se arrastran borradores.
  useEffect(() => setBorradores({}), [periodo, conjuntoId]);

  useEffect(() => {
    if (!enfocarAlDibujar.current) return;
    tabla.current?.querySelector<HTMLElement>(`[data-celda="${enfocarAlDibujar.current}"]`)?.focus();
    enfocarAlDibujar.current = null;
  });

  if (!conjunto) return null;

  const periodoOp = conjunto.porPeriodo ? periodo : null;
  const guardar = (nuevas: Fila[] | null) => cambiar({ op: 'datos.filas', conjunto: conjuntoId, periodo: periodoOp, valor: nuevas });
  const filaVacia = (): Fila => Object.fromEntries(columnas.map((c) => [c.clave, null]));
  const llenas = (filas?.length ?? 0) >= TOPES.filasPorMes;

  const esInvalido = (columna: Columna, texto: string) => columna.tipo !== 'texto' && Number.isNaN(interpretarNumero(texto));

  /** Lo que muestra la celda: el borrador si lo hay; si no, el valor guardado. */
  const textoDe = (fila: number, columna: Columna): string => {
    const k = llave(fila, columna.clave);
    if (k in borradores) return borradores[k];
    const valor = filas?.[fila]?.[columna.clave];
    if (valor === null || valor === undefined) return '';
    if (typeof valor !== 'number') return String(valor);
    // Con el foco se ve el número completo; sin él, con su formato.
    return foco === k ? numeroEditable(valor) : formatear(valor, columna);
  };

  const sinBorrador = (k: string) => setBorradores((b) => {
    const { [k]: _quitado, ...resto } = b;
    return resto;
  });

  /** Al salir de la celda: guarda lo escrito si se entiende. */
  const confirmar = (fila: number, columna: Columna) => {
    const k = llave(fila, columna.clave);
    if (!(k in borradores) || !filas) return;
    const texto = borradores[k];
    let nuevo: string | number | null;
    if (columna.tipo === 'texto') {
      nuevo = texto.trim() === '' ? null : texto.trim().slice(0, TOPES.celdaTexto);
    } else {
      nuevo = interpretarNumero(texto);
      if (Number.isNaN(nuevo)) return; // queda en rojo, sin guardar
    }
    sinBorrador(k);
    if (nuevo !== (filas[fila]?.[columna.clave] ?? null)) guardar(filas.map((f, i) => (i === fila ? { ...f, [columna.clave]: nuevo } : f)));
  };

  const alPegar = (e: React.ClipboardEvent, fila: number, indiceColumna: number) => {
    const texto = e.clipboardData.getData('text/plain');
    if (!filas || !esRangoPegado(texto)) return; // una sola celda: pegado normal
    e.preventDefault();
    const nuevas = filas.map((f) => ({ ...f }));
    const sinEntender: Record<string, string> = {};
    leerTablaPegada(texto).forEach((celdas, i) => {
      const destino = fila + i;
      if (destino >= TOPES.filasPorMes) return;
      while (nuevas.length <= destino) nuevas.push(filaVacia());
      celdas.forEach((celda, j) => {
        const columna = columnas[indiceColumna + j];
        if (!columna) return;
        if (columna.tipo === 'texto') {
          nuevas[destino][columna.clave] = celda.trim() === '' ? null : celda.trim().slice(0, TOPES.celdaTexto);
        } else {
          const numero = interpretarNumero(celda);
          if (Number.isNaN(numero)) sinEntender[llave(destino, columna.clave)] = celda.trim();
          else nuevas[destino][columna.clave] = numero;
        }
      });
    });
    setBorradores(sinEntender);
    guardar(nuevas);
  };

  const irA = (fila: number, indiceColumna: number) => {
    tabla.current?.querySelector<HTMLElement>(`[data-celda="${fila}|${indiceColumna}"]`)?.focus();
  };

  const alTeclear = (e: React.KeyboardEvent<HTMLInputElement>, fila: number, indiceColumna: number) => {
    const columna = columnas[indiceColumna];
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (fila + 1 < (filas?.length ?? 0)) irA(fila + 1, indiceColumna);
      else e.currentTarget.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (fila > 0) irA(fila - 1, indiceColumna);
    } else if (e.key === 'Escape' && llave(fila, columna.clave) in borradores) {
      // El primer Esc descarta lo escrito en la celda; el segundo cierra.
      e.stopPropagation();
      sinBorrador(llave(fila, columna.clave));
    }
  };

  const agregarFila = () => {
    if (!filas || llenas) return;
    enfocarAlDibujar.current = `${filas.length}|0`;
    guardar([...filas, filaVacia()]);
  };
  const quitarFila = (indice: number) => {
    if (!filas) return;
    setBorradores({});
    guardar(filas.filter((_, i) => i !== indice));
  };
  const moverFila = (indice: number, destino: number) => {
    if (!filas) return;
    const nuevas = filas.slice();
    nuevas.splice(destino, 0, ...nuevas.splice(indice, 1));
    setBorradores({});
    guardar(nuevas);
  };

  const pendientes = Object.entries(borradores).filter(([k, texto]) => {
    const columna = columnas.find((c) => c.clave === k.slice(k.indexOf('|') + 1));
    return k !== foco && columna && esInvalido(columna, texto);
  }).length;

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
        aria-labelledby="editor-datos-titulo"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onCerrar();
          }
        }}
        className="flex max-h-full w-full max-w-5xl flex-col rounded-2xl bg-white shadow-[0_24px_64px_-16px_rgba(36,26,32,0.45)] focus:outline-none"
      >
        <header className="flex shrink-0 items-start gap-4 border-b border-linea px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="editor-datos-titulo" className="sr-only">{conjunto.nombre}</h2>
            <input
              aria-label="Nombre de los datos"
              value={conjunto.nombre}
              maxLength={TOPES.titulo}
              onChange={(e) => cambiar({ op: 'datos.nombre', conjunto: conjuntoId, valor: e.target.value })}
              className="-ml-2 w-full truncate rounded-md border border-transparent px-2 py-0.5 text-xl font-bold tracking-tight text-tinta hover:border-linea-fuerte focus:border-primario focus:outline-none"
            />
            <p className="mt-0.5 text-sm text-tinta-suave">
              {conjunto.porPeriodo ? <>Datos de <strong className="text-tinta">{nombrePeriodo(periodo)}</strong></> : 'Estos datos son los mismos en todos los meses'}
            </p>
          </div>
          <div className="w-96 shrink-0">
            <SelectorModo
              porPeriodo={conjunto.porPeriodo}
              periodo={periodo}
              que="los datos"
              onCambiar={(porPeriodo) => {
                setBorradores({});
                cambiar({ op: 'porPeriodo', destino: { conjunto: conjuntoId }, valor: porPeriodo, periodo });
              }}
            />
          </div>
          <BotonIcono etiqueta="Cerrar" onClick={onCerrar}><X size={20} /></BotonIcono>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
          {viendoColumnas ? (
            <EditorColumnas presentacion={presentacion} conjunto={conjunto} cambiar={cambiar} />
          ) : !filas ? (
            <div className="mx-auto max-w-md py-8">
              <MesVacio
                periodo={periodo}
                que="datos"
                origen={mesParaCopiar(presentacion.periodos, periodo, (m) => Boolean(conjunto.filasPorPeriodo?.[m]?.length))}
                onCopiar={(origen) => guardar(conjunto.filasPorPeriodo?.[origen] ?? [])}
                onVacio={() => {
                  enfocarAlDibujar.current = '0|0';
                  guardar([filaVacia()]);
                }}
              />
            </div>
          ) : (
            <table ref={tabla} className="w-full border-separate border-spacing-0 text-[15px]">
              <thead>
                <tr>
                  <th scope="col" className="sticky top-0 z-10 w-10 border-b border-linea-fuerte bg-white" aria-label="Número de fila" />
                  {columnas.map((columna) => (
                    <th key={columna.clave} scope="col" className={`sticky top-0 z-10 border-b border-linea-fuerte bg-white px-1 pb-2 text-left align-bottom font-normal ${columna.tipo === 'texto' ? 'min-w-52' : 'min-w-32'}`}>
                      <span className="block px-2 text-[12px] text-tinta-suave">
                        {TIPOS[columna.tipo]}{columna.unidad ? ` · ${columna.unidad}` : ''}
                      </span>
                      <input
                        aria-label={`Nombre de la columna ${columna.nombre}`}
                        value={columna.nombre}
                        maxLength={TOPES.titulo}
                        onChange={(e) => cambiar({ op: 'datos.columna', conjunto: conjuntoId, clave: columna.clave, nombre: e.target.value })}
                        className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 font-semibold text-tinta hover:border-linea-fuerte focus:border-primario focus:outline-none"
                      />
                    </th>
                  ))}
                  <th scope="col" className="sticky top-0 z-10 w-28 border-b border-linea-fuerte bg-white" aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {filas.map((_, i) => (
                  <tr key={i} className="group">
                    <th scope="row" className="border-b border-linea pr-2 text-right text-[13px] font-normal text-tinta-suave">{i + 1}</th>
                    {columnas.map((columna, j) => {
                      const k = llave(i, columna.clave);
                      const invalida = k !== foco && k in borradores && esInvalido(columna, borradores[k]);
                      return (
                        <td key={columna.clave} className="border-b border-linea p-0.5">
                          <input
                            data-celda={`${i}|${j}`}
                            aria-label={`${columna.nombre}, fila ${i + 1}`}
                            aria-invalid={invalida || undefined}
                            title={invalida ? 'No se entiende como número. Ejemplos: 1.234,56 o 14,5%' : undefined}
                            inputMode={columna.tipo === 'texto' ? 'text' : 'decimal'}
                            value={textoDe(i, columna)}
                            onFocus={(e) => {
                              setFoco(k);
                              // Se selecciona después de redibujar: con el foco cambia el texto de la celda.
                              const celda = e.currentTarget;
                              requestAnimationFrame(() => document.activeElement === celda && celda.select());
                            }}
                            onBlur={() => {
                              setFoco((actual) => (actual === k ? null : actual));
                              confirmar(i, columna);
                            }}
                            onChange={(e) => setBorradores((b) => ({ ...b, [k]: e.target.value }))}
                            onKeyDown={(e) => alTeclear(e, i, j)}
                            onPaste={(e) => alPegar(e, i, j)}
                            className={`h-9 w-full rounded-md border px-2 focus:outline-none focus:ring-2 focus:ring-primario/25 ${columna.tipo === 'texto' ? 'text-left' : 'text-right'} ${
                              invalida
                                ? 'border-[#C4161C] bg-[#FDECEC] text-[#8E1015]'
                                : 'border-transparent bg-transparent hover:border-linea-fuerte focus:border-primario focus:bg-white'
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="border-b border-linea">
                      <div className="flex justify-end opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <BotonIcono etiqueta={`Subir la fila ${i + 1}`} onClick={() => moverFila(i, i - 1)} inactivo={i === 0}><ArrowUp size={16} /></BotonIcono>
                        <BotonIcono etiqueta={`Bajar la fila ${i + 1}`} onClick={() => moverFila(i, i + 1)} inactivo={i === filas.length - 1}><ArrowDown size={16} /></BotonIcono>
                        <BotonIcono etiqueta={`Quitar la fila ${i + 1}`} onClick={() => quitarFila(i)}><Trash2 size={16} /></BotonIcono>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-linea px-6 py-3">
          {filas && !viendoColumnas && (
            <button type="button" className={CLASE_BOTON} onClick={agregarFila} disabled={llenas}>
              <Plus size={16} aria-hidden /> Agregar fila
            </button>
          )}
          <button type="button" className={CLASE_BOTON} aria-pressed={viendoColumnas} onClick={() => { setBorradores({}); setViendoColumnas((v) => !v); }}>
            <Columns3 size={16} aria-hidden /> {viendoColumnas ? 'Volver a los datos' : 'Columnas'}
          </button>
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-tinta-suave" role={pendientes ? 'alert' : undefined}>
            {viendoColumnas ? null : pendientes ? (
              <strong className="text-[#8E1015]">
                {pendientes === 1 ? 'Hay 1 celda en rojo que no se guardó' : `Hay ${pendientes} celdas en rojo que no se guardaron`}: corrígelas o bórralas.
              </strong>
            ) : (
              <>Puedes pegar un rango copiado de Excel: se llena desde la celda elegida. Los decimales van con coma (14,5).</>
            )}
          </p>
          <button type="button" className={CLASE_BOTON_PRINCIPAL} onClick={onCerrar}>Listo</button>
        </footer>
      </div>
    </div>
  );
}
