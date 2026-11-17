// Nombres de las plantillas de "Nueva presentación" (sin dependencias, para el
// navegador). Las presentaciones se arman en nueva.ts.
export const PLANTILLAS = { paraguay: 'Ejemplo: Paraguay (Ueno Bank)' } as const;
export type Plantilla = keyof typeof PLANTILLAS;
