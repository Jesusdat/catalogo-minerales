import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Heart, Scale, Gem } from "lucide-react";
import type { Mineral } from "../lib/types";
import { tokenizar } from "../lib/formula";
import { fmtDureza, recurso } from "../lib/util";
import { useCatalogo } from "../lib/store";

export function Formula({ f, className = "" }: { f: string; className?: string }) {
  return (
    <span className={`font-mono ${className}`} aria-label={`Fórmula ${f}`}>
      {tokenizar(f).map((t, i) => (t.sub ? <sub key={i} className="text-[0.72em]">{t.t}</sub> : <span key={i}>{t.t}</span>))}
    </span>
  );
}

export function FotoMineral({ m, className = "", sizes }: { m: Mineral; className?: string; sizes?: string }) {
  const [fallo, setFallo] = useState(false);
  if (fallo || !m.imagen?.src)
    return (
      <div
        role="img"
        aria-label={m.nombre}
        className={`flex items-center justify-center ${className}`}
        style={{ background: `linear-gradient(135deg, ${m.color_hex}55, ${m.color_hex}22)` }}
      >
        <Gem className="h-10 w-10 text-muted" aria-hidden />
      </div>
    );
  return (
    <img
      src={recurso(m.imagen.src)}
      alt={`Ejemplar de ${m.nombre.toLowerCase()}`}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      onError={() => setFallo(true)}
      className={`object-cover ${className}`}
    />
  );
}

export function BarraMohs({ min, max, compacta = false }: { min: number; max: number; compacta?: boolean }) {
  return (
    <div className="w-full" aria-label={`Dureza ${fmtDureza(min, max)} en la escala de Mohs`}>
      <div className={`relative w-full rounded-full bg-raised ${compacta ? "h-1.5" : "h-2.5"}`}>
        <div
          className="absolute inset-y-0 rounded-full bg-accent"
          style={{ left: `${((min - 1) / 9) * 100}%`, width: `max(${((max - min) / 9) * 100}%, ${compacta ? 6 : 10}px)` }}
        />
      </div>
      {!compacta && (
        <div className="mt-1.5 flex justify-between font-mono text-xs text-faint">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function TarjetaMineral({ m, i = 0 }: { m: Mineral; i?: number }) {
  const { favoritos, alternarFavorito, comparar, alternarComparar } = useCatalogo();
  const fav = favoritos.includes(m.id);
  const cmp = comparar.includes(m.id);
  return (
    <article className="group card overflow-hidden rise flex flex-col" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }} data-testid={`tarjeta-${m.id}`}>
      <Link to={`/minerales/${m.id}`} className="block relative aspect-[4/3] overflow-hidden" aria-label={`Ver ficha de ${m.nombre}`}>
        <FotoMineral m={m} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-sans text-base font-semibold leading-tight">
              <Link to={`/minerales/${m.id}`} className="hover:text-accent">{m.nombre}</Link>
            </h3>
            <Formula f={m.formula} className="text-sm text-muted" />
          </div>
          <div className="flex shrink-0 -mr-2 -mt-2">
            <button
              type="button"
              onClick={() => alternarFavorito(m.id)}
              aria-pressed={fav}
              aria-label={fav ? `Quitar ${m.nombre} de favoritos` : `Añadir ${m.nombre} a favoritos`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted hover:text-ink"
              data-testid={`fav-${m.id}`}
            >
              <Heart className={`h-[18px] w-[18px] ${fav ? "fill-accent text-accent" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => alternarComparar(m.id)}
              aria-pressed={cmp}
              aria-label={cmp ? `Quitar ${m.nombre} del comparador` : `Añadir ${m.nombre} al comparador`}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-md hover:text-ink ${cmp ? "text-accent" : "text-muted"}`}
              data-testid={`cmp-${m.id}`}
            >
              <Scale className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Mohs {fmtDureza(m.dureza_min, m.dureza_max)}</span>
            <span>{m.sistema}</span>
          </div>
          <BarraMohs min={m.dureza_min} max={m.dureza_max} compacta />
        </div>
      </div>
    </article>
  );
}

export function Vacio({ titulo, texto, accion, icono }: { titulo: string; texto: string; accion?: ReactNode; icono?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 text-faint">{icono ?? <Gem className="h-10 w-10" />}</div>
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="mt-2 max-w-[40ch] text-sm text-muted">{texto}</p>
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  );
}

export function EsqueletoTarjetas({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton aspect-[4/3] rounded-none" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Titulo({ eyebrow, titulo, texto, children }: { eyebrow?: string; titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-xl font-medium tracking-tight">{titulo}</h1>
        {texto && <p className="mt-2 max-w-[60ch] text-muted">{texto}</p>}
      </div>
      {children}
    </div>
  );
}
