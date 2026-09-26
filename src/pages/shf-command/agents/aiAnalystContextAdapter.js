// AFCC-2A.1: this adapter never held a browser-safe credential. The page-context
// dry run requires the Fabric admin key, which must not live in browser code, so
// the call fails closed until a server-side SHS->Fabric auth bridge exists (AFCC-2A.2).

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

export async function syncAIAnalystPageContext(payload) {
  return {
    ok: false,
    status: "auth_bridge_required",
    safe_to_wire: false,
    message: "Agent context sync requires a server-side SHS to Fabric auth bridge (AFCC-2A.2).",
    payload,
  };
}
