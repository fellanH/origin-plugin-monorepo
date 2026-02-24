import type React from "react";

/**
 * Open-ended channel registry. Each plugin extends this via declaration merging
 * in its own `channels.d.ts` — no central file needed.
 *
 * @example
 * // packages/filetree/src/channels.d.ts
 * declare module "@origin-cards/api" {
 *   interface OriginChannelMap {
 *     "com.origin.filetree:file-selected": { path: string; isDir: boolean };
 *   }
 * }
 */
export interface OriginChannelMap {
  /** Fired whenever the system theme switches. */
  "com.origin.app:theme-changed": { theme: "light" | "dark" };
  /**
   * Fired when the active path changes in the workspace — e.g. a file is
   * selected in FileTree. Monaco (and any other subscriber) opens the path.
   */
  "origin:workspace/active-path": {
    /** Absolute filesystem path. */
    path: string;
    type: "file" | "directory";
    /** Plugin ID of the publisher, e.g. "com.origin.filetree". */
    source: string;
  };
}

/** Pub/sub bus injected into every plugin via PluginContext. */
export interface PluginBus {
  /** Broadcast a value on a channel. Cached as the last value. */
  publish<K extends keyof OriginChannelMap>(
    channel: K,
    payload: OriginChannelMap[K],
  ): void;
  /** Subscribe to a channel. Returns an unsubscribe function. */
  subscribe<K extends keyof OriginChannelMap>(
    channel: K,
    handler: (payload: OriginChannelMap[K]) => void,
  ): () => void;
  /** Synchronously read the last published value on a channel. */
  read<K extends keyof OriginChannelMap>(
    channel: K,
  ): OriginChannelMap[K] | undefined;
}

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
  /**
   * Tauri capabilities this plugin uses. Declarative only in v0.x — displayed
   * in the plugin install UI so users can see what a plugin claims to need.
   * Enforced by the capability broker at marketplace launch (v1.0).
   * @example ["fs:read", "fs:write", "dialog:open"]
   */
  requiredCapabilities?: string[];
}

/** Panel lifecycle event names emitted by PluginHost. */
export type PluginLifecycleEvent =
  | "focus"
  | "blur"
  | "resize"
  | "zoom"
  | "zoom-exit";

/** Runtime context injected by PluginHost into every plugin component */
export interface PluginContext {
  /** Unique ID of the card this instance is mounted in */
  cardId: string;
  /** Absolute path to the workspace root directory (for file I/O) */
  workspacePath: string;
  /** Current app theme */
  theme: "light" | "dark";
  /** Inter-plugin communication bus scoped to this workspace */
  bus: PluginBus;
  /**
   * Per-instance plugin configuration. Persisted alongside the card in the
   * workspace store. Use setConfig to update — changes are shallow-merged.
   *
   * @example
   * const url = (context.config.url as string) ?? "http://localhost:3000";
   */
  config: Record<string, unknown>;
  /**
   * Shallow-merge a patch into this card's config. Persisted automatically.
   *
   * @example
   * context.setConfig({ url: "http://localhost:4000" });
   */
  setConfig: (patch: Record<string, unknown>) => void;
  /**
   * Subscribe to a panel lifecycle event.
   * Returns an unsubscribe function — call it in your plugin's cleanup.
   *
   * @example
   * useEffect(() => context.on('focus', () => console.log('focused')), []);
   */
  on(event: PluginLifecycleEvent, handler: () => void): () => void;
  /**
   * Proxy a Tauri command through the shell.
   * The plugin must declare the required capability in its manifest
   * (`requiredCapabilities`) — the shell will reject the call otherwise.
   *
   * @example
   * const result = await context.invoke<string>("plugin:fs|read_text_file", { path: "/etc/hosts" });
   */
  invoke<T = unknown>(
    command: string,
    args?: Record<string, unknown>,
  ): Promise<T>;
  /**
   * Subscribe to a named host-push event stream (e.g. `"pty:data"`).
   * Returns an unsubscribe function — call it in your plugin's cleanup.
   *
   * @example
   * useEffect(() => context.onEvent("pty:data", { sessionId }, ({ data }) => xterm.write(data)), []);
   */
  onEvent(
    event: string,
    args: Record<string, unknown>,
    handler: (payload: unknown) => void,
  ): () => void;
}

export type PluginComponent = React.ComponentType<{ context: PluginContext }>;

export interface PluginModule {
  default: PluginComponent;
  manifest: PluginManifest;
}
