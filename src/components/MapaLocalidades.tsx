import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { useCatalogo } from "../lib/store";

export type Punto = { lat: number; lon: number; titulo: string; subtitulo: string; color: string; enlace?: string };

function Ajustar({ puntos }: { puntos: Punto[] }) {
  const map = useMap();
  useEffect(() => {
    if (!puntos.length) return;
    if (puntos.length === 1) map.setView([puntos[0].lat, puntos[0].lon], 5);
    else map.fitBounds(puntos.map((p) => [p.lat, p.lon] as [number, number]), { padding: [40, 40], maxZoom: 5 });
  }, [map, puntos]);
  return null;
}

export default function MapaLocalidades({ puntos, className = "" }: { puntos: Punto[]; className?: string }) {
  const { tema } = useCatalogo();
  const estilo = tema === "dark" ? "World_Dark_Gray_Base" : "World_Light_Gray_Base";
  return (
    <MapContainer center={[20, -40]} zoom={2} minZoom={2} worldCopyJump scrollWheelZoom={false} className={className}>
      <TileLayer
        key={estilo}
        url={`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${estilo}/MapServer/tile/{z}/{y}/{x}`}
        attribution='Mapa base &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; colaboradores de OpenStreetMap'
        maxZoom={16}
      />
      <Ajustar puntos={puntos} />
      {puntos.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lon]}
          radius={7}
          pathOptions={{ color: tema === "dark" ? "#121315" : "#FBF9F5", weight: 2, fillColor: p.color, fillOpacity: 0.95 }}
        >
          <Popup>
            <strong className="block">{p.titulo}</strong>
            <span className="text-muted">{p.subtitulo}</span>
            {p.enlace && (
              <Link to={p.enlace} className="mt-1 block font-medium text-accent">
                Ver ficha
              </Link>
            )}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
