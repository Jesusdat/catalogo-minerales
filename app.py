"""Catálogo interactivo de minerales con Streamlit."""

import base64
import json
import re
import unicodedata
from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st

BASE_DIR = Path(__file__).parent
DATA_FILE = BASE_DIR / "minerales.json"
IMG_DIR = BASE_DIR / "img"

SISTEMAS = [
    "Cúbico", "Tetragonal", "Hexagonal", "Trigonal",
    "Ortorrómbico", "Monoclínico", "Triclínico", "Amorfo",
]
BRILLOS = [
    "Metálico", "Submetálico", "Vítreo", "Nacarado", "Sedoso",
    "Graso", "Resinoso", "Adamantino", "Terroso", "Mate",
]
ESCALA_MOHS = {
    1: "Talco", 2: "Yeso", 3: "Calcita", 4: "Fluorita", 5: "Apatito",
    6: "Ortoclasa", 7: "Cuarzo", 8: "Topacio", 9: "Corindón", 10: "Diamante",
}
SUBINDICES = str.maketrans("0123456789", "₀₁₂₃₄₅₆₇₈₉")

st.set_page_config(page_title="Catálogo de Minerales", page_icon="💎", layout="wide")

# ------------------------------------------------------------------
# Estilos
# ------------------------------------------------------------------
st.markdown(
    """
    <style>
    .block-container {padding-top: 2rem;}
    .hero {
        padding: 1.6rem 2rem; border-radius: 18px; margin-bottom: 1.2rem;
        background: linear-gradient(135deg, #2b2f3a 0%, #1a1c22 60%, #3a2f12 100%);
        border: 1px solid #3a3d46;
    }
    .hero h1 {margin: 0; font-size: 2.2rem;}
    .hero p {margin: .3rem 0 0; color: #b9b6ad;}
    .card {
        background: #1E2128; border: 1px solid #2f333c; border-radius: 16px;
        overflow: hidden; transition: transform .15s ease, border-color .15s ease;
        margin-bottom: .4rem;
    }
    .card:hover {transform: translateY(-3px); border-color: #C9A227;}
    .card img {width: 100%; height: 190px; object-fit: cover; display: block;}
    .card .noimg {height: 190px; display:flex; align-items:center;
                  justify-content:center; font-size:3rem; background:#262a33;}
    .card .body {padding: .8rem 1rem 1rem;}
    .card h3 {margin: 0 0 .2rem; font-size: 1.15rem;}
    .card code {color: #C9A227; background: transparent; font-size: 1rem;}
    .chip {display:inline-block; padding: 2px 10px; margin: 4px 4px 0 0;
           border-radius: 999px; font-size: .75rem; background:#2b2f3a; color:#d6d3cb;}
    .chip.gold {background:#3a2f12; color:#f0d77a;}
    .mohs-bar {height: 10px; border-radius: 6px; background:#2b2f3a; margin-top:.4rem;}
    .mohs-fill {height: 10px; border-radius: 6px;
                background: linear-gradient(90deg,#6aa84f,#C9A227,#cc4125);}
    </style>
    """,
    unsafe_allow_html=True,
)

# ------------------------------------------------------------------
# Datos
# ------------------------------------------------------------------
def _num(valor, defecto=None):
    """Convierte '3,5' o '6 - 6.5' en número (toma el primero)."""
    if isinstance(valor, (int, float)):
        return float(valor)
    encontrados = re.findall(r"\d+(?:[.,]\d+)?", str(valor or ""))
    return float(encontrados[0].replace(",", ".")) if encontrados else defecto


def normalizar(info: dict) -> dict:
    """Asegura que cada mineral tenga todos los campos (compatibilidad con el JSON viejo)."""
    if "dureza" in info and "dureza_min" not in info:
        nums = re.findall(r"\d+(?:[.,]\d+)?", str(info["dureza"]))
        nums = [float(n.replace(",", ".")) for n in nums] or [0.0]
        info["dureza_min"], info["dureza_max"] = min(nums), max(nums)
    info.pop("dureza", None)
    for campo in ("formula", "sistema", "color", "brillo", "raya", "usos", "descripcion", "imagen"):
        info.setdefault(campo, "")
    info["imagen"] = str(info["imagen"]).replace("\\", "/")
    info["dureza_min"] = _num(info.get("dureza_min"), 0.0)
    info["dureza_max"] = _num(info.get("dureza_max"), info["dureza_min"])
    info["densidad"] = _num(info.get("densidad"))
    return info


