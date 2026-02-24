import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { manifest } from "./src/manifest";

// Inline Vite plugin: writes dist/manifest.json from src/manifest.ts
function originManifest(): import("vite").Plugin {
  return {
    name: "origin-manifest",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), originManifest()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
