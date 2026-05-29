import React, { useEffect, useMemo, useState } from "react";
import { useSHFOracle } from "../hooks/useSHFOracle";
import AgentSyncStatus from "./AgentSyncStatus";

function titleCaseCounty(value) {
  if (!value) return "Ohio";

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function cleanMode(value) {
  if (!value) return "statewide";
  return String(value).replace(/_/g, " ");
}

function buildContextAnalystView({ truth, mapContext, drawerContext }) {
  const county = titleCaseCounty(mapContext?.county || drawerContext?.county || "Ohio");
  const mapMode = cleanMode(mapContext?.mapMode || "statewide");
  const drawerOpen = Boolean(drawerContext?.open);

  if (!truth) {
    if (county && county !== "Ohio") {
      return {
        changedText: `${county} is now the active county focus. The map layer and Agent Fabric context are synchronized to the selected county.`,
        whyPoints: [
          `County context: ${county}`,
          `Map mode: ${mapMode}`,
          `Drawer state: ${drawerOpen ? "county detail open" : "county detail closed"}`,
          "Oracle truth package is not loaded yet, so the analyst is waiting before making a verified readiness judgment.",
        ],
        nextMoveText:
          drawerOpen
            ? `Review the ${county} county detail, then refresh Oracle to confirm readiness before exporting or reporting.`
            : `Open County Detail for ${county}, then refresh Oracle to confirm readiness before preparing the impact packet.`,
        actionLabel: "Refresh Oracle",
      };
    }

    return {
      changedText: "The command surface is in statewide monitoring mode.",
      whyPoints: [
        "No county is actively selected.",
        "The map is ready for county-level analysis.",
        "Oracle truth package is not loaded yet.",
      ],
      nextMoveText: "Select a county on the map to begin focused analysis.",
      actionLabel: "Refresh Oracle",
    };
  }

  const truthStatus = truth.truthStatus || "unknown";
  const verificationStatus = truth.verificationStatus || "unknown";
  const readinessStatus = truth.readinessStatus || "unknown";
  const confidenceScore = truth.confidenceScore ?? "—";
  const latestOracleAction = truth.latestOracleAction || null;

  let changedText = county !== "Ohio"
    ? `${county} is connected to the Oracle truth package and ready for analyst review.`
    : "Oracle has evaluated the current statewide command state.";

  let nextMoveText = truth.recommendedNextAction || "Await further validation.";
  let actionLabel = "Execute recommended action";

  if (readinessStatus === "leadership_ready") {
    changedText = `${county} has entered execution mode and is ready for operational follow-through.`;
    nextMoveText = truth.recommendedNextAction || "Proceed with reporting and institutional review.";
    actionLabel = "Execute execution step";
  } else if (readinessStatus === "internally_ready") {
    changedText = `${county} is internally ready for operator decision and advancement.`;
    nextMoveText = truth.recommendedNextAction || "Promote case or proceed with review.";
    actionLabel = "Promote case";
  } else if (readinessStatus === "blocked") {
    changedText = `${county} is currently blocked due to verification gaps or contradiction signals.`;
    nextMoveText = truth.recommendedNextAction || "Resolve verification issues before execution.";
    actionLabel = "Resolve blockers";
  } else if (readinessStatus === "not_ready") {
    changedText = `${county} is on verification hold until evidence gaps are resolved.`;
    nextMoveText = truth.recommendedNextAction || "Complete verification review before reactivation.";
    actionLabel = "Review verification hold";
  }

  const whyPoints = [
    `County context: ${county}`,
    `Truth: ${truthStatus}`,
    `Verification: ${verificationStatus}`,
    `Readiness: ${readinessStatus}`,
    `Confidence: ${confidenceScore}`,
  ];

  if (latestOracleAction) {
    whyPoints.push(`Latest action: ${latestOracleAction}`);
  }

  return {
    changedText,
    whyPoints,
    nextMoveText,
    actionLabel,
  };
}

export default function AIAnalystPanel({
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

  const [mapContext, setMapContext] = useState(null);
  const [drawerContext, setDrawerContext] = useState(null);

  useEffect(() => {
    function handleMapCountyContext(event) {
      const detail = event?.detail || {};
      if (!detail.county) return;

      setMapContext({
        county: detail.county,
        source: detail.source || "map_event",
        mapMode: detail.map_mode || "county_focus",
        timestamp: detail.timestamp || new Date().toISOString(),
      });
    }

    window.addEventListener("shf:map-county-context", handleMapCountyContext);

    return () => {
      window.removeEventListener("shf:map-county-context", handleMapCountyContext);
    };
  }, []);

  useEffect(() => {
    function handleDrawerContext(event) {
      const detail = event?.detail || {};

      setDrawerContext({
        drawer: detail.drawer || "county_detail",
        open: Boolean(detail.open),
        county: detail.county || null,
        source: detail.source || "drawer_event",
        activeTab: detail.active_tab || "county_detail",
        timestamp: detail.timestamp || new Date().toISOString(),
      });
    }

    window.addEventListener("shf:drawer-context", handleDrawerContext);

    return () => {
      window.removeEventListener("shf:drawer-context", handleDrawerContext);
    };
  }, []);

  const analystView = useMemo(
    () =>
      buildContextAnalystView({
        truth: effectiveTruth,
        mapContext,
        drawerContext,
      }),
    [effectiveTruth, mapContext, drawerContext]
  );

  const finalChangedText =
    analystView?.changedText || changedText || "No analyst update yet.";

  const finalWhyPoints =
    (analystView?.whyPoints && analystView.whyPoints.length
      ? analystView.whyPoints
      : whyPoints) || [];

  const finalNextMoveText =
    analystView?.nextMoveText || nextMoveText || "Await further validation.";

  const finalActionLabel =
    analystView?.actionLabel || actionLabel || "Execute recommended action";

  return (
    <section className="shf-panel shf-ai-analyst-panel">
      <div className="shf-panel__header shf-ai-panel-header">
        <div>
          <div className="shf-panel__small-label">AI ANALYST</div>
          <h2>Decision Engine</h2>
        </div>

        <button
          type="button"
          className="shf-ai-expand-button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("shf:ai-drawer-request", {
                  detail: {
                    source: "ai_analyst_panel",
                    surface: "impact_command_center",
                    action: "open_ai_drawer",
                    timestamp: new Date().toISOString(),
                  },
                })
              );
            }
          }}
        >
          Expand Analyst
        </button>
      </div>

      <AgentSyncStatus
        entityId={entityId || "shf-impact-command-center"}
        oracleTruth={effectiveTruth}
      />

      <div className="shf-panel__body">
        <div className="shf-ai-decision-stack">
          <div className="shf-ai-decision-block">
            <div className="shf-ai-decision-label">What changed</div>
            <div>{finalChangedText}</div>
          </div>

          <div className="shf-ai-decision-block">
            <div className="shf-ai-decision-label">Why it matters</div>
            <ul>
              {finalWhyPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="shf-ai-decision-block">
            <div className="shf-ai-decision-label">Next move</div>
            <div>{finalNextMoveText}</div>
          </div>

          <div>
            <button
              type="button"
              className="shf-ai-decision-action"
              onClick={() => onAction?.()}
            >
              {finalActionLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
