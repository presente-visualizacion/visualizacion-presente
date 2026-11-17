'use client';

// Estado de edición de una presentación en el navegador: aplica cada cambio al
// instante, lo guarda solo en el servidor y permite deshacer y rehacer.
// El diseño está en "Guardado en el navegador" de PLAN.md.

import { useCallback, useEffect, useRef, useState } from 'react';
import { aplicar, aplicarVarias, claveDe, compactar, inversa, OperacionNoAplicable, type Operacion } from '@/lib/edicion/operaciones';
import type { Presentacion } from '@/lib/tipos';

export type EstadoGuardado = 'guardado' | 'pendiente' | 'guardando' | 'reintentando' | 'error';

export interface Edicion {
  /** La presentación con todos los cambios locales aplicados. */
  presentacion: Presentacion;
  /**
   * Aplica uno o varios cambios y los deja para guardar. Los cambios seguidos
   * con el mismo `grupo` (por defecto, el mismo destino) en menos de un
   * segundo cuentan como uno solo al deshacer.
   */
  cambiar(ops: Operacion | Operacion[], grupo?: string): void;
  deshacer(): void;
  rehacer(): void;
  puedeDeshacer: boolean;
  puedeRehacer: boolean;
  estado: EstadoGuardado;
  /** Explicación cuando un cambio no se pudo guardar. */
  error: string | null;
  /** Mensaje pasajero, por ejemplo al recibir cambios de otra persona. */
  aviso: string | null;
  descartarAviso(): void;
}

/** Espera sin cambios nuevos antes de guardar. */
const ESPERA_GUARDADO = 1500;
/** Esperas entre reintentos cuando falla la red o el servidor. */
const REINTENTOS = [2000, 5000, 15000, 30000];
/** Un envío lleva como mucho esto; lo demás va en el siguiente. */
const TOPE_OPERACIONES = 150;
const TOPE_BYTES = 180_000;
/** Los envíos al cerrar la pestaña (`keepalive`) no pueden pasar de 64 KB. */
const TOPE_AL_CERRAR = 60_000;
const TOPE_DESHACER = 200;
const SEGUNDO = 1000;

interface Entrada {
  ida: Operacion[];
  vuelta: Operacion[];
  grupo: string | null;
  momento: number;
}

function tomarLote(ops: Operacion[]): Operacion[] {
  const lote: Operacion[] = [];
  let bytes = 0;
  for (const op of ops) {
    const peso = JSON.stringify(op).length;
    if (lote.length && (lote.length >= TOPE_OPERACIONES || bytes + peso > TOPE_BYTES)) break;
    lote.push(op);
    bytes += peso;
  }
  return lote;
}

