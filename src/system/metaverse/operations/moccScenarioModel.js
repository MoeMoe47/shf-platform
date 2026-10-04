import { MINIMAP_LOCATION_REGISTRY } from "../metaverseMiniMapRegistry.js";
import { METAVERSE_DISTRICT_MARKERS, METAVERSE_FACILITIES } from "../metaverseNavigationModel.js";
import { getMoccIntegrationStatus, MOCC_INTEGRATION_REGISTRY } from "./moccIntegrationStatusRegistry.js";

export const MOCC_SCENARIO_STATUSES = Object.freeze([
  "DRAFT", "READY", "BLOCKED", "PENDING_INTEGRATION", "PENDING_APPROVAL", "VALIDATED", "ARCHIVED",
]);

export const MOCC_SCENARIO_MODES = Object.freeze(["SIMULATION", "TRAINING", "TABLETOP"]);
export const MOCC_SCENARIO_READINESS = Object.freeze([
  "NOT_READY", "PENDING_INTEGRATION", "PENDING_APPROVAL", "READY_FOR_SIMULATION",
]);

export const MOCC_SCENARIO_DOMAIN_OPTIONS = Object.freeze(MOCC_INTEGRATION_REGISTRY.map(({ domain }) => ({
  domain,
  label: domain.replaceAll("_", " "),
})));

export function getMoccScenarioSpatialReferences() {
  return [
    ...METAVERSE_FACILITIES.map((facility) => ({ reference: `facility:${facility.id}`, label: facility.label, status: "CANONICAL" })),
    ...METAVERSE_DISTRICT_MARKERS.map((district) => ({ reference: `district:${district.id}`, label: district.fullLabel || district.label, status: "CANONICAL" })),
    ...MINIMAP_LOCATION_REGISTRY.map((location) => ({ reference: `quick-map:${location.id}`, label: location.label, status: location.status })),
  ];
}

const DOMAIN_BLOCKING_STATUSES = new Set(["NOT_CONNECTED", "UNAVAILABLE", "FOUNDATION", "PARTIAL"]);

function optionalText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asList(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object" && !Array.isArray(item)) : [];
}

function domainEntries(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const domain = typeof entry === "string" ? entry : optionalText(entry?.domain);
    if (!domain || !getMoccIntegrationStatus(domain)) return [];
    return [{ domain, required: typeof entry === "string" ? true : entry.required !== false }];
  });
}

function canonicalSpatialReference(reference) {
  if (typeof reference !== "string") return null;
  const [kind, ...idParts] = reference.split(":");
  const id = idParts.join(":");
  if (!id) return null;
  if (kind === "facility") {
    const facility = METAVERSE_FACILITIES.find((item) => item.id === id || item.destinationId === id);
    return facility ? { reference, authority: "METAVERSE_CANONICAL_SPATIAL_REGISTRY", status: "CANONICAL" } : null;
  }
  if (kind === "district") {
    const district = METAVERSE_DISTRICT_MARKERS.find((item) => item.id === id);
    return district ? { reference, authority: "METAVERSE_CANONICAL_SPATIAL_REGISTRY", status: "CANONICAL" } : null;
  }
  if (kind === "quick-map") {
    const location = MINIMAP_LOCATION_REGISTRY.find((item) => item.id === id);
    return location ? {
      reference,
      authority: "QUICK_MAP",
      coordinate_space_id: location.coordinateSpaceId,
      status: location.status,
    } : null;
  }
  return null;
}

function issue(code, detail = {}) {
  return { code, ...detail };
}

export function createMoccScenarioDraft(scenarioId) {
  return {
    scenario_id: optionalText(scenarioId),
    title: null,
    description: null,
    scenario_type: null,
    status: "DRAFT",
    mode: "SIMULATION",
    created_by: null,
    created_at: null,
    updated_at: null,
    duration_minutes: null,
    participating_domains: [],
    integration_requirements: [],
    dependencies: [],
    initial_conditions: {},
    planned_events: [],
    mission_references: [],
    schedule_references: [],
    spatial_references: [],
    approval_required: null,
    approval_status: null,
    approved_by: null,
    evidence_refs: [],
    audit_refs: [],
    metadata: {},
  };
}

