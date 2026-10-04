import raw from "@/data/balance_cambiario.json";
import { DatasetBalanceCambiario, SerieId } from "@/types";

const dataset = raw as DatasetBalanceCambiario;

export function getMeses(): string[] {
  return dataset.meses;
}

export function getSerieValues(id: SerieId): number[] {
  return dataset.series[id] ?? [];
}

/** Formatea "YYYY-MM" como "ene-03", "jul-26", etc. para ejes y tooltips. */
const MESES_ABREV = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function formatMes(mesIso: string): string {
  const [anio, mes] = mesIso.split("-");
  const idx = parseInt(mes, 10) - 1;
  return `${MESES_ABREV[idx]}-${anio.slice(2)}`;
}

export function formatMesesEje(meses: string[]): string[] {
  return meses.map(formatMes);
}

export function ultimoDatoLabel(): string {
  const meses = getMeses();
  return formatMes(meses[meses.length - 1]);
}

/** Devuelve los últimos N valores no nulos de una serie (para el sparkline / variación). */
export function ultimoValor(id: SerieId): number {
  const v = getSerieValues(id);
  return v.length ? v[v.length - 1] : 0;
}

export function acumulado12m(id: SerieId): number {
  const v = getSerieValues(id);
  const ultimos = v.slice(-12);
  return ultimos.reduce((a, b) => a + b, 0);
}

export function rangoFechas(): { desde: string; hasta: string } {
  const meses = getMeses();
  return { desde: formatMes(meses[0]), hasta: formatMes(meses[meses.length - 1]) };
}

/** Primer y último mes disponibles en el dataset, en formato "YYYY-MM" (para límites del selector de fechas). */
export function limitesDeMeses(): { primero: string; ultimo: string } {
  const meses = getMeses();
  return { primero: meses[0], ultimo: meses[meses.length - 1] };
}

/**
 * Recorta `meses` y `valores` (arrays paralelos) al rango [desde, hasta]
 * (inclusive, formato "YYYY-MM"). Si desde/hasta caen fuera del dataset, se
 * ajustan a los extremos disponibles.
 */
export function recortarPorRango(
  meses: string[],
  valores: number[],
  desde: string,
  hasta: string
): { meses: string[]; valores: number[] } {
  let iDesde = meses.findIndex((m) => m >= desde);
  if (iDesde === -1) iDesde = 0;
  let iHasta = meses.length - 1;
  for (let i = meses.length - 1; i >= 0; i--) {
    if (meses[i] <= hasta) {
      iHasta = i;
      break;
    }
  }
  if (iHasta < iDesde) return { meses: [], valores: [] };
  return { meses: meses.slice(iDesde, iHasta + 1), valores: valores.slice(iDesde, iHasta + 1) };
}
