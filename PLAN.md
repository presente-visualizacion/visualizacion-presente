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
- **Clave antes de cargar datos reales.** Con la edición abierta, cualquiera
  que tenga el enlace del sitio puede ver y cambiar lo que haya en la base de
  datos. Y el enlace no es secreto: el repositorio es público y GitHub suele
  mostrar el enlace del sitio en la página del repositorio (sección
  "Deployments"). Mientras solo haya datos inventados no importa. Antes de
  cargar los datos reales (etapas 3 y 4) conviene decidir si se pone una clave;
  la etapa 2A deja el punto de control listo (ver "Acceso" en el diseño de la
  2A) y activarla después es un cambio pequeño.

## Etapas

- [x] **Etapa 1. Base.** Estructura, modelo de datos, diseño, diapositivas y
  bloques genéricos, visor con barra de meses, navegación, pantalla completa y
  versión móvil. Presentación de muestra (hoy con datos inventados).
- [ ] **Etapa 2. Editor (2A y 2B, ver "Qué modelo usar").** Base de datos y guardado. Modo edición: agregar,
  quitar, duplicar y reordenar diapositivas; editar títulos y textos; cambiar
  tipo de gráfico, series y colores; editar datos en una tabla; tema de la
  presentación; "Nuevo mes".
  - [ ] 2A. Base de datos, guardado y edición de datos, textos y títulos.
    **Diseñada el 2026-11-16, sin programar.** Ver "Diseño de la etapa 2A";
    los pasos 2A.1 a 2A.6 se marcan allí.
  - [ ] 2B. Agregar, quitar, duplicar y reordenar diapositivas; tipo de
    gráfico, series y colores; tema; "Nuevo mes".
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
  que más cuesta corregir si queda mal. Mejor con el modelo más capaz. Ya está
  diseñada: decir "lee PLAN.md y programa la etapa 2A siguiendo el diseño". Si
  el uso se acaba a mitad, en la conversación siguiente decir "lee PLAN.md y
  sigue la etapa 2A desde el primer paso sin marcar".
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

La etapa 2A agrega el almacén de base de datos (Postgres de Neon conectado
desde Vercel). El diseño completo está en "Diseño de la etapa 2A".

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

Diseñada el 2026-11-16 sobre el código de la etapa 1. **Nada de esto está
programado todavía.** Quien la programe sigue este diseño; si en el camino hay
que cambiar algo, se corrige aquí para que el plan y el código digan lo mismo.

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
- Etapa 5: pantalla del historial, crear, duplicar y borrar presentaciones.

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
  creado       timestamptz not null default now()
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
   coincide con el `porPeriodo` actual, la operación se rechaza.
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
  aplicar(id: string, revisionBase: number, ops: Operacion[]): Promise<ResultadoGuardado>;
  /** Para sembrar la muestra y, más adelante, importar (etapas 3 a 5). */
  crear(presentacion: Presentacion, motivo: 'importacion'): Promise<void>;
}
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
  carga con `import()` solo cuando hace falta y nunca en producción. Agregar
  `@electric-sql/pglite` a `serverExternalPackages` en `next.config.ts`.

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

Si PGlite da problemas dentro de `next dev`, plan B: usarlo solo en las pruebas
y dejar el desarrollo local con la muestra; no cambiar el resto del diseño.

### Rutas

| Ruta | Qué hace |
|---|---|
| `GET /api/presentaciones/[id]` | `{ presentacion, revision }`. Con `?solo=revision` devuelve solo el número. Con `?descargar=1` lo entrega como archivo `.json` (el enlace "Descargar copia"). |
| `POST /api/presentaciones/[id]/cambios` | Recibe `{ revisionBase, operaciones }`. Responde 200 con el `ResultadoGuardado`; 400 si no es válido; 403 sin permiso; 404 si no existe; 409 si quedó `ocupado`; 413 si pasa el tope de tamaño. |

- Las dos con `runtime = 'nodejs'` y sin caché.
- Páginas: `/` deja de generarse al compilar (`export const dynamic =
  'force-dynamic'`), porque la lista ahora sale de la base. `/p/[id]` ya es
  dinámica; envolver `obtener` con `cache()` de React para que
  `generateMetadata` y la página no consulten dos veces.
- Agregar `robots: { index: false, follow: false }` a los metadatos del
  `layout`, para que los buscadores no listen el sitio.

### Acceso

Archivo nuevo `src/lib/acceso.ts` con `puedeEditar(request): Promise<boolean>`.
Hoy devuelve siempre `true` (lo acordado: edita cualquiera con el enlace). La
ruta de guardado y el botón "Editar" preguntan **solo** ahí. Para poner clave
después: variable `CLAVE_EDICION` en Vercel, una pantalla que la pide y una
cookie; se cambia este archivo y nada más. No se programa en la 2A.

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
  2, 5, 15 y 30 segundos y sigue cada 30. Un 400 o un 413 no se reintenta:
  se muestra el error y se ofrece deshacer.
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
  - Celdas editables; Tab y Enter se mueven como en Excel; agregar fila,
    quitar fila, mover fila.
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
src/components/
  visor/Visor.tsx            (cambia) usa el hook, botón Editar, panel
  editor/usarEdicion.ts      estado, cola, guardado, deshacer
  editor/PanelEdicion.tsx    panel derecho
  editor/EditorTexto.tsx, EditorCifras.tsx, EditorDatos.tsx
  editor/EstadoGuardado.tsx  indicador
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

- [ ] **2A.1 Operaciones y validación.** `.gitignore`, `operaciones.ts`,
  `validar.ts`, `interpretarNumero` y sus pruebas. Sin pantallas ni base. La
  muestra debe pasar la validación.
- [ ] **2A.2 Base de datos.** Motor, esquema, almacén, siembra, las dos rutas,
  inicio dinámico, `robots`. Pruebas sobre PGlite: crear, guardar, choque de
  revisiones con reintento, copia cada 10 minutos, tope de copias. El sitio se
  ve igual que antes, pero ya lee de la base.
- [ ] **2A.3 Primer cambio de punta a punta.** Hook, indicador de guardado,
  botón "Editar", panel con título, subtítulo y nombre de la presentación.
- [ ] **2A.4 Textos y cifras**, con "igual en todos los meses / propio de cada
  mes" y "Copiar del mes anterior".
- [ ] **2A.5 Editor de datos**: cuadrícula y pegado desde Excel.
- [ ] **2A.6 Cierre.** Deshacer y rehacer, reintentos, aviso al cerrar,
  recarga al volver a la pestaña, "Descargar copia". Revisión en navegador,
  actualizar `README.md` y este plan.

### Cómo se comprueba que quedó bien

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

- **Edición abierta y datos reales.** Ver "Pendiente de decidir". Mientras no
  haya clave, cualquiera con el enlace puede cambiar los datos; el historial
  permite recuperarlos, pero no impide que los vean.
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
3. Desde la etapa 2A: crear la base de datos y conectarla al proyecto. Los
   pasos exactos están en "Lo que hace la usuaria en Vercel", dentro del diseño
   de la etapa 2A.

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
