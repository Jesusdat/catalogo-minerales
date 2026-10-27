"""Procesamiento de fotos: cualquier formato de entrada se guarda como WebP de tamaño razonable."""

from io import BytesIO

from PIL import Image, ImageOps

LADO_MAX = 1400


def a_webp(contenido: bytes, lado_max: int = LADO_MAX, calidad: int = 82) -> tuple[bytes, int, int]:
    img = Image.open(BytesIO(contenido))
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
    img.thumbnail((lado_max, lado_max), Image.LANCZOS)
    salida = BytesIO()
    img.save(salida, "WEBP", quality=calidad, method=6)
    return salida.getvalue(), img.width, img.height
