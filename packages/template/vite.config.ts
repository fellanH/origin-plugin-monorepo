import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

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

export default defineConfig(({ mode }) => {
  if (mode === "lib") {
    return {
      plugins: [react(), originManifest()],
      build: {
        lib: {
          entry: resolve(__dirname, "src/main.tsx"),
          formats: ["es"],
          fileName: "index",
        },
        rollupOptions: {
          // React must NOT be bundled — Origin provides it at runtime.
          external: ["react", "react-dom", "react/jsx-runtime"],
        },
      },
    };
  }

  // HTML app mode (for direct browser preview)
  return {
    plugins: [react()],
    server: { port: 5173 },
  };
});
