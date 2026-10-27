import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Mineral } from "./types";
import { leer, escribir } from "./storage";
import { recurso } from "./util";

type Tema = "light" | "dark";

type Ctx = {
  minerales: Mineral[];
  cargando: boolean;
  error: string | null;
  porId: Map<string, Mineral>;
  reemplazar: (m: Mineral[]) => void;
  favoritos: string[];
  alternarFavorito: (id: string) => void;
  comparar: string[];
  alternarComparar: (id: string) => void;
  limpiarComparar: () => void;
  tema: Tema;
  alternarTema: () => void;
};

const C = createContext<Ctx | null>(null);

export function Proveedor({ children }: { children: ReactNode }) {
  const [minerales, setMinerales] = useState<Mineral[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<string[]>(() => leer("favoritos", []));
  const [comparar, setComparar] = useState<string[]>([]);
  const [tema, setTema] = useState<Tema>(() => (document.documentElement.dataset.theme as Tema) || "light");

  useEffect(() => {
    fetch(recurso("data/minerales.json"), { cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Mineral[]) => setMinerales(ordenar(d)))
      .catch(() => setError("No se pudo cargar el catálogo."))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    escribir("tema", tema);
  }, [tema]);

  const alternarFavorito = useCallback((id: string) => {
    setFavoritos((f) => {
      const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      escribir("favoritos", n);
      return n;
    });
  }, []);

  const alternarComparar = useCallback((id: string) => {
    setComparar((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 4 ? [...c.slice(1), id] : [...c, id]));
  }, []);

  const valor = useMemo<Ctx>(
    () => ({
      minerales,
      cargando,
      error,
      porId: new Map(minerales.map((m) => [m.id, m])),
      reemplazar: (m) => setMinerales(ordenar(m)),
      favoritos,
      alternarFavorito,
      comparar,
      alternarComparar,
      limpiarComparar: () => setComparar([]),
      tema,
      alternarTema: () => setTema((t) => (t === "dark" ? "light" : "dark")),
    }),
    [minerales, cargando, error, favoritos, alternarFavorito, comparar, alternarComparar, tema],
  );

  return <C.Provider value={valor}>{children}</C.Provider>;
}

const ordenar = (m: Mineral[]) => [...m].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

export function useCatalogo() {
  const c = useContext(C);
  if (!c) throw new Error("useCatalogo fuera del Proveedor");
  return c;
}
