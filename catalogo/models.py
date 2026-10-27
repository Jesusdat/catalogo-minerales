from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.urls import reverse
from django.utils.functional import cached_property

from .ciencia import formula as fq
from .ciencia.constantes import BRILLOS, BRILLOS_METALICOS, CLASES, HABITOS, RAYAS, SISTEMAS


def _opciones(lista):
    return [(x, x) for x in lista]


class MineralQuerySet(models.QuerySet):
    def publicados(self):
        return self.filter(publicado=True)

    def con_relaciones(self):
        return self.select_related("foto").prefetch_related("localidades").defer("foto__datos")


class Mineral(models.Model):
    slug = models.SlugField("identificador", max_length=80, unique=True, help_text="Aparece en la dirección: /minerales/<identificador>/")
    nombre = models.CharField(max_length=120)
    formula = models.CharField("fórmula", max_length=120, help_text="En ASCII, p. ej. CaSO4·2H2O. Los subíndices se dibujan solos.")
    clase = models.CharField("clase química", max_length=40, choices=_opciones(CLASES))
    dureza_min = models.FloatField("dureza mínima (Mohs)", validators=[MinValueValidator(1), MaxValueValidator(10)])
    dureza_max = models.FloatField("dureza máxima (Mohs)", validators=[MinValueValidator(1), MaxValueValidator(10)])
    densidad = models.FloatField("densidad (g/cm³)", null=True, blank=True, validators=[MinValueValidator(0.5), MaxValueValidator(25)])
    sistema = models.CharField("sistema cristalino", max_length=30, choices=_opciones(SISTEMAS))
    habito = models.CharField("forma para el visor 3D", max_length=40, choices=HABITOS, default="cubo")
    brillo = models.CharField(max_length=30, choices=_opciones(BRILLOS))
    color = models.CharField(max_length=200)
    raya = models.CharField(max_length=80, help_text="Como se describe, p. ej. «Negra verdosa».")
    raya_grupo = models.CharField("grupo de raya", max_length=20, choices=[(a, b) for a, b, _ in RAYAS], help_text="Lo usa el identificador.")
    exfoliacion = models.CharField("exfoliación", max_length=120, blank=True)
    fractura = models.CharField(max_length=120, blank=True)
    magnetico = models.BooleanField("magnético", default=False)
    efervescencia = models.BooleanField("burbujea con ácido", default=False)
    fluorescencia = models.BooleanField("puede ser fluorescente", default=False)
    color_hex = models.CharField(
        "color del modelo 3D",
        max_length=7,
        default="#8A8F96",
        validators=[RegexValidator(r"^#[0-9A-Fa-f]{6}$", "Usa el formato #RRGGBB.")],
    )
    usos = models.TextField(blank=True)
    descripcion = models.TextField("descripción")
    wikipedia = models.URLField(blank=True)
    publicado = models.BooleanField(default=True, help_text="Desmárcalo para ocultarlo mientras lo preparas.")
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    objects = MineralQuerySet.as_manager()

    class Meta:
        ordering = ["nombre"]
        verbose_name = "mineral"
        verbose_name_plural = "minerales"
        constraints = [
            models.CheckConstraint(condition=models.Q(dureza_min__lte=models.F("dureza_max")), name="dureza_rango_valido"),
        ]

    def __str__(self):
        return self.nombre

    def get_absolute_url(self):
        return reverse("catalogo:ficha", args=[self.slug])

    @property
    def metalico(self) -> bool:
        return self.brillo in BRILLOS_METALICOS

    @property
    def dureza_texto(self) -> str:
        a, b = f"{self.dureza_min:g}", f"{self.dureza_max:g}"
        return a if a == b else f"{a}–{b}"

    @property
    def dureza_media(self) -> float:
        return (self.dureza_min + self.dureza_max) / 2

    @cached_property
    def elementos(self) -> list[str]:
        return fq.elementos_de(self.formula)

    @property
    def formula_tokens(self):
        return fq.tokenizar(self.formula)

    @property
    def formula_unicode(self) -> str:
        return fq.unicode(self.formula)

    @cached_property
    def tiene_foto(self) -> bool:
        try:
            return self.foto is not None
        except Fotografia.DoesNotExist:
            return False

    @property
    def foto_url(self) -> str:
        if not self.tiene_foto:
            return ""
        return reverse("catalogo:foto", args=[self.slug]) + f"?v={int(self.foto.actualizada.timestamp())}"

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.dureza_min is not None and self.dureza_max is not None and self.dureza_min > self.dureza_max:
            raise ValidationError({"dureza_max": "Debe ser mayor o igual que la dureza mínima."})
        if self.formula and not fq.elementos_de(self.formula):
            raise ValidationError({"formula": "No reconozco ningún elemento químico en la fórmula."})


class Localidad(models.Model):
    mineral = models.ForeignKey(Mineral, related_name="localidades", on_delete=models.CASCADE)
    nombre = models.CharField(max_length=120)
    region = models.CharField("región y país", max_length=160)
    lat = models.FloatField("latitud", validators=[MinValueValidator(-90), MaxValueValidator(90)])
    lon = models.FloatField("longitud", validators=[MinValueValidator(-180), MaxValueValidator(180)])
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["orden", "id"]
        verbose_name = "localidad"
        verbose_name_plural = "localidades"

    def __str__(self):
        return f"{self.nombre}, {self.region}"

    @property
    def en_mexico(self) -> bool:
        return "méxico" in self.region.lower()


class Fotografia(models.Model):
    """La imagen vive en la base de datos (WebP comprimido) junto con sus créditos."""

    mineral = models.OneToOneField(Mineral, related_name="foto", on_delete=models.CASCADE)
    datos = models.BinaryField(editable=False)
    tipo = models.CharField(max_length=40, default="image/webp", editable=False)
    ancho = models.PositiveIntegerField(default=0, editable=False)
    alto = models.PositiveIntegerField(default=0, editable=False)
    autor = models.CharField(max_length=200, blank=True)
    licencia = models.CharField(max_length=80, blank=True)
    licencia_url = models.URLField("enlace a la licencia", blank=True)
    fuente = models.URLField("página de origen", blank=True)
    actualizada = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "fotografía"
        verbose_name_plural = "fotografías"

    def __str__(self):
        return f"Foto de {self.mineral}"
