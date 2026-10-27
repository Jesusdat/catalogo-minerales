import { REPO } from "./config";
import type { Mineral } from "./types";

const API = "https://api.github.com";

export class GitHubError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export type Sesion = { token: string; login: string; avatar: string };

type Fetch = typeof fetch;

/** Cliente mínimo de la API de GitHub para editar los datos del catálogo desde el navegador. */
export class GitHubClient {
  constructor(private token: string, private f: Fetch = (...a) => fetch(...a)) {}

  private async req<T>(ruta: string, init: RequestInit = {}): Promise<T> {
    const res = await this.f(API + ruta, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
    if (!res.ok) {
      let msg = res.statusText;
      try {
        msg = ((await res.json()) as { message?: string }).message ?? msg;
      } catch {
        /* sin cuerpo */
      }
      throw new GitHubError(traducir(res.status, msg), res.status);
    }
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  /** Verifica que el token pertenezca al dueño del repositorio y tenga permiso de escritura. */
  async verificar(): Promise<Sesion> {
    const user = await this.req<{ login: string; avatar_url: string }>("/user");
    if (user.login.toLowerCase() !== REPO.owner.toLowerCase()) {
      throw new GitHubError(`Este panel es solo para ${REPO.owner}. Iniciaste sesión como ${user.login}.`, 403);
    }
    const repo = await this.req<{ permissions?: { push?: boolean } }>(`/repos/${REPO.owner}/${REPO.name}`);
    if (!repo.permissions?.push) {
      throw new GitHubError("El token no tiene permiso de escritura en el repositorio.", 403);
    }
    return { token: this.token, login: user.login, avatar: user.avatar_url };
  }

  /** Lee el JSON de minerales directamente de la rama, para no pisar cambios recientes. */
  async leerDatos(): Promise<Mineral[]> {
    const r = await this.req<{ content: string }>(
      `/repos/${REPO.owner}/${REPO.name}/contents/${REPO.dataPath}?ref=${REPO.branch}`,
    );
    return JSON.parse(base64ATexto(r.content));
  }

  /**
   * Crea un único commit con el JSON actualizado y, opcionalmente, imágenes nuevas o borradas.
   * Usa la API de Git (blobs → árbol → commit → referencia).
   */
  async commit(opciones: {
    mensaje: string;
    minerales: Mineral[];
    agregar?: { ruta: string; base64: string }[];
    borrar?: string[];
  }): Promise<{ sha: string; url: string }> {
    const base = `/repos/${REPO.owner}/${REPO.name}`;
    const ref = await this.req<{ object: { sha: string } }>(`${base}/git/ref/heads/${REPO.branch}`);
    const padre = await this.req<{ tree: { sha: string } }>(`${base}/git/commits/${ref.object.sha}`);

    const arbol: { path: string; mode: "100644"; type: "blob"; sha: string | null; content?: string }[] = [];
    arbol.push({
      path: REPO.dataPath,
      mode: "100644",
      type: "blob",
      sha: null,
      content: JSON.stringify(opciones.minerales, null, 2) + "\n",
    });
    for (const img of opciones.agregar ?? []) {
      const blob = await this.req<{ sha: string }>(`${base}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: img.base64, encoding: "base64" }),
      });
      arbol.push({ path: img.ruta, mode: "100644", type: "blob", sha: blob.sha });
    }
    for (const ruta of opciones.borrar ?? []) arbol.push({ path: ruta, mode: "100644", type: "blob", sha: null });

    // El JSON va como "content"; las entradas con sha null y sin content se eliminan.
    const tree = arbol.map((e) => (e.content !== undefined ? { path: e.path, mode: e.mode, type: e.type, content: e.content } : e));
    const nuevoArbol = await this.req<{ sha: string }>(`${base}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: padre.tree.sha, tree }),
    });
    const commit = await this.req<{ sha: string; html_url: string }>(`${base}/git/commits`, {
      method: "POST",
      body: JSON.stringify({ message: opciones.mensaje, tree: nuevoArbol.sha, parents: [ref.object.sha] }),
    });
    await this.req(`${base}/git/refs/heads/${REPO.branch}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha }),
    });
    return { sha: commit.sha, url: commit.html_url };
  }

  async historial(): Promise<{ sha: string; mensaje: string; fecha: string; autor: string; url: string }[]> {
    const r = await this.req<
      { sha: string; html_url: string; commit: { message: string; author: { name: string; date: string } } }[]
    >(`/repos/${REPO.owner}/${REPO.name}/commits?path=${encodeURIComponent(REPO.dataPath)}&sha=${REPO.branch}&per_page=20`);
    return r.map((c) => ({
      sha: c.sha,
      mensaje: c.commit.message.split("\n")[0],
      fecha: c.commit.author.date,
      autor: c.commit.author.name,
      url: c.html_url,
    }));
  }
}

function traducir(status: number, msg: string) {
  if (status === 401) return "Token inválido o vencido.";
  if (status === 403 && /rate limit/i.test(msg)) return "Límite de solicitudes de GitHub alcanzado. Intenta en unos minutos.";
  if (status === 404) return "No se encontró el recurso. Revisa que el token tenga acceso a este repositorio.";
  if (status === 409 || status === 422) return "Hubo un conflicto con un cambio reciente. Recarga e intenta de nuevo.";
  return msg;
}

export function textoABase64(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export function base64ATexto(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
