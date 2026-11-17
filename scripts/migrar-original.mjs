// Convierte la exportación de la presentación original (InfoComite.json) al
// formato nuevo, sin pantalla. Sirve para probar con el respaldo de datos
// reales: el resultado va a `referencia/` (ignorada por git), nunca al
// repositorio. Ver "Diseño de la etapa 4" en PLAN.md.
//
//   node scripts/migrar-original.mjs referencia/InfoComite.json
//   node scripts/migrar-original.mjs referencia/InfoComite.json --crear        (además, la guarda en la base local)
//   node scripts/migrar-original.mjs referencia/InfoComite.json --reemplazar   (la guarda encima de la que haya)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createJiti } from 'jiti';

const [archivo, ...resto] = process.argv.slice(2);
if (!archivo) {
  console.error('Uso: node scripts/migrar-original.mjs <archivo.json> [--crear]');
  process.exit(1);
}

const jiti = createJiti(import.meta.url, { alias: { '@': new URL('../src', import.meta.url).pathname } });
const { migrarOriginal } = await jiti.import('../src/lib/migracion/original.ts');
const { validarPresentacion } = await jiti.import('../src/lib/edicion/validar.ts');

const { presentacion, avisos } = migrarOriginal(JSON.parse(readFileSync(archivo, 'utf8')));
const validacion = validarPresentacion(presentacion);
console.log(`${presentacion.diapositivas.length} diapositivas, ${presentacion.periodos.length} meses (${presentacion.periodos[0]} a ${presentacion.periodos.at(-1)}), ${Object.keys(presentacion.datos).length} conjuntos de datos.`);
for (const aviso of avisos) console.log(`Aviso: ${aviso}`);
if (!validacion.ok) {
  console.error('No es válida:\n' + validacion.errores.join('\n'));
  process.exit(1);
}

mkdirSync('referencia/salida', { recursive: true });
writeFileSync('referencia/salida/comite-de-precios.json', JSON.stringify(presentacion, null, 2));
console.log('Escrita en referencia/salida/comite-de-precios.json');

if (resto.includes('--crear') || resto.includes('--reemplazar')) {
  // Una sola conexión a la base local (no admite dos a la vez): detener
  // `npm run dev` antes de correr esto.
  const { motorPglite } = await jiti.import('../src/lib/almacen/motor.ts');
  const { almacenBd } = await jiti.import('../src/lib/almacen/bd.ts');
  const { presentacionMuestra } = await jiti.import('../src/lib/almacen/muestra.ts');
  const motor = await motorPglite('.datos-locales/pg');
  const almacen = almacenBd(async () => motor, { muestra: presentacionMuestra });
  await almacen.listar();
  if (resto.includes('--reemplazar')) await motor.consultar('delete from presentaciones where id = $1', [presentacion.id]);
  await almacen.crear(presentacion);
  console.log(`Creada en la base local: /p/${presentacion.id}`);
  // La base local queda abierta; se cierra al terminar.
  process.exit(0);
}
