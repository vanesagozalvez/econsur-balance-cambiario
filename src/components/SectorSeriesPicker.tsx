"use client";

import { useMemo, useRef, useState } from "react";
import { useOnClickOutside } from "@/lib/useOnClickOutside";
import { arbolSector, NodoCuentaSector, NodoGrupoSector, NodoSubcuentaSector } from "@/lib/sectoresData";
import { SerieId, SerieMeta } from "@/types";

interface SectorSeriesPickerProps {
  sectorId: string;
  seleccionadas: SerieId[];
  onAgregar: (id: SerieId) => void;
  maxSeries?: number;
}

function filtrarArbol(arbol: NodoCuentaSector[], q: string): NodoCuentaSector[] {
  if (!q) return arbol;
  const coincide = (m?: SerieMeta) => !!m && m.nombre.toLowerCase().includes(q);

  return arbol
    .map((cuenta): NodoCuentaSector => ({
      cuenta: cuenta.cuenta,
      total: coincide(cuenta.total) ? cuenta.total : undefined,
      subcuentas: cuenta.subcuentas
        .map((sub): NodoSubcuentaSector => ({
          subcuenta: sub.subcuenta,
          total: coincide(sub.total) ? sub.total : undefined,
          grupos: sub.grupos
            .map((g): NodoGrupoSector => ({
              grupo: g.grupo,
              total: coincide(g.total) ? g.total : undefined,
              items: g.items.filter((it) => it.nombre.toLowerCase().includes(q)),
            }))
            .filter((g) => g.total || g.items.length > 0),
        }))
        .filter((s) => s.total || s.grupos.length > 0),
    }))
    .filter((c) => c.total || c.subcuentas.length > 0);
}

export default function SectorSeriesPicker({
  sectorId,
  seleccionadas,
  onAgregar,
  maxSeries = 8,
}: SectorSeriesPickerProps) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setAbierto(false));

  const arbol = useMemo(() => arbolSector(sectorId), [sectorId]);
  const alcanzoLimite = seleccionadas.length >= maxSeries;

  const q = busqueda.trim().toLowerCase();
  const arbolFiltrado = useMemo(() => filtrarArbol(arbol, q), [arbol, q]);

  function elegir(id: SerieId) {
    onAgregar(id);
    setBusqueda("");
    setAbierto(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        disabled={alcanzoLimite}
        className="flex items-center gap-2 rounded-lg border border-institucional-navy bg-institucional-navy px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#16294d] disabled:cursor-not-allowed disabled:border-institucional-gray disabled:bg-institucional-gray"
      >
        <span className="text-base leading-none">+</span>
        {alcanzoLimite ? `Máximo ${maxSeries} series` : "Agregar movimiento o total"}
      </button>

      {abierto && !alcanzoLimite && (
        <div className="absolute left-0 z-30 mt-2 w-96 rounded-xl border border-institucional-border bg-white p-2 shadow-cardHover">
          <input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar total o movimiento…"
            className="mb-2 w-full rounded-md border border-institucional-border px-3 py-1.5 text-sm outline-none focus:border-institucional-teal"
          />
          <p className="px-2 pb-1 text-[11px] text-institucional-textsec">
            Elegí un total (Cuenta, Subcuenta, Grupo) o un movimiento puntual.
          </p>
          <div className="max-h-[28rem] overflow-y-auto pr-1">
            {arbolFiltrado.length === 0 && (
              <p className="px-2 py-3 text-sm text-institucional-textsec">
                {q ? "Sin resultados." : "Este sector no tiene movimientos registrados."}
              </p>
            )}
            {arbolFiltrado.map((cuenta) => (
              <div key={cuenta.cuenta} className="mb-1">
                {cuenta.total ? (
                  <ItemSerie
                    meta={cuenta.total}
                    seleccionada={seleccionadas.includes(cuenta.total.id)}
                    onElegir={elegir}
                    nivel="cuenta"
                  />
                ) : (
                  <p className="px-2 pb-0.5 pt-1.5 text-xs font-bold text-institucional-text">{cuenta.cuenta}</p>
                )}
                {cuenta.subcuentas.map((sub) => (
                  <div key={sub.subcuenta} className="pl-3">
                    {sub.total ? (
                      <ItemSerie
                        meta={sub.total}
                        seleccionada={seleccionadas.includes(sub.total.id)}
                        onElegir={elegir}
                        nivel="subcuenta"
                      />
                    ) : (
                      <p className="px-2 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-institucional-textsec">
                        {sub.subcuenta}
                      </p>
                    )}
                    {sub.grupos.map((g) => (
                      <div key={g.grupo} className="pl-3">
                        {g.total && (
                          <ItemSerie
                            meta={g.total}
                            seleccionada={seleccionadas.includes(g.total.id)}
                            onElegir={elegir}
                            nivel="grupo"
                          />
                        )}
                        {g.items.map((it) => (
                          <ItemSerie
                            key={it.id}
                            meta={it}
                            seleccionada={seleccionadas.includes(it.id)}
                            onElegir={elegir}
                            nivel="concepto"
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type NivelItem = "cuenta" | "subcuenta" | "grupo" | "concepto";

function ItemSerie({
  meta,
  seleccionada,
  onElegir,
  nivel,
}: {
  meta: SerieMeta;
  seleccionada: boolean;
  onElegir: (id: SerieId) => void;
  nivel: NivelItem;
}) {
  const estiloPorNivel: Record<NivelItem, string> = {
    cuenta: "pl-2 pr-2 font-bold text-institucional-text",
    subcuenta: "pl-2 pr-2 font-semibold text-institucional-text",
    grupo: "pl-2 pr-2 font-medium text-institucional-text italic",
    concepto: "pl-4 pr-2 text-institucional-text",
  };

  return (
    <button
      type="button"
      disabled={seleccionada}
      onClick={() => onElegir(meta.id)}
      title={meta.descripcion}
      className={`flex w-full items-start gap-2 rounded-md py-1.5 text-left text-sm transition ${
        estiloPorNivel[nivel]
      } ${seleccionada ? "cursor-not-allowed !text-institucional-gray" : "hover:bg-institucional-bg"}`}
    >
      <span className="mt-0.5 w-3 shrink-0 not-italic">{seleccionada ? "✓" : ""}</span>
      <span className="truncate">{meta.nombre}</span>
    </button>
  );
}
