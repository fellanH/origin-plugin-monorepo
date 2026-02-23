// Vendored from @origin-cards/api
// Once published to npm, replace this file with:
//   npm install @origin-cards/api
// and update imports to: import type { ... } from "@origin-cards/api"

import type React from "react";

/** Metadata declared by every plugin. Shown in the Launcher UI. */
export interface PluginManifest {
  /** Reverse-domain unique identifier, e.g. "com.example.myplugin" */
  id: string;
  /** Human-readable name shown in the Launcher */
  name: string;
  version: string;
  description?: string;
  /** Emoji or relative image path shown in the Launcher grid */
  icon?: string;
}

/** Runtime context injected by PluginHost into every plugin component */
export interface PluginContext {
  /** Unique ID of the card this instance is mounted in */
  cardId: string;
  /** Absolute path to the workspace root directory (for file I/O) */
  workspacePath: string;
  /** Current app theme */
  theme: "light" | "dark";
}

export type PluginComponent = React.ComponentType<{ context: PluginContext }>;

export interface PluginModule {
  default: PluginComponent;
  manifest: PluginManifest;
}
