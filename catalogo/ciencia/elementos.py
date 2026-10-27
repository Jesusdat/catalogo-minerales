"""Tabla periódica: símbolos, nombres en español y posición en la cuadrícula de 18 columnas."""

from dataclasses import dataclass

_LISTA = [
    ("H", "Hidrógeno"),
    ("He", "Helio"),
    ("Li", "Litio"),
    ("Be", "Berilio"),
    ("B", "Boro"),
    ("C", "Carbono"),
    ("N", "Nitrógeno"),
    ("O", "Oxígeno"),
    ("F", "Flúor"),
    ("Ne", "Neón"),
    ("Na", "Sodio"),
    ("Mg", "Magnesio"),
    ("Al", "Aluminio"),
    ("Si", "Silicio"),
    ("P", "Fósforo"),
    ("S", "Azufre"),
    ("Cl", "Cloro"),
    ("Ar", "Argón"),
    ("K", "Potasio"),
    ("Ca", "Calcio"),
    ("Sc", "Escandio"),
    ("Ti", "Titanio"),
    ("V", "Vanadio"),
    ("Cr", "Cromo"),
    ("Mn", "Manganeso"),
    ("Fe", "Hierro"),
    ("Co", "Cobalto"),
    ("Ni", "Níquel"),
    ("Cu", "Cobre"),
    ("Zn", "Zinc"),
    ("Ga", "Galio"),
    ("Ge", "Germanio"),
    ("As", "Arsénico"),
    ("Se", "Selenio"),
    ("Br", "Bromo"),
    ("Kr", "Kriptón"),
    ("Rb", "Rubidio"),
    ("Sr", "Estroncio"),
    ("Y", "Itrio"),
    ("Zr", "Circonio"),
    ("Nb", "Niobio"),
    ("Mo", "Molibdeno"),
    ("Tc", "Tecnecio"),
    ("Ru", "Rutenio"),
    ("Rh", "Rodio"),
    ("Pd", "Paladio"),
    ("Ag", "Plata"),
    ("Cd", "Cadmio"),
    ("In", "Indio"),
    ("Sn", "Estaño"),
    ("Sb", "Antimonio"),
    ("Te", "Telurio"),
    ("I", "Yodo"),
    ("Xe", "Xenón"),
    ("Cs", "Cesio"),
    ("Ba", "Bario"),
    ("La", "Lantano"),
    ("Ce", "Cerio"),
    ("Pr", "Praseodimio"),
    ("Nd", "Neodimio"),
    ("Pm", "Prometio"),
    ("Sm", "Samario"),
    ("Eu", "Europio"),
    ("Gd", "Gadolinio"),
    ("Tb", "Terbio"),
    ("Dy", "Disprosio"),
    ("Ho", "Holmio"),
    ("Er", "Erbio"),
    ("Tm", "Tulio"),
    ("Yb", "Iterbio"),
    ("Lu", "Lutecio"),
    ("Hf", "Hafnio"),
    ("Ta", "Tantalio"),
    ("W", "Wolframio"),
    ("Re", "Renio"),
    ("Os", "Osmio"),
    ("Ir", "Iridio"),
    ("Pt", "Platino"),
    ("Au", "Oro"),
    ("Hg", "Mercurio"),
    ("Tl", "Talio"),
    ("Pb", "Plomo"),
    ("Bi", "Bismuto"),
    ("Po", "Polonio"),
    ("At", "Astato"),
    ("Rn", "Radón"),
    ("Fr", "Francio"),
    ("Ra", "Radio"),
    ("Ac", "Actinio"),
    ("Th", "Torio"),
    ("Pa", "Protactinio"),
    ("U", "Uranio"),
    ("Np", "Neptunio"),
    ("Pu", "Plutonio"),
    ("Am", "Americio"),
    ("Cm", "Curio"),
    ("Bk", "Berkelio"),
    ("Cf", "Californio"),
    ("Es", "Einstenio"),
    ("Fm", "Fermio"),
    ("Md", "Mendelevio"),
    ("No", "Nobelio"),
    ("Lr", "Laurencio"),
    ("Rf", "Rutherfordio"),
    ("Db", "Dubnio"),
    ("Sg", "Seaborgio"),
    ("Bh", "Bohrio"),
    ("Hs", "Hasio"),
    ("Mt", "Meitnerio"),
    ("Ds", "Darmstatio"),
    ("Rg", "Roentgenio"),
    ("Cn", "Copernicio"),
    ("Nh", "Nihonio"),
    ("Fl", "Flerovio"),
    ("Mc", "Moscovio"),
    ("Lv", "Livermorio"),
    ("Ts", "Teneso"),
    ("Og", "Oganesón"),
]


@dataclass(frozen=True)
class Elemento:
    z: int
    simbolo: str
    nombre: str
    fila: int
    columna: int


def posicion(z: int) -> tuple[int, int]:
    """Fila y columna del elemento Z. Lantánidos en la fila 9 y actínidos en la 10."""
    periodos = [(1, 2, 1), (3, 10, 2), (11, 18, 3), (19, 36, 4), (37, 54, 5), (55, 86, 6), (87, 118, 7)]
    for ini, fin, p in periodos:
        if not ini <= z <= fin:
            continue
        i = z - ini
        if p == 1:
            return (1, 1 if i == 0 else 18)
        if p <= 3:
            return (p, i + 1 if i < 2 else i + 11)
        if p <= 5:
            return (p, i + 1)
        if i < 2:
            return (p, i + 1)
        if i < 17:
            return (9 if p == 6 else 10, i + 1)
        return (p, i - 13)
    raise ValueError(f"Z fuera de rango: {z}")


ELEMENTOS = [Elemento(i + 1, s, n, *posicion(i + 1)) for i, (s, n) in enumerate(_LISTA)]
POR_SIMBOLO = {e.simbolo: e for e in ELEMENTOS}
SIMBOLOS = frozenset(POR_SIMBOLO)
