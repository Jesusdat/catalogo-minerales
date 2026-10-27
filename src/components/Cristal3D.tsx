import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import type { Habito } from "../lib/types";
import { verticesDe } from "../lib/crystal";

type Props = { habito: Habito; color: string; metalico?: boolean; autoRotar?: boolean; className?: string; etiqueta?: string };

/** Visor 3D de la forma cristalina idealizada. Arrastra para girar, rueda para acercar. */
export default function Cristal3D({ habito, color, metalico = false, autoRotar = true, className = "", etiqueta }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [sinWebGL, setSinWebGL] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setSinWebGL(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(3.4, 2.2, 4.6);

    const pts = verticesDe(habito).map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const geo = new ConvexGeometry(pts);
    geo.computeVertexNormals();
    const base = new THREE.Color(color);
    const mat = new THREE.MeshPhysicalMaterial({
      color: base,
      metalness: metalico ? 0.85 : 0.05,
      roughness: metalico ? 0.28 : 0.12,
      clearcoat: metalico ? 0.2 : 0.8,
      transparent: !metalico,
      opacity: metalico ? 1 : 0.88,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    const malla = new THREE.Mesh(geo, mat);
    const aristas = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 12),
      new THREE.LineBasicMaterial({ color: base.clone().offsetHSL(0, -0.1, metalico ? 0.25 : 0.3), transparent: true, opacity: 0.9 }),
    );
    const grupo = new THREE.Group();
    grupo.add(malla, aristas);
    scene.add(grupo);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x404040, 1.6));
    const d1 = new THREE.DirectionalLight(0xffffff, 2.4);
    d1.position.set(4, 6, 5);
    const d2 = new THREE.DirectionalLight(0xfff2e0, 1.1);
    d2.position.set(-5, -2, -4);
    scene.add(d1, d2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 9;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotate = autoRotar && !reduce;
    controls.autoRotateSpeed = 1.6;

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [habito, color, metalico, autoRotar]);

  if (sinWebGL)
    return (
      <div className={`flex items-center justify-center text-sm text-muted ${className}`}>
        Tu navegador no admite gráficos 3D.
      </div>
    );
  return <div ref={ref} className={`cursor-grab active:cursor-grabbing touch-none ${className}`} role="img" aria-label={etiqueta ?? "Modelo 3D del cristal"} />;
}
