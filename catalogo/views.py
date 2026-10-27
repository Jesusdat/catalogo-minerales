import csv
import json
import random
from collections import Counter, defaultdict
from datetime import date

from django.core.paginator import Paginator
from django.db.models import Q
from django.http import Http404, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_POST

from .ciencia.constantes import BRILLOS_METALICOS, CLASES, ESCALA_MOHS, HABITOS, RAYAS, SISTEMAS
from .ciencia.cristal import vertices_de
from .ciencia.elementos import ELEMENTOS, POR_SIMBOLO
from .ciencia.identificar import PESOS, PRUEBAS_DUREZA, identificar
from .models import Fotografia, Mineral
from .serializar import mineral_a_dict

MAX_COMPARAR = 4
ORDENES = {
    "nombre": ("Nombre", lambda m: m.nombre),
    "dureza": ("Dureza", lambda m: (m.dureza_media, m.nombre)),
    "-dureza": ("Dureza (mayor primero)", lambda m: (-m.dureza_media, m.nombre)),
    "densidad": ("Densidad", lambda m: (m.densidad or 0, m.nombre)),
    "-densidad": ("Densidad (mayor primero)", lambda m: (-(m.densidad or 0), m.nombre)),
}


def _minerales():
    return list(Mineral.objects.publicados().con_relaciones())


def _cristal(m, autorotar=True):
    """Datos para el visor 3D; los vértices se calculan en Python."""
    return {"vertices": vertices_de(m.habito), "color": m.color_hex, "metalico": m.metalico, "autorotar": autorotar}


def _volver(request, defecto="catalogo:catalogo"):
    siguiente = request.POST.get("siguiente") or request.META.get("HTTP_REFERER")
    if siguiente and url_has_allowed_host_and_scheme(siguiente, {request.get_host()}, request.is_secure()):
        return redirect(siguiente)
    return redirect(defecto)


# ---------- Páginas ----------

def inicio(request):
    minerales = _minerales()
    if not minerales:
        return render(request, "catalogo/inicio.html", {"vacio": True})
    # El mineral destacado cambia una vez al día
    destacado = random.Random(date.today().toordinal()).choice(minerales)
    elementos = {e for m in minerales for e in m.elementos}
    lugares = {(l.nombre, l.region) for m in minerales for l in m.localidades.all()}
    mx = sum(1 for m in minerales if any(l.en_mexico for l in m.localidades.all()))
    por_slug = {m.slug: m for m in minerales}
    mohs = [{"grado": g, "nombre": n, "mineral": por_slug.get(s)} for g, s, n in ESCALA_MOHS]
    recientes = sorted(minerales, key=lambda m: m.creado, reverse=True)[:4]
    return render(request, "catalogo/inicio.html", {
        "destacado": destacado,
        "cristal": _cristal(destacado),
        "stats": [("Minerales", len(minerales)), ("Clases químicas", len({m.clase for m in minerales})),
                  ("Elementos distintos", len(elementos)), ("Localidades distintas", len(lugares))],
        "mohs": mohs,
        "mx": mx,
        "n_lugares": len(lugares),
        "recientes": recientes,
        "por_dureza": sorted(minerales, key=lambda m: (m.dureza_max, m.nombre)),
    })


def _filtrar(request, minerales):
    g = request.GET
    f = {
        "q": g.get("q", "").strip(),
        "clase": g.get("clase", ""),
        "sistema": g.get("sistema", ""),
        "brillo": g.get("brillo", ""),
        "elemento": g.get("elemento", ""),
        "mexico": g.get("mexico") == "1",
        "orden": g.get("orden", "nombre") if g.get("orden") in ORDENES else "nombre",
        "vista": "lista" if g.get("vista") == "lista" else "cuadricula",
    }
    try:
        f["dmin"] = max(1.0, min(10.0, float(g.get("dmin", 1))))
        f["dmax"] = max(1.0, min(10.0, float(g.get("dmax", 10))))
    except ValueError:
        f["dmin"], f["dmax"] = 1.0, 10.0
    if f["dmin"] > f["dmax"]:
        f["dmin"], f["dmax"] = f["dmax"], f["dmin"]

    def pasa(m):
        if f["q"]:
            texto = " ".join([m.nombre, m.formula, m.color, m.usos, m.clase, m.sistema] + [f"{l.nombre} {l.region}" for l in m.localidades.all()]).lower()
            if not all(p in texto for p in f["q"].lower().split()):
                return False
        if f["clase"] and m.clase != f["clase"]:
            return False
        if f["sistema"] and m.sistema != f["sistema"]:
            return False
        if f["brillo"] == "metalico" and not m.metalico:
            return False
        if f["brillo"] == "no-metalico" and m.metalico:
            return False
        if f["elemento"] and f["elemento"] not in m.elementos:
            return False
        if f["mexico"] and not any(l.en_mexico for l in m.localidades.all()):
            return False
        return m.dureza_max >= f["dmin"] and m.dureza_min <= f["dmax"]

    res = sorted(filter(pasa, minerales), key=ORDENES[f["orden"]][1])
    f["activos"] = any([f["q"], f["clase"], f["sistema"], f["brillo"], f["elemento"], f["mexico"], f["dmin"] > 1, f["dmax"] < 10])
    return res, f


