import rawSectores from "@/data/balance_cambiario_sectores.json";
import rawCore from "@/data/balance_cambiario.json";
import { DatasetBalanceCambiario, DatasetPorSector, SectorMeta, SerieMeta } from "@/types";
import { DETALLE_META } from "@/lib/detalleSeries";

const datasetCore = rawCore as unknown as DatasetBalanceCambiario;

/**
 * Este módulo importa `balance_cambiario_sectores.json` (varios MB: el
 * detalle mensual de cada uno de los ~29 sectores, en 4 niveles: Cuenta,
 * Subcuenta, Grupo y Concepto/movimiento). A propósito es un archivo
 * SEPARADO del dataset principal (`balance_cambiario.json`, ~230 KB): solo
 * la solapa "Comparar por Sector" importa este módulo, así que Next.js lo
 * deja en su propio chunk y el Dashboard / Comparador general no pagan ese
 * peso.
 */
const dataset = rawSectores as unknown as DatasetPorSector;

export function listaSectores(): SectorMeta[] {
  return Object.entries(dataset.porSector ?? {})
    .map(([id, s]) => ({ id, nombre: s.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function nombreSector(sectorId: string): string {
  return dataset.porSector?.[sectorId]?.nombre ?? sectorId;
}

export function getValoresSectorConcepto(sectorId: string, id: string): number[] {
  return dataset.porSector?.[sectorId]?.detalle?.[id] ?? [];
}

/**
 * Total GENERAL de un sector: suma de sus Cuentas (Corriente + Capital +
 * Financiera), mes a mes. No está precalculado en el JSON — se arma acá
 * sumando los pocos arrays de nivel Cuenta que ya existen para ese sector
 * (como mucho 4), así que es una operación barata.
 */
export function getValoresSectorTotal(sectorId: string): number[] {
  const detalle = dataset.porSector?.[sectorId]?.detalle ?? {};
  const idsCuenta = Object.entries(dataset.nodos ?? {})
    .filter(([id, n]) => n.nivel === "cuenta" && detalle[id])
    .map(([id]) => id);
  if (idsCuenta.length === 0) return [];
  const n = detalle[idsCuenta[0]].length;
  const total = new Array(n).fill(0);
  for (const id of idsCuenta) {
    const arr = detalle[id];
    for (let i = 0; i < n; i++) total[i] += arr[i] ?? 0;
  }
  return total;
}

/**
 * Resuelve metadatos para CUALQUIER id usado en la solapa "Comparar por
 * Sector": ids de total ("c-…" Cuenta, "sc-…" Subcuenta, "g-…" Grupo) o el
 * id de concepto/movimiento final ("d-…", compartido con el catálogo
 * general). Hace falta este resolutor aparte porque los ids de total no
 * existen en `DETALLE_META` (ese catálogo solo tiene el nivel Concepto).
 */
export function metaDeSector(id: string): SerieMeta {
  const nodo = dataset.nodos?.[id];
  if (nodo) {
    return {
      id,
      nombre: nodo.nombre,
      nombreCorto: nodo.nombre.length > 28 ? `${nodo.nombre.slice(0, 27)}…` : nodo.nombre,
      categoria: nodo.cuenta,
      subcategoria: nodo.subcuenta,
      unidad: "Millones de USD",
      tipo: "detalle",
      descripcion:
        nodo.nivel === "cuenta"
          ? `Total de la Cuenta "${nodo.cuenta}" para el sector seleccionado (suma de todos sus movimientos).`
          : nodo.nivel === "subcuenta"
          ? `Total de "${nodo.cuenta} → ${nodo.subcuenta}" para el sector seleccionado.`
          : `Total de "${nodo.cuenta} → ${nodo.subcuenta} → ${nodo.grupo}" para el sector seleccionado.`,
    };
  }
  if (DETALLE_META[id]) return DETALLE_META[id];
  return {
    id,
    nombre: id,
    nombreCorto: id,
    categoria: "Desconocida",
    unidad: "Millones de USD",
    tipo: "detalle",
    descripcion: "Serie no encontrada.",
  };
}

export interface NodoGrupoSector {
  grupo: string;
  /** Ítem seleccionable con el TOTAL del grupo. Solo existe si el grupo agrupa más de un movimiento. */
  total?: SerieMeta;
  items: SerieMeta[];
}

export interface NodoSubcuentaSector {
  subcuenta: string;
  /** Ítem seleccionable con el TOTAL de la subcuenta (p.ej. "Bienes (total)"). */
  total?: SerieMeta;
  grupos: NodoGrupoSector[];
}

export interface NodoCuentaSector {
  cuenta: string;
  /** Ítem seleccionable con el TOTAL de la cuenta (p.ej. "Cuenta Corriente (total)"). */
  total?: SerieMeta;
  subcuentas: NodoSubcuentaSector[];
}

/**
 * Arma el árbol Cuenta > Subcuenta > Grupo > Concepto para un sector,
 * incluyendo en cada nivel un ítem de TOTAL además de los movimientos hoja
 * — así se puede graficar tanto "Cuenta Corriente" entera como el
 * movimiento puntual "Cobros de exportaciones", para ese sector.
 */
export function arbolSector(sectorId: string): NodoCuentaSector[] {
  const detalleSector = dataset.porSector?.[sectorId]?.detalle ?? {};
  const idsDisponibles = new Set(Object.keys(detalleSector));

  const cuentas = new Map<string, Map<string, Map<string, SerieMeta[]>>>();
  const cuentaTotalId = new Map<string, string>();
  const subcuentaTotalId = new Map<string, string>(); // clave "cuenta|subcuenta"
  const grupoTotalId = new Map<string, string>(); // clave "cuenta|subcuenta|grupo"

  // Paso 1: ubicar, entre los ids que existen para este sector, cuáles son nodos de total.
  for (const id of idsDisponibles) {
    const nodo = dataset.nodos?.[id];
    if (!nodo) continue;
    if (nodo.nivel === "cuenta") cuentaTotalId.set(nodo.cuenta, id);
    else if (nodo.nivel === "subcuenta") subcuentaTotalId.set(`${nodo.cuenta}|${nodo.subcuenta}`, id);
    else if (nodo.nivel === "grupo") grupoTotalId.set(`${nodo.cuenta}|${nodo.subcuenta}|${nodo.grupo}`, id);
  }

  // Paso 2: ubicar los movimientos hoja (Concepto) que existen para este sector y agruparlos.
  for (const [id, meta] of Object.entries(DETALLE_META)) {
    if (!idsDisponibles.has(id)) continue;
    const raw = datasetCore.detalle[id];
    const cuenta = raw?.cuenta ?? meta.categoria;
    const subcuenta = raw?.subcuenta ?? meta.subcategoria ?? "Otros";
    const grupo = raw?.grupo || subcuenta;

    if (!cuentas.has(cuenta)) cuentas.set(cuenta, new Map());
    const subMap = cuentas.get(cuenta)!;
    if (!subMap.has(subcuenta)) subMap.set(subcuenta, new Map());
    const grupoMap = subMap.get(subcuenta)!;
    if (!grupoMap.has(grupo)) grupoMap.set(grupo, []);
    grupoMap.get(grupo)!.push(meta);
  }

  const resultado: NodoCuentaSector[] = [];
  for (const [cuenta, subMap] of cuentas) {
    const subcuentas: NodoSubcuentaSector[] = Array.from(subMap.entries())
      .map(([subcuenta, grupoMap]) => {
        const grupos: NodoGrupoSector[] = Array.from(grupoMap.entries())
          .map(([grupo, items]) => {
            const gid = grupoTotalId.get(`${cuenta}|${subcuenta}|${grupo}`);
            return {
              grupo,
              total: gid ? metaDeSector(gid) : undefined,
              items: items.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
            };
          })
          .sort((a, b) => a.grupo.localeCompare(b.grupo, "es"));
        const scid = subcuentaTotalId.get(`${cuenta}|${subcuenta}`);
        return { subcuenta, total: scid ? metaDeSector(scid) : undefined, grupos };
      })
      .sort((a, b) => a.subcuenta.localeCompare(b.subcuenta, "es"));
    const cid = cuentaTotalId.get(cuenta);
    resultado.push({ cuenta, total: cid ? metaDeSector(cid) : undefined, subcuentas });
  }

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

export type NivelFila = 0 | 1 | 2 | 3 | 4; // 0=Sector, 1=Cuenta, 2=Subcuenta, 3=Grupo, 4=Movimiento

export interface FilaSector {
  /** Único en TODA la tabla (prefijado por sector), apto para usar como key de React. */
  id: string;
  etiqueta: string;
  nivel: NivelFila;
  valores: number[];
  hijos: FilaSector[];
}

/**
 * Arma el árbol completo de un sector para la tabla expandible: fila raíz
 * = total del sector, y como hijos sucesivos los totales de Cuenta,
 * Subcuenta, Grupo (cuando agrupa más de un movimiento) y finalmente el
 * movimiento/Concepto. Se llama solo cuando el usuario expande ese sector
 * en la tabla (no hace falta para las ~29 filas raíz).
 */
export function filasSector(sectorId: string): FilaSector {
  const arbol = arbolSector(sectorId);

  const hijosCuentas: FilaSector[] = arbol.map((c): FilaSector => {
    const hijosSubcuentas: FilaSector[] = c.subcuentas.map((s): FilaSector => {
      const hijosGrupos: FilaSector[] = s.grupos.map((g): FilaSector => {
        const hijosConceptos: FilaSector[] = g.items.map((it) => ({
          id: `${sectorId}:${it.id}`,
          etiqueta: it.nombre,
          nivel: 4,
          valores: getValoresSectorConcepto(sectorId, it.id),
          hijos: [],
        }));
        if (g.total) {
          return {
            id: `${sectorId}:${g.total.id}`,
            etiqueta: g.total.nombre,
            nivel: 3,
            valores: getValoresSectorConcepto(sectorId, g.total.id),
            hijos: hijosConceptos,
          };
        }
        // Un solo movimiento adentro: ese movimiento reemplaza directamente
        // este nivel (ver nota en arbolSector / scripts/aggregate.mjs).
        return (
          hijosConceptos[0] ?? {
            id: `${sectorId}:grupo-vacio:${g.grupo}`,
            etiqueta: g.grupo,
            nivel: 3,
            valores: [],
            hijos: [],
          }
        );
      });
      return {
        id: s.total ? `${sectorId}:${s.total.id}` : `${sectorId}:subcuenta:${s.subcuenta}`,
        etiqueta: s.total?.nombre ?? `${s.subcuenta} (total)`,
        nivel: 2,
        valores: s.total ? getValoresSectorConcepto(sectorId, s.total.id) : [],
        hijos: hijosGrupos,
      };
    });
    return {
      id: c.total ? `${sectorId}:${c.total.id}` : `${sectorId}:cuenta:${c.cuenta}`,
      etiqueta: c.total?.nombre ?? `${c.cuenta} (total)`,
      nivel: 1,
      valores: c.total ? getValoresSectorConcepto(sectorId, c.total.id) : [],
      hijos: hijosSubcuentas,
    };
  });

  return {
    id: `sector:${sectorId}`,
    etiqueta: nombreSector(sectorId),
    nivel: 0,
    valores: getValoresSectorTotal(sectorId),
    hijos: hijosCuentas,
  };
}
