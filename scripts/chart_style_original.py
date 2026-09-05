"""
Estilo visual "institucional" (estilo FMI / Banco Mundial / BID / Fed)
para los gráficos Plotly de la app.

Uso:
    from lib.chart_style import estilizar_figura, PALETA

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=..., y=..., name="Dólar BNA",
                              line=dict(color=PALETA[0], width=2.5)))
    estilizar_figura(fig, titulo="Tipo de cambio", subtitulo="Pesos por dólar",
                      fuente="BCRA vía series-tiempo-ar")
"""

import plotly.graph_objects as go

# Paleta acotada, sobria — nada de colores default "arcoíris" de Plotly.
# Pensada para que el color se mantenga legible tanto en fondo claro como oscuro.
PALETA = [
    "#1F3864",  # azul marino (serie principal)
    "#2E86AB",  # celeste petróleo
    "#A6A6A6",  # gris medio (series de contexto/comparación)
    "#D97706",  # ámbar — usar solo para UNA serie que se quiera resaltar
    "#6B7280",  # gris oscuro
    "#8FBFE0",  # celeste claro
]

FUENTE = "Arial, Helvetica, sans-serif"

# Los 7 tipos de gráfico disponibles para cada serie en los graficadores
# multi-serie (Comparador y Variables Monetarias BCRA).
TIPOS_GRAFICO = [
    "Línea continua",
    "Línea discontinua",
    "Línea con marcadores",
    "Área",
    "Área apilada",
    "Columna",
    "Columna apilada",
]


def color_de(indice: int) -> str:
    """Devuelve un color de la paleta, ciclando si hay más series que colores."""
    return PALETA[indice % len(PALETA)]


def estilizar_figura(
    fig: go.Figure,
    titulo: str = "",
    subtitulo: str = "",
    fuente: str = "",
    fecha_corte: str = "",
    fondo_oscuro: bool = False,
    mostrar_leyenda: bool = True,
    es_porcentaje: bool = False,
):
    """
    Aplica el layout institucional a una figura Plotly ya armada (con sus
    traces cargados). No toca los datos, solo la presentación.

    `es_porcentaje`: si True, formatea el eje Y (y los hovers) como
    porcentaje (0.025 -> "2.5%") en vez de decimal crudo.
    """
    color_fondo = "#0E1117" if fondo_oscuro else "#FFFFFF"
    color_texto = "#E5E7EB" if fondo_oscuro else "#1F2937"
    color_texto_secundario = "#9CA3AF" if fondo_oscuro else "#6B7280"
    color_grid = "#2D3340" if fondo_oscuro else "#E5E7EB"
    color_eje = "#4B5563" if fondo_oscuro else "#9CA3AF"

    # Título + subtítulo apilados, alineados a la izquierda (no centrado)
    # El color se fija EXPLÍCITAMENTE (inline + en title.font) para que nunca
    # dependa de la herencia del font global de la figura — eso es lo que
    # causaba títulos invisibles en algunos gráficos.
    titulo_html = f"<b style='font-size:20px;color:{color_texto}'>{titulo}</b>"
    if subtitulo:
        titulo_html += f"<br><span style='font-size:13px;color:{color_texto_secundario}'>{subtitulo}</span>"

    fig.update_layout(
        title=dict(text=titulo_html, font=dict(color=color_texto), x=0.01, xanchor="left", y=0.97, yanchor="top"),
        font=dict(family=FUENTE, size=13, color=color_texto),
        plot_bgcolor=color_fondo,
        paper_bgcolor=color_fondo,
        hovermode="x unified",
        margin=dict(l=60, r=40, t=90, b=70),
        legend=dict(
            orientation="h",
            yanchor="bottom", y=1.0,
            xanchor="left", x=0.0,
            # Nombres de series en negro y en negrita (independiente del tema de fondo)
            font=dict(size=12, color="#000000", family=FUENTE),
            bgcolor="rgba(0,0,0,0)",
        ) if mostrar_leyenda else None,
        showlegend=mostrar_leyenda,
    )

    fig.update_xaxes(
        showgrid=False,
        showline=True,
        linewidth=1,
        linecolor=color_eje,
        ticks="outside",
        tickcolor=color_eje,
        tickfont=dict(size=11, color=color_texto_secundario),
    )
    fig.update_yaxes(
        showgrid=True,
        gridwidth=1,
        gridcolor=color_grid,
        zeroline=False,
        showline=False,
        tickfont=dict(size=11, color=color_texto_secundario),
        tickformat=".1%" if es_porcentaje else None,
    )

    # Nota al pie: fuente + fecha de corte, chico y gris — el sello "institucional"
    pie_texto = fuente
    if fecha_corte:
        pie_texto = f"{pie_texto}  ·  Último dato: {fecha_corte}" if pie_texto else f"Último dato: {fecha_corte}"
    if pie_texto:
        fig.add_annotation(
            text=pie_texto,
            xref="paper", yref="paper",
            x=0.0, y=-0.16,
            xanchor="left", yanchor="top",
            showarrow=False,
            font=dict(size=10, color=color_texto_secundario, style="italic"),
        )

    return fig


