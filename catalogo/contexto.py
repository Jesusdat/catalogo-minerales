from django.conf import settings


def sitio(request):
    sesion = request.session if hasattr(request, "session") else {}
    return {
        "SITIO": settings.SITIO,
        "n_comparar": len(sesion.get("comparar", [])),
        "n_favoritos": len(sesion.get("favoritos", [])),
    }
