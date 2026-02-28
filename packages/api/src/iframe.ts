// Types shared between the origin shell and L1 plugins.
// COMMAND_CAPABILITY_MAP and EVENT_CAPABILITY_MAP stay in origin/src/lib/iframeProtocol.ts
// (they are runtime constants that belong in the host, not the public API).

export interface IframePluginContext {
  cardId: string;
  workspacePath: string;
  theme: "light" | "dark";
  config: Record<string, unknown>;
}

export type HostToPluginMessage =
  | { type: "ORIGIN_INIT"; context: IframePluginContext }
  | { type: "ORIGIN_BUS_EVENT"; channel: string; payload: unknown }
  | { type: "ORIGIN_THEME_CHANGE"; theme: "light" | "dark" }
  | { type: "ORIGIN_CONFIG_UPDATE"; config: Record<string, unknown> }
  | { type: "ORIGIN_INVOKE_RESULT"; id: string; result: unknown }
  | { type: "ORIGIN_INVOKE_ERROR"; id: string; error: string }
  | { type: "ORIGIN_EVENT"; subscriptionId: string; payload: unknown };

export type PluginToHostMessage =
  | { type: "ORIGIN_READY" }
  | { type: "ORIGIN_BUS_PUBLISH"; channel: string; payload: unknown }
  | { type: "ORIGIN_BUS_SUBSCRIBE"; channel: string }
  | { type: "ORIGIN_BUS_UNSUBSCRIBE"; channel: string }
  | { type: "ORIGIN_CONFIG_SET"; patch: Record<string, unknown> }
  | { type: "ORIGIN_INVOKE"; id: string; command: string; args: Record<string, unknown> }
  | {
      type: "ORIGIN_EVENT_SUBSCRIBE";
      subscriptionId: string;
      event: string;
      args?: Record<string, unknown>;
    }
  | { type: "ORIGIN_EVENT_UNSUBSCRIBE"; subscriptionId: string };
