# Balance Cambiario Argentino — Dashboard & Comparador

Aplicación web (Next.js 14 + TypeScript + Tailwind CSS + Plotly.js) para visualizar la
evolución del **Balance Cambiario de Argentina** (Mercado Único y Libre de Cambios, BCRA), con:

- **Dashboard** con 8 minigráficos de las series más relevantes: Cuenta Corriente, Cuenta
  Financiera, Formación de Activos Externos (FAE), Inversión Extranjera Directa (IED),
  Utilidades y Dividendos, Deuda Financiera Privada, Deuda Comercial y Balance de Bienes.
- **Comparador de Series**: acceso a esas 8 series destacadas **y también a todos los demás
  conceptos del Excel** (+50), organizados en un árbol por Cuenta → Subcuenta → Concepto.
  Cada serie se puede graficar como línea suavizada, línea con marcadores, línea
  discontinua, área suavizada, área apilada, columna, columna apilada o columna 100%
  apilada, con soporte de eje secundario.
- **Selector de fechas global** (Desde/Hasta) visible en el Dashboard y el Comparador, con
  valor por defecto **enero 2023 → último dato disponible**.
- Estilo visual **institucional** (estilo FMI / Banco Mundial / BID / Fed), portado 1:1
  desde `chart_style.py`.

## 🔄 Cómo actualizar los datos (sin programar, sin terminal)

Cuando el BCRA publique una planilla nueva, **no hace falta correr nada en tu computadora**.
Todo el procesamiento corre solo, dentro del build de Vercel:

1. Andá a tu repositorio en **github.com** (en el navegador).
2. Entrá a la carpeta `data/`.
3. Hacé click en el archivo `mercado-cambios-balance-cambiario.xlsx` → botón **"..."** (o el
   ícono de lápiz) → **"Upload files"** / **"Replace this file"**.
4. Arrastrá el Excel nuevo (tiene que llamarse **exactamente igual**:
   `mercado-cambios-balance-cambiario.xlsx`) y confirmá el commit directo a `main`
   ("Commit directly to the main branch").
5. Listo. Si el repo ya está conectado a Vercel, eso dispara un deploy automático: Vercel
   instala las dependencias, corre el script que reprocesa el Excel
   (`scripts/aggregate.mjs`, como paso `prebuild`) y publica el sitio con los datos nuevos
   en unos minutos. No necesitás instalar Python, ni Node, ni abrir una terminal.

> Podés seguir el progreso del deploy en la pestaña **"Deployments"** de tu proyecto en
> Vercel.

### ¿Y si quiero probarlo en mi computadora antes de subirlo?

Si en algún momento un desarrollador quiere correrlo local: reemplazá el Excel en `data/`,
corré `npm install` y `npm run dev` (o `npm run build`) — el script de agregación se
ejecuta solo, como parte de esos comandos (`predev` / `prebuild` en `package.json`).

## 📁 Estructura del proyecto

```
balance-cambiario-argentina/
├── data/
│   └── mercado-cambios-balance-cambiario.xlsx   # ← reemplazar este archivo para actualizar
├── scripts/
│   ├── aggregate.mjs          # Genera src/data/balance_cambiario.json (corre solo en cada build)
│   ├── aggregate.py           # Misma lógica en Python (referencia / uso manual opcional)
│   └── chart_style_original.py
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout raíz (NavBar + selector de fechas + Footer)
│   │   ├── page.tsx            # Dashboard (8 minigráficos)
│   │   ├── globals.css
│   │   └── comparador/
│   │       └── page.tsx        # Comparador de series (graficador multivariable)
│   ├── components/
│   │   ├── PlotlyChart.tsx         # Wrapper cliente de react-plotly.js
│   │   ├── MiniChartCard.tsx       # Tarjeta de minigráfico del dashboard
│   │   ├── ComparadorChart.tsx     # Gráfico combinado del comparador
│   │   ├── SeriesPicker.tsx        # Selector: indicadores principales + árbol de detalle
│   │   ├── SelectedSeriesRow.tsx   # Config por serie (tipo de gráfico, eje)
│   │   ├── RangoFechasBar.tsx      # Selector global de fechas (Desde/Hasta)
│   │   ├── NavBar.tsx
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── chartStyle.ts          # Port de chart_style.py (paleta, layout, traces)
│   │   ├── data.ts                # Acceso a los datos + recorte por rango de fechas
│   │   ├── seriesMeta.ts          # Metadatos de las 23 series curadas (compuestas)
│   │   ├── detalleSeries.ts       # Metadatos AUTO-generados del detalle completo
│   │   ├── catalogo.ts            # Fachada única (usá esta desde los componentes)
│   │   ├── rangoFechasContext.tsx # Contexto React del selector de fechas
│   │   └── useOnClickOutside.ts
│   ├── data/
│   │   └── balance_cambiario.json   # Generado por scripts/aggregate.mjs — no editar a mano
│   └── types/
│       └── index.ts
├── package.json
├── tailwind.config.ts
├── next.config.mjs
└── tsconfig.json
```

