'use client';

// "Agregar bloque": elegir el tipo y, para gráficos y tablas, de dónde salen
// los datos (nuevos, desde un archivo de Excel o los de un conjunto que ya
// existe).

import { useState } from 'react';
import { ChartColumn, Hash, Plus, Table2, Type } from 'lucide-react';
import type { Operacion } from '@/lib/edicion/operaciones';
import { opsAgregarBloque, type TipoNuevo } from '@/lib/edicion/plantillas';
import { TOPES } from '@/lib/edicion/validar';
import type { Diapositiva, Presentacion } from '@/lib/tipos';
import { CLASE_BOTON, CLASE_BOTON_PRINCIPAL, CLASE_CAMPO } from './piezas';

const TIPOS: { tipo: TipoNuevo; nombre: string; icono: typeof Type }[] = [
  { tipo: 'grafico', nombre: 'Gráfico', icono: ChartColumn },
  { tipo: 'tabla', nombre: 'Tabla', icono: Table2 },
  { tipo: 'texto', nombre: 'Texto', icono: Type },
  { tipo: 'cifras', nombre: 'Cifras', icono: Hash },
];

interface Props {
  presentacion: Presentacion;
  diapositiva: Diapositiva;
  cambiar: (ops: Operacion | Operacion[], grupo?: string) => void;
  /** Se llama con el conjunto nuevo, para abrir el editor de datos. */
  onDatosNuevos: (conjunto: string) => void;
  /** Abre la ventana de Excel para crear el bloque desde un archivo. */
  onDesdeExcel: (tipo: 'grafico' | 'tabla') => void;
}

export function AgregarBloque({ presentacion, diapositiva, cambiar, onDatosNuevos, onDesdeExcel }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoNuevo | null>(null);
  const [datos, setDatos] = useState('excel');
  const lleno = diapositiva.bloques.length >= TOPES.bloquesPorDiapositiva;
  const conjuntos = Object.values(presentacion.datos).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const cerrar = () => {
    setAbierto(false);
    setTipo(null);
    setDatos('excel');
  };
  const agregar = (t: TipoNuevo, origen: string) => {
    if (origen === 'excel' && (t === 'grafico' || t === 'tabla')) {
      cerrar();
      onDesdeExcel(t);
      return;
    }
    const r = opsAgregarBloque(presentacion, diapositiva.id, t, origen);
    if (!r) return;
    cambiar(r.ops);
    cerrar();
    if (r.conjuntoNuevo) onDatosNuevos(r.conjuntoNuevo);
  };

  if (!abierto) {
    return (
      <button type="button" className={`${CLASE_BOTON} w-full`} onClick={() => setAbierto(true)} disabled={lleno} title={lleno ? `Una diapositiva tiene como mucho ${TOPES.bloquesPorDiapositiva} bloques` : undefined}>
        <Plus size={16} aria-hidden /> Agregar bloque
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-linea-fuerte p-3">
      <p className="text-sm font-semibold text-tinta">¿Qué quieres agregar?</p>
      <div className="grid grid-cols-4 gap-1.5">
        {TIPOS.map(({ tipo: t, nombre, icono: Icono }) => (
          <button
            key={t}
            type="button"
            aria-pressed={tipo === t}
            onClick={() => (t === 'texto' || t === 'cifras' ? agregar(t, 'nuevo') : setTipo(t))}
            className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[13px] ${tipo === t ? 'border-primario bg-tinte font-semibold text-tinta' : 'border-linea-fuerte text-tinta-suave hover:bg-fondo-app hover:text-tinta'}`}
          >
            <Icono size={20} aria-hidden /> {nombre}
          </button>
        ))}
      </div>
      {tipo && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-tinta" htmlFor="agregar-datos">Datos</label>
          <select id="agregar-datos" value={datos} onChange={(e) => setDatos(e.target.value)} className={`${CLASE_CAMPO} h-10 py-0`}>
            <option value="excel">Desde un archivo de Excel</option>
            <option value="nuevo">Datos nuevos (con un ejemplo para reemplazar)</option>
            {conjuntos.map((c) => <option key={c.id} value={c.id}>Usar los de: {c.nombre}</option>)}
          </select>
          <p className="text-[13px] leading-snug text-tinta-suave">
            {datos === 'excel'
              ? 'Se abre una ventana para elegir el archivo, la hoja y las columnas.'
              : datos === 'nuevo'
                ? 'Se abre el editor de datos para pegar los de verdad desde Excel.'
                : 'Los dos bloques mostrarán los mismos datos: lo que cambies en uno se ve en el otro.'}
          </p>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className={CLASE_BOTON} onClick={cerrar}>Cancelar</button>
        {tipo && <button type="button" className={CLASE_BOTON_PRINCIPAL} onClick={() => agregar(tipo, datos)}>Agregar</button>}
      </div>
    </div>
  );
}
