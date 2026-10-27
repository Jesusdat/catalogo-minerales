// Mejoras progresivas: todo funciona sin JavaScript; esto solo evita recargas y añade comodidad.
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  // Tema claro/oscuro
  $$("[data-tema]").forEach((b) =>
    b.addEventListener("click", () => {
      const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = t;
      try { localStorage.setItem("tema", t); } catch (e) {}
      document.dispatchEvent(new CustomEvent("tema", { detail: t }));
    }),
  );

  // Menú móvil
  const btnMenu = $("[data-menu]");
  const menu = $("#menu-movil");
  btnMenu?.addEventListener("click", () => {
    const abierto = menu.classList.toggle("hidden") === false;
    btnMenu.setAttribute("aria-expanded", String(abierto));
  });

  // Formularios que se envían solos al cambiar un campo
  $$("form[data-autoenvio]").forEach((f) => {
    let t;
    f.addEventListener("change", (e) => { if (e.target.type !== "search") f.requestSubmit(); });
    f.addEventListener("input", (e) => {
      if (e.target.type === "search") { clearTimeout(t); t = setTimeout(() => f.requestSubmit(), 450); }
      if (e.target.type === "range") {
        const a = f.querySelector("[name=dmin]"), b = f.querySelector("[name=dmax]"), s = f.querySelector("[data-salida-dureza]");
        if (a && b && s) s.textContent = `${Math.min(+a.value, +b.value)}–${Math.max(+a.value, +b.value)}`;
      }
    });
    // No enviar campos vacíos ni valores por defecto: direcciones más limpias
    f.addEventListener("formdata", (e) => {
      for (const [k, v] of Array.from(e.formData.entries())) {
        if (v === "" || (k === "dmin" && v === "1") || (k === "dmax" && v === "10") || (k === "orden" && v === "nombre") || (k === "vista" && v === "cuadricula")) e.formData.delete(k);
      }
    });
  });
  // Mantener el foco en el buscador tras recargar
  const q = $("#q");
  if (q && q.value && new URLSearchParams(location.search).has("q")) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }

  // "No sé" en el identificador
  $$("[data-limpiar]").forEach((b) =>
    b.addEventListener("click", () => {
      $$(`input[name="${b.dataset.limpiar}"]`).forEach((i) => (i.checked = false));
      b.closest("form").requestSubmit();
    }),
  );

  // Favoritos y comparador sin recargar la página
  const token = () => $("input[name=csrfmiddlewaretoken]")?.value;
  $$("form[data-alternar]").forEach((f) =>
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const clave = f.dataset.alternar;
      try {
        const r = await fetch(f.action, { method: "POST", headers: { "X-CSRFToken": token(), Accept: "application/json" }, credentials: "same-origin" });
        if (!r.ok) throw new Error(r.status);
        const { activo, total } = await r.json();
        // Todas las copias del mismo botón (tarjeta y ficha) se actualizan
        $$(`form[data-alternar="${clave}"][action="${f.getAttribute("action")}"] button`).forEach((b) => {
          b.setAttribute("aria-pressed", String(activo));
          const txt = b.querySelector("[data-texto]");
          if (txt) txt.textContent = activo ? b.dataset.on : b.dataset.off;
        });
        const c = $(`[data-contador="${clave}"]`);
        if (c) { c.textContent = total; c.classList.toggle("hidden", !total); }
        if (location.pathname.startsWith("/comparar") || location.pathname.startsWith("/favoritos")) location.reload();
      } catch (err) {
        f.submit();
      }
    }),
  );

  // Copiar enlace
  $$("[data-copiar]").forEach((b) =>
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copiar); } catch (e) { prompt("Copia el enlace:", b.dataset.copiar); return; }
      const t = b.querySelector("[data-texto]"); if (!t) return;
      const antes = t.textContent; t.textContent = "Enlace copiado"; setTimeout(() => (t.textContent = antes), 1800);
    }),
  );

  $$("[data-imprimir]").forEach((b) => b.addEventListener("click", () => window.print()));

  // Escala de Mohs en la portada
  const mohs = $("[data-mohs]");
  if (mohs) {
    const botones = $$("[data-grado]", mohs);
    botones.forEach((b) =>
      b.addEventListener("click", () => {
        botones.forEach((x) => x.setAttribute("aria-checked", String(x === b)));
        $$("[data-panel]", mohs).forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.grado));
      }),
    );
    mohs.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key) || !e.target.dataset.grado) return;
      const i = botones.indexOf(e.target) + (e.key === "ArrowRight" ? 1 : -1);
      const b = botones[(i + botones.length) % botones.length];
      b.focus(); b.click();
    });
  }
})();
