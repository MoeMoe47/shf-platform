// src/pages/admin/agent-fabric-command/commandAdapters.js
// Read-only projections over Agent Fabric responses. Adapters only reshape and
// validate what an endpoint returned; they never infer states the backend does
// not publish. A payload that fails its contract becomes INVALID_RESPONSE rather
// than a partially-invented projection.
import { GAP, SOURCE_STATE } from "./commandContracts.js";
import { formatAge } from "./commandTime.js";

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const str = (value) => (typeof value === "string" && value.trim() ? value : null);
const strList = (value) => (Array.isArray(value) ? value.filter((item) => typeof item === "string") : []);

// A field that is either present, or explicitly marked with the reason it is absent.
export function field(value, gapWhenMissing) {
  if (value === undefined || value === null || value === "") return { value: null, gap: gapWhenMissing };
  return { value, gap: null };
}

function meta(source) {
  return {
    key: source.key,
    endpoint: source.endpoint,
    authority: source.authority,
    httpStatus: source.httpStatus,
    observedAt: source.observedAt,
    message: source.message,
    failedLayer: source.failedLayer || null,
  };
}

function project(source, build) {
  if (source.state !== SOURCE_STATE.AVAILABLE) {
    return { state: source.state, source: meta(source), data: null };
  }
  const result = build(source.payload);
  if (!result) {
    return {
      state: SOURCE_STATE.INVALID_RESPONSE,
      source: { ...meta(source), message: "Response did not match the endpoint contract." },
      data: null,
    };
  }
  if (result.state) {
    // A valid response that reports a non-data state (e.g. NOT_YET_VERIFIED).
    return { state: result.state, source: { ...meta(source), message: result.message || source.message }, data: result.data ?? null };
  }
  return { state: result.empty ? SOURCE_STATE.EMPTY : SOURCE_STATE.AVAILABLE, source: meta(source), data: result.data };
}

function checksFromDict(value) {
  if (!isObject(value)) return [];
  return Object.entries(value).map(([name, check]) => ({
    name,
    ok: isObject(check) && typeof check.ok === "boolean" ? check.ok : null,
    error: isObject(check) ? str(check.error) : null,
  }));
}

// ---------------------------------------------------------------- FabricHealth
export function adaptHealthLive(source) {
  return project(source, (p) => (p.ok === true && p.status === "live" ? { data: { live: true } } : null));
}

export function adaptHealthReady(source) {
  return project(source, (p) => {
    if (p.status !== "ready" && p.status !== "not_ready") return null;
    return { data: { ready: p.status === "ready", checks: checksFromDict(p.checks) } };
  });
}

export function adaptHealthDegraded(source) {
  return project(source, (p) => {
    if (typeof p.degraded !== "boolean") return null;
    return {
      data: {
        degraded: p.degraded,
        status: str(p.status),
        warnings: strList(p.warnings),
        checks: checksFromDict(p.checks),
      },
    };
  });
}

// /status also carries security.baseUrl and raw exception text; neither is projected.
export function adaptRuntimeStatus(source) {
  return project(source, (p) => {
    if (!isObject(p.fabric) || !str(p.fabric.mode)) return null;
    const security = isObject(p.security) ? p.security : null;
    return {
      data: {
        mode: p.fabric.mode,
        security: security
          ? { ok: typeof security.ok === "boolean" ? security.ok : null, mode: str(security.mode) }
          : null,
      },
    };
  });
}

// ---------------------------------------------------------- FabricAgentSummary
// AFCC-2A.2: the four bridged sources arrive as afcc.read.v1 envelopes from the
// SHS bridge. Anything else is rejected whole.
function bridgedEnvelope(p, kind) {
  if (p.contract !== "afcc.read.v1" || p.kind !== kind || p.read_only !== true) return null;
  if (p.state === "BACKEND_ERROR") {
    return { state: SOURCE_STATE.FABRIC_ERROR, message: `Agent Fabric reported ${str(p.reason_code) || "a projection error"}.`, data: null };
  }
  return p.state === "AVAILABLE" ? undefined : null;
}

