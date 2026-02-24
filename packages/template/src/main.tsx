// Re-export manifest so Origin can read metadata without fully loading the plugin.
export { manifest } from "./manifest";

// TODO: Import PluginContext from "@origin-cards/api" once published to npm.
// Phase 2 will replace this inline type with the real package import.
export interface PluginContext {
  cardId: string;
  workspacePath: string;
  theme: "light" | "dark";
}

export default function TemplatePlugin({ context }: { context: PluginContext }) {
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
        background: context.theme === "dark" ? "#18181b" : "#ffffff",
        color: context.theme === "dark" ? "#f4f4f5" : "#18181b",
      }}
    >
      <p style={{ margin: 0, fontWeight: 500 }}>Hello from Template Plugin</p>
      <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.5 }}>
        card: {context.cardId}
      </p>
    </div>
  );
}
