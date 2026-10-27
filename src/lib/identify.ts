import { BRILLOS_METALICOS, type Mineral, type RayaGrupo } from "./types";

export type Respuestas = {
  brillo?: "metalico" | "no-metalico";
  dureza?: "una" | "moneda" | "navaja" | "vidrio";
  raya?: RayaGrupo;
  magnetico?: boolean;
  efervescencia?: boolean;
  peso?: "ligero" | "normal" | "pesado";
};

/** Rangos de dureza que corresponden a cada prueba casera. */
export const PRUEBAS_DUREZA = {
  una: { label: "La uña lo raya", rango: [1, 2.5] },
  moneda: { label: "Lo raya una moneda de cobre, pero no la uña", rango: [2.5, 3.5] },
  navaja: { label: "Lo raya una navaja, pero no la moneda", rango: [3.5, 5.5] },
  vidrio: { label: "Raya el vidrio", rango: [5.5, 10] },
} as const;

export const PESOS = {
  ligero: { label: "Ligero, como una roca común", rango: [0, 2.8] },
  normal: { label: "Algo pesado", rango: [2.8, 4.5] },
  pesado: { label: "Muy pesado para su tamaño", rango: [4.5, 100] },
} as const;

const solapa = (a: number, b: number, [c, d]: readonly [number, number] | readonly number[]) => a <= d && b >= c;

export type Resultado = { mineral: Mineral; puntos: number; total: number; coincidencias: string[]; fallos: string[] };

export function identificar(minerales: Mineral[], r: Respuestas): Resultado[] {
  const resultados = minerales.map((m) => {
    const ok: string[] = [];
    const ko: string[] = [];
    const evaluar = (cond: boolean, texto: string) => (cond ? ok : ko).push(texto);

    if (r.brillo) {
      const met = BRILLOS_METALICOS.has(m.brillo);
      evaluar(r.brillo === "metalico" ? met : !met, `Brillo ${m.brillo.toLowerCase()}`);
    }
    if (r.dureza) {
      evaluar(solapa(m.dureza_min, m.dureza_max, PRUEBAS_DUREZA[r.dureza].rango), `Dureza ${m.dureza_min}${m.dureza_max !== m.dureza_min ? "–" + m.dureza_max : ""}`);
    }
    if (r.raya) evaluar(m.raya_grupo === r.raya, `Raya ${m.raya.toLowerCase()}`);
    if (r.magnetico !== undefined) evaluar(m.magnetico === r.magnetico, m.magnetico ? "Es magnético" : "No es magnético");
    if (r.efervescencia !== undefined)
      evaluar(m.efervescencia === r.efervescencia, m.efervescencia ? "Burbujea con ácido" : "No burbujea con ácido diluido");
    if (r.peso && m.densidad != null) {
      const [a, b] = PESOS[r.peso].rango;
      evaluar(m.densidad >= a && m.densidad < b, `Densidad ${m.densidad} g/cm³`);
    }
    return { mineral: m, puntos: ok.length, total: ok.length + ko.length, coincidencias: ok, fallos: ko };
  });
  return resultados.sort((a, b) => b.puntos - a.puntos || a.fallos.length - b.fallos.length || a.mineral.nombre.localeCompare(b.mineral.nombre));
}
