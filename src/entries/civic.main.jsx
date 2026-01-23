import "@/styles/shell.css";
import "@/styles/unified-shell.css";
import "@/styles/app-shell.css";
// src/entries/civic.main.jsx
import React from "react";
import ReactDOM from "react-dom/client";

console.log("[CIVIC ENTRY] civic.main.jsx file loaded");

function CivicAppEntry() {
  console.log("[CIVIC ENTRY] rendering CivicAppEntry");
  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "24px",
      }}
    >
      <h1>CIVIC ENTRY SMOKE TEST</h1>
      <p>
        This is rendered by <code>civic.main.jsx</code>.
      </p>
    </div>
  );
}

const root = document.getElementById("root");
if (!root) {
  console.error("[CIVIC ENTRY] #root not found in civic.html");
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <CivicAppEntry />
    </React.StrictMode>
  );
}
