"use client";

import { serieMetaDe } from "@/lib/catalogo";
import { SerieSeleccionada, TIPOS_GRAFICO, TipoGrafico } from "@/types";

interface SelectedSeriesRowProps {
  config: SerieSeleccionada;
  color: string;
  onCambiarTipo: (tipo: TipoGrafico) => void;
  onCambiarEje: (ejeSecundario: boolean) => void;
  onQuitar: () => void;
}

export default function SelectedSeriesRow({
  config,
  color,
  onCambiarTipo,
  onCambiarEje,
  onQuitar,
}: SelectedSeriesRowProps) {
  const meta = serieMetaDe(config.id);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-institucional-border bg-white px-3 py-2.5">
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-[160px] flex-1">
        <p className="truncate text-sm font-medium text-institucional-text" title={meta.nombre}>
          {meta.nombre}
        </p>
        <p className="text-[11px] text-institucional-textsec">
          {meta.tipo === "detalle" ? `${meta.categoria} › ${meta.subcategoria}` : meta.categoria}
        </p>
      </div>

      <select
        value={config.tipo}
        onChange={(e) => onCambiarTipo(e.target.value as TipoGrafico)}
        className="rounded-md border border-institucional-border bg-white px-2 py-1.5 text-sm text-institucional-text outline-none focus:border-institucional-teal"
      >
        {TIPOS_GRAFICO.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <label className="flex select-none items-center gap-1.5 text-xs text-institucional-textsec">
        <input
          type="checkbox"
          checked={config.ejeSecundario}
          onChange={(e) => onCambiarEje(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-institucional-border text-institucional-navy focus:ring-institucional-teal"
        />
        Eje secundario
      </label>

      <button
        type="button"
        onClick={onQuitar}
        aria-label={`Quitar ${meta.nombre}`}
        className="ml-auto rounded-md px-2 py-1 text-sm text-institucional-textsec transition hover:bg-red-50 hover:text-red-600"
      >
        ✕
      </button>
    </div>
  );
}
