import TablaSectoresExpandible from "@/components/TablaSectoresExpandible";

export default function TablaSectoresPage() {
  return (
    <div>
      <section className="mb-6">
        <h1 className="text-2xl font-bold text-institucional-navy sm:text-3xl">Tabla por Sector</h1>
        <p className="mt-1 max-w-3xl text-sm text-institucional-textsec">
          Un sector por fila, con el último mes, los acumulados de 3, YTD y 12 meses (en miles de
          millones de USD) y sus variaciones interanuales. Desplegá cada sector para ver el mismo
          detalle por Cuenta, Subcuenta, Grupo y movimiento final.
        </p>
      </section>

      <TablaSectoresExpandible />
    </div>
  );
}
