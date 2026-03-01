# origin-plugin-monorepo

The official plugin collection for [Origin](https://github.com/fellanH/origin) — and the **canonical starting point for external plugin development**.

If you want to build a plugin for Origin, **start here**. Clone this repo, copy `packages/template`, and follow the [Getting started](#getting-started) instructions below.

> **Note — origin/packages/template/**
> The main Origin repo contains a minimal in-tree template at [`packages/template/`](https://github.com/fellanH/origin/tree/main/packages/template). That template is an internal reference used by the Origin core team and does not include the full development tooling (DevShell, watch-install, mock PluginContext) provided by this repo. External plugin authors should always use this monorepo as their starting point. See [fellanH/origin#122](https://github.com/fellanH/origin/issues/122) for background.

## Packages

| Package                  | npm                                                                                                   | Description                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `@origin-cards/api`      | [![npm](https://img.shields.io/npm/v/@origin-cards/api)](https://npmjs.com/package/@origin-cards/api) | Plugin context types and channel registry          |
| `@origin-cards/sdk`      | [![npm](https://img.shields.io/npm/v/@origin-cards/sdk)](https://npmjs.com/package/@origin-cards/sdk) | fs, dialog, invoke, event helpers                  |
| `@origin-cards/template` | —                                                                                                     | Blank starter — copy this to build your own plugin |
| `@origin-cards/notepad`  | —                                                                                                     | Notepad plugin                                     |
| `@origin-cards/filetree` | —                                                                                                     | File tree plugin                                   |
| `@origin-cards/monaco`   | —                                                                                                     | Monaco editor plugin                               |
| `@origin-cards/github`   | —                                                                                                     | GitHub PR/issue viewer plugin                      |
| `@origin-cards/terminal` | —                                                                                                     | Terminal plugin                                    |

## Getting started

To build a new plugin, copy the template:

```bash
git clone https://github.com/fellanH/origin-plugin-monorepo
cd origin-plugin-monorepo
cp -r packages/template packages/my-plugin
# Edit packages/my-plugin/src/manifest.ts
npm install
npm run build --workspace packages/my-plugin
```

## Development

```bash
npm install        # install all workspace deps
npm run build      # build all packages in dependency order
npm run typecheck  # typecheck all packages
```
