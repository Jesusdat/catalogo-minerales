import json

from django import forms
from django.contrib import admin, messages
from django.contrib.admin.models import LogEntry
from django.http import HttpResponse
from django.urls import reverse
from django.utils.html import format_html
from django.utils.text import slugify

from .fotos import a_webp
from .models import Fotografia, Localidad, Mineral
from .serializar import mineral_a_dict


class SitioAdmin(admin.AdminSite):
    site_header = "Gabinete Mineral · Administración"
    site_title = "Gabinete Mineral"
    index_title = "Panel del propietario"
    site_url = "/"

    def has_permission(self, request):
        # Solo la cuenta de superusuario (el dueño) puede entrar.
        return request.user.is_active and request.user.is_superuser


sitio_admin = SitioAdmin(name="admin")


class FotoForm(forms.ModelForm):
    archivo = forms.ImageField(
        label="Imagen",
        required=False,
        help_text="JPG, PNG o WebP. Se reduce a 1400 px y se guarda como WebP.",
    )

    class Meta:
        model = Fotografia
        fields = ["archivo", "autor", "licencia", "licencia_url", "fuente"]

    def clean(self):
        datos = super().clean()
        if not self.instance.pk and not datos.get("archivo") and any(datos.get(k) for k in ("autor", "licencia", "fuente")):
            raise forms.ValidationError("Sube la imagen para guardar sus créditos.")
        return datos

    def has_changed(self):
        return bool(self.files) or super().has_changed()

    def save(self, commit=True):
        archivo = self.cleaned_data.get("archivo")
        if archivo:
            contenido, ancho, alto = a_webp(archivo.read())
            self.instance.datos, self.instance.ancho, self.instance.alto = contenido, ancho, alto
            self.instance.tipo = "image/webp"
        return super().save(commit)


class FotoInline(admin.StackedInline):
    model = Fotografia
    form = FotoForm
    extra = 0
    max_num = 1
    can_delete = True
    readonly_fields = ["vista_previa"]
    fields = ["vista_previa", "archivo", "autor", "licencia", "licencia_url", "fuente"]
    verbose_name = "fotografía"

    def get_extra(self, request, obj=None, **kwargs):
        return 0 if obj and obj.tiene_foto else 1

    @admin.display(description="Actual")
    def vista_previa(self, obj):
        if not obj or not obj.pk:
            return "—"
        return format_html(
            '<img src="{}" alt="" style="max-height:180px;border-radius:8px"> <div style="color:#888">{}×{} px · {} KB</div>',
            obj.mineral.foto_url, obj.ancho, obj.alto, len(obj.datos) // 1024,
        )


class LocalidadInline(admin.TabularInline):
    model = Localidad
    extra = 1
    fields = ["nombre", "region", "lat", "lon", "orden"]


