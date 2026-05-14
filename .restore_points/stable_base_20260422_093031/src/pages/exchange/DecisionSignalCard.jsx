import React from "react";

const toneMap = {
  neutral: {
    border: "1px solid rgba(120,170,230,0.16)",
    background: "rgba(8,15,24,0.76)",
    color: "#edf5fe",
  },
  info: {
    border: "1px solid rgba(127,216,255,0.22)",
    background: "rgba(18,48,74,0.48)",
    color: "#7fd8ff",
  },
  ok: {
    border: "1px solid rgba(94,214,154,0.22)",
    background: "rgba(17,60,44,0.45)",
    color: "#8ee0b4",
  },
  warn: {
    border: "1px solid rgba(240,178,122,0.22)",
    background: "rgba(76,52,24,0.46)",
    color: "#f0b27a",
  },
  risk: {
    border: "1px solid rgba(255,142,142,0.22)",
    background: "rgba(76,26,26,0.46)",
    color: "#ff8e8e",
  },
};

function SignalPill({ children, tone = "neutral" }) {
  const style = toneMap[tone] || toneMap.neutral;

  return (
    <span
      style={{
        ...style,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 24,
        padding: "0 10px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function DecisionSignalCard({
  label,
  stateLabel,
  tone = "neutral",
  confidence,
  recommendation,
}) {
  const confidenceValue =
    typeof confidence === "number" ? `${Math.round(confidence)}%` : "—";

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(92,140,198,0.12)",
        background: "rgba(8,15,24,0.68)",
        padding: "12px 13px",
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          color: "#7fd8ff",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Decision Signal
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <SignalPill tone={tone}>{label || "No Action"}</SignalPill>
        {stateLabel ? <SignalPill tone="info">{stateLabel}</SignalPill> : null}
      </div>

      <div style={{ color: "#dbe8f4", fontSize: 13, lineHeight: 1.4 }}>
        {recommendation || "No recommendation reasoning available."}
      </div>

      <div style={{ color: "#9ab2c6", fontSize: 12, lineHeight: 1.4 }}>
        Confidence: {confidenceValue}
      </div>
    </div>
  );
}
