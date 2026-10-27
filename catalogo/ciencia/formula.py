"""Utilidades para fórmulas químicas escritas en ASCII, como "CaSO4·2H2O"."""

import re

from .elementos import SIMBOLOS

_SUB = "₀₁₂₃₄₅₆₇₈₉"


def normalizar(formula: str) -> str:
    """Convierte subíndices Unicode a dígitos y unifica el punto de hidratación."""
    s = formula.strip()
    s = re.sub(r"[₀-₉]", lambda m: str(_SUB.index(m.group())), s)
    return re.sub(r"\s*[·•.*]\s*(?=\d*[A-Z])", "·", s)


def tokenizar(formula: str) -> list[tuple[str, bool]]:
    """Divide la fórmula en tramos (texto, es_subindice).

    Un número es subíndice si sigue a una letra, a un paréntesis de cierre o a otro
    subíndice. Un número al inicio o después de "·" es coeficiente.
    """
    s = normalizar(formula)
    out: list[list] = []
    for i, ch in enumerate(s):
        prev = s[i - 1] if i else ""
        sub = ch.isdigit() and i > 0 and (
            bool(re.match(r"[A-Za-z)\]]", prev)) or (bool(out) and out[-1][1] and bool(re.match(r"[0-9.]", prev)))
        )
        if out and out[-1][1] == sub:
            out[-1][0] += ch
        else:
            out.append([ch, sub])
    return [(t, s) for t, s in out]


def unicode(formula: str) -> str:
    """Fórmula con subíndices Unicode, útil para texto plano y CSV."""
    return "".join(t.translate(str.maketrans("0123456789", _SUB)) if sub else t for t, sub in tokenizar(formula))


def elementos_de(formula: str) -> list[str]:
    """Símbolos químicos presentes, sin repetir y en orden de aparición."""
    vistos: list[str] = []
    for sim in re.findall(r"[A-Z][a-z]?", normalizar(formula)):
        if sim not in SIMBOLOS and len(sim) == 2 and sim[0] in SIMBOLOS:
            sim = sim[0]
        if sim in SIMBOLOS and sim not in vistos:
            vistos.append(sim)
    return vistos
