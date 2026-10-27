// Mapa de yacimientos con Leaflet. Los puntos llegan como JSON desde la vista de Django.
(function () {
  const capas = {
    light: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    dark: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  };
  const escapar = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  document.querySelectorAll("[data-mapa]").forEach((el) => {
    const puntos = JSON.parse(document.getElementById(el.dataset.mapa).textContent);
    const mapa = L.map(el, { center: [20, -40], zoom: 2, minZoom: 2, worldCopyJump: true, scrollWheelZoom: false });
    const tema = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    let base = L.tileLayer(capas[tema()], { maxZoom: 16, attribution: "Mapa base &copy; Esri, HERE, Garmin, &copy; colaboradores de OpenStreetMap" }).addTo(mapa);
    document.addEventListener("tema", () => base.setUrl(capas[tema()]));

    const marcas = puntos.map((p) => {
      const html = `<div style="display:flex;gap:10px;align-items:center">${p.foto ? `<img src="${escapar(p.foto)}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:6px">` : ""}<div><strong>${p.url ? `<a href="${escapar(p.url)}">${escapar(p.titulo)}</a>` : escapar(p.titulo)}</strong><br><span style="opacity:.75">${escapar(p.texto)}</span></div></div>`;
      return L.circleMarker([p.lat, p.lon], { radius: 7, color: "rgba(0,0,0,.55)", weight: 1.2, fillColor: p.color, fillOpacity: 0.95 }).bindPopup(html).addTo(mapa);
    });
    if (marcas.length) {
      const g = L.featureGroup(marcas);
      mapa.fitBounds(g.getBounds().pad(0.25), { maxZoom: 6 });
    }
  });
})();
