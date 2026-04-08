import React from "react";

const panel = {
  borderRadius: 16,
  border: "1px solid rgba(92,140,198,0.16)",
  background: "linear-gradient(180deg, rgba(8,14,22,0.94) 0%, rgba(7,12,19,0.96) 100%)",
  boxShadow:
    "inset 0 0 0 1px rgba(255,255,255,0.015), 0 10px 28px rgba(0,0,0,0.26), 0 0 34px rgba(26,74,128,0.08)",
  overflow: "hidden",
};

const sectionHeaderStyle = {
  padding: "15px 16px 13px 16px",
  borderBottom: "1px solid rgba(92,140,198,0.14)",
  color: "#dde8f4",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: "0.02em",
};

const statLabel = {
  color: "#7b93a8",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const statValue = {
  color: "#edf5fe",
  fontSize: 18,
  fontWeight: 800,
  lineHeight: 1.2,
};

function toneForRisk(riskBand) {
  const band = String(riskBand || "").toLowerCase();
  if (band === "high" || band === "critical") {
    return {
      color: "#ff8e8e",
      border: "1px solid rgba(255,142,142,0.22)",
      background: "rgba(76,26,26,0.46)",
    };
  }
  if (band === "moderate" || band === "medium") {
    return {
      color: "#f0b27a",
      border: "1px solid rgba(240,178,122,0.22)",
      background: "rgba(76,52,24,0.46)",
    };
  }
  return {
    color: "#8ee0b4",
    border: "1px solid rgba(94,214,154,0.22)",
    background: "rgba(17,60,44,0.45)",
  };
}

function Pill({ children, tone }) {
  return (
    <span
      style={{
        ...tone,
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
      }}
    >
      {children}
    </span>
  );
}

function Stat({ label, value, extra = null }) {
  return (
    <div
      style={{
        border: "1px solid rgba(100,150,215,0.12)",
        background: "linear-gradient(180deg, rgba(10,18,28,0.88) 0%, rgba(9,15,24,0.92) 100%)",
        borderRadius: 12,
        padding: "12px 14px",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.015)",
      }}
    >
      <div style={statLabel}>{label}</div>
      <div style={{ ...statValue, marginTop: 8 }}>{value}</div>
      {extra ? <div style={{ marginTop: 8 }}>{extra}</div> : null}
    </div>
  );
}

export default function PredictionLayerPanel({ prediction, narrative }) {
  const safePrediction = prediction || {};
  const safeNarrative = narrative || {};
  const riskTone = toneForRisk(safePrediction?.riskBand);

  return (
    <div style={{ ...panel }}>
      <div style={sectionHeaderStyle}>Prediction Layer</div>

      <div style={{ padding: 14, display: "grid", gap: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <Stat label="Case" value={safePrediction?.caseLabel || "Unknown Case"} />
          <Stat label="System Status" value={safePrediction?.systemStatus || "—"} />
          <Stat
            label="Risk Score"
            value={`${safePrediction?.riskScore ?? 0}%`}
            extra={<Pill tone={riskTone}>{safePrediction?.riskBand || "Low"}</Pill>}
          />
          <Stat label="Confidence" value={`${safePrediction?.confidence ?? 0}%`} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <Stat label="Recommended Action" value={safePrediction?.recommendedAction || "—"} />
          <Stat label="Alternative Action" value={safePrediction?.alternativeAction || "—"} />
          <Stat label="Predicted Next Stage" value={safePrediction?.predictedNextStage || "—"} />
          <Stat label="Aging" value={safePrediction?.aging ?? 0} />
        </div>

        <div
          style={{
            border: "1px solid rgba(100,150,215,0.12)",
            background: "linear-gradient(180deg, rgba(10,18,28,0.88) 0%, rgba(9,15,24,0.92) 100%)",
            borderRadius: 12,
            padding: "14px 16px",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.015)",
            display: "grid",
            gap: 10,
          }}
        >
          <div>
            <div style={statLabel}>Headline</div>
            <div style={{ ...statValue, marginTop: 8, fontSize: 20 }}>
              {safeNarrative?.headline || "No headline available."}
            </div>
          </div>

          <div>
            <div style={statLabel}>Summary</div>
            <div style={{ color: "#c8d8e8", fontSize: 13, lineHeight: 1.55, marginTop: 8 }}>
              {safeNarrative?.summary || "No summary available."}
            </div>
          </div>

          <div>
            <div style={statLabel}>Recommendation Reason</div>
            <div style={{ color: "#c8d8e8", fontSize: 13, lineHeight: 1.55, marginTop: 8 }}>
              {safeNarrative?.recommendationReason || "No recommendation reason available."}
            </div>
          </div>

          <div>
            <div style={statLabel}>Risk Narrative</div>
            <div style={{ color: "#c8d8e8", fontSize: 13, lineHeight: 1.55, marginTop: 8 }}>
              {safeNarrative?.riskNarrative || "No risk narrative available."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
