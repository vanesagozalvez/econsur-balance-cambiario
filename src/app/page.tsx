import MiniChartCard from "@/components/MiniChartCard";
import { DASHBOARD_SERIES_IDS, serieMetaDe } from "@/lib/catalogo";

export default function DashboardPage() {
  return (
    <div>
      <section className="mb-6">
        <h1 className="text-2xl font-bold text-institucional-navy sm:text-3xl">
          Balance Cambiario Argentino
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-institucional-textsec">
          Evolución mensual de las principales cuentas del Mercado Único y Libre de Cambios (MULC),
          reconstruida a partir de la apertura por sector y concepto del BCRA. Ajustá el período con
          el selector de fechas de arriba.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_SERIES_IDS.map((id, i) => {
          const meta = serieMetaDe(id);
          return <MiniChartCard key={id} meta={meta} colorIndex={i} />;
        })}
      </section>

      <section className="mt-8 rounded-xl border border-institucional-border bg-white p-5">
        <h2 className="text-base font-semibold text-institucional-navy">
          ¿Necesitás combinar y comparar series?
        </h2>
        <p className="mt-1 text-sm text-institucional-textsec">
          El Comparador de Series te da acceso a estas 8 series destacadas y también a{" "}
          <span className="font-medium text-institucional-text">todos</span> los conceptos del
          balance cambiario (más de 50), organizados por Cuenta y Subcuenta. Podés graficar cada
          una como línea suavizada, línea con marcadores, línea discontinua, área suavizada, área
          apilada, columna, columna apilada o columna 100% apilada.
        </p>
        <a
          href="/comparador"
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-institucional-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-[#16294d]"
        >
          Ir al Comparador de Series →
        </a>
      </section>
    </div>
  );
}
