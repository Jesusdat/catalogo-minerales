import { describe, expect, it, vi } from "vitest";
import { base64ATexto, GitHubClient, textoABase64 } from "./github";

const resp = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, statusText: "x", json: async () => body }) as Response;

describe("GitHubClient", () => {
  it("rechaza a quien no es dueño del repositorio", async () => {
    const f = vi.fn(async () => resp({ login: "otra-persona", avatar_url: "" }));
    await expect(new GitHubClient("t", f).verificar()).rejects.toThrow(/solo para Jesusdat/);
  });
  it("rechaza tokens sin permiso de escritura", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(resp({ login: "Jesusdat", avatar_url: "" }))
      .mockResolvedValueOnce(resp({ permissions: { push: false } }));
    await expect(new GitHubClient("t", f).verificar()).rejects.toThrow(/escritura/);
  });
  it("traduce 401", async () => {
    const f = vi.fn(async () => resp({ message: "Bad credentials" }, 401));
    await expect(new GitHubClient("t", f).verificar()).rejects.toThrow(/Token inválido/);
  });
  it("hace un único commit: ref → commit → blob → tree → commit → patch", async () => {
    const llamadas: string[] = [];
    const f = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const u = String(url);
      llamadas.push(`${init?.method ?? "GET"} ${u.replace(/.*catalogo-minerales/, "")}`);
      if (u.endsWith("/git/ref/heads/main")) return resp({ object: { sha: "A" } });
      if (u.endsWith("/git/commits/A")) return resp({ tree: { sha: "T0" } });
      if (u.endsWith("/git/blobs")) return resp({ sha: "B1" });
      if (u.endsWith("/git/trees")) {
        const body = JSON.parse(String(init?.body));
        expect(body.base_tree).toBe("T0");
        expect(body.tree).toHaveLength(3);
        return resp({ sha: "T1" });
      }
      if (u.endsWith("/git/commits")) return resp({ sha: "C1", html_url: "https://x/C1" });
      return resp({});
    });
    const r = await new GitHubClient("t", f).commit({
      mensaje: "prueba",
      minerales: [],
      agregar: [{ ruta: "public/img/a.webp", base64: "AAAA" }],
      borrar: ["public/img/b.webp"],
    });
    expect(r).toEqual({ sha: "C1", url: "https://x/C1" });
    expect(llamadas).toEqual([
      "GET /git/ref/heads/main",
      "GET /git/commits/A",
      "POST /git/blobs",
      "POST /git/trees",
      "POST /git/commits",
      "PATCH /git/refs/heads/main",
    ]);
  });
});

describe("base64", () => {
  it("conserva acentos y símbolos", () => {
    const t = "Fluorita · CaF₂ — Peña, Ñuñoa ✓";
    expect(base64ATexto(textoABase64(t))).toBe(t);
  });
});
