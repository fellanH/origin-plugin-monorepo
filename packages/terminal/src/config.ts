import type { ITheme } from "@xterm/xterm";

/** Per-card terminal configuration persisted to context.config. */
export interface TerminalConfig {
  shell: string; // default: "" (system default — $SHELL or /bin/zsh)
  fontSize: number; // default: 13
  fontFamily: string; // default: "monospace"
  theme: "app" | "dark" | "light" | "custom"; // default: "app" (follows app theme)
  startingDir: "workspace" | string; // default: "workspace" (workspace root)
  followActivePath: boolean; // default: false
  scrollbackLines: number; // default: 10_000
}

export const DEFAULTS: TerminalConfig = {
  shell: "",
  fontSize: 13,
  fontFamily: "monospace",
  theme: "app",
  startingDir: "workspace",
  followActivePath: false,
  scrollbackLines: 10_000,
};

/**
 * Read a typed TerminalConfig from the raw context.config record,
 * falling back to defaults for missing / mistyped values.
 */
export function resolveConfig(raw: Record<string, unknown>): TerminalConfig {
  return {
    shell: typeof raw.shell === "string" ? raw.shell : DEFAULTS.shell,
    fontSize: typeof raw.fontSize === "number" && raw.fontSize > 0 ? raw.fontSize : DEFAULTS.fontSize,
    fontFamily: typeof raw.fontFamily === "string" && raw.fontFamily.length > 0 ? raw.fontFamily : DEFAULTS.fontFamily,
    theme: isValidTheme(raw.theme) ? raw.theme : DEFAULTS.theme,
    startingDir: typeof raw.startingDir === "string" && raw.startingDir.length > 0 ? raw.startingDir : DEFAULTS.startingDir,
    followActivePath: typeof raw.followActivePath === "boolean" ? raw.followActivePath : DEFAULTS.followActivePath,
    scrollbackLines:
      typeof raw.scrollbackLines === "number" && raw.scrollbackLines > 0
        ? raw.scrollbackLines
        : DEFAULTS.scrollbackLines,
  };
}

function isValidTheme(v: unknown): v is TerminalConfig["theme"] {
  return v === "app" || v === "dark" || v === "light" || v === "custom";
}

// ---------------------------------------------------------------------------
// xterm theme helpers
// ---------------------------------------------------------------------------

const DARK_THEME: ITheme = {
  background: "#1e1e1e",
  foreground: "#d4d4d4",
  cursor: "#d4d4d4",
  cursorAccent: "#1e1e1e",
  selectionBackground: "#264f78",
};

const LIGHT_THEME: ITheme = {
  background: "#ffffff",
  foreground: "#333333",
  cursor: "#333333",
  cursorAccent: "#ffffff",
  selectionBackground: "#add6ff",
  selectionForeground: "#333333",
};

/**
 * Map the config theme mode + current app theme to an xterm ITheme.
 * `custom` currently falls back to the dark palette.
 */
export function resolveXtermTheme(
  themeMode: TerminalConfig["theme"],
  appTheme: "light" | "dark",
): ITheme {
  const effective = themeMode === "app" ? appTheme : themeMode === "custom" ? "dark" : themeMode;
  return effective === "light" ? { ...LIGHT_THEME } : { ...DARK_THEME };
}

/** Background colour matching the resolved xterm theme. */
export function resolveBackground(
  themeMode: TerminalConfig["theme"],
  appTheme: "light" | "dark",
): string {
  const effective = themeMode === "app" ? appTheme : themeMode === "custom" ? "dark" : themeMode;
  return effective === "light" ? "#ffffff" : "#1e1e1e";
}