## 🚀 Desarrollo local (opcional, para desarrolladores)

Requisitos: Node.js ≥ 18.18.

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). El comando `predev` regenera
automáticamente `src/data/balance_cambiario.json` a partir del Excel en `data/` antes de
levantar el servidor.

```bash
npm run build   # regenera los datos (prebuild) y compila para producción
npm run start   # sirve el build de producción localmente
```

> **Nota:** este proyecto fue generado en un entorno sin acceso a internet, por lo que
> `npm install` / `npm run build` no pudieron ejecutarse ni verificarse localmente antes de
> la entrega. El código fue escrito cuidando la compatibilidad con Next.js 14 / React 18 /
> Plotly.js 2.x / xlsx (SheetJS), pero se recomienda correr `npm run build` una vez
> clonado el repo y, si aparece algún error de tipos menor, quitar la opción
> `typescript.ignoreBuildErrors` en `next.config.mjs` (se dejó activada como salvaguarda) y
> corregirlo.

## 🧮 Cómo se generan las series

`scripts/aggregate.mjs` lee el Excel fila por fila (apertura mensual por sector y
concepto) y produce dos catálogos, guardados en `src/data/balance_cambiario.json`:

1. **`series` (curadas, ~23)**: indicadores compuestos armados a mano combinando varios
   conceptos (ver tabla abajo). Estos SÍ requieren mantenimiento si el BCRA cambia
   drásticamente los nombres de categoría.
2. **`detalle` (auto, ~60 y creciendo)**: **un id por cada concepto único que aparezca en
   el Excel**, sin ninguna curación. Este catálogo se regenera solo — si el mes que viene
   el BCRA agrega una categoría nueva, en el próximo build aparece sola en el Comparador,
   dentro de su Cuenta → Subcuenta correspondiente, sin tocar código.

Los importes originales están en USD; se expresan en **millones de USD**, con signo
(ingresos +, egresos −).

Algunas de las series curadas son **construcciones propias (proxy)**, porque no existe una
única línea 1:1 publicada por el BCRA bajo ese nombre exacto:

| Serie | Cómo se construye |
|---|---|
| **Formación de Activos Externos (FAE)** | Billetes y divisas (compra/venta sin fines específicos) + "Otras inversiones" de esa misma apertura, con el signo invertido para que positivo = compra neta de divisas por el sector privado. |
| **Deuda Financiera Privada / Pública** | Préstamos financieros, títulos de deuda y líneas de crédito, separando por la columna `Sector` (`Sector Público` vs. el resto). |
| **Deuda Comercial** | Prefinanciaciones de exportaciones del exterior + financiaciones locales de exportaciones + cobros anticipados de exportaciones, netos de pagos diferidos de importaciones y otros egresos de bienes. |
| **Balance de Bienes** | Cobros de exportaciones menos pagos de importaciones liquidados por el mercado de cambios (base caja, no coincide necesariamente con el balance comercial aduanero por devengado). |

El detalle completo de cada serie curada está en `src/lib/seriesMeta.ts` (campo
`descripcion`) y se muestra también como tooltip en el propio selector de la app.

## ☁️ Deploy

### 1) Subir el proyecto a GitHub (una sola vez)

```bash
cd balance-cambiario-argentina
git init
git add .
git commit -m "Balance Cambiario Argentino: dashboard + comparador de series"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/balance-cambiario-argentina.git
git push -u origin main
```

### 2) Deploy en Vercel (una sola vez)

1. Entrá a [vercel.com/new](https://vercel.com/new) e importá el repo de GitHub.
2. Framework Preset: **Next.js** (se detecta automáticamente).
3. Build Command / Output: dejalos en default (`npm run build` / `.next`).
4. Deploy. No requiere variables de entorno.

A partir de acá, **cada actualización del Excel en GitHub redeploya sola** (ver sección de
arriba) — no hace falta repetir el paso 2.

No hay backend ni base de datos: todo el dataset viaja embebido en el bundle estático, así
que el deploy es tan simple como el de cualquier sitio Next.js estático.

## 🎨 Estilo visual

El estilo institucional vive en `src/lib/chartStyle.ts`, portado directamente desde
`chart_style.py`: misma paleta (`#1F3864`, `#2E86AB`, `#A6A6A6`, `#D97706`, `#6B7280`,
`#8FBFE0`), misma tipografía (Arial/Helvetica), mismo layout de título + subtítulo
alineado a la izquierda, grilla horizontal únicamente, leyenda horizontal en negro y nota
al pie con la fuente y la fecha de corte del dato.

## 📄 Licencia de los datos

Los datos provienen de información pública difundida por el BCRA. Este repositorio
contiene el Excel fuente (para que el pipeline automático funcione) y el código de la
aplicación.
