import React from "react";

export default function StatusRail({ activeAction, selectedPanel }) {
  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 999,
        border: "1px solid rgba(120,170,255,0.16)",
        background: "rgba(6,12,22,0.52)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background:
            activeAction === "execute"
              ? "#22c55e"
              : activeAction === "hold"
              ? "#ef4444"
              : "#3b82f6",
          boxShadow:
            activeAction === "execute"
              ? "0 0 14px rgba(34,197,94,0.75)"
              : activeAction === "hold"
              ? "0 0 14px rgba(239,68,68,0.75)"
              : "0 0 14px rgba(59,130,246,0.75)",
        }}
      />
      <div style={{ fontSize: 12, color: "#d8e7ff", fontWeight: 700 }}>
        Decision: {activeAction.toUpperCase()}
      </div>
      <div style={{ width: 1, height: 14, background: "rgba(148,163,184,0.3)" }} />
      <div style={{ fontSize: 12, color: "#9fb3cc" }}>
        Mode: {selectedPanel.toUpperCase()}
      </div>
    </div>
  );
}
