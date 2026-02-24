#!/usr/bin/env node
// Copies each plugin's dist/ into origin's src-tauri/assets/plugins/{id}/
// Run after `npm run build` to update the bundled plugin assets.
import { cpSync, mkdirSync, readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const PACKAGES_DIR = new URL("../packages", import.meta.url).pathname;
const ORIGIN_ASSETS = "/Users/admin/origin-project/origin/src-tauri/assets/plugins";
const SKIP = ["api", "sdk", "template"];

mkdirSync(ORIGIN_ASSETS, { recursive: true });

for (const pkg of readdirSync(PACKAGES_DIR)) {
  if (SKIP.includes(pkg)) continue;
  const distDir = join(PACKAGES_DIR, pkg, "dist");
  if (!existsSync(distDir)) {
    console.warn(`⚠ packages/${pkg}/dist not found — run npm run build first`);
    continue;
  }
  // Read plugin id from manifest.json if present, otherwise use pkg name
  const manifestPath = join(distDir, "manifest.json");
  let pluginId = pkg;
  if (existsSync(manifestPath)) {
    pluginId = JSON.parse(readFileSync(manifestPath, "utf8")).id ?? pkg;
  }
  const dest = join(ORIGIN_ASSETS, pluginId);
  mkdirSync(dest, { recursive: true });
  cpSync(distDir, dest, { recursive: true });
  console.log(`✅ Exported ${pkg} → assets/plugins/${pluginId}/`);
}
