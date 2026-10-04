"use client";

import { useCallback, useMemo, useState } from "react";
import { getMeses, formatMes } from "@/lib/data";
import { listaSectores, getValoresSectorTotal, filasSector, FilaSector } from "@/lib/sectoresData";
import {
  calcularMetricas,
  formatMilesMillones,
  formatPorcentaje,
  enMilesMillones,
  enPorcentaje,
  MetricasPeriodo,
} from "@/lib/metricasPeriodo";
import { useRangoFechas } from "@/lib/rangoFechasContext";

const ETIQUETA_NIVEL = ["Sector", "Cuenta", "Subcuenta", "Grupo", "Movimiento"] as const;

const COLUMNAS: { key: keyof MetricasPeriodo; titulo: string; tipo: "nivel" | "var" }[] = [
  { key: "ultimoMes", titulo: "Último mes", tipo: "nivel" },
  { key: "acum3m", titulo: "Acum. 3 meses", tipo: "nivel" },
  { key: "acumYTD", titulo: "Acum. año (YTD)", tipo: "nivel" },
  { key: "acum12m", titulo: "Acum. 12 meses", tipo: "nivel" },
  { key: "varMes", titulo: "Var. % mismo mes a/a", tipo: "var" },
  { key: "var3m", titulo: "Var. % acum. 3m a/a", tipo: "var" },
  { key: "varYTD", titulo: "Var. % acum. año a/a", tipo: "var" },
  { key: "var12m", titulo: "Var. % acum. 12m a/a", tipo: "var" },
];

