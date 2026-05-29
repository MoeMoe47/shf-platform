import React, { lazy, Suspense } from "react";
import "./shs-unified-truth-shell.css";

const SHSOperationalMapboxMap = lazy(() =>
  import("./components/SHSOperationalMapboxMap")
);

function UnifiedTruthLiveMapFallback() {
  return (
    <main
      className="shs-unified-truth-shell"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, #06111f, #020711)",
        color: "rgba(226, 232, 240, 0.95)",
      }}
    >
      <section
        style={{
          width: "min(920px, calc(100vw - 48px))",
          border: "1px solid rgba(125, 211, 252, 0.28)",
          borderRadius: "24px",
          padding: "28px",
          background: "rgba(8, 24, 44, 0.86)",
          boxShadow: "0 24px 70px rgba(0,0,0,.38)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#f59e0b",
            fontSize: "12px",
            fontWeight: 900,
            letterSpacing: ".18em",
            textTransform: "uppercase",
          }}
        >
          Unified Truth Map
        </p>
        <h1 style={{ margin: "10px 0 8px", fontSize: "28px" }}>
          Loading operational map layer…
        </h1>
        <p style={{ margin: 0, color: "rgba(203, 213, 225, 0.78)" }}>
          Preparing Mapbox runtime, county boundaries, and SHS signal layers.
        </p>
      </section>
    </main>
  );
}

export default function UnifiedTruthMapRoute() {
  return (
    <main
      className="shs-unified-truth-shell shs-unified-truth-map-route"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #06111f, #020711)",
        color: "white",
        overflow: "hidden",
      }}
    >
      <Suspense fallback={<UnifiedTruthLiveMapFallback />}>
        <SHSOperationalMapboxMap />
      </Suspense>
    </main>
  );
}
