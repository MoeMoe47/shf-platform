import React, { useEffect, useMemo, useState } from "react";
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

function normalizeTruth(oracleTruth) {
  if (!oracleTruth) {
    return {
      truthStatus: "unknown",
      confidenceScore: null,
      confidenceBand: null,
      verificationStatus: "pending",
      contradictionStatus: "unknown",
      readinessStatus: "unknown",
      recommendedNextAction: null,
      traceId: null,
      trustEnvelope: null,
    };
  }

  return {
    truthStatus: oracleTruth.truthStatus || oracleTruth.status || "unknown",
    confidenceScore: oracleTruth.confidenceScore ?? oracleTruth.confidence ?? null,
    confidenceBand: oracleTruth.confidenceBand || null,
    verificationStatus: oracleTruth.verificationStatus || "pending",
    contradictionStatus: oracleTruth.contradictionStatus || "unknown",
    readinessStatus: oracleTruth.readinessStatus || "unknown",
    recommendedNextAction: oracleTruth.recommendedNextAction || null,
    traceId: oracleTruth.traceId || oracleTruth.trustEnvelope?.traceId || null,
    trustEnvelope: oracleTruth.trustEnvelope || null,
  };
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

  const truthPayload = useMemo(() => normalizeTruth(oracleTruth), [oracleTruth]);

  const selectedCounty = useMemo(() => {
    if (mapCountyContext?.county) {
      return titleCaseCounty(mapCountyContext.county);
    }

    const resolved = resolveCountyFromEntity(entityId);
    return titleCaseCounty(resolved || "Ohio");
  }, [entityId, mapCountyContext]);

  const mapMode =
    mapCountyContext?.mapMode ||
    (selectedCounty === "Ohio" ? "statewide" : "entity_county_focus");

  const drawerState = drawerContext?.open ? "open" : "closed";
  const contextSource = mapCountyContext?.source || "entity_resolver";
  const confidence = formatConfidence(truthPayload.confidenceScore);

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
        const res = await fetch(
          `${AGENT_BASE}/admin/agents/ai_analyst_agent/page-context-dry-run`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": AGENT_KEY,
            },
            body: JSON.stringify({
              surface,
              page,
              goal:
                "Keep AI Analyst synchronized with SHF entity, clicked county, drawer state, map mode, and Oracle truth context.",
              selected_state: {
                selected_entity: entityId,
                selected_county: selectedCounty,
                selected_region:
                  selectedCounty === "Ohio" ? "Statewide" : "Ohio",
              },
              oracle_truth_package: truthPayload,
              verification_state: truthPayload.verificationStatus || "pending",
              drawer_context: {
                drawer: drawerContext?.drawer || "ai_analyst_panel",
                open: drawerContext?.open ?? true,
                active_tab: drawerContext?.activeTab || "decision_engine",
                county: drawerContext?.county || selectedCounty,
                source: drawerContext?.source || "ai_analyst_panel",
                opened_at: drawerContext?.timestamp || null,
              },
              map_context: {
                map_mode: mapMode,
                selected_county: selectedCounty,
                zoom_level:
                  selectedCounty === "Ohio" ? "statewide" : "county",
                source: contextSource,
                clicked_at: mapCountyContext?.timestamp || null,
              },
            }),
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
            `AI Analyst is synced to ${selectedCounty}.`,
          detail:
            data?.analyst_preview?.recommended_next_action ||
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
    truthPayload,
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
          <span>Oracle</span>
          <strong>{truthPayload.truthStatus}</strong>
        </div>
        <div>
          <span>Verification</span>
          <strong>{truthPayload.verificationStatus}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{confidence}</strong>
        </div>
      </div>

      <div className="shf-agent-sync-footer">
        <span>Source: {contextSource}</span>
        <span>Entity: {entityId || "none"}</span>
      </div>

      {sync.detail ? <small>{sync.detail}</small> : null}
    </div>
  );
}
