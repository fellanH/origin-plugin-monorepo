// NOTE: This plugin replaces direct Tauri `invoke` / `Channel` usage with
// @origin-cards/sdk wrappers so it runs inside a sandboxed L1 iframe.
//
// PTY integration status:
//   - pty_spawn / pty_write / pty_resize / pty_destroy → proxied via sdk `invoke`
//   - PTY data streaming → proxied via sdk `onEvent("pty:data", ...)` which sends
//     ORIGIN_EVENT_SUBSCRIBE to the host; the host must implement the
//     ORIGIN_STREAM bridge in IframePluginHost.tsx (Phase 4 of the monorepo plan).
//   - The host-side streaming bridge (IframePluginHost.tsx) is NOT yet implemented
//     in origin/; when it is, this plugin will receive live PTY output without
//     any changes here.

import { useEffect, useRef, useState, useCallback } from "react";
import { invoke, onEvent, useBusChannel } from "@origin-cards/sdk";
import type { IframePluginContextWithConfig } from "@origin-cards/sdk";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { ClipboardAddon } from "@xterm/addon-clipboard";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { ImageAddon } from "@xterm/addon-image";
import "@xterm/xterm/css/xterm.css";

import { resolveConfig, resolveXtermTheme, resolveBackground } from "./config";
import type { TerminalConfig } from "./config";
import TerminalConfigPanel from "./TerminalConfigPanel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the parent directory from a path. */
function dirname(path: string): string {
  const sep = path.includes("\\") ? "\\" : "/";
  const parts = path.split(sep);
  parts.pop();
  return parts.join(sep) || sep;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TerminalPlugin({ context }: { context: IframePluginContextWithConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const [configOpen, setConfigOpen] = useState(false);
  const [restartKey, setRestartKey] = useState(0);

  // Resolve typed config from the raw context.config record.
  const config = resolveConfig(context.config);
  const configRef = useRef(config);
  configRef.current = config;

  // ------------------------------------------------------------------
  // Terminal lifecycle — create / destroy
  // Depends on cardId + restartKey so the user can restart the PTY.
  // ------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cfg = configRef.current;
    const xtermTheme = resolveXtermTheme(cfg.theme, context.theme);

    const term = new Terminal({
      fontFamily: cfg.fontFamily,
      fontSize: cfg.fontSize,
      theme: xtermTheme,
      cursorBlink: true,
      scrollback: cfg.scrollbackLines,
    });

    const fitAddon = new FitAddon();
    const clipboardAddon = new ClipboardAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();
    const unicode11Addon = new Unicode11Addon();
    const imageAddon = new ImageAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(clipboardAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);
    term.loadAddon(unicode11Addon);
    term.loadAddon(imageAddon);

    // Activate Unicode 11 for proper wide-char / emoji rendering.
    term.unicode.activeVersion = "11";

    const webglAddon = new WebglAddon();
    webglAddon.onContextLoss(() => webglAddon.dispose());
    term.loadAddon(webglAddon);

    term.open(container);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const { cols, rows } = term;

    // Subscribe to PTY data stream via the SDK event bridge.
    const unsubPty = onEvent("pty:data", { id: context.cardId }, (payload) => {
      const data = (payload as { data: number[] }).data;
      term.write(new Uint8Array(data));
    });

    term.onData((data) => {
      invoke("pty_write", {
        id: context.cardId,
        data: Array.from(new TextEncoder().encode(data)),
      }).catch(console.error);
    });

    // Resolve starting directory.
    const cwd = cfg.startingDir === "workspace" ? context.workspacePath : cfg.startingDir;

    invoke("pty_spawn", {
      id: context.cardId,
      cols,
      rows,
      ...(cfg.shell ? { shell: cfg.shell } : {}),
      cwd,
      env: {
        TERM_PROGRAM_VERSION: "0.1.0",
      },
    }).catch(console.error);

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        fitAddon.fit();
        invoke("pty_resize", {
          id: context.cardId,
          cols: term.cols,
          rows: term.rows,
        }).catch(console.error);
      }, 50);
    });
    ro.observe(container);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      ro.disconnect();
      unsubPty();
      termRef.current = null;
      fitAddonRef.current = null;
      term.dispose();
      invoke("pty_destroy", { id: context.cardId }).catch(console.error);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.cardId, restartKey]);

  // ------------------------------------------------------------------
  // Dynamic option updates (no PTY restart required)
  // ------------------------------------------------------------------

  // Font size
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.fontSize = config.fontSize;
    fitAddonRef.current?.fit();
  }, [config.fontSize]);

  // Font family
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.fontFamily = config.fontFamily;
    fitAddonRef.current?.fit();
  }, [config.fontFamily]);

  // Theme
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.theme = resolveXtermTheme(config.theme, context.theme);
  }, [config.theme, context.theme]);

  // Scrollback
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.scrollback = config.scrollbackLines;
  }, [config.scrollbackLines]);

  // ------------------------------------------------------------------
  // Follow active path
  // ------------------------------------------------------------------

  const followRef = useRef(config.followActivePath);
  followRef.current = config.followActivePath;

  const handleActivePath = useCallback(
    (payload: unknown) => {
      if (!followRef.current) return;
      const { path, type } = payload as { path: string; type: "file" | "directory" };
      const dir = type === "directory" ? path : dirname(path);
      // Escape single quotes in the path for safe shell interpolation.
      const escaped = dir.replace(/'/g, "'\\''");
      invoke("pty_write", {
        id: context.cardId,
        data: Array.from(new TextEncoder().encode(`cd '${escaped}'\r`)),
      }).catch(console.error);
    },
    [context.cardId],
  );

  useBusChannel("origin:workspace/active-path", handleActivePath);

  // ------------------------------------------------------------------
  // Config panel callbacks
  // ------------------------------------------------------------------

  const handleConfigUpdate = useCallback(
    (patch: Partial<TerminalConfig>) => {
      context.setConfig(patch as Record<string, unknown>);
    },
    [context],
  );

  const handleRestart = useCallback(() => {
    setRestartKey((k) => k + 1);
  }, []);

  const handleCloseConfig = useCallback(() => {
    setConfigOpen(false);
  }, []);

  // ------------------------------------------------------------------
  // Resolve background for the container div (keeps it in sync with theme).
  // ------------------------------------------------------------------

  const bg = resolveBackground(config.theme, context.theme);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", background: bg }} />

      {/* Gear icon — toggle config panel */}
      <button
        onClick={() => setConfigOpen((o) => !o)}
        title="Terminal settings"
        aria-label="Terminal settings"
        style={{
          position: "absolute",
          top: 4,
          right: configOpen ? 286 : 6,
          zIndex: 101,
          background: "rgba(128,128,128,0.25)",
          border: "none",
          borderRadius: 4,
          color: "#ccc",
          cursor: "pointer",
          fontSize: 15,
          lineHeight: 1,
          padding: "3px 5px",
          transition: "right 0.15s ease, opacity 0.15s ease",
          opacity: 0.5,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
      >
        ⚙
      </button>

      {configOpen && (
        <TerminalConfigPanel
          config={config}
          isDark={resolveBackground(config.theme, context.theme) !== "#ffffff"}
          onUpdate={handleConfigUpdate}
          onRestart={handleRestart}
          onClose={handleCloseConfig}
        />
      )}
    </div>
  );
}
