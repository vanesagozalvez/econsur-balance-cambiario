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

/** Versión más oscura de cada color de la paleta, para que las etiquetas de valores se lean sobre fondo blanco. */
const PALETA_ETIQUETAS = ["#1F3864", "#2E86AB", "#6B7280", "#B45309", "#4B5563", "#2E86AB"];

export const FUENTE = "Arial, Helvetica, sans-serif";

export function colorDe(indice: number): string {
  return PALETA[indice % PALETA.length];
}

export function colorEtiqueta(indice: number): string {
  return PALETA_ETIQUETAS[indice % PALETA_ETIQUETAS.length];
}

interface EstilizarOpciones {
  titulo: string;
  subtitulo?: string;
  fuente?: string;
  fechaCorte?: string;
  /** Texto de fuente que va en el borde INFERIOR DERECHO del gráfico. */
  fuenteDerecha?: string;
  fondoOscuro?: boolean;
  mostrarLeyenda?: boolean;
  esPorcentaje?: boolean;
  alturaCompacta?: boolean; // para minigráficos del dashboard
  /** Tipografías y márgenes ampliados para la exportación a imagen (PNG 1:1). */
  exportar?: boolean;
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
    fuenteDerecha = "",
    fondoOscuro = false,
    mostrarLeyenda = true,
    esPorcentaje = false,
    alturaCompacta = false,
    exportar = false,
  } = opciones;

  const colorFondo = fondoOscuro ? "#0E1117" : "#FFFFFF";
  const colorTexto = fondoOscuro ? "#E5E7EB" : "#1F2937";
  const colorTextoSecundario = fondoOscuro ? "#9CA3AF" : "#6B7280";
  const colorGrid = fondoOscuro ? "#2D3340" : "#E5E7EB";
  const colorEje = fondoOscuro ? "#4B5563" : "#9CA3AF";

  const tituloTamano = alturaCompacta ? 14 : exportar ? 30 : 20;
  const subtituloTamano = alturaCompacta ? 11 : exportar ? 20 : 13;
  const fuenteBase = alturaCompacta ? 11 : exportar ? 17 : 13;
  const fuenteLeyenda = alturaCompacta ? 10 : exportar ? 16 : 12;
  const fuenteTicks = alturaCompacta ? 9 : exportar ? 15 : 11;
  const fuentePie = exportar ? 14 : 10;

  let tituloHtml = `<b style="font-size:${tituloTamano}px;color:${colorTexto}">${titulo}</b>`;
  if (subtitulo) {
    tituloHtml += `<br><span style="font-size:${subtituloTamano}px;color:${colorTextoSecundario}">${subtitulo}</span>`;
  }

  const margen = alturaCompacta
    ? { l: 44, r: 16, t: 56, b: 44 }
    : exportar
    ? { l: 100, r: 70, t: 170, b: 125 }
    : { l: 60, r: 40, t: 90, b: 80 };

  const layout: Partial<Layout> = {
    title: {
      text: tituloHtml,
      font: { color: colorTexto, family: FUENTE },
      x: 0.01,
      xanchor: "left",
      y: alturaCompacta ? 0.95 : 0.97,
      yanchor: "top",
    },
    font: { family: FUENTE, size: fuenteBase, color: colorTexto },
    plot_bgcolor: colorFondo,
    paper_bgcolor: colorFondo,
    hovermode: "x unified",
    margin: margen,
    showlegend: mostrarLeyenda,
    legend: mostrarLeyenda
      ? {
          orientation: "h",
          yanchor: "bottom",
          y: 1.0,
          xanchor: "left",
          x: 0.0,
          font: { size: fuenteLeyenda, color: "#000000", family: FUENTE },
          bgcolor: "rgba(0,0,0,0)",
        }
      : undefined,
    xaxis: {
      type: "category",
      showgrid: false,
      showline: true,
      linewidth: 1,
      linecolor: colorEje,
      ticks: "outside",
      tickcolor: colorEje,
      tickangle: 0,
      tickfont: { size: fuenteTicks, color: colorTextoSecundario },
    },
    yaxis: {
      showgrid: true,
      gridwidth: 1,
      gridcolor: colorGrid,
      zeroline: false,
      showline: false,
      automargin: true,
      tickfont: { size: fuenteTicks, color: colorTextoSecundario },
      tickformat: esPorcentaje ? ".1%" : undefined,
    },
    yaxis2: {
      overlaying: "y",
      side: "right",
      showgrid: false,
      zeroline: false,
      showline: false,
      automargin: true,
      tickfont: { size: fuenteTicks, color: colorTextoSecundario },
    },
    annotations: [],
  };

  // Pie del gráfico: a la izquierda fuente/fecha de corte, a la derecha la fuente de los datos.
  // Se posiciona con `yshift` en píxeles (y no con una fracción del alto) para que quede
  // siempre pegado al borde inferior, tenga el gráfico el tamaño que tenga (pantalla o PNG 1:1).
  const pieIzquierdo = [fuente, fechaCorte ? `Último dato: ${fechaCorte}` : ""].filter(Boolean).join("  ·  ");
  const yshiftPie = exportar ? -70 : -52;
  const anotaciones: Partial<Annotations>[] = [];

  if (pieIzquierdo && !alturaCompacta) {
    anotaciones.push({
      text: pieIzquierdo,
      xref: "paper",
      yref: "paper",
      x: 0.0,
      y: 0,
      yshift: yshiftPie,
      xanchor: "left",
      yanchor: "top",
      showarrow: false,
      font: { size: fuentePie, color: colorTextoSecundario, family: FUENTE },
    } as Partial<Annotations>);
  }
  if (fuenteDerecha && !alturaCompacta) {
    anotaciones.push({
      text: fuenteDerecha,
      xref: "paper",
      yref: "paper",
      x: 1.0,
      y: 0,
      yshift: yshiftPie,
      xanchor: "right",
      yanchor: "top",
      showarrow: false,
      font: { size: fuentePie, color: colorTextoSecundario, family: FUENTE },
    } as Partial<Annotations>);
  }
  layout.annotations = anotaciones as Layout["annotations"];

  return layout;
}

