export const MOCC_INTEGRATION_STATUSES = Object.freeze([
  "CONNECTED",
  "PARTIAL",
  "FOUNDATION",
  "PENDING",
  "NOT_CONNECTED",
  "UNAVAILABLE",
]);

function record(input) {
  return Object.freeze({
    domain: input.domain,
    status: input.status,
    owning_system: input.owning_system ?? null,
    expected_interface: input.expected_interface ?? null,
    mocc_ready_for: input.mocc_ready_for ?? null,
    missing_dependency: input.missing_dependency ?? null,
    impact: input.impact ?? null,
    completion_step: input.completion_step ?? null,
  });
}

const pendingIntegration = (input) => ({
  ...input,
  status: "PENDING",
});

export const MOCC_INTEGRATION_REGISTRY = Object.freeze([
  record({
    domain: "LIVING_CITY",
    status: "CONNECTED",
    owning_system: "Metaverse city registry and Quick Map",
    expected_interface: "Existing canonical city and map projections",
    mocc_ready_for: "Read-only city, district, and map context",
  }),
  record({
    domain: "MISSIONS",
    status: "CONNECTED",
    owning_system: "MET-7 Missions via MET-11 Orchestration",
    expected_interface: "Existing mission and city-event projections",
    mocc_ready_for: "Read-only mission and program activity projections",
  }),
  record({
    domain: "SIMULATIONS",
    status: "CONNECTED",
    owning_system: "Metaverse simulation domain",
    expected_interface: "Existing simulation experience",
    mocc_ready_for: "Read-only simulation layer status",
  }),
  record({
    domain: "CIVIC",
    status: "CONNECTED",
    owning_system: "SHF Civic via MET-11 Orchestration",
    expected_interface: "Existing civic projection",
    mocc_ready_for: "Read-only civic activity projection",
  }),
  record({
    domain: "MARINE_AVIATION",
    status: "PARTIAL",
    owning_system: "Metaverse Quick Map",
    expected_interface: "Existing provisional map-location records",
    mocc_ready_for: "Provisional spatial context only",
    missing_dependency: "No authoritative live port, marine, or aviation operations read source is connected.",
    impact: "MOCC cannot report live port or aviation activity.",
    completion_step: "Connect an owner-backed operational read interface before reporting live activity.",
  }),
  record({
    domain: "TRAFFIC",
    ...pendingIntegration({
      owning_system: "Metaverse traffic route and corridor foundation",
      expected_interface: "Authoritative read-only operational traffic state and event feed",
      mocc_ready_for: "Traffic state, source-backed events, affected route/location, and supplied timestamps",
      missing_dependency: "A queryable operational traffic-state interface; current route/corridor data is authored geometry and review/runtime presentation.",
      impact: "MOCC cannot report live congestion, closures, traffic events, or vehicle counts.",
      completion_step: "Connect the completed owner read interface through the MOCC adapter and MOCC-3 event projection.",
    }),
  }),
  record({
    domain: "WEATHER_OBSERVATIONS",
    ...pendingIntegration({
      owning_system: "Metaverse environment runtime (presentation configuration)",
      expected_interface: "Authoritative city weather observation read interface",
      mocc_ready_for: "Source-backed weather, wind, and air-quality values",
      missing_dependency: "An authoritative city observation source and queryable read contract; current environment presets are local presentation configuration.",
      impact: "MOCC cannot report live weather, wind, or air-quality measurements.",
      completion_step: "Identify and connect an owner-backed observation interface through a read-only adapter.",
    }),
  }),
  record({
    domain: "FIRE_EMS_INCIDENTS",
    ...pendingIntegration({
      owning_system: "Incident/dispatch authority not identified in the inspected Metaverse paths",
      expected_interface: "Authoritative read-only incident, dispatch, or 911 model/API",
      mocc_ready_for: "Incident identity, type, state, severity, location, timestamps, and responding units when supplied",
      missing_dependency: "The owning incident/dispatch system's queryable read interface and provenance contract.",
      impact: "MOCC cannot report active fire, EMS, or 911 incidents or response state.",
      completion_step: "Connect the owning system's completed read interface through the MOCC adapter and MOCC-3 event projection.",
    }),
  }),
  record({
    domain: "AGENT_ACTIONS",
    ...pendingIntegration({
      owning_system: "Agent Fabric",
      expected_interface: "Read-only operational agent-action feed",
      mocc_ready_for: "Source-backed agent action summaries and provenance",
      missing_dependency: "The MOCC-facing read integration, deferred from this pass.",
      impact: "MOCC cannot display source-backed agent actions.",
      completion_step: "Connect the approved Agent Fabric read interface through MOCC projection without adding command execution.",
    }),
  }),
  record({
    domain: "STUDENT_MISSION_ENTRY_EVENTS",
    ...pendingIntegration({
      owning_system: "MET-7 Mission operational event source",
      expected_interface: "Queryable read projection for existing mission-entry events",
      mocc_ready_for: "Mission entry/activity events with source references and supplied timestamps",
      missing_dependency: "A read collection for mission operational events; current emitters write to operational telemetry without a MOCC query interface.",
      impact: "MOCC cannot display mission-entry telemetry beyond existing orchestration projections.",
      completion_step: "Expose and connect an authorized read projection, then normalize its events through MOCC-3.",
    }),
  }),
  record({
    domain: "SIMULATION_RUNTIME_TELEMETRY",
    ...pendingIntegration({
      owning_system: "Metaverse simulation runtime",
      expected_interface: "Queryable read projection for simulation operational telemetry",
      mocc_ready_for: "Source-backed simulation lifecycle events with their original provenance",
      missing_dependency: "A telemetry read collection; current simulation event emitters do not expose a MOCC query interface.",
      impact: "MOCC cannot display live simulation runtime activity.",
      completion_step: "Connect the completed telemetry read projection through a domain adapter and MOCC-3.",
    }),
  }),
  record({
    domain: "UTILITIES",
    status: "NOT_CONNECTED",
  }),
  record({
    domain: "SHNN",
    status: "NOT_CONNECTED",
  }),
]);

export const MOCC_INTEGRATION_BY_DOMAIN = Object.freeze(
  Object.fromEntries(MOCC_INTEGRATION_REGISTRY.map((entry) => [entry.domain, entry])),
);

export const MOCC_PENDING_INTEGRATIONS = Object.freeze(
  MOCC_INTEGRATION_REGISTRY.filter((entry) => entry.status === "PENDING"),
);

export function getMoccIntegrationStatus(domain) {
  return MOCC_INTEGRATION_BY_DOMAIN[domain] || null;
}
