import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useCatalogo } from "../lib/store";
import { elementosDe } from "../lib/formula";
import { POR_SIMBOLO } from "../lib/elements";
import TablaPeriodica from "../components/TablaPeriodica";
import { TarjetaMineral, Titulo } from "../components/ui";

export default function Elementos() {
  const { minerales } = useCatalogo();
  const [p, setP] = useSearchParams();
  const sel = p.get("e");

  const conteo = useMemo(() => {
    const c = new Map<string, number>();
    for (const m of minerales) for (const e of elementosDe(m.formula)) c.set(e, (c.get(e) ?? 0) + 1);
    return c;
  }, [minerales]);

  const ranking = [...conteo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const conSel = sel ? minerales.filter((m) => elementosDe(m.formula).includes(sel)) : [];
  const el = sel ? POR_SIMBOLO.get(sel) : undefined;

  return (
    <div className="mx-auto max-w-page px-4 pt-10 sm:px-6">
      <Titulo
        eyebrow="Tabla periódica"
        titulo="Los elementos de la colección"
        texto={`${conteo.size} elementos aparecen en las fórmulas del catálogo. El tono indica en cuántos minerales está cada uno; toca un elemento para filtrarlos.`}
      />
      <TablaPeriodica conteo={conteo} seleccion={sel} onSeleccion={(s) => setP(s ? { e: s } : {}, { replace: true })} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[260px_1fr]">
        <div>
          <p className="eyebrow mb-3">Más frecuentes</p>
          <ol className="divide-y divide-[rgb(var(--line)/0.12)] border-y hairline">
            {ranking.map(([s, n]) => (
              <li key={s}>
                <button type="button" onClick={() => setP({ e: s }, { replace: true })} className="flex min-h-[44px] w-full items-center justify-between text-sm hover:text-accent">
                  <span><span className="mr-2 font-mono font-medium">{s}</span>{POR_SIMBOLO.get(s)?.nombre}</span>
                  <span className="font-mono text-muted">{n}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div>
          {el ? (
            <>
              <div className="mb-5 flex items-baseline gap-3">
                <span className="font-mono text-xl font-medium text-accent">{el.simbolo}</span>
                <h2 className="text-lg font-semibold">{el.nombre}</h2>
                <span className="text-sm text-muted">Z = {el.z} · {conSel.length} {conSel.length === 1 ? "mineral" : "minerales"}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {conSel.map((m, i) => <TarjetaMineral key={m.id} m={m} i={i} />)}
              </div>
            </>
          ) : (
            <div className="card flex h-full min-h-[160px] items-center justify-center p-8 text-center text-sm text-muted">
              Elige un elemento resaltado en la tabla para ver los minerales que lo contienen.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
