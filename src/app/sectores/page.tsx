"use client";

import { useCallback, useMemo, useState } from "react";
import AgruparSectores from "@/components/AgruparSectores";
import ComparadorChart from "@/components/ComparadorChart";
import SectorSeriesPicker from "@/components/SectorSeriesPicker";
import SelectedSeriesRow from "@/components/SelectedSeriesRow";
import { colorDe } from "@/lib/chartStyle";
import {
  getValoresSectorConcepto,
  getValoresSectoresAgrupados,
  idsDisponiblesSectores,
  listaSectores,
  metaDeSector,
} from "@/lib/sectoresData";
import { SerieId, SerieSeleccionada, TipoGrafico } from "@/types";

const MAX_SERIES = 8;
const MAX_SECTORES_AGRUPADOS = 6;

function slugArchivo(nombre: string): string {
  return nombre
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** "Gas (Extracción, Transporte, Distribución)" -> "Gas": nombre corto para armar nombres de archivo. */
function nombreCortoSector(nombre: string): string {
  return nombre.replace(/\s*\(.*?\)/g, "").trim();
}

export default function SectoresPage() {
  const sectores = useMemo(() => listaSectores(), []);
  const [sectorId, setSectorId] = useState<string>(sectores[0]?.id ?? "");
  /** Sectores agrupados (se suman). Con 2 o más hay agrupación activa; vacío = un solo sector. */
  const [sectoresGrupo, setSectoresGrupo] = useState<string[]>([]);
  const [seleccion, setSeleccion] = useState<SerieSeleccionada[]>([]);

  const modoGrupo = sectoresGrupo.length >= 2;
  const idsActivos = useMemo(() => (modoGrupo ? sectoresGrupo : [sectorId]), [modoGrupo, sectoresGrupo, sectorId]);
  const nombresActivos = useMemo(
    () => idsActivos.map((id) => sectores.find((s) => s.id === id)?.nombre ?? id),
    [idsActivos, sectores]
  );

  /** Subtítulo del gráfico: el sector, o la lista de sectores agrupados. */
  const subtitulo = modoGrupo ? `Sectores agrupados: ${nombresActivos.join(" + ")}` : nombresActivos[0] ?? "";
  const nombreArchivo = modoGrupo
    ? `balance-cambiario_agrupado_${slugArchivo(nombresActivos.map(nombreCortoSector).join(" ")).slice(0, 80)}`
    : `balance-cambiario_${slugArchivo(nombresActivos[0] ?? sectorId)}`;

  /** Conserva solo las series que existen en los sectores elegidos (el resto no tendría datos). */
  const conservarDisponibles = useCallback((ids: string[]) => {
    const disponibles = idsDisponiblesSectores(ids);
    setSeleccion((prev) => prev.filter((s) => disponibles.has(s.id)));
  }, []);

  const cambiarSector = useCallback(
    (nuevoSectorId: string) => {
      setSectorId(nuevoSectorId);
      conservarDisponibles([nuevoSectorId]);
    },
    [conservarDisponibles]
  );

  const aplicarAgrupacion = useCallback(
    (ids: string[]) => {
      if (ids.length >= 2) {
        setSectoresGrupo(ids);
        conservarDisponibles(ids);
      } else if (ids.length === 1) {
        // Un solo sector marcado: no hay nada que sumar, se trabaja como sector individual.
        setSectoresGrupo([]);
        setSectorId(ids[0]);
        conservarDisponibles(ids);
      }
    },
    [conservarDisponibles]
  );

  const quitarAgrupacion = useCallback(() => {
    setSectoresGrupo([]);
    conservarDisponibles([sectorId]);
  }, [conservarDisponibles, sectorId]);

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

  const cambiarEtiquetas = useCallback((id: SerieId, mostrarEtiquetas: boolean) => {
    setSeleccion((prev) => prev.map((s) => (s.id === id ? { ...s, mostrarEtiquetas } : s)));
  }, []);

  // Con agrupación, cada serie es la SUMA de ese total/movimiento en todos los sectores del grupo.
  const obtenerValores = useCallback(
    (id: SerieId) =>
      modoGrupo ? getValoresSectoresAgrupados(sectoresGrupo, id) : getValoresSectorConcepto(sectorId, id),
    [modoGrupo, sectoresGrupo, sectorId]
  );

  return (
    <div>
      <section className="mb-6">
        <h1 className="text-2xl font-bold text-institucional-navy sm:text-3xl">Comparar por Sector</h1>
        <p className="mt-1 max-w-3xl text-sm text-institucional-textsec">
          Elegí un sector económico y graficá sus movimientos cambiarios: cobros de exportaciones,
          pagos de importaciones, préstamos financieros, utilidades y dividendos, y todos los demás
          conceptos que el BCRA le atribuye a ese sector. Con &ldquo;Agrupar&rdquo; podés sumar hasta{" "}
          {MAX_SECTORES_AGRUPADOS} sectores (por ejemplo Petróleo, Gas y Electricidad) y graficarlos como uno solo.
        </p>
      </section>

      <section className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-institucional-text">
          Sector
          <select
            value={sectorId}
            onChange={(e) => cambiarSector(e.target.value)}
            disabled={modoGrupo}
            title={modoGrupo ? "Hay una agrupación activa: quitala para volver a elegir un solo sector" : undefined}
            className="min-w-[260px] rounded-md border border-institucional-border bg-white px-3 py-1.5 text-sm outline-none focus:border-institucional-teal disabled:cursor-not-allowed disabled:bg-institucional-bg disabled:text-institucional-textsec"
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

      {modoGrupo && (
        <section className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-institucional-teal/40 bg-institucional-teal/5 px-3 py-2 text-sm">
          <span className="font-semibold text-institucional-navy">Agrupación activa ({nombresActivos.length} sectores):</span>
          <span className="text-institucional-text">{nombresActivos.join(" + ")}</span>
          <button
            type="button"
            onClick={quitarAgrupacion}
            className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            Quitar agrupación
          </button>
        </section>
      )}

      {sectorId && (
        <>
          <section className="mb-4 flex flex-wrap items-center gap-3">
            <SectorSeriesPicker
              sectorIds={idsActivos}
              seleccionadas={seleccion.map((s) => s.id)}
              onAgregar={agregarSerie}
              maxSeries={MAX_SERIES}
            />
            <AgruparSectores
              sectores={sectores}
              seleccionInicial={idsActivos}
              agrupacionActiva={modoGrupo}
              onAplicar={aplicarAgrupacion}
              onQuitar={quitarAgrupacion}
              max={MAX_SECTORES_AGRUPADOS}
            />
            <span className="ml-auto text-xs text-institucional-textsec">
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
                  onCambiarEtiquetas={(mostrar) => cambiarEtiquetas(config.id, mostrar)}
                  onQuitar={() => quitarSerie(config.id)}
                />
              ))}
            </section>
          )}

          <ComparadorChart
            seleccion={seleccion}
            obtenerMeta={metaDeSector}
            obtenerValores={obtenerValores}
            subtitulo={subtitulo}
            nombreArchivoCSV={nombreArchivo}
          />
        </>
      )}
    </div>
  );
}
