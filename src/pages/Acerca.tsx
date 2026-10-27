import { useCatalogo } from "../lib/store";
import { Titulo } from "../components/ui";
import { REPO } from "../lib/config";

const STACK = [
  ["React 18 + TypeScript", "Interfaz y tipado de los datos"],
  ["Vite", "Compilación y servidor de desarrollo"],
  ["Tailwind CSS", "Sistema de diseño con tema claro y oscuro"],
  ["Three.js", "Modelos 3D de las formas cristalinas"],
  ["Leaflet + OpenStreetMap", "Mapa de yacimientos"],
  ["API de GitHub", "Panel de edición: cada cambio es un commit"],
  ["GitHub Actions + Pages", "Pruebas, compilación y publicación automáticas"],
  ["Vitest", "Pruebas unitarias de la lógica"],
];

export default function Acerca() {
  const { minerales } = useCatalogo();
  return (
    <div className="mx-auto max-w-page px-4 pt-10 sm:px-6">
      <Titulo eyebrow="Acerca" titulo="Sobre el proyecto" />
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4 text-base">
          <p>
            Gabinete Mineral empezó como una app en Python con Streamlit y evolucionó a una aplicación web estática: los datos
            viven en un archivo JSON dentro del repositorio y el sitio se publica en GitHub Pages en cada cambio.
          </p>
          <p className="text-muted">
            El panel de administración edita ese archivo mediante la API de GitHub. Solo el dueño del repositorio puede
            guardar cambios, y cada edición queda registrada como un commit con su historial.
          </p>
          <a className="btn-ghost" href={`https://github.com/${REPO.owner}/${REPO.name}`}>Ver el código en GitHub</a>
          <h2 className="pt-6 text-lg font-semibold">Tecnologías</h2>
          <dl className="divide-y divide-[rgb(var(--line)/0.12)] border-y hairline text-sm">
            {STACK.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[180px_1fr] gap-4 py-2.5">
                <dt className="font-medium">{k}</dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold">Créditos de las fotografías</h2>
          <ul className="divide-y divide-[rgb(var(--line)/0.12)] border-y hairline text-sm">
            {minerales.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-x-4 py-2.5">
                <span className="font-medium">{m.nombre}</span>
                <span className="text-muted">
                  {m.imagen.autor || "—"}
                  {m.imagen.licencia && (
                    <> · {m.imagen.fuente ? <a href={m.imagen.fuente} className="underline underline-offset-2 hover:text-ink">{m.imagen.licencia}</a> : m.imagen.licencia}</>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
