import React, { useMemo, useState } from "react";
import CinematicGlobe from "../../components/globe/CinematicGlobe";
import OperationalMap from "../../components/globe/OperationalMap";
import "./globe-polish.css";

const decisionPulseStyle = `
@keyframes decisionPulse {
  0% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-1px) scale(1.01); }
  100% { transform: translateY(0px) scale(1); }
}

@keyframes decisionFlash {
  0% { box-shadow: 0 0 0 rgba(255,255,255,0); }
  30% { box-shadow: 0 0 36px rgba(255,255,255,0.18); }
  100% { box-shadow: 0 0 0 rgba(255,255,255,0); }
}
`;

export default function GlobeScene({ viewMode, setViewMode, activeCase, systemStatus, recommendation, timelineStep }) {
  const [decisionJustChanged, setDecisionJustChanged] = useState(false);
  const [lastDecisionKey, setLastDecisionKey] = useState("");
  const [decisionAge, setDecisionAge] = useState(0);

  React.useEffect(() => {
    if (!document.getElementById("decision-pulse-style")) {
      const style = document.createElement("style");
      style.id = "decision-pulse-style";
      style.innerHTML = decisionPulseStyle;
      document.head.appendChild(style);
    }
  }, []);
  const [mode, setMode] = useState(viewMode || "executive");

  const modeMeta = useMemo(() => {
    return mode === "executive"
      ? {
          title: "Executive Mode",
          accent: "rgba(143,196,255,0.38)",
          pillBg: "rgba(16,32,54,0.72)",
          pillColor: "#e8f3ff"
        }
      : {
          title: "Operations Mode",
          accent: "rgba(255,184,107,0.34)",
          pillBg: "rgba(54,31,15,0.74)",
          pillColor: "#ffe9cf"
        };
  }, [mode]);

  const statusMeta = useMemo(() => {
    if (systemStatus === "approval_queued") {
      return {
        label: "Approval Queued",
        glow: "0 0 0 1px rgba(122,224,178,0.16) inset, 0 0 60px rgba(52,150,108,0.16), 0 24px 54px rgba(0,0,0,0.34)",
        border: "1px solid rgba(122,224,178,0.22)",
        overlay: "radial-gradient(circle at 52% 42%, rgba(72,174,126,0.14) 0%, rgba(72,174,126,0.04) 28%, rgba(0,0,0,0) 60%)",
        text: "Case is progressing toward controlled execution. Approval is queued and the command surface is now emphasizing release readiness."
      };
    }

    if (systemStatus === "on_hold") {
      return {
        label: "On Hold",
        glow: "0 0 0 1px rgba(255,142,142,0.14) inset, 0 0 60px rgba(184,68,68,0.16), 0 24px 54px rgba(0,0,0,0.34)",
        border: "1px solid rgba(255,142,142,0.20)",
        overlay: "radial-gradient(circle at 52% 42%, rgba(184,68,68,0.14) 0%, rgba(184,68,68,0.04) 28%, rgba(0,0,0,0) 60%)",
        text: "Case has been placed on hold. The command surface is emphasizing caution until manual review resolves the current integrity concern."
      };
    }

    return {
      label: "Review In Progress",
      glow: "0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 50px rgba(80,140,220,0.18), 0 24px 54px rgba(0,0,0,0.34)",
      border: "1px solid rgba(120,170,245,0.24)",
      overlay: "radial-gradient(circle at 52% 42%, rgba(132,187,255,0.08) 0%, rgba(132,187,255,0.02) 28%, rgba(0,0,0,0) 58%)",
      text: "Case is under active review. The command surface is emphasizing visibility, verification, and operational context."
    };
  }, [systemStatus]);


  React.useEffect(() => {
    if (viewMode && viewMode !== mode) {
      setMode(viewMode);
    }
  }, [viewMode]);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setViewMode?.(nextMode);
  };

  React.useEffect(() => {
    const nextKey = [
      recommendation?.action,
      recommendation?.nextAction,
      recommendation?.recommended_action,
      recommendation?.recommendation,
      recommendation?.gtse?.recommended,
      recommendation?.actionLabel,
      recommendation?.type,
      recommendation?.title,
      timelineStep
    ]
      .filter(Boolean)
      .join("|");

    if (!nextKey) return;

    if (lastDecisionKey && nextKey !== lastDecisionKey) {
      setDecisionJustChanged(true);
      const t = setTimeout(() => setDecisionJustChanged(false), 1400);
      setLastDecisionKey(nextKey);
      return () => clearTimeout(t);
    }

    if (!lastDecisionKey) {
      setLastDecisionKey(nextKey);
    }
  }, [
    recommendation?.action,
    recommendation?.nextAction,
    recommendation?.recommended_action,
    recommendation?.recommendation,
    recommendation?.gtse?.recommended,
    recommendation?.actionLabel,
    recommendation?.type,
    recommendation?.title,
    timelineStep,
    lastDecisionKey
  ]);


  const decisionSignal = recommendation
    ? (() => {
        const rawLabel =
          recommendation.action ||
          recommendation.nextAction ||
          recommendation.recommended_action ||
          recommendation.recommendation ||
          recommendation.gtse?.recommended ||
          recommendation.actionLabel ||
          recommendation.type ||
          recommendation.title ||
          "recommended_action";

        const normalizedLabel = String(rawLabel)
          .replace(/_/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toUpperCase();

        const confidence =
          recommendation.confidence !== undefined && recommendation.confidence !== null
            ? (recommendation.confidence > 1
                ? Math.round(recommendation.confidence) + "%"
                : Math.round(recommendation.confidence * 100) + "%")
            : recommendation.confidenceScore !== undefined && recommendation.confidenceScore !== null
            ? (recommendation.confidenceScore > 1
                ? Math.round(recommendation.confidenceScore) + "%"
                : Math.round(recommendation.confidenceScore * 100) + "%")
            : "—";

        const type = String(recommendation.type || "").toLowerCase();
        const isHold =
          type.includes("hold") ||
          type.includes("risk") ||
          type.includes("suspend");

        const isRelease =
          type.includes("release") ||
          type.includes("funding") ||
          type.includes("confirm_funding_pool") ||
          type.includes("payment_pending");

        const isVerify =
          type.includes("verify") ||
          type.includes("verification") ||
          type.includes("request_case_packet") ||
          type.includes("assign_verifier") ||
          type.includes("queue_operator_review") ||
          type.includes("review");

        const stateLabel = String(timelineStep || "review_in_progress")
          .replace(/_/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toUpperCase();

        const nextStateMap = {
          RISK_SIGNAL: "VERIFICATION INQUIRY",
          ANOMALY_CLEAR: "ACTION QUEUED",
          VERIFICATION_INQUIRY: "ACTION QUEUED",
          ACTION_QUEUED: "OUTCOME PENDING",
          OUTCOME_PENDING: "PAYMENT PENDING",
          PAYMENT_PENDING: "FUNDED"
        };

        const nextStateLabel = nextStateMap[stateLabel] || "MONITOR";

        const riskBoost =
          stateLabel.includes("RISK") || stateLabel.includes("HOLD")
            ? 1.35
            : stateLabel.includes("VERIFICATION")
            ? 1.15
            : stateLabel.includes("PAYMENT")
            ? 1.1
            : 1;

        const riskScore =
          stateLabel.includes("RISK") || stateLabel.includes("HOLD")
            ? 0.72
            : stateLabel.includes("VERIFICATION")
            ? 0.48
            : stateLabel.includes("ACTION")
            ? 0.32
            : stateLabel.includes("OUTCOME")
            ? 0.24
            : stateLabel.includes("PAYMENT")
            ? 0.18
            : 0.26;

        const riskBand =
          riskScore >= 0.65 ? "HIGH"
          : riskScore >= 0.35 ? "MEDIUM"
          : "LOW";

        const alternativeAction =
          stateLabel.includes("PAYMENT")
            ? "HOLD FOR VERIFICATION"
            : stateLabel.includes("OUTCOME")
            ? "REQUEST REVIEW"
            : stateLabel.includes("ACTION")
            ? "ESCALATE MONITORING"
            : "MONITOR TREND";

        return {
          label: normalizedLabel,
          stateLabel,
          nextStateLabel,
          confidence,
          caseLabel: activeCase?.label || "Franklin County",
          riskBoost,
          riskScore,
          riskBand,
          alternativeAction,
          accent:
            isHold
              ? "#ff6f6f"
              : isRelease
              ? "#7dffb2"
              : isVerify
              ? "#ffbe72"
              : "#7fd8ff",
          border:
            isHold
              ? "1px solid rgba(255,111,111,0.42)"
              : isRelease
              ? "1px solid rgba(125,255,178,0.42)"
              : isVerify
              ? "1px solid rgba(255,190,114,0.42)"
              : "1px solid rgba(127,216,255,0.28)",
          glow:
            isHold
              ? "0 0 42px rgba(255,111,111,0.20)"
              : isRelease
              ? "0 0 42px rgba(125,255,178,0.20)"
              : isVerify
              ? "0 0 42px rgba(255,190,114,0.20)"
              : "0 0 36px rgba(120,180,255,0.18)"
        };
      })()
    : {
        label: "SYSTEM READY",
        stateLabel: "REVIEW IN PROGRESS",
        nextStateLabel: "MONITOR",
        confidence: "—",
        caseLabel: activeCase?.label || "Franklin County",
        riskBoost: 1,
        accent: "#7fd8ff",
        border: "1px solid rgba(127,216,255,0.25)",
        glow: "0 0 30px rgba(120,180,255,0.16)"
      };

  const buttonBase = {
    position: "relative",
    padding: "10px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.02em",
    cursor: "pointer",
    transition:
      "background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease"
  };

  return (
    <div className="top1-globe-shell"
      style={{
        width: "100%",
        height: "640px",
        borderRadius: 22,
        overflow: "hidden",
        position: "relative",
        border: statusMeta.border,
        background:
          "radial-gradient(circle at 50% 16%, rgba(40,74,116,0.22) 0%, rgba(5,10,18,0.94) 42%, rgba(2,4,8,1) 100%)",
        boxShadow: statusMeta.glow
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: statusMeta.overlay,
          zIndex: 1
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 6,
          borderRadius: 999,
          background: "rgba(7,14,24,0.72)",
          border: "1px solid rgba(143,196,255,0.16)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 28px rgba(0,0,0,0.24)"
        }}
      >
        <button
          onClick={() => handleModeChange("executive")}
          style={{
            ...buttonBase,
            border:
              mode === "executive"
                ? "1px solid rgba(143,196,255,0.52)"
                : "1px solid transparent",
            background:
              mode === "executive"
                ? "linear-gradient(180deg, rgba(28,50,82,0.96) 0%, rgba(18,34,58,0.96) 100%)"
                : "rgba(255,255,255,0.02)",
            color: mode === "executive" ? "#eef6ff" : "#9db4cc",
            boxShadow:
              mode === "executive"
                ? "0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 18px rgba(143,196,255,0.18)"
                : "none",
            transform: mode === "executive" ? "translateY(-1px)" : "translateY(0)"
          }}
        >
          Executive View
        </button>

        <button
          onClick={() => handleModeChange("operations")}
          style={{
            ...buttonBase,
            border:
              mode === "operations"
                ? "1px solid rgba(255,184,107,0.48)"
                : "1px solid transparent",
            background:
              mode === "operations"
                ? "linear-gradient(180deg, rgba(86,50,22,0.96) 0%, rgba(56,34,18,0.96) 100%)"
                : "rgba(255,255,255,0.02)",
            color: mode === "operations" ? "#fff0dc" : "#9db4cc",
            boxShadow:
              mode === "operations"
                ? "0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 18px rgba(255,184,107,0.16)"
                : "none",
            transform: mode === "operations" ? "translateY(-1px)" : "translateY(0)"
          }}
        >
          Operations View
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 30,
          display: "flex",
          alignItems: "center"
        }}
      >
        <div
          style={{
            padding: "7px 11px",
            borderRadius: 999,
            background: modeMeta.pillBg,
            border: `1px solid ${modeMeta.accent}`,
            color: modeMeta.pillColor,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            backdropFilter: "blur(10px)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.22)"
          }}
        >
          {modeMeta.title}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 18,
          zIndex: 30,
          padding: "10px 12px",
          borderRadius: 14,
          background: "rgba(7,14,24,0.56)",
          border: "1px solid rgba(143,196,255,0.12)",
          color: "#a9bfd8",
          fontSize: 11,
          lineHeight: 1.45,
          letterSpacing: "0.02em",
          backdropFilter: "blur(10px)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.24)",
          maxWidth: 340
        }}
      >
        <div
          style={{
            color: systemStatus === "on_hold" ? "#ffb3b3" : systemStatus === "approval_queued" ? "#9ef5c8" : "#cfe3ff",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 6
          }}
        >
          {statusMeta.label}
        </div>
        <div>
          {mode === "executive"
            ? "Designed for presentation, narrative framing, and investor-facing impact."
            : "Designed for county precision, jurisdiction overlays, and live operational analysis."}
        </div>
        <div style={{ marginTop: 6, color: "#8fa8be" }}>
          {statusMeta.text}
        </div>
      </div>


      <div
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          zIndex: 35,
          padding: "12px 16px",
          borderRadius: 14,
          background: "rgba(7,14,24,0.84)",
          border: decisionSignal.border,
          color: "#e6f0ff",
          backdropFilter: "blur(12px)",
          boxShadow: decisionJustChanged
            ? `0 10px 30px rgba(0,0,0,0.28), ${decisionSignal.glow}, 0 0 ${Math.round(44 * decisionSignal.riskBoost)}px ${decisionSignal.accent}22`
            : `0 10px 30px rgba(0,0,0,0.28), ${decisionSignal.glow}`,
          minWidth: 230,
          animation: decisionJustChanged
            ? "decisionPulse 1.2s ease-in-out infinite, decisionFlash 0.8s ease-out 1"
            : "decisionPulse 2.8s ease-in-out infinite",
          transform: decisionJustChanged ? "scale(1.03)" : "scale(1)",
          transition: "transform 180ms ease, box-shadow 220ms ease, border-color 220ms ease"
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: decisionSignal.accent
          }}
        >
          {decisionSignal.stateLabel
            ? `${decisionSignal.label} → ${decisionSignal.stateLabel}`
            : decisionSignal.label}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#9fb7d1"
          }}
        >
          → {decisionSignal.stateLabel}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            fontWeight: 700,
            color: "#e7f0fb"
          }}
        >
          {decisionSignal.caseLabel}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#8196ad",
            opacity: 0.72
          }}
        >
          Next: {decisionSignal.nextStateLabel}
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color:
              decisionSignal.riskBand === "HIGH"
                ? "#ff8e8e"
                : decisionSignal.riskBand === "MEDIUM"
                ? "#ffbe72"
                : "#9ee8c0"
          }}
        >
          Risk: {Math.round(decisionSignal.riskScore * 100)}% ({decisionSignal.riskBand})
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#8ea7bf",
            opacity: 0.78
          }}
        >
          Alt: {decisionSignal.alternativeAction}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            color: "#dce8f8"
          }}
        >
          Confidence: {decisionSignal.confidence}
          <span style={{ opacity: Math.max(0.5, 1 - decisionAge * 0.03), marginLeft: 6 }}>
            • aging
          </span>
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: mode === "executive" ? 1 : 0,
            transition: "opacity 260ms ease",
            pointerEvents: mode === "executive" ? "auto" : "none"
          }}
        >
          <CinematicGlobe />
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: mode === "operations" ? 1 : 0,
            transition: "opacity 260ms ease",
            pointerEvents: mode === "operations" ? "auto" : "none"
          }}
        >
          <OperationalMap />
        </div>
      </div>
    </div>
  );
}