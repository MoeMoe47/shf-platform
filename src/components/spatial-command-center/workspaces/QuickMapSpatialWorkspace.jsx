import React from "react";

const canvasStyle = {
  minHeight: 360,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "linear-gradient(180deg, #f8fafc 0%, #edf7f4 100%)",
  display: "grid",
  placeItems: "center",
  padding: 24,
};

export default function QuickMapSpatialWorkspace({ workspace }) {
  return (
    <section aria-label="Metaverse Quick Map workspace" style={canvasStyle}>
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <p style={{ margin: 0, color: "#475569", fontWeight: 700 }}>Quick Map presentation</p>
        <h3 style={{ margin: "8px 0", fontSize: 28, color: "#0f172a" }}>Metaverse Quick Map</h3>
        <p style={{ margin: 0, color: "#334155" }}>
          This workspace preserves {workspace?.coordinateSpace || "metaverse.quick-map"} as a separate metaverse
          coordinate space. It is not merged with master-city or regional-scene geometry.
        </p>
      </div>
    </section>
  );
}
