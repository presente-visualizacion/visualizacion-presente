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

## Qué hay hoy (etapas 1, 2A y 2B)

- Lista de presentaciones y visor.
- Barra de meses: al elegir un mes cambia toda la presentación.
- Diapositivas de portada, contenido y cierre, con gráficos interactivos,
  tablas, textos y cifras. Nueve tipos de gráfico: líneas, barras, barras
  horizontales, área, combinado (barras y línea), circular, dispersión, radar y
  cascada.
- Modo presentación en pantalla completa, navegación con teclado y versión
  para celular.
- **Edición** (en computador): botón "Editar" con un panel para cambiar el
  nombre de la presentación, títulos, textos, cifras y los datos de gráficos y
  tablas, con pegado directo desde Excel. También agregar, duplicar, mover y
  quitar diapositivas y bloques; elegir tipo de gráfico, series y colores;
  columnas de los datos; colores del tema; "Nuevo mes" y quitar un mes. Se
  guarda solo; hay deshacer y rehacer.
- Base de datos (Postgres de Neon conectado desde Vercel). Sin base conectada,
  el sitio publicado muestra la presentación de ejemplo en solo lectura.
- Una presentación de muestra del Comité de Precios con datos inventados.

Todavía no se puede cargar un archivo de Excel (etapa 3) ni crear
presentaciones nuevas, descargar en PDF o ver el historial (etapa 5).

## Pruebas

```
npm run prueba
```

## Datos

Este repositorio es público y solo contiene datos inventados: entidades y
cifras ficticias generadas con `npm run semilla`. Los datos reales no se suben
nunca; ver la sección "Datos reales" de [PLAN.md](PLAN.md).
