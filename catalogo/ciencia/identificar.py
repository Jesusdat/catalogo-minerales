"""Identificador por pruebas caseras: cada respuesta suma o resta coincidencias."""

from dataclasses import dataclass, field

from .constantes import BRILLOS_METALICOS

PRUEBAS_DUREZA = {
    "una": ("La uña lo raya", (1, 2.5)),
    "moneda": ("Lo raya una moneda de cobre, pero no la uña", (2.5, 3.5)),
    "navaja": ("Lo raya una navaja, pero no la moneda", (3.5, 5.5)),
    "vidrio": ("Raya el vidrio", (5.5, 10)),
}

PESOS = {
    "ligero": ("Ligero, como una roca común", (0, 2.8)),
    "normal": ("Algo pesado", (2.8, 4.5)),
    "pesado": ("Muy pesado para su tamaño", (4.5, 100)),
}


@dataclass
class Resultado:
    mineral: object
    coincidencias: list[str] = field(default_factory=list)
    fallos: list[str] = field(default_factory=list)

    @property
    def puntos(self) -> int:
        return len(self.coincidencias)

    @property
    def total(self) -> int:
        return len(self.coincidencias) + len(self.fallos)

    @property
    def completo(self) -> bool:
        return self.total > 0 and not self.fallos


def _num(x: float) -> str:
    return f"{x:g}"


def identificar(minerales, r: dict) -> list[Resultado]:
    """Ordena los minerales según cuántas respuestas cumplen.

    `r` admite: brillo ("metalico"/"no-metalico"), dureza (clave de PRUEBAS_DUREZA),
    raya (grupo), magnetico y efervescencia (bool) y peso (clave de PESOS).
    Las claves ausentes no penalizan.
    """
    resultados = []
    for m in minerales:
        res = Resultado(m)

        def evaluar(cond: bool, texto: str) -> None:
            (res.coincidencias if cond else res.fallos).append(texto)

        if r.get("brillo"):
            met = m.brillo in BRILLOS_METALICOS
            evaluar(met if r["brillo"] == "metalico" else not met, f"Brillo {m.brillo.lower()}")
        if r.get("dureza") in PRUEBAS_DUREZA:
            a, b = PRUEBAS_DUREZA[r["dureza"]][1]
            rango = _num(m.dureza_min) + ("" if m.dureza_max == m.dureza_min else "–" + _num(m.dureza_max))
            evaluar(m.dureza_min <= b and m.dureza_max >= a, f"Dureza {rango}")
        if r.get("raya"):
            evaluar(m.raya_grupo == r["raya"], f"Raya {m.raya.lower()}")
        if r.get("magnetico") is not None:
            evaluar(m.magnetico == r["magnetico"], "Es magnético" if m.magnetico else "No es magnético")
        if r.get("efervescencia") is not None:
            evaluar(
                m.efervescencia == r["efervescencia"],
                "Burbujea con ácido" if m.efervescencia else "No burbujea con ácido diluido",
            )
        if r.get("peso") in PESOS and m.densidad is not None:
            a, b = PESOS[r["peso"]][1]
            evaluar(a <= m.densidad < b, f"Densidad {_num(m.densidad)} g/cm³")
        resultados.append(res)
    resultados.sort(key=lambda x: (-x.puntos, len(x.fallos), x.mineral.nombre))
    return resultados
