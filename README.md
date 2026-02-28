# origin-plugin-monorepo

The official plugin collection for [Origin](https://github.com/fellanH/origin) — and the starting point for building your own.

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
