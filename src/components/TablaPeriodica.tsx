import { ELEMENTOS } from "../lib/elements";

type Props = {
  conteo: Map<string, number>;
  seleccion: string | null;
  onSeleccion: (s: string | null) => void;
  compacta?: boolean;
};

export default function TablaPeriodica({ conteo, seleccion, onSeleccion, compacta = false }: Props) {
  const max = Math.max(1, ...conteo.values());
  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="grid min-w-[760px] gap-[3px]"
        style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))", gridTemplateRows: "repeat(7, auto) 10px repeat(2, auto)" }}
        role="grid"
        aria-label="Tabla periódica: elementos presentes en el catálogo"
      >
        <div style={{ gridRow: 6, gridColumn: 3 }} className="flex items-center justify-center rounded-[4px] border border-dashed hairline text-[10px] text-faint">57–71</div>
        <div style={{ gridRow: 7, gridColumn: 3 }} className="flex items-center justify-center rounded-[4px] border border-dashed hairline text-[10px] text-faint">89–103</div>
        {ELEMENTOS.map((e) => {
          const n = conteo.get(e.simbolo) ?? 0;
          const activo = n > 0;
          const sel = seleccion === e.simbolo;
          const intensidad = activo ? 0.18 + 0.82 * (n / max) : 0;
          return (
            <button
              key={e.z}
              type="button"
              disabled={!activo}
              onClick={() => onSeleccion(sel ? null : e.simbolo)}
              style={{
                gridRow: e.fila,
                gridColumn: e.columna,
                background: activo ? `rgb(var(--accent) / ${intensidad})` : undefined,
              }}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-[4px] border text-center transition ${
                activo ? "hairline hover:ring-2 hover:ring-accent cursor-pointer" : "hairline bg-surface/60 text-faint cursor-default"
              } ${sel ? "ring-2 ring-ink" : ""} ${activo && intensidad > 0.55 ? "text-accent-ink" : ""}`}
              aria-label={`${e.nombre} (${e.simbolo}), ${n} ${n === 1 ? "mineral" : "minerales"}`}
              aria-pressed={sel}
              title={`${e.nombre} · ${n} ${n === 1 ? "mineral" : "minerales"}`}
              data-testid={`elemento-${e.simbolo}`}
            >
              {!compacta && <span className="absolute left-1 top-0.5 font-mono text-[9px] opacity-70">{e.z}</span>}
              <span className={`font-semibold ${compacta ? "text-[11px]" : "text-sm"}`}>{e.simbolo}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
