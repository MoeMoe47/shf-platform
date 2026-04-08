import React from "react";

const panel = {
  background: "linear-gradient(180deg, rgba(8,14,22,0.94) 0%, rgba(7,12,19,0.96) 100%)",
  border: "1px solid rgba(92,140,198,0.16)",
  borderRadius: 16,
  boxShadow:
    "inset 0 0 0 1px rgba(255,255,255,0.015), 0 10px 28px rgba(0,0,0,0.26), 0 0 34px rgba(26,74,128,0.08)",
  overflow: "hidden",
};

export default function CommandCenterStats({
  proofMetrics,
  selectedMetric,
  setSelectedMetric,
  setSelectedPanel,
  onExplainFocus,
}) {
  const metrics = [
    ["Verified Outcomes", proofMetrics?.verifiedOutcomes || 0],
    ["Capital Deployed", `$${Number(proofMetrics?.capitalDeployed || 0).toLocaleString()}`],
    ["Cost Per Outcome", `$${Number(proofMetrics?.costPerOutcome || 0).toLocaleString()}`],
    ["High-Risk Participants", proofMetrics?.highRiskParticipants || 0],
    ["Open Disputes", proofMetrics?.openDisputeCount || 0],
    ["Pool Count", proofMetrics?.poolCount || 0],
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        gap: 12,
        minHeight: 88,
      }}
    >
      {metrics.map(([label, value]) => {
        const metricKey = String(label).toLowerCase().replace(/[^a-z0-9]+/g, "_");
        const isActive = selectedMetric === metricKey;

        return (
          <div
            key={label}
            onClick={() => {
              setSelectedMetric?.(metricKey);
              setSelectedPanel?.("top_metrics");
              onExplainFocus?.({
                type: "metric",
                title: label,
                value,
                metricKey,
                explanation: `This metric represents ${label.toLowerCase()} for the active case.`,
              });
            }}
            style={{
              ...panel,
              cursor: "pointer",
              outline: isActive ? "1px solid rgba(110,190,255,0.18)" : "none",
            }}
          >
            <div style={{ padding: "12px 15px 11px 15px" }}>
              <div
                style={{
                  color: isActive ? "#9edfff" : "#7b93a8",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>

              <div
                style={{
                  color: "#edf5fe",
                  fontSize: 28,
                  fontWeight: 800,
                  marginTop: 10,
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
