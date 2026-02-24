import { useEffect } from "react";
import type { HostToPluginMessage } from "@origin-cards/api";

/**
 * Subscribe to a named host-push event stream (e.g. `"pty:data"`).
 *
 * Sends an `ORIGIN_EVENT_SUBSCRIBE` postMessage to the host and invokes
 * `handler` each time the host pushes a matching `ORIGIN_EVENT`. Returns a
 * cleanup function that sends `ORIGIN_EVENT_UNSUBSCRIBE` to the host.
 *
 * @param event   - Event name as registered on the host, e.g. `"pty:data"`.
 * @param args    - Optional named arguments forwarded to the subscription.
 * @param handler - Called with the event payload each time the event fires.
 * @returns       An unsubscribe function — call it in your cleanup.
 *
 * @example
 * const unsub = onEvent("pty:data", { sessionId }, ({ data }) => xterm.write(data));
 * // later:
 * unsub();
 */
export function onEvent(
  event: string,
  args: Record<string, unknown> | undefined,
  handler: (payload: unknown) => void,
): () => void {
  const subscriptionId = crypto.randomUUID();

  function onMessage(ev: MessageEvent) {
    const msg = ev.data as HostToPluginMessage;
    if (msg.type === "ORIGIN_EVENT" && msg.subscriptionId === subscriptionId) {
      handler(msg.payload);
    }
  }

  window.addEventListener("message", onMessage);

  window.parent.postMessage(
    { type: "ORIGIN_EVENT_SUBSCRIBE", subscriptionId, event, args },
    "*",
  );

  return () => {
    window.removeEventListener("message", onMessage);
    window.parent.postMessage(
      { type: "ORIGIN_EVENT_UNSUBSCRIBE", subscriptionId },
      "*",
    );
  };
}

/**
 * React hook that subscribes to a host-push event stream and cleans up on
 * unmount or when any argument changes.
 *
 * Wraps {@link onEvent} with a `useEffect` so subscriptions are automatically
 * torn down when the component unmounts or dependencies change.
 *
 * @param event   - Event name as registered on the host, e.g. `"pty:data"`.
 * @param args    - Named arguments forwarded to the subscription. Must be
 *                  stable across renders (wrap with `useMemo` or keep outside
 *                  the component) to avoid infinite re-subscription loops.
 * @param handler - Called with the event payload each time the event fires.
 *                  Must be stable (wrap with `useCallback`) to avoid loops.
 *
 * @example
 * useOriginEvent("pty:data", { sessionId }, useCallback(({ data }) => {
 *   xterm.write(new Uint8Array(data as number[]));
 * }, [xterm]));
 */
export function useOriginEvent(
  event: string,
  args: Record<string, unknown> | undefined,
  handler: (payload: unknown) => void,
): void {
  useEffect(() => {
    return onEvent(event, args, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, JSON.stringify(args), handler]);
}
