import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, Moon, Sun, X, Code2, Heart, Scale } from "lucide-react";
import { useCatalogo } from "../lib/store";
import { REPO } from "../lib/config";

const NAV = [
  { to: "/minerales", label: "Catálogo" },
  { to: "/identificar", label: "Identificar" },
  { to: "/elementos", label: "Elementos" },
  { to: "/mapa", label: "Mapa" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { tema, alternarTema, favoritos, comparar } = useCatalogo();
  const [abierto, setAbierto] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    setAbierto(false);
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);

  const enlace = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-[44px] items-center rounded-md px-3 text-sm transition-colors ${isActive ? "text-ink font-medium" : "text-muted hover:text-ink"}`;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a href="#contenido" onClick={(e) => { e.preventDefault(); document.getElementById("contenido")?.focus(); }} className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 btn-primary">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b hairline bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-page items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-baseline gap-2 min-h-[44px] items-center" data-testid="link-inicio">
            <span className="whitespace-nowrap font-display text-lg font-medium tracking-tight">Gabinete Mineral</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Principal">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={enlace} data-testid={`nav-${n.to.slice(1)}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <NavLink to="/comparar" className={enlace} aria-label={`Comparar (${comparar.length})`} data-testid="nav-comparar">
              <Scale className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Comparar</span>
              {comparar.length > 0 && <span className="ml-1.5 rounded-full bg-accent px-1.5 font-mono text-xs text-accent-ink">{comparar.length}</span>}
            </NavLink>
            <NavLink to="/favoritos" className={enlace} aria-label={`Favoritos (${favoritos.length})`} data-testid="nav-favoritos">
              <Heart className="h-4 w-4" />
              {favoritos.length > 0 && <span className="ml-1.5 font-mono text-xs">{favoritos.length}</span>}
            </NavLink>
            <button type="button" onClick={alternarTema} className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted hover:text-ink" aria-label={tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"} data-testid="btn-tema">
              {tema === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-md md:hidden" onClick={() => setAbierto((a) => !a)} aria-expanded={abierto} aria-label="Menú" data-testid="btn-menu">
              {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {abierto && (
          <nav className="border-t hairline px-4 py-2 md:hidden" aria-label="Principal móvil">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `${enlace({ isActive })} w-full`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">{children}</main>

      <footer className="mt-24 border-t hairline">
        <div className="mx-auto grid max-w-page gap-8 px-4 py-10 text-sm text-muted sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-lg text-ink">Gabinete Mineral</p>
            <p className="mt-2 max-w-[42ch]">
              Catálogo de minerales con fichas, modelos 3D de cristales y mapa de yacimientos. Proyecto de portafolio de{" "}
              <a className="text-ink underline decoration-line/30 underline-offset-4 hover:decoration-accent" href={`https://github.com/${REPO.owner}`}>{REPO.owner}</a>.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="eyebrow mb-1">Explorar</p>
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="hover:text-ink">{n.label}</Link>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <p className="eyebrow mb-1">Proyecto</p>
            <Link to="/acerca" className="hover:text-ink">Acerca y créditos</Link>
            <a href={`https://github.com/${REPO.owner}/${REPO.name}`} className="inline-flex items-center gap-1.5 hover:text-ink">
              <Code2 className="h-4 w-4" /> Código fuente
            </a>
            <Link to="/admin" className="hover:text-ink" data-testid="link-admin">Administrar</Link>
          </div>
        </div>
        <p className="mx-auto max-w-page px-4 pb-8 text-xs text-faint sm:px-6">
          Fotografías de Wikimedia Commons bajo licencias Creative Commons; autores en cada ficha. Mapa base © Esri y colaboradores de OpenStreetMap.
        </p>
      </footer>
    </div>
  );
}
