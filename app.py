import json
import os
import streamlit as st

# Configuración inicial de la página
st.set_page_config(
    page_title="Catálogo de Minerales", page_icon="🪨", layout="wide"
)


# Funciones para cargar y guardar en el archivo JSON
def cargar_datos():
  if not os.path.exists("minerales.json"):
    # Si no existe, creamos un JSON inicial de respaldo
    datos_iniciales = {
        "Cuarzo": {
            "formula": "SiO₂",
            "dureza": "7",
            "sistema": "Trigonal",
            "descripcion": (
                "Uno de los minerales más abundantes en la corteza terrestre."
            ),
            "imagen": "img/cuarzo.jpg",
        },
        "Pirita": {
            "formula": "FeS₂",
            "dureza": "6 - 6.5",
            "sistema": "Cúbico",
            "descripcion": (
                "Famoso por su intenso brillo metálico dorado."
            ),
            "imagen": "img/pirita.jpg",
        },
    }
    with open("minerales.json", "w", encoding="utf-8") as f:
      json.dump(datos_iniciales, f, ensure_ascii=False, indent=4)

  with open("minerales.json", "r", encoding="utf-8") as f:
    return json.load(f)


def guardar_datos(datos):
  with open("minerales.json", "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False, indent=4)


# Cargar los minerales
minerales = cargar_datos()

st.title("🪨 Catálogo Interactivo y Gestor de Minerales")
st.write(
    "Explora la colección, filtra por sistema cristalino, busca términos o"
    " añade nuevos minerales."
)

# ==========================================
# BARRA LATERAL: BÚSQUEDA, FILTROS Y NUEVOS
# ==========================================
st.sidebar.header("🔍 Buscar y Filtrar")

# 1. Buscador de texto
busqueda = st.sidebar.text_input(
    "Buscar por nombre, fórmula o descripción:"
).lower()

# 2. Filtro por sistema cristalino
sistemas_disponibles = ["Todos"] + sorted(
    list(set([info["sistema"] for info in minerales.values()]))
)
filtro_sistema = st.sidebar.selectbox(
    "Filtrar por sistema cristalino:", sistemas_disponibles
)

# Filtrar los minerales según los criterios de la barra lateral
minerales_filtrados = {}
for nombre, info in minerales.items():
  coincide_texto = (
      busqueda in nombre.lower()
      or busqueda in info["formula"].lower()
      or busqueda in info["descripcion"].lower()
  )
  coincide_sistema = (
      filtro_sistema == "Todos" or info["sistema"] == filtro_sistema
  )

  if coincide_texto and coincide_sistema:
    minerales_filtrados[nombre] = info

st.sidebar.markdown("---")

# 3. Formulario para añadir un nuevo mineral con subida de imágenes
with st.sidebar.expander("➕ Añadir nuevo mineral"):
  with st.form("form_nuevo_mineral"):
    n_nombre = st.text_input("Nombre del mineral")
    n_formula = st.text_input("Fórmula química")
    n_dureza = st.text_input("Dureza (Ej: 7)")
    n_sistema = st.text_input("Sistema cristalino")
    n_desc = st.text_area("Descripción")

    # Widget para subir la imagen directamente
    n_img_file = st.file_uploader(
        "Sube la imagen del mineral", type=["jpg", "png", "jpeg"]
    )

    submit_button = st.form_submit_button(label="Guardar en la base de datos")

    if submit_button:
      if n_nombre and n_formula and n_img_file:
        if n_nombre in minerales:
          st.sidebar.warning("¡Este mineral ya existe!")
        else:
          # Guardar la imagen subida automáticamente en la carpeta 'img'
          os.makedirs("img", exist_ok=True)
          ruta_imagen = os.path.join("img", n_img_file.name)
          with open(ruta_imagen, "wb") as f:
            f.write(n_img_file.getbuffer())

          # Añadir al diccionario y guardar en el JSON
          minerales[n_nombre] = {
              "formula": n_formula,
              "dureza": n_dureza,
              "sistema": n_sistema,
              "descripcion": n_desc,
              "imagen": ruta_imagen,
          }
          guardar_datos(minerales)
          st.sidebar.success(f"¡'{n_nombre}' guardado con éxito!")
          st.rerun()
      else:
        st.sidebar.error(
            "El nombre, la fórmula y la imagen son obligatorios."
        )
# ==========================================
# INTERFAZ PRINCIPAL
# ==========================================
if not minerales_filtrados:
  st.warning(
      "No se encontraron minerales que coincidan con tu búsqueda o filtros."
  )
else:
  # Selector desplegable basado en los resultados filtrados
  seleccion = st.selectbox(
      "Selecciona un mineral:", list(minerales_filtrados.keys())
  )
  info = minerales_filtrados[seleccion]

  col1, col2 = st.columns([1, 1])

  with col1:
  # Comprobar si es un archivo de imagen válido antes de renderizarlo
    if os.path.isfile(info["imagen"]):
        st.image(info["imagen"], caption=seleccion, use_container_width=True)
    else:
      st.warning(
          f"⚠️ Imagen no encontrada en la ruta local: `{info['imagen']}`.\n\n"
          "Asegúrate de colocar la imagen en esa ruta dentro de tu proyecto."
      )

  with col2:
    st.header(seleccion)
    st.markdown(f"**Fórmula química:** `{info['formula']}`")
    st.markdown(f"**Dureza (Escala de Mohs):** {info['dureza']}")
    st.markdown(f"**Sistema cristalino:** {info['sistema']}")
    st.markdown(f"**Descripción:**")
    st.info(info["descripcion"])