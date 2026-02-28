import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { usePluginContext } from "@origin-cards/sdk";
import TerminalPlugin from "./TerminalPlugin";

function App() {
  const context = usePluginContext();
  if (!context) return null;
  return <TerminalPlugin context={context} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