@st.cache_data
def cargar_datos(_mtime: float) -> dict:
    if not DATA_FILE.exists():
        return {}
    with open(DATA_FILE, encoding="utf-8") as f:
        datos = json.load(f)
    return {nombre.strip().capitalize(): normalizar(info) for nombre, info in datos.items()}


def guardar_datos(datos: dict) -> None:
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=4)
    cargar_datos.clear()


def ruta_imagen(ruta: str) -> Path | None:
    """Busca la imagen sin importar mayúsculas/minúsculas (Linux distingue)."""
    if not ruta:
        return None
    p = BASE_DIR / ruta
    if p.is_file():
        return p
    if p.parent.is_dir():
        for f in p.parent.iterdir():
            if f.name.lower() == p.name.lower():
                return f
    return None


@st.cache_data
def imagen_b64(ruta: str) -> str | None:
    p = ruta_imagen(ruta)
    if not p:
        return None
    mime = "png" if p.suffix.lower() == ".png" else "jpeg"
    return f"data:image/{mime};base64,{base64.b64encode(p.read_bytes()).decode()}"


def nombre_archivo_seguro(nombre: str, extension: str) -> str:
    base = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode()
    base = re.sub(r"[^a-zA-Z0-9]+", "_", base).strip("_").lower() or "mineral"
    return f"{base}{extension.lower()}"


def formula_bonita(formula: str) -> str:
    return formula.translate(SUBINDICES)


def texto_dureza(info: dict) -> str:
    a, b = info["dureza_min"], info["dureza_max"]
    return f"{a:g}" if a == b else f"{a:g} – {b:g}"


minerales = cargar_datos(DATA_FILE.stat().st_mtime if DATA_FILE.exists() else 0)

# ------------------------------------------------------------------
# Barra lateral: filtros
# ------------------------------------------------------------------
st.sidebar.title("🔍 Buscar y filtrar")
busqueda = st.sidebar.text_input("Buscar", placeholder="Nombre, fórmula, color, uso...").lower().strip()

sistemas_en_datos = sorted({m["sistema"] for m in minerales.values() if m["sistema"]})
filtro_sistemas = st.sidebar.multiselect("Sistema cristalino", sistemas_en_datos, placeholder="Todos")

brillos_en_datos = sorted({m["brillo"] for m in minerales.values() if m["brillo"]})
filtro_brillos = st.sidebar.multiselect("Brillo", brillos_en_datos, placeholder="Todos")

rango_dureza = st.sidebar.slider("Dureza (Mohs)", 1.0, 10.0, (1.0, 10.0), step=0.5)

orden = st.sidebar.selectbox(
    "Ordenar por", ["Nombre (A-Z)", "Nombre (Z-A)", "Dureza ↑", "Dureza ↓", "Densidad ↑", "Densidad ↓"]
)


def coincide(nombre: str, m: dict) -> bool:
    if busqueda:
        texto = " ".join([nombre, m["formula"], formula_bonita(m["formula"]), m["color"],
                          m["usos"], m["descripcion"], m["brillo"]]).lower()
        if busqueda not in texto:
            return False
    if filtro_sistemas and m["sistema"] not in filtro_sistemas:
        return False
    if filtro_brillos and m["brillo"] not in filtro_brillos:
        return False
    return m["dureza_max"] >= rango_dureza[0] and m["dureza_min"] <= rango_dureza[1]


filtrados = {n: m for n, m in minerales.items() if coincide(n, m)}
claves_orden = {
    "Nombre (A-Z)": (lambda kv: kv[0].lower(), False),
    "Nombre (Z-A)": (lambda kv: kv[0].lower(), True),
    "Dureza ↑": (lambda kv: kv[1]["dureza_min"], False),
    "Dureza ↓": (lambda kv: kv[1]["dureza_max"], True),
    "Densidad ↑": (lambda kv: kv[1]["densidad"] or 0, False),
    "Densidad ↓": (lambda kv: kv[1]["densidad"] or 0, True),
}
clave, inverso = claves_orden[orden]
filtrados = dict(sorted(filtrados.items(), key=clave, reverse=inverso))

