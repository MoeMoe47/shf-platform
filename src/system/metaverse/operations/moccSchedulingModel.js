import { getMoccIntegrationStatus } from "./moccIntegrationStatusRegistry.js";
import { METAVERSE_FACILITIES } from "../metaverseNavigationModel.js";

export const MOCC_SCHEDULE_STATUSES = Object.freeze([
  "DRAFT", "READY", "BLOCKED", "PENDING_INTEGRATION", "PENDING_APPROVAL", "SCHEDULED", "CANCELLED",
]);

export const MOCC_EXECUTION_READINESS = Object.freeze([
  "NOT_EXECUTABLE", "PENDING_INTEGRATION", "PENDING_APPROVAL", "READY_FOR_FUTURE_EXECUTION",
]);

const NON_READY_DEPENDENCY_STATUSES = new Set(["PENDING", "NOT_CONNECTED", "UNAVAILABLE", "FOUNDATION", "PARTIAL"]);

function stringOrNull(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function scheduleWindow(record) {
  const hasExplicitOffset = (value) => typeof value === "string" && /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const start = hasExplicitOffset(record.planned_start) ? Date.parse(record.planned_start) : NaN;
  const end = hasExplicitOffset(record.planned_end) ? Date.parse(record.planned_end) : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { start: null, end: null, valid: false };
  return { start, end, valid: end > start };
}

function validateTimezone(timezone) {
  if (!timezone) return true;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function dependencyConflicts(record, dependencyGraph) {
  const nodes = new Map((dependencyGraph?.nodes || []).map((node) => [node.node_id, node]));
  const conflicts = [];
  for (const reference of record.required_dependencies || []) {
    if (typeof reference !== "string" || reference.length === 0) continue;
    const node = nodes.get(reference);
    if (!node) {
      conflicts.push({ code: "DEPENDENCY_REFERENCE_UNRESOLVED", reference });
    } else if (NON_READY_DEPENDENCY_STATUSES.has(node.status)) {
      conflicts.push({ code: "DEPENDENCY_NOT_READY", reference, status: node.status });
    }
  }
  return conflicts;
}

function isCanonicalScheduleTarget(targetReference, dependencyGraph) {
  if (METAVERSE_FACILITIES.some((facility) => facility.id === targetReference || facility.destinationId === targetReference)) return true;
  return (dependencyGraph?.nodes || []).some((node) => ["FACILITY", "DISTRICT", "DESTINATION", "INFRASTRUCTURE", "MISSION", "SIMULATION"].includes(node.node_type)
    && (node.source_reference === targetReference || node.node_id === targetReference));
}

function integrationConflict(status) {
  if (status === "PENDING") return { code: "INTEGRATION_PENDING" };
  if (status === "PARTIAL") return { code: "INTEGRATION_PARTIAL" };
  if (status === "FOUNDATION") return { code: "INTEGRATION_FOUNDATION_ONLY" };
  if (status === "NOT_CONNECTED") return { code: "INTEGRATION_NOT_CONNECTED" };
  if (status === "UNAVAILABLE") return { code: "INTEGRATION_UNAVAILABLE" };
  return null;
}

function assessOneSchedule(record, dependencyGraph) {
  const requestedStatus = stringOrNull(record.schedule_status || record.status)?.toUpperCase();
  const integration = getMoccIntegrationStatus(record.domain);
  const integrationStatus = integration?.status || null;
  const owner = stringOrNull(record.owning_system) || stringOrNull(integration?.owning_system);
  const requiredAuthorities = Array.isArray(record.required_authorities)
    ? record.required_authorities.filter((value) => typeof value === "string" && value.length > 0)
    : owner ? [owner] : [];
  const window = scheduleWindow(record);
  const conflicts = [];
  if (!stringOrNull(record.schedule_id)) conflicts.push({ code: "SCHEDULE_ID_UNSPECIFIED" });
  if (!window.valid) conflicts.push({ code: "INVALID_TIME_RANGE" });
  if (!validateTimezone(record.timezone)) conflicts.push({ code: "INVALID_TIMEZONE" });
  if (!owner && requiredAuthorities.length === 0) conflicts.push({ code: "OWNING_AUTHORITY_UNSPECIFIED" });
  conflicts.push(...dependencyConflicts(record, dependencyGraph));
  const integrationIssue = integration ? integrationConflict(integrationStatus) : { code: "INTEGRATION_NOT_REGISTERED" };
  if (integrationIssue) conflicts.push(integrationIssue);

  const approvalRequired = record.approval_required !== false;
  // No MOCC approval interface is connected, so source fields cannot grant approval readiness.
  const approvalStatus = approvalRequired ? "NOT_CONFIGURED" : "NOT_REQUIRED";
  const approvalReady = !approvalRequired;
  if (approvalRequired && !approvalReady) {
    conflicts.push({ code: approvalStatus === "NOT_CONFIGURED" ? "APPROVAL_NOT_CONFIGURED" : "APPROVAL_PENDING" });
  }

  const hardBlock = conflicts.some(({ code }) => [
    "SCHEDULE_ID_UNSPECIFIED", "INVALID_TIME_RANGE", "INVALID_TIMEZONE", "OWNING_AUTHORITY_UNSPECIFIED", "INTEGRATION_NOT_REGISTERED",
    "DEPENDENCY_REFERENCE_UNRESOLVED", "DEPENDENCY_NOT_READY", "INTEGRATION_PARTIAL",
    "INTEGRATION_FOUNDATION_ONLY", "INTEGRATION_NOT_CONNECTED", "INTEGRATION_UNAVAILABLE",
  ].includes(code));

  let executionReadiness = "NOT_EXECUTABLE";
  let scheduleStatus = "DRAFT";
  if (requestedStatus === "CANCELLED") {
    scheduleStatus = "CANCELLED";
  } else if (integrationStatus === "PENDING") {
    scheduleStatus = "PENDING_INTEGRATION";
    executionReadiness = "PENDING_INTEGRATION";
  } else if (hardBlock) {
    scheduleStatus = "BLOCKED";
  } else if (!approvalReady) {
    scheduleStatus = "PENDING_APPROVAL";
    executionReadiness = "PENDING_APPROVAL";
  } else if (requestedStatus === "DRAFT") {
    scheduleStatus = "DRAFT";
  } else if (integrationStatus === "CONNECTED" && window.valid && (owner || requiredAuthorities.length > 0)) {
    scheduleStatus = requestedStatus === "SCHEDULED" ? "SCHEDULED" : "READY";
    executionReadiness = "READY_FOR_FUTURE_EXECUTION";
  }

  return {
    schedule_id: stringOrNull(record.schedule_id),
    title: stringOrNull(record.title),
    schedule_type: stringOrNull(record.schedule_type),
    domain: stringOrNull(record.domain),
    planned_start: stringOrNull(record.planned_start),
    planned_end: stringOrNull(record.planned_end),
    timezone: stringOrNull(record.timezone),
    target_reference: stringOrNull(record.target_reference),
    source_authority: stringOrNull(record.source_authority),
    source_reference: stringOrNull(record.source_reference),
    owning_system: owner,
    integration_status: integrationStatus,
    schedule_status: scheduleStatus,
    execution_readiness: executionReadiness,
    approval_required: record.approval_required === true ? true : record.approval_required === false ? false : null,
    approval_status: approvalStatus,
    required_authorities: requiredAuthorities,
    required_dependencies: Array.isArray(record.required_dependencies) ? [...record.required_dependencies] : [],
    conflicts,
    created_by: stringOrNull(record.created_by),
    approved_by: stringOrNull(record.approved_by),
    scenario_id: stringOrNull(record.scenario_id),
    mission_id: stringOrNull(record.mission_id),
    metadata: record.metadata && typeof record.metadata === "object" ? { ...record.metadata } : {},
  };
}

export function projectMoccSchedules(schedules = [], { dependencyGraph = null } = {}) {
  const records = (Array.isArray(schedules) ? schedules : [])
    .filter((record) => record && typeof record === "object" && !Array.isArray(record))
    .map((record) => assessOneSchedule(record, dependencyGraph));

  const active = records.filter((record) => record.schedule_status !== "CANCELLED");
  for (const record of active) {
    const current = scheduleWindow(record);
    if (!record.target_reference || !isCanonicalScheduleTarget(record.target_reference, dependencyGraph) || !current.valid) continue;
    for (const other of active) {
      if (other === record || other.target_reference !== record.target_reference) continue;
      const candidate = scheduleWindow(other);
      if (candidate.valid && current.start < candidate.end && candidate.start < current.end) {
        record.conflicts.push({ code: "OVERLAPPING_TARGET_SCHEDULE", related_schedule_id: other.schedule_id });
      }
    }
    if (record.conflicts.some(({ code }) => code === "OVERLAPPING_TARGET_SCHEDULE")
      && ["READY", "SCHEDULED"].includes(record.schedule_status)) {
      record.schedule_status = "BLOCKED";
      record.execution_readiness = "NOT_EXECUTABLE";
    }
  }
  return records;
}

export function filterMoccSchedules(records = [], filters = {}) {
  return (Array.isArray(records) ? records : [])
    .filter((record) => !filters.domain || filters.domain === "all" || record.domain === filters.domain)
    .filter((record) => !filters.status || filters.status === "all" || record.schedule_status === filters.status)
    .filter((record) => !filters.readiness || filters.readiness === "all" || record.execution_readiness === filters.readiness)
    .filter((record) => {
      if (!filters.date) return true;
      const { start, valid } = scheduleWindow(record);
      if (!valid) return false;
      try {
        const dateParts = new Intl.DateTimeFormat("en-US", {
          timeZone: record.timezone || "UTC",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).formatToParts(start);
        const part = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
        return `${part.year}-${part.month}-${part.day}` === filters.date;
      } catch {
        return false;
      }
    })
    .map((record, index) => {
      const window = scheduleWindow(record);
      return { record, index, start: window.valid ? window.start : NaN };
    })
    .sort((a, b) => {
      const aValid = Number.isFinite(a.start);
      const bValid = Number.isFinite(b.start);
      if (aValid !== bValid) return aValid ? -1 : 1;
      return aValid ? a.start - b.start || a.index - b.index : a.index - b.index;
    })
    .map(({ record }) => record);
}
