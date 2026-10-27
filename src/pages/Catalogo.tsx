import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Download, LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { useCatalogo } from "../lib/store";
import { CLASES, BRILLOS_METALICOS, type Mineral } from "../lib/types";
import { EsqueletoTarjetas, Formula, TarjetaMineral, Titulo, Vacio, FotoMineral } from "../components/ui";
import { aCSV, descargar, fmtDureza, fmtNumero } from "../lib/util";
import { formulaUnicode } from "../lib/formula";

const ORDEN: Record<string, { label: string; fn: (a: Mineral, b: Mineral) => number }> = {
  nombre: { label: "Nombre", fn: (a, b) => a.nombre.localeCompare(b.nombre, "es") },
  "dureza-asc": { label: "Dureza: menor a mayor", fn: (a, b) => a.dureza_min - b.dureza_min },
  "dureza-desc": { label: "Dureza: mayor a menor", fn: (a, b) => b.dureza_max - a.dureza_max },
  "densidad-desc": { label: "Densidad: mayor a menor", fn: (a, b) => (b.densidad ?? 0) - (a.densidad ?? 0) },
};

export default function Catalogo() {
  const { minerales, cargando, error } = useCatalogo();
  const [p, setP] = useSearchParams();
  const q = p.get("q") ?? "";
  const clase = p.get("clase") ?? "";
  const sistema = p.get("sistema") ?? "";
  const brillo = p.get("brillo") ?? "";
  const dmin = Number(p.get("dmin") ?? 1);
  const dmax = Number(p.get("dmax") ?? 10);
  const orden = p.get("orden") ?? "nombre";
  const vista = p.get("vista") ?? "cuadricula";

  const set = (k: string, v: string) => {
    const n = new URLSearchParams(p);
    if (v) n.set(k, v);
    else n.delete(k);
    setP(n, { replace: true });
  };

  const sistemas = useMemo(() => [...new Set(minerales.map((m) => m.sistema))].sort(), [minerales]);
  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return minerales
      .filter((m) => {
        if (t) {
          const txt = [m.nombre, m.formula, formulaUnicode(m.formula), m.color, m.usos, m.descripcion, m.clase, ...m.localidades.map((l) => `${l.nombre} ${l.region}`)]
            .join(" ")
            .toLowerCase();
          if (!txt.includes(t)) return false;
        }
        if (clase && m.clase !== clase) return false;
        if (sistema && m.sistema !== sistema) return false;
        if (brillo === "metalico" && !BRILLOS_METALICOS.has(m.brillo)) return false;
        if (brillo === "no-metalico" && BRILLOS_METALICOS.has(m.brillo)) return false;
        return m.dureza_max >= dmin && m.dureza_min <= dmax;
      })
      .sort(ORDEN[orden]?.fn ?? ORDEN.nombre.fn);
  }, [minerales, q, clase, sistema, brillo, dmin, dmax, orden]);

  const hayFiltros = q || clase || sistema || brillo || dmin > 1 || dmax < 10;

  const exportar = (tipo: "csv" | "json") => {
    if (tipo === "json") return descargar("minerales.json", JSON.stringify(filtrados, null, 2), "application/json");
    const filas = filtrados.map((m) => ({
      nombre: m.nombre, formula: m.formula, clase: m.clase, sistema: m.sistema, dureza_min: m.dureza_min, dureza_max: m.dureza_max,
      densidad: m.densidad, brillo: m.brillo, raya: m.raya, color: m.color, usos: m.usos,
    }));
    descargar("minerales.csv", aCSV(filas), "text/csv");
  };

  return (
    <div className="mx-auto max-w-page px-4 pt-10 sm:px-6">
      <Titulo eyebrow="Catálogo" titulo="Todos los minerales" texto="Busca por nombre, fórmula, color, uso o localidad. Los filtros quedan en la dirección para que puedas compartir la búsqueda." />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" aria-label="Filtros">
          <div>
            <label htmlFor="q" className="label">Buscar</label>
            <input id="q" className="field" value={q} onChange={(e) => set("q", e.target.value)} placeholder="Cobre, Durango, SiO2…" data-testid="input-buscar" />
          </div>
          <div>
            <label htmlFor="clase" className="label">Clase química</label>
            <select id="clase" className="field" value={clase} onChange={(e) => set("clase", e.target.value)} data-testid="select-clase">
              <option value="">Todas</option>
              {CLASES.filter((c) => minerales.some((m) => m.clase === c)).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sistema" className="label">Sistema cristalino</label>
            <select id="sistema" className="field" value={sistema} onChange={(e) => set("sistema", e.target.value)} data-testid="select-sistema">
              <option value="">Todos</option>
              {sistemas.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="label">Brillo</legend>
            <div className="grid grid-cols-3 gap-1 rounded-md border hairline bg-surface p-1">
              {[["", "Todos"], ["metalico", "Metálico"], ["no-metalico", "No metálico"]].map(([v, l]) => (
                <button key={v} type="button" onClick={() => set("brillo", v)} aria-pressed={brillo === v}
                  className={`min-h-[36px] rounded px-1 text-xs ${brillo === v ? "bg-raised font-medium text-ink" : "text-muted hover:text-ink"}`}>
                  {l}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Dureza (Mohs): {dmin}–{dmax}</legend>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={10} step={0.5} value={dmin} aria-label="Dureza mínima"
                onChange={(e) => set("dmin", String(Math.min(Number(e.target.value), dmax)))} className="w-full min-w-0 flex-1 accent-[rgb(var(--accent))]" data-testid="range-dmin" />
              <input type="range" min={1} max={10} step={0.5} value={dmax} aria-label="Dureza máxima"
                onChange={(e) => set("dmax", String(Math.max(Number(e.target.value), dmin)))} className="w-full min-w-0 flex-1 accent-[rgb(var(--accent))]" data-testid="range-dmax" />
            </div>
          </fieldset>
          {hayFiltros && (
            <button type="button" className="btn-ghost w-full" onClick={() => setP(new URLSearchParams(vista !== "cuadricula" ? { vista } : {}), { replace: true })} data-testid="btn-limpiar">
              <X className="h-4 w-4" /> Limpiar filtros
            </button>
          )}
        </aside>

        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted" data-testid="text-resultados">
              <SlidersHorizontal className="mr-1.5 inline h-4 w-4" />
              {cargando ? "Cargando…" : `${filtrados.length} de ${minerales.length} minerales`}
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <label htmlFor="orden" className="sr-only">Ordenar</label>
              <select id="orden" className="field w-auto" value={orden} onChange={(e) => set("orden", e.target.value === "nombre" ? "" : e.target.value)} data-testid="select-orden">
                {Object.entries(ORDEN).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <div className="flex rounded-md border hairline bg-surface">
                <button type="button" className={`inline-flex h-11 w-11 items-center justify-center ${vista === "cuadricula" ? "text-ink" : "text-faint"}`} onClick={() => set("vista", "")} aria-label="Vista de cuadrícula" aria-pressed={vista === "cuadricula"}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button type="button" className={`inline-flex h-11 w-11 items-center justify-center ${vista === "lista" ? "text-ink" : "text-faint"}`} onClick={() => set("vista", "lista")} aria-label="Vista de lista" aria-pressed={vista === "lista"} data-testid="btn-vista-lista">
                  <List className="h-4 w-4" />
                </button>
              </div>
              <div className="relative">
                <details className="group">
                  <summary className="btn-ghost list-none cursor-pointer" aria-label="Exportar"><Download className="h-4 w-4" /><span className="hidden sm:inline">Exportar</span></summary>
                  <div className="absolute right-0 z-10 mt-1 w-40 card p-1 shadow-lg">
                    <button type="button" className="w-full rounded px-3 py-2 text-left text-sm hover:bg-raised" onClick={() => exportar("csv")}>CSV</button>
                    <button type="button" className="w-full rounded px-3 py-2 text-left text-sm hover:bg-raised" onClick={() => exportar("json")}>JSON</button>
                  </div>
                </details>
              </div>
            </div>
          </div>

          {error ? (
            <Vacio titulo="No se pudo cargar el catálogo" texto="Revisa tu conexión y vuelve a intentarlo." accion={<button className="btn-primary" onClick={() => location.reload()}>Reintentar</button>} />
          ) : cargando ? (
            <EsqueletoTarjetas />
          ) : filtrados.length === 0 ? (
            <Vacio titulo="Ningún mineral coincide" texto="Prueba con otro término o amplía el rango de dureza." accion={<button className="btn-primary" onClick={() => setP(new URLSearchParams(), { replace: true })}>Limpiar filtros</button>} />
          ) : vista === "lista" ? (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b hairline text-left text-xs text-muted">
                  <tr>
                    <th className="p-3 font-medium">Mineral</th>
                    <th className="p-3 font-medium">Fórmula</th>
                    <th className="p-3 font-medium">Clase</th>
                    <th className="p-3 font-medium">Sistema</th>
                    <th className="p-3 text-right font-medium">Mohs</th>
                    <th className="p-3 text-right font-medium">g/cm³</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((m) => (
                    <tr key={m.id} className="border-b hairline last:border-0 hover:bg-raised/60">
                      <td className="p-3">
                        <Link to={`/minerales/${m.id}`} className="flex items-center gap-3 font-medium hover:text-accent">
                          <FotoMineral m={m} className="h-10 w-10 rounded" />
                          {m.nombre}
                        </Link>
                      </td>
                      <td className="p-3"><Formula f={m.formula} /></td>
                      <td className="p-3 text-muted">{m.clase}</td>
                      <td className="p-3 text-muted">{m.sistema}</td>
                      <td className="p-3 text-right font-mono tabular-nums">{fmtDureza(m.dureza_min, m.dureza_max)}</td>
                      <td className="p-3 text-right font-mono tabular-nums">{fmtNumero(m.densidad)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtrados.map((m, i) => (
                <TarjetaMineral key={m.id} m={m} i={i} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