export function projectMoccScenario(scenario = {}, { dependencyGraph = null, schedules = [], integrations = MOCC_INTEGRATION_REGISTRY } = {}) {
  const record = scenario && typeof scenario === "object" && !Array.isArray(scenario) ? scenario : {};
  const graphNodes = new Map((dependencyGraph?.nodes || []).map((node) => [node.node_id, node]));
  const scheduleIds = new Set((Array.isArray(schedules) ? schedules : []).map((item) => item?.schedule_id).filter(Boolean));
  const integrationByDomain = new Map((Array.isArray(integrations) ? integrations : []).map((entry) => [entry.domain, entry]));
  const domains = domainEntries(record.participating_domains);
  const dependencies = Array.isArray(record.dependencies) ? record.dependencies.filter((value) => typeof value === "string" && value) : [];
  const spatialReferences = Array.isArray(record.spatial_references) ? record.spatial_references.filter((value) => typeof value === "string" && value) : [];
  const scheduleReferences = Array.isArray(record.schedule_references) ? record.schedule_references.filter((value) => typeof value === "string" && value) : [];
  const plannedEvents = asList(record.planned_events).map((event) => ({
    scenario_event_id: optionalText(event.scenario_event_id),
    event_type: optionalText(event.event_type),
    domain: optionalText(event.domain),
    relative_time_minutes: Number.isFinite(event.relative_time_minutes) ? event.relative_time_minutes : null,
    target_reference: optionalText(event.target_reference),
    parameters: event.parameters && typeof event.parameters === "object" && !Array.isArray(event.parameters) ? { ...event.parameters } : {},
    dependencies: Array.isArray(event.dependencies) ? event.dependencies.filter((value) => typeof value === "string") : [],
  }));
  const issues = [];
  const pendingDomains = [];
  const blockedDomains = [];

  if (!optionalText(record.scenario_id)) issues.push(issue("SCENARIO_ID_UNSPECIFIED"));
  if (!optionalText(record.title)) issues.push(issue("TITLE_REQUIRED"));
  if (!optionalText(record.scenario_type)) issues.push(issue("SCENARIO_TYPE_REQUIRED"));
  const mode = optionalText(record.mode)?.toUpperCase() || null;
  if (!mode || !MOCC_SCENARIO_MODES.includes(mode)) issues.push(issue("UNSUPPORTED_OR_MISSING_MODE", { mode }));
  const duration = Number(record.duration_minutes);
  const validDuration = Number.isFinite(duration) && duration > 0;
  if (!validDuration) issues.push(issue("INVALID_DURATION"));

  for (const participant of domains) {
    const integration = integrationByDomain.get(participant.domain) || getMoccIntegrationStatus(participant.domain);
    if (!integration) {
      if (participant.required) blockedDomains.push(participant.domain);
      issues.push(issue("INTEGRATION_NOT_REGISTERED", { domain: participant.domain, required: participant.required }));
      continue;
    }
    if (!participant.required) continue;
    if (integration.status === "PENDING") pendingDomains.push(participant.domain);
    else if (DOMAIN_BLOCKING_STATUSES.has(integration.status)) blockedDomains.push(participant.domain);
  }
  for (const reference of dependencies) {
    const node = graphNodes.get(reference);
    if (!node) {
      issues.push(issue("DEPENDENCY_UNRESOLVED", { reference }));
    } else if (node.node_type === "INTEGRATION") {
      if (node.status === "PENDING") pendingDomains.push(node.domain);
      else if (DOMAIN_BLOCKING_STATUSES.has(node.status)) blockedDomains.push(node.domain);
      else if (node.status !== "CONNECTED") issues.push(issue("DEPENDENCY_STATUS_UNAVAILABLE", { reference, status: node.status || null }));
    }
  }
  const pendingDomainList = [...new Set(pendingDomains)];
  if (pendingDomainList.length) issues.push(issue("REQUIRED_INTEGRATION_PENDING", { domains: pendingDomainList }));
  for (const domain of new Set(blockedDomains)) {
    const integration = integrationByDomain.get(domain) || getMoccIntegrationStatus(domain);
    issues.push(issue("REQUIRED_INTEGRATION_NOT_READY", { domain, status: integration?.status || null }));
  }
  const resolvedSpatialReferences = spatialReferences.map((reference) => canonicalSpatialReference(reference));
  spatialReferences.forEach((reference, index) => {
    if (!resolvedSpatialReferences[index]) issues.push(issue("SPATIAL_REFERENCE_UNRESOLVED", { reference }));
  });
  for (const reference of scheduleReferences) {
    if (!scheduleIds.has(reference)) issues.push(issue("SCHEDULE_REFERENCE_UNRESOLVED", { reference }));
  }
  const missionReferences = Array.isArray(record.mission_references) ? record.mission_references.filter((value) => typeof value === "string" && value) : [];
  for (const reference of missionReferences) {
    if (!(dependencyGraph?.nodes || []).some((node) => node.node_type === "MISSION" && (node.node_id === `mission:${reference}` || node.source_reference === reference))) {
      issues.push(issue("MISSION_REFERENCE_UNRESOLVED", { reference }));
    }
  }

  const eventIds = new Set(plannedEvents.map((event) => event.scenario_event_id).filter(Boolean));
  plannedEvents.forEach((event) => {
    if (!event.scenario_event_id || !event.event_type || !event.domain) issues.push(issue("SCENARIO_EVENT_FIELDS_REQUIRED", { scenario_event_id: event.scenario_event_id }));
    if (!Number.isFinite(event.relative_time_minutes) || event.relative_time_minutes < 0 || (validDuration && event.relative_time_minutes > duration)) {
      issues.push(issue("SCENARIO_EVENT_TIME_INVALID", { scenario_event_id: event.scenario_event_id }));
    }
    if (event.target_reference && !canonicalSpatialReference(event.target_reference)) {
      issues.push(issue("SCENARIO_EVENT_TARGET_UNRESOLVED", { scenario_event_id: event.scenario_event_id, reference: event.target_reference }));
    }
    for (const dependency of event.dependencies) {
      if (!eventIds.has(dependency)) issues.push(issue("SCENARIO_EVENT_DEPENDENCY_UNRESOLVED", { scenario_event_id: event.scenario_event_id, reference: dependency }));
    }
  });

  const approvalRequired = record.approval_required === true;
  // No MOCC approval authority is connected; submitted approval fields cannot grant readiness.
  const approvalPending = approvalRequired;
  if (approvalPending) issues.push(issue("APPROVAL_NOT_CONFIGURED"));
  const blockingIssue = issues.some(({ code }) => !["REQUIRED_INTEGRATION_PENDING", "APPROVAL_NOT_CONFIGURED"].includes(code));
  let readiness = "NOT_READY";
  let status = "DRAFT";
  if (String(record.status || "").toUpperCase() === "ARCHIVED") {
    status = "ARCHIVED";
  } else if (!blockingIssue && pendingDomains.length) {
    status = "PENDING_INTEGRATION";
    readiness = "PENDING_INTEGRATION";
  } else if (!blockingIssue && approvalPending) {
    status = "PENDING_APPROVAL";
    readiness = "PENDING_APPROVAL";
  } else if (!blockingIssue) {
    status = "READY";
    readiness = "READY_FOR_SIMULATION";
  } else if (optionalText(record.scenario_id) && optionalText(record.title)) {
    status = "BLOCKED";
  }

  return {
    scenario_id: optionalText(record.scenario_id),
    title: optionalText(record.title),
    description: optionalText(record.description),
    scenario_type: optionalText(record.scenario_type),
    status,
    mode,
    created_by: optionalText(record.created_by),
    created_at: optionalText(record.created_at),
    updated_at: optionalText(record.updated_at),
    duration_minutes: validDuration ? duration : null,
    participating_domains: domains.map((participant) => ({
      ...participant,
      integration_status: (integrationByDomain.get(participant.domain) || getMoccIntegrationStatus(participant.domain))?.status || "NOT_CONNECTED",
    })),
    integration_requirements: Array.isArray(record.integration_requirements) ? record.integration_requirements.filter((item) => typeof item === "string") : [],
    dependencies,
    initial_conditions: record.initial_conditions && typeof record.initial_conditions === "object" && !Array.isArray(record.initial_conditions)
      ? structuredClone(record.initial_conditions) : {},
    planned_events: plannedEvents,
    mission_references: missionReferences,
    schedule_references: scheduleReferences,
    spatial_references: resolvedSpatialReferences.filter(Boolean),
    approval_required: record.approval_required === true ? true : record.approval_required === false ? false : null,
    approval_status: approvalRequired ? "NOT_CONFIGURED" : optionalText(record.approval_status),
    approved_by: null,
    evidence_refs: Array.isArray(record.evidence_refs) ? record.evidence_refs.filter((item) => typeof item === "string") : [],
    audit_refs: Array.isArray(record.audit_refs) ? record.audit_refs.filter((item) => typeof item === "string") : [],
    metadata: record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata) ? { ...record.metadata } : {},
    simulation_readiness: readiness,
    validation_issues: issues,
    execution_state: "NOT_EXECUTED",
  };
}

export function filterMoccScenarios(scenarios = [], filters = {}) {
  return (Array.isArray(scenarios) ? scenarios : []).filter((scenario) => !filters.status || filters.status === "all" || scenario.status === filters.status)
    .filter((scenario) => !filters.domain || filters.domain === "all" || scenario.participating_domains.some(({ domain }) => domain === filters.domain));
}