export function formatearValor(valor: number | null | undefined, esPorcentaje = false): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "s/d";
  if (esPorcentaje) return `${(valor * 100).toFixed(1)}%`;
  return valor.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Elige qué etiquetas mostrar en el eje X (categórico, "ene-03", "feb-03"…) para
 * que queden horizontales y legibles aunque haya 280+ meses: con muchos meses
 * rotula solo los eneros (espaciados para no superar `maxTicks`); con rangos
 * cortos reparte las marcas en forma uniforme.
 */
export function ticksEjeX(
  mesesIso: string[],
  etiquetas: string[],
  maxTicks = 12
): { tickvals: string[]; ticktext: string[] } {
  const n = mesesIso.length;
  if (n <= maxTicks) return { tickvals: etiquetas, ticktext: etiquetas };

  let idx: number[] = [];
  if (n > 24) {
    const eneros = mesesIso.map((m, i) => (m.endsWith("-01") ? i : -1)).filter((i) => i >= 0);
    const paso = Math.max(1, Math.ceil(eneros.length / maxTicks));
    idx = eneros.filter((_, k) => k % paso === 0);
  }
  if (idx.length < 2) {
    const paso = Math.ceil(n / maxTicks);
    idx = [];
    for (let i = n - 1; i >= 0; i -= paso) idx.unshift(i);
  }
  const textos = idx.map((i) => etiquetas[i]);
  return { tickvals: textos, ticktext: textos };
}

/**
 * Etiquetas de valores en MILES DE MILLONES de USD (los datos están en millones).
 * Para que sean legibles con series largas (p.ej. 283 meses) no se rotula cada
 * punto: se muestran como máximo `maxEtiquetas`, parejas entre series y siempre
 * incluyendo el último dato. Los puntos sin etiqueta quedan como "".
 */
export function etiquetasMilesMillones(valores: number[], maxEtiquetas = 14): string[] {
  const n = valores.length;
  const paso = Math.max(1, Math.ceil(n / maxEtiquetas));
  return valores.map((v, i) => {
    if ((n - 1 - i) % paso !== 0) return "";
    if (v === null || v === undefined || Number.isNaN(v)) return "";
    const miles = v / 1000;
    const decimales = Math.abs(miles) >= 10 ? 1 : 2;
    return miles.toLocaleString("es-AR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  });
}

interface TrazoOpciones {
  yaxis?: "y" | "y2";
  hoverFmt?: string;
  barmode100?: boolean;
  /** Si viene, se dibujan estas etiquetas de texto sobre los puntos/columnas ("" = sin etiqueta). */
  etiquetas?: string[];
  posicionTexto?: string;
  tamanoTexto?: number;
  colorTexto?: string;
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
  const { yaxis = "y", hoverFmt = ",.1f", etiquetas, posicionTexto, tamanoTexto = 11, colorTexto = color } = opciones;
  const hovertemplate = `%{y:${hoverFmt}}<extra>${nombreLeyenda}</extra>`;
  const base: Partial<PlotData> = {
    x,
    y,
    name: nombreLeyenda,
    yaxis,
    hovertemplate,
  };

  let trazo: Partial<PlotData>;

  switch (tipo) {
    case "Columna vertical":
    case "Columna vertical apilada":
    case "Columna vertical 100% apilada":
      trazo = {
        ...base,
        type: "bar",
        marker: { color },
      };
      break;
    case "Área suavizada":
      trazo = {
        ...base,
        type: "scatter",
        mode: "lines",
        line: { color, width: 2, shape: "spline", smoothing: 0.35 },
        fill: "tozeroy",
        opacity: 0.6,
      };
      break;
    case "Área apilada":
      trazo = {
        ...base,
        type: "scatter",
        mode: "lines",
        line: { color, width: 2 },
        fill: "tonexty",
        stackgroup: `stack_${yaxis}`,
      };
      break;
    case "Línea discontinua":
      trazo = {
        ...base,
        type: "scatter",
        mode: "lines",
        line: { color, width: 2.2, dash: "dash" },
      };
      break;
    case "Línea con marcadores":
      trazo = {
        ...base,
        type: "scatter",
        mode: "lines+markers",
        line: { color, width: 2 },
        marker: { color, size: 6 },
      };
      break;
    case "Línea suavizada":
    default:
      trazo = {
        ...base,
        type: "scatter",
        mode: "lines",
        line: { color, width: 2.2, shape: "spline", smoothing: 0.35 },
      };
  }

  if (!etiquetas) return trazo;

  const textfont = { size: tamanoTexto, color: colorTexto, family: FUENTE };
  if (trazo.type === "bar") {
    return {
      ...trazo,
      text: etiquetas,
      textposition: (posicionTexto ?? "outside") as any,
      textfont,
      cliponaxis: false,
      constraintext: "none",
    } as Partial<PlotData>;
  }
  return {
    ...trazo,
    mode: `${trazo.mode}+text` as any,
    text: etiquetas,
    textposition: (posicionTexto ?? "top center") as any,
    textfont,
  } as Partial<PlotData>;
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
