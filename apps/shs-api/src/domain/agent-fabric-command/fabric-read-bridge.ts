// AFCC-2A.2 — SHS -> Agent Fabric read bridge for the Command Center.
//
// The browser calls SHS with its SHS session. SHS checks the user's SHS
// `bos.governance.read` permission (api/routes.ts), then calls Agent Fabric
// server-to-server, signed with the EXISTING service:shs-api HMAC identity
// (trusted-reporting/outbox.ts signInternalRequest). No Fabric admin key is used
// or held. The browser never sees any credential: it receives only the
// minimized, sanitized projection below.
//
// READ ONLY: four fixed GET sources. Nothing from the request (path, query,
// headers, body) is forwarded to Fabric.
import { signInternalRequest } from "../trusted-reporting/outbox.js";

export const BRIDGE_CONTRACT = "afcc.bridge.v1";
export const READ_CONTRACT = "afcc.read.v1";
export const FABRIC_READ_BASE = "/api/v1-command-center/agent-fabric";
const DEFAULT_TIMEOUT_MS = 10_000;

// SHS route segment -> Fabric projection. Fixed; never derived from the request.
export const BRIDGED_SOURCES = Object.freeze({
  "agents/health": { kind: "agents_health", fabricPath: `${FABRIC_READ_BASE}/agents/health` },
  "agents/readiness": { kind: "agents_readiness", fabricPath: `${FABRIC_READ_BASE}/agents/readiness` },
  "gate/status": { kind: "gate", fabricPath: `${FABRIC_READ_BASE}/gate` },
  "runs/recent": { kind: "runs_recent", fabricPath: `${FABRIC_READ_BASE}/runs/recent` },
  // AFCC-2A.3: the AFCC-2A safe projections (persisted / last-recorded state only).
  watchtower: { kind: "watchtower", fabricPath: `${FABRIC_READ_BASE}/watchtower` },
  infrastructure: { kind: "infrastructure", fabricPath: `${FABRIC_READ_BASE}/infrastructure` },
  observability: { kind: "observability", fabricPath: `${FABRIC_READ_BASE}/observability` },
} as const);

// Truthful non-error projection states. Anything else is outside the contract.
const VALID_STATES: Record<string, string[]> = {
  watchtower: ["AVAILABLE", "NOT_YET_EVALUATED"],
  infrastructure: ["AVAILABLE", "NOT_YET_VERIFIED"],
  observability: ["AVAILABLE", "NOT_YET_VERIFIED"],
  run_detail: ["AVAILABLE", "NOT_AVAILABLE"],
  run_timeline: ["AVAILABLE", "NOT_AVAILABLE"],
  run_evidence: ["AVAILABLE", "NOT_AVAILABLE"],
  run_dependencies: ["AVAILABLE", "NOT_AVAILABLE"],
};

export type BridgedSource = keyof typeof BRIDGED_SOURCES;

// Which layer failed, so the UI can say "Browser -> SHS", "SHS -> Fabric" or "Fabric".
export type BridgeLayer = "shs" | "shs_to_fabric" | "fabric";
export type BridgeErrorCode =
  | "BRIDGE_NOT_CONFIGURED" // SHS has no Fabric URL or service keyring
  | "BACKEND_UNAVAILABLE" // Fabric unreachable or timed out
  | "BRIDGE_REJECTED" // Fabric refused the SHS service identity (401/403)
  | "FABRIC_ERROR" // Fabric handler failed (5xx or projection BACKEND_ERROR)
  | "INVALID_RESPONSE"; // Fabric answered with something outside the contract

export interface BridgeFailure {
  ok: false;
  status: number;
  body: { ok: false; contract: string; kind: string; error: { code: BridgeErrorCode; layer: BridgeLayer; reason_code: string; message: string } };
}

export interface BridgeSuccess {
  ok: true;
  status: 200;
  body: Record<string, unknown>;
}