export function adaptAgentHealth(source) {
  return project(source, (p) => {
    const envelope = bridgedEnvelope(p, "agents_health");
    if (envelope !== undefined) return envelope;
    if (!isObject(p.summary) || !Array.isArray(p.agents)) return null;
    const agents = p.agents.filter(isObject).map((row) => ({
      agentId: str(row.agent_id) || str(row.agentId),
      name: str(row.name),
      layer: str(row.layer),
      lifecycle: str(row.lifecycle),
      enabled: typeof row.enabled === "boolean" ? row.enabled : null,
      status: str(row.status),
      missing: strList(row.missing),
    }));
    const s = p.summary;
    return {
      empty: agents.length === 0 && num(s.total) === 0,
      data: {
        ok: typeof p.ok === "boolean" ? p.ok : null,
        access: str(p.access),
        canonicalSource: str(p.source),
        summary: {
          total: num(s.total),
          ready: num(s.ready),
          warning: num(s.warning),
          approvalRequired: num(s.approval_required),
        },
        enabledCount: agents.every((a) => a.enabled !== null)
          ? agents.filter((a) => a.enabled).length
          : null,
        agents,
      },
    };
  });
}

export function adaptAgentReadiness(source) {
  return project(source, (p) => {
    const envelope = bridgedEnvelope(p, "agents_readiness");
    if (envelope !== undefined) return envelope;
    if (!isObject(p.summary) || !Array.isArray(p.agents)) return null;
    const agents = p.agents.filter(isObject).map((row) => ({
      agentId: str(row.agent_id) || str(row.agentId),
      name: str(row.name),
      executionStatus: str(row.execution_status),
      canAutoExecute: typeof row.can_auto_execute === "boolean" ? row.can_auto_execute : null,
      humanApproval: typeof row.humanApproval === "boolean" ? row.humanApproval : null,
      blockers: strList(row.blockers),
      warnings: strList(row.warnings),
      recommendedNextStep: str(row.recommended_next_step),
    }));
    const s = p.summary;
    return {
      empty: agents.length === 0 && num(s.total) === 0,
      data: {
        ok: typeof p.ok === "boolean" ? p.ok : null,
        access: str(p.access),
        canonicalSource: str(p.source),
        summary: {
          total: num(s.total),
          autoReady: num(s.auto_ready),
          approvalRequired: num(s.approval_required),
          blocked: num(s.blocked),
        },
        agents,
      },
    };
  });
}

// ------------------------------------------------------------- FabricLayerGate
export function adaptLayerGate(source) {
  return project(source, (p) => {
    const envelope = bridgedEnvelope(p, "gate");
    if (envelope !== undefined) return envelope;
    if (typeof p.gate_pass !== "boolean") return null;
    const blockers = (Array.isArray(p.gate_blockers) ? p.gate_blockers : [])
      .filter(isObject)
      .map((b) => ({ layer: str(b.layer), reason: str(b.reason) }));
    return {
      data: {
        access: str(p.access),
        gatePass: p.gate_pass,
        auditorOneLiner: str(p.auditor_one_liner),
        requiredLayers: strList(p.gate_required_layers),
        blockers,
      },
    };
  });
}

