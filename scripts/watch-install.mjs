#!/usr/bin/env node
/**
 * watch-install.mjs — watches dist/ for changes and re-installs automatically.
 * After each successful install, writes a .hotreload sentinel for Origin's HMR.
 *
 * Usage: node scripts/watch-install.mjs
 * Or:    npm run install:watch
 *
 * Pair with: vite build --mode lib --watch
 * Or use:    npm run dev:watch  (runs both concurrently)
 */

import { existsSync, watch, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";
import { execSync } from "child_process";

const APP_ID = "com.klarhimmel.origin";

function getAppDataDir() {
  const p = platform();
  if (p === "darwin") return join(homedir(), "Library", "Application Support", APP_ID);
  if (p === "win32") {
    const appData = process.env.APPDATA;
    if (!appData) throw new Error("APPDATA environment variable not set");
    return join(appData, APP_ID);
  }
  const xdg = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
  return join(xdg, APP_ID);
}

const distDir = join(process.cwd(), "dist");

// When running concurrently with vite build --watch, dist/ may not exist yet.
// Poll until Vite creates it on its first build pass.
async function waitForDist() {
  if (existsSync(distDir)) return;
  console.log("Waiting for dist/ (Vite first build)...");
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (existsSync(distDir)) {
        clearInterval(interval);
        resolve();
      }
    }, 500);
  });
}

await waitForDist();

console.log("Watching dist/ for changes (Ctrl+C to stop)...\n");

let debounce = null;

watch(distDir, { recursive: false }, (_event, filename) => {
  if (!filename) return;
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    console.log(`dist/${filename} changed — re-installing...`);
    try {
      execSync("node scripts/install.mjs", { stdio: "inherit" });

      // Write .hotreload sentinel so Origin can detect the update without polling.
      const manifestPath = join(distDir, "manifest.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      const pluginId = manifest.id;
      const destDir = join(getAppDataDir(), "plugins", pluginId);
      const timestamp = Date.now();
      writeFileSync(join(destDir, ".hotreload"), JSON.stringify({ t: timestamp, id: pluginId }));
      console.log(`[HMR] Installed at ${destDir} — v${timestamp}`);
    } catch {
      // install.mjs handles its own error output
    }
  }, 300);
});
