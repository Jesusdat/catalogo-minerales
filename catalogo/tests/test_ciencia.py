from django.test import SimpleTestCase

from catalogo.ciencia.elementos import ELEMENTOS, POR_SIMBOLO
from catalogo.ciencia.formula import elementos_de, unicode


class FormulaTests(SimpleTestCase):
    def test_hidrato(self):
        self.assertEqual(set(elementos_de("CaSO4·2H2O")), {"Ca", "S", "O", "H"})

    def test_grupos_y_sustituciones(self):
        self.assertEqual(set(elementos_de("Ca5(PO4)3(F,Cl,OH)")), {"Ca", "P", "O", "F", "Cl", "H"})

    def test_subindices_unicode(self):
        self.assertEqual(unicode("SiO2"), "SiO₂")


class TablaPeriodicaTests(SimpleTestCase):
    def test_118_elementos(self):
        self.assertEqual(len(ELEMENTOS), 118)
        self.assertEqual(len(POR_SIMBOLO), 118)

    def test_posiciones(self):
        casos = {"H": (1, 1), "He": (1, 18), "Fe": (4, 8), "La": (9, 3), "Hf": (6, 4), "Og": (7, 18), "Lr": (10, 17)}
        for simbolo, pos in casos.items():
            e = POR_SIMBOLO[simbolo]
            self.assertEqual((e.fila, e.columna), pos, simbolo)

    def test_sin_casillas_repetidas(self):
        self.assertEqual(len({(e.fila, e.columna) for e in ELEMENTOS}), 118)