def catalogo(request):
    minerales = _minerales()
    res, f = _filtrar(request, minerales)
    formato = request.GET.get("formato")
    if formato == "json":
        r = JsonResponse([mineral_a_dict(m, request) for m in res], safe=False, json_dumps_params={"ensure_ascii": False, "indent": 2})
        r["Content-Disposition"] = 'attachment; filename="minerales.json"'
        return r
    if formato == "csv":
        r = HttpResponse(content_type="text/csv; charset=utf-8")
        r["Content-Disposition"] = 'attachment; filename="minerales.csv"'
        r.write("\ufeff")  # BOM para que Excel respete los acentos
        w = csv.writer(r)
        w.writerow(["Nombre", "Fórmula", "Clase", "Dureza mín", "Dureza máx", "Densidad", "Sistema", "Brillo", "Color", "Raya", "Magnético", "Localidades", "URL"])
        for m in res:
            w.writerow([m.nombre, m.formula_unicode, m.clase, m.dureza_min, m.dureza_max, m.densidad or "", m.sistema, m.brillo,
                        m.color, m.raya, "Sí" if m.magnetico else "No", "; ".join(str(l) for l in m.localidades.all()),
                        request.build_absolute_uri(m.get_absolute_url())])
        return r
    pagina = Paginator(res, 24).get_page(request.GET.get("pagina"))
    sin_pagina = request.GET.copy()
    sin_pagina.pop("pagina", None)
    clases_disponibles = [c for c in CLASES if any(m.clase == c for m in minerales)]
    sistemas_disponibles = [s for s in SISTEMAS if any(m.sistema == s for m in minerales)]
    return render(request, "catalogo/catalogo.html", {
        "pagina": pagina, "total": len(minerales), "n": len(res), "f": f,
        "clases": clases_disponibles, "sistemas": sistemas_disponibles,
        "ordenes": [(k, v[0]) for k, v in ORDENES.items()],
        "qs": sin_pagina.urlencode(),
        "brillos": [("", "Todos"), ("metalico", "Metálico"), ("no-metalico", "No metálico")],
        "elemento_nombre": POR_SIMBOLO[f["elemento"]].nombre if f["elemento"] in POR_SIMBOLO else "",
    })


def ficha(request, slug):
    m = get_object_or_404(Mineral.objects.con_relaciones(), slug=slug)
    if not m.publicado and not request.user.is_superuser:
        raise Http404
    todos = list(Mineral.objects.publicados().only("slug", "nombre").order_by("nombre"))
    idx = next((i for i, x in enumerate(todos) if x.slug == m.slug), None)
    anterior = todos[idx - 1] if idx else None
    siguiente = todos[idx + 1] if idx is not None and idx + 1 < len(todos) else None
    relacionados = list(Mineral.objects.publicados().con_relaciones().filter(clase=m.clase).exclude(pk=m.pk)[:4])
    if len(relacionados) < 4:
        relacionados += list(Mineral.objects.publicados().con_relaciones().filter(sistema=m.sistema).exclude(pk=m.pk).exclude(clase=m.clase)[: 4 - len(relacionados)])
    # Mineral de referencia de Mohs inmediatamente igual o más blando
    candidatos = [(g, s, n) for g, s, n in ESCALA_MOHS if g <= int(m.dureza_max)]
    referencia = {"grado": candidatos[-1][0], "slug": candidatos[-1][1], "nombre": candidatos[-1][2]} if candidatos else None
    return render(request, "catalogo/ficha.html", {
        "m": m,
        "cristal": _cristal(m, autorotar=False),
        "habito": dict(HABITOS).get(m.habito, m.habito),
        "elementos": [POR_SIMBOLO[e] for e in m.elementos],
        "puntos": [{"lat": l.lat, "lon": l.lon, "titulo": l.nombre, "texto": l.region, "color": m.color_hex} for l in m.localidades.all()],
        "anterior": anterior, "siguiente": siguiente, "relacionados": relacionados,
        "referencia_mohs": referencia,
        "propiedades": [("Clase", m.clase), ("Sistema cristalino", m.sistema), ("Brillo", m.brillo), ("Color", m.color),
                        ("Raya", m.raya), ("Exfoliación", m.exfoliacion), ("Fractura", m.fractura), ("Usos", m.usos)],
    })


def _bool(v):
    return {"si": True, "no": False}.get(v)