st.sidebar.markdown("---")
st.sidebar.caption(f"Mostrando **{len(filtrados)}** de **{len(minerales)}** minerales")

# ------------------------------------------------------------------
# Encabezado y métricas
# ------------------------------------------------------------------
st.markdown(
    """<div class="hero"><h1>💎 Catálogo de Minerales</h1>
    <p>Explora, compara y administra tu colección mineralógica.</p></div>""",
    unsafe_allow_html=True,
)

c1, c2, c3, c4 = st.columns(4)
c1.metric("Minerales", len(minerales))
c2.metric("Sistemas cristalinos", len(sistemas_en_datos))
if minerales:
    mas_duro = max(minerales, key=lambda n: minerales[n]["dureza_max"])
    mas_denso = max(minerales, key=lambda n: minerales[n]["densidad"] or 0)
    c3.metric("Más duro", mas_duro, texto_dureza(minerales[mas_duro]) + " Mohs", delta_color="off", delta_arrow="off")
    c4.metric("Más denso", mas_denso, f"{minerales[mas_denso]['densidad'] or '—'} g/cm³", delta_color="off", delta_arrow="off")

tab_galeria, tab_detalle, tab_comparar, tab_stats, tab_admin = st.tabs(
    ["🖼️ Galería", "🔎 Detalle", "⚖️ Comparar", "📊 Estadísticas", "🛠️ Administrar"]
)

# ------------------------------------------------------------------
# Galería
# ------------------------------------------------------------------
with tab_galeria:
    if not filtrados:
        st.warning("No se encontraron minerales con esos filtros.")
    else:
        columnas = st.columns(3)
        for i, (nombre, m) in enumerate(filtrados.items()):
            src = imagen_b64(m["imagen"])
            img_html = f'<img src="{src}" alt="{nombre}">' if src else '<div class="noimg">🪨</div>'
            pct = m["dureza_max"] * 10
            with columnas[i % 3]:
                st.markdown(
                    f"""<div class="card">{img_html}<div class="body">
                    <h3>{nombre}</h3><code>{formula_bonita(m['formula'])}</code><br>
                    <span class="chip gold">Mohs {texto_dureza(m)}</span>
                    <span class="chip">{m['sistema'] or '—'}</span>
                    <span class="chip">{m['brillo'] or '—'}</span>
                    <div class="mohs-bar"><div class="mohs-fill" style="width:{pct}%"></div></div>
                    </div></div>""",
                    unsafe_allow_html=True,
                )

# ------------------------------------------------------------------
# Detalle
# ------------------------------------------------------------------
with tab_detalle:
    if not filtrados:
        st.info("Ajusta los filtros para ver minerales.")
    else:
        seleccion = st.selectbox("Selecciona un mineral", list(filtrados))
        m = filtrados[seleccion]
        col_img, col_info = st.columns([1, 1.2], gap="large")
        with col_img:
            p = ruta_imagen(m["imagen"])
            if p:
                st.image(str(p), caption=seleccion, width="stretch")
            else:
                st.warning(f"Imagen no encontrada: `{m['imagen']}`")
        with col_info:
            st.header(seleccion)
            st.markdown(f"### `{formula_bonita(m['formula'])}`")
            a, b, c = st.columns(3)
            a.metric("Dureza (Mohs)", texto_dureza(m))
            b.metric("Densidad", f"{m['densidad']:g} g/cm³" if m["densidad"] else "—")
            c.metric("Sistema", m["sistema"] or "—")
            st.markdown(
                f"""
| Propiedad | Valor |
|---|---|
| Color | {m['color'] or '—'} |
| Brillo | {m['brillo'] or '—'} |
| Raya | {m['raya'] or '—'} |
| Usos | {m['usos'] or '—'} |
"""
            )
            ref = ESCALA_MOHS.get(round(m["dureza_max"]))
            if ref:
                st.caption(f"Dureza comparable a: **{ref}** ({round(m['dureza_max'])} en la escala de Mohs)")
            st.info(m["descripcion"] or "Sin descripción.")

