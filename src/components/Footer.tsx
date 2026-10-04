export default function Footer() {
  return (
    <footer className="mt-10 border-t border-institucional-border bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-6 text-xs text-institucional-textsec sm:px-6">
        <p>
          Fuente: BCRA — planilla de Mercado de Cambios (apertura mensual por sector y concepto del
          balance cambiario). Importes en millones de USD; convención de signos: ingresos (+) / egresos (−).
        </p>
        <p className="mt-1">
          Algunas series (Deuda Comercial, Formación de Activos Externos, Deuda Financiera Privada) son
          agregaciones propias construidas a partir de los rubros disponibles en la apertura pública y
          pueden no coincidir exactamente con series oficiales publicadas bajo el mismo nombre.
        </p>
      </div>
    </footer>
  );
}
