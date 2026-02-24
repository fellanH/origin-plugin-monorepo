// Re-export manifest so Origin can read metadata without fully loading the plugin.
export { manifest } from "./manifest";

import type { PluginContext } from "./types/origin-api";

export default function MyPlugin({ context }: { context: PluginContext }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "0.5rem",
        padding: "1rem",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.875rem",
      }}
    >
      <p style={{ margin: 0, fontWeight: 500 }}>Hello from my plugin 👋</p>
      <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.5 }}>card: {context.cardId}</p>
    </div>
  );
}
