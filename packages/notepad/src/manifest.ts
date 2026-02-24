import type { PluginManifest } from "@origin-cards/api";

export const manifest: PluginManifest = {
  id: "com.origin.notepad",
  name: "Notepad",
  version: "0.1.0",
  description: "A simple markdown notepad — notes are saved per panel",
  icon: "📝",
  requiredCapabilities: ["fs:read", "fs:write"],
};
