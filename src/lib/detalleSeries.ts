import raw from "@/data/balance_cambiario.json";
import { DatasetBalanceCambiario, SerieMeta } from "@/types";

const dataset = raw as unknown as DatasetBalanceCambiario;

/**
 * A diferencia de SERIES_META (curadas a mano), este catálogo se genera
 * automáticamente a partir de TODOS los conceptos (E, F, G, H) presentes en
 * el Excel original — ver scripts/aggregate.mjs. Si el BCRA agrega o saca
 * una categoría, este catálogo cambia solo en el próximo build, sin tocar
 * código.
 */
export const DETALLE_META: Record<string, SerieMeta> = {};

for (const [id, d] of Object.entries(dataset.detalle ?? {})) {
  const nombre = d.grupo && d.grupo !== d.concepto ? `${d.grupo} — ${d.concepto}` : d.concepto;
  DETALLE_META[id] = {
    id,
    nombre,
    nombreCorto: d.concepto.length > 28 ? `${d.concepto.slice(0, 27)}…` : d.concepto,
    categoria: d.cuenta,
    subcategoria: d.subcuenta,
    unidad: "Millones de USD",
    tipo: "detalle",
    descripcion: `${d.cuenta} → ${d.subcuenta} → ${d.grupo}. Concepto tal como se informa en la apertura del BCRA (sin curar).`,
  };
}

export function getValoresDetalle(id: string): number[] {
  return dataset.detalle?.[id]?.valores ?? [];
}

export interface NodoSubcuenta {
  subcuenta: string;
  items: SerieMeta[];
}

export interface NodoCuenta {
  cuenta: string;
  subcuentas: NodoSubcuenta[];
}

/** Arma el árbol Cuenta > Subcuenta > Concepto para el selector del Comparador. */
export function arbolDetalle(): NodoCuenta[] {
  const cuentas = new Map<string, Map<string, SerieMeta[]>>();

  for (const meta of Object.values(DETALLE_META)) {
    const cuenta = meta.categoria;
    const subcuenta = meta.subcategoria ?? "Otros";
    if (!cuentas.has(cuenta)) cuentas.set(cuenta, new Map());
    const subMap = cuentas.get(cuenta)!;
    if (!subMap.has(subcuenta)) subMap.set(subcuenta, []);
    subMap.get(subcuenta)!.push(meta);
  }

  const resultado: NodoCuenta[] = [];
  for (const [cuenta, subMap] of cuentas) {
    const subcuentas: NodoSubcuenta[] = Array.from(subMap.entries())
      .map(([subcuenta, items]) => ({
        subcuenta,
        items: items.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
      }))
      .sort((a, b) => a.subcuenta.localeCompare(b.subcuenta, "es"));
    resultado.push({ cuenta, subcuentas });
  }

  // Orden fijo y natural de las cuentas (coincide con la apertura del BCRA).
  const ordenCuentas = ["Cuenta Corriente", "Cuenta Capital", "Cuenta Financiera"];
  resultado.sort((a, b) => {
    const ia = ordenCuentas.indexOf(a.cuenta);
    const ib = ordenCuentas.indexOf(b.cuenta);
    if (ia === -1 && ib === -1) return a.cuenta.localeCompare(b.cuenta, "es");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return resultado;
}
