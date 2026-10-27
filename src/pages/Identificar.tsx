import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, RotateCcw, X } from "lucide-react";
import { useCatalogo } from "../lib/store";
import { identificar, PESOS, PRUEBAS_DUREZA, type Respuestas } from "../lib/identify";
import { RAYAS } from "../lib/types";
import { FotoMineral, Formula, Titulo } from "../components/ui";

function Pregunta({ n, titulo, ayuda, children }: { n: number; titulo: string; ayuda: string; children: ReactNode }) {
  return (
    <fieldset className="border-b hairline pb-6">
      <legend className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-faint">{String(n).padStart(2, "0")}</span>
        <span className="font-semibold">{titulo}</span>
      </legend>
      <p className="mb-3 mt-1 pl-8 text-sm text-muted">{ayuda}</p>
      <div className="flex flex-wrap gap-2 pl-8">{children}</div>
    </fieldset>
  );
}

function Opcion({ activo, onClick, children, testid }: { activo: boolean; onClick: () => void; children: ReactNode; testid?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      data-testid={testid}
      className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3.5 text-sm transition-colors ${
        activo ? "border-accent bg-accent text-accent-ink" : "hairline bg-surface text-ink hover:bg-raised"
      }`}
    >
      {children}
    </button>
  );
}

export default function Identificar() {
  const { minerales } = useCatalogo();
  const [r, setR] = useState<Respuestas>({});
  const alternar = <K extends keyof Respuestas>(k: K, v: Respuestas[K]) => setR((x) => ({ ...x, [k]: x[k] === v ? undefined : v }));

  const respondidas = Object.values(r).filter((v) => v !== undefined).length;
  const resultados = useMemo(() => identificar(minerales, r), [minerales, r]);
  const top = resultados.filter((x) => x.total > 0 && x.puntos === x.total);
  const parciales = resultados.filter((x) => x.total > 0 && x.puntos < x.total && x.puntos > 0).slice(0, 6);

  return (
    <div className="mx-auto max-w-page px-4 pt-10 sm:px-6">
      <Titulo
        eyebrow="Identificador"
        titulo="¿Qué mineral es?"
        texto="Responde solo lo que puedas comprobar. Cada respuesta descarta minerales del catálogo; no hace falta contestar todo."
      >
        {respondidas > 0 && (
          <button type="button" className="btn-ghost" onClick={() => setR({})} data-testid="btn-reiniciar">
            <RotateCcw className="h-4 w-4" /> Empezar de nuevo
          </button>
        )}
      </Titulo>

      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div className="space-y-6">
          <Pregunta n={1} titulo="¿Cómo brilla?" ayuda="Metálico: refleja como un metal pulido. No metálico: vítreo, sedoso, terroso…">
            <Opcion activo={r.brillo === "metalico"} onClick={() => alternar("brillo", "metalico")} testid="op-metalico">Metálico</Opcion>
            <Opcion activo={r.brillo === "no-metalico"} onClick={() => alternar("brillo", "no-metalico")} testid="op-no-metalico">No metálico</Opcion>
          </Pregunta>

          <Pregunta n={2} titulo="¿Qué tan duro es?" ayuda="Intenta rayarlo con la uña (2.5), una moneda de cobre (3.5) o una navaja de acero (5.5).">
            {(Object.keys(PRUEBAS_DUREZA) as (keyof typeof PRUEBAS_DUREZA)[]).map((k) => (
              <Opcion key={k} activo={r.dureza === k} onClick={() => alternar("dureza", k)} testid={`op-dureza-${k}`}>{PRUEBAS_DUREZA[k].label}</Opcion>
            ))}
          </Pregunta>

          <Pregunta n={3} titulo="¿De qué color es su raya?" ayuda="Frótalo sobre porcelana sin esmaltar (el reverso de un azulejo) y mira el polvo que deja.">
            {RAYAS.map((x) => (
              <Opcion key={x.id} activo={r.raya === x.id} onClick={() => alternar("raya", x.id)} testid={`op-raya-${x.id}`}>
                <span className="h-3 w-3 rounded-full border border-[rgb(var(--line)/0.25)]" style={{ background: x.hex }} aria-hidden />
                {x.label}
              </Opcion>
            ))}
          </Pregunta>

          <Pregunta n={4} titulo="¿Lo atrae un imán?" ayuda="Acerca un imán de refrigerador o cuelga la muestra de un hilo.">
            <Opcion activo={r.magnetico === true} onClick={() => alternar("magnetico", true)} testid="op-magnetico-si">Sí</Opcion>
            <Opcion activo={r.magnetico === false} onClick={() => alternar("magnetico", false)}>No</Opcion>
          </Pregunta>

          <Pregunta n={5} titulo="¿Burbujea con ácido?" ayuda="Una gota de ácido clorhídrico diluido (o vinagre, más lento) hace efervescer a muchos carbonatos.">
            <Opcion activo={r.efervescencia === true} onClick={() => alternar("efervescencia", true)} testid="op-efervescencia-si">Sí</Opcion>
            <Opcion activo={r.efervescencia === false} onClick={() => alternar("efervescencia", false)}>No</Opcion>
          </Pregunta>

          <Pregunta n={6} titulo="¿Cuánto pesa para su tamaño?" ayuda="Compáralo con una piedra común del mismo tamaño.">
            {(Object.keys(PESOS) as (keyof typeof PESOS)[]).map((k) => (
              <Opcion key={k} activo={r.peso === k} onClick={() => alternar("peso", k)} testid={`op-peso-${k}`}>{PESOS[k].label}</Opcion>
            ))}
          </Pregunta>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-live="polite">
          {respondidas === 0 ? (
            <div className="card p-8">
              <p className="eyebrow mb-2">Resultados</p>
              <p className="text-lg font-semibold">Empieza por cualquier pregunta.</p>
              <p className="mt-2 text-sm text-muted">El brillo y la raya suelen ser las pistas más rápidas para separar grupos grandes de minerales.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="eyebrow mb-3" data-testid="text-coincidencias">
                  {top.length} {top.length === 1 ? "coincidencia completa" : "coincidencias completas"} · {respondidas} {respondidas === 1 ? "pista" : "pistas"}
                </p>
                {top.length === 0 ? (
                  <div className="card p-6 text-sm text-muted">
                    Ningún mineral cumple todas las pistas. Revisa la más dudosa; abajo están los más cercanos.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {top.slice(0, 8).map(({ mineral: m, coincidencias }) => (
                      <li key={m.id}>
                        <Link to={`/minerales/${m.id}`} className="card flex items-center gap-4 p-3 transition-colors hover:bg-raised rise" data-testid={`resultado-${m.id}`}>
                          <FotoMineral m={m} className="h-16 w-16 shrink-0 rounded-md" />
                          <div className="min-w-0">
                            <p className="font-semibold">{m.nombre} <Formula f={m.formula} className="ml-1 text-sm font-normal text-muted" /></p>
                            <p className="mt-0.5 truncate text-xs text-muted">{coincidencias.join(" · ")}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {parciales.length > 0 && (
                <div>
                  <p className="eyebrow mb-3">También podría ser</p>
                  <ul className="divide-y divide-[rgb(var(--line)/0.12)] border-y hairline">
                    {parciales.map(({ mineral: m, puntos, total, fallos }) => (
                      <li key={m.id}>
                        <Link to={`/minerales/${m.id}`} className="flex items-center justify-between gap-4 py-3 text-sm hover:text-accent">
                          <span className="font-medium">{m.nombre}</span>
                          <span className="flex items-center gap-2 text-xs text-muted">
                            <span className="inline-flex items-center gap-0.5"><Check className="h-3.5 w-3.5" />{puntos}/{total}</span>
                            <span className="hidden truncate sm:inline"><X className="mr-0.5 inline h-3.5 w-3.5" />{fallos[0]}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
