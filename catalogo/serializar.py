from django.urls import reverse

CAMPOS = [
    "nombre", "formula", "clase", "dureza_min", "dureza_max", "densidad", "sistema", "habito", "brillo",
    "color", "raya", "raya_grupo", "exfoliacion", "fractura", "magnetico", "efervescencia",
    "fluorescencia", "color_hex", "usos", "descripcion", "wikipedia",
]


def mineral_a_dict(m, request=None, con_foto_local=False) -> dict:
    d = {"id": m.slug, **{c: getattr(m, c) for c in CAMPOS}}
    d["elementos"] = m.elementos
    d["localidades"] = [
        {"nombre": l.nombre, "region": l.region, "lat": l.lat, "lon": l.lon} for l in m.localidades.all()
    ]
    if m.tiene_foto:
        f = m.foto
        if con_foto_local:
            src = f"img/{m.slug}.webp"
        else:
            src = m.foto_url
            if request is not None:
                src = request.build_absolute_uri(src)
        d["imagen"] = {"src": src, "autor": f.autor, "licencia": f.licencia, "licencia_url": f.licencia_url, "fuente": f.fuente}
    else:
        d["imagen"] = None
    if not con_foto_local:
        d["url"] = request.build_absolute_uri(m.get_absolute_url()) if request else m.get_absolute_url()
    return d
