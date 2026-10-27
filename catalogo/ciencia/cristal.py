"""Vértices de formas cristalinas idealizadas. La envolvente convexa da el sólido 3D."""

import math

V = tuple[float, float, float]


def _hex(r: float, y: float, rot: float = 0) -> list[V]:
    return [(r * math.cos(math.pi / 3 * i + rot), y, r * math.sin(math.pi / 3 * i + rot)) for i in range(6)]


def _rombo(ax: float, az: float, y: float) -> list[V]:
    return [(ax, y, 0), (0, y, az), (-ax, y, 0), (0, y, -az)]


def _caja(x: float, y: float, z: float) -> list[V]:
    return [(a, b, c) for a in (-x, x) for b in (-y, y) for c in (-z, z)]


def _romboedro() -> list[V]:
    d = 1 / math.sqrt(3)
    out = []
    for x, y, z in _caja(0.8, 0.8, 0.8):
        p = (x + y + z) * d * 0.55
        out.append((x + p * d, y + p * d, z + p * d))
    return out


FORMAS = {
    "cubo": lambda: _caja(1, 1, 1),
    "octaedro": lambda: [(1.35, 0, 0), (-1.35, 0, 0), (0, 1.35, 0), (0, -1.35, 0), (0, 0, 1.35), (0, 0, -1.35)],
    "tetraedro": lambda: [(1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1)],
    "romboedro": _romboedro,
    "prisma-hexagonal": lambda: _hex(0.62, 0.9) + _hex(0.62, -0.9) + [(0, 1.65, 0), (0, -1.65, 0)],
    "prisma-hexagonal-plano": lambda: _hex(0.7, 1.05) + _hex(0.7, -1.05),
    "tabular-hexagonal": lambda: _hex(1.2, 0.22) + _hex(1.2, -0.22) + _hex(1.0, 0.34) + _hex(1.0, -0.34),
    "bipiramide-hexagonal": lambda: _hex(0.78, 0) + _hex(0.42, 1.25) + _hex(0.42, -1.25),
    "bipiramide": lambda: [(0.85, 0, 0), (-0.85, 0, 0), (0, 0, 0.55), (0, 0, -0.55), (0, 1.5, 0), (0, -1.5, 0)],
    "prisma-tetragonal": lambda: _caja(0.55, 0.95, 0.55) + [(0, 1.55, 0), (0, -1.55, 0)],
    "prisma-ortorrombico": lambda: _rombo(0.75, 0.48, 0.85)
    + _rombo(0.75, 0.48, -0.85)
    + [(0.32, 1.3, 0), (-0.32, 1.3, 0), (0.32, -1.3, 0), (-0.32, -1.3, 0)],
    "tabular-ortorrombico": lambda: _rombo(1.25, 0.8, 0.2)
    + _rombo(1.25, 0.8, -0.2)
    + _rombo(1.0, 0.62, 0.36)
    + _rombo(1.0, 0.62, -0.36),
    "prisma-monoclinico": lambda: [(x + y * 0.32, y, z) for x, y, z in _caja(0.6, 1.1, 0.42)],
}


def vertices_de(habito: str) -> list[list[float]]:
    forma = FORMAS.get(habito, FORMAS["cubo"])
    return [[round(c, 4) for c in v] for v in forma()]
