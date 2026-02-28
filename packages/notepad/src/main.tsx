import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { usePluginContext } from "@origin-cards/sdk";
import NotepadPlugin from "./NotepadPlugin";

function App() {
  const context = usePluginContext();
  if (!context) return null;
  return <NotepadPlugin context={context} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
