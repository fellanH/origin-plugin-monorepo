#!/usr/bin/env node
// Builds all packages in dependency order: api → sdk → plugins
import { execSync } from "child_process";
import { readdirSync, existsSync } from "fs";
import { join } from "path";

const PACKAGES_DIR = new URL("../packages", import.meta.url).pathname;

// Build order: api and sdk first (published packages), then all others
const BUILD_ORDER = ["api", "sdk"];
const allPkgs = readdirSync(PACKAGES_DIR).filter((d) =>
  existsSync(join(PACKAGES_DIR, d, "package.json"))
);
const plugins = allPkgs.filter((d) => !BUILD_ORDER.includes(d));
const ordered = [...BUILD_ORDER, ...plugins];

for (const pkg of ordered) {
  const pkgDir = join(PACKAGES_DIR, pkg);
  if (!existsSync(join(pkgDir, "package.json"))) continue;
  console.log(`\n▶ Building packages/${pkg}...`);
  execSync("npm run build", { cwd: pkgDir, stdio: "inherit" });
}

console.log("\n✅ All packages built.");
