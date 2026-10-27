# Gabinete Mineral

Catálogo interactivo de minerales hecho en **Python con Django**. Los datos y las fotos se guardan en una base de datos **SQL** (SQLite en local, PostgreSQL en producción), las páginas se generan en el servidor con plantillas HTML, y la edición se hace desde un panel de administración que solo puede usar el dueño.

## Funciones

- **Catálogo** con búsqueda por nombre, fórmula, color, uso o localidad. Filtros por clase química, sistema cristalino, brillo, dureza, elemento y yacimientos en México. Todos los filtros quedan en la URL, así que se pueden compartir. Vista de cuadrícula o de lista, paginación y exportación a **CSV** o **JSON**.
- **Ficha por mineral** (`/minerales/fluorita/`) con foto y créditos, escala de Mohs, propiedades, usos, yacimientos en el mapa, minerales relacionados y navegación anterior/siguiente.
- **Visor 3D** de la forma cristalina con Three.js (cubo, octaedro, prismas, romboedro, dodecaedro…). Los vértices se calculan en Python (`catalogo/ciencia/cristal.py`).
- **Identificador**: preguntas caseras (brillo, uña/moneda/navaja/vidrio, raya, imán, ácido, peso). El cálculo se hace en el servidor y funciona aunque JavaScript esté apagado.
- **Tabla periódica** de los 118 elementos, con los que aparecen en la colección resaltados.
- **Mapa de yacimientos** con Leaflet, filtrable por clase química y por México.
- **Comparador** de hasta 4 minerales y **favoritos**, guardados en la sesión del servidor. El comparador tiene un enlace compartible (`/comparar/?ids=pirita,galena`).
- **Mineral del día** y **escala de Mohs** interactiva en la portada.
- **API JSON** de solo lectura: `/api/minerales/` y `/api/minerales/<id>/`.
- Tema claro y oscuro, diseño adaptable a móvil, `sitemap.xml`, `robots.txt` y páginas 404/500 propias.

## Tecnologías

| Capa | Herramienta |
|---|---|
| Servidor y lógica | Python 3.12 · Django 5.2 |
| Base de datos | SQL vía ORM de Django: SQLite (local) y PostgreSQL (producción) |
| Imágenes | Pillow: las fotos se convierten a WebP y se guardan en la base de datos |
| Plantillas | HTML de Django + Tailwind CSS (ya compilado en `static/`) |
| Interactividad | JavaScript ligero sin framework: Three.js y Leaflet |
| Producción | Gunicorn · WhiteNoise · GitHub Actions |

## Estructura

```
gabinete/             Configuración de Django (settings, urls, wsgi)
catalogo/
  models.py           Mineral, Localidad y Fotografia (tablas SQL)
  views.py            Páginas, filtros, exportación, sesión y API
  admin.py            Panel privado: edición, fotos, acciones e historial
  ciencia/            Lógica en Python puro: fórmulas, tabla periódica,
                      identificador y geometría de cristales
  management/commands cargar_catalogo, exportar_catalogo, crear_admin
  templates/          Plantillas HTML
  static/             CSS compilado, JS, Three.js y Leaflet
  tests/              Pruebas
datos/                Datos semilla (minerales.json) y fotos iniciales
tailwind/             Fuente del CSS
streamlit/            Primera versión de la app (Streamlit)
```

## Ejecutar en local

```bash
python -m venv .venv
source .venv/bin/activate          # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate           # crea las tablas en data.db
python manage.py cargar_catalogo   # carga los 27 minerales y sus fotos
python manage.py createsuperuser   # tu cuenta para el panel
python manage.py runserver
```

- Sitio: http://localhost:8000
- Panel: http://localhost:8000/admin/

Pruebas:

```bash
python manage.py test
```

## Edición "solo para mí"

La edición se hace en el panel de administración de Django, con estas protecciones:

- **Solo entra un superusuario.** Una cuenta de personal (`is_staff`) que no sea superusuario no puede entrar.
- **La cuenta se define con variables de entorno:** `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL` y `DJANGO_SUPERUSER_PASSWORD`. En cada despliegue, `python manage.py crear_admin` crea o actualiza esa cuenta y les quita el acceso a todas las demás.
- **Ruta privada opcional.** Con `DJANGO_ADMIN_URL=mi-panel-secreto/`, el panel deja de estar en `/admin/`.
- **Seguridad en producción.** Con `DJANGO_DEBUG=false` las cookies van solo por HTTPS, se activa HSTS y hay protección CSRF.

