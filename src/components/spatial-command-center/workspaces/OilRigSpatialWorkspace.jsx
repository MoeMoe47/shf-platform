import React from "react";

const canvasStyle = {
  minHeight: 360,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  display: "grid",
  placeItems: "center",
  padding: 24,
};

export default function OilRigSpatialWorkspace({ workspace }) {
  return (
    <section aria-label="Metaverse Regional Scene Oil Rig workspace" style={canvasStyle}>
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <p style={{ margin: 0, color: "#475569", fontWeight: 700 }}>Regional Scene presentation</p>
        <h3 style={{ margin: "8px 0", fontSize: 28, color: "#0f172a" }}>Metaverse Regional Scene - Oil Rig</h3>
        <p style={{ margin: 0, color: "#334155" }}>
          This workspace presents the qualified Oil Rig regional scene in {workspace?.coordinateSpace || "metaverse.regional-scene"}.
          Spatial Intelligence is available, with reasoning and evidence UI deferred.
        </p>
      </div>
    </section>
  );
}
