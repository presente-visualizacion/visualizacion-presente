# Visualización Presente: plan del proyecto

Este archivo es la memoria del proyecto. Cualquier persona o sesión de Claude que
retome el trabajo debe leerlo primero y actualizarlo al terminar cada etapa.

## Qué es

Una herramienta web para crear y presentar informes con datos por mes, sin
escribir código. Nace de la presentación del Comité de Precios de Presente
(Fondo de Empleados), que hoy es una página donde cada diapositiva está
programada a mano.

**El repositorio es público y solo tiene datos inventados.** La presentación
original y sus datos reales no están en él; ver "Datos reales" más abajo.

## Lo acordado con la usuaria

| Tema | Decisión |
|---|---|
| Dónde vive | En línea, con enlace para compartir. Repositorio `presente-visualizacion/visualizacion-presente`, publicación en Vercel en un proyecto nuevo, separado de la presentación original. |
| Quién edita | Por ahora cualquiera con el enlace, sin clave. Debe quedar preparado para agregar usuarios o clave después. |
| Presentaciones | Varias. Cada una con sus diapositivas y sus meses. |
| Meses | Una presentación contiene todos sus meses. Barra de meses siempre visible: al elegir un mes cambia toda la presentación. La presentación se hace cada mes con información de mes vencido. Botón "Nuevo mes" que copia el último mes. Opción de comparar con el mes anterior. |
| Excel | Se puede cargar cualquier Excel: se elige hoja, columna del eje y columnas de series, tipo de gráfico y mes. La herramienta recuerda esa configuración para el mes siguiente. |
| Diapositivas actuales | Las 25 se conservan, migradas al formato nuevo y editables, incluidas las tablas de propuesta de tasas, el análisis macro y Davivienda/DaviPlata. |
| Edición | Sin código: datos, títulos, textos, colores, tipo de gráfico, agregar, quitar, duplicar y reordenar diapositivas. |
| Interactividad | Cifras al pasar el mouse, series que se muestran u ocultan desde la leyenda, filtros. |
| Diseño | Fondo blanco, colores de Presente y afines, logo actual. |
| Presentar | Pantalla completa y descarga en PDF. |
| Seguridad de los datos | Historial de versiones para deshacer cambios y botón para descargar todo en Excel. |
| Nombre | Visualización Presente. |

Pendiente de decidir con la empresa (no bloquea el desarrollo):

- Plan de Vercel. Al ser público, el repositorio ya se puede desplegar con el
  plan gratuito (el gratuito no despliega repositorios privados de una
  organización). El plan gratuito es solo para uso personal; para uso de la
  empresa corresponde el plan Pro o alojarla en infraestructura propia.
- Pasar las cuentas de GitHub y Vercel a un correo corporativo compartido, con
  más de un administrador, para que la herramienta no dependa de una persona.

## Etapas

- [x] **Etapa 1. Base.** Estructura, modelo de datos, diseño, diapositivas y
  bloques genéricos, visor con barra de meses, navegación, pantalla completa y
  versión móvil. Presentación de muestra (hoy con datos inventados).
- [ ] **Etapa 2. Editor (2A y 2B, ver "Qué modelo usar").** Base de datos y guardado. Modo edición: agregar,
  quitar, duplicar y reordenar diapositivas; editar títulos y textos; cambiar
  tipo de gráfico, series y colores; editar datos en una tabla; tema de la
  presentación; "Nuevo mes".
- [ ] **Etapa 3. Excel.** Cargar cualquier archivo, elegir hoja y columnas,
  vista previa, asignar mes, recordar la configuración por conjunto de datos.
- [ ] **Etapa 4. Migración.** Las 25 diapositivas originales con todos sus
  meses. Bloques que falten para las diapositivas especiales.
- [ ] **Etapa 5. Cierre.** Crear y duplicar presentaciones, PDF, respaldo en
  Excel, historial de versiones, comparar con el mes anterior.

Al terminar cada etapa: compilar, revisar en navegador (escritorio y móvil),
revisar que no se cuelen datos reales, subir a GitHub y marcarla aquí.

## Datos reales: nunca en el repositorio

El repositorio es público. Desde el 2026-11-16 su historial se reescribió para
quitar los datos reales, que antes estaban en `referencia/`.

- **No subir nunca** cifras, textos o Excel reales del Comité, ni la
  presentación original. La carpeta `referencia/` está en `.gitignore`: se
  puede tener en la copia local para consultar, pero git no la sube.
- Los datos reales entran por la herramienta (cargar Excel, etapa 3, o el
  importador de la etapa 4) y viven en la base de datos, que es privada.
- La presentación de muestra (`src/datos/semilla/`) se genera con
  `npm run semilla` y es toda inventada: entidades ficticias ("Fondo Ejemplo"
  hace de entidad propia) y cifras aleatorias con semilla fija.
