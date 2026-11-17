// Lectura de lo que se pega desde Excel o Google Sheets: texto con las celdas
// separadas por tabulador y las filas por salto de línea. Las celdas que
// tienen saltos de línea o comillas llegan entre comillas dobles.

/** true si el texto pegado trae más de una celda. */
export function esRangoPegado(texto: string): boolean {
  return /[\t\n]/.test(texto.replace(/\r?\n$/, ''));
}

/** Convierte el texto pegado en filas de celdas. */
export function leerTablaPegada(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = '';
  let entreComillas = false;
  let inicioDeCelda = true;

  const t = texto.replace(/\r\n?/g, '\n');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (entreComillas) {
      if (c === '"' && t[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') {
        entreComillas = false;
      } else {
        celda += c;
      }
    } else if (c === '"' && inicioDeCelda) {
      entreComillas = true;
      inicioDeCelda = false;
    } else if (c === '\t') {
      fila.push(celda);
      celda = '';
      inicioDeCelda = true;
    } else if (c === '\n') {
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = '';
      inicioDeCelda = true;
    } else {
      celda += c;
      inicioDeCelda = false;
    }
  }
  if (celda !== '' || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas;
}