Desde el panel puedes:

- Agregar, editar, ocultar o borrar minerales.
- Subir la foto. Se reduce a 1400 px como máximo, se convierte a WebP y se guarda en la base de datos junto con sus créditos.
- Editar las localidades con coordenadas.
- Usar acciones en lote: publicar, ocultar, duplicar o exportar a JSON.
- Ver el **historial de cambios**: quién cambió qué y cuándo.

Un mineral sin publicar solo lo ves tú.

### Respaldo

```bash
python manage.py exportar_catalogo            # escribe datos/minerales.json y datos/img/*.webp
python manage.py cargar_catalogo --actualizar # vuelve a cargar desde esos archivos
```

`cargar_catalogo` no hace nada si ya hay minerales, así que se puede ejecutar en cada arranque sin borrar tus cambios.

## Publicarlo en internet

Django necesita un servidor que ejecute Python, así que no funciona en GitHub Pages. Hay dos opciones gratuitas.

### Opción 1: Render + Neon (recomendada)

1. Crea una base de datos PostgreSQL gratuita en [Neon](https://neon.tech) o [Supabase](https://supabase.com) y copia la cadena de conexión (`postgresql://…`).
2. En [Render](https://render.com) elige **New → Blueprint** y selecciona este repositorio. Render lee `render.yaml`.
3. Llena las variables que pide:
   - `DATABASE_URL`
   - `DJANGO_SUPERUSER_USERNAME`
   - `DJANGO_SUPERUSER_EMAIL`
   - `DJANGO_SUPERUSER_PASSWORD`
   - `DJANGO_ADMIN_URL` (opcional)

   `DJANGO_SECRET_KEY` se genera solo.
4. Al arrancar, Render aplica las migraciones, carga el catálogo si la base está vacía y crea tu cuenta.

Notas:

- La base de datos de Render también sirve, pero en el plan gratuito caduca, por eso conviene más Neon o Supabase.
- El plan gratuito de Render "se duerme" tras un rato sin visitas, y la primera carga después de eso tarda unos segundos.

### Opción 2: PythonAnywhere

1. Clona el repositorio en una consola Bash.
2. Crea un virtualenv y ejecuta `pip install -r requirements.txt`.
3. Configura la app web como "Manual configuration" apuntando a `gabinete/wsgi.py`.
4. Mapea `/static/` a la carpeta `staticfiles/`.
5. Ejecuta los comandos de "Ejecutar en local" junto con `collectstatic`.

Con SQLite no hace falta una base externa.

### Variables de entorno

Consulta [.env.example](.env.example).

| Variable | Para qué sirve |
|---|---|
| `DJANGO_DEBUG` | `false` en producción |
| `DJANGO_SECRET_KEY` | Clave larga y aleatoria |
| `DJANGO_ALLOWED_HOSTS` | Dominios permitidos, separados por comas. En Render se detecta solo. |
| `DATABASE_URL` | PostgreSQL. Si no se define, se usa SQLite (`data.db`). |
| `DJANGO_SUPERUSER_*` | Tu cuenta de administración |
| `DJANGO_ADMIN_URL` | Ruta del panel (por defecto `admin/`) |

## Cambiar el diseño

El CSS ya compilado está en `catalogo/static/catalogo/css/app.css`. Si cambias clases en las plantillas, vuelve a compilarlo:

```bash
pip install -r requirements-dev.txt
tailwindcss -c tailwind/tailwind.config.js -i tailwind/entrada.css -o catalogo/static/catalogo/css/app.css --minify
```

## Créditos

Las fotografías provienen de Wikimedia Commons bajo licencias Creative Commons. El autor y la licencia de cada una aparecen en su ficha y en `/acerca/`. Las fotos de cuarzo, calcita, pirita y magnesita vienen de la primera versión del proyecto.

Iconos: [Lucide](https://lucide.dev) (ISC). Mapa base: © Esri y colaboradores de OpenStreetMap.
