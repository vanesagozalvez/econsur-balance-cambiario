"use client";

import { useCallback, useMemo, useState } from "react";
import ComparadorChart from "@/components/ComparadorChart";
import SectorSeriesPicker from "@/components/SectorSeriesPicker";
import SelectedSeriesRow from "@/components/SelectedSeriesRow";
import { colorDe } from "@/lib/chartStyle";
import { listaSectores, getValoresSectorConcepto, metaDeSector } from "@/lib/sectoresData";
import { SerieId, SerieSeleccionada, TipoGrafico } from "@/types";

const MAX_SERIES = 8;

function slugArchivo(nombre: string): string {
  return nombre
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function SectoresPage() {
  const sectores = useMemo(() => listaSectores(), []);
  const [sectorId, setSectorId] = useState<string>(sectores[0]?.id ?? "");
  const [seleccion, setSeleccion] = useState<SerieSeleccionada[]>([]);

  const sectorActual = sectores.find((s) => s.id === sectorId);

  const cambiarSector = useCallback((nuevoSectorId: string) => {
    setSectorId(nuevoSectorId);
    // Los conceptos seleccionados pertenecen al sector anterior: hay que
    // volver a elegirlos para el nuevo sector (pueden no existir en el otro).
    setSeleccion([]);
  }, []);

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

  const obtenerValores = useCallback(
    (id: SerieId) => getValoresSectorConcepto(sectorId, id),
    [sectorId]
  );

  return (
    <div>
      <section className="mb-6">
        <h1 className="text-2xl font-bold text-institucional-navy sm:text-3xl">Comparar por Sector</h1>
        <p className="mt-1 max-w-3xl text-sm text-institucional-textsec">
          Elegí un sector económico y graficá sus movimientos cambiarios: cobros de exportaciones,
          pagos de importaciones, préstamos financieros, utilidades y dividendos, y todos los demás
          conceptos que el BCRA le atribuye a ese sector.
        </p>
      </section>

      <section className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-institucional-text">
          Sector
          <select
            value={sectorId}
            onChange={(e) => cambiarSector(e.target.value)}
            className="min-w-[260px] rounded-md border border-institucional-border bg-white px-3 py-1.5 text-sm outline-none focus:border-institucional-teal"
          >
            {sectores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-institucional-textsec">{sectores.length} sectores disponibles</span>
      </section>

      {sectorId && (
        <>
          <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SectorSeriesPicker
              sectorId={sectorId}
              seleccionadas={seleccion.map((s) => s.id)}
              onAgregar={agregarSerie}
              maxSeries={MAX_SERIES}
            />
            <span className="text-xs text-institucional-textsec">
              {seleccion.length} / {MAX_SERIES} movimientos seleccionados
            </span>
          </section>

          {seleccion.length > 0 && (
            <section className="mb-4 flex flex-col gap-2">
              {seleccion.map((config, indice) => (
                <SelectedSeriesRow
                  key={config.id}
                  config={config}
                  meta={metaDeSector(config.id)}
                  color={colorDe(indice)}
                  onCambiarTipo={(tipo) => cambiarTipo(config.id, tipo)}
                  onCambiarEje={(eje) => cambiarEje(config.id, eje)}
                  onQuitar={() => quitarSerie(config.id)}
                />
              ))}
            </section>
          )}

          <ComparadorChart
            seleccion={seleccion}
            obtenerMeta={metaDeSector}
            obtenerValores={obtenerValores}
            nombreArchivoCSV={`balance-cambiario_${slugArchivo(sectorActual?.nombre ?? sectorId)}`}
          />
        </>
      )}
    </div>
  );
}
