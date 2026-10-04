/**
 * Port a TypeScript / Plotly.js del estilo visual institucional
 * (estilo FMI / Banco Mundial / BID / Fed) definido en `chart_style.py`.
 *
 * Mantiene la misma paleta, tipografía, disposición de título + subtítulo,
 * grilla horizontal únicamente, leyenda horizontal y nota al pie con la
 * fuente y la fecha de corte.
 */
import type { Layout, PlotData, Annotations } from "plotly.js";
import { TipoGrafico } from "@/types";

export const PALETA = [
  "#1F3864", // azul marino (serie principal)
  "#2E86AB", // celeste petróleo
  "#A6A6A6", // gris medio (series de contexto/comparación)
  "#D97706", // ámbar — reservar para UNA serie a resaltar
  "#6B7280", // gris oscuro
  "#8FBFE0", // celeste claro
];

export const FUENTE = "Arial, Helvetica, sans-serif";

export function colorDe(indice: number): string {
  return PALETA[indice % PALETA.length];
}

interface EstilizarOpciones {
  titulo: string;
  subtitulo?: string;
  fuente?: string;
  fechaCorte?: string;
  fondoOscuro?: boolean;
  mostrarLeyenda?: boolean;
  esPorcentaje?: boolean;
  alturaCompacta?: boolean; // para minigráficos del dashboard
}

/**
 * Devuelve un objeto de layout de Plotly con el estilo institucional
 * aplicado, equivalente a `estilizar_figura()` en Python.
 */
export function estilizarLayout(opciones: EstilizarOpciones): Partial<Layout> {
  const {
    titulo,
    subtitulo = "",
    fuente = "",
    fechaCorte = "",
    fondoOscuro = false,
    mostrarLeyenda = true,
    esPorcentaje = false,
    alturaCompacta = false,
  } = opciones;

  const colorFondo = fondoOscuro ? "#0E1117" : "#FFFFFF";
  const colorTexto = fondoOscuro ? "#E5E7EB" : "#1F2937";
  const colorTextoSecundario = fondoOscuro ? "#9CA3AF" : "#6B7280";
  const colorGrid = fondoOscuro ? "#2D3340" : "#E5E7EB";
  const colorEje = fondoOscuro ? "#4B5563" : "#9CA3AF";

  const tituloTamano = alturaCompacta ? 14 : 20;
  const subtituloTamano = alturaCompacta ? 11 : 13;

  let tituloHtml = `<b style="font-size:${tituloTamano}px;color:${colorTexto}">${titulo}</b>`;
  if (subtitulo) {
    tituloHtml += `<br><span style="font-size:${subtituloTamano}px;color:${colorTextoSecundario}">${subtitulo}</span>`;
  }

  const layout: Partial<Layout> = {
    title: {
      text: tituloHtml,
      font: { color: colorTexto, family: FUENTE },
      x: 0.01,
      xanchor: "left",
      y: alturaCompacta ? 0.95 : 0.97,
      yanchor: "top",
    },
    font: { family: FUENTE, size: alturaCompacta ? 11 : 13, color: colorTexto },
    plot_bgcolor: colorFondo,
    paper_bgcolor: colorFondo,
    hovermode: "x unified",
    margin: alturaCompacta
      ? { l: 44, r: 16, t: 56, b: 44 }
      : { l: 60, r: 40, t: 90, b: 70 },
    showlegend: mostrarLeyenda,
    legend: mostrarLeyenda
      ? {
          orientation: "h",
          yanchor: "bottom",
          y: 1.0,
          xanchor: "left",
          x: 0.0,
          font: { size: alturaCompacta ? 10 : 12, color: "#000000", family: FUENTE },
          bgcolor: "rgba(0,0,0,0)",
        }
      : undefined,
    xaxis: {
      showgrid: false,
      showline: true,
      linewidth: 1,
      linecolor: colorEje,
      ticks: "outside",
      tickcolor: colorEje,
      tickfont: { size: alturaCompacta ? 9 : 11, color: colorTextoSecundario },
    },
    yaxis: {
      showgrid: true,
      gridwidth: 1,
      gridcolor: colorGrid,
      zeroline: false,
      showline: false,
      tickfont: { size: alturaCompacta ? 9 : 11, color: colorTextoSecundario },
      tickformat: esPorcentaje ? ".1%" : undefined,
    },
    yaxis2: {
      overlaying: "y",
      side: "right",
      showgrid: false,
      zeroline: false,
      showline: false,
      tickfont: { size: alturaCompacta ? 9 : 11, color: colorTextoSecundario },
    },
    annotations: [],
  };

  const pieTexto = [fuente, fechaCorte ? `Último dato: ${fechaCorte}` : ""]
    .filter(Boolean)
    .join("  ·  ");

  if (pieTexto && !alturaCompacta) {
    layout.annotations = [
      {
        text: pieTexto,
        xref: "paper",
        yref: "paper",
        x: 0.0,
        y: -0.16,
        xanchor: "left",
        yanchor: "top",
        showarrow: false,
        font: { size: 10, color: colorTextoSecundario, family: FUENTE },
      } as Partial<Annotations>,
    ];
  }

  return layout;
}

