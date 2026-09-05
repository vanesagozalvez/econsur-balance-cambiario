"use client";

import { useMemo } from "react";
import PlotlyChart from "./PlotlyChart";
import { colorDe, crearTrazo, estilizarLayout } from "@/lib/chartStyle";
import { getMeses, formatMesesEje, recortarPorRango, formatMes } from "@/lib/data";
import { getValoresSerie } from "@/lib/catalogo";
import { useRangoFechas } from "@/lib/rangoFechasContext";
import { SerieMeta } from "@/types";

interface MiniChartCardProps {
  meta: SerieMeta;
  colorIndex: number;
}

function variacionInteranual(valores: number[]): number | null {
  const n = valores.length;
  if (n < 13) return null;
  const actual12m = valores.slice(-12).reduce((a, b) => a + b, 0);
  const previo12m = valores.slice(-24, -12).reduce((a, b) => a + b, 0);
  if (previo12m === 0) return null;
  return (actual12m - previo12m) / Math.abs(previo12m);
}

export default function MiniChartCard({ meta, colorIndex }: MiniChartCardProps) {
  const { rango } = useRangoFechas();
  const color = colorDe(colorIndex);

  const { mesesFiltrados, valoresFiltrados } = useMemo(() => {
    const meses = getMeses();
    const valores = getValoresSerie(meta.id);
    const recorte = recortarPorRango(meses, valores, rango.desde, rango.hasta);
    return { mesesFiltrados: recorte.meses, valoresFiltrados: recorte.valores };
  }, [meta.id, rango.desde, rango.hasta]);

  const ejeX = useMemo(() => formatMesesEje(mesesFiltrados), [mesesFiltrados]);

  const trace = useMemo(() => {
    const t = crearTrazo("Área suavizada", ejeX, valoresFiltrados, meta.nombreCorto, color, {
      hoverFmt: ",.0f",
    });
    return { ...t, fillcolor: hexConAlpha(color, 0.16) };
  }, [ejeX, valoresFiltrados, meta.nombreCorto, color]);

  const layout = useMemo(
    () =>
      estilizarLayout({
        titulo: meta.nombreCorto,
        subtitulo: meta.unidad,
        alturaCompacta: true,
        mostrarLeyenda: false,
      }),
    [meta.nombreCorto, meta.unidad]
  );

  const fechaCorte = mesesFiltrados.length ? formatMes(mesesFiltrados[mesesFiltrados.length - 1]) : "s/d";
  const ultimoValor = valoresFiltrados[valoresFiltrados.length - 1] ?? 0;
  const acum12m = valoresFiltrados.slice(-12).reduce((a, b) => a + b, 0);
  const variacion = variacionInteranual(valoresFiltrados);

  return (
    <div className="flex flex-col rounded-xl border border-institucional-border bg-institucional-card shadow-card transition-shadow hover:shadow-cardHover">
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-institucional-text" title={meta.nombre}>
            {meta.nombre}
          </h3>
          <p className="text-xs text-institucional-textsec">Último mes ({fechaCorte})</p>
        </div>
        {variacion !== null && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              variacion >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
            title="Variación interanual del acumulado de 12 meses"
          >
            {variacion >= 0 ? "▲" : "▼"} {Math.abs(variacion * 100).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-3 px-4 pt-1">
        <span className="text-2xl font-bold tabular-nums text-institucional-navy">
          {ultimoValor.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
        </span>
        <span className="text-xs text-institucional-textsec">USD MM</span>
        <span className="ml-auto text-xs text-institucional-textsec">
          12m: {acum12m.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
        </span>
      </div>

      <div className="h-[180px] px-1 pb-1 pt-2">
        <PlotlyChart data={[trace]} layout={layout} />
      </div>
    </div>
  );
}

function hexConAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
