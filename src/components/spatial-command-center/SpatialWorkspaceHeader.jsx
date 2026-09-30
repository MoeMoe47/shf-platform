import React from "react";

const statusStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  margin: "12px 0 0",
};

const pillStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 12,
  color: "#334155",
  background: "#f8fafc",
};

export default function SpatialWorkspaceHeader({ workspace }) {
  if (!workspace) {
    return (
      <header aria-busy="true">
        <p>Loading workspace context</p>
      </header>
    );
  }

  const intelligenceText = workspace.intelligenceAvailable
    ? "Spatial Intelligence available"
    : "Spatial Intelligence unavailable";

  return (
    <header aria-label="Workspace coordinate and qualification context">
      <p style={{ margin: 0, fontSize: 12, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>
        Separate governed coordinate space
      </p>
      <h2 style={{ margin: "4px 0 0", fontSize: 24, color: "#0f172a" }}>{workspace.label}</h2>
      <div style={statusStyle} aria-label="Workspace status">
        <span style={pillStyle}>{workspace.coordinateFamily}</span>
        <span style={pillStyle}>{workspace.coordinateSpace}</span>
        <span style={pillStyle}>Spatial qualified</span>
        <span style={pillStyle}>{intelligenceText}</span>
        <span style={pillStyle}>Transform availability: {workspace.transformAvailability}</span>
      </div>
    </header>
  );
}
