import type { IframePluginContextWithConfig } from "@origin-cards/sdk";
import { manifest } from "./manifest";

export default function HelloPlugin({ context }: { context: IframePluginContextWithConfig }) {
  const isDark = context.theme === "dark";

  return (
    <div className={`h-full p-4 font-mono text-sm ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
      {/* --- MANIFEST ---
          Your plugin's static metadata. Origin reads this to show the plugin in
          the launcher and to identify your plugin at runtime. */}
      <section className="mb-4 flex items-baseline gap-2">
        <span className="text-2xl">{manifest.icon}</span>
        <div>
          <h1 className="font-semibold">
            {manifest.name}{" "}
            <span className="text-xs font-normal opacity-50">v{manifest.version}</span>
          </h1>
          {manifest.description && <p className="text-xs opacity-60">{manifest.description}</p>}
        </div>
      </section>

      {/* --- PLUGIN CONTEXT ---
          Origin passes a PluginContext to every plugin at mount time.
          Use these values for per-card state, file I/O, and theme-aware rendering. */}
      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          {/* cardId: the ID of the card this plugin instance is mounted in.
              Useful if your plugin stores per-card state in a file or a store. */}
          <label className="text-xs opacity-50">cardId</label>
          <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">
            {context.cardId}
          </code>
        </div>

        <div className="flex flex-col gap-0.5">
          {/* workspacePath: absolute path to Origin's app data directory.
              Use this as the root for any files your plugin reads or writes. */}
          <label className="text-xs opacity-50">workspacePath</label>
          <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">
            {context.workspacePath}
          </code>
        </div>

        <div className="flex flex-col gap-0.5">
          {/* theme: "light" or "dark" — reflects system appearance at mount time.
              A full app restart is needed if the user changes their system theme
              while Origin is open. */}
          <label className="text-xs opacity-50">theme</label>
          <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">
            {context.theme}
          </code>
        </div>
      </section>

      {/* Theme-responsive visual indicator */}
      <div
        className={`mt-4 rounded px-2 py-1 text-center text-xs ${
          isDark ? "bg-zinc-700 text-zinc-300" : "bg-zinc-100 text-zinc-500"
        }`}
      >
        {isDark ? "🌙 dark mode" : "☀️ light mode"}
      </div>
    </div>
  );
}