const MESSAGES: Record<BridgeErrorCode, string> = {
  BRIDGE_NOT_CONFIGURED: "The SHS API is not configured to reach Agent Fabric.",
  BACKEND_UNAVAILABLE: "Agent Fabric could not be reached from the SHS API.",
  BRIDGE_REJECTED: "Agent Fabric rejected the SHS API service identity.",
  FABRIC_ERROR: "Agent Fabric failed to produce this projection.",
  INVALID_RESPONSE: "Agent Fabric returned a response outside the Command Center contract.",
};

const HTTP_FOR: Record<BridgeErrorCode, number> = {
  BRIDGE_NOT_CONFIGURED: 503,
  BACKEND_UNAVAILABLE: 502,
  BRIDGE_REJECTED: 502,
  FABRIC_ERROR: 502,
  INVALID_RESPONSE: 502,
};

function fail(kind: string, code: BridgeErrorCode, layer: BridgeLayer, reasonCode: string, status?: number): BridgeFailure {
  return {
    ok: false,
    status: status ?? HTTP_FOR[code],
    body: { ok: false, contract: BRIDGE_CONTRACT, kind, error: { code, layer, reason_code: safeReasonCode(reasonCode), message: MESSAGES[code] } },
  };
}

// ------------------------------------------------------------- sanitization
// Mirrors services/shf-agent-fabric/fabric/command/sanitize.py. Defence in
// depth: Fabric already sanitized, SHS re-checks every string it forwards.
const UNSAFE = [
  /(?<![\w:])\/(?:[\w.@+-]+\/)+[\w.@+-]*/,
  /\b[A-Za-z]:\\/,
  /~\//,
  /Traceback \(most recent call last\)/,
  /\bFile "/,
  /\b[A-Z][A-Za-z]*(?:Error|Exception)\b/,
  /\b(?:secret|password|passwd|api[_-]?key|admin[_-]?key|hmac|token|keyring)\b\s*[:=]/i,
  /\bbearer\s+[\w.-]+/i,
  /\b[A-Z][A-Z0-9_]{2,}=\S+/,
  /\b[a-fA-F0-9]{40,}\b/,
  /\b[A-Za-z0-9+/]{48,}={0,2}/,
];
const SHA256 = /^[a-fA-F0-9]{64}$/;
const REASON = /^[A-Z][A-Z0-9_]{1,63}$/;

export function safeText(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return UNSAFE.some((re) => re.test(value)) ? "[redacted]" : value.slice(0, 500);
}

export function safeReasonCode(value: unknown, fallback = "UNSPECIFIED"): string {
  const text = String(value ?? "").trim();
  return REASON.test(text) ? text : fallback;
}

const hash = (v: unknown) => (typeof v === "string" && SHA256.test(v) ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isInteger(v) ? v : null);
const bool = (v: unknown) => (typeof v === "boolean" ? v : null);
const list = (v: unknown) => (Array.isArray(v) ? v.map(safeText).filter((x): x is string => Boolean(x)) : []);
const objects = (v: unknown) => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object" && !Array.isArray(x)) as Record<string, unknown>[] : []);
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const code = (v: unknown) => (v === null || v === undefined ? null : safeReasonCode(v, "UNSPECIFIED"));
const staleness = (v: unknown) => {
  const s = obj(v);
  return s ? { age_seconds: num(s.age_seconds), oldest_age_seconds: num(s.oldest_age_seconds), threshold_seconds: num(s.threshold_seconds), threshold: code(s.threshold) } : null;
};
const freshness = (v: unknown) => {
  const s = obj(v);
  return s ? { last_updated: safeText(s.last_updated), captured_at: safeText(s.captured_at), threshold: code(s.threshold) } : null;
};
const safeSource = (v: unknown) => (typeof v === "string" && /^contracts\/[\w./-]+\.json$/.test(v) && !v.includes("..") ? v : null);

