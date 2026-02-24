import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import manifestJson from "./src/manifest.json";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-manifest",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "manifest.json",
          source: JSON.stringify(manifestJson, null, 2),
        });
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
