import { describe, expect, it } from "vitest";
import { ELEMENTOS, POR_SIMBOLO } from "./elements";

describe("tabla periódica", () => {
  it("tiene 118 elementos únicos", () => {
    expect(ELEMENTOS).toHaveLength(118);
    expect(POR_SIMBOLO.size).toBe(118);
  });
  it("ubica elementos en su posición", () => {
    expect(POR_SIMBOLO.get("Fe")).toMatchObject({ fila: 4, columna: 8 });
    expect(POR_SIMBOLO.get("La")).toMatchObject({ fila: 9, columna: 3 });
    expect(POR_SIMBOLO.get("Hf")).toMatchObject({ fila: 6, columna: 4 });
    expect(POR_SIMBOLO.get("Og")).toMatchObject({ fila: 7, columna: 18 });
  });
});
