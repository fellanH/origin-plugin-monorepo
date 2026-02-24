import { useEffect, useRef, useState, useCallback } from "react";
import type { IframePluginContextWithConfig } from "@origin-cards/sdk";
import { readTextFile, writeTextFile, mkdir } from "@origin-cards/sdk";

// Module-level cache: persists across remounts (e.g. panel splits).
// Key = cardId, value = latest text (written on every keystroke).
const _textCache = new Map<string, string>();

/** Join path segments using the OS-appropriate separator. */
function joinPath(base: string, ...parts: string[]): string {
  const sep = base.includes("\\") ? "\\" : "/";
  let result = base.endsWith("/") || base.endsWith("\\")
    ? base.slice(0, -1)
    : base;
  for (const part of parts) {
    result = `${result}${sep}${part}`;
  }
  return result;
}

export default function NotepadPlugin({
  context,
}: {
  context: IframePluginContextWithConfig;
}) {
  const { cardId, workspacePath, theme } = context;

  // Initialise from cache — avoids empty flash on remount after split
  const [text, setText] = useState<string>(() => _textCache.get(cardId) ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const fileRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDark = theme === "dark";

  const save = useCallback(async (content: string) => {
    if (!fileRef.current) return;
    setStatus("saving");
    try {
      await writeTextFile(fileRef.current, content);
      setStatus("saved");
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      // Write failed — silently reset status so the UI doesn't stay stuck
      setStatus("idle");
    }
  }, []);

  // Load note file on mount (skip if workspacePath not resolved yet)
  useEffect(() => {
    if (!workspacePath) return;
    let cancelled = false;
    async function load() {
      const dir = joinPath(workspacePath, "notepad");
      await mkdir(dir, { recursive: true });
      const file = joinPath(dir, `${cardId}.md`);
      fileRef.current = file;
      try {
        const content = await readTextFile(file);
        if (!cancelled) {
          setText(content);
          _textCache.set(cardId, content);
        }
      } catch {
        // File doesn't exist yet — start with empty note
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [workspacePath, cardId]);

  // On unmount: flush any pending debounced save immediately
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        const cached = _textCache.get(cardId);
        if (cached !== undefined && fileRef.current) {
          // Best-effort fire-and-forget flush
          writeTextFile(fileRef.current, cached).catch(() => {});
        }
      }
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [cardId]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setText(value);
      _textCache.set(cardId, value); // keep cache current on every keystroke
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => void save(value), 800);
    },
    [cardId, save],
  );

  return (
    <div className="relative h-full">
      <textarea
        className={`h-full w-full resize-none bg-transparent p-3 font-mono text-sm outline-none placeholder:opacity-30 ${
          isDark ? "text-zinc-100" : "text-zinc-900"
        }`}
        value={text}
        onChange={handleChange}
        placeholder="Start typing…"
        spellCheck={false}
      />
      {status !== "idle" && (
        <span
          className={`pointer-events-none absolute bottom-2 right-2 text-xs transition-opacity ${
            isDark ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          {status === "saving" ? "Saving…" : "Saved"}
        </span>
      )}
    </div>
  );
}