function pick(obj: Record<string, unknown>, keys: string[], fn: (v: unknown) => unknown = safeText) {
  const out: Record<string, unknown> = {};
  for (const key of keys) out[key] = fn(obj[key]);
  return out;
}

// Only the fields AFCC adapters read. Anything else Fabric sends is dropped.
const MINIMIZE: Record<string, (p: Record<string, unknown>) => Record<string, unknown> | null> = {
  agents_health(p) {
    if (!p.summary || typeof p.summary !== "object" || !Array.isArray(p.agents)) return null;
    return {
      ok: bool(p.ok),
      source: safeSource(p.source),
      summary: pick(p.summary as Record<string, unknown>, ["total", "ready", "warning", "approval_required"], num),
      agents: objects(p.agents).map((a) => ({
        ...pick(a, ["agent_id", "name", "layer", "lifecycle", "status"]),
        enabled: bool(a.enabled),
        missing: list(a.missing),
      })),
    };
  },
  agents_readiness(p) {
    if (!p.summary || typeof p.summary !== "object" || !Array.isArray(p.agents)) return null;
    return {
      ok: bool(p.ok),
      source: safeSource(p.source),
      summary: pick(p.summary as Record<string, unknown>, ["total", "auto_ready", "approval_required", "blocked"], num),
      agents: objects(p.agents).map((a) => ({
        ...pick(a, ["agent_id", "name", "execution_status", "recommended_next_step"]),
        can_auto_execute: bool(a.can_auto_execute),
        humanApproval: bool(a.humanApproval),
        blockers: list(a.blockers),
        warnings: list(a.warnings),
      })),
    };
  },
  gate(p) {
    if (typeof p.gate_pass !== "boolean") return null;
    return {
      gate_pass: p.gate_pass,
      auditor_one_liner: safeText(p.auditor_one_liner),
      gate_required_layers: list(p.gate_required_layers),
      gate_blockers: objects(p.gate_blockers).map((b) => pick(b, ["layer", "reason"])),
    };
  },
  watchtower(p) {
    if (!Array.isArray(p.programs)) return null;
    const ev = obj(p.latest_evaluation);
    if (p.state === "AVAILABLE" && (!ev || !obj(ev.risk_counts))) return null;
    const alerts = obj(p.alerts);
    const integrity = obj(p.integrity);
    const manual = obj(p.manual_quarantine);
    const attestation = obj(p.latest_attestation);
    return {
      catalog_program_count: num(p.catalog_program_count),
      non_catalog_snapshot_program_count: num(p.non_catalog_snapshot_program_count),
      programs: objects(p.programs).map((r) => ({
        ...pick(r, ["program_id", "risk_band", "action", "evaluated_at"]),
        state: code(r.state),
        quarantined: bool(r.quarantined),
        reasons: list(r.reasons),
      })),
      alerts: alerts ? { state: code(alerts.state) } : null,
      integrity: integrity ? { state: code(integrity.state) } : null,
      manual_quarantine: manual
        ? { active_count: num(manual.active_count), programs: objects(manual.programs).map((q) => pick(q, ["program_id", "reason", "since"])) }
        : null,
      latest_attestation: attestation ? { state: code(attestation.state), created_utc: safeText(attestation.created_utc), kind: safeText(attestation.kind) } : null,
      latest_evaluation: ev
        ? {
            ...pick(ev, ["worst_risk_band", "latest_evaluated_at", "oldest_evaluated_at"]),
            risk_counts: pick(obj(ev.risk_counts) || {}, ["GREEN", "YELLOW", "RED", "QUARANTINE"], num),
            ...pick(ev, ["quarantined_count", "evaluated_program_count", "not_evaluated_program_count"], num),
            staleness: staleness(ev.staleness),
          }
        : null,
    };
  },
  infrastructure: (p) => verification(p),
  observability: (p) => verification(p),
  runs_recent(p) {
    if (!Array.isArray(p.events)) return null;
    const TEXT = ["runId", "planId", "agentName", "agentId", "layer", "kind", "outcome", "message", "ts", "requestId",
      "actor", "actorId", "initiatedBy", "organization_id", "organizationId", "model", "provider", "work_order_id", "workOrderId", "run_state", "runState"];
    return {
      window: num(p.window),
      events: objects(p.events).map((e) => {
        const row: Record<string, unknown> = {};
        for (const key of TEXT) {
          const value = safeText(e[key]);
          if (value) row[key] = value;
        }
        const snapshot = hash(e.snapshotSha256);
        if (snapshot) row.snapshotSha256 = snapshot;
        if (Array.isArray(e.artifacts)) {
          row.artifacts = objects(e.artifacts).map((a) => ({ artifactId: safeText(a.artifactId), sha256: hash(a.sha256) }));
        }
        return row;
      }),
    };
  },
  runs_live(p) {
    if (!Array.isArray(p.runs)) return null;
    return {
      count: num(p.count),
      source: commandSource(p.source),
      freshness: freshness(p.freshness),
      lifecycle: lifecycleVocabulary(p.lifecycle),
      execution_safety: executionSafety(p.execution_safety),
      runs: objects(p.runs).map(liveRun),
    };
  },
  run_detail(p) {
    if (p.state === "NOT_AVAILABLE") return { run_id: safeText(p.run_id), source: commandSource(p.source) };
    const run = obj(p.run);
    return run ? { source: commandSource(p.source), run: liveRun(run), execution_safety: executionSafety(p.execution_safety) } : null;
  },
  run_timeline(p) {
    if (!Array.isArray(p.events)) return null;
    return {
      run_id: safeText(p.run_id),
      source: commandSource(p.source),
      events: objects(p.events).map((e) => ({
        event_id: safeText(e.event_id),
        run_id: safeText(e.run_id),
        event_type: safeText(e.event_type),
        from_state: safeText(e.from_state),
        to_state: safeText(e.to_state),
        occurred_at: safeText(e.occurred_at),
        actor_ref: safeText(e.actor_ref),
        authority_ref: safeText(e.authority_ref),
        reason_code: safeText(e.reason_code),
        reason_summary: safeText(e.reason_summary),
        evidence_refs: list(e.evidence_refs),
        policy_refs: list(e.policy_refs),
        correlation_id: safeText(e.correlation_id),
        source: safeText(e.source),
        provenance: safeText(e.provenance),
      })),
    };
  },
  run_evidence(p) {
    if (p.state === "NOT_AVAILABLE") return { run_id: safeText(p.run_id), source: commandSource(p.source) };
    const evidence = obj(p.evidence);
    return evidence ? {
      run_id: safeText(p.run_id),
      source: commandSource(p.source),
      evidence: {
        evidence_refs: list(evidence.evidence_refs),
        artifact_refs: objects(evidence.artifact_refs).map(artifactRef),
        proof_refs: list(evidence.proof_refs),
        report_refs: list(evidence.report_refs),
        truth_refs: list(evidence.truth_refs),
        watchtower_refs: list(evidence.watchtower_refs),
        loo_refs: list(evidence.loo_refs),
        domain_refs: domainRefs(evidence.domain_refs),
        counts: pick(obj(evidence.counts) || {}, ["evidence", "artifacts", "proofs", "reports"], num),
      },
    } : null;
  },
  run_dependencies(p) {
    if (p.state === "NOT_AVAILABLE") return { run_id: safeText(p.run_id), source: commandSource(p.source) };
    return {
      run_id: safeText(p.run_id),
      source: commandSource(p.source),
      dependency_run_ids: list(p.dependency_run_ids),
      parent_run_id: safeText(p.parent_run_id),
      retry_lineage: retryLineage(p.retry_lineage),
      correlation_id: safeText(p.correlation_id),
    };
  },
};

