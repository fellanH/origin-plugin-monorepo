# origin-plugin-starter

Template for building plugins for [Origin](https://github.com/fellanH/origin) — a local-first desktop dashboard built with Tauri 2.

Plugins are React 19 components that render inside Origin's card interface. This starter gives you a dev shell, build tooling, and an install script so you can go from zero to a working plugin in minutes.

Use the **"Use this template"** button on GitHub to get started.

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

| File            | Purpose                                            |
| --------------- | -------------------------------------------------- |
| `index.js`      | ES module — your plugin component                  |
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
├── manifest.ts    # Plugin metadata (id, name, version, description, icon)
└── types/
    └── origin-api.ts  # Vendored PluginContext and PluginManifest types
```

### Manifest

Edit `src/manifest.ts` to set your plugin's id and metadata:

```ts
export const manifest: PluginManifest = {
  id: "com.yourname.myplugin", // reverse-domain, must be unique
  name: "My Plugin",
  version: "0.1.0",
  description: "What your plugin does.",
  icon: "🔌",
};
```

### Component

Build your UI in `src/index.tsx`. Origin injects a `PluginContext` at mount time:

```tsx
export default function MyPlugin({ context }: { context: PluginContext }) {
  return <div>Theme: {context.theme}</div>;
}
```

### PluginContext API

| Property        | Type                | Description                                                |
| --------------- | ------------------- | ---------------------------------------------------------- |
| `cardId`        | `string`            | Unique ID of the card this plugin instance is mounted in   |
| `workspacePath` | `string`            | Absolute path to Origin's workspace directory for file I/O |
| `theme`         | `"light" \| "dark"` | Current Origin theme                                       |

## Types

`src/types/origin-api.ts` contains a vendored copy of the Origin plugin API types (`PluginManifest`, `PluginContext`, `PluginComponent`, `PluginModule`). Update it when the API changes, or replace with a direct import once `@origin-cards/api` is published to npm.

## Requirements

- Node.js 18+
- [Origin](https://github.com/fellanH/origin) desktop app (for `install:origin`)

## Reference

See the [hello plugin](https://github.com/fellanH/origin/tree/main/plugins/hello) in the Origin repo — it demonstrates the same structure with detailed comments on every API surface.

## License

MIT