def identificador(request):
    g = request.GET
    r = {
        "brillo": g.get("brillo") if g.get("brillo") in {"metalico", "no-metalico"} else None,
        "dureza": g.get("dureza") if g.get("dureza") in PRUEBAS_DUREZA else None,
        "raya": g.get("raya") if g.get("raya") in {x[0] for x in RAYAS} else None,
        "magnetico": _bool(g.get("magnetico")),
        "efervescencia": _bool(g.get("efervescencia")),
        "peso": g.get("peso") if g.get("peso") in PESOS else None,
    }
    contestadas = sum(v is not None for v in r.values())
    resultados = identificar(_minerales(), r) if contestadas else []
    completos = [x for x in resultados if x.completo]
    cercanos = [x for x in resultados if not x.completo and x.puntos > 0][:6]
    preguntas = [
        ("brillo", "¿Cómo brilla?", "Metálico: refleja como un metal pulido. No metálico: vítreo, sedoso, terroso…",
         [("metalico", "Metálico", None), ("no-metalico", "No metálico", None)]),
        ("dureza", "¿Qué tan duro es?", "Intenta rayarlo con la uña (2.5), una moneda de cobre (3.5) o una navaja de acero (5.5).",
         [(k, v[0], None) for k, v in PRUEBAS_DUREZA.items()]),
        ("raya", "¿De qué color es su raya?", "Frótalo sobre porcelana sin esmaltar (el reverso de un azulejo) y mira el polvo que deja.",
         [(k, label, hx) for k, label, hx in RAYAS]),
        ("magnetico", "¿Lo atrae un imán?", "Acerca un imán de refrigerador.", [("si", "Sí", None), ("no", "No", None)]),
        ("efervescencia", "¿Burbujea con ácido?", "Una gota de vinagre o ácido clorhídrico diluido. Los carbonatos hacen efervescencia.",
         [("si", "Sí", None), ("no", "No", None)]),
        ("peso", "¿Cómo se siente en la mano?", "Compáralo con una piedra común del mismo tamaño.", [(k, v[0], None) for k, v in PESOS.items()]),
    ]
    return render(request, "catalogo/identificar.html", {
        "preguntas": [{"clave": c, "titulo": t, "ayuda": a, "opciones": o, "valor": g.get(c, "")} for c, t, a, o in preguntas],
        "contestadas": contestadas, "completos": completos, "cercanos": cercanos,
    })


def elementos(request):
    minerales = _minerales()
    conteo = Counter(e for m in minerales for e in m.elementos)
    maximo = max(conteo.values(), default=1)
    sel = request.GET.get("simbolo", "")
    celdas = []
    for e in ELEMENTOS:
        n = conteo.get(e.simbolo, 0)
        celdas.append({"e": e, "n": n, "nivel": 0 if not n else 1 + min(3, int(3 * n / maximo)), "sel": e.simbolo == sel})
    seleccion = POR_SIMBOLO.get(sel)
    return render(request, "catalogo/elementos.html", {
        "celdas": celdas,
        "presentes": len(conteo),
        "frecuentes": [(POR_SIMBOLO[s], n) for s, n in conteo.most_common(8)],
        "seleccion": seleccion,
        "con_seleccion": [m for m in minerales if seleccion and seleccion.simbolo in m.elementos],
    })


def mapa(request):
    minerales = _minerales()
    clase = request.GET.get("clase", "")
    mexico = request.GET.get("mexico") == "1"
    puntos = []
    for m in minerales:
        if clase and m.clase != clase:
            continue
        for l in m.localidades.all():
            if mexico and not l.en_mexico:
                continue
            puntos.append({"lat": l.lat, "lon": l.lon, "titulo": m.nombre, "texto": f"{l.nombre}, {l.region}",
                           "url": m.get_absolute_url(), "color": m.color_hex, "foto": m.foto_url})
    por_region = defaultdict(int)
    for p in puntos:
        por_region[p["texto"].split(",")[-1].strip()] += 1
    return render(request, "catalogo/mapa.html", {
        "puntos": puntos, "clase": clase, "mexico": mexico,
        "clases": [c for c in CLASES if any(m.clase == c for m in minerales)],
        "paises": sorted(por_region.items(), key=lambda x: -x[1])[:8],
    })


def _lista_sesion(request, clave):
    return list(request.session.get(clave, []))


