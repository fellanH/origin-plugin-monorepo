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

import { useEffect, useRef } from "react";
import { invoke, onEvent } from "@origin-cards/sdk";
import type { IframePluginContextWithConfig } from "@origin-cards/sdk";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { ClipboardAddon } from "@xterm/addon-clipboard";
import "@xterm/xterm/css/xterm.css";

export default function TerminalPlugin({ context }: { context: IframePluginContextWithConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      fontFamily: "monospace",
      fontSize: 13,
      theme: { background: "#1e1e1e" },
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    const clipboardAddon = new ClipboardAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(clipboardAddon);

    const webglAddon = new WebglAddon();
    webglAddon.onContextLoss(() => webglAddon.dispose());
    term.loadAddon(webglAddon);

    term.open(container);
    fitAddon.fit();

    const { cols, rows } = term;

    // Subscribe to PTY data stream via the SDK event bridge.
    // The host proxies pty:data events from the Rust PTY channel.
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

    // pty_spawn no longer receives a Channel object — PTY data arrives via
    // the ORIGIN_EVENT bridge subscribed above.
    invoke("pty_spawn", {
      id: context.cardId,
      cols,
      rows,
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
      term.dispose();
      invoke("pty_destroy", { id: context.cardId }).catch(console.error);
    };
  }, [context.cardId]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", background: "#1e1e1e" }} />
  );
}
