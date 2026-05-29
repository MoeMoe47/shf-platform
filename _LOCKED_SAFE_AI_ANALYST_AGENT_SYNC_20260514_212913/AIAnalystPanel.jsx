import React from "react";
import { useSHFOracle } from "../hooks/useSHFOracle";
import AgentSyncStatus from "./AgentSyncStatus";

function buildOracleAnalystView(truth) {
  if (!truth) {
    return {
      changedText: "Oracle truth is not available yet.",
      whyPoints: ["Awaiting truth package."],
      nextMoveText: "Wait for Oracle refresh.",
      actionLabel: "Refresh Oracle",
    };
  }

  const truthStatus = truth.truthStatus || "unknown";
  const verificationStatus = truth.verificationStatus || "unknown";
  const readinessStatus = truth.readinessStatus || "unknown";
  const confidenceScore = truth.confidenceScore ?? "—";
  const latestOracleAction = truth.latestOracleAction || null;

  let changedText = "Oracle has evaluated the current case state.";
  let nextMoveText = truth.recommendedNextAction || "Await further validation.";
  let actionLabel = "Execute recommended action";

  if (readinessStatus === "execution_mode") {
    changedText = "Case has entered execution mode and is ready for operational follow-through.";
    nextMoveText = truth.recommendedNextAction || "Proceed with reporting and institutional review.";
    actionLabel = "Execute execution step";
  } else if (readinessStatus === "internally_ready") {
    changedText = "Case is internally ready for operator decision and advancement.";
    nextMoveText = truth.recommendedNextAction || "Promote case or proceed with review.";
    actionLabel = "Promote case";
  } else if (readinessStatus === "blocked") {
    changedText = "Case is currently blocked due to verification gaps or contradiction signals.";
    nextMoveText = truth.recommendedNextAction || "Resolve verification issues before execution.";
    actionLabel = "Resolve blockers";
  } else if (readinessStatus === "verification_hold") {
    changedText = "Case is on verification hold until evidence gaps are resolved.";
    nextMoveText = truth.recommendedNextAction || "Complete verification review before reactivation.";
    actionLabel = "Review verification hold";
  }

  const whyPoints = [
    `Truth: ${truthStatus}`,
    `Verification: ${verificationStatus}`,
    `Readiness: ${readinessStatus}`,
    `Confidence: ${confidenceScore}`,
  ];

  if (latestOracleAction) {
    whyPoints.push(`Latest Action: ${latestOracleAction}`);
  }

  return {
    changedText,
    whyPoints,
    nextMoveText,
    actionLabel,
  };
}

export default function AIAnalystPanel({
  agentSync = null,
  agentContextPayload = null,
  entityId = null,
  oracleTruth = null,
  changedText = "",
  whyPoints = [],
  nextMoveText = "",
  actionLabel = "",
  onAction = null,
}) {
  const { truth: hookTruth } = useSHFOracle(entityId || null);
  const effectiveTruth = hookTruth || oracleTruth || null;
  const oracleView = buildOracleAnalystView(effectiveTruth);

  const finalChangedText = oracleView?.changedText || changedText || "No analyst update yet.";
  const finalWhyPoints =
    (oracleView?.whyPoints && oracleView.whyPoints.length ? oracleView.whyPoints : whyPoints) || [];
  const finalNextMoveText = oracleView?.nextMoveText || nextMoveText || "Await further validation.";
  const finalActionLabel = oracleView?.actionLabel || actionLabel || "Execute recommended action";

  return (
    <section className="shf-panel">

      {agentSync ? (
        <div className="shf-agent-sync-card" data-tour="shf-agent-sync">
          <div className="shf-agent-sync-top">
            <span className={`shf-agent-sync-dot ${agentSync?.ok ? "is-synced" : "is-offline"}`} />
            <strong>Agent Fabric Sync</strong>
            <em>{agentSync?.status || "idle"}</em>
          </div>
          <p>
            {agentSync?.analyst_preview?.plain_language_summary ||
              agentSync?.error ||
              "Waiting for synchronized map, drawer, and Oracle context."}
          </p>
          {agentSync?.analyst_preview?.recommended_next_action ? (
            <small>{agentSync.analyst_preview.recommended_next_action}</small>
          ) : null}
        </div>
      ) : null}

      <div className="shf-panel__header">
        <div>
          <div className="shf-panel__small-label">AI ANALYST</div>
          <h2>Decision Engine</h2>
        </div>
      </div>

      <AgentSyncStatus entityId={entityId || "shf-impact-command-center"} />

      <div className="shf-panel__body">
        <div style={{ display: "grid", gap: 18 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>What changed</div>
            <div>{finalChangedText}</div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Why it matters</div>
            <ul style={{ margin: 0, paddingLeft: 24 }}>
              {finalWhyPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Next move</div>
            <div>{finalNextMoveText}</div>
          </div>

          <div>
            <button type="button" onClick={() => onAction?.()}>
              {finalActionLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
