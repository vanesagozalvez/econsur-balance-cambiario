import { SerieId, SerieMeta } from "@/types";
import {
  ALL_SERIES_IDS,
  DASHBOARD_SERIES_IDS,
  seriesPorCategoria,
  serieMetaCompuestaDe,
} from "@/lib/seriesMeta";
import { DETALLE_META, arbolDetalle, getValoresDetalle, NodoCuenta } from "@/lib/detalleSeries";
import { getSerieValues as getValoresCompuesta } from "@/lib/data";

export { DASHBOARD_SERIES_IDS, ALL_SERIES_IDS, seriesPorCategoria, arbolDetalle };
export type { NodoCuenta };

/**
 * Busca metadatos de una serie sin importar si es una serie compuesta
 * (curada a mano, ~23) o un concepto de detalle (auto-generado, id "d-...").
 */
export function serieMetaDe(id: SerieId): SerieMeta {
  return (
    serieMetaCompuestaDe(id) ??
    DETALLE_META[id] ?? {
      id,
      nombre: id,
      nombreCorto: id,
      categoria: "Desconocida",
      unidad: "Millones de USD",
      tipo: "detalle",
      descripcion: "Serie no encontrada.",
    }
  );
}

/** Devuelve los valores mensuales (rango completo) de cualquier serie, curada o de detalle. */
export function getValoresSerie(id: SerieId): number[] {
  const compuesta = getValoresCompuesta(id);
  if (compuesta.length > 0) return compuesta;
  return getValoresDetalle(id);
}
