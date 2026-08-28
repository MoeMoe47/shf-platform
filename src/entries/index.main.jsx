// src/entries/index.main.jsx
import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

import "@/styles/global.css";
import "@/styles/shell.css";
import "@/styles/unified-shell.css";

import RootProviders from "@/entries/RootProviders.jsx";
import WebMakerPage from "@/pages/public/WebMakerPage.jsx";

// Canonical Silicon Heartland Universe (ported from the approved
// reference implementation — see
// docs/architecture/universe/SILICON_HEARTLAND_UNIVERSE_CANONICAL_LANDING_V1.md).
// Mounted here (site root) AND from universe.main.jsx (universe.html) —
// same component, same source, so root `/` and `/universe` always show
// the identical canonical experience. The previous, non-canonical
// implementation this replaced is archived at
// src/_archive/universe-legacy-pre-canonical-v1/.
const UniverseApp = lazy(() => import("@/pages/universe-v1/UniverseApp.jsx"));

function UniverseLoading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#02050d",
        color: "#f6efe2",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, color: "#d9a14e", fontSize: 12, fontWeight: 800, letterSpacing: "0.18em" }}>
          SILICON HEARTLAND
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: 28, letterSpacing: 0 }}>Preparing the Universe</h1>
      </div>
    </main>
  );
}

function App() {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-app", "index");
  }
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <RootProviders appScope="index">
      {pathname === "/studio/templates" ? (
        <WebMakerPage />
      ) : (
        <Suspense fallback={<UniverseLoading />}>
          <UniverseApp />
        </Suspense>
      )}
    </RootProviders>
  );
}

const el = document.getElementById("root");
if (!el) {
  // fail loudly instead of blank screen
  throw new Error("Root element #root not found in index.html");
}

createRoot(el).render(<App />);
