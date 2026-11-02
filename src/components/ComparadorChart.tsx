"use client";

import { useCallback, useMemo, useState } from "react";
import type { Config, Data, Layout } from "plotly.js";
import PlotlyChart from "./PlotlyChart";
import {
  colorDe,
  colorEtiqueta,
  crearTrazo,
  esTipoBarra,
  estilizarLayout,
  etiquetasMilesMillones,
  ticksEjeX,
} from "@/lib/chartStyle";
import { getMeses, formatMesesEje, recortarPorRango, formatMes } from "@/lib/data";
import { serieMetaDe, getValoresSerie } from "@/lib/catalogo";
import { useRangoFechas } from "@/lib/rangoFechasContext";
import { SerieMeta, SerieSeleccionada } from "@/types";

const TITULO_GRAFICO = "Balance Cambiario - BCRA";
const FUENTE_DERECHA = "Fuente: EconSur en base a BCRA";
/** Tamaño de la imagen PNG exportada: cuadrada (1:1). Se exporta al doble de resolución (scale 2) → 2160 × 2160 px. */
const LADO_PNG = 1080;
const ESCALA_PNG = 2;
/** Máximo de etiquetas de valores por serie, para que el gráfico siga siendo legible con series largas. */
const MAX_ETIQUETAS = 14;

/** Config del gráfico en pantalla: se quita el botón de cámara de Plotly (la exportación oficial es el botón "Exportar PNG 1:1"). */
const CONFIG_GRAFICO: Partial<Config> = {
  modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d", "toggleSpikelines", "toImage"],
};

interface ComparadorChartProps {
  seleccion: SerieSeleccionada[];
  /**
   * Resolutores opcionales de metadatos/valores. Por defecto usan el
   * catálogo general (series curadas + detalle). La solapa "Comparar por
   * Sector" pasa sus propios resolutores (con datos filtrados por sector)
   * para no tener que importar acá el JSON pesado de sectores.
   */
  obtenerMeta?: (id: string) => SerieMeta;
  obtenerValores?: (id: string) => number[];
  /** Prefijo del nombre de los archivos descargados, CSV y PNG (sin extensión). */
  nombreArchivoCSV?: string;
  /** Subtítulo del gráfico: el sector seleccionado, o "Total de todos los sectores" en el comparador general. */
  subtitulo?: string;
}

