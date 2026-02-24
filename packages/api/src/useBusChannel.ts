import { useCallback } from "react";
import { useSyncExternalStore } from "react";
import type { OriginChannelMap, PluginBus } from "./plugin";

/**
 * Reactively subscribe to a typed bus channel. Re-renders whenever a new value
 * is published. Returns `undefined` before the first publish.
 *
 * Channel names are constrained to `keyof OriginChannelMap` — misspelled
 * channel names are compile errors. Plugins extend `OriginChannelMap` via
 * declaration merging in their own `channels.d.ts`.
 *
 * @example
 * const event = useBusChannel(context.bus, "com.origin.app:theme-changed");
 * // event: { theme: "light" | "dark" } | undefined
 */
export function useBusChannel<K extends keyof OriginChannelMap>(
  bus: PluginBus,
  channel: K,
): OriginChannelMap[K] | undefined {
  const subscribe = useCallback(
    (notify: () => void) => bus.subscribe(channel, notify),
    [bus, channel],
  );
  return useSyncExternalStore(subscribe, () => bus.read(channel));
}
