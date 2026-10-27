export function slug(texto: string): string {
  return texto
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const fmtDureza = (a: number, b: number) => (a === b ? `${a}` : `${a}–${b}`);

export function fmtNumero(n: number | null | undefined, sufijo = "") {
  if (n == null) return "—";
  return n.toLocaleString("es-MX", { maximumFractionDigits: 2 }) + sufijo;
}

/** Ruta pública de un recurso, relativa al sitio (compatible con GitHub Pages). */
export const recurso = (ruta: string) => (/^(https?:|data:|blob:)/.test(ruta) ? ruta : `./${ruta.replace(/^\.?\//, "")}`);

/** Redimensiona una imagen en el navegador y la devuelve como WebP en base64 (sin prefijo). */
export async function comprimirImagen(archivo: File, maxLado = 1200, calidad = 0.82): Promise<{ base64: string; url: string }> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  const url = canvas.toDataURL("image/webp", calidad);
  return { base64: url.split(",")[1], url };
}

export function descargar(nombre: string, contenido: string, tipo: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function aCSV(filas: Record<string, unknown>[]): string {
  if (!filas.length) return "";
  const cols = Object.keys(filas[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...filas.map((f) => cols.map((c) => esc(f[c])).join(","))].join("\n");
}
