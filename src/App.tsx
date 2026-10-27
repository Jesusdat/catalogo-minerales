import { lazy, Suspense } from "react";
import { HashRouter, Link, Route, Routes } from "react-router-dom";
import { Proveedor } from "./lib/store";
import Layout from "./components/Layout";
import Inicio from "./pages/Inicio";
import Catalogo from "./pages/Catalogo";
import Ficha from "./pages/Ficha";
import { Vacio } from "./components/ui";

const Identificar = lazy(() => import("./pages/Identificar"));
const Elementos = lazy(() => import("./pages/Elementos"));
const Mapa = lazy(() => import("./pages/Mapa"));
const Comparar = lazy(() => import("./pages/Comparar"));
const Favoritos = lazy(() => import("./pages/Favoritos"));
const Admin = lazy(() => import("./pages/Admin"));
const Acerca = lazy(() => import("./pages/Acerca"));

const Cargando = () => (
  <div className="mx-auto max-w-page px-4 pt-10 sm:px-6">
    <div className="skeleton mb-4 h-8 w-64" />
    <div className="skeleton h-[50vh] w-full" />
  </div>
);

export default function App() {
  return (
    <Proveedor>
      {/* HashRouter: funciona en GitHub Pages sin configurar redirecciones */}
      <HashRouter>
        <Layout>
          <Suspense fallback={<Cargando />}>
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/minerales" element={<Catalogo />} />
              <Route path="/minerales/:id" element={<Ficha />} />
              <Route path="/identificar" element={<Identificar />} />
              <Route path="/elementos" element={<Elementos />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/comparar" element={<Comparar />} />
              <Route path="/favoritos" element={<Favoritos />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/acerca" element={<Acerca />} />
              <Route path="*" element={<Vacio titulo="Página no encontrada" texto="La dirección no existe o cambió." accion={<Link to="/" className="btn-primary">Volver al inicio</Link>} />} />
            </Routes>
          </Suspense>
        </Layout>
      </HashRouter>
    </Proveedor>
  );
}
