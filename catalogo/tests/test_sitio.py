import csv
import io
import json

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse

from catalogo.ciencia.identificar import identificar
from catalogo.models import Mineral


class ConCatalogo(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("cargar_catalogo", stdout=io.StringIO())


class CargaTests(ConCatalogo):
    def test_carga_es_idempotente(self):
        n = Mineral.objects.count()
        self.assertGreater(n, 20)
        call_command("cargar_catalogo", stdout=io.StringIO())
        self.assertEqual(Mineral.objects.count(), n)

    def test_fotos_guardadas_en_sql(self):
        self.assertTrue(Mineral.objects.get(slug="fluorita").tiene_foto)


class IdentificadorTests(ConCatalogo):
    def test_magnetita_primero(self):
        res = identificar(Mineral.objects.publicados().con_relaciones(), {"brillo": "metalico", "magnetico": True, "raya": "negra"})
        self.assertEqual(res[0].mineral.slug, "magnetita")
        self.assertTrue(res[0].completo)

    def test_vista(self):
        r = self.client.get(reverse("catalogo:identificar"), {"brillo": "metalico", "magnetico": "si", "raya": "negra"})
        self.assertContains(r, "Magnetita")


class VistasTests(ConCatalogo):
    def test_paginas(self):
        for nombre in ["inicio", "catalogo", "identificar", "elementos", "mapa", "comparar", "favoritos", "acerca", "api_minerales"]:
            with self.subTest(nombre):
                self.assertEqual(self.client.get(reverse(f"catalogo:{nombre}")).status_code, 200)
        self.assertEqual(self.client.get(reverse("catalogo:ficha", args=["fluorita"])).status_code, 200)
        self.assertEqual(self.client.get("/sitemap.xml").status_code, 200)
        self.assertEqual(self.client.get("/robots.txt").status_code, 200)

    def test_404(self):
        self.assertEqual(self.client.get("/no-existe/").status_code, 404)
        self.assertEqual(self.client.get(reverse("catalogo:ficha", args=["unobtanio"])).status_code, 404)

    def test_oculto_no_es_publico(self):
        Mineral.objects.filter(slug="yeso").update(publicado=False)
        self.assertEqual(self.client.get(reverse("catalogo:ficha", args=["yeso"])).status_code, 404)
        self.assertNotContains(self.client.get(reverse("catalogo:catalogo")), "/minerales/yeso/")

    def test_filtros(self):
        r = self.client.get(reverse("catalogo:catalogo"), {"brillo": "metalico", "formato": "json"})
        datos = json.loads(r.content)
        self.assertTrue(datos)
        self.assertIn("pirita", [d["id"] for d in datos])
        self.assertNotIn("cuarzo", [d["id"] for d in datos])
        r = self.client.get(reverse("catalogo:catalogo"), {"dmin": 9, "formato": "json"})
        self.assertEqual({d["id"] for d in json.loads(r.content)}, {"corindon", "diamante"})

    def test_csv(self):
        r = self.client.get(reverse("catalogo:catalogo"), {"q": "cuarzo", "formato": "csv"})
        self.assertEqual(r["Content-Type"], "text/csv; charset=utf-8")
        filas = list(csv.reader(io.StringIO(r.content.decode("utf-8-sig"))))
        self.assertEqual(filas[0][0], "Nombre")
        self.assertEqual(filas[1][0], "Cuarzo")

    def test_foto(self):
        r = self.client.get(reverse("catalogo:foto", args=["fluorita"]))
        self.assertEqual(r["Content-Type"], "image/webp")
        self.assertIn("immutable", r["Cache-Control"])


class SesionTests(ConCatalogo):
    def test_alternar_favorito(self):
        url = reverse("catalogo:alternar", args=["favoritos", "pirita"])
        r = self.client.post(url, HTTP_ACCEPT="application/json")
        self.assertEqual(r.json(), {"activo": True, "total": 1})
        self.assertContains(self.client.get(reverse("catalogo:favoritos")), "Pirita")
        self.assertEqual(self.client.post(url, HTTP_ACCEPT="application/json").json(), {"activo": False, "total": 0})

    def test_solo_post(self):
        self.assertEqual(self.client.get(reverse("catalogo:alternar", args=["favoritos", "pirita"])).status_code, 405)

    def test_comparar_por_enlace(self):
        r = self.client.get(reverse("catalogo:comparar"), {"ids": "pirita,galena"})
        self.assertContains(r, "Galena")
        self.assertEqual(self.client.session["comparar"], ["pirita", "galena"])


class AdminTests(ConCatalogo):
    def setUp(self):
        User = get_user_model()
        self.dueno = User.objects.create_superuser("dueno", "d@x.mx", "clave-segura-1")
        self.staff = User.objects.create_user("ayudante", "a@x.mx", "clave-segura-2", is_staff=True)

    def test_staff_sin_superusuario_no_entra(self):
        self.client.force_login(self.staff)
        r = self.client.get(reverse("admin:catalogo_mineral_changelist"))
        self.assertEqual(r.status_code, 302)

    def test_dueno_entra(self):
        self.client.force_login(self.dueno)
        self.assertEqual(self.client.get(reverse("admin:catalogo_mineral_changelist")).status_code, 200)
        pk = Mineral.objects.get(slug="fluorita").pk
        self.assertEqual(self.client.get(reverse("admin:catalogo_mineral_change", args=[pk])).status_code, 200)
        self.assertEqual(self.client.get(reverse("admin:admin_logentry_changelist")).status_code, 200)

    def test_crear_admin_quita_acceso_a_otros(self):
        import os
        from unittest import mock
        with mock.patch.dict(os.environ, {"DJANGO_SUPERUSER_USERNAME": "nuevo", "DJANGO_SUPERUSER_PASSWORD": "otra-clave-9"}):
            call_command("crear_admin", stdout=io.StringIO())
        User = get_user_model()
        self.assertTrue(User.objects.get(username="nuevo").is_superuser)
        self.assertFalse(User.objects.filter(is_staff=True).exclude(username="nuevo").exists())
