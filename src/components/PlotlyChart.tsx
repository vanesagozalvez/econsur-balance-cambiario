"use client";

import dynamic from "next/dynamic";
import type { Data, Layout, Config } from "plotly.js";

// react-plotly.js depende del DOM (SVG/Canvas) → debe cargarse solo en cliente.
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-institucional-navy border-t-transparent" />
    </div>
  ),
});

interface PlotlyChartProps {
  data: Partial<Data>[];
  layout: Partial<Layout>;
  className?: string;
  config?: Partial<Config>;
}

const DEFAULT_CONFIG: Partial<Config> = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: [
    "lasso2d",
    "select2d",
    "autoScale2d",
    "toggleSpikelines",
  ],
  toImageButtonOptions: {
    format: "png",
    scale: 2,
  },
};

export default function PlotlyChart({ data, layout, className, config }: PlotlyChartProps) {
  return (
    <Plot
      data={data as Data[]}
      layout={{ autosize: true, ...layout }}
      config={{ ...DEFAULT_CONFIG, ...config }}
      style={{ width: "100%", height: "100%" }}
      className={className}
      useResizeHandler
    />
  );
}