function commandSource(v: unknown) {
  const s = obj(v);
  return s ? {
    authority: safeText(s.authority),
    stores: list(s.stores),
    projection: safeText(s.projection),
    read_only: bool(s.read_only),
    record_type: safeText(s.record_type),
    malformed_event_count: num(s.malformed_event_count),
    unattributed_event_count: num(s.unattributed_event_count),
  } : null;
}

const countOrCode = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : safeText(v));

function lifecycleVocabulary(v: unknown) {
  const l = obj(v);
  return l ? { supported_states: list(l.supported_states), deferred_states: list(l.deferred_states) } : null;
}

function retryLineage(v: unknown) {
  const r = obj(v);
  return r ? {
    ...pick(r, ["retrying_state", "parent_run_id", "root_run_id", "retry_of_run_id"]),
    retry_supported: bool(r.retry_supported),
    retry_count: countOrCode(r.retry_count),
    same_plan_run_ids: list(r.same_plan_run_ids),
  } : null;
}

function domainRefs(v: unknown) {
  const d = obj(v);
  if (!d) return null;
  const one = (x: unknown) => {
    const r = obj(x);
    return r ? { ...pick(r, ["authority", "state", "link_basis"]), refs: list(r.refs) } : null;
  };
  const reporting = one(d.reporting);
  return {
    truth_spine: one(d.truth_spine),
    watchtower: one(d.watchtower),
    loo: one(d.loo),
    reporting: reporting ? { ...reporting, proof_refs: list(obj(d.reporting)?.proof_refs) } : null,
  };
}