function escaparCsv(valor: string): string {
  return /[",;\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

export default function TablaSectoresExpandible() {
  const { rango } = useRangoFechas();
  const mesReferencia = rango.hasta;
  const meses = useMemo(() => getMeses(), []);
  const mesReferenciaLabel = formatMes(mesReferencia);

  const sectores = useMemo(() => listaSectores(), []);
  const [expandido, setExpandido] = useState<Set<string>>(new Set());
  const [arbolPorSector, setArbolPorSector] = useState<Map<string, FilaSector>>(new Map());

  const toggleExpandir = useCallback(
    (id: string, sectorId?: string) => {
      setExpandido((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      if (sectorId && !arbolPorSector.has(sectorId)) {
        setArbolPorSector((prev) => {
          const next = new Map(prev);
          next.set(sectorId, filasSector(sectorId));
          return next;
        });
      }
    },
    [arbolPorSector]
  );

  const filasRaiz: FilaSector[] = useMemo(
    () =>
      sectores.map((s) => ({
        id: `sector:${s.id}`,
        etiqueta: s.nombre,
        nivel: 0,
        valores: getValoresSectorTotal(s.id),
        hijos: [],
      })),
    [sectores]
  );

  function renderFila(fila: FilaSector, profundidad: number, sectorId: string, key: string): JSX.Element[] {
    const metricas = calcularMetricas(meses, fila.valores, mesReferencia);
    const expandida = expandido.has(fila.id);
    // Para la fila raíz (nivel 0) los hijos viven en el árbol cacheado por sector;
    // para las demás, ya vienen resueltos en `fila.hijos`.
    const hijos = fila.nivel === 0 ? arbolPorSector.get(sectorId)?.hijos ?? [] : fila.hijos;
    const tieneHijos = fila.nivel === 0 || hijos.length > 0;

    const filaActual = (
      <tr key={key} className={fila.nivel === 0 ? "bg-institucional-bg/60" : "bg-white"}>
        <td className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-2 py-2 text-sm">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: `${profundidad * 1.1}rem` }}>
            {tieneHijos ? (
              <button
                type="button"
                onClick={() => toggleExpandir(fila.id, sectorId)}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-institucional-textsec transition hover:bg-institucional-bg"
                aria-label={expandida ? "Contraer" : "Expandir"}
              >
                {expandida ? "▾" : "▸"}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span
              className={
                fila.nivel === 0
                  ? "font-bold text-institucional-navy"
                  : fila.nivel === 1
                  ? "font-semibold text-institucional-text"
                  : fila.nivel === 2
                  ? "font-medium text-institucional-text"
                  : fila.nivel === 3
                  ? "italic text-institucional-text"
                  : "text-institucional-text"
              }
              title={fila.etiqueta}
            >
              {fila.etiqueta}
            </span>
          </div>
        </td>
        {COLUMNAS.map((col) => {
          const valor = metricas[col.key];
          const esVar = col.tipo === "var";
          return (
            <td
              key={col.key}
              className={`whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums ${
                esVar
                  ? valor === null
                    ? "text-institucional-textsec"
                    : valor >= 0
                    ? "text-emerald-700"
                    : "text-red-600"
                  : "text-institucional-text"
              }`}
            >
              {esVar ? formatPorcentaje(valor) : formatMilesMillones(valor)}
            </td>
          );
        })}
      </tr>
    );

    if (!expandida || !tieneHijos) return [filaActual];

    const filasHijos = hijos.flatMap((hijo, i) => renderFila(hijo, profundidad + 1, sectorId, `${key}/${i}`));
    return [filaActual, ...filasHijos];
  }

  const descargarCSV = useCallback(() => {
    const encabezado = ["Sector", "Nivel", "Etiqueta", ...COLUMNAS.map((c) => `${c.titulo} (ref. ${mesReferenciaLabel})`)];
    const filas: string[] = [encabezado.map(escaparCsv).join(";")];

    function agregarFila(fila: FilaSector, sectorNombre: string) {
      const metricas = calcularMetricas(meses, fila.valores, mesReferencia);
      const columnas = [
        sectorNombre,
        ETIQUETA_NIVEL[fila.nivel],
        fila.etiqueta,
        ...COLUMNAS.map((c) => {
          const v = metricas[c.key];
          const n = c.tipo === "var" ? enPorcentaje(v) : enMilesMillones(v);
          return n === null ? "" : String(n);
        }),
      ];
      filas.push(columnas.map(escaparCsv).join(";"));
      for (const hijo of fila.hijos) agregarFila(hijo, sectorNombre);
    }

    for (const s of sectores) {
      const raiz = arbolPorSector.get(s.id) ?? filasSector(s.id);
      agregarFila(raiz, s.nombre);
    }

    const csv = filas.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `balance-cambiario_por-sector_${mesReferencia}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sectores, arbolPorSector, meses, mesReferencia, mesReferenciaLabel]);

  return (
    <div className="rounded-xl border border-institucional-border bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-institucional-border px-3 py-2.5">
        <p className="text-xs text-institucional-textsec">
          Datos de referencia: <span className="font-medium text-institucional-text">{mesReferenciaLabel}</span> (el
          mes "Hasta" del selector de fechas de arriba). Los acumulados y variaciones usan todo el historial
          disponible hacia atrás, sin importar el "Desde" elegido.
        </p>
        <button
          type="button"
          onClick={descargarCSV}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-institucional-border bg-white px-3 py-1.5 text-xs font-medium text-institucional-text transition hover:border-institucional-teal hover:text-institucional-teal"
          title="Descarga la tabla completa (todos los sectores y sus 4 niveles) como CSV"
        >
          ⬇ Descargar CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-institucional-border bg-institucional-bg text-left">
              <th className="sticky left-0 z-10 bg-institucional-bg px-2 py-2 text-xs font-semibold uppercase tracking-wide text-institucional-textsec">
                Sector
              </th>
              {COLUMNAS.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-institucional-textsec"
                >
                  {c.titulo}
                  <br />
                  <span className="font-normal normal-case">
                    {c.tipo === "var" ? "vs. año anterior" : "miles MM USD"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{filasRaiz.flatMap((fila, i) => renderFila(fila, 0, sectores[i].id, `${fila.id}`))}</tbody>
        </table>
      </div>
    </div>
  );
}
