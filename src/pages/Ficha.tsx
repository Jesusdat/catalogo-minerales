import { lazy, Suspense, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, Heart, Printer, Scale, Magnet, FlaskConical, Sun } from "lucide-react";
import { useCatalogo } from "../lib/store";
import { BarraMohs, Formula, FotoMineral, TarjetaMineral, Vacio } from "../components/ui";
import { elementosDe } from "../lib/formula";
import { POR_SIMBOLO } from "../lib/elements";
import { BRILLOS_METALICOS, ESCALA_MOHS, HABITOS } from "../lib/types";
import { fmtDureza, fmtNumero } from "../lib/util";

const Cristal3D = lazy(() => import("../components/Cristal3D"));
const MapaLocalidades = lazy(() => import("../components/MapaLocalidades"));

export default function Ficha() {
  const { id } = useParams();
  const { porId, minerales, cargando, favoritos, alternarFavorito, comparar, alternarComparar } = useCatalogo();
  const m = id ? porId.get(id) : undefined;

  const vecinos = useMemo(() => {
    const i = minerales.findIndex((x) => x.id === id);
    return i < 0 ? [] : [minerales[(i - 1 + minerales.length) % minerales.length], minerales[(i + 1) % minerales.length]];
  }, [minerales, id]);

  const similares = useMemo(() => {
    if (!m) return [];
    return minerales
      .filter((x) => x.id !== m.id)
      .map((x) => ({ x, s: (x.clase === m.clase ? 2 : 0) + (x.sistema === m.sistema ? 1 : 0) - Math.abs(x.dureza_max - m.dureza_max) / 4 }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 4)
      .map((r) => r.x);
  }, [m, minerales]);

  if (cargando) return <div className="mx-auto max-w-page px-4 pt-10 sm:px-6"><div className="skeleton h-[480px] w-full" /></div>;
  if (!m)
    return (
      <Vacio titulo="Mineral no encontrado" texto="Puede que se haya renombrado o eliminado del catálogo." accion={<Link to="/minerales" className="btn-primary">Ir al catálogo</Link>} />
    );

  const fav = favoritos.includes(m.id);
  const cmp = comparar.includes(m.id);
  const elems = elementosDe(m.formula);
  const metalico = BRILLOS_METALICOS.has(m.brillo);
  const ref = ESCALA_MOHS.filter((g) => g.grado <= Math.floor(m.dureza_max)).pop();
  const habito = HABITOS.find((h) => h.id === m.habito)?.label ?? m.habito;

  const props: [string, string][] = [
    ["Clase", m.clase],
    ["Sistema cristalino", m.sistema],
    ["Brillo", m.brillo],
    ["Color", m.color],
    ["Raya", m.raya],
    ["Exfoliación", m.exfoliacion],
    ["Fractura", m.fractura],
    ["Usos", m.usos],
  ];

  return (
    <article className="mx-auto max-w-page px-4 pt-6 sm:px-6" data-testid={`ficha-${m.id}`}>
      <nav className="no-print mb-6 flex items-center justify-between text-sm" aria-label="Navegación de fichas">
        <Link to="/minerales" className="inline-flex min-h-[44px] items-center gap-1.5 text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Catálogo
        </Link>
        <div className="flex gap-1">
          {vecinos.map((v, i) => (
            <Link key={v.id + i} to={`/minerales/${v.id}`} className="inline-flex min-h-[44px] items-center gap-1 rounded-md px-3 text-muted hover:text-ink">
              {i === 0 && <ArrowLeft className="h-4 w-4" />}
              {v.nombre}
              {i === 1 && <ArrowRight className="h-4 w-4" />}
            </Link>
          ))}
        </div>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-3">
          <figure className="overflow-hidden rounded-xl border hairline">
            <FotoMineral m={m} className="aspect-[4/3] w-full" />
          </figure>
          <figcaption className="text-xs text-faint">
            {m.imagen.licencia ? (
              <>
                Foto: {m.imagen.autor} ·{" "}
                {m.imagen.licencia_url ? <a href={m.imagen.licencia_url} className="underline underline-offset-2 hover:text-ink">{m.imagen.licencia}</a> : m.imagen.licencia}
                {m.imagen.fuente && (
                  <> · <a href={m.imagen.fuente} className="underline underline-offset-2 hover:text-ink">Wikimedia Commons</a></>
                )}
              </>
            ) : (
              <>Foto: {m.imagen.autor || "sin datos de autoría"}</>
            )}
          </figcaption>
        </div>

        <div>
          <p className="eyebrow">{m.clase}</p>
          <h1 className="mt-2 font-display text-2xl font-medium tracking-tight">{m.nombre}</h1>
          <Formula f={m.formula} className="mt-2 block text-xl text-muted" />

          <div className="no-print mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={() => alternarFavorito(m.id)} aria-pressed={fav} className="btn-ghost" data-testid="btn-favorito">
              <Heart className={`h-4 w-4 ${fav ? "fill-accent text-accent" : ""}`} /> {fav ? "En favoritos" : "Favorito"}
            </button>
            <button type="button" onClick={() => alternarComparar(m.id)} aria-pressed={cmp} className="btn-ghost" data-testid="btn-comparar">
              <Scale className={`h-4 w-4 ${cmp ? "text-accent" : ""}`} /> {cmp ? "En el comparador" : "Comparar"}
            </button>
            <button type="button" onClick={() => window.print()} className="btn-icon" aria-label="Imprimir ficha" title="Imprimir ficha">
              <Printer className="h-4 w-4" />
            </button>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border hairline bg-[rgb(var(--line)/0.12)]">
            <div className="bg-surface p-4">
              <dt className="text-xs text-muted">Dureza (Mohs)</dt>
              <dd className="mt-1 font-display text-xl tabular-nums">{fmtDureza(m.dureza_min, m.dureza_max)}</dd>
            </div>
            <div className="bg-surface p-4">
              <dt className="text-xs text-muted">Densidad</dt>
              <dd className="mt-1 font-display text-xl tabular-nums">{fmtNumero(m.densidad)} <span className="font-sans text-sm text-muted">g/cm³</span></dd>
            </div>
          </dl>
          <div className="mt-5">
            <BarraMohs min={m.dureza_min} max={m.dureza_max} />
            {ref && (
              <p className="mt-2 text-xs text-muted">
                {ref.id === m.id ? (
                  <>Es el mineral de referencia del grado {ref.grado} de la escala.</>
                ) : (
                  <>
                    Más duro o igual que{" "}
                    <Link to={`/minerales/${ref.id}`} className="text-ink underline underline-offset-2">{ref.nombre.toLowerCase()}</Link>, referencia del grado {ref.grado}.
                  </>
                )}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {m.magnetico && <span className="chip"><Magnet className="h-3.5 w-3.5" /> Magnético</span>}
            {m.efervescencia && <span className="chip"><FlaskConical className="h-3.5 w-3.5" /> Efervescente con ácido</span>}
            {m.fluorescencia && <span className="chip"><Sun className="h-3.5 w-3.5" /> Puede ser fluorescente</span>}
            {metalico && <span className="chip">Brillo metálico</span>}
          </div>

          <p className="mt-6 text-base leading-relaxed">{m.descripcion}</p>
        </div>
      </div>

      <section className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Propiedades</h2>
          <dl className="divide-y divide-[rgb(var(--line)/0.12)] border-y hairline">
            {props.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[140px_1fr] gap-4 py-3 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd>{v || "—"}</dd>
              </div>
            ))}
            <div className="grid grid-cols-[140px_1fr] gap-4 py-3 text-sm">
              <dt className="text-muted">Elementos</dt>
              <dd className="flex flex-wrap gap-1.5">
                {elems.map((s) => (
                  <Link key={s} to={`/elementos?e=${s}`} className="chip hover:border-accent hover:text-ink" title={POR_SIMBOLO.get(s)?.nombre}>
                    <span className="font-mono font-medium text-ink">{s}</span> {POR_SIMBOLO.get(s)?.nombre}
                  </Link>
                ))}
              </dd>
            </div>
          </dl>
          <a href={m.wikipedia} className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm text-muted hover:text-ink">
            Más en Wikipedia <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Forma cristalina</h2>
            <span className="text-xs text-muted">{habito} · {m.sistema}</span>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border hairline bg-surface">
            <Suspense fallback={<div className="skeleton h-full w-full" />}>
              <Cristal3D habito={m.habito} color={m.color_hex} metalico={metalico} className="h-full w-full" etiqueta={`Modelo 3D idealizado de ${m.nombre}`} />
            </Suspense>
            <p className="pointer-events-none absolute bottom-3 left-4 text-xs text-faint">Modelo idealizado · arrastra para girar</p>
          </div>
        </div>
      </section>

      {m.localidades.length > 0 && (
        <section className="mt-16">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Yacimientos destacados</h2>
            <p className="text-xs text-muted">Ubicación aproximada de la localidad</p>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
            <ul className="divide-y divide-[rgb(var(--line)/0.12)] border-y hairline">
              {m.localidades.map((l) => (
                <li key={l.nombre + l.lat} className="py-3">
                  <p className="font-medium">{l.nombre}</p>
                  <p className="text-sm text-muted">{l.region}</p>
                </li>
              ))}
            </ul>
            <Suspense fallback={<div className="skeleton h-[320px] w-full" />}>
              <MapaLocalidades
                className="h-[320px] w-full overflow-hidden rounded-xl border hairline"
                puntos={m.localidades.map((l) => ({ lat: l.lat, lon: l.lon, titulo: l.nombre, subtitulo: l.region, color: m.color_hex }))}
              />
            </Suspense>
          </div>
        </section>
      )}

      {similares.length > 0 && (
        <section className="no-print mt-16">
          <h2 className="mb-4 text-lg font-semibold">Minerales relacionados</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similares.map((x, i) => (
              <TarjetaMineral key={x.id} m={x} i={i} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
