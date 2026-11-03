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

/**
 * Formato de la imagen PNG exportable: apaisado 1,6:1 (16:10), pensado para
 * entrar a ancho de columna en un informe de research. Las medidas están en
 * "px de diseño"; al exportar se multiplican por EXPORT_ESCALA (2560 × 1600 px).
 */
export const EXPORT_ANCHO = 1280;
export const EXPORT_ALTO = 800;
export const EXPORT_ESCALA = 2;

/** Alto (px desde el borde superior) que ocupa el encabezado (título + subtítulo en UNA línea) en la exportación. */
const EXPORT_ALTO_ENCABEZADO = 64;
/** Aire entre la leyenda y el área de gráfico (lugar para las etiquetas de valores más altas). */
const EXPORT_AIRE_SOBRE_GRAFICO = 14;
const EXPORT_MARGEN_INFERIOR = 104;
const EXPORT_MARGEN_LATERAL = 56;

/**
 * Estima en cuántas filas se acomoda una leyenda horizontal con estos nombres
 * (Arial: ~0,56 em por carácter + símbolo de la serie). Es deliberadamente
 * conservadora: si se pasa, queda un poco de aire; si se quedara corta, la
 * leyenda se montaría sobre el gráfico.
 */
function estimarFilasLeyenda(nombres: string[], tamanoFuente: number, anchoDisponible: number): number {
  let filas = 1;
  let usado = 0;
  for (const nombre of nombres) {
    const ancho = nombre.length * tamanoFuente * 0.56 + 70;
    if (usado > 0 && usado + ancho > anchoDisponible) {
      filas += 1;
      usado = ancho;
    } else {
      usado += ancho;
    }
  }
  return filas;
}

/**
 * Parte un subtítulo largo en varias líneas, cortando SOLO en los " + " que separan
 * sectores agrupados (nunca en el medio del nombre de un sector). Las líneas siguientes
 * empiezan con "+ " para que se entienda que continúan la enumeración.
 */
export function envolverSubtitulo(texto: string, maxCaracteres: number): string[] {
  if (texto.length <= maxCaracteres) return [texto];
  const partes = texto.split(" + ");
  const lineas: string[] = [];
  let actual = "";
  partes.forEach((parte, i) => {
    const trozo = i === 0 ? parte : ` + ${parte}`;
    if (actual && (actual + trozo).length > maxCaracteres) {
      lineas.push(actual);
      actual = `+ ${parte}`;
    } else {
      actual += trozo;
    }
  });
  if (actual) lineas.push(actual);
  return lineas;
}