// ------------------------------------------------------------ FabricRunSummary
// Run events (db/runs/events.jsonl) record kind + outcome only. There is no
// canonical run state machine, so no lifecycle state is derived here.
export function normalizeRunEvent(event, index) {
  const artifacts = Array.isArray(event.artifacts) ? event.artifacts.filter(isObject) : null;
  return {
    rowKey: str(event.runId) || `${str(event.ts) || "event"}-${index}`,
    runId: field(str(event.runId), GAP.NOT_CAPTURED),
    planId: field(str(event.planId), GAP.NOT_CAPTURED),
    agentName: field(str(event.agentName), GAP.NOT_CAPTURED),
    agentId: field(str(event.agentId), GAP.NOT_CAPTURED),
    layer: field(str(event.layer), GAP.NOT_CAPTURED),
    kind: field(str(event.kind), GAP.NOT_CAPTURED),
    outcome: field(str(event.outcome), GAP.NOT_CAPTURED),
    message: field(str(event.message), GAP.NOT_CAPTURED),
    timestamp: field(str(event.ts), GAP.NOT_CAPTURED),
    requestId: field(str(event.requestId), GAP.NOT_CAPTURED),
    snapshotSha256: field(str(event.snapshotSha256), GAP.NOT_CAPTURED),
    artifactCount: field(artifacts ? artifacts.length : null, GAP.NOT_CAPTURED),
    // Server filesystem paths are intentionally dropped.
    artifacts: (artifacts || []).map((a) => ({ artifactId: str(a.artifactId), sha256: str(a.sha256) })),
    // Fields the platform does not record for plan execution. Read through if a
    // future event carries them; otherwise say why they are absent.
    actor: field(str(event.actor) || str(event.actorId) || str(event.initiatedBy), GAP.NOT_CAPTURED),
    organization: field(str(event.organization_id) || str(event.organizationId) || str(event.orgId), GAP.NOT_CAPTURED),
    modelProvider: field(str(event.model) || str(event.provider), GAP.NOT_CAPTURED),
    workOrderId: field(str(event.work_order_id) || str(event.workOrderId), GAP.NOT_PUBLISHED),
    lifecycleState: field(str(event.run_state) || str(event.runState), GAP.NOT_PUBLISHED),
  };
}

export function adaptRecentRuns(source) {
  return project(source, (p) => {
    const envelope = bridgedEnvelope(p, "runs_recent");
    if (envelope !== undefined) return envelope;
    if (!Array.isArray(p.events)) return null;
    const valid = p.events.filter(isObject);
    const runs = valid.map(normalizeRunEvent);
    return {
      empty: runs.length === 0,
      data: { access: str(p.access), runs, droppedCount: p.events.length - valid.length },
    };
  });
}

// ------------------------------------------------- AFCC-2A read projections
// Envelope from routers/command_read_routes.py. The backend states a projection
// state explicitly; this adapter never upgrades a missing result into data.
function readEnvelope(p, kind) {
  if (p.contract !== "afcc.read.v1" || p.kind !== kind || p.read_only !== true) return null;
  if (p.state === "BACKEND_ERROR") {
    return { state: SOURCE_STATE.FABRIC_ERROR, message: `Agent Fabric reported ${str(p.reason_code) || "a projection error"}.`, data: null };
  }
  return undefined; // continue with kind-specific parsing
}

const ageSeconds = (staleness) => (isObject(staleness) ? num(staleness.age_seconds) : null);

