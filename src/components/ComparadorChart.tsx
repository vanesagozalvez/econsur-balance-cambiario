"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import PlotlyChart from "./PlotlyChart";
import { colorDe, crearTrazo, estilizarLayout, esTipoBarra } from "@/lib/chartStyle";
import { getMeses, formatMesesEje, recortarPorRango, formatMes } from "@/lib/data";
import { serieMetaDe, getValoresSerie } from "@/lib/catalogo";
import { useRangoFechas } from "@/lib/rangoFechasContext";
import { SerieSeleccionada } from "@/types";

interface ComparadorChartProps {
  seleccion: SerieSeleccionada[];
}

export default function ComparadorChart({ seleccion }: ComparadorChartProps) {
  const { rango } = useRangoFechas();

  const { meses, valoresPorId } = useMemo(() => {
    const mesesCompletos = getMeses();
    const valoresPorId = new Map<string, number[]>();
    let mesesRecorte: string[] = [];
    for (const s of seleccion) {
      const valoresCompletos = getValoresSerie(s.id);
      const recorte = recortarPorRango(mesesCompletos, valoresCompletos, rango.desde, rango.hasta);
      mesesRecorte = recorte.meses; // igual para todas las series (mismo eje temporal)
      valoresPorId.set(s.id, recorte.valores);
    }
    return { meses: mesesRecorte, valoresPorId };
  }, [seleccion, rango.desde, rango.hasta]);

  const ejeX = useMemo(() => formatMesesEje(meses), [meses]);
  const hasta = meses.length ? formatMes(meses[meses.length - 1]) : "";

  const hay100pct = seleccion.some((s) => s.tipo === "Columna vertical 100% apilada");

  const { data, avisoEjeSecundarioForzado } = useMemo(() => {
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
      const meta = serieMetaDe(s.id);
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

      return crearTrazo(s.tipo, ejeX, valores, meta.nombreCorto, color, { yaxis, hoverFmt });
    });

    return { data: traces, avisoEjeSecundarioForzado: avisoForzado };
  }, [seleccion, meses, ejeX, valoresPorId, hay100pct]);

  const barmode: Layout["barmode"] = useMemo(() => {
    const tieneApilada = seleccion.some(
      (s) => s.tipo === "Columna vertical apilada" || s.tipo === "Columna vertical 100% apilada"
    );
    const tieneNormal = seleccion.some((s) => s.tipo === "Columna vertical");
    if (tieneApilada) return "stack";
    if (tieneNormal) return "group";
    return undefined;
  }, [seleccion]);

  const layout = useMemo(() => {
    const base = estilizarLayout({
      titulo: "Comparador de Series",
      subtitulo: "Balance Cambiario Argentino · Millones de USD",
      fuente: "BCRA — Mercado de Cambios",
      fechaCorte: hasta,
      mostrarLeyenda: true,
    });
    const l: Partial<Layout> = { ...base, barmode };
    if (hay100pct && l.yaxis) {
      l.yaxis = { ...l.yaxis, ticksuffix: "%", title: { text: "% del total" } };
    }
    return l;
  }, [barmode, hasta, hay100pct]);

  const hayBarras = seleccion.some((s) => esTipoBarra(s.tipo));

  if (seleccion.length === 0) {
    return (
      <div className="flex h-[480px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-institucional-border bg-white text-institucional-textsec">
        <p className="text-sm">Agregá al menos una serie para comenzar a graficar.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-institucional-border bg-white p-2 shadow-card">
      <div className="h-[520px] w-full">
        <PlotlyChart data={data} layout={layout} />
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
    </div>
  );
}
