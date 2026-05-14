import React from "react";
import { createRoot } from "react-dom/client";
import FoundationApp from "../foundation/App";

if (window.location.hash === "#/top" || window.location.hash === "#top") {
  history.replaceState(null, "", window.location.pathname + window.location.search);
}

const mountNode = document.getElementById("root");

if (!mountNode) {
  throw new Error("Foundation mount failed: #root not found");
}

createRoot(mountNode).render(
  <React.StrictMode>
    <FoundationApp />
  </React.StrictMode>
);