// ----------------------------------------------------- FabricWatchtowerSummary
// Latest PERSISTED Watchtower state (risk_snapshots, quarantine, attestations).
// Alerts and integrity are not persisted by Watchtower and arrive as NOT_PUBLISHED.
export function adaptWatchtowerRead(source) {
  return project(source, (p) => {
    const envelope = readEnvelope(p, "watchtower");
    if (envelope !== undefined) return envelope;
    if (!Array.isArray(p.programs)) return null;
    const programs = p.programs.filter(isObject).map((row) => ({
      programId: str(row.program_id),
      state: str(row.state),
      riskBand: str(row.risk_band),
      quarantined: typeof row.quarantined === "boolean" ? row.quarantined : null,
      action: str(row.action),
      reasons: strList(row.reasons),
      evaluatedAt: str(row.evaluated_at),
    }));
    const base = {
      access: str(p.access),
      catalogProgramCount: num(p.catalog_program_count),
      programs,
      alertsGap: isObject(p.alerts) && p.alerts.state === "NOT_PUBLISHED",
      integrityGap: isObject(p.integrity) && p.integrity.state === "NOT_PUBLISHED",
      manualQuarantine: {
        activeCount: isObject(p.manual_quarantine) ? num(p.manual_quarantine.active_count) : null,
        programs: (isObject(p.manual_quarantine) && Array.isArray(p.manual_quarantine.programs) ? p.manual_quarantine.programs : [])
          .filter(isObject)
          .map((q) => ({ programId: str(q.program_id), reason: str(q.reason), since: str(q.since) })),
      },
      attestation: isObject(p.latest_attestation) && p.latest_attestation.state === "RECORDED"
        ? { recorded: true, createdAt: str(p.latest_attestation.created_utc), kind: str(p.latest_attestation.kind) }
        : { recorded: false },
      nonCatalogSnapshotPrograms: num(p.non_catalog_snapshot_program_count),
    };
    if (p.state === "NOT_YET_EVALUATED") {
      return { state: SOURCE_STATE.NOT_YET_EVALUATED, message: "Watchtower has no persisted evaluation for the program catalog.", data: base };
    }
    const ev = p.latest_evaluation;
    if (p.state !== "AVAILABLE" || !isObject(ev) || !isObject(ev.risk_counts)) return null;
    return {
      data: {
        ...base,
        worstRiskBand: str(ev.worst_risk_band),
        riskCounts: {
          GREEN: num(ev.risk_counts.GREEN),
          YELLOW: num(ev.risk_counts.YELLOW),
          RED: num(ev.risk_counts.RED),
          QUARANTINE: num(ev.risk_counts.QUARANTINE),
        },
        quarantinedCount: num(ev.quarantined_count),
        evaluatedProgramCount: num(ev.evaluated_program_count),
        notEvaluatedProgramCount: num(ev.not_evaluated_program_count),
        latestEvaluatedAt: str(ev.latest_evaluated_at),
        ageSeconds: ageSeconds(ev.staleness),
        oldestAgeSeconds: isObject(ev.staleness) ? num(ev.staleness.oldest_age_seconds) : null,
        stalenessThreshold: isObject(ev.staleness) ? str(ev.staleness.threshold) : null,
        // Read through only; today Watchtower publishes null (threshold NOT_DEFINED).
        stalenessThresholdSeconds: isObject(ev.staleness) ? num(ev.staleness.threshold_seconds) : null,
      },
    };
  });
}

// ---------------------------------------- FabricInfrastructureStatus / Observability
// Last-known result recorded by the privileged verify action. Reading never runs
// verification; verdict (PASS / DEGRADED / FAIL) is the recorded one.
function adaptVerificationRead(kind) {
  return (source) =>
    project(source, (p) => {
      const envelope = readEnvelope(p, kind);
      if (envelope !== undefined) return envelope;
      if (p.state === "NOT_YET_VERIFIED") {
        return { state: SOURCE_STATE.NOT_YET_VERIFIED, message: "No verification result has been recorded yet.", data: { access: str(p.access) } };
      }
      if (p.state !== "AVAILABLE" || !Array.isArray(p.checks) || !["PASS", "DEGRADED", "FAIL"].includes(p.status)) return null;
      const checks = p.checks.filter(isObject).map((c) => ({
        name: str(c.name),
        ok: typeof c.ok === "boolean" ? c.ok : null,
        reasonCode: str(c.reason_code),
      }));
      return {
        data: {
          access: str(p.access),
          verdict: p.status,
          lastVerifiedAt: str(p.last_verified_at),
          ageSeconds: ageSeconds(p.staleness),
          stalenessThreshold: isObject(p.staleness) ? str(p.staleness.threshold) : null,
          stalenessThresholdSeconds: isObject(p.staleness) ? num(p.staleness.threshold_seconds) : null,
          trigger: str(p.trigger),
          checks,
          degraded: strList(p.degraded),
        },
      };
    });
}

export const adaptInfrastructureRead = adaptVerificationRead("infrastructure");
export const adaptObservabilityRead = adaptVerificationRead("observability");

export const ADAPTERS = Object.freeze({
  healthLive: adaptHealthLive,
  healthReady: adaptHealthReady,
  healthDegraded: adaptHealthDegraded,
  status: adaptRuntimeStatus,
  agentHealth: adaptAgentHealth,
  agentReadiness: adaptAgentReadiness,
  layerGate: adaptLayerGate,
  recentRuns: adaptRecentRuns,
  watchtower: adaptWatchtowerRead,
  infrastructure: adaptInfrastructureRead,
  observability: adaptObservabilityRead,
});

// ------------------------------------------------------------- System posture
// A view-level composition of individual source states. It is not a backend
// "master health" and is never persisted or sent anywhere; the contributing
// sources are always returned alongside it.
export const POSTURE = Object.freeze({
  CHECKING: "CHECKING",
  OPERATIONAL: "OPERATIONAL",
  DEGRADED: "DEGRADED",
  OFFLINE: "OFFLINE",
});

