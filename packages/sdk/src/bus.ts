import { useEffect, useCallback } from "react";
import type { HostToPluginMessage } from "@origin-cards/api";

/**
 * Subscribe to a named bus channel inside an L1 iframe plugin.
 *
 * @param channel - Channel name to subscribe to.
 * @param handler - Optional callback invoked when a message arrives on the channel.
 * @returns publish function to send a payload on the channel.
 */
export function useBusChannel(
  channel: string,
  handler?: (payload: unknown) => void,
): (payload: unknown) => void {
  useEffect(() => {
    window.parent.postMessage({ type: "ORIGIN_BUS_SUBSCRIBE", channel }, "*");

    function onMessage(event: MessageEvent) {
      const msg = event.data as HostToPluginMessage;
      if (
        msg.type === "ORIGIN_BUS_EVENT" &&
        msg.channel === channel &&
        handler
      ) {
        handler(msg.payload);
      }
    }

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
      window.parent.postMessage(
        { type: "ORIGIN_BUS_UNSUBSCRIBE", channel },
        "*",
      );
    };
  }, [channel, handler]);

  const publish = useCallback(
    (payload: unknown) => {
      window.parent.postMessage(
        { type: "ORIGIN_BUS_PUBLISH", channel, payload },
        "*",
      );
    },
    [channel],
  );

  return publish;
}
