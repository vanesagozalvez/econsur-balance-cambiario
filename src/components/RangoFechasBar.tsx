"use client";

import { useRangoFechas } from "@/lib/rangoFechasContext";
import { formatMes } from "@/lib/data";

export default function RangoFechasBar() {
  const { rango, limites, setDesde, setHasta, restablecer } = useRangoFechas();

  return (
    <div className="border-b border-institucional-border bg-institucional-bg">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-institucional-textsec">
          Período
        </span>

        <label className="flex items-center gap-2 text-sm text-institucional-text">
          Desde
          <input
            type="month"
            value={rango.desde}
            min={limites.primero}
            max={rango.hasta}
            onChange={(e) => e.target.value && setDesde(e.target.value)}
            className="rounded-md border border-institucional-border bg-white px-2 py-1 text-sm outline-none focus:border-institucional-teal"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-institucional-text">
          Hasta
          <input
            type="month"
            value={rango.hasta}
            min={rango.desde}
            max={limites.ultimo}
            onChange={(e) => e.target.value && setHasta(e.target.value)}
            className="rounded-md border border-institucional-border bg-white px-2 py-1 text-sm outline-none focus:border-institucional-teal"
          />
        </label>

        <button
          type="button"
          onClick={restablecer}
          className="rounded-md px-2 py-1 text-xs font-medium text-institucional-teal transition hover:bg-white"
          title={`Restablecer a ene-23 – ${formatMes(limites.ultimo)}`}
        >
          Restablecer
        </button>

        <span className="ml-auto text-xs text-institucional-textsec">
          Datos disponibles: {formatMes(limites.primero)} – {formatMes(limites.ultimo)}
        </span>
      </div>
    </div>
  );
}