const isData = (projection) =>
  projection && (projection.state === SOURCE_STATE.AVAILABLE || projection.state === SOURCE_STATE.EMPTY);

export function derivePosture({ healthLive, healthReady, healthDegraded, infrastructure, observability }) {
  const reasons = [];
  const excluded = [];

  if (!healthLive || healthLive.state === SOURCE_STATE.LOADING) {
    return { posture: POSTURE.CHECKING, reasons: [], excluded };
  }
  if (!isData(healthLive)) {
    reasons.push(healthLive.source?.message || "Liveness probe did not respond.");
    return { posture: POSTURE.OFFLINE, reasons, excluded };
  }

  if (!healthReady || healthReady.state === SOURCE_STATE.LOADING) {
    reasons.push("Readiness is still being checked.");
  } else if (!isData(healthReady)) {
    reasons.push("Readiness could not be read.");
  } else if (!healthReady.data.ready) {
    const failing = healthReady.data.checks.filter((c) => c.ok === false).map((c) => c.name);
    reasons.push(failing.length ? `Not ready: ${failing.join(", ")}.` : "Readiness probe reports not ready.");
  }

  if (!healthDegraded || healthDegraded.state === SOURCE_STATE.LOADING) {
    // Covered by the readiness message while loading.
  } else if (!isData(healthDegraded)) {
    reasons.push("Degraded probe could not be read.");
  } else if (healthDegraded.data.degraded) {
    reasons.push("Degraded probe reports warnings.");
  }

  // Verification lanes are last-known results; a recorded non-PASS result degrades
  // posture and always carries its age. Missing results and viewer access
  // problems are listed as not included rather than treated as Fabric faults.
  const NOT_INCLUDED = {
    [SOURCE_STATE.AUTH_HARDENING_REQUIRED]: "auth hardening required",
    [SOURCE_STATE.AUTH_BRIDGE_REQUIRED]: "auth bridge required",
    [SOURCE_STATE.NOT_YET_VERIFIED]: "not yet verified",
    [SOURCE_STATE.UNAUTHENTICATED]: "auth required",
    [SOURCE_STATE.FORBIDDEN]: "access restricted",
    [SOURCE_STATE.NOT_CONFIGURED]: "not configured",
    [SOURCE_STATE.BRIDGE_NOT_CONFIGURED]: "bridge not configured",
    [SOURCE_STATE.BRIDGE_REJECTED]: "bridge rejected",
  };
  // AFCC-2A.3: these reads travel through the SHS API. A failure before the
  // request reaches Fabric (browser -> SHS, or inside SHS) says nothing about Fabric.
  const SHS_SIDE = ["browser_to_shs", "shs"];
  for (const [label, projection] of [["Infrastructure verification", infrastructure], ["Observability verification", observability]]) {
    if (!projection || projection.state === SOURCE_STATE.LOADING) continue;
    if (NOT_INCLUDED[projection.state]) {
      excluded.push(`${label} (${NOT_INCLUDED[projection.state]})`);
    } else if (!isData(projection) && SHS_SIDE.includes(projection.source?.failedLayer)) {
      excluded.push(`${label} (SHS API unavailable)`);
    } else if (isData(projection) && projection.data.verdict !== "PASS") {
      const age = formatAge(projection.data.ageSeconds);
      reasons.push(`${label}: last recorded ${projection.data.verdict}${age ? ` (${age})` : ""}.`);
    } else if (!isData(projection)) {
      reasons.push(`${label} could not be read.`);
    }
  }

  const stillChecking = [healthReady, healthDegraded].some((p) => !p || p.state === SOURCE_STATE.LOADING);
  if (stillChecking && reasons.length === 1 && reasons[0] === "Readiness is still being checked.") {
    return { posture: POSTURE.CHECKING, reasons: [], excluded };
  }
  return { posture: reasons.length ? POSTURE.DEGRADED : POSTURE.OPERATIONAL, reasons, excluded };
}
