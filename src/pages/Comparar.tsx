import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Scale, X, Link2 } from "lucide-react";
import { useCatalogo } from "../lib/store";
import { BarraMohs, Formula, FotoMineral, Titulo, Vacio } from "../components/ui";
import { fmtDureza, fmtNumero } from "../lib/util";
import type { Mineral } from "../lib/types";

const FILAS: [string, (m: Mineral) => React.ReactNode][] = [
  ["Fórmula", (m) => <Formula f={m.formula} />],
  ["Clase", (m) => m.clase],
  ["Sistema", (m) => m.sistema],
  ["Dureza", (m) => <div className="space-y-1.5"><span className="font-mono">{fmtDureza(m.dureza_min, m.dureza_max)}</span><BarraMohs min={m.dureza_min} max={m.dureza_max} compacta /></div>],
  ["Densidad", (m) => <span className="font-mono">{fmtNumero(m.densidad, " g/cm³")}</span>],
  ["Brillo", (m) => m.brillo],
  ["Color", (m) => m.color],
  ["Raya", (m) => m.raya],
  ["Exfoliación", (m) => m.exfoliacion],
  ["Magnético", (m) => (m.magnetico ? "Sí" : "No")],
  ["Efervescencia", (m) => (m.efervescencia ? "Sí" : "No")],
];

export default function Comparar() {
  const { comparar, porId, alternarComparar, limpiarComparar, cargando } = useCatalogo();
  const [p, setP] = useSearchParams();

  // Permite compartir comparaciones: /comparar?ids=cuarzo,calcita
  useEffect(() => {
    const ids = p.get("ids")?.split(",").filter((id) => porId.has(id)) ?? [];
    if (ids.length && comparar.length === 0) ids.forEach(alternarComparar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [porId]);
  useEffect(() => {
    if (comparar.length) setP({ ids: comparar.join(",") }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparar]);

  const lista = comparar.map((id) => porId.get(id)).filter(Boolean) as Mineral[];
  if (cargando) return null;
  if (lista.length === 0)
    return (
      <Vacio
        icono={<Scale className="h-10 w-10" />}
        titulo="El comparador está vacío"
        texto="Pulsa el icono de balanza en cualquier tarjeta o ficha para añadir hasta cuatro minerales."
        accion={<Link to="/minerales" className="btn-primary">Elegir minerales</Link>}
      />
    );

  return (
    <div className="mx-auto max-w-page px-4 pt-10 sm:px-6">
      <Titulo eyebrow="Comparador" titulo={`${lista.length} ${lista.length === 1 ? "mineral" : "minerales"} lado a lado`} texto={lista.length < 2 ? "Añade al menos otro mineral para comparar." : "La dirección de esta página guarda la selección: cópiala para compartirla."}>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={() => navigator.clipboard?.writeText(location.href)}><Link2 className="h-4 w-4" /> Copiar enlace</button>
          <button type="button" className="btn-ghost" onClick={() => { limpiarComparar(); setP({}, { replace: true }); }} data-testid="btn-vaciar">Vaciar</button>
        </div>
      </Titulo>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed text-sm">
          <thead>
            <tr>
              <th className="w-[140px]" />
              {lista.map((m) => (
                <th key={m.id} className="p-2 text-left align-top font-normal">
                  <div className="relative">
                    <FotoMineral m={m} className="aspect-square w-full rounded-lg" />
                    <button type="button" onClick={() => alternarComparar(m.id)} className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink shadow" aria-label={`Quitar ${m.nombre}`}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Link to={`/minerales/${m.id}`} className="mt-3 block text-base font-semibold hover:text-accent">{m.nombre}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FILAS.map(([k, f]) => (
              <tr key={k} className="border-t hairline">
                <th scope="row" className="p-2 py-3 text-left align-top text-xs font-medium text-muted">{k}</th>
                {lista.map((m) => <td key={m.id} className="p-2 py-3 align-top">{f(m)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