- Lo que se suba a `public/` queda a la vista de cualquiera.
- El respaldo de los datos reales es el archivo `referencia-datos-reales.zip`
  que guarda el equipo fuera de GitHub. Para trabajar con él en una sesión de
  Claude, adjuntarlo en la conversación y descomprimirlo en `referencia/`.

## Qué hay en el respaldo de datos reales

Rutas dentro de `referencia-datos-reales.zip` (o de `referencia/` en la copia
local).

- `referencia/InfoComite-2026-11-13.json` es la exportación completa de la
  presentación en línea (`/api/presentation/shared` del despliegue original,
  versión v2.1.3, actualizada el 2026-11-13). **Es la fuente más reciente**:
  llega hasta octubre de 2026. Los archivos de `referencia/presentacion-original/src/data`
  llegan solo hasta septiembre; usar el JSON, no esos.
- Forma: `{ id, data, createdAt, updatedAt, serverVersion }`. `data` tiene 130
  bloques con las mismas claves que `_indice.json` de la presentación original
  (por ejemplo `benchmarkingViviendaVisHasta20Octubre`).
- Cobertura por mes: enero a marzo tienen 16 bloques cada uno; abril a junio, 4;
  julio a octubre, 5. Los bloques sin sufijo de mes valen para todos los meses.
- Las series de tiempo (curva TES, tasas de referencia, saldo de cartera,
  pasivos, inflación contra REPO) ya incluyen octubre de 2026.
- El despliegue original guardaba los cambios en un servidor (por eso lo
  cargado a mano en la página sí estaba allí y no en los archivos del zip).

## Qué modelo usar en cada etapa

Para cuidar el uso del plan: empezar cada etapa en una conversación nueva y
decir "lee PLAN.md y haz la etapa N", porque una conversación larga gasta más en
cada mensaje.

- **Etapa 2A** (base de datos, guardado, editar datos, textos y títulos): la
  que más cuesta corregir si queda mal. Mejor con el modelo más capaz.
- **Etapa 2B** (agregar, quitar y reordenar diapositivas, tipo de gráfico,
  colores, "Nuevo mes"), **3, 4 y 5**: siguen el diseño ya hecho. Opus es
  suficiente.
- Al terminar cada etapa se sube a GitHub, así que si el uso se acaba a mitad,
  lo terminado no se pierde.

## Cómo está hecho

Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Recharts 3. Fuente
Figtree servida desde el propio sitio. El código y los nombres están en
español.

```
src/
  app/                    páginas: inicio (lista) y /p/[id] (visor)
  lib/
    tipos.ts              modelo de datos (leer primero)
    tema.ts               colores de Presente
    periodos.ts           meses: nombres, agrupación, {mes} en textos
    formato.ts            números en formato colombiano
    datos.ts              filas y valores del mes seleccionado
    almacen/              de dónde se leen y dónde se guardan las presentaciones
  components/
    visor/                Visor, BarraMeses, ListaDiapositivas, Lienzo
    diapositivas/         portada, contenido, cierre
    bloques/              gráfico, tabla, texto, cifras
  datos/semilla/          presentación de muestra (generada, no editar a mano)
scripts/crear-semilla.mjs genera la muestra con datos inventados
referencia/               (ignorada por git) copia local de los datos reales
```

### Modelo de datos

Una **presentación** tiene un tema, una lista de meses (`"AAAA-MM"`), una lista
de diapositivas y un diccionario de conjuntos de datos.

- La **estructura es compartida** entre meses: las diapositivas y sus bloques
  son los mismos en todos. Lo que cambia por mes son los datos y los textos.
- Un **conjunto de datos** tiene columnas con tipo (`texto`, `numero`,
  `porcentaje`, `moneda`) y filas. Si `porPeriodo` es verdadero guarda un juego
  de filas por mes; si no, las mismas filas valen para todos los meses.
- Los textos y las cifras usan `PorPeriodo<T>` con la misma idea.
- Una **diapositiva** es `portada`, `contenido` o `cierre`. Las de contenido
  tienen título, subtítulo, una disposición (`una`, `columnas`, `filas`,
  `principal-lateral`) y bloques.
- Un **bloque** es `grafico` (líneas, barras, barras horizontales, área;
  apilado, etiquetas, resaltar una entidad), `tabla`, `texto` o `cifras`.
- En títulos y textos, `{mes}` se reemplaza por el mes seleccionado.
- Si el mes elegido no tiene datos para un bloque, se muestra un aviso en vez
  del bloque.

Agregar un tipo de bloque nuevo: definirlo en `tipos.ts`, dibujarlo en
`components/bloques/` y sumarlo al `switch` de `VistaBloque`.

