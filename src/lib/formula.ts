import { SIMBOLOS } from "./elements";

export type Token = { t: string; sub: boolean };

/** Divide una fórmula ASCII (p. ej. "CaSO4·2H2O") en tramos normales y subíndices. */
export function tokenizar(formula: string): Token[] {
  const out: Token[] = [];
  const s = normalizarFormula(formula);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const esDigito = ch >= "0" && ch <= "9";
    const prev = s[i - 1];
    // Es subíndice si sigue a una letra, a ")" o a otro subíndice. Un número tras "·" o al inicio es coeficiente.
    const sub = esDigito && i > 0 && (/[A-Za-z)\]]/.test(prev) || (out.length > 0 && out[out.length - 1].sub && /[0-9.]/.test(prev)));
    const ultimo = out[out.length - 1];
    if (ultimo && ultimo.sub === sub) ultimo.t += ch;
    else out.push({ t: ch, sub });
  }
  return out;
}

const SUB = "₀₁₂₃₄₅₆₇₈₉";
/** Convierte subíndices Unicode a dígitos ASCII y unifica el punto de hidratación. */
export function normalizarFormula(f: string): string {
  return f
    .trim()
    .replace(/[₀-₉]/g, (c) => String(SUB.indexOf(c)))
    .replace(/\s*[·•.*]\s*(?=\d*[A-Z])/g, "·");
}

export function formulaUnicode(f: string): string {
  return tokenizar(f)
    .map((x) => (x.sub ? x.t.replace(/\d/g, (d) => SUB[Number(d)]) : x.t))
    .join("");
}

/** Símbolos químicos presentes en la fórmula, sin repetir y en orden de aparición. */
export function elementosDe(formula: string): string[] {
  const s = normalizarFormula(formula);
  const vistos: string[] = [];
  for (const m of s.matchAll(/[A-Z][a-z]?/g)) {
    let sim = m[0];
    if (!SIMBOLOS.has(sim) && sim.length === 2 && SIMBOLOS.has(sim[0])) sim = sim[0];
    if (SIMBOLOS.has(sim) && !vistos.includes(sim)) vistos.push(sim);
  }
  return vistos;
}