function artifactRef(a: Record<string, unknown>) {
  return { artifact_id: safeText(a.artifact_id), sha256: hash(a.sha256) };
}

function liveRun(r: Record<string, unknown>) {
  const agent = obj(r.agent) || {};
  const operation = obj(r.operation) || {};
  const approval = obj(r.approval) || {};
  const initiator = obj(r.initiator) || {};
  const policy = obj(r.policy) || {};
  return {
    ...pick(r, ["run_id", "work_order_id", "tenant_id", "organization_id", "current_state", "created_at", "queued_at", "started_at", "completed_at", "failed_at", "cancelled_at", "timed_out_at", "last_transition_at", "result", "failure_code", "failure_summary", "provider", "model", "adapter", "parent_run_id", "correlation_id"]),
    retry_count: countOrCode(r.retry_count),
    initiator: identityView(initiator),
    created_by: r.created_by === undefined ? undefined : (obj(r.created_by) ? identityView(obj(r.created_by) || {}) : safeText(r.created_by)),
    state_derivation: stateDerivation(r.state_derivation),
    execution_lease: executionLease(r.execution_lease),
    execution: execution(r.execution),
    correlation: pick(obj(r.correlation) || {}, ["id", "source", "continuity"]),
    retry_lineage: retryLineage(r.retry_lineage),
    domain_refs: domainRefs(r.domain_refs),
    event_count: num(r.event_count),
    agent: pick(agent, ["agent_id", "name", "layer", "version"]),
    operation: pick(operation, ["type", "plan_id"]),
    approval: { ...pick(approval, ["state", "authority", "plan_status", "basis"]), decision: approvalDecision(approval.decision), required: typeof approval.required === "boolean" ? approval.required : safeText(approval.required) },
    policy: { policy_ref: safeText(policy.policy_ref), gate_decision_refs: list(policy.gate_decision_refs) },
    evidence_refs: list(r.evidence_refs),
    artifact_refs: objects(r.artifact_refs).map(artifactRef),
    proof_refs: list(r.proof_refs),
    report_refs: list(r.report_refs),
    policy_decision_refs: list(r.policy_decision_refs),
    watchtower_refs: list(r.watchtower_refs),
    truth_refs: list(r.truth_refs),
    loo_refs: list(r.loo_refs),
    dependency_run_ids: list(r.dependency_run_ids),
    source: commandSource(r.source),
    freshness: freshness(r.freshness),
  };
}

