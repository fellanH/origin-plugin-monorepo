import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { usePluginContext } from "@origin-cards/sdk";
import BrowserPlugin from "./BrowserPlugin";

function App() {
  const context = usePluginContext();
  if (!context) return null;
  return <BrowserPlugin context={context} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
