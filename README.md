# Visualización Presente

Herramienta web para crear y presentar informes con datos por mes.

El plan completo, las decisiones tomadas y el estado de cada etapa están en
[PLAN.md](PLAN.md).

## Empezar

```
npm install
npm run dev
```

Abre http://localhost:3000.

## Qué hay hoy (etapas 1 a 4)

- Lista de presentaciones y visor.
- Barra de meses: al elegir un mes cambia toda la presentación.
- Diapositivas de portada, contenido y cierre, con gráficos interactivos,
  tablas, textos, cifras y tarjetas. Nueve tipos de gráfico: líneas, barras, barras
  horizontales, área, combinado (barras y línea), circular, dispersión, radar y
  cascada.
- Modo presentación en pantalla completa, navegación con teclado y versión
  para celular.
- **Clave**: si la variable `CLAVE_EDICION` está en Vercel, el sitio pide la
  clave antes de mostrar o editar nada (ver "Acceso" en PLAN.md).
- **Edición** (en computador): botón "Editar" con un panel para cambiar el
  nombre de la presentación, títulos, textos, cifras y los datos de gráficos y
  tablas, con pegado directo desde Excel. También agregar, duplicar, mover y
  quitar diapositivas y bloques; elegir tipo de gráfico, series y colores;
  columnas de los datos; colores del tema; "Nuevo mes" y quitar un mes. Se
  guarda solo; hay deshacer y rehacer.
- **Cargar desde Excel** (.xlsx o CSV): crear un gráfico o una tabla desde un
  archivo, o actualizar los datos de uno que ya existe en cualquier mes (o en
  un mes nuevo). Se elige la hoja, los encabezados y las columnas, con vista
  previa. La herramienta recuerda de dónde salió cada columna y el mes
  siguiente lo propone sola. El archivo se lee en el navegador y no se sube.
- **Importar la presentación anterior** del Comité (etapa 4): desde el
  inicio se elige el archivo JSON de la original y se crea una presentación
  con sus 25 diapositivas y sus meses, todo editable. Para eso hay bloques y
  opciones nuevas: título y nota en cada bloque, cuadrícula, tarjetas, cifras
  que salen de los datos, tablas con secciones, encabezados agrupados,
  variación contra el mes anterior y posición calculadas, líneas punteadas y
  detalle bajo cada barra.
- Base de datos (Postgres de Neon conectado desde Vercel). Sin base conectada,
  el sitio publicado muestra la presentación de ejemplo en solo lectura.
- Una presentación de muestra del Comité de Precios con datos inventados.

Todavía no se puede crear presentaciones nuevas desde cero, descargar en PDF
o ver el historial (etapa 5).

## Pruebas

```
npm run prueba
```

## Datos

Este repositorio es público y solo contiene datos inventados: entidades y
cifras ficticias generadas con `npm run semilla`. Los datos reales no se suben
nunca; ver la sección "Datos reales" de [PLAN.md](PLAN.md).
