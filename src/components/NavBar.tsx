"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/comparador", label: "Comparador de Series" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-institucional-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-institucional-navy text-sm font-bold text-white">
            BC
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-institucional-navy">Balance Cambiario Argentino</p>
            <p className="text-[11px] text-institucional-textsec">Mercado Único y Libre de Cambios · BCRA</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 rounded-lg bg-institucional-bg p-1">
          {LINKS.map((link) => {
            const activo = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activo
                    ? "bg-institucional-navy text-white shadow-sm"
                    : "text-institucional-text hover:bg-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
