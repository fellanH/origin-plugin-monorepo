import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { usePluginContext } from "@origin-cards/sdk";
import MonacoPlugin from "./MonacoPlugin";

// Configure Monaco to use local bundled workers instead of loading from CDN.
// This makes the plugin fully self-contained.
self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === "json") return new jsonWorker();
    if (label === "css" || label === "scss" || label === "less")
      return new cssWorker();
    if (label === "html" || label === "handlebars" || label === "razor")
      return new htmlWorker();
    if (label === "typescript" || label === "javascript")
      return new tsWorker();
    return new editorWorker();
  },
};

loader.config({ monaco });

function App() {
  const context = usePluginContext();
  if (!context) return null;
  return <MonacoPlugin context={context} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
