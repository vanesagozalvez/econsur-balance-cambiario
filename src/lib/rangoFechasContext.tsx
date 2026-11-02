"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { limitesDeMeses } from "@/lib/data";
import { RangoFechas } from "@/types";

interface RangoFechasContextValue {
  rango: RangoFechas;
  limites: { primero: string; ultimo: string };
  setDesde: (desde: string) => void;
  setHasta: (hasta: string) => void;
  restablecer: () => void;
}

const RangoFechasContext = createContext<RangoFechasContextValue | null>(null);

export function RangoFechasProvider({ children }: { children: ReactNode }) {
  const limites = useMemo(() => limitesDeMeses(), []);
  // Por defecto: TODO el historial disponible (primer mes del dataset, hoy
  // enero 2003) -> último dato disponible.
  const desdeDefault = limites.primero;

  const [rango, setRango] = useState<RangoFechas>({ desde: desdeDefault, hasta: limites.ultimo });

  const value = useMemo<RangoFechasContextValue>(
    () => ({
      rango,
      limites,
      setDesde: (desde: string) =>
        setRango((prev) => ({ ...prev, desde: desde > prev.hasta ? prev.hasta : desde })),
      setHasta: (hasta: string) =>
        setRango((prev) => ({ ...prev, hasta: hasta < prev.desde ? prev.desde : hasta })),
      restablecer: () => setRango({ desde: desdeDefault, hasta: limites.ultimo }),
    }),
    [rango, limites, desdeDefault]
  );

  return <RangoFechasContext.Provider value={value}>{children}</RangoFechasContext.Provider>;
}

export function useRangoFechas(): RangoFechasContextValue {
  const ctx = useContext(RangoFechasContext);
  if (!ctx) {
    throw new Error("useRangoFechas debe usarse dentro de <RangoFechasProvider>");
  }
  return ctx;
}
