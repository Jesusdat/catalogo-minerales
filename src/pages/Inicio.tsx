import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { useCatalogo } from "../lib/store";
import { ESCALA_MOHS, BRILLOS_METALICOS } from "../lib/types";
import { elementosDe } from "../lib/formula";
import { Formula, FotoMineral, TarjetaMineral } from "../components/ui";
import { fmtDureza } from "../lib/util";

const Cristal3D = lazy(() => import("../components/Cristal3D"));

const DESTACADOS = ["fluorita", "azurita", "pirita", "yeso", "malaquita", "celestina", "galena", "olivino"];

export default function Inicio() {
  const { minerales, porId, cargando } = useCatalogo();
  const [grado, setGrado] = useState(7);
  const mohs = ESCALA_MOHS.find((g) => g.grado === grado)!;
  const mMohs = porId.get(mohs.id);
  const heroe = porId.get("fluorita") ?? minerales[0];

  const stats = useMemo(() => {
    const elems = new Set(minerales.flatMap((m) => elementosDe(m.formula)));
    const yac = new Set(minerales.flatMap((m) => m.localidades.map((l) => `${l.lat},${l.lon}`)));
    const mx = minerales.filter((m) => m.localidades.some((l) => l.region.includes("México"))).length;
    return { total: minerales.length, clases: new Set(minerales.map((m) => m.clase)).size, elems: elems.size, yac: yac.size, mx };
  }, [minerales]);

  const destacados = DESTACADOS.map((id) => porId.get(id)).filter(Boolean).slice(0, 4) as typeof minerales;

  return (
    <>
      {/* Héroe */}
      <section className="mx-auto grid max-w-page items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16">
        <div className="rise">
          <p className="eyebrow mb-5">Catálogo mineralógico · {stats.total || "—"} ejemplares</p>
          <h1 className="font-display text-3xl font-medium leading-[0.98] tracking-tight">
            De la sal de Guerrero Negro al diamante de Kimberley.
          </h1>
          <p className="mt-6 max-w-[48ch] text-lg text-muted">
            Fichas con dureza, densidad, raya y yacimientos; cristales en 3D que puedes girar, y un identificador para
            averiguar qué mineral tienes en la mano.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/minerales" className="btn-primary" data-testid="cta-catalogo">
              Explorar el catálogo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/identificar" className="btn-ghost" data-testid="cta-identificar">
              <Search className="h-4 w-4" /> Identificar un mineral
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="relative aspect-square overflow-hidden rounded-xl border hairline bg-surface">
            {heroe && (
              <Suspense fallback={<div className="skeleton h-full w-full" />}>
                <Cristal3D habito={heroe.habito} color={heroe.color_hex} className="h-full w-full" etiqueta={`Modelo 3D de ${heroe.nombre}`} />
              </Suspense>
            )}
            {heroe && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                <div>
                  <p className="eyebrow">Hábito octaédrico</p>
                  <p className="font-display text-xl">{heroe.nombre}</p>
                </div>
                <Formula f={heroe.formula} className="text-lg text-muted" />
              </div>
            )}
            <p className="pointer-events-none absolute left-5 top-4 text-xs text-faint">Arrastra para girar</p>
          </div>
        </div>
      </section>

      {/* Cifras */}
      <section className="border-y hairline bg-surface">
        <dl className="mx-auto grid max-w-page grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-4">
          {[
            ["Minerales", stats.total],
            ["Clases químicas", stats.clases],
            ["Elementos distintos", stats.elems],
            ["Localidades distintas", stats.yac],
          ].map(([k, v]) => (
            <div key={k} className="py-7 md:px-4 first:md:pl-0">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-1 font-display text-2xl tabular-nums">{cargando ? "—" : v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Escala de Mohs interactiva */}
      <section className="mx-auto max-w-page px-4 py-20 sm:px-6 md:py-28">
        <div className="grid gap-10 md:grid-cols-[1fr_1.3fr] md:gap-16">
          <div>
            <p className="eyebrow mb-3">Escala de Mohs</p>
            <h2 className="font-display text-2xl font-medium tracking-tight">Diez minerales para medir la dureza de todos los demás.</h2>
            <p className="mt-4 max-w-[46ch] text-muted">
              Cada mineral de la escala raya al anterior y es rayado por el siguiente. Los diez están en el catálogo:
              elige un grado.
            </p>
            <div className="mt-8 grid grid-cols-10 gap-1" role="radiogroup" aria-label="Grado de dureza">
              {ESCALA_MOHS.map((g) => (
                <button
                  key={g.grado}
                  type="button"
                  role="radio"
                  aria-checked={grado === g.grado}
                  onClick={() => setGrado(g.grado)}
                  className={`flex min-h-[52px] flex-col items-center justify-center rounded-md border font-mono text-sm transition-colors ${
                    grado === g.grado ? "border-accent bg-accent text-accent-ink" : "hairline bg-surface hover:bg-raised"
                  }`}
                  data-testid={`mohs-${g.grado}`}
                >
                  {g.grado}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-faint">
              <span>Más blando</span>
              <span>Más duro</span>
            </div>
          </div>
          {mMohs && (
            <Link to={`/minerales/${mMohs.id}`} key={mMohs.id} className="group card rise grid overflow-hidden sm:grid-cols-[1.1fr_1fr]">
              <FotoMineral m={mMohs} className="aspect-[4/3] h-full w-full sm:aspect-auto" />
              <div className="flex flex-col p-6">
                <p className="font-mono text-xs text-muted">Grado {grado}</p>
                <h3 className="mt-1 font-display text-xl">{mMohs.nombre}</h3>
                <Formula f={mMohs.formula} className="mt-1 text-muted" />
                <p className="mt-4 line-clamp-5 text-sm text-muted">{mMohs.descripcion}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-accent">
                  Ver ficha <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Destacados */}
      <section className="mx-auto max-w-page px-4 pb-20 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-xl font-medium tracking-tight">Algunas piezas de la colección</h2>
          <Link to="/minerales" className="hidden text-sm font-medium text-accent sm:inline-flex sm:items-center sm:gap-1">
            Ver los {stats.total} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destacados.map((m, i) => (
            <TarjetaMineral key={m.id} m={m} i={i} />
          ))}
        </div>
      </section>

      {/* Herramientas: composición asimétrica */}
      <section className="mx-auto grid max-w-page gap-4 px-4 sm:px-6 md:grid-cols-[1.5fr_1fr]">
        <Link to="/identificar" className="group card flex flex-col justify-between gap-10 p-8 transition-colors hover:bg-raised md:row-span-2 md:p-10">
          <div>
            <p className="eyebrow mb-3">Identificador</p>
            <h2 className="max-w-[18ch] font-display text-2xl font-medium tracking-tight">¿Qué mineral tienes en la mano?</h2>
            <p className="mt-4 max-w-[44ch] text-muted">
              Responde con pruebas que puedes hacer en casa: si la uña lo raya, el color de su raya en una porcelana, si
              lo atrae un imán. El catálogo se ordena por coincidencia.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["La uña lo raya", "Raya el vidrio", "Raya negra", "Atrae un imán", "Burbujea con ácido"].map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
            Empezar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link to="/mapa" className="group card flex items-start gap-4 p-6 transition-colors hover:bg-raised">
          <MapPin className="mt-1 h-5 w-5 shrink-0 text-accent" />
          <div>
            <h2 className="text-lg font-semibold">Mapa de yacimientos</h2>
            <p className="mt-1 text-sm text-muted">
              {stats.yac} localidades clásicas, {stats.mx} minerales con yacimientos en México.
            </p>
          </div>
        </Link>
        <Link to="/elementos" className="group card flex items-start gap-4 p-6 transition-colors hover:bg-raised">
          <span className="mt-0.5 font-mono text-lg font-medium text-accent">Fe</span>
          <div>
            <h2 className="text-lg font-semibold">Tabla periódica</h2>
            <p className="mt-1 text-sm text-muted">
              {stats.elems} elementos forman estos minerales. Toca uno para ver en cuáles aparece.
            </p>
          </div>
        </Link>
      </section>

      {/* Metálicos vs no metálicos, una franja visual */}
      <section className="mx-auto mt-20 max-w-page px-4 sm:px-6">
        <p className="eyebrow mb-4">Toda la colección por dureza</p>
        <div className="flex h-28 items-end gap-[3px] overflow-hidden rounded-lg border hairline bg-surface p-3">
          {[...minerales]
            .sort((a, b) => a.dureza_max - b.dureza_max)
            .map((m) => (
              <Link
                key={m.id}
                to={`/minerales/${m.id}`}
                title={`${m.nombre} · Mohs ${fmtDureza(m.dureza_min, m.dureza_max)}`}
                aria-label={`${m.nombre}, dureza ${fmtDureza(m.dureza_min, m.dureza_max)}`}
                className="flex-1 rounded-t-[3px] transition-opacity hover:opacity-70"
                style={{
                  height: `${(m.dureza_max / 10) * 100}%`,
                  background: m.color_hex,
                  outline: BRILLOS_METALICOS.has(m.brillo) ? "1px solid rgb(var(--line) / 0.2)" : undefined,
                }}
              />
            ))}
        </div>
        <p className="mt-2 text-xs text-faint">Cada barra es un mineral, con su color característico. Pasa el cursor para ver su nombre.</p>
      </section>
    </>
  );
}
