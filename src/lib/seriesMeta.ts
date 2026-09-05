import { SerieId, SerieMeta } from "@/types";

/**
 * Metadatos de todas las series derivadas del Balance Cambiario (BCRA).
 *
 * Fuente de los datos crudos: planilla "Mercado de Cambios" con aperturas
 * mensuales por sector y concepto (Anexo, Sector, Cuenta, Subcuenta,
 * Concepto). Los importes originales están en USD; en este dataset se
 * expresan en MILLONES DE USD, con signo: ingresos (+) / egresos (-).
 *
 * Algunas series (marcadas como "proxy") son construcciones propias a
 * partir de los rubros disponibles en la apertura pública y no son series
 * oficiales publicadas 1 a 1 por el BCRA bajo ese nombre exacto — se arman
 * agregando los conceptos más representativos de cada fenómeno económico.
 */
export const SERIES_META: Record<SerieId, SerieMeta> = {
  cuenta_corriente: {
    id: "cuenta_corriente",
    nombre: "Cuenta Corriente",
    nombreCorto: "Cta. Corriente",
    categoria: "Cuentas principales",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion:
      "Saldo neto de la Cuenta Corriente del balance cambiario: bienes, servicios, ingreso primario (utilidades, dividendos, intereses) e ingreso secundario.",
  },
  cuenta_capital: {
    id: "cuenta_capital",
    nombre: "Cuenta Capital",
    nombreCorto: "Cta. Capital",
    categoria: "Cuentas principales",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Saldo neto de la Cuenta Capital del balance cambiario.",
  },
  cuenta_financiera: {
    id: "cuenta_financiera",
    nombre: "Cuenta Financiera",
    nombreCorto: "Cta. Financiera",
    categoria: "Cuentas principales",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion:
      "Saldo neto de la Cuenta Financiera: inversión directa y de portafolio, préstamos y títulos de deuda, compra-venta de billetes y divisas, canjes y otros movimientos financieros.",
  },
  balance_bienes: {
    id: "balance_bienes",
    nombre: "Balance de Bienes (cambiario)",
    nombreCorto: "Balance de Bienes",
    categoria: "Bienes y servicios",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion:
      "Cobros de exportaciones menos pagos de importaciones de bienes liquidados por el mercado de cambios (no coincide necesariamente con el balance comercial aduanero, que se registra por devengado).",
  },
  exportaciones_bienes: {
    id: "exportaciones_bienes",
    nombre: "Cobros de Exportaciones de Bienes",
    nombreCorto: "Exportaciones",
    categoria: "Bienes y servicios",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Cobros de exportaciones de bienes liquidados en el mercado de cambios.",
  },
  importaciones_bienes: {
    id: "importaciones_bienes",
    nombre: "Pagos de Importaciones de Bienes",
    nombreCorto: "Importaciones",
    categoria: "Bienes y servicios",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Pagos de importaciones de bienes cursados por el mercado de cambios (signo negativo).",
  },
  balance_servicios: {
    id: "balance_servicios",
    nombre: "Balance de Servicios",
    nombreCorto: "Servicios",
    categoria: "Bienes y servicios",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion:
      "Saldo neto de servicios: turismo y viajes, fletes, seguros, servicios empresariales, informática, comunicaciones, propiedad intelectual y otros.",
  },
  ingreso_primario: {
    id: "ingreso_primario",
    nombre: "Ingreso Primario",
    nombreCorto: "Ingreso 1º",
    categoria: "Ingresos",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Saldo neto de ingreso primario: utilidades y dividendos, intereses y otras rentas de la inversión.",
  },
  utilidades_dividendos: {
    id: "utilidades_dividendos",
    nombre: "Utilidades y Dividendos",
    nombreCorto: "Utilidades y Div.",
    categoria: "Ingresos",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion:
      "Saldo neto de giro de utilidades y dividendos al exterior por parte de empresas con inversión extranjera (egreso) y cobros por inversiones argentinas en el exterior (ingreso).",
  },
  intereses_cta_cte: {
    id: "intereses_cta_cte",
    nombre: "Intereses (Cuenta Corriente)",
    nombreCorto: "Intereses",
    categoria: "Ingresos",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Pago y cobro neto de intereses registrado dentro del ingreso primario de la cuenta corriente.",
  },
  ingreso_secundario: {
    id: "ingreso_secundario",
    nombre: "Ingreso Secundario",
    nombreCorto: "Ingreso 2º",
    categoria: "Ingresos",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Saldo neto de transferencias corrientes (ingreso secundario) del balance cambiario.",
  },
  ied: {
    id: "ied",
    nombre: "Inversión Extranjera Directa (IED)",
    nombreCorto: "IED",
    categoria: "Inversión extranjera",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion:
      "Saldo neto de inversión directa de no residentes en Argentina liquidada por el mercado de cambios (ingresos de capital menos desinversiones/egresos).",
  },
  inversion_portafolio_no_residentes: {
    id: "inversion_portafolio_no_residentes",
    nombre: "Inversión de Portafolio de No Residentes",
    nombreCorto: "Inv. Portafolio",
    categoria: "Inversión extranjera",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Saldo neto de inversiones de portafolio de no residentes (acciones, títulos) cursadas por el mercado de cambios.",
  },
  inversion_inmuebles_no_residentes: {
    id: "inversion_inmuebles_no_residentes",
    nombre: "Inversión en Inmuebles de No Residentes",
    nombreCorto: "Inv. Inmuebles",
    categoria: "Inversión extranjera",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Saldo neto de fondos aplicados por no residentes a la compra de inmuebles en Argentina.",
  },
  ide_residentes_exterior: {
    id: "ide_residentes_exterior",
    nombre: "Inversión de Residentes en el Exterior",
    nombreCorto: "Inv. Arg. en el Ext.",
    categoria: "Inversión extranjera",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Salida de divisas por inversiones directas de residentes argentinos en el exterior.",
  },
  deuda_financiera_total: {
    id: "deuda_financiera_total",
    nombre: "Deuda Financiera Total (flujo neto)",
    nombreCorto: "Deuda Fin. Total",
    categoria: "Deuda y financiamiento",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion:
      "Flujo neto de préstamos financieros, títulos de deuda y líneas de crédito con el exterior, todos los sectores (público + privado).",
  },
  deuda_financiera_privada: {
    id: "deuda_financiera_privada",
    nombre: "Deuda Financiera Privada",
    nombreCorto: "Deuda Fin. Privada",
    categoria: "Deuda y financiamiento",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion:
      "Flujo neto de préstamos financieros, títulos de deuda y líneas de crédito tomados o cancelados por el sector privado y financiero (excluye Sector Público).",
  },
  deuda_financiera_publica: {
    id: "deuda_financiera_publica",
    nombre: "Deuda Financiera — Sector Público",
    nombreCorto: "Deuda Fin. Pública",
    categoria: "Deuda y financiamiento",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Flujo neto de préstamos financieros, títulos de deuda y líneas de crédito del Sector Público.",
  },
  deuda_comercial: {
    id: "deuda_comercial",
    nombre: "Deuda Comercial (proxy)",
    nombreCorto: "Deuda Comercial",
    categoria: "Deuda y financiamiento",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion:
      "Proxy de financiamiento de comercio exterior: prefinanciaciones de exportaciones del exterior, financiaciones locales de exportaciones y cobros anticipados de exportaciones, netos de pagos diferidos de importaciones y otros egresos de bienes.",
  },
  fae: {
    id: "fae",
    nombre: "Formación de Activos Externos (FAE)",
    nombreCorto: "FAE",
    categoria: "Formación de activos externos",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion:
      "Compra neta de billetes y divisas sin fines específicos por el sector privado (atesoramiento/dolarización). Valor positivo = compra neta de divisas.",
  },
  operaciones_canje: {
    id: "operaciones_canje",
    nombre: "Operaciones de Canje con el Exterior",
    nombreCorto: "Op. de Canje",
    categoria: "Formación de activos externos",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Saldo neto de operaciones de canje por transferencias con el exterior.",
  },
  titulos_valores: {
    id: "titulos_valores",
    nombre: "Compra-venta de Títulos Valores",
    nombreCorto: "Títulos Valores",
    categoria: "Formación de activos externos",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Saldo neto de compra-venta de títulos valores cursada por el mercado de cambios.",
  },
  otros_mov_financiera: {
    id: "otros_mov_financiera",
    nombre: "Otros Movimientos de la Cuenta Financiera",
    nombreCorto: "Otros Mov. Financ.",
    categoria: "Formación de activos externos",
    unidad: "Millones de USD",
    tipo: "compuesta",
    descripcion: "Otros movimientos residuales de la cuenta financiera del balance cambiario.",
  },
};

export const ALL_SERIES_IDS: SerieId[] = Object.keys(SERIES_META) as SerieId[];

/** Las 8 series destacadas del dashboard principal. */
export const DASHBOARD_SERIES_IDS: SerieId[] = [
  "cuenta_corriente",
  "cuenta_financiera",
  "fae",
  "ied",
  "utilidades_dividendos",
  "deuda_financiera_privada",
  "deuda_comercial",
  "balance_bienes",
];

export function serieMetaCompuestaDe(id: SerieId): SerieMeta | undefined {
  return SERIES_META[id];
}

/** Agrupa todas las series por categoría, preservando el orden de inserción. */
export function seriesPorCategoria(): { categoria: string; series: SerieMeta[] }[] {
  const grupos = new Map<string, SerieMeta[]>();
  for (const id of ALL_SERIES_IDS) {
    const meta = SERIES_META[id];
    if (!grupos.has(meta.categoria)) grupos.set(meta.categoria, []);
    grupos.get(meta.categoria)!.push(meta);
  }
  return Array.from(grupos.entries()).map(([categoria, series]) => ({ categoria, series }));
}
