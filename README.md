# 💎 Catálogo de Minerales

Aplicación web hecha con [Streamlit](https://streamlit.io) para explorar, comparar y administrar una colección de minerales.

## Funciones

- **Galería** en tarjetas con imagen, fórmula, dureza, sistema cristalino y brillo.
- **Búsqueda** por nombre, fórmula, color, usos o descripción.
- **Filtros** por sistema cristalino, brillo y rango de dureza (Mohs), con ordenamiento.
- **Ficha de detalle** con densidad, raya, color, usos y referencia en la escala de Mohs.
- **Comparador** de hasta 4 minerales lado a lado.
- **Estadísticas**: gráficas de dureza, sistemas cristalinos y dureza vs. densidad.
- **Exportar** el catálogo a CSV o JSON.
- **Administrar**: añadir, editar y eliminar minerales con subida de imágenes.

## Ejecutar en local

```bash
python -m venv .venv
source .venv/bin/activate      # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

## Estructura

```
├── app.py               # Aplicación
├── minerales.json       # Datos
├── img/                 # Imágenes (nombres en minúsculas)
├── requirements.txt
└── .streamlit/config.toml  # Tema visual
```

## Formato de cada mineral

```json
"Cuarzo": {
  "formula": "SiO₂",
  "dureza_min": 7.0,
  "dureza_max": 7.0,
  "sistema": "Trigonal",
  "color": "Incoloro, blanco, rosa",
  "brillo": "Vítreo",
  "raya": "Blanca",
  "densidad": 2.65,
  "usos": "Vidrio, electrónica",
  "descripcion": "...",
  "imagen": "img/cuarzo.jpg"
}
```

## Nota sobre el despliegue

En Streamlit Community Cloud el sistema de archivos es temporal: los minerales añadidos desde la app se pierden al reiniciarse. Para guardarlos de forma permanente conviene usar una base de datos (por ejemplo Supabase, Firebase o Google Sheets).
