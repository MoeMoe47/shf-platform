import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Link, Navigate } from "react-router-dom";

function App() {
  return (
    <div style={{fontFamily:"system-ui, sans-serif", padding: 16}}>
      <h1>Sales Smoke ✅</h1>
      <p>This proves JS is executing and React is mounted.</p>
      <nav style={{display:"flex", gap:12, margin:"12px 0"}}>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/leads">Leads</Link>
      </nav>
      <Routes>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<h2>Dashboard page</h2>} />
        <Route path="/leads" element={<h2>Leads page</h2>} />
        <Route path="*" element={<h2>Catchall</h2>} />
      </Routes>
    </div>
  );
}

(function boot() {
  try {
    let el = document.getElementById("app");
    if (!el) {
      el = document.createElement("div");
      el.id = "app";
      document.body.appendChild(el);
    }
    console.log("[sales.smoke2] mounting into #app");
    createRoot(el).render(
      <HashRouter basename="/">
        <App />
      </HashRouter>
    );
  } catch (e) {
    console.error("[sales.smoke2] boot error", e);
    // Leave shell content visible so you can still see something onscreen
  }
})();
