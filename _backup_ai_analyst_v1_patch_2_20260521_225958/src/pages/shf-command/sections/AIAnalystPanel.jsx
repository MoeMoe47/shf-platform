import React, { useEffect, useMemo, useState } from "react";
import { buildAIAnalystTruthContext } from "@/shared/ai-analyst/aiAnalystTruthContext";
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

function getReadinessActionLabel(context) {
  if (!context?.trustEnvelopePresent) return "Review trust envelope";
  if (context?.traceCoverageStatus !== "complete") return "Complete trace coverage";

  switch (context?.decisionPosture) {
    case "ready_for_authorized_use":
      return "Execute recommended action";
    case "ready_for_internal_review":
      return "Promote internal review";
    case "hold_or_escalate":
      return "Resolve blockers";
    case "awaiting_truth":
      return "Refresh Oracle";
    default:
      return "Review verification";
  }
}

function buildContextAnalystView({ truthContext, mapContext, drawerContext }) {
  const county = titleCaseCounty(
    truthContext?.selectedCounty ||
      mapContext?.county ||
      drawerContext?.county ||
      "Ohio"
  );

  const mapMode = cleanMode(mapContext?.mapMode || mapContext?.map_mode || "statewide");
  const drawerOpen = Boolean(drawerContext?.open);

  if (!truthContext || truthContext.truthStatus === "unknown") {
    if (county && county !== "Ohio") {
      return {
        changedText: `${county} is now the active county focus. The map layer and drawer context are synchronized, but Oracle truth is still pending.`,
        whyPoints: [
          `County context: ${county}`,
          `Map mode: ${mapMode}`,
          `Drawer state: ${drawerOpen ? "county detail open" : "county detail closed"}`,
          "Oracle truth package is not loaded yet.",
          "The analyst is waiting for verified truth before making a readiness judgment.",
        ],
        nextMoveText:
          drawerOpen
            ? `Review the ${county} county detail, then refresh Oracle before exporting or reporting.`
            : `Open County Detail for ${county}, then refresh Oracle before preparing an impact packet.`,
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

  const countyText = county && county !== "Ohio" ? `${county}` : "The current command state";

  let changedText = `${countyText} is connected to the Truth Spine and ready for analyst review.`;

  if (truthContext.decisionPosture === "ready_for_authorized_use") {
    changedText = `${countyText} is ready for authorized downstream use based on the current Oracle truth package.`;
  } else if (truthContext.decisionPosture === "ready_for_internal_review") {
    changedText = `${countyText} is internally ready and should move through operator review before external use.`;
  } else if (truthContext.decisionPosture === "hold_or_escalate") {
    changedText = `${countyText} requires hold or escalation because the Truth Spine shows elevated risk or blockers.`;
  } else if (truthContext.decisionPosture === "continue_review") {
    changedText = `${countyText} remains in review while verification, readiness, or trace conditions are completed.`;
  }

  const whyPoints = [
    `County context: ${county}`,
    `Truth: ${truthContext.truthStatus}`,
    `Verification: ${truthContext.verificationStatus}`,
    `Readiness: ${truthContext.readinessStatus}`,
    `Confidence: ${truthContext.confidenceScore ?? "—"} (${truthContext.confidenceBand})`,
    `Risk level: ${truthContext.riskLevel}`,
    `Trust envelope: ${truthContext.trustEnvelopePresent ? "present" : "missing"}`,
    `Trace coverage: ${truthContext.traceCoverageStatus}`,
  ];

  if (truthContext.traceId) {
    whyPoints.push(`Trace ID: ${truthContext.traceId}`);
  }

  if (mapMode) {
    whyPoints.push(`Map mode: ${mapMode}`);
  }

  return {
    changedText,
    whyPoints,
    nextMoveText: truthContext.recommendation || "Continue verified review before downstream action.",
    actionLabel: getReadinessActionLabel(truthContext),
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
        selected_county: detail.county,
        source: detail.source || "map_event",
        mapMode: detail.map_mode || "county_focus",
        map_mode: detail.map_mode || "county_focus",
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
        active_tab: detail.active_tab || "county_detail",
        timestamp: detail.timestamp || new Date().toISOString(),
      });
    }

    window.addEventListener("shf:drawer-context", handleDrawerContext);

    return () => {
      window.removeEventListener("shf:drawer-context", handleDrawerContext);
    };
  }, []);

  const truthContext = useMemo(() => {
    return buildAIAnalystTruthContext({
      oracleTruth: effectiveTruth,
      surface: "shf_impact_command_center",
      selectedEntityId: entityId || effectiveTruth?.entityId || null,
      selectedCounty: mapContext?.county || drawerContext?.county || null,
      traceCoverageStatus:
        effectiveTruth?.traceCoverageStatus ||
        effectiveTruth?.trustEnvelope?.traceCoverageStatus ||
        "complete",
      reportingReadiness: {
        ready: [
          "internally_ready",
          "leadership_ready",
          "funder_ready",
          "public_ready",
        ].includes(String(effectiveTruth?.readinessStatus || "")),
        status: effectiveTruth ? "truth_loaded" : "awaiting_truth",
        reasons: effectiveTruth ? [] : ["oracle_truth_missing"],
        publicationMode: effectiveTruth?.trustEnvelope?.publicationMode || "internal",
      },
      permissions: [
        "truth.view",
        "oracle.view",
        "trustEnvelope.view",
        "trace.view",
      ],
      mapContext,
      drawerContext,
    });
  }, [effectiveTruth, entityId, mapContext, drawerContext]);

  const analystView = useMemo(
    () =>
      buildContextAnalystView({
        truthContext,
        mapContext,
        drawerContext,
      }),
    [truthContext, mapContext, drawerContext]
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
                    truthContext,
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
        entityId={entityId || truthContext?.selectedEntityId || "shf-impact-command-center"}
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
              onClick={() =>
                onAction?.({
                  truthContext,
                  mapContext,
                  drawerContext,
                  source: "ai_analyst_panel",
                })
              }
            >
              {finalActionLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