### Almacén

Las pantallas leen las presentaciones a través de `obtenerAlmacen()`. En la
etapa 1 solo existe el almacén de muestra, de solo lectura. La etapa 2 agrega
el de base de datos con `guardar`, sin cambiar las pantallas.

Propuesta para la etapa 2: Postgres desde la pestaña Storage de Vercel (hoy lo
ofrece con Neon; confirmar qué ofrece Vercel en ese momento). Una tabla de
presentaciones con el contenido en JSON y otra de versiones para el historial.
Mantener el almacén de muestra como respaldo cuando no haya base de datos
configurada, para poder desarrollar sin conexión.

### Diseño

- Fondo blanco. Tinta `#241A20`, texto secundario `#675C63`, líneas `#ECE7EA`.
- Magenta Presente `#D4145A`. Degradado del logo, de arriba abajo:
  `#AC004A`, `#D50058`, `#FF0065`, `#FF4769`, `#FF8E6E`. Se usa en el panel de
  la portada, la franja junto al título y la placa del logo.
- Series de los gráficos, en orden fijo: `#D4145A`, `#2274C4`, `#E36A0B`,
  `#0B9B7A`, `#8250D6`, `#A1790F`. El orden está validado para daltonismo y
  contraste sobre blanco; si se cambia, volver a validar.
- En los gráficos el texto va siempre en tinta, nunca en el color de la serie.
  Un solo eje de valores por gráfico (sin doble eje).
- `public/logo-presente-blanco.png` es el logo original con fondo
  transparente, para ponerlo sobre el degradado. `public/logo-presente.png` es
  el archivo original.

### Cosas que conviene saber

- **Lienzo fijo.** Cada diapositiva se dibuja a 1280 x 720 px y se escala al
  espacio disponible (`Lienzo`). Las medidas dentro de diapositivas y bloques
  son px del lienzo. Así se ve igual en el visor, en pantalla completa y en el
  PDF.
- **Ancho de los ejes.** Recharts mide el texto ya escalado y se queda corto,
  así que no usar `width="auto"` en los ejes: el ancho se calcula en
  `Grafico.tsx` con `anchoTexto`.
- **Gráficos bajo demanda.** Recharts se carga solo cuando una diapositiva
  tiene un gráfico. Hacer lo mismo con el lector de Excel y el generador de
  PDF.
- El enlace guarda la diapositiva y el mes (`?d=3&mes=2026-08`).
- Teclado en el visor: flechas, Inicio, Fin, `F` para presentar, `Esc` para
  salir.

## Cómo trabajar

```
npm install
npm run dev        # http://localhost:3000
npm run tipos      # revisar tipos
npm run build      # compilar como en producción
npm run semilla    # regenerar la presentación de muestra (datos inventados)
```

Para probar la versión compilada: `npm run build` y luego `npx next start`.
Antes de volver a compilar hay que detener el servidor anterior.

## Publicación en Vercel

1. En vercel.com, entrar con la cuenta de GitHub y elegir "Add New > Project".
2. Importar `presente-visualizacion/visualizacion-presente`. Vercel detecta
   Next.js; no hay que cambiar nada. Publicar.
3. Desde la etapa 2: en la pestaña Storage del proyecto, crear la base de
   datos y conectarla al proyecto.

Cada vez que se sube código a la rama `main`, Vercel publica solo.

## Notas para la migración (etapa 4)

- La migración se hace con los datos reales del respaldo, pero el resultado
  **no se sube**: el script de migración lee la carpeta que se le indique y
  escribe en la base de datos (o en un archivo dentro de `referencia/`, que
  está ignorada). En el repositorio solo queda el script.
- Datos originales: `referencia/presentacion-original/src/data/`. El archivo
  `_indice.json` dice qué archivo corresponde a cada bloque. Los archivos con
  sufijo de mes (`_enero` ... `_septiembre`) son de 2026.
- Orden y títulos originales: `slide_order.json` y `slide_titles.json`.
- Cómo se ve cada diapositiva original:
  `referencia/presentacion-original/src/components/presentation/`.
- `scripts/crear-semilla.mjs` arma cinco diapositivas en el formato nuevo (con
  datos inventados) y sirve de ejemplo de la forma que debe producir la
  migración.
- Varias diapositivas originales tienen filtro por plazo o por tipo (consumo
  hasta 1 año, de 1 a 3, etc.). Decidir si cada una pasa a ser una diapositiva
  o si se agrega un filtro dentro del bloque.
- Las tablas de propuesta de tasas y la diapositiva de Davivienda/DaviPlata
  necesitan revisar si alcanzan con `tabla` y `cifras` o si piden un bloque
  nuevo (por ejemplo, tabla con encabezados agrupados).
