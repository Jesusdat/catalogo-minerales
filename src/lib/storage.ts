// Acceso seguro a localStorage: algunos entornos (iframes aislados) lo bloquean.
const memoria = new Map<string, string>();

export function leer<T>(clave: string, defecto: T): T {
  try {
    const v = window.localStorage.getItem(clave);
    return v == null ? defecto : (JSON.parse(v) as T);
  } catch {
    const v = memoria.get(clave);
    return v == null ? defecto : (JSON.parse(v) as T);
  }
}

export function escribir(clave: string, valor: unknown) {
  const s = JSON.stringify(valor);
  try {
    window.localStorage.setItem(clave, s);
  } catch {
    memoria.set(clave, s);
  }
}

export function borrar(clave: string) {
  try {
    window.localStorage.removeItem(clave);
  } catch {
    memoria.delete(clave);
  }
}