/** Tamaño del subtítulo cuando en la exportación va en líneas propias, debajo del título. */
const EXPORT_TAM_SUBTITULO_APARTE = 20;

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
  /**
   * Layout para la imagen PNG exportable (apaisada 1,6:1): ejes y leyenda con
   * tipografía grande, líneas al doble de grosor y cabecera compacta.
   */
  exportar?: boolean;
  /** Nombres COMPLETOS de las series (sin truncar), para dimensionar la cabecera en la exportación. */
  nombresLeyenda?: string[];
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
    nombresLeyenda = [],
  } = opciones;

  const esExp = exportar && !alturaCompacta;

  const colorFondo = fondoOscuro ? "#0E1117" : "#FFFFFF";
  const colorTexto = fondoOscuro ? "#E5E7EB" : "#1F2937";
  const colorTextoSecundario = fondoOscuro ? "#9CA3AF" : "#6B7280";
  const colorGrid = fondoOscuro ? "#2D3340" : "#E5E7EB";
  const colorEje = fondoOscuro ? "#4B5563" : "#9CA3AF";

  const tituloTamano = alturaCompacta ? 14 : esExp ? 38 : 20;
  const subtituloTamano = alturaCompacta ? 11 : esExp ? 24 : 13;
  const fuenteBase = alturaCompacta ? 11 : esExp ? 22 : 13;
  // En la exportación, los textos de los ejes (unidades y fechas) van al doble de tamaño relativo.
  const fuenteTicks = alturaCompacta ? 9 : esExp ? 36 : 11;
  const fuentePie = esExp ? 20 : 10;
  const grosorEje = esExp ? 2 : 1;
  const largoTick = esExp ? 8 : 5;

  // Leyenda: en la exportación se agranda y se achica solo lo justo si los nombres
  // completos obligarían a usar más de 2 filas.
  let fuenteLeyenda = alturaCompacta ? 10 : 12;
  let filasLeyenda = 1;
  if (esExp) {
    for (const f of [26, 24, 22]) {
      fuenteLeyenda = f;
      filasLeyenda = estimarFilasLeyenda(nombresLeyenda, f, EXPORT_ANCHO - 300);
      if (filasLeyenda <= 2) break;
    }
  }

  let tituloHtml = `<b style="font-size:${tituloTamano}px;color:${colorTexto}">${titulo}</b>`;
  let altoEncabezado = EXPORT_ALTO_ENCABEZADO;
  let lineasSubtituloAparte: string[] | null = null; // exportación: subtítulo largo, en líneas propias
  let lineasExtraPantalla = 0;
  const estiloSub = (px: number) => `font-size:${px}px;color:${colorTextoSecundario}`;

  if (subtitulo && esExp) {
    // Exportación: el subtítulo va a la DERECHA del título, en la misma línea (misma línea base).
    // Si es largo se achica lo justo para que el encabezado entre completo en el ancho de la imagen.
    const separacion = "\u00A0\u00A0\u00A0\u00A0";
    const disponible = EXPORT_ANCHO - EXPORT_MARGEN_LATERAL - 24;
    const anchoTitulo = titulo.length * tituloTamano * 0.6 + 42;
    let tamSub = 0;
    for (const t of [24, 22, 20, 18]) {
      if (anchoTitulo + subtitulo.length * t * 0.54 <= disponible) {
        tamSub = t;
        break;
      }
    }
    if (tamSub) {
      tituloHtml += `${separacion}<span style="${estiloSub(tamSub)}">${subtitulo}</span>`;
    } else {
      // No entra ni a 18 px (p.ej. varios sectores agrupados): el subtítulo pasa a líneas propias,
      // debajo del título, partido en los " + " entre sectores. Se dibuja como anotación (con
      // posición exacta en píxeles) y el encabezado crece lo que ocupen esas líneas.
      const maxCaracteres = Math.floor(disponible / (EXPORT_TAM_SUBTITULO_APARTE * 0.54));
      lineasSubtituloAparte = envolverSubtitulo(subtitulo, maxCaracteres);
      altoEncabezado = 64 + Math.ceil(EXPORT_TAM_SUBTITULO_APARTE * 1.3) * lineasSubtituloAparte.length;
    }
  } else if (subtitulo) {
    // Pantalla: el subtítulo va debajo del título; si es largo se parte en líneas (cada una con su estilo).
    const lineas = envolverSubtitulo(subtitulo, 110);
    tituloHtml += "<br>" + lineas.map((l) => `<span style="${estiloSub(subtituloTamano)}">${l}</span>`).join("<br>");
    lineasExtraPantalla = lineas.length - 1;
  }

  // Márgenes. En la exportación son mínimos (los ejes los amplían solos con `automargin`)
  // y el margen superior se calcula justo para alojar título + subtítulo + leyenda.
  const altoLeyenda = mostrarLeyenda ? Math.ceil(filasLeyenda * fuenteLeyenda * 1.4) + 8 : 0;
  const margen = alturaCompacta
    ? { l: 44, r: 16, t: 56, b: 44 }
    : esExp
    ? {
        // Margen lateral mínimo = medio ancho de una etiqueta de fecha (la del primer/último mes
        // está centrada en su marca y no debe cortarse). Los ejes verticales lo amplían solos.
        l: EXPORT_MARGEN_LATERAL,
        r: EXPORT_MARGEN_LATERAL,
        t: altoEncabezado + altoLeyenda + EXPORT_AIRE_SOBRE_GRAFICO,
        b: EXPORT_MARGEN_INFERIOR,
      }
    : { l: 60, r: 40, t: 90 + lineasExtraPantalla * 20, b: 80 };
  const altoAreaGrafico = EXPORT_ALTO - margen.t - margen.b;

  const titleConfig: any = esExp
    ? {
        text: tituloHtml,
        // IMPORTANTE: el `size` debe ser el del texto principal. Plotly calcula la posición vertical
        // del título con este tamaño; si fuera menor que el del <b> en línea, el título se corre
        // hacia arriba y queda cortado contra el borde superior de la imagen.
        font: { color: colorTexto, family: FUENTE, size: tituloTamano },
        // Alineado al borde izquierdo del área de gráfico (igual que la leyenda y el pie),
        // pegado al borde superior de la imagen.
        xref: "paper",
        x: 0,
        xanchor: "left",
        yref: "container",
        y: 1,
        yanchor: "top",
        pad: { t: 10, r: 0, b: 0, l: 0 },
      }
    : {
        text: tituloHtml,
        font: { color: colorTexto, family: FUENTE },
        x: 0.01,
        xanchor: "left",
        y: alturaCompacta ? 0.95 : 0.97,
        yanchor: "top",
      };

  const legendConfig: any = !mostrarLeyenda
    ? undefined
    : esExp
    ? {
        orientation: "h",
        // La leyenda se ancla justo debajo del subtítulo (y crece hacia abajo): sin hueco.
        xanchor: "left",
        x: 0,
        yanchor: "top",
        y: 1 + (margen.t - altoEncabezado) / altoAreaGrafico,
        font: { size: fuenteLeyenda, color: "#000000", family: FUENTE },
        bgcolor: "rgba(0,0,0,0)",
      }
    : {
        orientation: "h",
        yanchor: "bottom",
        y: 1.0,
        xanchor: "left",
        x: 0.0,
        font: { size: fuenteLeyenda, color: "#000000", family: FUENTE },
        bgcolor: "rgba(0,0,0,0)",
      };

  const ejeY = {
    showgrid: true,
    gridwidth: 1,
    gridcolor: colorGrid,
    zeroline: false,
    // En la exportación los ejes verticales llevan línea y marcas al doble de grosor.
    showline: esExp,
    linewidth: grosorEje,
    linecolor: colorEje,
    ticks: esExp ? "outside" : undefined,
    tickwidth: grosorEje,
    ticklen: largoTick,
    tickcolor: colorEje,
    automargin: true,
    tickfont: { size: fuenteTicks, color: colorTextoSecundario },
  };

  const layout: Partial<Layout> = {
    title: titleConfig,
    font: { family: FUENTE, size: fuenteBase, color: colorTexto },
    plot_bgcolor: colorFondo,
    paper_bgcolor: colorFondo,
    hovermode: "x unified",
    margin: margen,
    showlegend: mostrarLeyenda,
    legend: legendConfig,
    xaxis: {
      type: "category",
      showgrid: false,
      showline: true,
      linewidth: grosorEje,
      linecolor: colorEje,
      ticks: "outside",
      tickwidth: grosorEje,
      ticklen: largoTick,
      tickcolor: colorEje,
      tickangle: 0,
      automargin: esExp,
      tickfont: { size: fuenteTicks, color: colorTextoSecundario },
    },
    yaxis: {
      ...ejeY,
      tickformat: esPorcentaje ? ".1%" : undefined,
    },
    yaxis2: {
      ...ejeY,
      overlaying: "y",
      side: "right",
      showgrid: false,
    },
    annotations: [],
  };

  // Pie del gráfico: a la izquierda fuente/fecha de corte, a la derecha la fuente de los datos.
  // Se posiciona con `yshift` en píxeles (y no con una fracción del alto) para que quede
  // siempre pegado al borde inferior, tenga el gráfico el tamaño que tenga (pantalla o PNG).
  const pieIzquierdo = [fuente, fechaCorte ? `Último dato: ${fechaCorte}` : ""].filter(Boolean).join("  ·  ");
  const yshiftPie = esExp ? -68 : -52;
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
  if (lineasSubtituloAparte) {
    // Primera línea del subtítulo a 58 px del borde superior (justo debajo de la línea del título).
    anotaciones.push({
      text: lineasSubtituloAparte.join("<br>"),
      xref: "paper",
      yref: "paper",
      x: 0,
      y: 1 + (margen.t - 58) / altoAreaGrafico,
      xanchor: "left",
      yanchor: "top",
      align: "left",
      showarrow: false,
      font: { size: EXPORT_TAM_SUBTITULO_APARTE, color: colorTextoSecundario, family: FUENTE },
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
  /** Multiplicador del grosor de líneas y marcadores (2 en la exportación PNG). */
  escalaLinea?: number;
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
  const {
    yaxis = "y",
    hoverFmt = ",.1f",
    escalaLinea = 1,
    etiquetas,
    posicionTexto,
    tamanoTexto = 11,
    colorTexto = color,
  } = opciones;
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
        line: { color, width: 2 * escalaLinea, shape: "spline", smoothing: 0.35 },
        fill: "tozeroy",
        opacity: 0.6,
      };
      break;
    case "Área apilada":
      trazo = {
        ...base,
        type: "scatter",
        mode: "lines",
        line: { color, width: 2 * escalaLinea },
        fill: "tonexty",
        stackgroup: `stack_${yaxis}`,
      };
      break;
    case "Línea discontinua":
      trazo = {
        ...base,
        type: "scatter",
        mode: "lines",
        line: { color, width: 2.2 * escalaLinea, dash: "dash" },
      };
      break;
    case "Línea con marcadores":
      trazo = {
        ...base,
        type: "scatter",
        mode: "lines+markers",
        line: { color, width: 2 * escalaLinea },
        marker: { color, size: 6 * escalaLinea },
      };
      break;
    case "Línea suavizada":
    default:
      trazo = {
        ...base,
        type: "scatter",
        mode: "lines",
        line: { color, width: 2.2 * escalaLinea, shape: "spline", smoothing: 0.35 },
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
