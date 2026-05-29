import React, { useEffect, useMemo, useState } from "react";
import { buildAIAnalystTruthContext } from "@/shared/ai-analyst/aiAnalystTruthContext";
import { resolveCountyFromEntity } from "@/system/resolvers/entityToCounty";

const AGENT_BASE =
  import.meta.env.VITE_SHF_AGENT_FABRIC_BASE || "http://127.0.0.1:8090";

const AGENT_KEY =
  import.meta.env.VITE_SHF_AGENT_ADMIN_KEY || "";

function titleCaseCounty(value) {
  if (!value) return "Ohio";

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatConfidence(value) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isFinite(num)) {
    return num <= 1 ? `${Math.round(num * 100)}%` : `${Math.round(num)}%`;
  }
  return String(value);
}

export default function AgentSyncStatus({
  entityId = "shf-impact-command-center",
  oracleTruth = null,
  surface = "impact_command_center",
  page = "shf_impact_map",
}) {
  const [sync, setSync] = useState({
    status: "checking",
    ok: false,
    message: "Checking Agent Fabric connection...",
    detail: "",
  });

  const [mapCountyContext, setMapCountyContext] = useState(null);
  const [drawerContext, setDrawerContext] = useState(null);

  const selectedCounty = useMemo(() => {
    if (mapCountyContext?.county) {
      return titleCaseCounty(mapCountyContext.county);
    }

    if (drawerContext?.county) {
      return titleCaseCounty(drawerContext.county);
    }

    const resolved = resolveCountyFromEntity(entityId);
    return titleCaseCounty(resolved || "Ohio");
  }, [entityId, mapCountyContext, drawerContext]);

  const mapMode =
    mapCountyContext?.mapMode ||
    (selectedCounty === "Ohio" ? "statewide" : "entity_county_focus");

  const drawerState = drawerContext?.open ? "open" : "closed";
  const contextSource = mapCountyContext?.source || drawerContext?.source || "entity_resolver";

  const truthContext = useMemo(() => {
    return buildAIAnalystTruthContext({
      oracleTruth,
      surface,
      selectedEntityId: entityId,
      selectedCounty,
      traceCoverageStatus:
        oracleTruth?.traceCoverageStatus ||
        oracleTruth?.trustEnvelope?.traceCoverageStatus ||
        "complete",
      reportingReadiness: {
        ready: [
          "internally_ready",
          "leadership_ready",
          "funder_ready",
          "public_ready",
        ].includes(String(oracleTruth?.readinessStatus || "")),
        status: oracleTruth ? "truth_loaded" : "awaiting_truth",
        reasons: oracleTruth ? [] : ["oracle_truth_missing"],
        publicationMode: oracleTruth?.trustEnvelope?.publicationMode || "internal",
      },
      permissions: [
        "truth.view",
        "oracle.view",
        "trustEnvelope.view",
        "trace.view",
      ],
      mapContext: {
        map_mode: mapMode,
        selected_county: selectedCounty,
        source: contextSource,
        clicked_at: mapCountyContext?.timestamp || null,
      },
      drawerContext: {
        drawer: drawerContext?.drawer || "ai_analyst_panel",
        open: drawerContext?.open ?? true,
        active_tab: drawerContext?.activeTab || "decision_engine",
        county: drawerContext?.county || selectedCounty,
        source: drawerContext?.source || "agent_sync_status",
        opened_at: drawerContext?.timestamp || null,
      },
    });
  }, [
    oracleTruth,
    surface,
    entityId,
    selectedCounty,
    mapMode,
    contextSource,
    mapCountyContext,
    drawerContext,
  ]);

  const confidence = formatConfidence(truthContext.confidenceScore);

  useEffect(() => {
    function handleMapCountyContext(event) {
      const detail = event?.detail || {};
      if (!detail.county) return;

      setMapCountyContext({
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

  useEffect(() => {
    let cancelled = false;

    async function runCheck() {
      if (!AGENT_KEY) {
        setSync({
          status: "missing_key",
          ok: false,
          message: "Agent Fabric key missing.",
          detail: "Add VITE_SHF_AGENT_ADMIN_KEY to .env.local for local dev.",
        });
        return;
      }

      try {
        const payload = {
          surface,
          page,
          goal:
            "Keep AI Analyst synchronized with SHF entity, clicked county, drawer state, map mode, Oracle truth, trust envelope, and trace coverage.",
          selected_state: {
            selected_entity: entityId,
            selected_entity_id: truthContext.selectedEntityId || entityId,
            selected_county: selectedCounty,
            selected_region: selectedCounty === "Ohio" ? "Statewide" : "Ohio",
          },
          oracle_truth_package: {
            truthStatus: truthContext.truthStatus,
            confidenceScore: truthContext.confidenceScore,
            confidenceBand: truthContext.confidenceBand,
            verificationStatus: truthContext.verificationStatus,
            contradictionStatus: truthContext.contradictionStatus,
            readinessStatus: truthContext.readinessStatus,
            recommendedNextAction: truthContext.recommendation,
            traceId: truthContext.traceId,
            trustEnvelope: truthContext.trustEnvelope,
          },
          truth_spine_context: {
            riskLevel: truthContext.riskLevel,
            decisionPosture: truthContext.decisionPosture,
            trustEnvelopePresent: truthContext.trustEnvelopePresent,
            traceCoverageStatus: truthContext.traceCoverageStatus,
            publicationMode: truthContext.publicationMode,
            reportingReady: truthContext.reportingReady,
            reportingStatus: truthContext.reportingStatus,
            reportingReasons: truthContext.reportingReasons,
            canViewTruth: truthContext.canViewTruth,
            canViewOracle: truthContext.canViewOracle,
            canExportReports: truthContext.canExportReports,
            canViewAudit: truthContext.canViewAudit,
            summary: truthContext.summary,
            whyPoints: truthContext.whyPoints,
          },
          verification_state: truthContext.verificationStatus || "pending",
          drawer_context: {
            drawer: drawerContext?.drawer || "ai_analyst_panel",
            open: drawerContext?.open ?? true,
            active_tab: drawerContext?.activeTab || "decision_engine",
            county: drawerContext?.county || selectedCounty,
            source: drawerContext?.source || "agent_sync_status",
            opened_at: drawerContext?.timestamp || null,
          },
          map_context: {
            map_mode: mapMode,
            selected_county: selectedCounty,
            zoom_level: selectedCounty === "Ohio" ? "statewide" : "county",
            source: contextSource,
            clicked_at: mapCountyContext?.timestamp || null,
          },
        };

        const res = await fetch(
          `${AGENT_BASE}/admin/agents/ai_analyst_agent/page-context-dry-run`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": AGENT_KEY,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) {
          throw new Error(`Agent Fabric returned ${res.status}`);
        }

        const data = await res.json();

        if (cancelled) return;

        setSync({
          status: data?.status || "connected",
          ok: Boolean(data?.ok),
          message:
            data?.analyst_preview?.plain_language_summary ||
            truthContext.summary ||
            `AI Analyst is synced to ${selectedCounty}.`,
          detail:
            data?.analyst_preview?.recommended_next_action ||
            truthContext.recommendation ||
            "Safe dry-run completed. No tools executed and no records modified.",
        });
      } catch (error) {
        if (cancelled) return;

        setSync({
          status: "offline",
          ok: false,
          message: "Agent Fabric is offline or unreachable.",
          detail: error?.message || "Connection check failed.",
        });
      }
    }

    runCheck();

    return () => {
      cancelled = true;
    };
  }, [
    entityId,
    selectedCounty,
    surface,
    page,
    truthContext,
    mapCountyContext,
    drawerContext,
    mapMode,
    contextSource,
  ]);

  return (
    <div className="shf-agent-sync-card shf-agent-sync-card--final" data-tour="shf-agent-sync">
      <div className="shf-agent-sync-top">
        <span
          className={`shf-agent-sync-dot ${
            sync.ok ? "is-synced" : "is-offline"
          }`}
        />
        <strong>Agent Context Sync</strong>
        <em>{sync.status}</em>
      </div>

      <p>{sync.message}</p>

      <div className="shf-agent-sync-grid">
        <div>
          <span>Map</span>
          <strong>{mapMode.replace(/_/g, " ")}</strong>
        </div>
        <div>
          <span>County</span>
          <strong>{selectedCounty}</strong>
        </div>
        <div>
          <span>Drawer</span>
          <strong>{drawerState}</strong>
        </div>
        <div>
          <span>Truth</span>
          <strong>{truthContext.truthStatus}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{confidence}</strong>
        </div>
        <div>
          <span>Risk</span>
          <strong>{truthContext.riskLevel}</strong>
        </div>
        <div>
          <span>Posture</span>
          <strong>{truthContext.decisionPosture.replace(/_/g, " ")}</strong>
        </div>
        <div>
          <span>Trace</span>
          <strong>{truthContext.traceCoverageStatus}</strong>
        </div>
      </div>

      <p className="shf-agent-sync-detail">{sync.detail}</p>
    </div>
  );
}
