import { useState, useEffect, useCallback } from "react";
import type { IframePluginContext, HostToPluginMessage } from "@origin-cards/api";

/**
 * Extended context type returned by usePluginContext.
 * Adds a setConfig helper that sends ORIGIN_CONFIG_SET to the host.
 */
export interface IframePluginContextWithConfig extends IframePluginContext {
  setConfig: (patch: Record<string, unknown>) => void;
}

/**
 * Returns the plugin context injected by the host via postMessage.
 * Returns null until the ORIGIN_INIT message is received.
 * Automatically posts ORIGIN_READY on mount.
 *
 * The returned object includes a stable `setConfig` function that sends a
 * shallow config patch to the host, which persists it in the workspace store.
 */
export function usePluginContext(): IframePluginContextWithConfig | null {
  const [context, setContext] = useState<IframePluginContext | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const msg = event.data as HostToPluginMessage;
      if (msg.type === "ORIGIN_INIT") {
        setContext(msg.context);
      } else if (msg.type === "ORIGIN_THEME_CHANGE") {
        setContext((prev) => (prev ? { ...prev, theme: msg.theme } : prev));
      } else if (msg.type === "ORIGIN_CONFIG_UPDATE") {
        setContext((prev) => (prev ? { ...prev, config: msg.config } : prev));
      }
    }

    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "ORIGIN_READY" }, "*");

    return () => window.removeEventListener("message", onMessage);
  }, []);

  const setConfig = useCallback((patch: Record<string, unknown>) => {
    window.parent.postMessage({ type: "ORIGIN_CONFIG_SET", patch }, "*");
  }, []);

  if (!context) return null;
  return { ...context, setConfig };
}
