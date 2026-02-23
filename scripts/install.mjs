#!/usr/bin/env node
/**
 * install.mjs — copies dist/ into Origin's AppData plugins directory.
 *
 * Usage: node scripts/install.mjs
 * Or:    npm run install:origin
 *
 * Reads dist/manifest.json for the plugin id, then copies all files in dist/
 * to the correct platform-specific AppData path.
 */

import { copyFileSync, mkdirSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";

const APP_ID = "com.klarhimmel.origin";

function getAppDataDir() {
  const p = platform();
  if (p === "darwin") {
    return join(homedir(), "Library", "Application Support", APP_ID);
  }
  if (p === "win32") {
    const appData = process.env.APPDATA;
    if (!appData) throw new Error("APPDATA environment variable not set");
    return join(appData, APP_ID);
  }
  // Linux / other XDG
  const xdg = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
  return join(xdg, APP_ID);
}

const distDir = join(process.cwd(), "dist");
const manifestPath = join(distDir, "manifest.json");

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
} catch {
  console.error(
    "❌  Could not read dist/manifest.json — run `npm run build` first.",
  );
  process.exit(1);
}

const pluginId = manifest.id;
if (!pluginId) {
  console.error("❌  manifest.json is missing the `id` field.");
  process.exit(1);
}

const destDir = join(getAppDataDir(), "plugins", pluginId);
mkdirSync(destDir, { recursive: true });

const files = readdirSync(distDir);
for (const file of files) {
  const src = join(distDir, file);
  const dest = join(destDir, file);
  copyFileSync(src, dest);
  console.log(`  copied  ${file}`);
}

console.log(`\n✅  ${manifest.name} installed to:\n   ${destDir}`);
console.log("   Restart Origin to see your plugin.");
