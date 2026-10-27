import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from catalogo.models import Mineral
from catalogo.serializar import mineral_a_dict


class Command(BaseCommand):
    help = "Respaldo: escribe la base de datos en una carpeta (minerales.json + img/*.webp)."

    def add_arguments(self, parser):
        parser.add_argument("--carpeta", default=str(Path(settings.BASE_DIR) / "datos"))

    def handle(self, *args, carpeta, **opts):
        destino = Path(carpeta)
        (destino / "img").mkdir(parents=True, exist_ok=True)
        lista = []
        for m in Mineral.objects.select_related("foto").prefetch_related("localidades"):
            d = mineral_a_dict(m, con_foto_local=True)
            if m.tiene_foto:
                (destino / "img" / f"{m.slug}.webp").write_bytes(bytes(m.foto.datos))
            lista.append(d)
        (destino / "minerales.json").write_text(json.dumps(lista, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        self.stdout.write(self.style.SUCCESS(f"{len(lista)} minerales exportados a {destino}."))
