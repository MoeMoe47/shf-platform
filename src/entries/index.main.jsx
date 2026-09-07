// src/entries/index.main.jsx
import React, { Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "@/styles/global.css";
import "@/styles/shell.css";
import "@/styles/unified-shell.css";

import RootProviders from "@/entries/RootProviders.jsx";
import WebMakerPage from "@/pages/public/WebMakerPage.jsx";
import OperatorLayout from "../../apps/shf-web/src/layouts/OperatorLayout.jsx";
import GovernmentAssurance from "../../apps/shf-web/src/pages/operator/GovernmentAssurance.jsx";

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

function currentRoute() {
  if (typeof window === "undefined") return "/";
  return window.location.hash.startsWith("#/") ? window.location.hash.slice(1) : window.location.pathname;
}

function App() {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-app", "index");
  }
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const update = () => setRoute(currentRoute());
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => { window.removeEventListener("hashchange", update); window.removeEventListener("popstate", update); };
  }, []);
  const claimMatch = route.match(/^\/operator\/government-assurance\/claims\/([^/]+)$/);
  const verificationMatch = route.match(/^\/operator\/government-assurance\/verification\/([^/]+)$/);
  const reconciliationMatch = route.match(/^\/operator\/government-assurance\/reconciliation\/([^/]+)$/);
  const sourceMatch = route.match(/^\/operator\/government-assurance\/data-sources\/([^/]+)$/);
  const portfolioMatch = route.match(/^\/operator\/government-assurance\/(programs|providers|funding|audits)\/([^/]+)$/);
  const lineageMatch = route.match(/^\/operator\/government-assurance\/lineage\/(truth|metric)\/([^/]+)$/);
  const assistantMatch = route.match(/^\/operator\/government-assurance\/assistant$/);
  const reportsMatch = route.match(/^\/operator\/government-assurance\/reports$/);
  const monitoringMatches = [
    ["plan", route.match(/^\/operator\/government-assurance\/monitoring\/plans\/([^/]+)$/)],
    ["activity", route.match(/^\/operator\/government-assurance\/monitoring\/activities\/([^/]+)$/)],
    ["evidence-request", route.match(/^\/operator\/government-assurance\/monitoring\/evidence-requests\/([^/]+)$/)],
    ["finding", route.match(/^\/operator\/government-assurance\/findings\/([^/]+)$/)],
    ["provider-response", route.match(/^\/operator\/government-assurance\/monitoring\/provider-responses\/([^/]+)$/)],
    ["corrective-action", route.match(/^\/operator\/government-assurance\/corrective-actions\/([^/]+)$/)],
  ];
  const monitoringMatch = monitoringMatches.find(([, match]) => match);

  return (
    <RootProviders appScope="index">
      {route === "/operator/government-assurance" || claimMatch || verificationMatch || reconciliationMatch || sourceMatch || portfolioMatch || lineageMatch || monitoringMatch || assistantMatch || reportsMatch ? (
        <OperatorLayout><GovernmentAssurance initialClaimId={claimMatch?.[1] || null} initialVerificationId={verificationMatch?.[1] || null} initialReconciliationId={reconciliationMatch?.[1] || null} initialSourceId={sourceMatch?.[1] || null} initialPortfolio={portfolioMatch ? { kind: ({ programs: "program", providers: "provider", funding: "funding", audits: "audit" }[portfolioMatch[1]]), id: portfolioMatch[2] } : null} initialLineage={lineageMatch ? { kind: lineageMatch[1], id: lineageMatch[2] } : null} initialMonitoring={monitoringMatch ? { kind: monitoringMatch[0], id: monitoringMatch[1][1] } : null} initialPhase8B={assistantMatch ? "Assistant" : reportsMatch ? "Reports" : null} /></OperatorLayout>
      ) : pathname === "/studio/templates" ? (
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
