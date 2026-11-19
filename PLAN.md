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
| Quién edita | Quien tenga la clave del sitio (variable `CLAVE_EDICION` en Vercel, puesta el 2026-11-17). Sin la clave no se ve ni se edita nada. |
| Presentaciones | Varias. Cada una con sus diapositivas y sus meses. |
| Meses | Una presentación contiene todos sus meses. Barra de meses siempre visible: al elegir un mes cambia toda la presentación. La presentación se hace cada mes con información de mes vencido. Botón "Nuevo mes" que copia el último mes. Opción de comparar con el mes anterior. |
| Excel | Se puede cargar cualquier Excel: se elige hoja, columna del eje y columnas de series, tipo de gráfico y mes. La herramienta recuerda esa configuración para el mes siguiente. |
| Diapositivas actuales | Las 25 se conservan, migradas al formato nuevo y editables, incluidas las tablas de propuesta de tasas, el análisis macro y Davivienda/DaviPlata. |
| Edición | Sin código: datos, títulos, textos, colores, tipo de gráfico, agregar, quitar, duplicar y reordenar diapositivas. |
| Tipos de gráfico | Líneas, barras, barras horizontales y área (etapa 1), más combinado barras + línea, circular (dona), dispersión, radar y cascada (pedidos el 2026-11-16, entran en la 2B). Un solo eje de valores en todos. |
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
- **Clave antes de cargar datos reales.** Con la edición abierta, cualquiera
  que tenga el enlace del sitio puede ver y cambiar lo que haya en la base de
  datos. Y el enlace no es secreto: el repositorio es público y GitHub suele
  mostrar el enlace del sitio en la página del repositorio (sección
  "Deployments"). Mientras solo haya datos inventados no importa. Antes de
  cargar los datos reales se puso una clave (2026-11-17, ver "Acceso" en el
  diseño de la 2A): el enlace solo muestra la pantalla de entrada.

## Etapas

- [x] **Etapa 1. Base.** Estructura, modelo de datos, diseño, diapositivas y
  bloques genéricos, visor con barra de meses, navegación, pantalla completa y
  versión móvil. Presentación de muestra (hoy con datos inventados).
