'use client';

import { useState } from 'react';
import { valorDe } from '@/lib/datos';
import type { Operacion } from '@/lib/edicion/operaciones';
import { TOPES } from '@/lib/edicion/validar';
import { mesParaCopiar } from '@/lib/periodos';
import type { BloqueTexto, IdPeriodo, Presentacion } from '@/lib/tipos';
import { Campo, MesVacio, SelectorModo } from './piezas';

interface Props {
  presentacion: Presentacion;
  bloque: BloqueTexto;
  periodo: IdPeriodo;
  cambiar: (ops: Operacion | Operacion[]) => void;
}

export function EditorTexto({ presentacion, bloque, periodo, cambiar }: Props) {
  const dato = bloque.contenido;
  const valor = valorDe(dato, periodo);
  // "Empezar vacío" solo abre el cuadro; el texto se guarda al escribir.
  const [abierto, setAbierto] = useState(false);
  const poner = (texto: string | null, mes = periodo): Operacion => ({ op: 'texto.contenido', bloque: bloque.id, periodo: dato.porPeriodo ? mes : null, valor: texto });

  return (
    <div className="space-y-3">
      <SelectorModo
        porPeriodo={dato.porPeriodo}
        periodo={periodo}
        que="el texto"
        onCambiar={(porPeriodo) => cambiar({ op: 'porPeriodo', destino: { bloque: bloque.id }, valor: porPeriodo, periodo })}
      />
      {dato.porPeriodo && valor === undefined && !abierto ? (
        <MesVacio
          periodo={periodo}
          que="texto"
          origen={mesParaCopiar(presentacion.periodos, periodo, (m) => Boolean(dato.valores?.[m]?.trim()))}
          onCopiar={(origen) => cambiar(poner(dato.valores?.[origen] ?? ''))}
          onVacio={() => setAbierto(true)}
        />
      ) : (
        <Campo
          etiqueta="Texto"
          valor={valor ?? ''}
          multilinea
          filas={9}
          maximo={TOPES.texto}
          onCambiar={(texto) => cambiar(poner(texto))}
          nota={<>Una línea en blanco separa párrafos. Una línea que empieza con «- » es una viñeta. <code>{'{mes}'}</code> se reemplaza por el mes elegido.</>}
        />
      )}
    </div>
  );
}
