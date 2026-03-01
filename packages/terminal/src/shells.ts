import { readTextFile } from "@origin-cards/sdk";

const FALLBACK_SHELLS = ["/bin/zsh", "/bin/bash", "/bin/sh"];

let cached: string[] | null = null;

/**
 * Detect available shells by reading `/etc/shells`.
 *
 * Uses the SDK `readTextFile` helper which proxies through the host's
 * Tauri fs plugin. Falls back to a hardcoded list on error.
 *
 * NOTE: If a dedicated Rust command (e.g. `list_shells`) is added to
 * the host, this can be replaced with `invoke("list_shells")`.
 */
export async function detectShells(): Promise<string[]> {
  if (cached) return cached;

  try {
    const content = await readTextFile("/etc/shells");
    const shells = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));

    cached = shells.length > 0 ? shells : FALLBACK_SHELLS;
  } catch {
    cached = FALLBACK_SHELLS;
  }

  return cached;
}
