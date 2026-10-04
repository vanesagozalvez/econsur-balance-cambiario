/**
 * Antes `SerieId` era una unión cerrada de 23 ids fijos. Ahora la app también
 * expone TODOS los conceptos de detalle del Excel (auto-generados, con id
 * tipo "d-xxxxxxxxxx"), así que se vuelve un simple `string`.
 */
export type SerieId = string;

export type TipoSerie = "compuesta" | "detalle";

export interface SerieMeta {
  id: SerieId;
  nombre: string;
  nombreCorto: string;
  /** Para series compuestas: agrupador temático. Para detalle: la Cuenta (E). */
  categoria: string;
  /** Solo para series de detalle: la Subcuenta (F). */
  subcategoria?: string;
  descripcion: string;
  unidad: string;
  tipo: TipoSerie;
}

export interface DetalleSerieRaw {
  cuenta: string;
  subcuenta: string;
  grupo: string;
  concepto: string;
  valores: number[];
}

export interface DatasetBalanceCambiario {
  generadoEl?: string;
  meses: string[]; // "YYYY-MM"
  series: Record<string, number[]>;
  detalle: Record<string, DetalleSerieRaw>;
}

export interface SectorRaw {
  nombre: string;
  /** id (concepto "d-…" o nodo de total "c-…"/"sc-…"/"g-…") -> valores mensuales alineados con `meses`. */
  detalle: Record<string, number[]>;
}

export type NivelNodo = "cuenta" | "subcuenta" | "grupo";

/** Metadatos de un nodo de TOTAL (Cuenta, Subcuenta o Grupo) — compartidos entre todos los sectores. */
export interface NodoTotalRaw {
  nivel: NivelNodo;
  cuenta: string;
  subcuenta?: string;
  grupo?: string;
  nombre: string;
}

export interface DatasetPorSector {
  /** Metadatos de los totales de Cuenta/Subcuenta/Grupo (no incluye el nivel Concepto, ya cubierto por DETALLE_META). */
  nodos: Record<string, NodoTotalRaw>;
  porSector: Record<string, SectorRaw>;
}

export interface SectorMeta {
  id: string;
  nombre: string;
}

export type TipoGrafico =
  | "Línea suavizada"
  | "Línea con marcadores"
  | "Línea discontinua"
  | "Área suavizada"
  | "Área apilada"
  | "Columna vertical"
  | "Columna vertical apilada"
  | "Columna vertical 100% apilada";

export const TIPOS_GRAFICO: TipoGrafico[] = [
  "Línea suavizada",
  "Línea con marcadores",
  "Línea discontinua",
  "Área suavizada",
  "Área apilada",
  "Columna vertical",
  "Columna vertical apilada",
  "Columna vertical 100% apilada",
];

export interface SerieSeleccionada {
  id: SerieId;
  tipo: TipoGrafico;
  ejeSecundario: boolean;
}

/** Rango de fechas global (Dashboard + Comparador), en formato "YYYY-MM". */
export interface RangoFechas {
  desde: string;
  hasta: string;
}
