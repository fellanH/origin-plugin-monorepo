import { useState } from "react";
import type { PluginContext } from "../src/types/origin-api";
import { manifest } from "../src/manifest";
import MyPlugin from "../src/index";

const MOCK_WORKSPACE_PATH =
  typeof process !== "undefined"
    ? process.env.HOME + "/Library/Application Support/com.klarhimmel.origin"
    : "~/Library/Application Support/com.klarhimmel.origin";

const MOCK_CARD_ID = "card-dev-preview";

export default function DevShell() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [contextOpen, setContextOpen] = useState(false);

  const mockContext: PluginContext = {
    cardId: MOCK_CARD_ID,
    workspacePath: MOCK_WORKSPACE_PATH,
    theme,
  };

  const isDark = theme === "dark";

  return (
    <div
      style={{ fontFamily: "system-ui, sans-serif" }}
      className={isDark ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100 text-zinc-900"}
    >
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          gap: "1rem",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            width: "100%",
            maxWidth: "520px",
          }}
        >
          <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>
            DevShell — {manifest.name} v{manifest.version}
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            style={{
              fontSize: "0.75rem",
              padding: "0.25rem 0.75rem",
              borderRadius: "4px",
              border: "1px solid",
              borderColor: isDark ? "#3f3f46" : "#d4d4d8",
              background: "transparent",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            {isDark ? "Light" : "Dark"}
          </button>
        </div>

        {/* Plugin card — simulates Origin's Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            height: "360px",
            borderRadius: "8px",
            border: "1px solid",
            borderColor: isDark ? "#27272a" : "#e4e4e7",
            overflow: "hidden",
            background: isDark ? "#18181b" : "#ffffff",
          }}
        >
          <MyPlugin context={mockContext} />
        </div>

        {/* Collapsible context inspector */}
        <div style={{ width: "100%", maxWidth: "520px" }}>
          <button
            onClick={() => setContextOpen((o) => !o)}
            style={{
              fontSize: "0.7rem",
              opacity: 0.4,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "inherit",
            }}
          >
            {contextOpen ? "▾" : "▸"} PluginContext
          </button>
          {contextOpen && (
            <pre
              style={{
                marginTop: "0.5rem",
                fontSize: "0.7rem",
                opacity: 0.6,
                background: isDark ? "#27272a" : "#f4f4f5",
                borderRadius: "4px",
                padding: "0.75rem",
                overflow: "auto",
              }}
            >
              {JSON.stringify(mockContext, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
