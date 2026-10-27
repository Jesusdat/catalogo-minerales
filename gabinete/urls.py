import os

from django.contrib.sitemaps.views import sitemap
from django.urls import include, path

from catalogo.admin import sitio_admin
from catalogo.sitemaps import Minerales, Paginas
from catalogo.views import robots

ADMIN_URL = os.environ.get("DJANGO_ADMIN_URL", "admin/").strip("/") + "/"

urlpatterns = [
    path(ADMIN_URL, sitio_admin.urls),
    path("sitemap.xml", sitemap, {"sitemaps": {"paginas": Paginas, "minerales": Minerales}}, name="sitemap"),
    path("robots.txt", robots),
    path("", include("catalogo.urls")),
]

handler404 = "catalogo.views.no_encontrado"
