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

  const truthPayload = useMemo(() => normalizeTruth(oracleTruth), [oracleTruth]);

  const selectedCounty = useMemo(() => {
    const resolved = resolveCountyFromEntity(entityId);
    return titleCaseCounty(resolved || "Ohio");
  }, [entityId]);

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
                "Keep AI Analyst synchronized with SHF entity, county, and Oracle truth context.",
              selected_state: {
                selected_entity: entityId,
                selected_county: selectedCounty,
                selected_region:
                  selectedCounty === "Ohio" ? "Statewide" : "Ohio",
              },
              oracle_truth_package: truthPayload,
              verification_state: truthPayload.verificationStatus || "pending",
              drawer_context: {
                drawer: "ai_analyst_panel",
                open: true,
                active_tab: "decision_engine",
              },
              map_context: {
                map_mode:
                  selectedCounty === "Ohio"
                    ? "statewide"
                    : "entity_county_focus",
                selected_county: selectedCounty,
                zoom_level:
                  selectedCounty === "Ohio" ? "statewide" : "county",
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
  }, [entityId, selectedCounty, surface, page, truthPayload]);

  return (
    <div className="shf-agent-sync-card" data-tour="shf-agent-sync">
      <div className="shf-agent-sync-top">
        <span
          className={`shf-agent-sync-dot ${
            sync.ok ? "is-synced" : "is-offline"
          }`}
        />
        <strong>Agent Fabric Sync</strong>
        <em>{sync.status}</em>
      </div>

      <p>{sync.message}</p>

      <small>
        County context: {selectedCounty} • Entity: {entityId || "none"}
      </small>

      {sync.detail ? <small>{sync.detail}</small> : null}
    </div>
  );
}
