import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from catalogo.fotos import a_webp
from catalogo.models import Fotografia, Localidad, Mineral
from catalogo.serializar import CAMPOS



class Command(BaseCommand):
    help = "Carga los minerales de datos/minerales.json. Por seguridad no hace nada si la base ya tiene datos."

    def add_arguments(self, parser):
        parser.add_argument("--archivo", default=str(Path(settings.BASE_DIR) / "datos" / "minerales.json"))
        parser.add_argument(
            "--actualizar",
            action="store_true",
            help="Actualiza los minerales existentes con el contenido del archivo y agrega los nuevos.",
        )

    @transaction.atomic
    def handle(self, *args, archivo, actualizar, **opts):
        ruta = Path(archivo)
        if Mineral.objects.exists() and not actualizar:
            self.stdout.write("La base ya tiene minerales; no se cargó nada (usa --actualizar para sincronizar).")
            return
        datos = json.loads(ruta.read_text(encoding="utf-8"))
        nuevos = 0
        for d in datos:
            mineral, creado = Mineral.objects.update_or_create(slug=d["id"], defaults={k: d.get(k) for k in CAMPOS})
            nuevos += creado
            mineral.full_clean()
            mineral.localidades.all().delete()
            Localidad.objects.bulk_create(
                [Localidad(mineral=mineral, orden=i, **{k: loc[k] for k in ("nombre", "region", "lat", "lon")})
                 for i, loc in enumerate(d.get("localidades", []))]
            )
            img = d.get("imagen") or {}
            archivo_img = ruta.parent / img.get("src", "") if img.get("src") else None
            if archivo_img and archivo_img.is_file():
                contenido, ancho, alto = a_webp(archivo_img.read_bytes())
                Fotografia.objects.update_or_create(
                    mineral=mineral,
                    defaults=dict(
                        datos=contenido, tipo="image/webp", ancho=ancho, alto=alto,
                        autor=img.get("autor", ""), licencia=img.get("licencia", ""),
                        licencia_url=img.get("licencia_url", ""), fuente=img.get("fuente", ""),
                    ),
                )
        self.stdout.write(self.style.SUCCESS(f"{len(datos)} minerales procesados ({nuevos} nuevos)."))
