#!/usr/bin/env node
/**
 * watch-install.mjs — watches dist/ for changes and re-installs automatically.
 *
 * Usage: node scripts/watch-install.mjs
 * Or:    npm run install:watch
 *
 * Pair with: npm run build -- --watch
 * Workflow:  save → auto-build → auto-install → restart Origin
 */

import { existsSync, watch } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const distDir = join(process.cwd(), "dist");

if (!existsSync(distDir)) {
  console.error("✗  dist/ not found — run `npm run build` first.");
  process.exit(1);
}

console.log("Watching dist/ for changes (Ctrl+C to stop)...");
console.log("Pair with: npm run build -- --watch\n");

let debounce = null;

watch(distDir, { recursive: false }, (_event, filename) => {
  if (!filename) return;
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    console.log(`dist/${filename} changed — re-installing...`);
    try {
      execSync("node scripts/install.mjs", { stdio: "inherit" });
    } catch {
      // install.mjs handles its own error output
    }
  }, 300);
});
