import type { HostToPluginMessage } from "@origin-cards/api";

/**
 * Proxy a Tauri command through the shell via the ORIGIN_INVOKE protocol.
 *
 * Sends an `ORIGIN_INVOKE` postMessage to the host and waits for the matching
 * `ORIGIN_INVOKE_RESULT` or `ORIGIN_INVOKE_ERROR` response. Uses a UUID
 * correlation ID internally.
 *
 * The plugin must declare the required capability in its manifest
 * (`requiredCapabilities`) — the shell will reject the call otherwise.
 *
 * @param command - Tauri command name, e.g. `"plugin:fs|read_text_file"`.
 * @param args    - Optional named arguments forwarded to the command.
 * @returns       A Promise that resolves with the command result or rejects
 *                with the error message sent by the host.
 *
 * @example
 * const text = await invoke<string>("plugin:fs|read_text_file", { path: "/etc/hosts" });
 */
export function invoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = crypto.randomUUID();

    function onMessage(event: MessageEvent) {
      const msg = event.data as HostToPluginMessage;
      if (msg.type === "ORIGIN_INVOKE_RESULT" && msg.id === id) {
        window.removeEventListener("message", onMessage);
        resolve(msg.result as T);
      } else if (msg.type === "ORIGIN_INVOKE_ERROR" && msg.id === id) {
        window.removeEventListener("message", onMessage);
        reject(new Error(msg.error));
      }
    }

    window.addEventListener("message", onMessage);

    window.parent.postMessage({ type: "ORIGIN_INVOKE", id, command, args: args ?? {} }, "*");
  });
}
