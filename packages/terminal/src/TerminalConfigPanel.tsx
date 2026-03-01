import { useEffect, useState } from "react";
import type { TerminalConfig } from "./config";
import { DEFAULTS } from "./config";
import { detectShells } from "./shells";

interface Props {
  config: TerminalConfig;
  isDark: boolean;
  onUpdate: (patch: Partial<TerminalConfig>) => void;
  onRestart: () => void;
  onClose: () => void;
}

export default function TerminalConfigPanel({ config, isDark, onUpdate, onRestart, onClose }: Props) {
  const [shells, setShells] = useState<string[]>([]);

  useEffect(() => {
    detectShells().then(setShells).catch(() => setShells(["/bin/zsh", "/bin/bash", "/bin/sh"]));
  }, []);

  // ---------------------------------------------------------------------------
  // Styles — inline to avoid requiring Tailwind / external CSS in the terminal
  // plugin. Colours adapt to isDark.
  // ---------------------------------------------------------------------------
  const bg = isDark ? "#252526" : "#f3f3f3";
  const fg = isDark ? "#cccccc" : "#333333";
  const border = isDark ? "#3c3c3c" : "#d4d4d4";
  const inputBg = isDark ? "#1e1e1e" : "#ffffff";
  const inputBorder = isDark ? "#555" : "#bbb";
  const hoverBg = isDark ? "#2a2d2e" : "#e8e8e8";

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    right: 0,
    width: 280,
    height: "100%",
    background: bg,
    color: fg,
    borderLeft: `1px solid ${border}`,
    display: "flex",
    flexDirection: "column",
    fontSize: 12,
    fontFamily: "system-ui, -apple-system, sans-serif",
    zIndex: 100,
    overflow: "auto",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderBottom: `1px solid ${border}`,
    fontWeight: 600,
    fontSize: 13,
  };

  const sectionStyle: React.CSSProperties = {
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  const labelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  };

  const labelTextStyle: React.CSSProperties = {
    fontWeight: 500,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    opacity: 0.7,
  };

  const inputStyle: React.CSSProperties = {
    background: inputBg,
    color: fg,
    border: `1px solid ${inputBorder}`,
    borderRadius: 3,
    padding: "4px 6px",
    fontSize: 12,
    outline: "none",
    fontFamily: "inherit",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
  };

  const checkboxRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const btnStyle: React.CSSProperties = {
    background: isDark ? "#0e639c" : "#007acc",
    color: "#fff",
    border: "none",
    borderRadius: 3,
    padding: "5px 10px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const closeBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: fg,
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    padding: "2px 4px",
    borderRadius: 3,
  };

  const shellValue = config.shell || "(system default)";

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span>Terminal Settings</span>
        <button
          style={closeBtnStyle}
          onClick={onClose}
          title="Close settings"
          aria-label="Close settings"
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          ✕
        </button>
      </div>

      <div style={sectionStyle}>
        {/* Shell */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>Shell</span>
          <select
            style={selectStyle}
            value={config.shell}
            onChange={(e) => onUpdate({ shell: e.target.value })}
          >
            <option value="">System default</option>
            {shells.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {/* Font Size */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>Font Size</span>
          <input
            type="number"
            style={inputStyle}
            min={8}
            max={32}
            value={config.fontSize}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (v >= 8 && v <= 32) onUpdate({ fontSize: v });
            }}
          />
        </label>

        {/* Font Family */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>Font Family</span>
          <input
            type="text"
            style={inputStyle}
            value={config.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          />
        </label>

        {/* Theme */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>Theme</span>
          <select
            style={selectStyle}
            value={config.theme}
            onChange={(e) => onUpdate({ theme: e.target.value as TerminalConfig["theme"] })}
          >
            <option value="app">Follow app theme</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        {/* Starting Directory */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>Starting Directory</span>
          <input
            type="text"
            style={inputStyle}
            value={config.startingDir}
            placeholder="workspace"
            onChange={(e) => onUpdate({ startingDir: e.target.value || "workspace" })}
          />
          <span style={{ fontSize: 10, opacity: 0.5 }}>
            Use &quot;workspace&quot; for the workspace root, or an absolute path.
          </span>
        </label>

        {/* Follow Active Path */}
        <label style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={config.followActivePath}
            onChange={(e) => onUpdate({ followActivePath: e.target.checked })}
          />
          <span>Follow active path</span>
        </label>
        <span style={{ fontSize: 10, opacity: 0.5, marginTop: -6 }}>
          Auto-cd when the workspace active file changes.
        </span>

        {/* Scrollback Lines */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>Scrollback Lines</span>
          <input
            type="number"
            style={inputStyle}
            min={500}
            max={100_000}
            step={500}
            value={config.scrollbackLines}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (v >= 500 && v <= 100_000) onUpdate({ scrollbackLines: v });
            }}
          />
        </label>

        {/* Restart button */}
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button style={btnStyle} onClick={onRestart}>
            Restart Terminal
          </button>
        </div>
        <span style={{ fontSize: 10, opacity: 0.5 }}>
          Shell and starting directory changes take effect on restart.
        </span>
      </div>
    </div>
  );
}
