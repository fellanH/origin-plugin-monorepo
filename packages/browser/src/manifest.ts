import type { PluginManifest } from "@origin-cards/api";

export const manifest: PluginManifest = {
  id: "com.origin.browser",
  name: "Browser",
  version: "0.1.0",
  description: "View any URL in a panel — great for localhost dev servers",
  icon: "🌐",
  requiredCapabilities: ["fs:read", "fs:write"],
};