# ------------------------------------------------------------------
# Comparar
# ------------------------------------------------------------------
with tab_comparar:
    elegidos = st.multiselect("Elige 2 o más minerales para comparar", list(minerales),
                              default=list(minerales)[:2], max_selections=4,
                              placeholder="Elige minerales")
    if len(elegidos) >= 2:
        cols = st.columns(len(elegidos))
        for col, nombre in zip(cols, elegidos):
            m = minerales[nombre]
            with col:
                p = ruta_imagen(m["imagen"])
                if p:
                    st.image(str(p), width="stretch")
                st.subheader(nombre)
        tabla = pd.DataFrame({
            n: {
                "Fórmula": formula_bonita(minerales[n]["formula"]),
                "Dureza": texto_dureza(minerales[n]),
                "Densidad (g/cm³)": f'{minerales[n]["densidad"]:g}' if minerales[n]["densidad"] else "—",
                "Sistema": minerales[n]["sistema"],
                "Brillo": minerales[n]["brillo"],
                "Color": minerales[n]["color"],
                "Raya": minerales[n]["raya"],
            } for n in elegidos
        })
        st.dataframe(tabla, width="stretch")
    else:
        st.info("Selecciona al menos dos minerales.")

# ------------------------------------------------------------------
# Estadísticas
# ------------------------------------------------------------------
with tab_stats:
    if not minerales:
        st.info("No hay datos todavía.")
    else:
        df = pd.DataFrame([
            {"Mineral": n, "Dureza": m["dureza_max"], "Densidad": m["densidad"],
             "Sistema": m["sistema"] or "Sin dato", "Brillo": m["brillo"] or "Sin dato"}
            for n, m in minerales.items()
        ])
        g1, g2 = st.columns(2)
        with g1:
            fig = px.bar(df.sort_values("Dureza"), x="Dureza", y="Mineral", orientation="h",
                         color="Dureza", color_continuous_scale="YlOrRd", range_x=[0, 10],
                         title="Dureza en la escala de Mohs")
            st.plotly_chart(fig, width="stretch")
        with g2:
            fig = px.pie(df, names="Sistema", hole=.45, title="Sistemas cristalinos")
            st.plotly_chart(fig, width="stretch")
        dfd = df.dropna(subset=["Densidad"])
        if not dfd.empty:
            fig = px.scatter(dfd, x="Dureza", y="Densidad", text="Mineral", color="Brillo",
                             size=[14] * len(dfd), title="Dureza vs. densidad")
            fig.update_traces(textposition="top center")
            st.plotly_chart(fig, width="stretch")

        st.subheader("Exportar")
        e1, e2 = st.columns(2)
        e1.download_button("⬇️ Descargar CSV", df.to_csv(index=False).encode("utf-8"),
                           "minerales.csv", "text/csv", width="stretch")
        e2.download_button("⬇️ Descargar JSON",
                           json.dumps(minerales, ensure_ascii=False, indent=4).encode("utf-8"),
                           "minerales.json", "application/json", width="stretch")

