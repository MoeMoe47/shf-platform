import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

import RootProviders from "@/entries/RootProviders.jsx";
import AdminRoutes from "@/router/AdminRoutes.jsx";

import "@/styles/_bg-guard.css";
import "@/styles/unified-shell.css";
import "@/styles/unified-shell.optin.css";
import "@/styles/app-shell.css";

import { applyManifest } from "@/apps/manifest/applyManifest.js";
import { getMode } from "@/runtime/mode.js";

function Crash({ error }) {
  return (
    <div style={{ padding: 16, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
      <h1 style={{ margin: 0 }}>Admin crashed</h1>
      <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
        {String(error?.stack || error?.message || error)}
      </pre>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    // also log to console
    try { console.error("[admin] render crash:", error); } catch {}
  }
  render() {
    if (this.state.error) return <Crash error={this.state.error} />;
    return this.props.children;
  }
}

const mount = document.getElementById("root");
if (!mount) throw new Error("Missing #root mount");

try { applyManifest("admin"); } catch (e) { /* keep going */ }

try {
  const m = String(getMode?.() || "PILOT").toUpperCase();
  document.documentElement.setAttribute("data-shf-mode", m);
  window.__SHF_MODE__ = m;
} catch {}

createRoot(mount).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RootProviders>
        <HashRouter>
          <AdminRoutes />
        </HashRouter>
      </RootProviders>
    </ErrorBoundary>
  </React.StrictMode>
);
