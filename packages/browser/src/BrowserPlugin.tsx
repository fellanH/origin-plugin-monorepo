import { useEffect, useState } from "react";
import { readTextFile, writeTextFile, mkdir, exists } from "@origin-cards/sdk";
import type { IframePluginContextWithConfig } from "@origin-cards/sdk";

const DEFAULT_URL = "http://localhost:3000";

/** Join a parent path with a child name using the OS-appropriate separator. */
function joinPath(base: string, name: string): string {
  const sep = base.includes("\\") ? "\\" : "/";
  const trimmed = base.endsWith("/") || base.endsWith("\\") ? base.slice(0, -1) : base;
  return `${trimmed}${sep}${name}`;
}

export default function BrowserPlugin({ context }: { context: IframePluginContextWithConfig }) {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [inputValue, setInputValue] = useState(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(false);
  // Incrementing key forces iframe remount on reload
  const [reloadKey, setReloadKey] = useState(0);

  const configDir = joinPath(context.workspacePath, "browser");
  const configFile = joinPath(configDir, `${context.cardId}.json`);

  // Restore saved URL on mount
  useEffect(() => {
    (async () => {
      try {
        if (await exists(configFile)) {
          const raw = await readTextFile(configFile);
          const saved = JSON.parse(raw) as { url?: string };
          if (saved.url) {
            setUrl(saved.url);
            setInputValue(saved.url);
          }
        }
      } catch {
        // No saved config — first launch
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function navigate(target: string) {
    const trimmed = target.trim();
    if (!trimmed) return;
    setUrl(trimmed);
    setInputValue(trimmed);
    setIsLoading(true);
    setReloadKey((k) => k + 1);
    try {
      await mkdir(configDir, { recursive: true });
      await writeTextFile(configFile, JSON.stringify({ url: trimmed }));
    } catch {
      // Persist failure is non-fatal
    }
  }

  function handleReload() {
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  }

  const isDark = context.theme === "dark";

  return (
    <div className="flex h-full flex-col">
      {/* URL bar */}
      <div
        className={`flex shrink-0 items-center gap-2 border-b px-3 py-2 ${isDark ? "border-zinc-700" : "border-zinc-200"}`}
      >
        <input
          type="url"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void navigate(inputValue);
          }}
          className={`min-w-0 flex-1 rounded px-2 py-0.5 font-mono text-xs outline-none ${
            isDark
              ? "bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
              : "bg-zinc-100 text-zinc-900 placeholder:text-zinc-400"
          }`}
          placeholder="http://localhost:3000"
        />
        <button
          onClick={() => void navigate(inputValue)}
          className="shrink-0 rounded px-2 py-0.5 text-xs hover:bg-white/10"
        >
          Go
        </button>
        <button
          onClick={handleReload}
          className="shrink-0 rounded px-2 py-0.5 text-xs hover:bg-white/10"
          title="Reload"
          aria-label="Reload"
        >
          ↻
        </button>
      </div>

      {/* Content */}
      <div className="relative min-h-0 flex-1">
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs opacity-40">
            Loading…
          </div>
        )}
        <iframe
          key={reloadKey}
          src={url}
          className="h-full w-full border-0"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
