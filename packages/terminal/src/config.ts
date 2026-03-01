/** Per-card terminal configuration persisted to context.config. */
export interface TerminalConfig {
  /** Whether to cd when the workspace active path changes. Default: false. */
  followActivePath: boolean;
}

export const DEFAULTS: TerminalConfig = {
  followActivePath: false,
};

/**
 * Read a typed TerminalConfig from the raw context.config record,
 * falling back to defaults for missing / mistyped values.
 */
export function resolveConfig(raw: Record<string, unknown>): TerminalConfig {
  return {
    followActivePath:
      typeof raw.followActivePath === "boolean"
        ? raw.followActivePath
        : DEFAULTS.followActivePath,
  };
}
