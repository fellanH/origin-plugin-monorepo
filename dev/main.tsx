import React from "react";
import ReactDOM from "react-dom/client";
import DevShell from "./DevShell";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DevShell />
  </React.StrictMode>,
);
