// Visor 3D: los vértices llegan calculados desde Python (catalogo/ciencia/cristal.py).
import * as THREE from "../vendor/three.min.js";

function montar(el) {
  const datos = JSON.parse(document.getElementById(el.dataset.cristal).textContent);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    el.innerHTML = '<p class="flex h-full items-center justify-center text-sm text-muted">Tu navegador no admite gráficos 3D.</p>';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  el.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camara.position.set(3.4, 2.2, 4.6);

  const geo = new THREE.ConvexGeometry(datos.vertices.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  geo.computeVertexNormals();
  const base = new THREE.Color(datos.color);
  const met = datos.metalico;
  const mat = new THREE.MeshPhysicalMaterial({
    color: base, metalness: met ? 0.85 : 0.05, roughness: met ? 0.28 : 0.12, clearcoat: met ? 0.2 : 0.8,
    transparent: !met, opacity: met ? 1 : 0.88, flatShading: true, side: THREE.DoubleSide,
  });
  const aristas = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, 12),
    new THREE.LineBasicMaterial({ color: base.clone().offsetHSL(0, -0.1, met ? 0.25 : 0.3), transparent: true, opacity: 0.9 }),
  );
  const grupo = new THREE.Group();
  grupo.add(new THREE.Mesh(geo, mat), aristas);
  escena.add(grupo);
  escena.add(new THREE.HemisphereLight(0xffffff, 0x404040, 1.6));
  const d1 = new THREE.DirectionalLight(0xffffff, 2.4); d1.position.set(4, 6, 5);
  const d2 = new THREE.DirectionalLight(0xfff2e0, 1.1); d2.position.set(-5, -2, -4);
  escena.add(d1, d2);

  const controles = new THREE.OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.enablePan = false;
  controles.enableZoom = false;
  controles.autoRotate = datos.autorotar && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  controles.autoRotateSpeed = 1.6;
  // En la portada el visor está dentro de un enlace: arrastrar no debe navegar
  let arrastrado = false;
  renderer.domElement.addEventListener("pointerdown", () => (arrastrado = false));
  controles.addEventListener("change", () => (arrastrado = true));
  el.closest("a")?.addEventListener("click", (e) => { if (arrastrado) e.preventDefault(); });

  const ajustar = () => {
    const { width, height } = el.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camara.aspect = width / height;
    camara.updateProjectionMatrix();
  };
  new ResizeObserver(ajustar).observe(el);
  ajustar();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(el);
  (function bucle() {
    requestAnimationFrame(bucle);
    if (!visible) return;
    controles.update();
    renderer.render(escena, camara);
  })();
}

document.querySelectorAll("[data-cristal]").forEach(montar);
