// Re-export manifest so Origin can read metadata without fully loading the plugin.
export { manifest } from "./manifest";

import type { PluginContext } from "./types/origin-api";

export default function MyPlugin({ context }: { context: PluginContext }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 font-sans text-sm">
      <p className="font-medium">Hello from my plugin 👋</p>
      <p className="text-xs opacity-50">card: {context.cardId}</p>
    </div>
  );
}