- [x] **Etapa 2. Editor (2A y 2B, ver "Qué modelo usar").** Base de datos y guardado. Modo edición: agregar,
  quitar, duplicar y reordenar diapositivas; editar títulos y textos; cambiar
  tipo de gráfico, series y colores; editar datos en una tabla; tema de la
  presentación; "Nuevo mes".
  - [x] 2A. Base de datos, guardado y edición de datos, textos y títulos.
    Programada el 2026-11-16 (ver "Diseño de la etapa 2A"). **Falta un paso de
    la usuaria:** conectar la base en Vercel ("Lo que hace la usuaria en
    Vercel"). Hasta entonces el sitio publicado sigue en solo lectura.
  - [x] 2B. Agregar, quitar, duplicar y reordenar diapositivas y bloques;
    tipo de gráfico, series y colores; cinco tipos de gráfico nuevos
    (combinado, circular, dispersión, radar, cascada); columnas; tema;
    "Nuevo mes". Programada el 2026-11-16 (ver "Diseño de la etapa 2B").
- [x] **Etapa 3. Excel.** Cargar cualquier archivo, elegir hoja y columnas,
  vista previa, asignar mes, recordar la configuración por conjunto de datos.
  Programada el 2026-11-17 (ver "Diseño de la etapa 3").
- [x] **Etapa 4. Migración.** Las 25 diapositivas originales con todos sus
  meses. Bloques que falten para las diapositivas especiales. Programada el
  2026-11-17 (ver "Diseño de la etapa 4"). **Falta un paso de la usuaria:**
  importar la presentación en el sitio publicado ("Lo que hace la usuaria",
  en el diseño de la etapa 4).
- [x] **Ajustes antes de la etapa 5** (2026-11-17, ver "Ajustes del
  2026-11-17"): crear, duplicar, eliminar y recuperar presentaciones desde el
  inicio; rango del eje de valores en los gráficos; mover una diapositiva a
  cualquier posición.
- [x] **Bloques libres y copiar diapositivas** (2026-11-17, ver "Bloques
  libres, fondos y copiar diapositivas"): disposición libre, fondos de bloque,
  líneas de referencia, copiar y pegar diapositivas entre presentaciones,
  plantilla de Paraguay.
- [x] **Etapa 5. Cierre.** PDF, respaldo en Excel, historial de versiones,
  comparar con el mes anterior. Programada el 2026-11-17 (ver "Diseño de la
  etapa 5"). (Crear y duplicar presentaciones ya quedó hecho en los ajustes
  del 2026-11-17.)

- [x] **Mejoras después de la etapa 5** (2026-11-17, ver "Mejoras del
  2026-11-17 (después de la etapa 5)"): diapositivas quitadas que quedan
  guardadas, colores de texto, bloque y fondo, pasar diapositivas con la rueda
  o arrastrando al presentar, PDF descargado directo con hojas que crecen y
  detalle fijo en los gráficos.

- [x] **Cuadrícula fina** (2026-11-19, ver "Cuadrícula fina"): 48 x 32 en
  vez de 12 x 8, con paso automático de lo existente.
- [x] **Ajustes del 2026-11-18** (ver "Ajustes del 2026-11-18"): plantilla
  de la Ley de Rescate, papelera de presentaciones con "Deshacer", ocultar
  diapositivas al presentar, mover y agrandar bloques arrastrando, barra
  "Insertar", y tipos de letra (Figtree por defecto).

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
  que más cuesta corregir si queda mal. Ya está hecha.
- **Etapa 2B**: hecha.
- **Etapa 3**: hecha.
- **Etapa 4**: hecha.
- **Etapa 5**: sigue el diseño ya hecho. Opus es suficiente.
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
    excel/                lectura de Excel y CSV, interpretación, operaciones de carga
    migracion/            conversión de la presentación original (etapa 4)
    tablas.ts             lo que muestra una tabla: secciones, grupos, calculadas
    tema.ts               colores de Presente
    periodos.ts           meses: nombres, agrupación, {mes} en textos
    formato.ts            números en formato colombiano
    datos.ts              filas y valores del mes seleccionado
    acceso.ts, clave.ts   quién puede ver y editar (la clave del sitio)
  proxy.ts                pide la clave antes de cada página (src/proxy.ts)
    edicion/              operaciones de edición, validación, pegado de Excel,
                          plantillas (ids, bloques nuevos, duplicar)
    color.ts              contraste de colores (aviso en el tema)
    almacen/              de dónde se leen y dónde se guardan las presentaciones
  app/api/presentaciones/ rutas para leer y guardar
  components/
    visor/                Visor (con Comparar), BarraMeses, ListaDiapositivas,
                          Lienzo, MenuMas (PDF, Excel, copia, historial),
                          Impresion (página del PDF)
    historial/            pantalla del historial de versiones
    diapositivas/         portada, contenido, cierre
    bloques/              gráfico, tabla, texto, cifras, tarjetas (Grafico.tsx:
                          series; GraficosEspeciales.tsx: circular, dispersión, cascada)
    editor/               guardado en el navegador, panel (pestañas Diapositiva
                          y Presentación), editores de gráfico, tabla, datos y
                          columnas, ventana de carga desde Excel (CargarExcel)
  datos/semilla/          presentación de muestra (generada, no editar a mano)
pruebas/                  pruebas automáticas (npm run prueba)
scripts/crear-semilla.mjs genera la muestra con datos inventados
scripts/migrar-original.mjs prueba el importador con el respaldo (salida en referencia/)
referencia/               (ignorada por git) copia local de los datos reales
.datos-locales/           (ignorada por git) base de datos local de desarrollo
AGENTS.md                 lo escribe `next dev`: manda a leer la documentación
                          de Next que viene en node_modules antes de programar
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
  `principal-lateral`, `cuadricula`) y bloques.
- Un **bloque** es `grafico`, `tabla`, `texto`, `cifras` o `tarjetas`, y
  puede llevar un título arriba y una nota debajo. Las cifras pueden salir de
  los datos; las tablas pueden agrupar filas en secciones, agrupar columnas y
  calcular la variación contra el mes anterior y la posición (etapa 4). Un gráfico tiene
  una `forma`: `lineas`, `barras`, `barrasHorizontales`, `area`, `combinado`,
  `circular`, `dispersion`, `radar` o `cascada` (qué usa cada una está en
  "Diseño de la etapa 2B"); y opciones: apilado, etiquetas, resaltar una
  entidad.
- En títulos y textos, `{mes}` se reemplaza por el mes seleccionado.
- Si el mes elegido no tiene datos para un bloque, se muestra un aviso en vez
  del bloque.

Agregar un tipo de bloque nuevo: definirlo en `tipos.ts`, dibujarlo en
`components/bloques/` y sumarlo al `switch` de `VistaBloque`.

### Almacén

Las pantallas leen y guardan las presentaciones a través de
`obtenerAlmacen()`. Hay dos almacenes: el de base de datos (Postgres de Neon en
producción, PGlite en desarrollo y pruebas) y el de muestra, de solo lectura,
que se usa en producción mientras no haya base conectada. El diseño completo
está en "Diseño de la etapa 2A".

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

## Diseño de la etapa 2A: base de datos y guardado

Diseñada y programada el 2026-11-16. Esta sección describe lo que hay en el
código; si se cambia algo, se corrige aquí para que el plan y el código digan
lo mismo.

**Sin probar todavía:** la conexión con Neon de verdad. Desde el entorno de
Claude no se alcanza a Neon, así que todo se probó con PGlite (el mismo SQL)
y en navegador contra la base local. La primera prueba real es cuando la
usuaria conecte la base en Vercel; si el sitio muestra "No se pudo cargar",
revisar los registros del despliegue (pestaña Logs) antes de tocar el código.

### Qué entra y qué no

Entra en la 2A:

- Base de datos y guardado automático.
- Botón "Editar" en el visor, con un panel para cambiar: nombre de la
  presentación, título y subtítulo de cada diapositiva, textos, cifras y los
  datos de gráficos y tablas (con pegado directo desde Excel).
- Deshacer y rehacer dentro de la sesión.
- Copias automáticas para el historial (solo se guardan; la pantalla para
  verlas y restaurarlas es de la etapa 5).

No entra (para no mezclar etapas):

- 2B: agregar, quitar, duplicar y reordenar diapositivas y bloques; tipo de
  gráfico, series y colores; tema; "Nuevo mes"; agregar o quitar columnas.
- Etapa 3: cargar archivos de Excel.
- Etapa 5: pantalla del historial (hecha, ver "Diseño de la etapa 5"). (Crear, duplicar y eliminar presentaciones: hecho el 2026-11-17.)

### Decisiones

| Tema | Decisión | Por qué |
|---|---|---|
| Base de datos | Postgres de **Neon**, creado desde la pestaña Storage de Vercel (Marketplace), plan gratuito. | "Vercel Postgres" ya no existe: Vercel pasó esas bases a Neon en diciembre de 2024 y hoy se conectan por el Marketplace. Se crea y se conecta sin salir de Vercel. |
| Acceso a la base | Paquete `@neondatabase/serverless` (consultas por HTTP) y SQL escrito a mano. Sin ORM. | Son dos tablas y cuatro consultas. Por HTTP no hay conexiones abiertas que administrar en Vercel. |
| Forma de guardar | Una fila por presentación con todo su contenido en una columna `jsonb`. | El modelo de `tipos.ts` ya es un documento. Partirlo en tablas obligaría a reescribir el visor. |
| Qué viaja al guardar | **Operaciones pequeñas** ("cambia este título", "estas son las filas de octubre de este conjunto"), no la presentación entera. | Si dos personas editan a la vez, o alguien edita desde una pestaña vieja, solo se pisa lo que cada uno tocó de verdad. Además el envío pesa poco. |
| Dos personas a la vez | Número de revisión por presentación. El servidor aplica las operaciones sobre la versión más reciente y reintenta si alguien guardó en ese instante. Gana el último cambio **de cada campo**. | Sin bloqueos ni "alguien más está editando". No hay edición en vivo (no se ve el cursor del otro); al guardar se recibe lo que cambió la otra persona. |
| Por dónde se guarda | Rutas de API (`/api/presentaciones/...`), no Server Actions. | Se pueden llamar al cerrar la pestaña (`keepalive`) y probar por separado. |
| Validación | En el servidor, con `zod`: cada operación y la presentación resultante. | La edición está abierta: el servidor no puede confiar en lo que llega. El mismo validador sirve luego para Excel (etapa 3) y la migración (etapa 4). |
| Desarrollo sin conexión | El mismo SQL corre sobre **PGlite** (Postgres dentro de Node) cuando no hay base configurada. | Las sesiones de Claude no alcanzan a Neon desde su entorno. Así el SQL real se prueba antes de publicar. |
| Tablas | Se crean solas al primer uso. | La usuaria no programa: basta conectar la base en Vercel y volver a publicar. |
| Historial | Copia automática del estado anterior al empezar cada tanda de cambios. | Deja puntos de restauración desde el primer día, aunque la pantalla llegue en la etapa 5. |

Límites del plan gratuito de Neon (revisados el 2026-11-16; confirmarlos al
crear la base porque cambian): 100 horas de cómputo al mes por proyecto,
almacenamiento entre 0,5 y 1 GB según la página que se consulte, y la base se
duerme tras 5 minutos sin uso (la primera consulta después tarda unas décimas
de segundo más). El diseño se hizo para caber en 0,5 GB. Si se llena, Neon
rechaza las escrituras pero no borra ni cobra.

### Tablas

```sql
create table if not exists presentaciones (
  id          text primary key,              -- va en el enlace: /p/[id]
  contenido   jsonb not null,                -- la Presentacion (formato 1)
  revision    integer not null default 1,    -- sube en 1 con cada guardado
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  eliminado   timestamptz                    -- borrado suave (etapa 5)
);

create table if not exists versiones (
  id           bigint generated always as identity primary key,
  presentacion text not null references presentaciones(id) on delete cascade,
  revision     integer not null,             -- revisión que tenía esa copia
  contenido    jsonb not null,
  motivo       text not null,                -- 'auto' | 'manual' | 'restauracion' | 'importacion'
  autor        text,                         -- vacío hasta que haya usuarios
  creado       timestamptz not null default now(),
  nota         text                          -- etapa 5: nombre de la copia (manual) o
                                             -- "Antes de volver a la copia del ..." (restauracion)
);

create index if not exists versiones_por_presentacion
  on versiones (presentacion, creado desc);
```

- Las columnas `id`, `revision` y `actualizado` mandan sobre lo que diga el
  JSON: al leer, el almacén pone `id` y `actualizado` de la fila dentro de la
  `Presentacion`. Nombre y descripción viven solo en el JSON, para no tener el
  mismo dato en dos sitios.
- La lista del inicio no trae el contenido completo: saca lo necesario con
  `contenido->>'nombre'`, `contenido->'periodos'` y
  `jsonb_array_length(contenido->'diapositivas')`.
- `jsonb` no conserva el orden de las claves de un objeto. Hoy no importa (todo
  lo que tiene orden está en listas: `periodos`, `diapositivas`, `columnas`,
  `filas`). Regla: **nunca depender del orden de las claves de `datos`** ni de
  las de una fila; el orden de columnas lo da `columnas`.
- Cambios futuros de tablas: agregar sentencias que se puedan repetir sin daño
  (`create table if not exists`, `alter table ... add column if not exists`).

Guardado en una sola sentencia (probada en PGlite el 2026-11-16): actualiza
solo si la revisión no cambió y, si corresponde, deja la copia del estado
anterior. Si no devuelve filas, alguien guardó antes.

```sql
with anterior as (
  select revision, contenido from presentaciones
  where id = $1 and revision = $2
),
cambio as (
  update presentaciones
  set contenido = $3::jsonb, revision = revision + 1, actualizado = now()
  where id = $1 and revision = $2 and eliminado is null
  returning revision, actualizado
),
copia as (
  insert into versiones (presentacion, revision, contenido, motivo)
  select $1, a.revision, a.contenido, 'auto' from anterior a, cambio
  where $4::boolean
  returning id
)
select revision, actualizado from cambio;
```

### Copias para el historial

- Antes de guardar, el servidor mira cuándo fue la última copia de esa
  presentación. Si no hay ninguna o tiene más de 10 minutos, guarda el estado
  anterior como copia `auto` (`$4 = true`). Así cada tanda de edición deja un
  punto al que volver, sin llenar la base con una copia por tecla.
- Tope: 150 copias por presentación. Al pasar el tope se borran las `auto` más
  antiguas; las `manual` no se borran solas.
- Cuentas: una presentación de 25 diapositivas con todos sus meses pesará
  alrededor de 0,5 MB. 150 copias son unos 75 MB sin comprimir (Postgres
  comprime el JSON grande), holgado dentro de 0,5 GB para varias
  presentaciones. Revisar el uso real en la etapa 5.
- La restauración "a un punto en el tiempo" de Neon en el plan gratuito cubre
  solo unas horas: no cuenta como respaldo. El respaldo es este historial y,
  desde la 2A, el enlace "Descargar copia" (ver "Rutas").

### Operaciones de edición

Archivo nuevo `src/lib/edicion/operaciones.ts`, sin nada de React ni de base de
datos, usado igual por el navegador y por el servidor:

```ts
export type Operacion =
  | { op: 'presentacion.nombre'; valor: string }
  | { op: 'presentacion.descripcion'; valor: string }          // '' la quita
  | { op: 'diapositiva.titulo'; diapositiva: string; valor: string }
  | { op: 'diapositiva.subtitulo'; diapositiva: string; valor: string }
  | { op: 'texto.contenido'; bloque: string; periodo: IdPeriodo | null; valor: string | null }
  | { op: 'cifras.valor'; bloque: string; periodo: IdPeriodo | null; valor: Cifra[] | null }
  | { op: 'datos.filas'; conjunto: string; periodo: IdPeriodo | null; valor: Fila[] | null }
  | { op: 'datos.columna'; conjunto: string; clave: string; nombre?: string; decimales?: number; unidad?: string }
  | { op: 'porPeriodo'; destino: { bloque: string } | { conjunto: string }; valor: boolean; periodo: IdPeriodo };

/** Devuelve una presentación nueva; no modifica la recibida. */
export function aplicar(p: Presentacion, op: Operacion): Presentacion;
/** Operaciones que deshacen `op`, calculadas ANTES de aplicarla. */
export function inversa(p: Presentacion, op: Operacion): Operacion[];
/** Junta operaciones seguidas sobre el mismo destino: queda la última. */
export function compactar(ops: Operacion[]): Operacion[];
```

Reglas que no se pueden romper (también valen para las operaciones que agregue
la 2B):

1. **Todas son del tipo "dejar este valor"**, nunca "sumar" o "insertar en la
   posición 3". Aplicar dos veces la misma operación da el mismo resultado, así
   que reenviar un guardado que quedó en duda no hace daño.
2. **Los destinos se nombran por `id`** (diapositiva, bloque, conjunto), nunca
   por posición. Los `id` de bloque son únicos en toda la presentación (ya lo
   son en la muestra; el validador lo exige).
3. **Lo más fino que se guarda es "las filas de un conjunto en un mes"** (o el
   texto de un bloque en un mes). Las filas no tienen `id`, así que no hay
   operaciones por celda.
4. `periodo: null` es el valor único (cuando `porPeriodo` es falso);
   `periodo: "AAAA-MM"` es el valor de ese mes (cuando es verdadero). Si no
   coincide con el `porPeriodo` actual, la operación se salta igual que en la
   regla 7 (pasa cuando otra persona cambió el interruptor entre tanto).
5. `valor: null` borra el valor de ese mes (hace falta para deshacer "empecé a
   llenar un mes que estaba vacío").
6. `porPeriodo` a verdadero copia el valor único a todos los meses de la
   presentación; a falso deja como único el valor de `periodo` y descarta los
   demás (la pantalla pide confirmación). Su `inversa` son varias operaciones.
7. Si el destino ya no existe (en la 2B alguien pudo borrar la diapositiva), la
   operación se salta y el servidor lo informa; el resto del envío se guarda.
8. Agregar un tipo de operación: sumarlo al tipo, a `aplicar`, a `inversa`, al
   validador y a las pruebas.

### Validación

Archivo nuevo `src/lib/edicion/validar.ts`.

- Esquemas `zod` de `Presentacion` y de `Operacion`. Se atan a `tipos.ts` con
  `satisfies z.ZodType<Presentacion>` para que el compilador avise si un día
  dejan de coincidir. `tipos.ts` sigue siendo el archivo que se lee primero.
- `revisarReferencias(presentacion)`: `id` únicos; cada bloque apunta a un
  conjunto y a columnas que existen; los meses usados como clave están en
  `periodos`; en columnas numéricas (`numero`, `porcentaje`, `moneda`) cada
  celda es un número finito o `null`, y en las de `texto`, texto o `null`.
- Topes, para que nadie infle la base por error o a propósito: nombre 120
  caracteres; título y subtítulo 200; texto 5.000; 8 cifras por bloque; 500
  filas por conjunto y mes; 200 caracteres por celda de texto; presentación
  completa 3 MB; envío de guardado 256 KB y 200 operaciones.
- Los mensajes de error van en español y dicen qué campo falló.

### Almacén de base de datos

`src/lib/almacen/index.ts` crece así:

```ts
export interface Guardada { presentacion: Presentacion; revision: number }

export type ResultadoGuardado =
  | { ok: true; revision: number; actualizado: string; ajenos: boolean; omitidas: number }
  | { ok: false; motivo: 'no-existe' | 'invalido' | 'ocupado'; detalle?: string };

export interface Almacen {
  /** true en el almacén de muestra: el visor esconde "Editar". */
  soloLectura: boolean;
  listar(): Promise<ResumenPresentacion[]>;
  obtener(id: string): Promise<Guardada | null>;
  /** Solo el número de revisión, para saber si hay cambios sin traer todo. */
  revision(id: string): Promise<number | null>;
  aplicar(id: string, revisionBase: number, ops: Operacion[]): Promise<ResultadoGuardado>;
  /** Para importar presentaciones completas (etapas 3 a 5). */
  crear(presentacion: Presentacion): Promise<void>;
}

/** Devuelve una promesa: `(await obtenerAlmacen()).listar()`. */
export function obtenerAlmacen(): Promise<Almacen>;
```

`aplicar` en el almacén de base de datos:

1. Lee `contenido`, `revision` y la fecha de la última copia.
2. Aplica las operaciones en orden con `aplicar()` (saltando las de destino
   inexistente) y valida el resultado. Si no es válido: `invalido`, no guarda.
3. Ejecuta la sentencia de guardado con la revisión leída.
4. Si no devolvió filas, alguien guardó entre el paso 1 y el 3: vuelve al paso
   1, hasta 3 intentos; después responde `ocupado`.
5. `ajenos` es verdadero si la revisión leída en el paso 1 era distinta de
   `revisionBase`: el navegador tiene que traer la presentación de nuevo.
6. De vez en cuando (al crear una copia) borra las copias que pasen del tope.

Motor de base de datos, en `src/lib/almacen/motor.ts`:

```ts
export interface Motor { consultar<T>(texto: string, valores?: unknown[]): Promise<T[]> }
```

- `motorNeon`: `neon(process.env.DATABASE_URL)` y `sql.query(texto, valores)`
  (confirmar la forma exacta en la documentación de la versión que se instale;
  al diseñar era la 1.2). El JSON se pasa como texto con `$n::jsonb`.
- `motorLocal`: PGlite guardando en `.datos-locales/`. Una sola instancia
  colgada de `globalThis` para que sobreviva a las recargas de `next dev`. Se
  carga con `import()` solo cuando hace falta y nunca en producción. En
  `next.config.ts` está en `serverExternalPackages` y excluida de lo que se
  publica (`outputFileTracingExcludes`): pesa 27 MB y allá no se usa.

Cuál almacén se usa (`obtenerAlmacen()`):

| Situación | Almacén |
|---|---|
| Hay `DATABASE_URL` (o `POSTGRES_URL`) | Base de datos con Neon. |
| No hay, y es desarrollo o pruebas | Base de datos con PGlite local. |
| No hay, y es producción | Muestra, solo lectura (como hoy). El sitio sigue funcionando antes de conectar la base. |

`asegurarEsquema()` corre una vez por arranque del servidor: ejecuta los
`create ... if not exists` de `src/lib/almacen/esquema.ts` y, si la tabla
`presentaciones` no tiene ninguna fila (ni siquiera eliminada), inserta la
presentación de muestra inventada para que el sitio no quede vacío.

PGlite funciona bien dentro de `next dev` (comprobado). Para empezar de cero
en local, detener el servidor y borrar la carpeta `.datos-locales/`.

### Rutas

| Ruta | Qué hace |
|---|---|
| `GET /api/presentaciones/[id]` | `{ presentacion, revision }`. Con `?solo=revision` devuelve solo el número. Con `?descargar=1` lo entrega como archivo `.json` (el enlace "Descargar copia"). |
| `POST /api/presentaciones/[id]/cambios` | Recibe `{ revisionBase, operaciones }`. Responde 200 con el `ResultadoGuardado`; 400 si no es válido; 403 sin permiso; 404 si no existe; 409 si quedó `ocupado`; 413 si pasa el tope de tamaño. |

- Las dos con `runtime = 'nodejs'` y sin caché. La de guardado exige
  `Content-Type: application/json` (415 si no).
- `src/app/error.tsx`: página de "No se pudo cargar" con botón "Reintentar",
  por si la base no responde. En esta versión de Next el botón usa `retry`.
- Páginas: `/` deja de generarse al compilar (`export const dynamic =
  'force-dynamic'`), porque la lista ahora sale de la base. `/p/[id]` ya es
  dinámica; envolver `obtener` con `cache()` de React para que
  `generateMetadata` y la página no consulten dos veces.
- Agregar `robots: { index: false, follow: false }` a los metadatos del
  `layout`, para que los buscadores no listen el sitio.

### Acceso

**Clave puesta el 2026-11-17.** Cómo funciona:

- La clave vive solo en la variable `CLAVE_EDICION` de Vercel (Settings →
  Environment Variables). Nunca en el repositorio ni en el chat.
- `src/proxy.ts` corre antes de cada página y ruta. Sin una cookie válida,
  las páginas van a `/entrar?desde=...` y la API responde 401. Pasan sin
  clave: `/entrar`, `/api/entrar`, `/api/salir`, `/_next/`, el ícono y los
  logos.
- `/entrar` pide la clave; el formulario va a `POST /api/entrar`. Si es
  correcta, pone la cookie `vp_acceso` (httpOnly, secure, 30 días) y vuelve a
  la página de origen (solo rutas del mismo sitio). Si no, espera 1 segundo y
  muestra el aviso.
- La cookie no guarda la clave sino una ficha HMAC-SHA256 de ella
  (`src/lib/clave.ts`). Cambiar la clave en Vercel (y volver a publicar)
  cierra la sesión de todos.
- `puedeEditar()` en `src/lib/acceso.ts` revisa la misma cookie: segunda
  barrera para la ruta de guardado y el botón "Editar".
- "Salir" en el inicio borra la cookie.
- Sin `CLAVE_EDICION` (desarrollo local, pruebas) el sitio queda abierto.
- Es una clave compartida, no usuarios: no se sabe quién cambió qué. Si más
  adelante hace falta, se cambia `clave.ts` por usuarios sin tocar lo demás.

### Guardado en el navegador

Hook nuevo `src/components/editor/usarEdicion.ts`. Recibe la presentación y la
revisión que cargó la página y entrega `{ presentacion, cambiar(op), deshacer,
rehacer, estado }`. El `Visor` pasa a dibujar la `presentacion` del hook.

- `cambiar(op)` aplica la operación al instante en pantalla y la deja en una
  cola de pendientes.
- A los 1,5 segundos sin cambios nuevos se envía la cola (compactada). Un solo
  envío a la vez; lo que llegue mientras tanto espera el siguiente.
- Respuesta correcta: se actualiza la revisión. Si `ajenos` es verdadero, se
  pide la presentación completa y se le aplican encima los pendientes.
- Fallo de red, 409 o error del servidor: no se pierde nada; reintenta a los
  2, 5, 15 y 30 segundos y sigue cada 30, y de inmediato cuando vuelve la red.
  Un 400, 403, 404 o 413 no se reintenta: ese cambio se descarta, la pantalla
  vuelve a lo que está guardado y un aviso explica qué pasó.
- Un envío lleva como mucho 150 operaciones o 180 KB; lo demás va en el
  siguiente.
- Al salir hacia otra página del sitio, lo pendiente se envía en ese momento.
- Indicador junto al botón: "Guardado", "Guardando…", "Sin conexión:
  reintentando" o "No se pudo guardar".
- Con cambios pendientes: aviso del navegador al intentar cerrar
  (`beforeunload`) y envío inmediato con `keepalive` cuando la pestaña se
  oculta (`visibilitychange`).
- Al volver a la pestaña sin pendientes, consulta `?solo=revision`; si cambió,
  recarga la presentación. Evita editar sobre una copia vieja.
- Deshacer y rehacer (Ctrl+Z, Ctrl+Y o Ctrl+Mayús+Z, y botones): cada entrada
  guarda las operaciones inversas. Las teclas seguidas sobre el mismo campo en
  menos de un segundo cuentan como una sola entrada. Deshacer es un cambio
  más: pasa por `cambiar` y se guarda igual. El historial de deshacer vive
  solo mientras la pestaña esté abierta.

### Pantalla de edición

Solo en escritorio (desde 1024 px de ancho); en celular el botón "Editar" no
aparece y el visor queda como hoy. En modo presentación no hay edición.

- Botón "Editar" en el encabezado del visor, al lado de "Presentar". Al
  activarlo aparece un **panel a la derecha** (unos 380 px) y la diapositiva
  se achica para dejarle sitio. Se edita en el panel y se ve el resultado al
  instante en la diapositiva. No se edita escribiendo sobre la diapositiva: el
  lienzo está escalado y eso es frágil.
- Arriba del panel, siempre visible: "Editando: Octubre 2026" (el mes de la
  barra) y el indicador de guardado.
- El nombre de la presentación se edita en el encabezado.
- Sección "Diapositiva": título y subtítulo, con la nota de que `{mes}` se
  reemplaza por el mes elegido.
- Una tarjeta por bloque de la diapositiva:
  - **Texto**: un cuadro de texto. Nota: línea en blanco separa párrafos; "- "
    al inicio hace una viñeta.
  - **Cifras**: una fila por cifra con etiqueta, valor y detalle; agregar,
    quitar y mover.
  - **Gráfico y tabla**: nombre del conjunto de datos y botón "Editar datos".
- Cada tarjeta dice si el contenido es **"igual en todos los meses"** o
  **"propio de cada mes"**, con un interruptor para cambiarlo (operación
  `porPeriodo`; pasar a "igual en todos" pide confirmación porque descarta los
  otros meses).
- Si es propio de cada mes y el mes elegido está vacío: botones "Copiar del
  mes anterior" y "Empezar vacío".
- **Editor de datos**: ventana ancha sobre el visor con una cuadrícula.
  - Encabezados: nombre de la columna, editable (`datos.columna`).
  - Celdas editables; Tab pasa a la celda siguiente, Enter y las flechas
    arriba y abajo cambian de fila; agregar fila, quitar fila, mover fila.
    Esc descarta lo escrito en la celda; otro Esc cierra la ventana.
  - Con el foco, la celda muestra el número completo (`14,5`); sin él, con su
    formato (`14,50%`).
  - **Pegar desde Excel**: al pegar un rango copiado, llena desde la celda
    elegida y agrega las filas que falten.
  - Los números se escriben y se pegan en formato colombiano. Función nueva
    `interpretarNumero` en `formato.ts`: quita `$`, `%` y espacios; si hay
    punto y coma, el último es el decimal; si solo hay coma, es decimal; si
    solo hay puntos y forman grupos de tres (`1.234.567`), son miles; si no,
    es decimal. Un porcentaje se guarda como `14.5` para "14,5 %" (así está
    hoy en la muestra).
  - Una celda que no se entiende se marca en rojo y no se guarda hasta
    corregirla; el resto sí.
  - Los cambios se confirman al salir de la celda o al pegar: una operación
    `datos.filas` con todas las filas de ese conjunto en ese mes.
- Los atajos del visor (flechas, `F`) ya se desactivan dentro de campos de
  texto; comprobar que siga así en el panel y en la cuadrícula.

### Archivos nuevos y tocados

```
src/lib/
  edicion/operaciones.ts     tipos de operación, aplicar, inversa, compactar
  edicion/validar.ts         esquemas zod, referencias, topes
  edicion/pegado.ts          lectura de un rango pegado desde Excel
  almacen/index.ts           (cambia) interfaz nueva y elección de almacén
  almacen/muestra.ts         (cambia) soloLectura
  almacen/bd.ts              almacén sobre SQL
  almacen/motor.ts           Neon y PGlite
  almacen/esquema.ts         sentencias de creación y siembra
  acceso.ts                  puedeEditar
  formato.ts                 (cambia) interpretarNumero
src/app/
  page.tsx                   (cambia) dinámica
  layout.tsx                 (cambia) robots
  p/[id]/page.tsx            (cambia) pasa revisión y si se puede editar
  api/presentaciones/[id]/route.ts
  api/presentaciones/[id]/cambios/route.ts
  error.tsx                  "No se pudo cargar"
src/components/
  visor/Visor.tsx            (cambia) usa el hook, botón Editar, panel
  editor/usarEdicion.ts      estado, cola, guardado, deshacer
  editor/PanelEdicion.tsx    panel derecho
  editor/EditorTexto.tsx, EditorCifras.tsx, EditorDatos.tsx
  editor/EstadoGuardado.tsx  indicador
  editor/piezas.tsx          campo, interruptor de meses, "mes vacío", botones
pruebas/                     pruebas con vitest
.datos-locales/              (ignorada por git) base local de desarrollo
```

Paquetes nuevos: `@neondatabase/serverless`, `zod`; de desarrollo,
`@electric-sql/pglite` y `vitest`. Comandos nuevos: `npm run prueba`.

**Antes que nada, agregar `/.datos-locales/` a `.gitignore`**: la base local
puede llegar a tener datos reales y el repositorio es público.

### Orden de trabajo

Cada paso termina compilando, con sus pruebas, subido a GitHub y marcado aquí.
Si el uso se acaba a mitad, lo anterior queda publicado y funcionando.

- [x] **2A.1 Operaciones y validación.** `.gitignore`, `operaciones.ts`,
  `validar.ts`, `interpretarNumero` y sus pruebas. Sin pantallas ni base. La
  muestra debe pasar la validación.
- [x] **2A.2 Base de datos.** Motor, esquema, almacén, siembra, las dos rutas,
  inicio dinámico, `robots`. Pruebas sobre PGlite: crear, guardar, choque de
  revisiones con reintento, copia cada 10 minutos, tope de copias. El sitio se
  ve igual que antes, pero ya lee de la base.
- [x] **2A.3 Primer cambio de punta a punta.** Hook, indicador de guardado,
  botón "Editar", panel con título, subtítulo y nombre de la presentación.
- [x] **2A.4 Textos y cifras**, con "igual en todos los meses / propio de cada
  mes" y "Copiar del mes anterior".
- [x] **2A.5 Editor de datos**: cuadrícula y pegado desde Excel.
- [x] **2A.6 Cierre.** Deshacer y rehacer, reintentos, aviso al cerrar,
  recarga al volver a la pestaña, "Descargar copia". Revisión en navegador,
  actualizar `README.md` y este plan.

### Cómo se comprueba que quedó bien

Todo lo de esta lista se comprobó el 2026-11-16 en navegador (Chrome) contra
la base local, además de las pruebas automáticas.

- Cambiar un título, recargar la página: el cambio sigue ahí.
- Cambiar el texto de octubre no cambia el de septiembre si es propio de cada
  mes; sí lo cambia si es igual en todos.
- Copiar un rango de Excel con números como `1.234,56` y `14,5%`, pegarlo:
  la tabla y el gráfico muestran los mismos valores.
- Dos pestañas abiertas: en una se cambia el título de la diapositiva 2 y en
  la otra los datos de la 5. Las dos cosas quedan guardadas y, al volver a
  cada pestaña, se ve el cambio de la otra.
- Cortar la red, hacer cambios, restaurar la red: se guardan solos.
- Cerrar la pestaña con cambios sin guardar: el navegador avisa.
- Ctrl+Z deshace el último cambio y eso también queda guardado.
- Sin base configurada, en producción, el sitio muestra la muestra y no
  aparece "Editar".
- En celular el visor se ve y funciona igual que en la etapa 1.
- `npm run tipos`, `npm run prueba` y `npm run build` terminan sin errores.

### Lo que hace la usuaria en Vercel

Una sola vez, cuando el paso 2A.2 esté subido:

1. En vercel.com, abrir el proyecto y entrar a la pestaña **Storage**.
2. Elegir crear una base de datos **Neon** (Postgres). Plan **Free**. Región
   **Washington, D.C. (iad1)**, que es donde corre el sitio si no se ha
   cambiado. Aceptar los términos de Neon si los pide.
3. Conectarla al proyecto. Dejar marcado solo el entorno **Production**. Sin
   Preview ni Development, una versión de prueba nunca toca los datos de
   verdad.
4. Vercel agrega sola la variable `DATABASE_URL`. No hay que copiar ni pegar
   claves, y nunca se escriben en el repositorio.
5. En la pestaña **Deployments**, abrir el menú del último despliegue y
   elegir **Redeploy**, para que el sitio arranque ya con la base.
6. Abrir el sitio: debe aparecer la presentación de muestra y el botón
   "Editar".

### Riesgos y cosas a vigilar

- **Datos reales.** Resuelto con la clave del sitio (2026-11-17). Si la clave
  se filtra, se cambia en Vercel y se vuelve a publicar.
- **Vista previa de Vercel con la base de verdad.** Si Preview queda conectado
  a la misma base, una rama de prueba edita los datos reales. Por eso el paso
  3 de arriba.
- **Resaltado por nombre.** `resaltar` busca una fila por el texto de una
  columna (por ejemplo la entidad propia). Si alguien cambia ese nombre en la
  cuadrícula, la fila deja de resaltarse. En la 2B, al editar el bloque,
  ofrecer elegir de nuevo la fila resaltada.
- **Dos personas en el mismo campo.** Gana quien guarda de último, sin aviso.
  Aceptado por ahora; el historial cubre el caso.
- **Semilla y base.** `npm run semilla` cambia el archivo de muestra, no lo
  que ya está en la base. La muestra solo entra a una base vacía.
- **Tamaño.** Si una presentación real pasa de 3 MB, revisar antes de subir el
  tope: probablemente sobren meses viejos en algún conjunto.

## Diseño de la etapa 2B: estructura, gráficos y tema

Diseñada y programada el 2026-11-16. Sigue las reglas de "Operaciones de edición" de la 2A:
todo cambio es una operación del tipo "dejar este valor", nombrada por `id`,
que se aplica igual en el navegador y en el servidor y se valida antes de
guardar. Si se cambia algo en el código, se corrige aquí.

### Qué entra

- Diapositivas: agregar (portada, contenido o cierre), duplicar, quitar,
  subir y bajar, cambiar el tipo y la disposición.
- Bloques: agregar (gráfico, tabla, texto o cifras), duplicar, quitar, subir y
  bajar dentro de su diapositiva.
- Gráficos: tipo, columna del eje, series (cuáles, en qué orden, color y, en
  el combinado, si van en barras o en línea), apilado, etiquetas, resaltar una
  fila, total de la cascada. Cinco tipos nuevos (ver abajo).
- Tablas: qué columnas se ven y en qué orden; resaltar una fila.
- Datos: nombre del conjunto; agregar, quitar, reordenar columnas y cambiar
  su tipo. Un bloque nuevo de gráfico o tabla puede usar datos nuevos o los de
  otro bloque.
- Tema: color principal, colores de las series y color neutro, con un botón
  para volver a los de Presente.
- Meses: "Nuevo mes" (agrega el mes siguiente al último y copia en él lo que
  cambia por mes) y "Quitar este mes".

No entra: mover un bloque a otra diapositiva, arrastrar con el mouse para
reordenar (se usan botones subir y bajar), cambiar el logo o el degradado,
cargar Excel (etapa 3).

### Tipos de gráfico

| Forma | Qué usa | Notas |
|---|---|---|
| `lineas` | Eje: cualquier columna. Series: 1 a 12 numéricas. | Para series de tiempo. |
| `barras` | Igual. | Apilado opcional. Con una serie, admite resaltar. |
| `barrasHorizontales` | Igual. | Rankings. Etiquetas y resaltar. |
| `area` | Igual. | Apilado opcional. |
| `combinado` | Eje y 1 a 12 series; cada serie dice `tipo: 'barras' \| 'lineas'`. | Barras y líneas sobre **la misma escala**. Si las magnitudes son muy distintas (pesos y porcentaje), usar dos gráficos. |
| `circular` | Eje: columna con los nombres de las porciones. Una serie con los valores. | Dona con el total en el centro. Valores negativos o vacíos no se dibujan. Más de 6 porciones: las 5 mayores y "Otros", para que se lea. |
| `dispersion` | Eje: columna **numérica** (eje horizontal). Una serie (eje vertical). `nombres`: columna de texto que nombra cada punto. | Comparar dos variables entre entidades. Admite resaltar y etiquetas (el nombre junto al punto). |
| `radar` | Eje: columna con los nombres de los ejes del radar. Series: 1 a 6. | Pocas categorías (3 a 10). |
| `cascada` | Eje: concepto. Una serie con la **variación** de cada fila. `total`: agrega al final una barra con la suma. | La primera fila sale desde cero. Subidas en el color 4 de las series (verde), bajadas en el principal, total en gris oscuro. |

- Todas tienen un solo eje de valores (lo acordado). Las series siempre son
  columnas numéricas.
- El validador exige lo de la tabla: por ejemplo, exactamente una serie en
  circular, dispersión y cascada, y eje numérico en dispersión.
- Al cambiar de tipo en el panel, la configuración se ajusta sola para que
  sea válida (quedarse con la primera serie, elegir un eje numérico, marcar
  barras y línea en el combinado). Las formas que el conjunto no puede usar
  (por ejemplo dispersión sin dos columnas numéricas) aparecen desactivadas
  con la explicación.
- Cambios en `tipos.ts`: `FormaGrafico` suma las cinco; `Serie` suma
  `tipo?: 'barras' | 'lineas'`; `BloqueGrafico` suma `total?: boolean` y
  `nombres?: string`.

### Operaciones nuevas

```ts
// Diapositivas. `despues`: id de la diapositiva que queda antes; null = al principio.
| { op: 'diapositiva.poner'; diapositiva: Diapositiva; despues: string | null }
| { op: 'diapositiva.quitar'; diapositiva: string }
| { op: 'diapositiva.mover'; diapositiva: string; despues: string | null }
| { op: 'diapositiva.tipo'; diapositiva: string; valor: 'portada' | 'contenido' | 'cierre' }
| { op: 'diapositiva.disposicion'; diapositiva: string; valor: Disposicion }
// Bloques. `despues`: id del bloque que queda antes, en la misma diapositiva.
| { op: 'bloque.poner'; diapositiva: string; bloque: Bloque; despues: string | null }
| { op: 'bloque.quitar'; bloque: string }
| { op: 'bloque.mover'; bloque: string; despues: string | null }
| { op: 'grafico.config'; bloque: string; valor: Omit<BloqueGrafico, 'id' | 'tipo'> }
| { op: 'tabla.config'; bloque: string; valor: Omit<BloqueTabla, 'id' | 'tipo'> }
// Conjuntos de datos.
| { op: 'conjunto.poner'; conjunto: ConjuntoDatos }
| { op: 'conjunto.quitar'; conjunto: string }
| { op: 'datos.nombre'; conjunto: string; valor: string }
| { op: 'datos.columnas'; conjunto: string; valor: Columna[] }
// Presentación.
| { op: 'tema'; valor: Tema }
| { op: 'periodo.agregar'; periodo: IdPeriodo; copiarDe: IdPeriodo | null }
| { op: 'periodo.quitar'; periodo: IdPeriodo }
```

Reglas de cada una:

- **`poner`** crea o reemplaza (si el `id` ya existe) y deja el elemento en su
  sitio. Sirve para agregar, duplicar y deshacer un "quitar". Aplicarla dos
  veces da lo mismo.
- **`quitar`** de algo que ya no existe se salta (regla 7).
- **`mover`** deja el elemento justo después de `despues`. Si `despues` ya no
  existe, se salta. Subir y bajar son un `mover`.
- `conjunto.quitar` se salta si algún bloque todavía usa el conjunto. El panel,
  al quitar el último bloque que usa un conjunto, manda en el mismo cambio
  `bloque.quitar` y `conjunto.quitar` (así deshacer devuelve los dos).
- **`datos.columnas`** deja la lista completa de columnas. Las filas se
  ajustan solas en todos los meses: se borra el valor de las columnas que se
  quitan y, si una columna cambia de tipo, los textos pasan a número con
  `interpretarNumero` (lo que no se entiende queda vacío) y los números a
  texto. Se salta si quita una columna que usa algún bloque (el panel no lo
  permite y dice qué bloque la usa). Su inversa devuelve las columnas y las
  filas de cada mes.
- **`periodo.agregar`** inserta el mes en orden. Si `copiarDe` tiene valor,
  copia a ese mes todo lo que es "propio de cada mes" (filas de cada conjunto,
  textos y cifras). Si el mes ya existe, no hace nada: así reenviarla no pisa
  lo que se editó después. Su inversa es `periodo.quitar`.
- **`periodo.quitar`** borra el mes y todo lo suyo. Se salta si es el único
  mes. Su inversa es `periodo.agregar` sin copiar más una operación por cada
  valor que tenía ese mes.
- `grafico.config`, `tabla.config`, `tema`, `datos.nombre`, `diapositiva.tipo`
  y `diapositiva.disposicion` se compactan como las de la 2A (queda la última
  de cada destino). Las de estructura (`poner`, `quitar`, `mover`,
  `datos.columnas`, `periodo.*`) nunca se compactan ni dejan compactar a
  través de ellas: cambian el significado de las vecinas.
- Los `id` nuevos los crea el navegador: prefijo según lo que es y 8
  caracteres al azar (`d-k3f9x2ab`, `b-...`, `c-...`). Las claves de columna
  nuevas son `col1`, `col2`... (la primera libre).
- Duplicar una diapositiva o un bloque **copia también sus datos** en
  conjuntos nuevos ("Nombre (copia)"): la copia se edita sin tocar el
  original. Para que dos bloques muestren los mismos datos (gráfico y tabla),
  al agregar el bloque se elige "Usar los datos de...".

### Pantalla de edición

El panel derecho tiene dos pestañas: **Diapositiva** y **Presentación**.

Pestaña Diapositiva:

- Barra de acciones: agregar diapositiva después de esta (eligiendo el tipo),
  duplicar, subir, bajar, quitar (pide confirmación; se puede deshacer). No se
  puede quitar la única diapositiva.
- Tipo (portada, contenido, cierre), título, subtítulo. En las de contenido,
  disposición con cuatro botones dibujados. Si la disposición es "una" y hay
  más de un bloque, aviso: solo se ve el primero. Agregar un segundo bloque a
  una diapositiva con disposición "una" la pasa a "columnas" en el mismo
  cambio.
- Una tarjeta por bloque, con subir, bajar, duplicar y quitar en su
  encabezado. Además de lo de la 2A:
  - **Gráfico**: tipo (nueve botones con dibujo), eje, series (marcar cuáles,
    subir y bajar, color de la paleta del tema o automático, y barras o línea
    en el combinado), apilado, etiquetas, resaltar (columna de texto y fila),
    total de la cascada, nombres de los puntos de la dispersión. Solo se
    muestran las opciones que usa el tipo elegido.
  - **Tabla**: columnas visibles (marcar y ordenar) y resaltar.
- Al final, "Agregar bloque": gráfico, tabla, texto o cifras. Para gráfico y
  tabla se elige "Datos nuevos" o uno de los conjuntos que ya existen. Los
  datos nuevos traen tres filas de ejemplo con las columnas que pide el tipo
  de gráfico, y el editor de datos se abre solo para pegar los de verdad.
- Tope: 8 bloques por diapositiva y 200 diapositivas (el botón se desactiva).

Pestaña Presentación:

- Descripción.
- **Meses**: lista de meses; "Nuevo mes" agrega el siguiente al último
  (por ejemplo noviembre 2026 tras octubre) copiando el último, y lleva la
  barra de meses a él. "Quitar este mes" quita el mes elegido en la barra
  (pide confirmación; se puede deshacer).
- **Colores**: principal, seis colores de series y neutro, cada uno con su
  selector. Al lado de cada color, aviso si contrasta poco con el fondo blanco
  (menos de 3 a 1). Botón "Volver a los colores de Presente". El orden de la
  paleta de Presente está validado para daltonismo: si se cambia, revisar que
  los gráficos se sigan distinguiendo.
- "Descargar copia" (de la 2A).

Editor de datos: botón "Columnas" que abre una lista con nombre, tipo,
decimales, unidad, subir, bajar y quitar de cada columna, y "Agregar columna".
El nombre del conjunto se edita en el encabezado.

### Archivos

```
src/lib/tipos.ts                 (cambia) formas nuevas, Serie.tipo, total, nombres
src/lib/edicion/operaciones.ts   (cambia) operaciones nuevas
src/lib/edicion/validar.ts       (cambia) esquemas y reglas por forma
src/lib/edicion/plantillas.ts    ids nuevos, bloques y conjuntos de ejemplo, duplicar, ajustar config al cambiar de forma
src/lib/color.ts                 contraste de colores
src/components/bloques/Grafico.tsx           (cambia) los cinco tipos nuevos
src/components/editor/PanelEdicion.tsx       (cambia) pestañas, acciones
src/components/editor/EditorGrafico.tsx      configuración de gráfico
src/components/editor/EditorTabla.tsx        configuración de tabla
src/components/editor/AgregarBloque.tsx
src/components/editor/PanelPresentacion.tsx  meses y colores
src/components/editor/EditorColumnas.tsx     columnas del conjunto
pruebas/                                     operaciones y validación nuevas
```

### Orden de trabajo

- [x] **2B.1 Modelo y operaciones**: tipos, operaciones, inversas, validación,
  plantillas y pruebas.
- [x] **2B.2 Gráficos nuevos** en `Grafico.tsx`.
- [x] **2B.3 Pantallas**: panel con pestañas, estructura, configuración de
  gráfico y tabla, agregar bloque, columnas, tema y meses.
- [x] **2B.4 Cierre**: revisión en navegador, README y este plan.

### Cómo se comprueba

Todo lo de esta lista se comprobó el 2026-11-16 en navegador (Chrome) contra
la base local, además de las pruebas automáticas (`pruebas/estructura.prueba.ts`).

- Agregar, duplicar, mover y quitar diapositivas y bloques; recargar la
  página: queda igual. Ctrl+Z deshace cada paso, también quitar.
- Cambiar un gráfico por cada uno de los nueve tipos: se dibuja sin errores y
  el panel muestra solo las opciones que corresponden.
- Agregar un gráfico con datos nuevos, pegar datos desde Excel, verlo.
- Quitar una columna usada por un gráfico: el panel no lo deja y dice cuál.
- Cambiar el color principal: cambia en portada, títulos y gráficos.
- "Nuevo mes": aparece el mes, con los datos del anterior copiados; editar el
  nuevo no cambia el anterior. Deshacer lo quita.
- Dos pestañas: una quita una diapositiva mientras la otra edita su título:
  se guarda sin error (la operación de la otra se salta).
- `npm run tipos`, `npm run prueba` y `npm run build` sin errores.

### Riesgos

- **Envíos grandes.** Duplicar una diapositiva con muchos datos por mes manda
  los conjuntos completos en un solo cambio. Pasa de 256 KB con unos 3.000
  filas en total; el servidor lo rechazaría (413) y el cambio se descarta con
  aviso. Con los datos actuales no ocurre; si pasa, subir el tope del envío.
- **Colores propios.** El tema deja elegir cualquier color; el aviso de
  contraste ayuda pero no impide combinaciones que se confundan.
- **Combinado con escalas distintas.** La herramienta no lo impide; la nota
  en el panel lo recuerda.

## Diseño de la etapa 3: cargar Excel

Diseñada y programada el 2026-11-17. Sigue las reglas de "Operaciones de
edición" de la 2A. Si se cambia algo en el código, se corrige aquí.

### Qué entra

- Cargar un archivo `.xlsx` o `.xlsm` (Excel 2007 en adelante) o `.csv`.
- Elegir la hoja, dónde están los encabezados (fila o columna, con su número)
  y, con eso, las columnas.
- Dos caminos:
  - **Bloque nuevo desde Excel** ("Agregar bloque" → gráfico o tabla →
    "Desde un archivo de Excel"): se elige la columna del eje, las series (o,
    en una tabla, las columnas), el tipo de cada columna, el tipo de gráfico y
    si los datos son propios de cada mes o iguales en todos.
  - **Actualizar unos datos que ya existen** (botón "Cargar Excel" en la
    tarjeta del gráfico o la tabla): para cada columna del conjunto se elige
    de qué columna del archivo sale. La primera vez se proponen por nombre.
- Mes: cualquiera de la presentación o "Nuevo mes" (el siguiente al último,
  igual que el botón "Nuevo mes": copia el último y luego carga encima).
- Vista previa: la hoja tal como viene (con la fila de encabezados marcada) y
  el resultado (la diapositiva con los datos nuevos y la tabla de filas, con
  las celdas que no se entendieron en rojo).
- **Recordar la configuración por conjunto de datos**: hoja, encabezados y de
  qué encabezado sale cada columna. El mes siguiente basta con elegir el
  archivo: todo llega propuesto y se revisa en la vista previa.

No entra: Excel antiguo (`.xls`), `.xlsb` y `.ods` (se pide guardarlo como
`.xlsx`); archivos con clave; actualizar varios conjuntos con un solo archivo
de una vez (posible mejora después: hoy se carga bloque por bloque, pero el
archivo queda en memoria mientras la pestaña esté abierta y no hay que volver
a elegirlo).

### Decisiones

| Tema | Decisión | Por qué |
|---|---|---|
| Dónde se lee el archivo | **En el navegador.** El archivo no se sube a ninguna parte: solo viajan las filas resultantes, como operaciones normales. | Los Excel reales no pasan por el servidor ni quedan guardados. El servidor valida igual que siempre. |
| Librería | Lector propio (`src/lib/excel/leer.ts`) sobre **`fflate`** (descomprime el `.xlsx`, que es un zip de XML). | SheetJS ya no publica en npm (la versión de npm es vieja y con fallos de seguridad conocidos) y su servidor no es alcanzable desde el entorno de Claude; `exceljs` pesa mucho y arrastra paquetes de Node. Para leer valores, formatos y fechas basta un lector pequeño que se prueba aquí. |
| Carga bajo demanda | La ventana de carga y el lector se descargan solo al usarlos. | Lo pide "Gráficos bajo demanda". |
| Dónde se recuerda | Campo `origen` del conjunto de datos, dentro de la presentación. Operación nueva `datos.origen`. | Viaja con la presentación (copias, historial, descarga) y se guarda como todo lo demás. |
| Columnas por nombre | Se recuerda el **texto del encabezado**, no la letra de la columna. Si el encabezado cambió de fila, se busca en las primeras 50 filas. | Los archivos de cada mes suelen agregar o mover columnas; el nombre se mantiene. |
| Porcentajes | Una celda con formato de porcentaje (`14,5 %`, guardada por Excel como `0,145`) se guarda como `14.5`. | Así están los porcentajes en el modelo (ver 2A). |
| Fechas | Pasan a texto: "Oct 26" (mes y año, como la muestra), "31/10/2026" (día) o "2026". Se propone "mes" si no hay dos fechas del mismo mes. | El eje de los gráficos es texto. |
| Más de 500 filas | Se avisa y se elige: las primeras 500 o las últimas (propuesto si el eje son fechas). | Tope de filas por mes de la 2A. |
| Antes de guardar | La ventana aplica las operaciones en el navegador y valida el resultado con `validarPresentacion`; si no pasa o el envío pesa más de 180 KB, no deja cargar y explica por qué. | Evita el 400 o el 413 del servidor después de cerrar la ventana. |

### Modelo

En `tipos.ts`:

```ts
export interface OrigenExcel {
  archivo: string;                 // nombre del último archivo cargado (para mostrarlo)
  hoja: string;
  orientacion: 'filas' | 'columnas'; // encabezados en una fila (lo normal) o en una columna
  encabezados: number;             // número de esa fila o columna, desde 1 como en Excel
  columnas: { clave: string; encabezado: string; fechas?: 'dia' | 'mes' | 'anio' }[];
  hasta: 'vacia' | 'final';        // leer hasta la primera fila vacía o todas
  invertir?: boolean;              // dar vuelta el orden de las filas
  sobrantes?: 'primeras' | 'ultimas';
  cargado: string;                 // fecha y hora de la última carga (ISO)
  periodo: IdPeriodo | null;       // mes en que se cargó (null: igual en todos)
}
// ConjuntoDatos suma: origen?: OrigenExcel
```

Operación nueva, compactable por conjunto (queda la última):

```ts
| { op: 'datos.origen'; conjunto: string; valor: OrigenExcel | null }
```

- Las claves de `origen.columnas` que ya no existan en el conjunto se ignoran
  al cargar (no son un error): así quitar una columna no obliga a tocar el
  origen.
- Topes: archivo 200 caracteres, hoja 100, encabezado 200, 40 columnas.

### Cómo se lee una hoja

- Celdas: número (con su formato: porcentaje, moneda, decimales), fecha o
  texto. Vacías, errores de Excel (`#N/A`) y fórmulas sin valor calculado
  quedan vacías. Las fórmulas se leen por su último valor calculado.
- Encabezados repetidos se distinguen con "(2)"; uno vacío con datos debajo se
  llama "Columna C".
- Se propone como fila de encabezados la primera, entre las 30 primeras, que
  tenga al menos dos textos y datos debajo.
- Filas de datos: desde la siguiente a la de encabezados hasta la primera fila
  del todo vacía (o hasta el final, si se elige). Las filas sin nada en las
  columnas elegidas se saltan.
- Tipo propuesto de cada columna: porcentaje, moneda o número si más de la
  mitad de lo que tiene son números (por su formato); texto si no. Los
  decimales salen del formato de Excel o, sin formato, de los números (hasta
  4). En un gráfico nuevo se proponen como series las columnas del mismo tipo
  que la primera (un solo eje de valores). En un CSV los números se
  leen con `interpretarNumero` (formato colombiano, igual que al pegar).
- Una celda con texto en una columna numérica queda vacía y se marca en rojo
  en la vista previa, con el total de celdas así.
- CSV: separador `;`, `,` o tabulador (el que se repita igual en las primeras
  filas); texto en UTF-8 o, si no lo es, en la codificación de Windows.
- Topes de lectura: 30 MB por archivo, 20.000 filas y 256 columnas por hoja.
- `.xls` antiguo o con clave: se reconoce y se pide guardarlo como `.xlsx`.

### Pantalla

Ventana ancha sobre el visor, como el editor de datos:

- Izquierda, la configuración: archivo (botón o arrastrar; "Usar el mismo
  archivo" si ya se eligió uno en la pestaña), hoja, encabezados, columnas
  (según el camino), mes, filas (hasta la primera vacía, invertir el orden,
  sobrantes) y, en un bloque nuevo, el nombre de los datos y el tipo de
  gráfico.
- Derecha, dos pestañas: **Archivo** (la hoja como en Excel, con letras y
  números; clic en el número de una fila la vuelve la fila de encabezados) y
  **Resultado** (la diapositiva con los datos nuevos y las filas).
- Pie: "Se cargarán 24 filas en Octubre 2026", avisos, "Cancelar" y
  "Cargar". Todo lo que hace "Cargar" es un solo paso de deshacer.
- La tarjeta del gráfico o la tabla muestra, si hay origen, "Último Excel:
  archivo · hoja · fecha".

### Archivos

```
src/lib/excel/leer.ts           abrir xlsx y csv: hojas y celdas
src/lib/excel/tabla.ts          encabezados, filas, tipos, fechas, columnas recordadas
src/lib/excel/cargar.ts         operaciones de "bloque nuevo" y "actualizar datos"
src/lib/tipos.ts                (cambia) OrigenExcel
src/lib/edicion/operaciones.ts  (cambia) datos.origen
src/lib/edicion/validar.ts      (cambia) esquema de origen y de la operación
src/components/editor/CargarExcel.tsx  la ventana
src/components/editor/AgregarBloque.tsx, PanelEdicion.tsx, visor/Visor.tsx  (cambian) entradas
pruebas/excel.prueba.ts         lector, interpretación y operaciones
pruebas/archivos/               Excel y CSV de prueba, con datos inventados
scripts/crear-archivos-prueba.py  cómo se hicieron (openpyxl y LibreOffice)
```

`.gitignore` ignora `*.xlsx`, `*.xlsm`, `*.xls` y `*.csv` fuera de
`pruebas/archivos/`, para que un Excel real no se suba por descuido.

### Orden de trabajo

- [x] **3.1 Lector**: `leer.ts`, archivos de prueba y pruebas.
- [x] **3.2 Interpretación y operaciones**: `tabla.ts`, `cargar.ts`,
  `datos.origen`, validación y pruebas.
- [x] **3.3 Pantalla** y entradas.
- [x] **3.4 Cierre**: revisión en navegador, README y este plan.

### Cómo se comprueba

Todo lo de esta lista se comprobó el 2026-11-17 en navegador (Chrome, sin
ventana) contra la base local, además de las pruebas automáticas
(`pruebas/excel.prueba.ts`). Falta probarlo con un Excel real del Comité
(sin subirlo): ver "Riesgos".

- Un Excel con título arriba, encabezados en la fila 3, porcentajes, moneda y
  fechas: se propone la fila 3, los tipos y "Oct 26"; el gráfico se ve igual
  que en Excel.
- Crear un gráfico desde Excel, recargar la página: sigue ahí. Ctrl+Z lo
  quita entero.
- "Nuevo mes" desde la ventana con el archivo del mes siguiente (columnas en
  otro orden y una fila más): todo llega propuesto, se carga en el mes nuevo y
  el mes anterior no cambia.
- Un CSV con `;` y comas decimales, guardado desde Excel en español.
- Un `.xls` da el aviso de guardarlo como `.xlsx`.
- Más de 500 filas: aviso y elección.
- `npm run tipos`, `npm run prueba` y `npm run build` sin errores.

### Riesgos

- **Archivos raros.** El lector cubre lo que escriben Excel, LibreOffice y
  Google Sheets. Si un archivo no abre, guardarlo de nuevo desde Excel suele
  resolverlo; si no, revisar `leer.ts` con ese archivo (sin subirlo).
- **Encabezado renombrado.** Si el archivo del mes cambia el nombre de una
  columna, la ventana la deja sin elegir y lo dice; se elige a mano y queda
  recordada con el nombre nuevo.
- **Porcentajes sin formato.** Un `0,145` sin formato de porcentaje en Excel
  se carga como `0,145`. La vista previa lo deja ver antes de cargar.

## Diseño de la etapa 4: migración de la presentación original

Diseñada y programada el 2026-11-17. Si se cambia algo en el código, se
corrige aquí.

### Qué entra

- Las **25 diapositivas de la versión 2 original** (`/presentation/v2`), en el
  orden de `slideOrder` del JSON, con sus títulos de `slideTitles` y todos sus
  meses, armadas con bloques editables del formato nuevo.
- Los bloques y opciones que faltaban para que se vean como las originales
  (lista abajo). Todos son genéricos: sirven para cualquier presentación.
- Un **importador** dentro de la herramienta: en el inicio, "Importar la
  presentación anterior" lee el JSON de la original (el archivo `InfoComite`
  o lo que devuelve `/api/presentation/shared` del sitio original), muestra
  qué va a crear y crea la presentación en la base. Así los datos reales van
  directo del archivo de la usuaria a la base privada: no pasan por el
  repositorio ni por el entorno de Claude en producción.

No entra: lo que la original tenía en datos pero ya no mostraba en la v2
(gráficos de consumo por tramo y de vivienda UVR, propuestas de tasas de
CDAT y de crédito, FSG, cancelaciones anticipadas). Se pueden armar después
con los bloques de esta etapa si se piden.

### Decisiones

| Tema | Decisión | Por qué |
|---|---|---|
| Aspecto | Mismo contenido, orden, tipo de gráfico y distribución de cada diapositiva; colores y letra del formato nuevo (fondo blanco, colores de Presente). | Lo acordado en "Diseño". La original es oscura. |
| Meses | Diciembre 2025 a octubre 2026 (los 11 que tiene el benchmarking). Se abre en el último. | El sufijo vacío de la original es diciembre (ver `MONTH_TO_SUFFIX`). |
| Series de tiempo | Iguales en todos los meses (TES, tasas de referencia, cartera, pasivos, etc.). | En la original son una sola serie que va creciendo. |
| Benchmarking (VIS, No VIS, Libre Inversión, CDATs, Créditos, Resumen) | Propios de cada mes, con los meses que trae el JSON. Un mes sin datos muestra el aviso de siempre. | Así estaban en la original (selector de mes en cada diapositiva). |
| Textos (análisis macro, propuesta de cambio de tasas, Davivienda) | Propios de cada mes, solo en octubre 2026. "Nuevo mes" los copia. | Son del mes en que se escribieron; la original no guardaba los anteriores. |
| Dos unidades en un gráfico | "TPP Captación y Saldos" mezcla saldos ($) y tasas (%) con dos ejes. Pasa a **dos gráficos lado a lado** (saldos y TPP). | Se acordó un solo eje por gráfico. |
| Variación y posición | En las tablas de Créditos y CDATs, "Var" se **calcula** contra el mes anterior que tenga datos (como la original). La posición de Créditos se calcula (menor tasa = 1, como la original); la de CDATs viene en los datos. | Si se calculan, al cargar el mes nuevo se actualizan solas. |
| Cifras de los costados | "Entidades", "Monto total", "Presente", "Último", etc. **salen de los datos** (primera fila, última fila o la fila de PRESENTE). | Al cargar un Excel nuevo se actualizan solas, como en la original. |
| Diferencia REPO − Inflación | Columna de datos calculada al importar. | No hay columnas calculadas; se puede volver a cargar desde Excel. |
| Resumen de benchmarking | Monto y "$ Desembolsos Presente" quedan como texto ("$101.110 mil M"); tasas y variación pasan a número. | Los montos vienen escritos con unidades mezcladas ("mil M", "bill."). |
| Dónde se convierte | `src/lib/migracion/original.ts`, en el navegador; el servidor valida con `validarPresentacion` antes de crear. | El mismo código sirve para la prueba local con el respaldo. |

### Bloques y opciones nuevas

En `tipos.ts` (todo opcional, así las presentaciones existentes siguen
valiendo):

```ts
// Todos los bloques
titulo?: string;      // encabezado chico arriba del bloque ("Créditos de libranza — Davivienda")
nota?: string;        // texto chico debajo ("* Tasas efectivas anuales ...")

// Disposición nueva
'cuadricula'          // dos columnas; los bloques se reparten en filas iguales

// Serie
punteada?: boolean;   // línea punteada (usura, total, TES 10 años)

// BloqueGrafico
detalleEje?: string;  // columna que se escribe debajo de cada categoría ("TPP 18,29%")
// resaltar con varias series: las barras de las demás categorías quedan atenuadas

// Columna (del conjunto)
grupo?: string;       // encabezado agrupado en tablas ("Vivienda VIS" sobre Tasa, Var, Pos.)
signo?: boolean;      // en tablas: "+" delante y verde si es positivo, rojo si es negativo

// BloqueTabla
secciones?: string;   // columna de texto que agrupa las filas: una fila de título por grupo
calculadas?: { tipo: 'variacion' | 'posicion'; columna: string; orden?: 'asc' | 'desc' }[];
//   variacion: valor del mes menos el del mes anterior con datos, para la misma fila
//              (misma sección y mismo primer texto). Va justo después de su columna.
//   posicion:  1, 2, 3... dentro de la sección; 'asc' = el menor es 1.

// Cifra
desde?: {
  conjunto: string; columna: string;
  fila: 'primera' | 'ultima' | { columna: string; valor: string };
  detalle?: string;                    // columna de la misma fila que va como detalle (el mes)
  comparar?: 'primera' | 'ultima' | { columna: string; valor: string };
  //   detalle = diferencia contra esa fila ("+6,22 pp") seguida del detalle escrito
};

// Bloque nuevo
interface BloqueTarjetas { id; tipo: 'tarjetas'; tarjetas: PorPeriodo<{ titulo: string; texto: string }[]> }
```

Texto: además de párrafos y viñetas, `**negrita**` y las líneas que empiezan
con `# ` salen en letra grande (la cifra destacada del ahorro de DaviPlata).

Operaciones nuevas:

```ts
| { op: 'bloque.marco'; bloque: string; titulo: string; nota: string }   // '' quita
| { op: 'tarjetas.valor'; bloque: string; periodo: IdPeriodo | null; valor: Tarjeta[] | null }
```

- `grafico.config` y `tabla.config` no tocan `titulo` ni `nota` (los conserva
  el bloque); así no se pisan con `bloque.marco`.
- `porPeriodo` acepta también bloques de tarjetas.
- Las columnas que usan `secciones`, `calculadas`, `detalleEje` y las cifras
  con `desde` cuentan como usadas: no se pueden quitar por debajo, y un
  conjunto que usa una cifra no se puede quitar.
- Topes: título y nota de bloque, 200 caracteres; 8 tarjetas por bloque,
  título 80 y texto 600; 12 columnas calculadas por tabla.

Tablas densas: con más de 10 columnas visibles la letra y los márgenes se
achican; el alto mínimo de fila baja a 22 px. Si aun así no caben (CDATs de
octubre tiene 30 entidades), la tabla se desplaza, como en la original.

### Correspondencia

| # | Original (`slideOrder`) | Formato nuevo |
|---|---|---|
| 1 | cover | Portada: "Comité de Precios" / "{mes}" |
| 2 | macroeconomic | Texto (4 párrafos, con negritas) |
| 3 | historicalRates | Líneas: TES 1, 5 y 10 años (10 punteada) |
| 4 | referenceRates | Líneas: DTF, IBR, IPC, REPO |
| 5 | inflationRepo | Líneas: REPO, inflación, diferencia (punteada) |
| 6 | deficitFiscal | Líneas: total por año (los meses quedan en los datos) |
| 7 | portfolioBalance | Filas: cifra "Total" (último mes) + líneas (total punteada) |
| 8 | portfolioStockRates | Líneas: consumo, usura (p.), rotativos, total (p.), vivienda |
| 9 | monthlyDisbursements | Líneas: consumo, tarjeta, vivienda |
| 10 | disbursementRates | Líneas: consumo, tarjeta, usura (p.), TPP (p.), vivienda |
| 11 | benchmarkingSummary | Tabla por mes, variación con color |
| 12 | benchmarkingCredits | Tabla por mes: secciones (bancos, cooperativas), grupos, Var y posición calculadas, PRESENTE resaltado |
| 13–15 | benchmarkingLibreInversion, NoVis, Vis | Principal y lateral: barras (# y $ desembolsos, PRESENTE resaltado, TPP bajo cada entidad) + cifras (entidades, monto, desembolsos, tasa promedio, Presente contra el promedio) |
| 16 | totalLiabilities | Líneas |
| 17 | tppCaptacion | Columnas: líneas de saldos + líneas de TPP |
| 18–19 | ingresosMensuales, tppIngresosAhorro | Filas: 3 cifras del último mes + líneas |
| 20 | benchmarkingCDATs | Tabla por mes (secciones, 6 plazos con tasa, Var y posición calculadas) |
| 21 | daviviendaDaviplata | Cuadrícula: tabla libranza, texto DaviPlata ahorro, tabla crédito digital (con nota), tarjetas digitales |
| 22–23 | servicioCredito, tppLibreInversion | Filas: cifras del último mes + líneas |
| 24 | cierre | Cierre: "¡Gracias!" / "Comité de Precios" |
| 25 | rateChangeProposal | Filas: texto + tarjetas ("Se propone lo siguiente:") |

Lo que no se pasa igual: el tramo de 2026 en otro color del "Margen de
intermediación" (queda una sola línea) y los colores propios de cada serie
(se usan los del tema, en su orden).

Textos de la original que no vienen en el archivo de datos sino escritos en
su código, y que tienen cifras: la nota al pie de "Benchmarking CDATs" (tasas
E.A. y el monto al que aplican) y la cifra que acompaña el nombre de la
serie "Servicio del crédito". No se copian al importador porque el repositorio es
público; se escriben una vez en el editor (nota del bloque y nombre de la
columna).

Las variaciones vacías del resumen de benchmarking (los meses nuevos las
traen vacías) se completan al importar como tasa promedio menos tasa
Presente, que es lo que traen los meses anteriores.

### Importador

- Ruta `POST /api/presentaciones` con `{ presentacion }`: exige permiso de
  edición (`puedeEditar`), valida, busca un id libre (`comite-de-precios`,
  `comite-de-precios-2`, ...) y crea. Responde `{ id }`. Tope del envío: 2 MB.
- Inicio: si se puede editar, enlace "Importar la presentación anterior" →
  ventana: elegir el archivo `.json`, resumen (diapositivas, meses, conjuntos y
  avisos de lo que no se encontró), "Crear presentación" → abre la nueva.
- `scripts/migrar-original.mjs` hace lo mismo sin pantalla, para probar con el
  respaldo: lee el JSON que se le indique, escribe el resultado en
  `referencia/` (ignorada) y, con `--crear`, lo guarda en la base local.

### Archivos

```
src/lib/migracion/original.ts        conversión del JSON original
src/app/api/presentaciones/route.ts  crear
src/components/inicio/Importar.tsx   ventana del importador
src/lib/tipos.ts, edicion/*          (cambian) opciones, bloque y operaciones nuevas
src/components/bloques/*             (cambian) dibujo de lo nuevo
src/components/editor/*              (cambian) edición de lo nuevo
pruebas/migracion.prueba.ts          conversión con un JSON inventado de la misma forma
```

### Orden de trabajo

- [x] **4.1 Modelo**: tipos, operaciones, validación y pruebas de lo nuevo.
- [x] **4.2 Dibujo**: bloques, tablas, cifras y gráficos.
- [x] **4.3 Edición**: panel para lo nuevo.
- [x] **4.4 Importador**: conversión, ruta, ventana, script y pruebas.
- [x] **4.5 Cierre**: comparar lado a lado con la original, README y este plan.

### Cómo se comprobó

El 2026-11-17, con el respaldo de datos reales en `referencia/` (sin
subirlo):

- La original se levantó en local con el JSON de respaldo y se fotografió
  cada diapositiva; la nueva se comparó una por una en Chrome (escritorio y
  celular), en octubre y en meses sin algunos datos (mayo, diciembre).
- `node scripts/migrar-original.mjs referencia/InfoComite.json` da 25
  diapositivas, 11 meses y 22 conjuntos, válidos y sin avisos.
- En el navegador: importar desde el inicio (y un archivo que no es la
  exportación, que se rechaza), editar una tarjeta, el título de un bloque,
  quitar y deshacer una columna calculada y poner una línea punteada; todo
  se guarda y sigue al recargar.
- `npm run tipos`, `npm run prueba` (152 pruebas; `pruebas/migracion.prueba.ts`
  usa un JSON inventado con la misma forma) y `npm run build` sin errores.

### Detalles de dibujo

- Texto y tarjetas se achican solos (hasta el 60 %) si no caben en su caja,
  sin barra de desplazamiento; solo al mínimo aparece la barra.
- Tablas: densas (letra y márgenes menores) si tienen más de 10 columnas o
  poco alto para sus filas. Los textos con forma de número ("$101.110 mil M")
  van a la derecha y sin partir.
- Principal y lateral: si el costado es solo de cifras, mide 300 px; las
  cifras se apilan cuando no caben una al lado de la otra.
- Barras con categoría resaltada y varias series: franja de fondo y nombre en
  negrita (con una serie, la barra en el color principal como antes). Con
  detalle bajo el eje, las etiquetas van en hasta 3 renglones y la letra se
  ajusta al espacio de cada categoría.

### Lo que hace la usuaria

1. ~~Poner la clave antes de importar~~ Hecho el 2026-11-17 (ver "Acceso" en
   el diseño de la 2A).
2. En el sitio publicado, en el inicio: "Importar la presentación anterior" →
   elegir `InfoComite.json` (o descargar de nuevo
   `https://presentacion-comite-2026.vercel.app/api/presentation/shared` y
   guardarlo como `.json`) → "Crear presentación".
3. Escribir la nota al pie de "Benchmarking CDATs" y, si se quiere, la
   cifra del nombre de la serie "Servicio del crédito" (ver arriba).
4. Cuando la nueva esté bien, la presentación de muestra puede quedarse o
   mandarse a la papelera desde el inicio (ícono de basura).

## Ajustes del 2026-11-17 (antes de la etapa 5)

### Crear y eliminar presentaciones

- En el inicio: botón **"Nueva presentación"**. Ventana con nombre y "Partir
  de": *En blanco* (portada con el nombre, una diapositiva de contenido vacía
  y cierre, en un mes que se elige; por defecto el mes anterior al de hoy) o
  *Copia de* otra presentación (todo: diapositivas, datos y meses).
- En cada fila del inicio: **Duplicar** (abre la misma ventana con "Copia de"
  esa presentación) y **Eliminar** (con confirmación).
- Eliminar **no borra**: pone `eliminado = now()` en la fila (la columna ya
  existía desde la 2A). La presentación deja de verse y de poder editarse, y
  aparece en **"Papelera"**, al final del inicio, con "Recuperar". No hay
  borrado definitivo desde la pantalla (si algún día hace falta, es un
  `delete` en Neon).
- `POST /api/presentaciones` acepta además `{ nueva: { nombre, periodo } }` y
  `{ copiaDe, nombre }` (se arman en el servidor: `src/lib/edicion/nueva.ts`).
  El id sale del nombre ("Comité Diciembre" → `comite-diciembre`) y, si ya
  existe (también en la papelera), se le agrega "-2", "-3"...
- `POST /api/presentaciones/[id]/eliminar` y `/recuperar`. Piden JSON, como
  todas las rutas que cambian algo.
- El tema de una presentación en blanco es el de la muestra (colores de
  Presente).
- Con todo en la papelera, la muestra no se vuelve a sembrar: solo se siembra
  si la tabla está vacía del todo.

### Rango del eje de valores

- Campo nuevo `rangoEje?: { desde?, hasta? }` en `BloqueGrafico`. En el
  editor del gráfico: "Rango del eje vertical (valores)" con **Desde** y
  **Hasta**; vacío = automático. Se guarda al salir del campo o con Enter.
  "Volver a automático" lo quita.
- Mismas unidades que los datos (14,5 = 14,5 %). Acepta coma o punto.
- Vale para líneas, barras, barras horizontales (eje horizontal), área,
  combinado, dispersión (eje vertical), radar (del centro al borde) y
  cascada. No para circular. Se conserva al cambiar a otra forma que lo admita.
- Con rango fijo se usa `allowDataOverflow` de Recharts: lo que quede por
  fuera se corta en lugar de estirar el eje. En barras apiladas, un "desde"
  alto corta las series de abajo.
- Es el mismo en todos los meses.

### Mover diapositivas

- Ya existían subir, bajar, duplicar y quitar (panel → pestaña Diapositiva).
  Se agregó **"Mover a la posición N de M"**.
- Corregido: al subir, bajar o mover, el visor seguía en el mismo número y
  el panel pasaba a mostrar otra diapositiva. Ahora acompaña a la movida.

### Los datos no se pierden al publicar código nuevo

Las presentaciones viven en la base de Neon, no en el código. Publicar en
Vercel cambia el programa, no la base: las tablas se crean con `if not
exists`, la muestra solo se siembra con la tabla vacía y ningún arranque
borra ni reemplaza filas. Para que siga así, **reglas para todo cambio
futuro**:

1. Un campo nuevo del modelo siempre es opcional (como `rangoEje`), o el
   código que lee le pone un valor por defecto.
2. Nunca renombrar, quitar ni volver obligatorio un campo que ya existe. Si
   hace falta, subir `formato` a 2 y escribir una función que convierta lo
   guardado al leerlo.
3. Las tablas solo cambian con `add column if not exists` y similares
   (`esquema.ts`).
4. Antes de publicar, las pruebas deben pasar con la muestra y con una
   presentación importada (validan lo ya guardado contra el validador nuevo).

## Bloques libres, fondos y copiar diapositivas (2026-11-17)

Pedido: poder armar diapositivas como el prototipo de Paraguay (dos columnas
con varios bloques y una franja de conclusión abajo), copiar diapositivas
entre presentaciones y tener la de Paraguay lista.

### Disposición libre

- Nueva disposición `'libre'`. Cada bloque tiene `ubicacion?: { columna,
  ancho, fila, alto }` en una cuadrícula de **12 columnas x hasta 8 filas**
  (desde 1). La diapositiva usa tantas filas como la última ocupada; todas
  del mismo alto (`src/lib/disposicion.ts`, dibujo en `Diapositiva.tsx`).
- Al elegir "Libre", `opsCambiarDisposicion` le da a cada bloque el lugar
  que ya tenía (columnas, filas, principal y lateral o cuadrícula), en un
  solo paso de deshacer. Bloques sin ubicación van debajo de todo, a lo
  ancho; uno nuevo o duplicado también.
- Editor (cada bloque, "Lugar en la diapositiva"): minimapa con todos los
  bloques numerados (un clic lleva la esquina del bloque a esa casilla) y
  cuatro listas: columna, ancho, fila y alto. Los bloques del panel llevan el
  mismo número que el minimapa.
- Tope de bloques por diapositiva: de 8 a 12.

### Fondos de bloque

- `fondo?: 'tinte' | 'recuadro' | 'oscuro'` en todos los bloques. El oscuro
  (franja de conclusión) solo se ofrece para texto, cifras y tarjetas; cambia
  los colores con `.vp-fondo-oscuro` en `globals.css` (negritas en rosado).
- Fondo y ubicación van por la operación nueva `bloque.aspecto` (con
  inversa y compactación), y `grafico.config` / `tabla.config` los conservan
  (son parte del "marco", como título y nota).

### Líneas de referencia

- `referencias?: { valor, etiqueta? }[]` (hasta 4) en gráficos de líneas,
  barras, barras horizontales (línea vertical), área, combinado y cascada.
  Punteadas, oscuras, con la etiqueta arriba a la derecha; el eje se estira
  para que se vean (`ifOverflow="extendDomain"`). Se conservan al cambiar de
  forma si la nueva las admite.

### Copiar y pegar diapositivas

- Panel → pestaña Diapositiva: íconos **Copiar** y **Pegar** (pega después
  de la diapositiva elegida). La copia se guarda en el navegador
  (`localStorage`, clave `vp-portapapeles-diapositiva`), con la diapositiva y
  todos los conjuntos que usan sus gráficos, tablas y cifras. Sirve entre
  presentaciones y entre pestañas del mismo navegador; no entre computadores.
- Al pegar (`src/lib/edicion/portapapeles.ts`): ids nuevos para la
  diapositiva, los bloques y los conjuntos (pegar dos veces no choca), las
  cifras que salen de datos apuntan a los conjuntos nuevos. Lo que cambia por
  mes se queda en los meses que comparten ambas presentaciones; si el mes que
  se ve en el destino no estaba, recibe el que se veía al copiar (y se
  avisa). Lo que es igual en todos los meses se ve en todos.
- Es un solo paso de deshacer.

### Plantilla de Paraguay

- "Nueva presentación" → "Partir de: Ejemplo: Paraguay (Ueno Bank)". Crea
  portada, la diapositiva de Ueno Bank y cierre (`presentacionParaguay` en
  `src/lib/edicion/nueva.ts`). Todo es igual en todos los meses.
- La diapositiva (disposición libre, 6 filas): a la izquierda, barras
  horizontales de clientes (filas 1-2), cifras de depósitos (fila 3) y
  condiciones con fondo rosado (filas 4-5); a la derecha, barras del CAR con
  la línea "Mínimo 12 %" y el último corte resaltado (filas 1-5); abajo, la
  conclusión con fondo oscuro y las fuentes (fila 6).
- Las cifras son públicas (informes de calificación de la entidad de dic-24
  a dic-25, y BCP vía La Nación, Infobae y La Opinión en nov-26): no son
  datos de Presente, por eso pueden estar en el repositorio. El CAR de
  nov-26 es del BCP después de ajustes contables: no es comparable uno a
  uno con la serie anterior (lo dice la nota del gráfico).
- Para llevarla al comité: abrirla, Copiar, ir a la presentación del comité
  y Pegar.

## Diseño de la etapa 5: PDF, Excel, historial y comparar

Programada el 2026-11-17. Todo se abre desde dos botones nuevos del visor:
**Comparar** y **Más** (PDF, PDF de una diapositiva, respaldo en Excel, copia
completa .json e historial).

### PDF

| Tema | Decisión | Por qué |
|---|---|---|
| Cómo se hace (cambió, ver "Mejoras del 2026-11-17") | Página `/p/[id]/pdf?mes=AAAA-MM[&d=N][&auto=1]` con todas las diapositivas (o solo la N) una debajo de otra, y la ventana de imprimir del navegador ("Guardar como PDF"). | Sale con texto nítido y seleccionable, pesa poco y no hace falta librería ni servidor con navegador. Una librería de PDF en el navegador dibujaría imágenes de cada diapositiva. |
| Tamaño | `@page { size: 1280px 720px; margin: 0 }`: cada diapositiva es una hoja de 16:9 (13,33 x 7,5 pulgadas, el mismo tamaño de las diapositivas anchas de PowerPoint). | El lienzo ya mide 1280 x 720: sale igual que en pantalla. |
| Gráficos | Contexto `SinAnimacion` (en `graficoComun.tsx`): en esa página los gráficos se dibujan sin animación. La página espera a que carguen las letras y a que no aparezcan más gráficos antes de habilitar "Guardar como PDF" (y, con `auto=1`, abre la ventana sola). | Si se imprime durante la animación, las barras salen a medio crecer. |
| Fondos | `print-color-adjust: exact` en todo. | Si no, Chrome quita el degradado de la portada y los fondos de bloque. |
| Nombre del archivo | El título de la pestaña: "Nombre - Mes Año". | Es lo que el navegador propone al guardar. |

En pantalla la página muestra arriba el mes, cuáles diapositivas y una
explicación corta (Destino: "Guardar como PDF"); al imprimir eso se esconde
(`.vp-solo-pantalla`). Se probó con Playwright (`page.pdf` con
`preferCSSPageSize`): una página por diapositiva de 960 x 540 pt.

### Respaldo en Excel

- `GET /api/presentaciones/[id]/excel` devuelve un .xlsx: hoja **Contenido**
  (nombre, meses, cada diapositiva con sus bloques y de qué hoja salen sus
  datos), una hoja por **conjunto de datos** con todos los meses (columna
  "Mes" si el conjunto cambia por mes) y hoja **Textos** (textos, cifras y
  tarjetas de cada mes).
- `src/lib/excel/escribir.ts` escribe el .xlsx con `fflate` (sin librería
  nueva): textos en línea, encabezado en negrita y fijo, anchos de columna,
  formatos de número. Los porcentajes se guardan como Excel los entiende
  (14,5 % = 0,145 con formato %), así que al volver a cargarlos con "Cargar
  Excel" dan lo mismo (hay prueba de ida y vuelta).
- `src/lib/respaldo.ts` arma las hojas. Los nombres de hoja se limpian
  (sin `[]:*?/\`, hasta 31 caracteres, sin repetir).
- Es un respaldo para leer y para recargar datos; la copia que se importa tal
  cual sigue siendo la .json.
- Lee lo guardado en la base: un cambio de hace un segundo que todavía se está
  guardando puede no salir.

### Historial de versiones

- Pantalla `/p/[id]/historial`: copias agrupadas por día, la más reciente
  arriba, con hora, nombre, cantidad de diapositivas y meses, y tres
  acciones: **Ver**, **Volver a esta** (pide confirmar) y descargar la copia
  como .json. Arriba, "Guardar una copia de cómo está ahora" con un nombre.
  Abajo, cuánto ocupan las copias en la base.
- **Ver** abre `/p/[id]/version/[version]`: el visor normal con la copia, sin
  Editar ni Más, con una franja que dice qué copia es y los botones
  "Historial" y "Volver a esta copia". `usarEdicion(..., { seguir: false })`
  evita que el visor se "actualice" con la presentación actual.
- **Volver a una copia** (`POST .../versiones/[version]/restaurar`): en una
  sola sentencia guarda el estado actual como copia `restauracion` (con la
  nota "Antes de volver a la copia del ...") y pone el contenido de la copia
  (validado). Así restaurar también se deshace desde el historial. Quien
  tenga la presentación abierta en otra pestaña recibe el cambio al volver a
  ella (sube la revisión).
- Copias con nombre: motivo `manual`. No se borran solas (el tope de 150 solo
  borra `auto`). Una copia con nombre cuenta como copia reciente: la
  automática siguiente llega a los 10 minutos.
- Almacén: `listarVersiones`, `obtenerVersion`, `guardarVersion`,
  `restaurar`. Columna nueva `nota` (`alter table ... add column if not
  exists`, se agrega sola al publicar).
- Fechas en hora de Colombia (`src/lib/fechas.ts`): el servidor corre en UTC.

### Comparar con otro mes

- Botón **Comparar** (o tecla `C`): la diapositiva actual en dos meses, lado a
  lado en pantallas anchas y una encima de otra en el celular. Por defecto el
  mes anterior al que se está viendo; con la lista de arriba se elige
  cualquier otro. El mes más antiguo va a la izquierda.
- Al cambiar de mes en la barra, el "mes anterior" se mueve con él; si se
  eligió un mes a mano, se queda ese.
- Funciona también al **Presentar** (las dos diapositivas sobre fondo oscuro)
  y mientras se edita: se edita el mes elegido en la barra y se ve el otro al
  lado.
- El enlace lo guarda: `?comparar=anterior` o `?comparar=2026-08`.
- Al comparar se esconde la lista de diapositivas de la izquierda para dar
  espacio.

### Archivos

- `src/lib/excel/escribir.ts`, `src/lib/respaldo.ts`, `src/lib/fechas.ts`,
  `src/lib/versiones.ts` (nombre de cada copia).
- `src/app/api/presentaciones/[id]/excel/route.ts`,
  `.../versiones/route.ts`, `.../versiones/[version]/route.ts`,
  `.../versiones/[version]/restaurar/route.ts`.
- `src/app/p/[id]/pdf/page.tsx`, `src/app/p/[id]/historial/page.tsx`,
  `src/app/p/[id]/version/[version]/page.tsx`.
- `src/components/visor/Impresion.tsx`, `MenuMas.tsx`;
  `src/components/historial/Historial.tsx`; Visor (Comparar, franja de copia).
- Pruebas: `pruebas/respaldo.prueba.ts`, `pruebas/historial.prueba.ts`.

### Cómo se comprobó

- 187 pruebas automáticas (9 nuevas: escritor de Excel, respaldo, historial
  en la base local).
- El respaldo se abrió con openpyxl y LibreOffice.
- En navegador (escritorio y celular): PDF de 9 diapositivas con Playwright;
  Comparar, Comparar al presentar y Comparar editando; menú Más y descarga
  del Excel; guardar copia con nombre, verla, volver a ella y ver la copia
  "Antes de volver..." arriba del historial.

### Pendiente o posible más adelante

- El uso real de espacio de las copias en Neon se ve ahora al final del
  historial; revisarlo tras unos meses de uso.
- Borrar copias con nombre a mano (hoy no se puede, a propósito).
- Safari en iPhone puede no respetar el tamaño de hoja del PDF; en escritorio
  (Chrome, Edge) sí.

## Mejoras del 2026-11-17 (después de la etapa 5)

Pedidas por la usuaria el mismo día, después de probar la etapa 5.

### Diapositivas quitadas

- Al quitar una diapositiva, queda guardada en la presentación
  (`Presentacion.guardadas`, la más reciente primero, tope 60) con copia de
  los conjuntos que usaba, cuándo se quitó y la diapositiva que tenía antes.
- En el panel, pestaña Diapositiva: "Diapositivas quitadas (N)", con
  miniatura, "Poner aquí" (después de la que se está viendo) y "Borrar para
  siempre".
- Volver a ponerla (`opsVolverAPoner`, en `portapapeles.ts`): si sus ids
  siguen libres vuelve tal cual, conectada a los conjuntos que todavía existen
  (así sigue recibiendo los datos de cada mes); los que se borraron vuelven
  desde la copia. Si algún id está ocupado entra como copia, con ids nuevos
  (el mismo camino que Pegar). `idsEnUso` cuenta también los ids de las
  guardadas, para que no se reusen.
- Operaciones nuevas: `guardada.poner` y `guardada.quitar`. Deshacer el quitar
  devuelve la diapositiva y la saca de la lista.

### Colores

- Bloque: `colorFondo` y `colorTexto` (#RRGGBB), operación `bloque.colores`.
  El color de fondo manda sobre el estilo de fondo (tinte, recuadro, oscuro).
  Sobre un fondo oscuro, si no se eligió letra, va blanca (`esOscuro`, con el
  contraste de `color.ts`). La letra se aplica con la clase `vp-color-texto`
  y la variable `--vp-texto`; los gráficos conservan su tinta.
- Diapositiva: `fondo` (#RRGGBB), operación `diapositiva.fondo`. Si es
  oscuro, los textos pasan a blanco (el panel avisa si hay gráficos).
- Palabras de color: en textos, tarjetas y títulos de diapositiva se escribe
  `{azul:así}` o `{#1A3D7C:así}` (`src/lib/formatoTexto.ts`; colores con
  nombre: magenta, azul, naranja, verde, morado, dorado, rojo, gris). En el
  panel hay botones de negrita y colores arriba del cuadro: se selecciona y
  se toca. No pisan la marca de viñeta "- " ni la de "# ". Las listas y el
  respaldo muestran el texto sin marcas (`sinFormato`).
- Selectores: `src/components/editor/Colores.tsx` (muestras sugeridas y "otro
  color").

### Presentar: rueda y arrastre

- En modo presentar, la rueda del mouse o el panel táctil (arriba, abajo o a
  los lados) pasan de diapositiva: un gesto, una diapositiva (se bloquea hasta
  260 ms sin movimiento, porque el panel táctil sigue mandando eventos). Si
  la rueda cae sobre una tabla que todavía se puede desplazar, se desplaza la
  tabla (`dentroDeDesplazable`).
- Arrastrar con el mouse (más de 80 px): a la izquierda o hacia arriba, la
  siguiente. En el celular también se desliza hacia arriba o abajo.

### PDF: descarga directa, hojas que crecen y detalle fijo

| Tema | Decisión | Por qué |
|---|---|---|
| Cómo se arma | "Descargar PDF" dibuja cada diapositiva en el navegador (`modern-screenshot`, a 2x, JPEG 92 %) y arma el archivo con `pdf-lib`. Se descarga directo con el nombre "Presentación - Mes Año.pdf". Las dos librerías se cargan solo al pedir el PDF. | La ventana de imprimir ponía el enlace, la fecha y márgenes en los bordes, según cada navegador. Así sale igual en todos, sin nada en los bordes. El texto queda como imagen (no se selecciona); para eso sigue el botón "Imprimir". |
| Diapositivas que no caben | La página mide las cajas con desplazamiento (tablas largas, textos al mínimo) y agranda la diapositiva hasta que no se desborde (pasadas de medir y crecer, tope 3x de ancho y 6x de alto). Opción "Si una no cabe": hoja más larga (por defecto) o achicarla dentro de la hoja normal. | Una tabla como Benchmarking CDATs se veía cortada. |
| Imprimir | Sigue, con un tamaño de página por hoja (`@page vp-hoja-N`). | Para quien necesite el texto seleccionable. |
| Detalle fijo | En el PDF (contexto `DetalleFijo`), los gráficos de Grafico.tsx escriben debajo lo que sale al pasar el mouse: de la entidad resaltada (Presente) o, si no hay, del último dato; con las series, las columnas de detalle y la de debajo de cada barra. Solo si hay cifras que el dibujo no muestra. Opción por gráfico `detalleFijo` ("Mostrar siempre debajo las cifras de...") para verlo también en pantalla. | Sin mouse, en el PDF no se veían los desembolsos ni el número de desembolsos de Presente, solo la tasa. |

Se comprobó con la presentación real en la copia local: 25 hojas, las
diapositivas 11 y 20 (CDATs) en hoja más larga, unos 6 MB, unos 20 segundos.

## Ajustes del 2026-11-18

### Plantilla de la Ley de Rescate

- **2026-11-19: pasó a la versión 3** del prototipo de la usuaria
  (`ley-rescate-slide-v3.html`), que reemplaza a la v2: fila "Qué es" con los
  cinco ejes del proyecto, cifras nuevas (ajuste fiscal a 2030, deuda neta
  del GNC, intereses / recaudo, TRM), gráfico "lo que proponía el texto
  radicado" con hogar y vehículo y el anuncio del 18-nov, la lectura de
  Seguros Presente como nota del gráfico, y los textos nuevos del mercado y
  del sector. Las fuentes van como nota bajo las cifras (abajo no cabían).
  Columna derecha de 6 columnas. Las presentaciones ya creadas con la v2 no
  cambian.
- Para que entrara: las notas de bloque admiten hasta 600 caracteres (antes
  200, igual que el título), negrita y colores, y en el panel tienen cuadro de
  dos renglones con los botones de formato. En gráficos de barras con 12
  categorías o menos, todas las etiquetas del eje se ven, en renglones (antes
  Recharts escondía las que no cabían en una línea).
- (v2) "Nueva presentación" → "Partir de: Colombia: Ley de Rescate Económico"
  (`presentacionLeyRescate` en `nueva.ts`, clave `ley-rescate`): portada, la
  diapositiva y cierre. Pasada a bloques desde el prototipo de la usuaria
  (`ley-rescate-slide-v2.html`): franja de cifras (filas 1-2), gráfico de
  barras del IVA de pólizas y seguros en cada versión del proyecto (Hoy,
  texto radicado, tras ajustes del 18-nov; seguro agropecuario tras ajustes
  vacío, "por confirmar"), texto de Fasecolda y fuentes, recuadro rosado
  "Cómo reaccionó el mercado" y recuadro oscuro "Qué implica para las
  entidades financieras". Disposición libre.
- Datos públicos de prensa y fuentes oficiales citadas en la diapositiva;
  no son datos de Presente.
- Se pasa al comité con Copiar y Pegar, como la de Paraguay.

### Papelera de presentaciones

- Ya existía (eliminar marca `eliminado`; nada se borra para siempre). Ahora:
  al eliminar, el inicio muestra un aviso con **Deshacer**; la papelera se
  abre sola en ese momento; y si está vacía se dice que existe.

### Ocultar diapositivas

- `Diapositiva.oculta`, operación `diapositiva.oculta`. Una oculta sigue en
  la presentación y se ve y edita normal (tachada en la lista, con un aviso
  "Oculta al presentar · Mostrar" bajo la diapositiva).
- Al presentar se salta (rueda, flechas, deslizar); si se empieza parado en
  una oculta, va a la siguiente que se vea. El contador y el número del pie
  cuentan solo las que se ven.
- El PDF no las incluye, salvo "Incluir las ocultas" o pedir justo esa.
- Botones: el ojo al pasar el mouse por cada diapositiva de la lista (al
  editar) y el ojo de la fila de acciones del panel.

### Mover bloques en la diapositiva

- Al editar una diapositiva de contenido, cada bloque tiene un marco
  (`MoverBloques.tsx`): se arrastra para moverlo y se tira de los bordes o
  esquinas para cambiar su tamaño. Mientras se arrastra se ve la cuadrícula y
  dónde va a quedar. Con el bloque elegido: "Editar" (lleva a su tarjeta del
  panel) y quitar. Con el teclado: flechas mueven, Mayúscula + flechas
  cambian el tamaño.
- Se acomoda a la cuadrícula libre de 12 x 8. Si la diapositiva no era libre
  pasa a serlo con todo donde estaba (`opsUbicarBloque`, `lugaresLibres`).
- **La cuadrícula libre ahora tiene siempre 8 filas** (antes, las filas
  usadas). Así lo que se ve es lo que se arrastra. La plantilla de Paraguay
  pasó a usar las 8; una copia vieja de ella puede tener la última fila vacía.
- Barra **Insertar** sobre la diapositiva: cuadro de texto, gráfico, tabla,
  cifras, tarjetas (`opsInsertarBloque`): va al primer lugar libre
  (`lugarLibre`, de 6x3 hacia abajo); si no hay, achica lo que llega hasta
  abajo para dejar las 2 últimas filas (`hacerLugar`). "Agregar bloque" del
  panel también usa el primer lugar libre.
- Los bloques llevan `data-vp-bloque` y el cuerpo `data-vp-cuerpo`: con eso
  se miden los marcos.

### Tipos de letra

- La de siempre es **Figtree** (la de toda la herramienta y del prototipo de
  la usuaria): queda por defecto. `src/lib/fuentes.ts`: Figtree, Inter,
  Montserrat, Poppins, Lato, Open Sans, Roboto, Nunito, Raleway, DM Sans,
  Manrope, Source Serif, Merriweather, Lora, Playfair Display (paquetes
  @fontsource, instalados con la aplicación; el navegador baja solo la que
  se usa) y Arial, Calibri y Georgia del computador.
- `Tema.fuente` (Presentación → "Tipo de letra de las diapositivas") y
  `Bloque.fuente` (en el bloque, operación `bloque.letra`). Los textos se
  vuelven a ajustar al cambiar o terminar de cargar la letra, y los ejes de
  los gráficos se miden con ella (`FuenteActual`, `usarFuenteMedida`).

### Otros

- Cifras: el número se achica para caber en una línea y en el alto de su
  caja (antes se salía en franjas bajas).
- Gráficos de barras con valores en la punta: margen arriba para que el
  valor más alto no se corte.
- `next dev` con Turbopack se recargaba en bucle en este entorno después de
  instalar paquetes; `npx next dev --webpack` no. La compilación de Vercel no
  se ve afectada.

## Cuadrícula fina (2026-11-19)

La usuaria pidió casillas más chicas: con 12 x 8 los bloques saltaban de a
mucho, quedaban muy grandes o muy chicos y sobraba espacio.

- La disposición libre usa ahora **48 columnas x 32 filas** (cuatro veces
  más fina en cada sentido). Un paso es ~25 px a lo ancho y ~15 px a lo alto
  (antes ~98 y ~58).
- Sin huecos entre casillas: cada bloque deja medio espacio a cada lado
  (`MEDIO_X` 14 px, `MEDIO_Y` 7 px, en Diapositiva.tsx) y la cuadrícula se
  estira ese medio espacio por fuera del cuerpo. Así los bordes siguen
  alineados con el título y entre vecinos quedan 28 x 14 px, como antes.
- Tamaño mínimo de un bloque al arrastrar: 3 x 3 casillas finas.
- Mientras se arrastra se ven líneas finas en cada casilla y más marcadas
  cada 4. El minimapa del panel es un solo dibujo (tocar lleva el bloque
  ahí); los números van de 1 a 48 y de 1 a 32.
- **Paso de lo que ya existía** (`src/lib/rejilla.ts`): las diapositivas con
  ubicaciones y sin `rejilla: 'fina'` son de la cuadrícula vieja; cada
  casilla vieja pasa a 4 x 4 finas, así todo queda donde estaba. Se hace al
  leer de la base (`bd.ts`), en `validarPresentacion` (importar, crear,
  restaurar), al aplicar `diapositiva.poner` y `guardada.poner` (pegar una
  copia vieja del portapapeles, volver a poner una guardada) y en la muestra.
  Al guardar el primer cambio, la base queda con la fina.
- `bloque.aspecto` y `bloque.poner` con ubicación marcan la diapositiva como
  fina (`marcadaFina`) antes de poner la ubicación nueva. Las diapositivas
  sin ubicaciones no se marcan (no hay nada que pasar).
- Las medidas de `disposicion.ts` (al pasar a libre, lugar libre, hacer
  lugar) se piensan en casillas viejas y se multiplican (`C`, `F`).
- Plantillas: la de la Ley de Rescate sigue escrita en 12 x 8 y se pasa al
  crearla; la de Paraguay va escrita en la fina (`rejilla: 'fina'`) para que
  las condiciones quepan.
- Una pestaña abierta desde antes del cambio puede mandar una ubicación
  vieja; hay que recargarla (se recarga sola al volver a ella si alguien
  guardó).

## Cómo trabajar

```
npm install
npm run dev        # http://localhost:3000
npm run tipos      # revisar tipos
npm run prueba     # pruebas automáticas (operaciones, validación, base de datos)
npm run build      # compilar como en producción
npm run semilla    # regenerar la presentación de muestra (datos inventados)
```

Para probar la versión compilada: `npm run build` y luego `npx next start`.
Antes de volver a compilar hay que detener el servidor anterior.

- `npm run dev` guarda en una base local dentro de `.datos-locales/` (se crea
  sola, con la muestra). Ahí sí aparece "Editar" y se puede probar todo sin
  conexión. Para empezar de cero, detener el servidor y borrar esa carpeta.
- `npx next start` sin `DATABASE_URL` se comporta como el sitio publicado antes
  de conectar la base: muestra de solo lectura, sin "Editar".

## Publicación en Vercel

1. En vercel.com, entrar con la cuenta de GitHub y elegir "Add New > Project".
2. Importar `presente-visualizacion/visualizacion-presente`. Vercel detecta
   Next.js; no hay que cambiar nada. Publicar.
3. Desde la etapa 2A: crear la base de datos y conectarla al proyecto. Los
   pasos exactos están en "Lo que hace la usuaria en Vercel", dentro del diseño
   de la etapa 2A.

Cada vez que se sube código a la rama `main`, Vercel publica solo.

## Notas para la migración (etapa 4)

Hecha: ver "Diseño de la etapa 4". El importador vive en
`src/lib/migracion/original.ts` y en el inicio ("Importar la presentación
anterior"); `scripts/migrar-original.mjs` lo corre sin pantalla contra el
respaldo de `referencia/` y deja el resultado en `referencia/salida/`.
