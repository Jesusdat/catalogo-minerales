import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCatalogo } from "../lib/store";
import { TarjetaMineral, Titulo, Vacio } from "../components/ui";
import type { Mineral } from "../lib/types";

export default function Favoritos() {
  const { favoritos, porId, cargando } = useCatalogo();
  const lista = favoritos.map((id) => porId.get(id)).filter(Boolean) as Mineral[];
  if (cargando) return null;
  if (!lista.length)
    return (
      <Vacio icono={<Heart className="h-10 w-10" />} titulo="Aún no tienes favoritos" texto="Marca con el corazón los minerales que quieras tener a mano. Se guardan en este navegador."
        accion={<Link to="/minerales" className="btn-primary">Explorar el catálogo</Link>} />
    );
  return (
    <div className="mx-auto max-w-page px-4 pt-10 sm:px-6">
      <Titulo eyebrow="Tu selección" titulo="Favoritos" texto="Guardados en este navegador." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {lista.map((m, i) => <TarjetaMineral key={m.id} m={m} i={i} />)}
      </div>
    </div>
  );
}