def etiquetar_ultimo_valor(fig: go.Figure, x_ultimo, y_ultimo, texto: str, color: str, yref="y"):
    """
    Agrega un punto + etiqueta al final de una serie, como hacen los gráficos
    del FMI/BID en vez de depender solo de la leyenda.
    """
    fig.add_trace(go.Scatter(
        x=[x_ultimo], y=[y_ultimo],
        mode="markers",
        marker=dict(color=color, size=7),
        showlegend=False,
        hoverinfo="skip",
        yaxis=yref,
    ))
    fig.add_annotation(
        x=x_ultimo, y=y_ultimo,
        text=f"<b>{texto}</b>",
        showarrow=False,
        xanchor="left",
        xshift=10,
        font=dict(size=12, color=color),
        yref=yref,
    )
    return fig


def agregar_trazo(fig: go.Figure, tipo_grafico: str, x, y, nombre_leyenda: str, color: str,
                   yaxis: str = "y", hover_fmt: str = ",.2f"):
    """
    Agrega a `fig` el trazo de UNA serie, según uno de los 7 tipos de gráfico
    soportados: 'Línea continua', 'Línea discontinua', 'Línea con marcadores',
    'Área', 'Área apilada', 'Columna', 'Columna apilada'.

    Centralizado acá para que el Comparador y el graficador de Variables
    Monetarias del BCRA se comporten EXACTAMENTE igual.

    Para 'Área apilada' se usa un stackgroup separado por eje (primario/
    secundario) para que solo se apilen entre sí las series de un mismo eje.
    Para 'Columna apilada', quien llama debe además setear
    `fig.update_layout(barmode="stack")` a nivel figura (Plotly no permite
    mezclar barmode 'group' y 'stack' en la misma figura).
    """
    hovertemplate = f"%{{y:{hover_fmt}}}<extra></extra>"

    if tipo_grafico in ("Columna", "Columna apilada"):
        fig.add_trace(go.Bar(
            x=x, y=y, name=nombre_leyenda, marker=dict(color=color),
            yaxis=yaxis, hovertemplate=hovertemplate,
        ))
    elif tipo_grafico == "Área":
        fig.add_trace(go.Scatter(
            x=x, y=y, name=nombre_leyenda, mode="lines", fill="tozeroy",
            line=dict(color=color, width=2), opacity=0.6,
            yaxis=yaxis, hovertemplate=hovertemplate,
        ))
    elif tipo_grafico == "Área apilada":
        fig.add_trace(go.Scatter(
            x=x, y=y, name=nombre_leyenda, mode="lines", fill="tonexty",
            stackgroup=f"stack_{yaxis}", line=dict(color=color, width=2),
            yaxis=yaxis, hovertemplate=hovertemplate,
        ))
    elif tipo_grafico == "Línea discontinua":
        fig.add_trace(go.Scatter(
            x=x, y=y, name=nombre_leyenda, mode="lines",
            line=dict(color=color, width=2.2, dash="dash"),
            yaxis=yaxis, hovertemplate=hovertemplate,
        ))
    elif tipo_grafico == "Línea con marcadores":
        fig.add_trace(go.Scatter(
            x=x, y=y, name=nombre_leyenda, mode="lines+markers",
            line=dict(color=color, width=2), marker=dict(color=color, size=6),
            yaxis=yaxis, hovertemplate=hovertemplate,
        ))
    else:  # "Línea continua" — default/fallback
        fig.add_trace(go.Scatter(
            x=x, y=y, name=nombre_leyenda, mode="lines",
            line=dict(color=color, width=2.2),
            yaxis=yaxis, hovertemplate=hovertemplate,
        ))
    return fig


def formatear_valor(valor: float, es_porcentaje: bool) -> str:
    """Formatea un número para mostrar como etiqueta: '2.5%' o '1,234.56'."""
    if valor is None:
        return "s/d"
    if es_porcentaje:
        return f"{valor:.1%}"
    return f"{valor:,.2f}"
