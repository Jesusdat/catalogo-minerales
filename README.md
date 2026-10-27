# Gabinete Mineral

Catálogo interactivo de minerales: fichas con propiedades físicas y químicas, cristales en 3D, mapa de yacimientos, tabla periódica, identificador por propiedades y un panel de administración que solo puede usar el dueño del repositorio.

**Sitio:** https://jesusdat.github.io/catalogo-minerales/

## Funciones

- **Catálogo** con búsqueda por nombre, fórmula, color, uso o localidad; filtros por clase química, sistema cristalino, brillo y dureza. Los filtros viven en la URL, así que se pueden compartir. Vista de cuadrícula o lista, y exportación a CSV o JSON.
- **Ficha por mineral** con dirección propia (`#/minerales/fluorita`), foto con créditos, escala de Mohs, propiedades, usos, yacimientos en el mapa y minerales relacionados.
- **Visor 3D** del hábito cristalino (cubo, octaedro, prisma hexagonal, romboedro, dodecaedro, etc.) con Three.js; se puede girar con el ratón o el dedo.
- **Identificador**: preguntas caseras (brillo, prueba de la uña/moneda/navaja/vidrio, color de la raya, imán, ácido, peso) que ordenan los candidatos.
- **Tabla periódica** con los elementos presentes en la colección; al tocar uno se filtran los minerales que lo contienen.
- **Mapa de yacimientos** con Leaflet, filtrable por clase y por México.
- **Comparador** de hasta 4 minerales lado a lado, con enlace compartible.
- **Favoritos** guardados en el navegador.
- **Tema claro y oscuro**, diseño adaptable a móvil e impresión de fichas.
- **Panel de administración** (`#/admin`) para agregar, editar y borrar minerales, subir fotos (se comprimen a WebP en el navegador) y ver el historial de cambios.

## Tecnologías

React 18 + TypeScript · Vite · Tailwind CSS · Three.js · Leaflet · Vitest · GitHub Actions · GitHub Pages.

## Ejecutar en local

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm test           # pruebas unitarias
npm run build      # compila a dist/
```

## Cómo funciona la edición "solo para mí"

El sitio es estático: no hay servidor ni base de datos. Los datos están en `public/data/minerales.json` y las fotos en `public/img/`.

1. Crea un token en GitHub → Settings → Developer settings → [Fine-grained tokens](https://github.com/settings/personal-access-tokens/new).
2. En **Repository access** elige *Only select repositories* → `catalogo-minerales`.
3. En **Permissions → Repository permissions → Contents** elige **Read and write**. No hace falta nada más.
4. Abre `#/admin` en el sitio y pega el token.

El panel comprueba que el token pertenezca a `Jesusdat` y que tenga permiso de escritura; con cualquier otra cuenta se rechaza, y de todos modos GitHub no permitiría escribir. Cada vez que guardas, el navegador crea **un solo commit** con el JSON y las imágenes, y GitHub Actions vuelve a publicar el sitio en uno o dos minutos. Por eso el historial del panel es el mismo historial de Git: cualquier cambio se puede revertir.

El token solo se envía a `api.github.com`. Se guarda en memoria y, si marcas "Recordar en este navegador", en `localStorage`. Úsalo solo en equipos de confianza y dale fecha de vencimiento.

## Formato de datos

Cada mineral en `public/data/minerales.json`:

```json
{
  "id": "fluorita",
  "nombre": "Fluorita",
  "formula": "CaF2",
  "clase": "Haluros",
  "dureza_min": 4, "dureza_max": 4,
  "densidad": 3.18,
  "sistema": "Cúbico",
  "habito": "octaedro",
  "brillo": "Vítreo",
  "color": "Violeta, verde, azul…",
  "raya": "Blanca", "raya_grupo": "blanca",
  "exfoliacion": "Perfecta octaédrica", "fractura": "Concoidea",
  "magnetico": false, "efervescencia": false, "fluorescencia": true,
  "color_hex": "#7C5BA6",
  "usos": "…", "descripcion": "…",
  "localidades": [{ "nombre": "Múzquiz", "region": "Coahuila, México", "lat": 27.87, "lon": -101.51 }],
  "imagen": { "src": "img/fluorita.webp", "autor": "…", "licencia": "CC BY-SA 3.0", "licencia_url": "…", "fuente": "…" },
  "wikipedia": "https://es.wikipedia.org/wiki/Fluorita"
}
```

## Estructura

```
public/data/minerales.json   datos del catálogo
public/img/                  fotografías (WebP)
src/lib/                     lógica: fórmulas, elementos, identificador, cliente de GitHub
src/components/              interfaz compartida, visor 3D, mapa, tabla periódica
src/pages/                   páginas del sitio
streamlit/                   versión original en Streamlit (se conserva)
.github/workflows/           verificación y publicación automática
```

## Créditos

Las fotografías provienen de Wikimedia Commons bajo licencias Creative Commons; el autor y la licencia aparecen en cada ficha y en la página "Acerca". Mapa base © Esri y colaboradores de OpenStreetMap.
