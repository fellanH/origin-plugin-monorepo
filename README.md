# origin-plugin-starter

[![CI](https://github.com/fellanH/origin-plugin-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/fellanH/origin-plugin-starter/actions/workflows/ci.yml)
[![Use this template](https://img.shields.io/badge/use%20this%20template-2ea44f?logo=github)](https://github.com/fellanH/origin-plugin-starter/generate)

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

## Hot-reload development

Run `npm run dev:watch` to watch for changes and auto-install to origin.

origin detects the `.hotreload` sentinel file and reloads the plugin without restarting the app.

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
npm run build
npm run install:origin
```

Copies `dist/` to Origin's AppData plugins directory:

- **macOS:** `~/Library/Application Support/com.klarhimmel.origin/plugins/{id}/`
- **Windows:** `%APPDATA%\com.klarhimmel.origin\plugins\{id}\`
- **Linux:** `~/.local/share/com.klarhimmel.origin/plugins/{id}/`

Restart Origin to see your plugin.

### Watch mode

For faster iteration, pair Vite's watch mode with the watch installer:

```bash
# Terminal 1 — rebuild on every file save
npm run build -- --watch

# Terminal 2 — re-install whenever dist/ changes
npm run install:watch
```

Then restart Origin after each install to pick up changes.

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

## Saving plugin data

Use `context.workspacePath` as the root for any data your plugin persists. It points to Origin's workspace directory, which is guaranteed to exist.

```tsx
import { join } from "@tauri-apps/api/path";
import { readTextFile, writeTextFile, mkdir } from "@tauri-apps/plugin-fs";

export default function MyPlugin({ context }: { context: PluginContext }) {
  async function saveData(data: object) {
    // Create a plugin-specific subdirectory
    const dir = await join(context.workspacePath, "plugins", "com.yourname.myplugin");
    await mkdir(dir, { recursive: true });

    const file = await join(dir, "data.json");
    await writeTextFile(file, JSON.stringify(data, null, 2));
  }

  async function loadData() {
    const file = await join(context.workspacePath, "plugins", "com.yourname.myplugin", "data.json");
    const raw = await readTextFile(file);
    return JSON.parse(raw);
  }

  // ...
}
```

> **Tip:** Namespace your data directory with your plugin ID (e.g. `plugins/com.yourname.myplugin/`) to avoid conflicts with other plugins.

## Theme-aware styling

`context.theme` is `"light"` or `"dark"`. Use it to switch styles at mount time:

```tsx
const styles = {
  light: {
    background: "#ffffff",
    color: "#18181b",
  },
  dark: {
    background: "#18181b",
    color: "#f4f4f5",
  },
};

export default function MyPlugin({ context }: { context: PluginContext }) {
  return (
    <div style={styles[context.theme]}>
      <p>Current theme: {context.theme}</p>
    </div>
  );
}
```

> **Note:** `context.theme` reflects the theme at mount time. Origin does not currently send reactive theme updates to running plugins — if the user switches theme, the plugin will be remounted with the new value.

## Tauri APIs

Plugins run inside Origin's WebView and have access to Tauri's JavaScript APIs. Add `@tauri-apps/api` and `@tauri-apps/plugin-fs` as **devDependencies** — they are provided by the host app at runtime:

```bash
npm install --save-dev @tauri-apps/api @tauri-apps/plugin-fs
```

> Add as `devDependency`, not `dependency`. Bundling these would duplicate the runtime code already provided by Origin.

The following Tauri APIs are available:

- **`@tauri-apps/api/path`** — path manipulation utilities (`join`, `homeDir`, etc.)
- **`@tauri-apps/plugin-fs`** — file system access (`readTextFile`, `writeTextFile`, `mkdir`, etc.)
- **`@tauri-apps/api/event`** — event system for communicating between plugins and the Tauri backend

Note: Origin's `tauri.conf.json` controls which Tauri capabilities are granted. Some APIs may require Origin to explicitly allow them. If a Tauri API call fails with a permissions error, check the [Origin capabilities config](https://github.com/fellanH/origin).

## Error handling

Origin wraps each plugin in an error boundary — if your plugin throws an unhandled error, Origin catches it and shows an error card rather than crashing the entire app.

For defensive plugins that need custom fallback UI, implement your own error boundary:

```tsx
import React from "react";
import type { PluginContext } from "./types/origin-api";

interface State {
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "1rem", fontSize: "0.875rem", opacity: 0.6 }}>
          Something went wrong: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function MyPlugin({ context }: { context: PluginContext }) {
  return (
    <ErrorBoundary>
      <MyPluginInner context={context} />
    </ErrorBoundary>
  );
}

function MyPluginInner({ context }: { context: PluginContext }) {
  // your actual plugin logic
  return <div>{context.cardId}</div>;
}
```

## Versioning

Use [semantic versioning](https://semver.org) for `manifest.version`:

| Change                                              | Bump  | Example           |
| --------------------------------------------------- | ----- | ----------------- |
| Breaking change to plugin behavior or manifest `id` | major | `0.1.0` → `1.0.0` |
| New feature, backwards-compatible                   | minor | `1.0.0` → `1.1.0` |
| Bug fix, typo, cosmetic                             | patch | `1.1.0` → `1.1.1` |

> **Important:** The manifest `id` is Origin's stable identifier for your plugin. Changing it is a breaking change — it will appear as a new, unrecognized plugin in Origin.

Keep a `CHANGELOG.md` to communicate changes to users:

```markdown
## [1.1.0] - 2025-06-01

### Added

- Dark mode support via context.theme

## [1.0.0] - 2025-05-01

### Changed

- Stable release — renamed plugin id to com.yourname.myplugin
```

## Development scripts

| Script                   | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `npm run dev`            | Start DevShell with hot reload                  |
| `npm run build`          | Build plugin to `dist/`                         |
| `npm run lint`           | Run ESLint on `src/`                            |
| `npm run format`         | Format `src/` with Prettier                     |
| `npm test`               | Run Vitest unit tests                           |
| `npm run install:origin` | Install built plugin into Origin                |
| `npm run install:watch`  | Watch `dist/` and re-install on changes         |
| `npm run dev:watch`      | Build + install in watch mode with HMR sentinel |

## Types

`src/types/origin-api.ts` contains a vendored copy of the Origin plugin API types (`PluginManifest`, `PluginContext`, `PluginComponent`, `PluginModule`). Update it when the API changes.

> **Future:** Once `@origin/api` is published to npm, you can replace this file:
>
> ```bash
> npm install @origin/api
> ```
>
> Then update imports from `"./types/origin-api"` to `"@origin/api"` and delete `src/types/origin-api.ts`.
> See: [origin#tracking-issue](https://github.com/fellanH/origin) <!-- TODO: link to specific tracking issue once created -->

## Requirements

- Node.js 18+
- [Origin](https://github.com/fellanH/origin) desktop app (for `install:origin`)

## Reference

See the [hello plugin](https://github.com/fellanH/origin/tree/main/plugins/hello) in the Origin repo — it demonstrates the same structure with detailed comments on every API surface.

## Discoverability

Tag your plugin repo with the `origin-plugin` GitHub topic so users can find it via GitHub search.

Browse community plugins: [github.com/fellanH/origin/blob/main/PLUGINS.md](https://github.com/fellanH/origin/blob/main/PLUGINS.md)

## License

MIT
