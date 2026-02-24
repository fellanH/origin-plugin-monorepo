import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Inline Vite plugin: writes dist/manifest.json from src/manifest.ts
function originManifest(): import("vite").Plugin {
  return {
    name: "origin-manifest",
    async generateBundle() {
      const mod = await import("./src/manifest");
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(mod.manifest, null, 2),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), originManifest()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // xterm.js + WebGL addon are bundled — suppress expected size warning.
    chunkSizeWarningLimit: 1000,
  },
});
