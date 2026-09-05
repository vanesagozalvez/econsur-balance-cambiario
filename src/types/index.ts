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
