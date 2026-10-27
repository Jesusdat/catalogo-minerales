import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink, History, KeyRound, LogOut, Pencil, Plus, Trash2, Upload, X, AlertTriangle, Loader2 } from "lucide-react";
import { useCatalogo } from "../lib/store";
import { GitHubClient, type Sesion } from "../lib/github";
import { REPO } from "../lib/config";
import { leer, escribir, borrar } from "../lib/storage";
import { BRILLOS, CLASES, HABITOS, RAYAS, SISTEMAS, type Localidad, type Mineral } from "../lib/types";
import { comprimirImagen, recurso, slug } from "../lib/util";
import { normalizarFormula } from "../lib/formula";
import { Formula, FotoMineral, Titulo } from "../components/ui";

const VACIO: Mineral = {
  id: "", nombre: "", formula: "", clase: "Silicatos", dureza_min: 5, dureza_max: 5, densidad: null, sistema: "Cúbico",
  habito: "cubo", brillo: "Vítreo", color: "", raya: "Blanca", raya_grupo: "blanca", exfoliacion: "", fractura: "",
  magnetico: false, efervescencia: false, fluorescencia: false, color_hex: "#9A8F80", usos: "", descripcion: "",
  localidades: [], imagen: { src: "", autor: "", licencia: "", licencia_url: "", fuente: "" }, wikipedia: "",
};

type Aviso = { tipo: "ok" | "error"; texto: string; url?: string } | null;

