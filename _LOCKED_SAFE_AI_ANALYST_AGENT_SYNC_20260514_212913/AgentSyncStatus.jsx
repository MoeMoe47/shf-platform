import React, { useEffect, useState } from "react";

const AGENT_BASE =
  import.meta.env.VITE_SHF_AGENT_FABRIC_BASE || "http://127.0.0.1:8090";

const AGENT_KEY =
  import.meta.env.VITE_SHF_AGENT_ADMIN_KEY || "";

export default function AgentSyncStatus({
  entityId = "shf-impact-command-center",
  surface = "impact_command_center",
  page = "shf_impact_map",
}) {
  const [sync, setSync] = useState({
    status: "checking",
    ok: false,
    message: "Checking Agent Fabric connection...",
    detail: "",
  });

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
              goal: "Confirm AI Analyst can safely receive SHF page context.",
              selected_state: {
                selected_entity: entityId,
                selected_county: "Ohio",
                selected_region: "Statewide",
              },
              oracle_truth_package: {
                truthStatus: "available",
                confidenceScore: null,
                readinessStatus: "context_check",
              },
              verification_state: "context_check",
              drawer_context: {
                drawer: "ai_analyst_panel",
                open: true,
                active_tab: "decision_engine",
              },
              map_context: {
                map_mode: "statewide",
                selected_county: "Ohio",
                zoom_level: "statewide",
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
            "AI Analyst is connected to Agent Fabric.",
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
  }, [entityId, surface, page]);

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

      {sync.detail ? <small>{sync.detail}</small> : null}
    </div>
  );
}
