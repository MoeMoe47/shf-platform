// src/apps/LordOutcomesShell/LordOutcomesShell.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";

export default function LordOutcomesShell() {
  const loc = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "#0b0e14", color: "white", padding: 24 }}>
      <div style={{ marginBottom: 12, opacity: 0.8 }}>
        <b>Lord of Outcomes™</b> — Shell Loaded
      </div>

      <div style={{ marginBottom: 12, opacity: 0.7 }}>
        Path: <code>{loc.pathname}</code>
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: 16 }}>
        <Outlet />
      </div>
    </div>
  );
}
