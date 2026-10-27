from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from .models import Mineral


class Paginas(Sitemap):
    changefreq = "monthly"
    priority = 0.6

    def items(self):
        return ["inicio", "catalogo", "identificar", "elementos", "mapa", "acerca"]

    def location(self, item):
        return reverse(f"catalogo:{item}")


class Minerales(Sitemap):
    changefreq = "monthly"
    priority = 0.8

    def items(self):
        return Mineral.objects.publicados().only("slug", "actualizado")

    def lastmod(self, obj):
        return obj.actualizado