export function usarEdicion(inicial: Presentacion, revisionInicial: number): Edicion {
  const [presentacion, setPresentacion] = useState(inicial);
  const [estado, setEstado] = useState<EstadoGuardado>('guardado');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pilas, setPilas] = useState({ deshacer: 0, rehacer: 0 });

  // Lo que cambia sin tener que redibujar vive aquí.
  const r = useRef({
    presentacion: inicial,
    revision: revisionInicial,
    /** Cambios hechos que todavía no se han enviado. */
    pendientes: [] as Operacion[],
    /** Cambios enviados cuya respuesta no ha llegado. */
    enVuelo: null as Operacion[] | null,
    deshacer: [] as Entrada[],
    rehacer: [] as Entrada[],
    temporizador: null as ReturnType<typeof setTimeout> | null,
    intentos: 0,
    ultimaConsulta: 0,
  }).current;

  const url = `/api/presentaciones/${encodeURIComponent(inicial.id)}`;

  /** Trae la presentación del servidor y le aplica encima lo que falte por guardar. */
  const recargar = useCallback(async (mensaje: string | null) => {
    try {
      const respuesta = await fetch(url, { cache: 'no-store' });
      if (!respuesta.ok) return;
      const guardada = (await respuesta.json()) as { presentacion: Presentacion; revision: number };
      r.revision = guardada.revision;
      r.presentacion = aplicarVarias(guardada.presentacion, [...(r.enVuelo ?? []), ...r.pendientes]).presentacion;
      setPresentacion(r.presentacion);
      if (mensaje) setAviso(mensaje);
    } catch {
      // Sin red: se queda con lo que hay; el siguiente guardado lo resuelve.
    }
  }, [r, url]);

  const enviar = useCallback(async (alCerrar = false) => {
    if (r.enVuelo || !r.pendientes.length) return;
    if (r.temporizador) clearTimeout(r.temporizador);
    r.temporizador = null;

    const todas = compactar(r.pendientes);
    const lote = tomarLote(todas);
    r.pendientes = todas.slice(lote.length);
    r.enVuelo = lote;
    if (!r.intentos) setEstado('guardando');

    const programar = (espera: number) => {
      if (r.temporizador) clearTimeout(r.temporizador);
      r.temporizador = setTimeout(() => void enviar(), espera);
    };

    const cuerpo = JSON.stringify({ revisionBase: r.revision, operaciones: lote });
    let respuesta: Response | null = null;
    let resultado: { revision: number; ajenos: boolean; omitidas: number } | null = null;
    try {
      respuesta = await fetch(`${url}/cambios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: cuerpo,
        keepalive: alCerrar && cuerpo.length < TOPE_AL_CERRAR,
      });
      if (respuesta.ok) resultado = await respuesta.json();
    } catch {
      respuesta = null;
    }

    if (resultado) {
      r.revision = resultado.revision;
      r.enVuelo = null;
      r.intentos = 0;
      setError(null);
      if (resultado.ajenos || resultado.omitidas) await recargar(resultado.ajenos ? 'Se actualizó con cambios de otra persona.' : null);
      if (r.pendientes.length) {
        setEstado('pendiente');
        programar(0);
      } else {
        setEstado('guardado');
      }
      return;
    }

    // El servidor rechazó el cambio: reintentar no sirve. Se descarta y se
    // vuelve a lo que está guardado.
    if (respuesta && [400, 403, 404, 413, 415].includes(respuesta.status)) {
      const detalle = ((await respuesta.json().catch(() => null)) as { error?: string } | null)?.error ?? '';
      r.enVuelo = null;
      r.intentos = 0;
      setError(`No se pudo guardar el último cambio y se descartó. ${detalle}`.trim());
      await recargar(null);
      setEstado('error');
      if (r.pendientes.length) programar(ESPERA_GUARDADO);
      return;
    }

    // Sin red, servidor caído o choque con otra persona: no se pierde nada.
    r.pendientes = [...lote, ...r.pendientes];
    r.enVuelo = null;
    setEstado('reintentando');
    programar(REINTENTOS[Math.min(r.intentos++, REINTENTOS.length - 1)]);
  }, [r, url, recargar]);

  /** Deja la presentación nueva en pantalla y sus cambios en la cola de guardado. */
  const registrar = useCallback((nueva: Presentacion, ops: Operacion[]) => {
    r.presentacion = nueva;
    setPresentacion(nueva);
    setPilas({ deshacer: r.deshacer.length, rehacer: r.rehacer.length });
    r.pendientes.push(...ops);
    // Si se está reintentando, el reintento ya programado se lleva también esto.
    if (r.intentos) return;
    setEstado((actual) => (actual === 'guardando' ? actual : 'pendiente'));
    if (r.temporizador) clearTimeout(r.temporizador);
    r.temporizador = setTimeout(() => void enviar(), ESPERA_GUARDADO);
  }, [r, enviar]);

  const cambiar = useCallback((entrada: Operacion | Operacion[], grupo?: string) => {
    const ops = Array.isArray(entrada) ? entrada : [entrada];
    let nueva = r.presentacion;
    const ida: Operacion[] = [];
    let vuelta: Operacion[] = [];
    for (const op of ops) {
      try {
        const deshace = inversa(nueva, op);
        nueva = aplicar(nueva, op);
        ida.push(op);
        vuelta = [...deshace, ...vuelta];
      } catch (fallo) {
        if (!(fallo instanceof OperacionNoAplicable)) throw fallo;
      }
    }
    if (!ida.length) return;

    const clave = grupo ?? (ops.length === 1 ? claveDe(ops[0]) : null);
    const ultima = r.deshacer.at(-1);
    const ahora = Date.now();
    if (ultima && clave && ultima.grupo === clave && ahora - ultima.momento < SEGUNDO) {
      // Sigue escribiendo en el mismo campo: es el mismo paso de deshacer. La
      // vuelta sigue siendo la del primer cambio.
      ultima.ida.push(...ida);
      ultima.momento = ahora;
    } else {
      r.deshacer.push({ ida, vuelta, grupo: clave, momento: ahora });
      if (r.deshacer.length > TOPE_DESHACER) r.deshacer.shift();
    }
    r.rehacer = [];
    registrar(nueva, ida);
  }, [r, registrar]);

  const deshacer = useCallback(() => {
    const entrada = r.deshacer.pop();
    if (!entrada) return;
    entrada.momento = 0;
    r.rehacer.push(entrada);
    registrar(aplicarVarias(r.presentacion, entrada.vuelta).presentacion, entrada.vuelta);
  }, [r, registrar]);

  const rehacer = useCallback(() => {
    const entrada = r.rehacer.pop();
    if (!entrada) return;
    r.deshacer.push(entrada);
    registrar(aplicarVarias(r.presentacion, entrada.ida).presentacion, entrada.ida);
  }, [r, registrar]);

  useEffect(() => {
    const hayPendientes = () => r.pendientes.length > 0 || r.enVuelo !== null;

    const alCerrar = (e: BeforeUnloadEvent) => {
      if (hayPendientes()) e.preventDefault();
    };

    /** Al volver a la pestaña: si alguien más guardó, traer lo nuevo. */
    const consultar = async () => {
      if (hayPendientes() || Date.now() - r.ultimaConsulta < 5 * SEGUNDO) return;
      r.ultimaConsulta = Date.now();
      try {
        const respuesta = await fetch(`${url}?solo=revision`, { cache: 'no-store' });
        if (!respuesta.ok) return;
        const { revision } = (await respuesta.json()) as { revision: number };
        if (revision !== r.revision && !hayPendientes()) await recargar('Se actualizó con cambios de otra persona.');
      } catch {
        // Sin red: no pasa nada.
      }
    };

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'hidden') void enviar(true);
      else void consultar();
    };
    const alEnfocar = () => void consultar();
    const alVolverLaRed = () => {
      if (r.pendientes.length) void enviar();
    };

    window.addEventListener('beforeunload', alCerrar);
    window.addEventListener('focus', alEnfocar);
    window.addEventListener('online', alVolverLaRed);
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => {
      window.removeEventListener('beforeunload', alCerrar);
      window.removeEventListener('focus', alEnfocar);
      window.removeEventListener('online', alVolverLaRed);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      // Al salir hacia otra página del sitio, lo pendiente se envía ya.
      void enviar(true);
    };
  }, [r, url, enviar, recargar]);

  // El aviso pasajero se quita solo.
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5 * SEGUNDO);
    return () => clearTimeout(t);
  }, [aviso]);

  return {
    presentacion,
    cambiar,
    deshacer,
    rehacer,
    puedeDeshacer: pilas.deshacer > 0,
    puedeRehacer: pilas.rehacer > 0,
    estado,
    error,
    aviso,
    descartarAviso: useCallback(() => {
      setAviso(null);
      setError(null);
    }, []),
  };
}