export default function Admin() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

  // Recupera la sesión guardada (si el usuario eligió recordarla)
  useEffect(() => {
    const t = leer<string | null>("gh-token", null);
    if (t) entrar(t, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function entrar(token: string, recordar: boolean) {
    setVerificando(true);
    setErrorLogin("");
    try {
      const s = await new GitHubClient(token.trim()).verificar();
      setSesion(s);
      if (recordar) escribir("gh-token", token.trim());
    } catch (e) {
      setErrorLogin((e as Error).message);
      borrar("gh-token");
    } finally {
      setVerificando(false);
    }
  }

  if (!sesion) return <Login onEntrar={entrar} verificando={verificando} error={errorLogin} />;
  return <Panel sesion={sesion} onSalir={() => { borrar("gh-token"); setSesion(null); }} />;
}

function Login({ onEntrar, verificando, error }: { onEntrar: (t: string, r: boolean) => void; verificando: boolean; error: string }) {
  const [token, setToken] = useState("");
  const [recordar, setRecordar] = useState(false);
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (token.trim()) onEntrar(token, recordar);
  };
  const urlToken = `https://github.com/settings/personal-access-tokens/new?name=${encodeURIComponent("Gabinete Mineral")}&target_name=${REPO.owner}&contents=write`;
  return (
    <div className="mx-auto grid max-w-page gap-12 px-4 pt-10 sm:px-6 lg:grid-cols-[1fr_1fr]">
      <div>
        <Titulo eyebrow="Administración" titulo="Acceso del propietario" texto={`Solo ${REPO.owner} puede editar el catálogo. Cada cambio se guarda como un commit en el repositorio y el sitio se actualiza solo en un par de minutos.`} />
        <form onSubmit={enviar} className="card space-y-4 p-6" data-testid="form-login">
          <div>
            <label htmlFor="token" className="label">Token de acceso de GitHub</label>
            <input id="token" type="password" autoComplete="off" className="field font-mono" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" data-testid="input-token" />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
            Recordar en este navegador
          </label>
          {error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-danger" data-testid="text-error-login">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={verificando || !token.trim()} data-testid="btn-entrar">
            {verificando ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Entrar
          </button>
        </form>
      </div>
      <div className="lg:pt-24">
        <h2 className="text-lg font-semibold">Cómo crear el token</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-muted">
          <li>Abre <a href={urlToken} className="text-ink underline underline-offset-2">GitHub → Fine-grained tokens</a>.</li>
          <li>En <em className="not-italic text-ink">Repository access</em> elige solo <span className="font-mono text-ink">{REPO.name}</span>.</li>
          <li>En <em className="not-italic text-ink">Permissions → Contents</em> selecciona <span className="text-ink">Read and write</span>.</li>
          <li>Genera el token, cópialo y pégalo aquí.</li>
        </ol>
        <p className="mt-6 text-sm text-muted">
          El token se envía únicamente a <span className="font-mono">api.github.com</span>. Si alguien más lo intenta, GitHub le negará
          el permiso de escritura y este panel rechazará cualquier cuenta que no sea {REPO.owner}.
        </p>
      </div>
    </div>
  );
}

function Panel({ sesion, onSalir }: { sesion: Sesion; onSalir: () => void }) {
  const { minerales, reemplazar } = useCatalogo();
  const cliente = useMemo(() => new GitHubClient(sesion.token), [sesion.token]);
  const [editando, setEditando] = useState<Mineral | null>(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const [aBorrar, setABorrar] = useState<Mineral | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [pestana, setPestana] = useState<"minerales" | "historial">("minerales");
  const [filtro, setFiltro] = useState("");

  async function guardar(m: Mineral, imagen: { base64: string } | null) {
    setOcupado(true);
    setAviso(null);
    try {
      const actuales = await cliente.leerDatos();
      const agregar = [];
      if (imagen) {
        const ruta = `${REPO.imgDir}/${m.id}.webp`;
        agregar.push({ ruta, base64: imagen.base64 });
        m = { ...m, imagen: { ...m.imagen, src: `img/${m.id}.webp` } };
      }
      const existe = actuales.some((x) => x.id === m.id);
      if (esNuevo && existe) throw new Error(`Ya existe un mineral con el identificador «${m.id}».`);
      const nuevos = existe ? actuales.map((x) => (x.id === m.id ? m : x)) : [...actuales, m];
      const r = await cliente.commit({ mensaje: `${esNuevo ? "Añade" : "Actualiza"} mineral: ${m.nombre}`, minerales: nuevos, agregar });
      reemplazar(nuevos);
      setEditando(null);
      setAviso({ tipo: "ok", texto: `«${m.nombre}» guardado. El sitio público se actualizará en 1–2 minutos.`, url: r.url });
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message });
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar(m: Mineral) {
    setOcupado(true);
    setAviso(null);
    try {
      const actuales = await cliente.leerDatos();
      const nuevos = actuales.filter((x) => x.id !== m.id);
      const img = m.imagen.src.startsWith("img/") ? [`${REPO.imgDir}/${m.imagen.src.slice(4)}`] : [];
      const usadaPorOtro = nuevos.some((x) => x.imagen.src === m.imagen.src);
      const r = await cliente.commit({ mensaje: `Elimina mineral: ${m.nombre}`, minerales: nuevos, borrar: usadaPorOtro ? [] : img });
      reemplazar(nuevos);
      setABorrar(null);
      setAviso({ tipo: "ok", texto: `«${m.nombre}» eliminado.`, url: r.url });
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message });
    } finally {
      setOcupado(false);
    }
  }

  const lista = minerales.filter((m) => m.nombre.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div className="mx-auto max-w-page px-4 pt-10 sm:px-6">
      <Titulo eyebrow="Administración" titulo="Panel del catálogo">
        <div className="flex items-center gap-3">
          <img src={sesion.avatar} alt="" className="h-9 w-9 rounded-full" />
          <span className="text-sm">{sesion.login}</span>
          <button type="button" className="btn-ghost" onClick={onSalir} data-testid="btn-salir"><LogOut className="h-4 w-4" /> Salir</button>
        </div>
      </Titulo>

      {aviso && (
        <div role="status" className={`mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm rise ${aviso.tipo === "ok" ? "border-accent/40 bg-accent/10" : "border-danger/40 bg-danger/10"}`}>
          {aviso.tipo === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />}
          <div className="flex-1">
            {aviso.texto}
            {aviso.url && <a href={aviso.url} className="ml-2 inline-flex items-center gap-1 underline underline-offset-2">Ver commit <ExternalLink className="h-3 w-3" /></a>}
          </div>
          <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar aviso" className="text-muted hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2 border-b hairline">
        {(["minerales", "historial"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setPestana(t)} aria-pressed={pestana === t}
            className={`-mb-px min-h-[44px] border-b-2 px-3 text-sm ${pestana === t ? "border-accent font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {t === "minerales" ? `Minerales (${minerales.length})` : "Historial de cambios"}
          </button>
        ))}
        {pestana === "minerales" && (
          <button type="button" className="btn-primary mb-2 ml-auto" onClick={() => { setEsNuevo(true); setEditando({ ...VACIO, localidades: [] }); }} data-testid="btn-nuevo">
            <Plus className="h-4 w-4" /> Nuevo mineral
          </button>
        )}
      </div>

      {pestana === "historial" ? (
        <Historial cliente={cliente} />
      ) : (
        <>
          <input className="field mb-4 max-w-sm" placeholder="Filtrar por nombre" value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar minerales" />
          <div className="card divide-y divide-[rgb(var(--line)/0.12)]">
            {lista.map((m) => (
              <div key={m.id} className="flex items-center gap-4 p-3">
                <FotoMineral m={m} className="h-12 w-12 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  <Link to={`/minerales/${m.id}`} className="font-medium hover:text-accent">{m.nombre}</Link>
                  <p className="truncate text-xs text-muted"><Formula f={m.formula} /> · {m.clase}</p>
                </div>
                <button type="button" className="btn-icon" onClick={() => { setEsNuevo(false); setEditando(structuredClone(m)); }} aria-label={`Editar ${m.nombre}`} data-testid={`editar-${m.id}`}><Pencil className="h-4 w-4" /></button>
                <button type="button" className="btn-icon text-danger" onClick={() => setABorrar(m)} aria-label={`Eliminar ${m.nombre}`} data-testid={`eliminar-${m.id}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </>
      )}

      {editando && <Editor inicial={editando} nuevo={esNuevo} ocupado={ocupado} onCerrar={() => setEditando(null)} onGuardar={guardar} />}

      {aBorrar && (
        <Dialogo titulo={`¿Eliminar ${aBorrar.nombre}?`} onCerrar={() => setABorrar(null)}>
          <p className="text-sm text-muted">Se quitará del catálogo y se borrará su imagen del repositorio. Podrás recuperarlo desde el historial de Git.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setABorrar(null)}>Cancelar</button>
            <button type="button" className="btn bg-danger text-white hover:bg-danger/90" disabled={ocupado} onClick={() => eliminar(aBorrar)} data-testid="btn-confirmar-eliminar">
              {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Eliminar
            </button>
          </div>
        </Dialogo>
      )}
    </div>
  );
}

function Historial({ cliente }: { cliente: GitHubClient }) {
  const [items, setItems] = useState<Awaited<ReturnType<GitHubClient["historial"]>> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    cliente.historial().then(setItems).catch((e) => setError(e.message));
  }, [cliente]);
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!items) return <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-12" />)}</div>;
  if (!items.length) return <p className="text-sm text-muted">Todavía no hay cambios registrados en el archivo de datos.</p>;
  return (
    <ol className="card divide-y divide-[rgb(var(--line)/0.12)]">
      {items.map((c) => (
        <li key={c.sha} className="flex items-center gap-4 p-3 text-sm">
          <History className="h-4 w-4 shrink-0 text-faint" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{c.mensaje}</p>
            <p className="text-xs text-muted">{c.autor} · {new Date(c.fecha).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
          <a href={c.url} className="font-mono text-xs text-muted hover:text-ink">{c.sha.slice(0, 7)}</a>
        </li>
      ))}
    </ol>
  );
}

function Dialogo({ titulo, onCerrar, children, ancho = "max-w-md" }: { titulo: string; onCerrar: () => void; children: React.ReactNode; ancho?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onCerrar]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className={`rise max-h-[92dvh] w-full ${ancho} overflow-y-auto rounded-t-xl bg-surface p-6 shadow-2xl sm:rounded-xl`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="btn-icon border-0" aria-label="Cerrar"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Editor({ inicial, nuevo, ocupado, onCerrar, onGuardar }: {
  inicial: Mineral; nuevo: boolean; ocupado: boolean; onCerrar: () => void; onGuardar: (m: Mineral, img: { base64: string } | null) => void;
}) {
  const [m, setM] = useState<Mineral>(inicial);
  const [img, setImg] = useState<{ base64: string; url: string } | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const set = <K extends keyof Mineral>(k: K, v: Mineral[K]) => setM((x) => ({ ...x, [k]: v }));
  const setLoc = (i: number, k: keyof Localidad, v: string) =>
    setM((x) => ({ ...x, localidades: x.localidades.map((l, j) => (j === i ? { ...l, [k]: k === "lat" || k === "lon" ? Number(v) : v } : l)) }));

  const validar = () => {
    const e: Record<string, string> = {};
    if (!m.nombre.trim()) e.nombre = "Escribe el nombre del mineral.";
    if (!m.formula.trim()) e.formula = "Escribe la fórmula química.";
    if (m.dureza_min > m.dureza_max) e.dureza = "La dureza mínima no puede ser mayor que la máxima.";
    if (nuevo && !img) e.imagen = "Sube una fotografía del ejemplar.";
    m.localidades.forEach((l, i) => {
      if (!l.nombre || Number.isNaN(l.lat) || Number.isNaN(l.lon) || Math.abs(l.lat) > 90 || Math.abs(l.lon) > 180) e[`loc${i}`] = "Revisa el nombre y las coordenadas.";
    });
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const enviar = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validar()) return;
    const id = nuevo ? slug(m.nombre) : m.id;
    onGuardar({ ...m, id, nombre: m.nombre.trim(), formula: normalizarFormula(m.formula), wikipedia: m.wikipedia || `https://es.wikipedia.org/wiki/${encodeURIComponent(m.nombre.trim())}` }, img);
  };

  const campo = (k: keyof Mineral, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`f-${k}`} className="label">{label}</label>
      <input id={`f-${k}`} className="field" value={(m[k] as string | number | null) ?? ""} onChange={(e) => set(k, (extra.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value) as never)} {...extra} />
      {errores[k] && <p className="mt-1 text-xs text-danger">{errores[k]}</p>}
    </div>
  );
  const selector = (k: keyof Mineral, label: string, opciones: { v: string; l: string }[]) => (
    <div>
      <label htmlFor={`f-${k}`} className="label">{label}</label>
      <select id={`f-${k}`} className="field" value={m[k] as string} onChange={(e) => set(k, e.target.value as never)}>
        {opciones.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
  const op = (xs: string[]) => xs.map((x) => ({ v: x, l: x }));

  return (
    <Dialogo titulo={nuevo ? "Nuevo mineral" : `Editar ${inicial.nombre}`} onCerrar={onCerrar} ancho="max-w-3xl">
      <form onSubmit={enviar} className="space-y-8" data-testid="form-editor" noValidate>
        <section className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div>
            <p className="label">Fotografía</p>
            <label className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed hairline bg-raised">
              {img ? <img src={img.url} alt="Vista previa" className="h-full w-full object-cover" /> : m.imagen.src ? <img src={recurso(m.imagen.src)} alt="Imagen actual" className="h-full w-full object-cover" /> : <Upload className="h-6 w-6 text-muted" />}
              <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1.5 text-center text-xs text-white opacity-0 transition group-hover:opacity-100">Cambiar</span>
              <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImg(await comprimirImagen(f)); }} data-testid="input-imagen" />
            </label>
            {errores.imagen && <p className="mt-1 text-xs text-danger">{errores.imagen}</p>}
            <p className="mt-1 text-xs text-faint">Se convierte a WebP de 1200 px.</p>
          </div>
          <div className="grid content-start gap-4 sm:grid-cols-2">
            {campo("nombre", "Nombre", { required: true, disabled: !nuevo, "data-testid": "input-nombre" } as never)}
            <div>
              {campo("formula", "Fórmula (usa números normales: CaCO3)", { "data-testid": "input-formula" } as never)}
              {m.formula && <p className="mt-1 text-sm text-muted">Vista: <Formula f={m.formula} /></p>}
            </div>
            {selector("clase", "Clase química", op(CLASES))}
            {selector("sistema", "Sistema cristalino", op(SISTEMAS))}
            {selector("habito", "Forma para el modelo 3D", HABITOS.map((h) => ({ v: h.id, l: h.label })))}
            <div>
              <label htmlFor="f-color_hex" className="label">Color característico</label>
              <div className="flex gap-2">
                <input id="f-color_hex" type="color" value={m.color_hex} onChange={(e) => set("color_hex", e.target.value)} className="h-11 w-14 cursor-pointer rounded-md border hairline bg-surface" />
                <input className="field font-mono" value={m.color_hex} onChange={(e) => set("color_hex", e.target.value)} aria-label="Color en hexadecimal" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {campo("dureza_min", "Dureza mínima", { type: "number", min: 1, max: 10, step: 0.25 })}
          {campo("dureza_max", "Dureza máxima", { type: "number", min: 1, max: 10, step: 0.25 })}
          {campo("densidad", "Densidad (g/cm³)", { type: "number", min: 0, step: 0.01 })}
          {errores.dureza && <p className="text-xs text-danger sm:col-span-3">{errores.dureza}</p>}
          {selector("brillo", "Brillo", op(BRILLOS))}
          {campo("raya", "Raya (texto)")}
          {selector("raya_grupo", "Raya (para el identificador)", RAYAS.map((r) => ({ v: r.id, l: r.label })))}
          {campo("color", "Colores")}
          {campo("exfoliacion", "Exfoliación")}
          {campo("fractura", "Fractura")}
        </section>

        <fieldset className="flex flex-wrap gap-6">
          <legend className="label">Propiedades especiales</legend>
          {([["magnetico", "Magnético"], ["efervescencia", "Efervescente con ácido"], ["fluorescencia", "Fluorescente"]] as const).map(([k, l]) => (
            <label key={k} className="flex min-h-[44px] items-center gap-2 text-sm">
              <input type="checkbox" checked={m[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent))]" /> {l}
            </label>
          ))}
        </fieldset>

        <section className="grid gap-4">
          {campo("usos", "Usos")}
          <div>
            <label htmlFor="f-descripcion" className="label">Descripción</label>
            <textarea id="f-descripcion" rows={4} className="field py-2" value={m.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {campo("wikipedia", "Enlace de referencia (opcional)")}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="f-autor" className="label">Autor de la foto</label>
                <input id="f-autor" className="field" value={m.imagen.autor} onChange={(e) => set("imagen", { ...m.imagen, autor: e.target.value })} />
              </div>
              <div>
                <label htmlFor="f-lic" className="label">Licencia</label>
                <input id="f-lic" className="field" value={m.imagen.licencia} onChange={(e) => set("imagen", { ...m.imagen, licencia: e.target.value })} placeholder="CC BY-SA 4.0" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="label mb-0">Yacimientos</p>
            <button type="button" className="btn-ghost" onClick={() => set("localidades", [...m.localidades, { nombre: "", region: "", lat: 0, lon: 0 }])}><Plus className="h-4 w-4" /> Añadir</button>
          </div>
          {m.localidades.length === 0 && <p className="text-sm text-muted">Sin yacimientos. Añade al menos uno para que aparezca en el mapa.</p>}
          <div className="space-y-2">
            {m.localidades.map((l, i) => (
              <div key={i}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.2fr_1.4fr_100px_100px_44px]">
                  <input className="field" placeholder="Localidad" aria-label="Localidad" value={l.nombre} onChange={(e) => setLoc(i, "nombre", e.target.value)} />
                  <input className="field" placeholder="Región, país" aria-label="Región" value={l.region} onChange={(e) => setLoc(i, "region", e.target.value)} />
                  <input className="field font-mono" type="number" step="0.0001" aria-label="Latitud" placeholder="Lat" value={l.lat} onChange={(e) => setLoc(i, "lat", e.target.value)} />
                  <input className="field font-mono" type="number" step="0.0001" aria-label="Longitud" placeholder="Lon" value={l.lon} onChange={(e) => setLoc(i, "lon", e.target.value)} />
                  <button type="button" className="btn-icon" aria-label="Quitar yacimiento" onClick={() => set("localidades", m.localidades.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
                </div>
                {errores[`loc${i}`] && <p className="mt-1 text-xs text-danger">{errores[`loc${i}`]}</p>}
              </div>
            ))}
          </div>
        </section>

        <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t hairline bg-surface px-6 py-4">
          <button type="button" className="btn-ghost" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={ocupado} data-testid="btn-guardar">
            {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {ocupado ? "Guardando…" : "Guardar y publicar"}
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