@admin.register(Mineral, site=sitio_admin)
class MineralAdmin(admin.ModelAdmin):
    list_display = ["miniatura", "nombre", "formula_corta", "clase", "dureza_texto", "sistema", "publicado", "actualizado"]
    list_display_links = ["miniatura", "nombre"]
    list_editable = ["publicado"]
    list_filter = ["publicado", "clase", "sistema", "brillo", "magnetico", "fluorescencia"]
    search_fields = ["nombre", "formula", "color", "usos", "localidades__nombre", "localidades__region"]
    prepopulated_fields = {"slug": ["nombre"]}
    list_per_page = 50
    save_on_top = True
    inlines = [FotoInline, LocalidadInline]
    actions = ["publicar", "ocultar", "exportar_json", "duplicar"]
    fieldsets = [
        (None, {"fields": ["nombre", "slug", "formula", "clase", "publicado"]}),
        ("Propiedades físicas", {"fields": [("dureza_min", "dureza_max"), "densidad", ("sistema", "habito"), "brillo", "color", ("raya", "raya_grupo"), ("exfoliacion", "fractura")]}),
        ("Pruebas del identificador", {"fields": [("magnetico", "efervescencia", "fluorescencia")]}),
        ("Presentación", {"fields": ["color_hex", "descripcion", "usos", "wikipedia"]}),
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("foto").defer("foto__datos")

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        campo = super().formfield_for_dbfield(db_field, request, **kwargs)
        if db_field.name == "color_hex":
            campo.widget = forms.TextInput(attrs={"type": "color"})
        if db_field.name in {"descripcion", "usos"}:
            campo.widget.attrs["rows"] = 4 if db_field.name == "descripcion" else 2
        return campo

    @admin.display(description="")
    def miniatura(self, obj):
        if not obj.tiene_foto:
            return format_html('<span style="display:inline-block;width:44px;height:44px;border-radius:6px;background:{}"></span>', obj.color_hex)
        return format_html('<img src="{}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:6px">', obj.foto_url)

    @admin.display(description="Fórmula", ordering="formula")
    def formula_corta(self, obj):
        return obj.formula_unicode

    @admin.display(description="Dureza", ordering="dureza_min")
    def dureza_texto(self, obj):
        return obj.dureza_texto

    @admin.action(description="Publicar los seleccionados")
    def publicar(self, request, queryset):
        n = queryset.update(publicado=True)
        self.message_user(request, f"{n} minerales publicados.", messages.SUCCESS)

    @admin.action(description="Ocultar los seleccionados")
    def ocultar(self, request, queryset):
        n = queryset.update(publicado=False)
        self.message_user(request, f"{n} minerales ocultos.", messages.SUCCESS)

    @admin.action(description="Descargar los seleccionados en JSON")
    def exportar_json(self, request, queryset):
        datos = [mineral_a_dict(m, request) for m in queryset.prefetch_related("localidades")]
        r = HttpResponse(json.dumps(datos, ensure_ascii=False, indent=2), content_type="application/json; charset=utf-8")
        r["Content-Disposition"] = 'attachment; filename="minerales.json"'
        return r

    @admin.action(description="Duplicar como borrador")
    def duplicar(self, request, queryset):
        for m in queryset.prefetch_related("localidades"):
            locs = list(m.localidades.all())
            base = slugify(f"{m.slug}-copia")
            slug, i = base, 2
            while Mineral.objects.filter(slug=slug).exists():
                slug, i = f"{base}-{i}", i + 1
            m.pk, m.slug, m.nombre, m.publicado = None, slug, f"{m.nombre} (copia)", False
            m._state.adding = True
            m.save()
            for l in locs:
                l.pk, l.mineral = None, m
                l.save()
        self.message_user(request, "Copias creadas como borrador.", messages.SUCCESS)

    def view_on_site(self, obj):
        return obj.get_absolute_url()


@admin.register(LogEntry, site=sitio_admin)
class HistorialAdmin(admin.ModelAdmin):
    """Historial de cambios: quién cambió qué y cuándo. Solo lectura."""

    list_display = ["action_time", "accion", "objeto", "content_type", "resumen", "user"]
    list_filter = ["action_flag", "content_type"]
    search_fields = ["object_repr", "change_message"]
    date_hierarchy = "action_time"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description="Acción", ordering="action_flag")
    def accion(self, obj):
        return {1: "Alta", 2: "Cambio", 3: "Baja"}.get(obj.action_flag, "—")

    @admin.display(description="Objeto", ordering="object_repr")
    def objeto(self, obj):
        if obj.action_flag != 3 and obj.content_type and obj.content_type.model == "mineral" and obj.object_id:
            url = reverse("admin:catalogo_mineral_change", args=[obj.object_id])
            return format_html('<a href="{}">{}</a>', url, obj.object_repr)
        return obj.object_repr

    @admin.display(description="Detalle")
    def resumen(self, obj):
        return obj.get_change_message() or "—"


LogEntry._meta.verbose_name = "cambio"
LogEntry._meta.verbose_name_plural = "historial de cambios"
