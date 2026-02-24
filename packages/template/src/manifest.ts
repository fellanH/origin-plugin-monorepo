// TODO: Replace @origin-cards/api with the npm package once published.
// For now this file only uses the PluginManifest type shape.

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  icon?: string;
}

export const manifest: PluginManifest = {
  id: "com.example.template",
  name: "Template Plugin",
  version: "0.1.0",
  description: "Blank starter — copy this to build your own Origin plugin.",
  icon: "🔌",
};
