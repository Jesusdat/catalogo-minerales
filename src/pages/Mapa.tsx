import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalogo } from "../lib/store";
import { CLASES } from "../lib/types";
import { Titulo } from "../components/ui";

const MapaLocalidades = lazy(() => import("../components/MapaLocalidades"));

export default function Mapa() {
  const { minerales } = useCatalogo();
  const [clase, setClase] = useState("");
  const [soloMx, setSoloMx] = useState(false);

  const lista = useMemo(
    () => minerales.filter((m) => !clase || m.clase === clase),
    [minerales, clase],
  );
  const puntos = useMemo(
    () =>
      lista.flatMap((m) =>
        m.localidades
          .filter((l) => !soloMx || l.region.includes("México"))
          .map((l) => ({ lat: l.lat, lon: l.lon, titulo: `${m.nombre} · ${l.nombre}`, subtitulo: l.region, color: m.color_hex, enlace: `/minerales/${m.id}` })),
      ),
    [lista, soloMx],
  );

  return (
    <div className="mx-auto max-w-page px-4 pt-10 sm:px-6">
      <Titulo eyebrow="Mapa" titulo="Dónde se encuentran" texto="Localidades clásicas de cada mineral. Las ubicaciones son aproximadas, a nivel de población o distrito minero." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="mclase" className="sr-only">Clase</label>
        <select id="mclase" className="field w-auto" value={clase} onChange={(e) => setClase(e.target.value)} data-testid="select-mapa-clase">
          <option value="">Todas las clases</option>
          {CLASES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button type="button" onClick={() => setSoloMx((v) => !v)} aria-pressed={soloMx} className={soloMx ? "btn-primary" : "btn-ghost"} data-testid="btn-solo-mexico">
          Solo México
        </button>
        <span className="text-sm text-muted" data-testid="text-puntos">{puntos.length} registros de yacimiento</span>
      </div>
      <Suspense fallback={<div className="skeleton h-[70vh] w-full" />}>
        <MapaLocalidades puntos={puntos} className="h-[70vh] min-h-[420px] w-full overflow-hidden rounded-xl border hairline" />
      </Suspense>
      <div className="mt-6 flex flex-wrap gap-2">
        {lista.filter((m) => !soloMx || m.localidades.some((l) => l.region.includes("México"))).map((m) => (
          <Link key={m.id} to={`/minerales/${m.id}`} className="chip hover:text-ink">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color_hex }} aria-hidden /> {m.nombre}
          </Link>
        ))}
      </div>
    </div>
  );
}
