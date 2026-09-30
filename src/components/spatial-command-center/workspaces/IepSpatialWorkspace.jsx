import React from "react";

const canvasStyle = {
  minHeight: 360,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
  display: "grid",
  placeItems: "center",
  padding: 24,
};

export default function IepSpatialWorkspace({ workspace }) {
  return (
    <section aria-label="IEP Ohio County Map workspace" style={canvasStyle}>
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <p style={{ margin: 0, color: "#475569", fontWeight: 700 }}>County map presentation</p>
        <h3 style={{ margin: "8px 0", fontSize: 28, color: "#0f172a" }}>IEP Ohio County Map</h3>
        <p style={{ margin: 0, color: "#334155" }}>
          This workspace presents the qualified county map in {workspace?.coordinateSpace || "real-world.county-geojson"}.
          County truth remains with the existing IEP spatial client.
        </p>
      </div>
    </section>
  );
}