// AFCC-3 Phase 3: identity is shown with its verification status. Only
// allowlisted fields pass; tokens, emails and credentials never do.
function identityView(i: Record<string, unknown>) {
  const declared = obj(i.declared_identity);
  return {
    ...pick(i, ["actor_id", "actor_type", "initiator_type", "actor_verification", "organization_id", "organization_verification", "tenant_id", "tenant_verification", "source_system", "source_system_verification", "entry_point", "execution_system"]),
    authority: pick(obj(i.authority) || {}, ["authentication", "role", "permission", "scope"]),
    declared_identity: declared ? pick(declared, ["actor_id", "organization_id", "tenant_id", "source_system", "verification"]) : safeText(i.declared_identity),
  };
}

function approvalDecision(v: unknown) {
  const d = obj(v);
  if (!d) return safeText(v);
  const declared = obj(d.declared_identity);
  return {
    ...pick(d, ["decision", "approver_actor_id", "approver_type", "actor_verification", "organization_id", "organization_verification", "tenant_id", "tenant_verification", "decided_at", "reason", "correlation_id", "authority_ref", "provenance"]),
    authority: pick(obj(d.authority) || {}, ["authentication", "role", "permission", "scope"]),
    declared_identity: declared ? pick(declared, ["actor_id", "organization_id", "tenant_id", "source_system", "verification"]) : safeText(d.declared_identity),
  };
}

// AFCC-3 Phase 4: the recorded execution lease. Holder process details are never forwarded.
function executionLease(v: unknown) {
  const l = obj(v);
  return l ? {
    ...pick(l, ["status", "lease_expires_at", "heartbeat", "scope", "evaluated_at"]),
    lease_seconds: countOrCode(l.lease_seconds),
    orphan_recorded: bool(l.orphan_recorded),
  } : null;
}

// AFCC-3 Phase 4.1: the execution claim is replica-local. This block keeps that
// visible to operators; it never upgrades to distributed assurance.
function executionSafety(v: unknown) {
  const s = obj(v);
  return s ? pick(s, ["level", "local_single_flight", "distributed_single_flight", "scope", "production_blocker", "summary"]) : null;
}

function stateDerivation(v: unknown) {
  const s = obj(v);
  return s ? { state: safeText(s.state), reason_code: code(s.reason_code), conflict: bool(s.conflict) } : null;
}

function execution(v: unknown) {
  const e = obj(v);
  return e ? {
    ...pick(e, ["provider", "model", "adapter", "agent_version"]),
    adapters: list(e.adapters),
    model_invoked: typeof e.model_invoked === "boolean" ? e.model_invoked : safeText(e.model_invoked),
  } : null;
}

// Last-recorded verification result. Reading never runs a verifier.
function verification(p: Record<string, unknown>): Record<string, unknown> | null {
  if (p.state === "NOT_YET_VERIFIED") return {};
  if (!Array.isArray(p.checks) || !["PASS", "DEGRADED", "FAIL"].includes(String(p.status))) return null;
  return {
    status: p.status,
    last_verified_at: safeText(p.last_verified_at),
    trigger: safeText(p.trigger),
    checks: objects(p.checks).map((c) => ({ name: safeText(c.name), ok: bool(c.ok), reason_code: code(c.reason_code) })),
    degraded: list(p.degraded),
    staleness: staleness(p.staleness),
  };
}

// ------------------------------------------------------------------ config
export interface BridgeConfig {
  fabricBaseUrl: string;
  timeoutMs: number;
}

export function bridgeConfig(env: NodeJS.ProcessEnv = process.env): BridgeConfig | null {
  const fabricBaseUrl = String(env.SHF_AGENT_FABRIC_INTERNAL_URL || "").trim().replace(/\/+$/, "");
  if (!fabricBaseUrl) return null;
  const timeout = Number(env.SHS_AGENT_FABRIC_READ_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  return { fabricBaseUrl, timeoutMs: Number.isFinite(timeout) && timeout > 0 ? Math.min(timeout, 30_000) : DEFAULT_TIMEOUT_MS };
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; signal: AbortSignal }) => Promise<{ status: number; text(): Promise<string> }>;

