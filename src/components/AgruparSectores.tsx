"use client";

import { useMemo, useRef, useState } from "react";
import { useOnClickOutside } from "@/lib/useOnClickOutside";
import { SectorMeta } from "@/types";

interface AgruparSectoresProps {
  sectores: SectorMeta[];
  /** Sectores que quedan tildados al abrir el panel: el grupo activo o, si no hay, el sector actual. */
  seleccionInicial: string[];
  agrupacionActiva: boolean;
  /** Se llama con los sectores tildados (en el orden en que se fueron eligiendo). */
  onAplicar: (ids: string[]) => void;
  onQuitar: () => void;
  max?: number;
}

export default function AgruparSectores({
  sectores,
  seleccionInicial,
  agrupacionActiva,
  onAplicar,
  onQuitar,
  max = 6,
}: AgruparSectoresProps) {
  const [abierto, setAbierto] = useState(false);
  const [marcados, setMarcados] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setAbierto(false));

  const q = busqueda.trim().toLowerCase();
  const visibles = useMemo(
    () => (q ? sectores.filter((s) => s.nombre.toLowerCase().includes(q)) : sectores),
    [sectores, q]
  );
  const llegoAlMaximo = marcados.length >= max;

  function abrirPanel() {
    if (!abierto) {
      setMarcados(seleccionInicial);
      setBusqueda("");
    }
    setAbierto((v) => !v);
  }

  function alternar(id: string) {
    setMarcados((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= max) return prev;
      return [...prev, id];
    });
  }

  function aplicar() {
    if (marcados.length === 0) return;
    onAplicar(marcados);
    setAbierto(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={abrirPanel}
        title="Suma los valores de varios sectores (hasta 6) y los grafica como si fueran un solo sector"
        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition ${
          agrupacionActiva
            ? "border-institucional-teal bg-institucional-teal text-white hover:bg-[#256f8d]"
            : "border-institucional-navy bg-white text-institucional-navy hover:bg-institucional-bg"
        }`}
      >
        <span className="text-base leading-none">Σ</span>
        Agrupar
        {agrupacionActiva && <span className="rounded-full bg-white/25 px-1.5 text-xs">activa</span>}
      </button>

      {abierto && (
        <div className="absolute left-0 z-30 mt-2 w-[26rem] max-w-[92vw] rounded-xl border border-institucional-border bg-white p-3 shadow-cardHover">
          <p className="mb-2 text-xs text-institucional-textsec">
            Marcá hasta {max} sectores. Se suman, mes a mes, todos sus totales y movimientos, y se grafican como si
            fueran un único sector (por ejemplo, Petróleo + Gas + Electricidad para ver el sector energético).
          </p>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar sector…"
            className="mb-2 w-full rounded-md border border-institucional-border px-3 py-1.5 text-sm outline-none focus:border-institucional-teal"
          />
          <div className="max-h-64 overflow-y-auto pr-1">
            {visibles.length === 0 && <p className="px-2 py-3 text-sm text-institucional-textsec">Sin resultados.</p>}
            {visibles.map((s) => {
              const tildado = marcados.includes(s.id);
              const deshabilitado = !tildado && llegoAlMaximo;
              return (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                    deshabilitado ? "cursor-not-allowed text-institucional-gray" : "text-institucional-text hover:bg-institucional-bg"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tildado}
                    disabled={deshabilitado}
                    onChange={() => alternar(s.id)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-institucional-border text-institucional-navy focus:ring-institucional-teal"
                  />
                  <span>{s.nombre}</span>
                </label>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-institucional-border pt-3">
            <span className="mr-auto text-xs text-institucional-textsec">
              {marcados.length} / {max} sectores
              {llegoAlMaximo && " (máximo)"}
            </span>
            {agrupacionActiva && (
              <button
                type="button"
                onClick={() => {
                  onQuitar();
                  setAbierto(false);
                }}
                className="rounded-md px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                Quitar agrupación
              </button>
            )}
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-md px-2 py-1.5 text-xs font-medium text-institucional-textsec transition hover:bg-institucional-bg"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={aplicar}
              disabled={marcados.length === 0}
              className="rounded-md bg-institucional-navy px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#16294d] disabled:cursor-not-allowed disabled:bg-institucional-gray"
            >
              {marcados.length >= 2 ? `Agrupar ${marcados.length} sectores` : "Aplicar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
