'use client';

// La diapositiva copiada vive en el navegador (localStorage), así se puede
// pegar en otra presentación o en otra pestaña. Ver portapapeles.ts.

import { useCallback, useEffect, useState } from 'react';
import { CLAVE_PORTAPAPELES, leerCopia, type CopiaDiapositiva } from '@/lib/edicion/portapapeles';

const AVISO = 'vp-portapapeles';

function leer(): CopiaDiapositiva | null {
  try {
    return leerCopia(JSON.parse(window.localStorage.getItem(CLAVE_PORTAPAPELES) ?? 'null'));
  } catch {
    return null;
  }
}

export function usarPortapapeles() {
  const [copia, setCopia] = useState<CopiaDiapositiva | null>(null);
  useEffect(() => {
    const actualizar = () => setCopia(leer());
    actualizar();
    window.addEventListener('storage', actualizar);
    window.addEventListener(AVISO, actualizar);
    return () => {
      window.removeEventListener('storage', actualizar);
      window.removeEventListener(AVISO, actualizar);
    };
  }, []);
  /** Guarda la copia; false si el navegador no deja (modo privado, sin espacio). */
  const guardar = useCallback((nueva: CopiaDiapositiva): boolean => {
    try {
      window.localStorage.setItem(CLAVE_PORTAPAPELES, JSON.stringify(nueva));
      window.dispatchEvent(new Event(AVISO));
      return true;
    } catch {
      return false;
    }
  }, []);
  return { copia, guardar };
}
