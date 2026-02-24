import type { PluginManifest } from "@origin-cards/api";

export const manifest: PluginManifest = {
  id: "com.origin.terminal",
  name: "Terminal",
  version: "0.0.1",
  description: "Full PTY terminal",
  icon: ">_",
  requiredCapabilities: ["pty"],
};

export default manifest;