# ------------------------------------------------------------------
# Administrar: añadir, editar, eliminar
# ------------------------------------------------------------------
def formulario(prefijo: str, base: dict | None = None):
    base = base or {}
    c1, c2 = st.columns(2)
    with c1:
        nombre = st.text_input("Nombre *", base.get("_nombre", ""), key=f"{prefijo}_nombre")
        formula = st.text_input("Fórmula química *", base.get("formula", ""),
                                help="Puedes escribir SiO2; se mostrará como SiO₂", key=f"{prefijo}_formula")
        sistema_idx = SISTEMAS.index(base["sistema"]) if base.get("sistema") in SISTEMAS else 0
        sistema = st.selectbox("Sistema cristalino", SISTEMAS, index=sistema_idx, key=f"{prefijo}_sis")
        brillo_idx = BRILLOS.index(base["brillo"]) if base.get("brillo") in BRILLOS else 0
        brillo = st.selectbox("Brillo", BRILLOS, index=brillo_idx, key=f"{prefijo}_brillo")
        dureza = st.slider("Dureza (Mohs)", 1.0, 10.0,
                           (float(base.get("dureza_min", 5.0)), float(base.get("dureza_max", 5.0))),
                           step=0.5, key=f"{prefijo}_dureza")
    with c2:
        densidad = st.number_input("Densidad (g/cm³)", 0.0, 25.0,
                                   float(base.get("densidad") or 0.0), step=0.01, key=f"{prefijo}_dens")
        color = st.text_input("Color", base.get("color", ""), key=f"{prefijo}_color")
        raya = st.text_input("Raya", base.get("raya", ""), key=f"{prefijo}_raya")
        usos = st.text_input("Usos", base.get("usos", ""), key=f"{prefijo}_usos")
        imagen = st.file_uploader("Imagen" + (" (opcional, reemplaza la actual)" if base else " *"),
                                  type=["jpg", "jpeg", "png", "webp"], key=f"{prefijo}_img")
    descripcion = st.text_area("Descripción", base.get("descripcion", ""), key=f"{prefijo}_desc")
    datos = {
        "formula": formula_bonita(formula.strip()), "dureza_min": dureza[0], "dureza_max": dureza[1],
        "sistema": sistema, "color": color.strip(), "brillo": brillo, "raya": raya.strip(),
        "densidad": densidad or None, "usos": usos.strip(), "descripcion": descripcion.strip(),
    }
    return nombre.strip().capitalize(), datos, imagen


def guardar_imagen(nombre: str, archivo) -> str:
    IMG_DIR.mkdir(exist_ok=True)
    destino = IMG_DIR / nombre_archivo_seguro(nombre, Path(archivo.name).suffix)
    destino.write_bytes(archivo.getbuffer())
    imagen_b64.clear()
    return destino.relative_to(BASE_DIR).as_posix()


with tab_admin:
    st.caption("⚠️ En Streamlit Community Cloud los cambios se pierden al reiniciar la app. "
               "Para guardarlos de forma permanente usa una base de datos (ver README).")
    accion = st.radio("Acción", ["➕ Añadir", "✏️ Editar", "🗑️ Eliminar"], horizontal=True)

    if accion == "➕ Añadir":
        with st.form("form_nuevo", clear_on_submit=True):
            nombre, datos, imagen = formulario("nuevo")
            if st.form_submit_button("Guardar mineral", type="primary"):
                if not (nombre and datos["formula"] and imagen):
                    st.error("Nombre, fórmula e imagen son obligatorios.")
                elif nombre in minerales:
                    st.warning(f"'{nombre}' ya existe. Usa la opción Editar.")
                else:
                    datos["imagen"] = guardar_imagen(nombre, imagen)
                    minerales[nombre] = datos
                    guardar_datos(minerales)
                    st.toast(f"'{nombre}' guardado", icon="✅")
                    st.rerun()

    elif accion == "✏️ Editar" and minerales:
        original = st.selectbox("Mineral a editar", list(minerales))
        with st.form("form_editar"):
            nombre, datos, imagen = formulario(f"edit_{original}", {"_nombre": original, **minerales[original]})
            if st.form_submit_button("Guardar cambios", type="primary"):
                if not (nombre and datos["formula"]):
                    st.error("Nombre y fórmula son obligatorios.")
                elif nombre != original and nombre in minerales:
                    st.warning(f"Ya existe un mineral llamado '{nombre}'.")
                else:
                    datos["imagen"] = guardar_imagen(nombre, imagen) if imagen else minerales[original]["imagen"]
                    minerales.pop(original)
                    minerales[nombre] = datos
                    guardar_datos(minerales)
                    st.toast("Cambios guardados", icon="✅")
                    st.rerun()

    elif accion == "🗑️ Eliminar" and minerales:
        objetivo = st.selectbox("Mineral a eliminar", list(minerales))
        confirmar = st.checkbox(f"Confirmo que quiero eliminar '{objetivo}'")
        if st.button("Eliminar", type="primary", disabled=not confirmar):
            minerales.pop(objetivo)
            guardar_datos(minerales)
            st.toast(f"'{objetivo}' eliminado", icon="🗑️")
            st.rerun()