export function formatearValor(valor: number | null | undefined, esPorcentaje = false): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "s/d";
  if (esPorcentaje) return `${(valor * 100).toFixed(1)}%`;
  return valor.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

interface TrazoOpciones {
  yaxis?: "y" | "y2";
  hoverFmt?: string;
  barmode100?: boolean;
}

/**
 * Construye un trace de Plotly para UNA serie, según el tipo de gráfico
 * elegido (uno de los 8 `TIPOS_GRAFICO`). Centralizado para que el
 * Dashboard y el Comparador se comporten de forma consistente.
 */
export function crearTrazo(
  tipo: TipoGrafico,
  x: string[],
  y: number[],
  nombreLeyenda: string,
  color: string,
  opciones: TrazoOpciones = {}
): Partial<PlotData> {
  const { yaxis = "y", hoverFmt = ",.1f" } = opciones;
  const hovertemplate = `%{y:${hoverFmt}}<extra>${nombreLeyenda}</extra>`;
  const base: Partial<PlotData> = {
    x,
    y,
    name: nombreLeyenda,
    yaxis,
    hovertemplate,
  };

  switch (tipo) {
    case "Columna vertical":
    case "Columna vertical apilada":
    case "Columna vertical 100% apilada":
      return {
        ...base,
        type: "bar",
        marker: { color },
      };
    case "Área suavizada":
      return {
        ...base,
        type: "scatter",
        mode: "lines",
        line: { color, width: 2, shape: "spline", smoothing: 0.35 },
        fill: "tozeroy",
        opacity: 0.6,
      };
    case "Área apilada":
      return {
        ...base,
        type: "scatter",
        mode: "lines",
        line: { color, width: 2 },
        fill: "tonexty",
        stackgroup: `stack_${yaxis}`,
      };
    case "Línea discontinua":
      return {
        ...base,
        type: "scatter",
        mode: "lines",
        line: { color, width: 2.2, dash: "dash" },
      };
    case "Línea con marcadores":
      return {
        ...base,
        type: "scatter",
        mode: "lines+markers",
        line: { color, width: 2 },
        marker: { color, size: 6 },
      };
    case "Línea suavizada":
    default:
      return {
        ...base,
        type: "scatter",
        mode: "lines",
        line: { color, width: 2.2, shape: "spline", smoothing: 0.35 },
      };
  }
}

/** true si el tipo de gráfico usa barras. */
export function esTipoBarra(tipo: TipoGrafico): boolean {
  return (
    tipo === "Columna vertical" ||
    tipo === "Columna vertical apilada" ||
    tipo === "Columna vertical 100% apilada"
  );
}

export function esTipoApilado(tipo: TipoGrafico): boolean {
  return tipo === "Área apilada" || tipo === "Columna vertical apilada" || tipo === "Columna vertical 100% apilada";
}
