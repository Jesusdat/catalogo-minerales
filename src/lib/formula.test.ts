import { describe, expect, it } from "vitest";
import { elementosDe, normalizarFormula, tokenizar } from "./formula";

describe("fórmulas químicas", () => {
  it("separa subíndices", () => {
    const t = tokenizar("SiO2");
    expect(t.filter((x) => x.sub).map((x) => x.t).join("")).toBe("2");
  });
  it("extrae elementos de fórmulas hidratadas", () => {
    expect(elementosDe("CaSO4·2H2O").sort()).toEqual(["Ca", "H", "O", "S"]);
  });
  it("extrae elementos con sustituciones entre paréntesis", () => {
    expect(elementosDe("Ca5(PO4)3(F,Cl,OH)").sort()).toEqual(["Ca", "Cl", "F", "H", "O", "P"].sort());
  });
  it("normaliza sin perder contenido", () => {
    expect(normalizarFormula("  SiO2 ")).toContain("SiO2");
  });
});
