import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import RangoFechasBar from "@/components/RangoFechasBar";
import { RangoFechasProvider } from "@/lib/rangoFechasContext";

export const metadata: Metadata = {
  title: "Balance Cambiario Argentino | Dashboard BCRA",
  description:
    "Dashboard institucional para visualizar la evolución del Balance Cambiario de Argentina: cuenta corriente, cuenta financiera, formación de activos externos, IED, deuda financiera y comercial, y un comparador multivariable de series.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="min-h-screen bg-institucional-bg text-institucional-text antialiased">
        <RangoFechasProvider>
          <NavBar />
          <RangoFechasBar />
          <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
          <Footer />
        </RangoFechasProvider>
      </body>
    </html>
  );
}