export async function readFabricSource(
  source: BridgedSource,
  options: { fetchImpl?: FetchLike; config?: BridgeConfig | null; sign?: typeof signInternalRequest } = {},
): Promise<BridgeSuccess | BridgeFailure> {
  const spec = BRIDGED_SOURCES[source];
  return readFabricProjection(spec.kind, spec.fabricPath, options);
}

export async function readFabricProjection(
  kind: string,
  fabricPath: string,
  options: { fetchImpl?: FetchLike; config?: BridgeConfig | null; sign?: typeof signInternalRequest } = {},
): Promise<BridgeSuccess | BridgeFailure> {
  const config = options.config === undefined ? bridgeConfig() : options.config;
  if (!config) return fail(kind, "BRIDGE_NOT_CONFIGURED", "shs", "FABRIC_URL_MISSING");

  let headers: Record<string, string>;
  try {
    headers = (options.sign || signInternalRequest)("GET", fabricPath, {});
  } catch (error: any) {
    // Credential names only; never the value.
    return fail(kind, "BRIDGE_NOT_CONFIGURED", "shs", String(error?.message || "").toUpperCase() || "SERVICE_CREDENTIALS_MISSING");
  }

  const fetchImpl = options.fetchImpl || (fetch as unknown as FetchLike);
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, config.timeoutMs);
  let response: { status: number; text(): Promise<string> };
  try {
    response = await fetchImpl(`${config.fabricBaseUrl}${fabricPath}`, {
      method: "GET",
      headers: { Accept: "application/json", ...headers },
      signal: controller.signal,
    });
  } catch {
    return fail(kind, "BACKEND_UNAVAILABLE", "shs_to_fabric", timedOut ? "FABRIC_TIMEOUT" : "FABRIC_UNREACHABLE", timedOut ? 504 : 502);
  } finally {
    clearTimeout(timer);
  }

  let payload: any = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (response.status === 401 || response.status === 403) return fail(kind, "BRIDGE_REJECTED", "shs_to_fabric", `FABRIC_HTTP_${response.status}`);
  const isEnvelope = payload && typeof payload === "object" && !Array.isArray(payload);
  if (response.status >= 500 || (isEnvelope && payload.state === "BACKEND_ERROR")) {
    const reason = isEnvelope && payload.contract === READ_CONTRACT ? safeReasonCode(payload.reason_code, `FABRIC_HTTP_${response.status}`) : `FABRIC_HTTP_${response.status}`;
    return fail(kind, "FABRIC_ERROR", "fabric", reason);
  }
  if (response.status !== 200) return fail(kind, "FABRIC_ERROR", "fabric", `FABRIC_HTTP_${response.status}`);
  const validStates = VALID_STATES[kind] || ["AVAILABLE"];
  if (!isEnvelope || payload.contract !== READ_CONTRACT || payload.kind !== kind || payload.read_only !== true || !validStates.includes(payload.state)) {
    return fail(kind, "INVALID_RESPONSE", "fabric", "CONTRACT_MISMATCH");
  }
  const minimize = MINIMIZE[kind];
  const minimized = minimize ? minimize(payload) : null;
  if (!minimized) return fail(kind, "INVALID_RESPONSE", "fabric", "CONTRACT_MISMATCH");

  return {
    ok: true,
    status: 200,
    body: {
      contract: READ_CONTRACT,
      kind,
      read_only: true,
      state: payload.state,
      ...(payload.reason_code ? { reason_code: safeReasonCode(payload.reason_code) } : {}),
      access: "shs_bridge",
      generated_at: safeText(payload.generated_at),
      ...minimized,
    },
  };
}