export default function ComparadorChart({
  seleccion,
  obtenerMeta = serieMetaDe,
  obtenerValores = getValoresSerie,
  nombreArchivoCSV = "balance-cambiario",
  subtitulo = "Total de todos los sectores",
}: ComparadorChartProps) {
  const { rango } = useRangoFechas();
  const [exportando, setExportando] = useState(false);

  const { meses, valoresPorId } = useMemo(() => {
    const mesesCompletos = getMeses();
    const valoresPorId = new Map<string, number[]>();
    let mesesRecorte: string[] = [];
    for (const s of seleccion) {
      const valoresCompletos = obtenerValores(s.id);
      const recorte = recortarPorRango(mesesCompletos, valoresCompletos, rango.desde, rango.hasta);
      mesesRecorte = recorte.meses; // igual para todas las series (mismo eje temporal)
      valoresPorId.set(s.id, recorte.valores);
    }
    return { meses: mesesRecorte, valoresPorId };
  }, [seleccion, rango.desde, rango.hasta, obtenerValores]);

  const ejeX = useMemo(() => formatMesesEje(meses), [meses]);
  const hasta = meses.length ? formatMes(meses[meses.length - 1]) : "";

  const hay100pct = seleccion.some((s) => s.tipo === "Columna vertical 100% apilada");
  const usaEjeSecundario = hay100pct || seleccion.some((s) => s.ejeSecundario);

  const barmode: Layout["barmode"] = useMemo(() => {
    const tieneApilada = seleccion.some(
      (s) => s.tipo === "Columna vertical apilada" || s.tipo === "Columna vertical 100% apilada"
    );
    const tieneNormal = seleccion.some((s) => s.tipo === "Columna vertical");
    if (tieneApilada) return "stack";
    if (tieneNormal) return "group";
    return undefined;
  }, [seleccion]);

  /** Arma los traces. `exportar` agranda las etiquetas de valores para la imagen PNG. */
  const construirData = useCallback(
    (exportar: boolean) => {
      let avisoForzado = false;

      // Para "Columna vertical 100% apilada": normalizamos entre sí las series marcadas con ese tipo.
      let totalesPorMes: number[] | null = null;
      if (hay100pct) {
        const series100 = seleccion.filter((s) => s.tipo === "Columna vertical 100% apilada");
        totalesPorMes = meses.map((_, i) =>
          series100.reduce((acc, s) => acc + Math.abs(valoresPorId.get(s.id)?.[i] ?? 0), 0)
        );
      }

      const traces: Partial<Data>[] = seleccion.map((s, indice) => {
        const meta = obtenerMeta(s.id);
        const color = colorDe(indice);
        const valoresOriginales = valoresPorId.get(s.id) ?? [];

        let valores = valoresOriginales;
        let yaxis: "y" | "y2" = s.ejeSecundario ? "y2" : "y";
        let hoverFmt = ",.1f";

        if (s.tipo === "Columna vertical 100% apilada" && totalesPorMes) {
          valores = valoresOriginales.map((v, i) => {
            const total = totalesPorMes![i];
            return total > 0 ? (Math.abs(v) / total) * 100 : 0;
          });
          yaxis = "y"; // el eje primario queda reservado para el 100%
          hoverFmt = ",.1f";
        } else if (hay100pct) {
          // Si conviven series 100% apiladas con otras, el resto pasa al eje secundario
          // para no distorsionar la escala porcentual del eje primario.
          if (yaxis === "y") avisoForzado = true;
          yaxis = "y2";
        }

        // Etiquetas: siempre con el valor ORIGINAL en miles de millones de USD
        // (también en columnas 100% apiladas, donde la altura de la barra es el %).
        const etiquetas = s.mostrarEtiquetas
          ? etiquetasMilesMillones(valoresOriginales, MAX_ETIQUETAS)
          : undefined;
        const posicionTexto = esTipoBarra(s.tipo)
          ? barmode === "stack"
            ? "inside"
            : "outside"
          : indice % 2 === 0
          ? "top center"
          : "bottom center";

        return crearTrazo(s.tipo, ejeX, valores, meta.nombreCorto, color, {
          yaxis,
          hoverFmt,
          etiquetas,
          posicionTexto,
          tamanoTexto: exportar ? 15 : 11,
          colorTexto: colorEtiqueta(indice),
        });
      });

      return { traces, avisoForzado };
    },
    [seleccion, meses, ejeX, valoresPorId, hay100pct, obtenerMeta, barmode]
  );

  const { traces: data, avisoForzado: avisoEjeSecundarioForzado } = useMemo(
    () => construirData(false),
    [construirData]
  );

  /** Arma el layout. `exportar` usa tipografías/márgenes ampliados para la imagen cuadrada. */
  const construirLayout = useCallback(
    (exportar: boolean): Partial<Layout> => {
      const base = estilizarLayout({
        titulo: TITULO_GRAFICO,
        subtitulo,
        fechaCorte: hasta,
        fuenteDerecha: FUENTE_DERECHA,
        mostrarLeyenda: true,
        exportar,
      });
      const tamanoTitulo = exportar ? 16 : 12;
      const ticks = ticksEjeX(meses, ejeX, exportar ? 9 : 12);
      const l: Partial<Layout> = {
        ...base,
        barmode,
        xaxis: { ...base.xaxis, tickmode: "array", tickvals: ticks.tickvals, ticktext: ticks.ticktext },
        yaxis: {
          ...base.yaxis,
          ...(hay100pct
            ? { ticksuffix: "%", title: { text: "% del total", font: { size: tamanoTitulo } } }
            : { title: { text: "Millones de USD", font: { size: tamanoTitulo } } }),
        },
      };
      if (usaEjeSecundario) {
        l.yaxis2 = { ...base.yaxis2, title: { text: "Millones de USD (eje derecho)", font: { size: tamanoTitulo } } };
      }
      return l;
    },
    [subtitulo, hasta, barmode, meses, ejeX, hay100pct, usaEjeSecundario]
  );

  const layout = useMemo(() => construirLayout(false), [construirLayout]);

  const hayBarras = seleccion.some((s) => esTipoBarra(s.tipo));
  const hayEtiquetas = seleccion.some((s) => s.mostrarEtiquetas);

  const prefijoArchivo = `${nombreArchivoCSV}_${meses[0] ?? ""}_a_${meses[meses.length - 1] ?? ""}`;

  const descargarCSV = useCallback(() => {
    if (seleccion.length === 0 || meses.length === 0) return;

    const metas = seleccion.map((s) => obtenerMeta(s.id));
    const encabezado = ["Mes", ...metas.map((m) => m.nombre)];

    const escaparCsv = (valor: string) =>
      /[",;\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;

    const filas = meses.map((mes, i) => {
      const columnas = [mes, ...seleccion.map((s) => {
        const v = valoresPorId.get(s.id)?.[i];
        return v === undefined || Number.isNaN(v) ? "" : String(v);
      })];
      return columnas.map(escaparCsv).join(";");
    });

    const csv = [encabezado.map(escaparCsv).join(";"), ...filas].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prefijoArchivo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [seleccion, meses, valoresPorId, obtenerMeta, prefijoArchivo]);

  /**
   * Exporta el gráfico como PNG cuadrado (1:1). Se arma una figura aparte, con
   * tipografías y márgenes pensados para ese formato (no se "estira" el gráfico
   * de pantalla), y se renderiza a 1080 × 1080 px al doble de resolución.
   */
  const exportarPNG = useCallback(async () => {
    if (seleccion.length === 0 || meses.length === 0) return;
    setExportando(true);
    try {
      // Mismo módulo de Plotly que usa react-plotly.js (no se carga dos veces).
      // @ts-ignore - plotly.js/dist/plotly no trae tipos propios
      const modulo: any = await import("plotly.js/dist/plotly");
      const Plotly = modulo.default ?? modulo;

      const { traces } = construirData(true);
      const layoutExport: Partial<Layout> = {
        ...construirLayout(true),
        width: LADO_PNG,
        height: LADO_PNG,
        autosize: false,
      };

      const dataUrl: string = await Plotly.toImage(
        { data: traces, layout: layoutExport },
        { format: "png", width: LADO_PNG, height: LADO_PNG, scale: ESCALA_PNG }
      );

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${prefijoArchivo}_1x1.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("No se pudo exportar el gráfico a PNG:", error);
      alert("No se pudo exportar el gráfico a PNG. Probá de nuevo o recargá la página.");
    } finally {
      setExportando(false);
    }
  }, [seleccion, meses, construirData, construirLayout, prefijoArchivo]);

  if (seleccion.length === 0) {
    return (
      <div className="flex h-[480px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-institucional-border bg-white text-institucional-textsec">
        <p className="text-sm">Agregá al menos una serie para comenzar a graficar.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-institucional-border bg-white p-2 shadow-card">
      <div className="flex flex-wrap items-center justify-end gap-2 px-2 pb-1 pt-2">
        <button
          type="button"
          onClick={exportarPNG}
          disabled={exportando}
          title="Descarga el gráfico como imagen PNG cuadrada (1:1), lista para informes y redes"
          className="flex items-center gap-1.5 rounded-md border border-institucional-border bg-white px-3 py-1.5 text-xs font-medium text-institucional-text transition hover:border-institucional-teal hover:text-institucional-teal disabled:cursor-wait disabled:opacity-60"
        >
          {exportando ? "Generando imagen…" : "🖼 Exportar PNG (1:1)"}
        </button>
        <button
          type="button"
          onClick={descargarCSV}
          title="Descarga los valores mensuales (en millones de USD) de las series seleccionadas, para el período elegido"
          className="flex items-center gap-1.5 rounded-md border border-institucional-border bg-white px-3 py-1.5 text-xs font-medium text-institucional-text transition hover:border-institucional-teal hover:text-institucional-teal"
        >
          ⬇ Descargar CSV
        </button>
      </div>
      <div className="h-[500px] w-full">
        <PlotlyChart data={data} layout={layout} config={CONFIG_GRAFICO} />
      </div>
      {(avisoEjeSecundarioForzado || hay100pct) && (
        <p className="px-3 pb-2 text-[11px] text-institucional-textsec">
          * Con series en &ldquo;Columna vertical 100% apilada&rdquo;, el eje primario queda expresado en % del
          total y el resto de las series seleccionadas se reubica automáticamente en el eje secundario.
        </p>
      )}
      {hayBarras && barmode === "stack" && seleccion.some((s) => s.tipo === "Columna vertical") && (
        <p className="px-3 pb-2 text-[11px] text-institucional-textsec">
          * Hay series de &ldquo;Columna vertical&rdquo; (agrupada) combinadas con columnas apiladas: por
          restricción de Plotly, todas las columnas se muestran apiladas en este gráfico.
        </p>
      )}
      {hayEtiquetas && (
        <p className="px-3 pb-2 text-[11px] text-institucional-textsec">
          * Las etiquetas muestran valores en miles de millones de USD (el eje, el hover y el CSV están en
          millones de USD). Para que se lean bien, cada serie se rotula en hasta {MAX_ETIQUETAS} puntos,
          siempre incluyendo el último dato.
        </p>
      )}
      <p className="px-3 pb-2 text-[11px] text-institucional-textsec">
        El CSV exporta los valores en millones de USD (sin normalizar), aunque el gráfico muestre % en
        columnas 100% apiladas.
      </p>
    </div>
  );
}
