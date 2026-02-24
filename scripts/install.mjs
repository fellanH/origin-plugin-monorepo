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

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

const ok = (msg) => console.log(`${GREEN}✓${RESET}  ${msg}`);
const warn = (msg) => console.warn(`${YELLOW}⚠${RESET}  ${msg}`);
const fail = (msg) => {
  console.error(`${RED}✗${RESET}  ${msg}`);
  process.exit(1);
};

const APP_ID = "com.klarhimmel.origin";

function getAppDataDir() {
  const p = platform();
  if (p === "darwin") {
    return join(homedir(), "Library", "Application Support", APP_ID);
  }
  if (p === "win32") {
    const appData = process.env.APPDATA;
    if (!appData) fail("APPDATA environment variable not set");
    return join(appData, APP_ID);
  }
  // Linux / other XDG
  const xdg = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
  return join(xdg, APP_ID);
}

const distDir = join(process.cwd(), "dist");
const manifestPath = join(distDir, "manifest.json");
const bundlePath = join(distDir, "index.js");

// Validate build output
if (!existsSync(distDir) || !existsSync(manifestPath) || !existsSync(bundlePath)) {
  fail("dist/ is missing or incomplete — run `npm run build` first.");
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
} catch {
  fail("Could not read dist/manifest.json — run `npm run build` first.");
}

const pluginId = manifest.id;
if (!pluginId) {
  fail("manifest.json is missing the `id` field.");
}

// Check Origin AppData directory exists
const appDataDir = getAppDataDir();
if (!existsSync(appDataDir)) {
  warn(`Origin AppData not found at:`);
  warn(`   ${appDataDir}`);
  warn(`Is Origin installed and has been launched at least once?`);
  console.log("");
}

const destDir = join(appDataDir, "plugins", pluginId);
mkdirSync(destDir, { recursive: true });

const files = readdirSync(distDir);
for (const file of files) {
  copyFileSync(join(distDir, file), join(destDir, file));
  console.log(`   copied  ${file}`);
}

console.log("");
ok(`${manifest.name} v${manifest.version} installed to:`);
console.log(`   ${destDir}`);
console.log(`\n   Restart Origin to load your plugin.`);
