/**
 * Calcula, a partir de una serie mensual completa (sin recortar por el
 * selector de fechas) y un mes de referencia, los 8 indicadores de la
 * tabla "Por Sector": último mes, 3 acumulados y sus 4 variaciones
 * interanuales correspondientes.
 *
 * Todos los valores de entrada/salida de nivel (no las variaciones) están
 * en la misma unidad que `valores` (millones de USD en este dataset); la
 * conversión a miles de millones se hace solo al formatear para mostrar.
 */

export interface MetricasPeriodo {
  ultimoMes: number | null;
  acum3m: number | null;
  acumYTD: number | null;
  acum12m: number | null;
  varMes: number | null;
  var3m: number | null;
  varYTD: number | null;
  var12m: number | null;
}

const METRICAS_VACIAS: MetricasPeriodo = {
  ultimoMes: null,
  acum3m: null,
  acumYTD: null,
  acum12m: null,
  varMes: null,
  var3m: null,
  varYTD: null,
  var12m: null,
};

function sumaRango(valores: number[], desde: number, hasta: number): number | null {
  if (desde < 0 || hasta >= valores.length || desde > hasta) return null;
  let s = 0;
  for (let i = desde; i <= hasta; i++) s += valores[i] ?? 0;
  return s;
}

function variacion(actual: number | null, previo: number | null): number | null {
  if (actual === null || previo === null || previo === 0) return null;
  return (actual - previo) / Math.abs(previo);
}

/**
 * `meses` y `valores` deben ser arrays paralelos COMPLETOS (todo el
 * historial disponible, no recortados por el selector Desde/Hasta) para
 * que las comparaciones interanuales tengan los 12-24 meses de contexto
 * que necesitan hacia atrás. `mesReferencia` es el mes "hasta" (formato
 * "YYYY-MM") que se toma como el más reciente para todos los cálculos.
 */
export function calcularMetricas(meses: string[], valores: number[], mesReferencia: string): MetricasPeriodo {
  const idx = meses.indexOf(mesReferencia);
  if (idx === -1) return METRICAS_VACIAS;

  const anioRef = parseInt(mesReferencia.slice(0, 4), 10);
  const idxEnero = meses.indexOf(`${anioRef}-01`);

  const ultimoMes = valores[idx] ?? null;
  const acum3m = sumaRango(valores, idx - 2, idx);
  const acumYTD = idxEnero !== -1 ? sumaRango(valores, idxEnero, idx) : null;
  const acum12m = sumaRango(valores, idx - 11, idx);

  const idxAnioAnt = idx - 12;
  const mesAnioAnt = idxAnioAnt >= 0 ? valores[idxAnioAnt] ?? null : null;
  const acum3mAnioAnt = sumaRango(valores, idxAnioAnt - 2, idxAnioAnt);
  const idxEneroAnt = idxEnero !== -1 ? idxEnero - 12 : -1;
  const acumYTDAnioAnt = idxEneroAnt >= 0 && idxAnioAnt >= 0 ? sumaRango(valores, idxEneroAnt, idxAnioAnt) : null;
  const acum12mAnioAnt = sumaRango(valores, idxAnioAnt - 11, idxAnioAnt);

  return {
    ultimoMes,
    acum3m,
    acumYTD,
    acum12m,
    varMes: variacion(ultimoMes, mesAnioAnt),
    var3m: variacion(acum3m, acum3mAnioAnt),
    varYTD: variacion(acumYTD, acumYTDAnioAnt),
    var12m: variacion(acum12m, acum12mAnioAnt),
  };
}

/** Millones de USD -> miles de millones de USD, formateado para la tabla. */
export function formatMilesMillones(valor: number | null): string {
  if (valor === null || Number.isNaN(valor)) return "s/d";
  return (valor / 1000).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Valor crudo en miles de millones de USD (sin formatear), para CSV. */
export function enMilesMillones(valor: number | null): number | null {
  if (valor === null || Number.isNaN(valor)) return null;
  return Math.round((valor / 1000) * 10000) / 10000;
}

export function formatPorcentaje(valor: number | null): string {
  if (valor === null || Number.isNaN(valor)) return "s/d";
  const signo = valor > 0 ? "+" : "";
  return `${signo}${(valor * 100).toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

/** Valor crudo en % (ya multiplicado por 100, sin el símbolo), para CSV. */
export function enPorcentaje(valor: number | null): number | null {
  if (valor === null || Number.isNaN(valor)) return null;
  return Math.round(valor * 1000) / 10;
}
