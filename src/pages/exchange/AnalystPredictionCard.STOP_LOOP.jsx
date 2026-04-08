import React from "react";

export default function AnalystPredictionCard({ agentContext, agentAudience }) {
  if (!agentContext) return null;

  const state = String(agentContext?.timelineStep || "").toUpperCase();

  const riskScore =
    state.includes("RISK") || state.includes("HOLD")
      ? 0.72
      : state.includes("VERIFICATION")
      ? 0.48
      : state.includes("ACTION")
      ? 0.32
      : state.includes("PAYMENT")
      ? 0.18
      : 0.25;

  const nextActionRaw =
    agentContext?.recommendation?.nextAction ||
    agentContext?.recommendation?.action ||
    "MONITOR";

  const likelyNext =
    riskScore > 0.6
      ? "HOLD"
      : String(nextActionRaw).replace(/_/g, " ").toUpperCase();

  const stepMap = {
    "RISK SIGNAL": "VERIFICATION INQUIRY",
    "ANOMALY CLEAR": "ACTION QUEUED",
    "VERIFICATION INQUIRY": "ACTION QUEUED",
    "ACTION QUEUED": "OUTCOME PENDING",
    "OUTCOME PENDING": "PAYMENT PENDING",
    "PAYMENT PENDING": "FUNDED",
  };

  const normalizedState = state.replace(/_/g, " ").trim();
  const secondStep = stepMap[normalizedState] || "MONITOR";

  const riskLabel =
    riskScore >= 0.65 ? "HIGH"
    : riskScore >= 0.35 ? "MEDIUM"
    : "LOW";

  const riskColor =
    riskLabel === "HIGH"
      ? "#ff6b6b"
      : riskLabel === "MEDIUM"
      ? "#ffb86c"
      : "#7ee2a8";

  const posture =
    riskScore > 0.6
      ? "INTERVENE"
      : riskScore > 0.35
      ? "MONITOR CLOSELY"
      : "NORMAL";

  const riskAlert =
    riskScore > 0.6
      ? "ELEVATED"
      : riskScore > 0.35
      ? "WATCH"
      : "CLEAR";

  const recommendedAction =
    riskScore > 0.6
      ? "hold"
      : riskScore > 0.35
      ? "review"
      : "execute";

  const recommendedLabel =
    recommendedAction === "hold"
      ? "HOLD FOR VERIFICATION"
      : recommendedAction === "review"
      ? "QUEUE OPERATOR REVIEW"
      : "PROCEED";

  let success = 70 - riskScore * 40;
  let delay = 20 + riskScore * 25;
  let failure = 10 + riskScore * 15;

  const total = success + delay + failure;
  const successPct = Math.round((success / total) * 100);
  const delayPct = Math.round((delay / total) * 100);
  const failurePct = Math.round((failure / total) * 100);

  const audience = (agentAudience || "operator").toLowerCase();

  let summary = "";
  if (audience === "operator") {
    summary = "Execute next step with attention to current risk conditions.";
  } else if (audience === "executive") {
    summary = "System is progressing within acceptable thresholds with moderate oversight required.";
  } else if (audience === "investor") {
    summary = "Projected outcome stability remains within expected return band with manageable risk exposure.";
  } else if (audience === "auditor") {
    summary = "Decision path aligns with expected compliance flow, with current control posture visible.";
  }

  const barTrack = {
    height: 8,
    width: "100%",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    marginTop: 6
  };

  return (
    <div
      style={{
        marginTop: 14,
        padding: "14px 16px",
        borderRadius: 16,
        background: "linear-gradient(180deg, rgba(8,18,30,0.9), rgba(8,18,30,0.65))",
        border: "1px solid rgba(120,200,255,0.14)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
        color: "#e6f1ff",
        fontSize: 12,
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7fd8ff", marginBottom: 10 }}>
        Predictive Intelligence
      </div>

      <div style={{ marginBottom: 10, opacity: 0.82 }}>
        {summary}
      </div>

      <div style={{ marginBottom: 6 }}>
        <span style={{ opacity: 0.6 }}>Next:</span>{" "}
        <span style={{ fontWeight: 700 }}>{likelyNext}</span>
      </div>

      <div style={{ marginBottom: 6 }}>
        <span style={{ opacity: 0.6 }}>Then:</span>{" "}
        <span style={{ color: "#9bd4ff", fontWeight: 600 }}>{secondStep}</span>
      </div>

      <div style={{ marginBottom: 6 }}>
        <span style={{ opacity: 0.6 }}>Risk:</span>{" "}
        <span style={{ color: riskColor, fontWeight: 700 }}>
          {Math.round(riskScore * 100)}% ({riskLabel})
        </span>
      </div>

      <div style={{ marginBottom: 6 }}>
        <span style={{ opacity: 0.6 }}>Alert:</span>{" "}
        <span style={{ color: riskColor, fontWeight: 700 }}>
          {riskAlert}
        </span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={{ opacity: 0.6 }}>Posture:</span>{" "}
        <span style={{ color: "#9bd4ff", fontWeight: 600 }}>
          {posture}
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          console.log("AI ACTION TRIGGERED:", recommendedAction);
          if (typeof window !== "undefined") {
            window.__LAST_AI_ACTION__ = recommendedAction;
            const prevTitle = document.title;
            document.title = `AI: ${recommendedAction}`;
            setTimeout(() => {
              document.title = prevTitle;
            }, 1200);
            window.dispatchEvent(
              new CustomEvent("shf:ai_action", {
                detail: { type: recommendedAction }
              })
            );
          }
        }}
        style={{
          width: "100%",
          marginBottom: 14,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(120,200,255,0.2)",
          background: "rgba(18,48,74,0.4)",
          color: "#dff3ff",
          fontWeight: 700,
          cursor: "pointer",
          pointerEvents: "auto",
          position: "relative",
          zIndex: 9999
        }}
      >
        Execute: {recommendedLabel}
      </button>

      <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7fd8ff", marginBottom: 8 }}>
        Outcome Projection
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ opacity: 0.7 }}>Success</span>
          <span style={{ color: "#7ee2a8", fontWeight: 700 }}>{successPct}%</span>
        </div>
        <div style={barTrack}>
          <div style={{ width: `${successPct}%`, height: "100%", background: "#7ee2a8" }} />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ opacity: 0.7 }}>Delay</span>
          <span style={{ color: "#ffb86c", fontWeight: 700 }}>{delayPct}%</span>
        </div>
        <div style={barTrack}>
          <div style={{ width: `${delayPct}%`, height: "100%", background: "#ffb86c" }} />
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ opacity: 0.7 }}>Failure</span>
          <span style={{ color: "#ff6b6b", fontWeight: 700 }}>{failurePct}%</span>
        </div>
        <div style={barTrack}>
          <div style={{ width: `${failurePct}%`, height: "100%", background: "#ff6b6b" }} />
        </div>
      </div>
    </div>
  );
}
