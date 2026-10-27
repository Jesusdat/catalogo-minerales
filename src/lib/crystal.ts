import type { Habito } from "./types";

type V = [number, number, number];

const hex = (r: number, y: number, rot = 0): V[] =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + rot;
    return [r * Math.cos(a), y, r * Math.sin(a)] as V;
  });
const rombo = (ax: number, az: number, y: number): V[] => [[ax, y, 0], [0, y, az], [-ax, y, 0], [0, y, -az]];
const caja = (x: number, y: number, z: number): V[] => {
  const out: V[] = [];
  for (const a of [-x, x]) for (const b of [-y, y]) for (const c of [-z, z]) out.push([a, b, c]);
  return out;
};

/** Vértices de una forma cristalina idealizada; la envolvente convexa da el sólido. */
export function verticesDe(h: Habito): V[] {
  switch (h) {
    case "cubo":
      return caja(1, 1, 1);
    case "octaedro":
      return [[1.35, 0, 0], [-1.35, 0, 0], [0, 1.35, 0], [0, -1.35, 0], [0, 0, 1.35], [0, 0, -1.35]];
    case "tetraedro":
      return [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
    case "romboedro": {
      // Cubo estirado a lo largo de su diagonal principal
      const d = 1 / Math.sqrt(3);
      return caja(0.8, 0.8, 0.8).map(([x, y, z]) => {
        const p = (x + y + z) * d * 0.55;
        return [x + p * d, y + p * d, z + p * d] as V;
      });
    }
    case "prisma-hexagonal":
      return [...hex(0.62, 0.9), ...hex(0.62, -0.9), [0, 1.65, 0], [0, -1.65, 0]];
    case "prisma-hexagonal-plano":
      return [...hex(0.7, 1.05), ...hex(0.7, -1.05)];
    case "tabular-hexagonal":
      return [...hex(1.2, 0.22), ...hex(1.2, -0.22), ...hex(1.0, 0.34), ...hex(1.0, -0.34)];
    case "bipiramide-hexagonal":
      return [...hex(0.78, 0), ...hex(0.42, 1.25), ...hex(0.42, -1.25)];
    case "bipiramide":
      return [[0.85, 0, 0], [-0.85, 0, 0], [0, 0, 0.55], [0, 0, -0.55], [0, 1.5, 0], [0, -1.5, 0]];
    case "prisma-tetragonal":
      return [...caja(0.55, 0.95, 0.55), [0, 1.55, 0], [0, -1.55, 0]];
    case "prisma-ortorrombico":
      return [...rombo(0.75, 0.48, 0.85), ...rombo(0.75, 0.48, -0.85), [0.32, 1.3, 0], [-0.32, 1.3, 0], [0.32, -1.3, 0], [-0.32, -1.3, 0]];
    case "tabular-ortorrombico":
      return [...rombo(1.25, 0.8, 0.2), ...rombo(1.25, 0.8, -0.2), ...rombo(1.0, 0.62, 0.36), ...rombo(1.0, 0.62, -0.36)];
    case "prisma-monoclinico":
      return caja(0.6, 1.1, 0.42).map(([x, y, z]) => [x + y * 0.32, y, z] as V);
  }
}
