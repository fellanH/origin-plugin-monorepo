# origin-plugin-starter

Template for building [Origin](https://github.com/klarhimmel/origin) plugins. Use the **"Use this template"** button on GitHub to get started.

## Quickstart

```bash
# 1. Clone your repo (created from this template)
git clone https://github.com/you/my-plugin
cd my-plugin

# 2. Install dependencies
npm install

# 3. Start the dev shell (hot-reload preview)
npm run dev
# → opens at http://localhost:5173
```

## Dev shell

`npm run dev` opens your plugin inside `DevShell` — a browser-based preview that simulates Origin's card. It includes:

- A live-reloading card container styled to match Origin's dark theme
- A **Light / Dark** toggle (passes `theme` via mock `PluginContext`)
- A collapsible **PluginContext** inspector showing mock values

## Build

```bash
npm run build
```

Outputs to `dist/`:

| File | Purpose |
|---|---|
| `index.js` | ES module — your plugin component |
| `manifest.json` | Plugin metadata — generated from `src/manifest.ts` |

**Important:** `react` and `react-dom` are NOT bundled. Origin provides React at runtime. If your plugin bundles React it will crash with a "multiple React instances" error.

## Install into Origin

```bash
npm run install:origin
```

Copies `dist/` to Origin's AppData plugins directory:

- **macOS:** `~/Library/Application Support/com.klarhimmel.origin/plugins/{id}/`
- **Windows:** `%APPDATA%\com.klarhimmel.origin\plugins\{id}\`
- **Linux:** `~/.local/share/com.klarhimmel.origin/plugins/{id}/`

Restart Origin to see your plugin.

## Plugin structure

```
src/
├── index.tsx      # Default export: plugin component + named export: manifest
└── manifest.ts    # Plugin metadata (id, name, version, description, icon)
```

Edit `src/manifest.ts` to set your plugin's id and metadata:

```ts
export const manifest: PluginManifest = {
  id: "com.yourname.myplugin",  // reverse-domain, must be unique
  name: "My Plugin",
  version: "0.1.0",
  description: "What your plugin does.",
  icon: "🔌",
};
```

Then build your UI in `src/index.tsx`. Origin passes a `PluginContext` at mount time:

```ts
export default function MyPlugin({ context }: { context: PluginContext }) {
  // context.cardId      — the card this instance is in
  // context.workspacePath — Origin's app data directory (for file I/O)
  // context.theme       — "light" | "dark"
  return <div>...</div>;
}
```

## Types

`src/types/origin-api.ts` contains a vendored copy of the Origin plugin API types (`PluginManifest`, `PluginContext`, `PluginComponent`, `PluginModule`). Update it when `@origin/api` changes, or replace with a direct import once the package is published to npm.

## Reference

See the [hello plugin](https://github.com/klarhimmel/origin/tree/main/plugins/hello) in the Origin repo — it demonstrates the same structure with detailed comments on every API surface.
