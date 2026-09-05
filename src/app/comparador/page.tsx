"use client";

import { useCallback, useState } from "react";
import ComparadorChart from "@/components/ComparadorChart";
import SeriesPicker from "@/components/SeriesPicker";
import SelectedSeriesRow from "@/components/SelectedSeriesRow";
import { colorDe } from "@/lib/chartStyle";
import { SerieId, SerieSeleccionada, TipoGrafico } from "@/types";

const MAX_SERIES = 8;

const SELECCION_INICIAL: SerieSeleccionada[] = [
  { id: "cuenta_corriente", tipo: "Línea suavizada", ejeSecundario: false },
  { id: "cuenta_financiera", tipo: "Línea con marcadores", ejeSecundario: false },
];

interface Preset {
  nombre: string;
  seleccion: SerieSeleccionada[];
}

const PRESETS: Preset[] = [
  {
    nombre: "Cuentas principales",
    seleccion: [
      { id: "cuenta_corriente", tipo: "Área apilada", ejeSecundario: false },
      { id: "cuenta_capital", tipo: "Área apilada", ejeSecundario: false },
      { id: "cuenta_financiera", tipo: "Área apilada", ejeSecundario: false },
    ],
  },
  {
    nombre: "Dolarización vs. IED",
    seleccion: [
      { id: "fae", tipo: "Columna vertical", ejeSecundario: false },
      { id: "ied", tipo: "Línea con marcadores", ejeSecundario: true },
    ],
  },
  {
    nombre: "Deuda: privada vs. pública",
    seleccion: [
      { id: "deuda_financiera_privada", tipo: "Columna vertical apilada", ejeSecundario: false },
      { id: "deuda_financiera_publica", tipo: "Columna vertical apilada", ejeSecundario: false },
    ],
  },
  {
    nombre: "Composición cta. financiera (100%)",
    seleccion: [
      { id: "ied", tipo: "Columna vertical 100% apilada", ejeSecundario: false },
      { id: "deuda_financiera_total", tipo: "Columna vertical 100% apilada", ejeSecundario: false },
      { id: "fae", tipo: "Columna vertical 100% apilada", ejeSecundario: false },
    ],
  },
];

export default function ComparadorPage() {
  const [seleccion, setSeleccion] = useState<SerieSeleccionada[]>(SELECCION_INICIAL);

  const agregarSerie = useCallback((id: SerieId) => {
    setSeleccion((prev) => {
      if (prev.some((s) => s.id === id) || prev.length >= MAX_SERIES) return prev;
      return [...prev, { id, tipo: "Línea suavizada", ejeSecundario: false }];
    });
  }, []);

  const quitarSerie = useCallback((id: SerieId) => {
    setSeleccion((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const cambiarTipo = useCallback((id: SerieId, tipo: TipoGrafico) => {
    setSeleccion((prev) => prev.map((s) => (s.id === id ? { ...s, tipo } : s)));
  }, []);

  const cambiarEje = useCallback((id: SerieId, ejeSecundario: boolean) => {
    setSeleccion((prev) => prev.map((s) => (s.id === id ? { ...s, ejeSecundario } : s)));
  }, []);

  return (
    <div>
      <section className="mb-6">
        <h1 className="text-2xl font-bold text-institucional-navy sm:text-3xl">Comparador de Series</h1>
        <p className="mt-1 max-w-3xl text-sm text-institucional-textsec">
          Seleccioná hasta {MAX_SERIES} series del balance cambiario y elegí, para cada una, el tipo de
          gráfico: línea suavizada, línea con marcadores, línea discontinua, área suavizada, área
          apilada, columna, columna apilada o columna 100% apilada.
        </p>
      </section>

      <section className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-institucional-textsec">
          Presets:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.nombre}
            type="button"
            onClick={() => setSeleccion(p.seleccion)}
            className="rounded-full border border-institucional-border bg-white px-3 py-1 text-xs font-medium text-institucional-text transition hover:border-institucional-teal hover:text-institucional-teal"
          >
            {p.nombre}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSeleccion([])}
          className="ml-auto rounded-full px-3 py-1 text-xs font-medium text-institucional-textsec transition hover:text-red-600"
        >
          Limpiar todo
        </button>
      </section>

      <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SeriesPicker seleccionadas={seleccion.map((s) => s.id)} onAgregar={agregarSerie} maxSeries={MAX_SERIES} />
        <span className="text-xs text-institucional-textsec">
          {seleccion.length} / {MAX_SERIES} series seleccionadas
        </span>
      </section>

      {seleccion.length > 0 && (
        <section className="mb-4 flex flex-col gap-2">
          {seleccion.map((config, indice) => (
            <SelectedSeriesRow
              key={config.id}
              config={config}
              color={colorDe(indice)}
              onCambiarTipo={(tipo) => cambiarTipo(config.id, tipo)}
              onCambiarEje={(eje) => cambiarEje(config.id, eje)}
              onQuitar={() => quitarSerie(config.id)}
            />
          ))}
        </section>
      )}

      <ComparadorChart seleccion={seleccion} />
    </div>
  );
}
