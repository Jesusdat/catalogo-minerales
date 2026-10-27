import re
from functools import lru_cache
from pathlib import Path

from django import template
from django.utils.html import format_html, format_html_join
from django.utils.safestring import mark_safe

from ..ciencia import formula as fq

register = template.Library()
_ICONOS = Path(__file__).resolve().parent.parent / "iconos"


@lru_cache(maxsize=None)
def _svg(nombre: str) -> str:
    texto = (_ICONOS / f"{nombre}.svg").read_text(encoding="utf-8")
    texto = re.sub(r"<!--.*?-->", "", texto, flags=re.S).strip()
    # Quita tamaño y clase solo de la etiqueta <svg>, no de sus figuras internas
    texto = re.sub(r"<svg[^>]*>", lambda m: re.sub(r'\s(width|height|class)="[^"]*"', "", m.group()), texto, count=1)
    return re.sub(r"\s+", " ", texto)


@register.simple_tag
def icono(nombre: str, clase: str = "h-4 w-4"):
    """Icono de Lucide incrustado como SVG; hereda el color del texto."""
    svg = _svg(nombre).replace("<svg", f'<svg class="{clase}" aria-hidden="true" focusable="false"', 1)
    return mark_safe(svg)


@register.filter
def formula(texto: str):
    """Fórmula química con subíndices en <sub>."""
    return format_html_join("", "{}", ((format_html("<sub>{}</sub>", t) if sub else t,) for t, sub in fq.tokenizar(texto or "")))


@register.filter
def pct_mohs(valor) -> float:
    try:
        return round((float(valor) - 1) / 9 * 100, 2)
    except (TypeError, ValueError):
        return 0


@register.simple_tag(takes_context=True)
def url_con(context, **cambios):
    """Querystring actual con los parámetros indicados reemplazados (vacío = quitar)."""
    q = context["request"].GET.copy()
    q.pop("pagina", None)
    for k, v in cambios.items():
        if v in ("", None):
            q.pop(k, None)
        else:
            q[k] = v
    s = q.urlencode()
    return "?" + s if s else "?"


@register.filter
def num(valor):
    try:
        return f"{float(valor):g}"
    except (TypeError, ValueError):
        return "—"


@register.simple_tag(takes_context=True)
def en_sesion(context, clave: str, slug: str) -> bool:
    """¿Está el mineral en la lista de favoritos o del comparador de esta sesión?"""
    return slug in context["request"].session.get(clave, [])