def comparar(request):
    ids = request.GET.get("ids")
    if ids:
        lista = [s for s in ids.split(",") if s][:MAX_COMPARAR]
        request.session["comparar"] = lista
    else:
        lista = _lista_sesion(request, "comparar")
    por_slug = {m.slug: m for m in Mineral.objects.publicados().con_relaciones().filter(slug__in=lista)}
    sel = [por_slug[s] for s in lista if s in por_slug]
    filas = [
        ("Fórmula", lambda m: m.formula_unicode, True),
        ("Clase", lambda m: m.clase, False),
        ("Dureza (Mohs)", lambda m: m.dureza_texto, False),
        ("Densidad", lambda m: f"{m.densidad:g} g/cm³" if m.densidad else "—", False),
        ("Sistema cristalino", lambda m: m.sistema, False),
        ("Brillo", lambda m: m.brillo, False),
        ("Color", lambda m: m.color, False),
        ("Raya", lambda m: m.raya, False),
        ("Exfoliación", lambda m: m.exfoliacion or "—", False),
        ("Fractura", lambda m: m.fractura or "—", False),
        ("Magnético", lambda m: "Sí" if m.magnetico else "No", False),
        ("Burbujea con ácido", lambda m: "Sí" if m.efervescencia else "No", False),
        ("Fluorescencia", lambda m: "Puede ser" if m.fluorescencia else "No", False),
        ("Usos", lambda m: m.usos or "—", False),
    ]
    tabla = [{"etiqueta": e, "mono": mono, "valores": [fn(m) for m in sel]} for e, fn, mono in filas]
    for fila in tabla:
        fila["iguales"] = len(sel) > 1 and len(set(fila["valores"])) == 1
    sugeridos = [m for m in _minerales() if m.slug not in lista][:8]
    enlace = request.build_absolute_uri(request.path + "?ids=" + ",".join(m.slug for m in sel)) if sel else ""
    return render(request, "catalogo/comparar.html", {
        "sel": sel, "tabla": tabla, "sugeridos": sugeridos, "enlace": enlace, "max": MAX_COMPARAR,
        "dureza_barras": [{"m": m, "a": (m.dureza_min - 1) / 9 * 100, "b": (m.dureza_max - 1) / 9 * 100} for m in sel],
    })


def favoritos(request):
    lista = _lista_sesion(request, "favoritos")
    por_slug = {m.slug: m for m in Mineral.objects.publicados().con_relaciones().filter(slug__in=lista)}
    return render(request, "catalogo/favoritos.html", {"minerales": [por_slug[s] for s in lista if s in por_slug]})


def acerca(request):
    fotos = Fotografia.objects.select_related("mineral").defer("datos").filter(mineral__publicado=True).order_by("mineral__nombre")
    return render(request, "catalogo/acerca.html", {"fotos": fotos, "tecnologias": [
        ("Python + Django", "Servidor, plantillas HTML, panel de administración e historial"),
        ("SQL", "SQLite en local y PostgreSQL en producción, mediante el ORM de Django"),
        ("Pillow", "Compresión de fotos a WebP al subirlas"),
        ("Tailwind CSS", "Sistema de diseño con tema claro y oscuro"),
        ("Three.js", "Modelos 3D de las formas cristalinas"),
        ("Leaflet", "Mapa de yacimientos"),
    ]})


# ---------- Acciones (formularios POST) ----------

@require_POST
def alternar(request, clave, slug):
    if clave not in {"favoritos", "comparar"}:
        raise Http404
    get_object_or_404(Mineral.objects.publicados(), slug=slug)
    lista = _lista_sesion(request, clave)
    if slug in lista:
        lista.remove(slug)
    else:
        if clave == "comparar" and len(lista) >= MAX_COMPARAR:
            lista.pop(0)
        lista.append(slug)
    request.session[clave] = lista
    if request.headers.get("Accept") == "application/json":
        return JsonResponse({"activo": slug in lista, "total": len(lista)})
    return _volver(request)


@require_POST
def vaciar(request, clave):
    if clave in {"favoritos", "comparar"}:
        request.session[clave] = []
    return _volver(request)


# ---------- Archivos y API ----------

@cache_control(public=True, max_age=60 * 60 * 24 * 365, immutable=True)
def foto(request, slug):
    f = get_object_or_404(Fotografia.objects.select_related("mineral"), mineral__slug=slug)
    if not f.mineral.publicado and not request.user.is_superuser:
        raise Http404
    return HttpResponse(bytes(f.datos), content_type=f.tipo)


def api_minerales(request):
    datos = [mineral_a_dict(m, request) for m in _minerales()]
    return JsonResponse({"total": len(datos), "minerales": datos}, json_dumps_params={"ensure_ascii": False})


def api_mineral(request, slug):
    m = get_object_or_404(Mineral.objects.publicados().con_relaciones(), slug=slug)
    return JsonResponse(mineral_a_dict(m, request), json_dumps_params={"ensure_ascii": False})


def robots(request):
    lineas = ["User-agent: *", "Disallow: /admin/", f"Sitemap: {request.build_absolute_uri('/sitemap.xml')}"]
    return HttpResponse("\n".join(lineas) + "\n", content_type="text/plain")


def no_encontrado(request, exception=None):
    return render(request, "404.html", status=404)


