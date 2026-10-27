/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relativa: funciona igual en GitHub Pages (/catalogo-minerales/) que en local.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
  },
  test: { environment: "node" },
});
