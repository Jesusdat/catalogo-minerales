import { describe, expect, it } from "vitest";
import datos from "../../public/data/minerales.json";
import { identificar } from "./identify";
import type { Mineral } from "./types";

const minerales = datos as Mineral[];

describe("identificador", () => {
  it("la magnetita encabeza: metálico, magnético, raya negra", () => {
    const r = identificar(minerales, { brillo: "metalico", magnetico: true, raya: "negra" });
    expect(r[0].mineral.id).toBe("magnetita");
    expect(r[0].puntos).toBe(r[0].total);
  });
  it("la calcita aparece con efervescencia y dureza de moneda", () => {
    const r = identificar(minerales, { efervescencia: true, dureza: "moneda", brillo: "no-metalico" });
    expect(r.slice(0, 3).map((x) => x.mineral.id)).toContain("calcita");
  });
  it("sin respuestas no penaliza a nadie", () => {
    const r = identificar(minerales, {});
    expect(r.every((x) => x.total === 0)).toBe(true);
  });
});

describe("datos", () => {
  it("ids únicos y campos válidos", () => {
    const ids = new Set(minerales.map((m) => m.id));
    expect(ids.size).toBe(minerales.length);
    for (const m of minerales) {
      expect(m.dureza_min).toBeLessThanOrEqual(m.dureza_max);
      for (const l of m.localidades) {
        expect(Math.abs(l.lat)).toBeLessThanOrEqual(90);
        expect(Math.abs(l.lon)).toBeLessThanOrEqual(180);
      }
    }
  });
});
