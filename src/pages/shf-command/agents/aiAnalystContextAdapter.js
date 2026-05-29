const DEFAULT_AGENT_FABRIC_BASE =
  import.meta.env.VITE_SHF_AGENT_FABRIC_BASE || "http://127.0.0.1:8090";

const DEFAULT_AGENT_ADMIN_KEY =
  import.meta.env.VITE_SHF_AGENT_ADMIN_KEY || "";

export function buildAIAnalystPageContextPayload({
  surface = "impact_command_center",
  page = "shf_impact_map",
  goal = "Keep AI Analyst synchronized with the map, drawer, and dashboard.",
  selectedCounty,
  selectedRegion,
  selectedEntity,
  selectedEntityId,
  oracleBundle,
  verificationState,
  drawerContext,
  mapContext,
}) {
  const truth = oracleBundle?.truth || oracleBundle?.raw?.truth || oracleBundle?.oracle_truth_package || {};

  const selectedEntityLabel =
    selectedEntity?.name ||
    selectedEntity?.title ||
    selectedEntity?.label ||
    selectedEntityId ||
    selectedCounty ||
    "SHF Impact Command Center";

  return {
    surface,
    page,
    goal,
    selected_state: {
      selected_entity: selectedEntityLabel,
      selected_entity_id: selectedEntityId || selectedEntity?.id || selectedEntity?.entityId || null,
      selected_county: selectedCounty || null,
      selected_region: selectedRegion || null,
    },
    oracle_truth_package: {
      truthStatus: truth?.truthStatus || truth?.status || "unknown",
      confidenceScore: truth?.confidenceScore ?? truth?.confidence ?? null,
      confidenceBand: truth?.confidenceBand || null,
      verificationStatus: truth?.verificationStatus || verificationState || "pending",
      contradictionStatus: truth?.contradictionStatus || "unknown",
      readinessStatus: truth?.readinessStatus || "unknown",
      recommendedNextAction: truth?.recommendedNextAction || null,
      traceId: truth?.traceId || truth?.trustEnvelope?.traceId || null,
      trustEnvelope: truth?.trustEnvelope || null,
    },
    verification_state: verificationState || truth?.verificationStatus || "pending",
    drawer_context: {
      drawer: "impact_command_context",
      open: true,
      active_tab: drawerContext?.active_tab || "analyst",
      title: drawerContext?.title || selectedEntityLabel,
      ...drawerContext,
    },
    map_context: {
      map_mode: mapContext?.map_mode || "statewide_or_regional",
      selected_county: selectedCounty || null,
      selected_region: selectedRegion || null,
      zoom_level: mapContext?.zoom_level || "auto",
      ...mapContext,
    },
  };
}

export async function syncAIAnalystPageContext(payload, options = {}) {
  const baseUrl = options.baseUrl || DEFAULT_AGENT_FABRIC_BASE;
  const adminKey = options.adminKey || DEFAULT_AGENT_ADMIN_KEY;

  if (!adminKey) {
    return {
      ok: false,
      status: "missing_admin_key",
      safe_to_wire: false,
      message:
        "Missing VITE_SHF_AGENT_ADMIN_KEY. Add it to .env.local for local dev only.",
      payload,
    };
  }

  const res = await fetch(
    `${baseUrl}/admin/agents/ai_analyst_agent/page-context-dry-run`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Agent context sync failed: ${res.status} ${text}`);
  }

  return res.json();
}
