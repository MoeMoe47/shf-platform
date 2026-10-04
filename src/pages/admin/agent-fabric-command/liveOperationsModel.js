// src/pages/admin/agent-fabric-command/liveOperationsModel.js
// AFCC-3 Phase 7 — Live Operations presentation model. Pure (no React, no I/O).
//
// Everything here reshapes the canonical read projections published by Agent
// Fabric through the SHS bridge (afcc.read.v1: runs_live, run_detail,
// run_timeline, run_evidence, run_dependencies, run_artifact). Nothing here
// derives lifecycle state, approval, evidence durability or verification: those
// are backend facts. This module only labels them, orders them deterministically
// and selects subsets, so the future Simple Command Home can reuse the same
// selectors without duplicating run logic.

export const READ_CONTRACT = "afcc.read.v1";

// ------------------------------------------------------------------ missing values

// Backend sentinels -> operator copy. A cell is never blank.
const SENTINEL_LABEL = Object.freeze({
  NOT_CAPTURED: "Not captured",
  NOT_PUBLISHED: "Not published",
  NOT_AVAILABLE: "Not available",
  NOT_APPLICABLE: "Not applicable",
  NOT_SUPPORTED: "Not supported",
  "[redacted]": "Redacted",
});

/** { text, gap } — gap is true when the value is absent or withheld. */
export function display(value) {
  if (value === null || value === undefined || value === "") return { text: "Not available", gap: true };
  if (typeof value === "string" && SENTINEL_LABEL[value]) return { text: SENTINEL_LABEL[value], gap: true };
  if (typeof value === "boolean") return { text: value ? "Yes" : "No", gap: false };
  return { text: String(value), gap: false };
}

export const isGap = (value) => display(value).gap;

// ------------------------------------------------------------------ vocabulary

// Run lifecycle states the backend may publish (fabric/run_lifecycle.py).
// Tone always travels with a text label and a glyph (never colour alone).
export const RUN_STATE_COPY = Object.freeze({
  APPROVAL_REQUIRED: { label: "Approval required", tone: "warn", glyph: "◔" },
  APPROVED: { label: "Approved", tone: "neutral", glyph: "○" },
  APPROVAL_DENIED: { label: "Approval denied", tone: "neutral", glyph: "⊘" },
  EXECUTING: { label: "Executing", tone: "ok", glyph: "▸" },
  ORPHANED: { label: "Orphaned", tone: "fail", glyph: "!" },
  COMPLETED: { label: "Completed", tone: "ok", glyph: "✓" },
  FAILED: { label: "Failed", tone: "fail", glyph: "✕" },
  TIMED_OUT: { label: "Timed out", tone: "fail", glyph: "⧗" },
  // UNKNOWN covers conflicting, missing and unsupported records; the derivation
  // reason code (shown alongside) says which, so the label does not guess.
  UNKNOWN: { label: "State undetermined", tone: "gap", glyph: "?" },
});

export function runStateCopy(state) {
  return RUN_STATE_COPY[state] || { label: "Unrecognized state", tone: "gap", glyph: "?" };
}

// The five headline counts, shown only when the backend publishes the state.
export const PRIMARY_STATES = Object.freeze(["APPROVAL_REQUIRED", "APPROVED", "EXECUTING", "COMPLETED", "FAILED"]);

export const APPROVAL_COPY = Object.freeze({
  NOT_REQUIRED: { label: "Not required", tone: "neutral" },
  PENDING: { label: "Pending", tone: "warn" },
  APPROVED: { label: "Approved", tone: "ok" },
  APPROVED_UNATTRIBUTED: { label: "Approved (unattributed)", tone: "warn" },
  DENIED: { label: "Denied", tone: "neutral" },
  UNKNOWN: { label: "Undetermined", tone: "gap" },
});

export function approvalCopy(state) {
  return APPROVAL_COPY[state] || { label: display(state).text, tone: "gap" };
}

// Evidence durability (fabric/command/live_operations.py _artifact_view) is
// separate from the execution result: a COMPLETED run is not assumed verified.
export const EVIDENCE_COPY = Object.freeze({
  DURABLE: { label: "Durable", tone: "ok" },
  NONE: { label: "No artifacts", tone: "neutral" },
  NOT_DURABLE: { label: "Not durable", tone: "warn" },
  STORAGE_FAILED: { label: "Storage failed", tone: "fail" },
  INCOMPLETE: { label: "Incomplete", tone: "fail" },
  INTEGRITY_FAILED: { label: "Integrity failed", tone: "fail" },
});

export function evidenceCopy(evidence) {
  const status = evidence?.status;
  const base = EVIDENCE_COPY[status] || { label: display(status).text, tone: "gap" };
  if (status === "DURABLE" && evidence?.verified === true) return { ...base, label: "Durable · verified" };
  return base;
}

export const STORAGE_STATE_COPY = Object.freeze({
  STORED: { label: "Stored (shared)", tone: "ok" },
  LEGACY_REPLICA_LOCAL: { label: "Legacy · replica-local", tone: "warn" },
  REPLICA_LOCAL: { label: "Replica-local", tone: "warn" },
  STORAGE_FAILED: { label: "Storage failed", tone: "fail" },
  MISSING: { label: "Missing", tone: "fail" },
});

export const VERIFICATION_COPY = Object.freeze({
  VERIFIED: { label: "Verified", tone: "ok" },
  HASH_RECORDED: { label: "Hash recorded", tone: "neutral" },
  HASH_MISMATCH: { label: "Hash mismatch", tone: "fail" },
  NOT_VERIFIABLE: { label: "Not verifiable", tone: "warn" },
  NOT_APPLICABLE: { label: "Not applicable", tone: "neutral" },
});

export const labelFrom = (table, value) => table[value] || { label: display(value).text, tone: "gap" };

// Artifact body trust (run_artifact projection). Only VERIFIED is trusted evidence.
export const TRUST_COPY = Object.freeze({
  VERIFIED: { label: "Verified evidence", tone: "ok", trusted: true },
  INTEGRITY_FAILED: { label: "Integrity failed — body withheld", tone: "fail", trusted: false },
  NOT_TRUSTED_REPLICA_LOCAL: { label: "Not trusted — replica-local copy", tone: "warn", trusted: false },
  NOT_AVAILABLE: { label: "Body not available", tone: "neutral", trusted: false },
});

export const VERIFICATION_STATE_COPY = Object.freeze({
  VERIFIED: "Verified",
  DECLARED: "Declared (unverified)",
  DERIVED_FROM_VERIFIED_ORGANIZATION: "Derived from verified organization",
  NOT_CAPTURED: "Not captured",
  NOT_APPLICABLE: "Not applicable",
});

export const verificationLabel = (value) => VERIFICATION_STATE_COPY[value] || display(value).text;

export const EVENT_COPY = Object.freeze({
  "plan.created": "Plan created",
  "plan.approved": "Plan approved",
  "plan.rejected": "Plan rejected",
  "run.execution_started": "Execution started",
  "run.completed": "Execution completed",
  "run.execution_failed": "Execution failed",
  "run.timed_out": "Stopped at deadline",
  "run.lease_expired": "Lease expired — orphaned",
  "run.execute": "Execution (legacy record)",
});

export const PROVENANCE_COPY = Object.freeze({
  RECORDED: { label: "Recorded", legacy: false },
  DERIVED: { label: "Derived from plan store", legacy: false },
  LEGACY_DERIVED: { label: "Legacy-derived", legacy: true },
});

// ------------------------------------------------------------------ normalization

const RUN_ID = /^[A-Za-z0-9_.:-]{1,128}$/;
export const isRunIdentifier = (value) => typeof value === "string" && RUN_ID.test(value) && !/^NOT_[A-Z_]+$/.test(value);

/** One list row / focus subject from a runs_live or run_detail `run` object. */
export function normalizeRun(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const planId = r.operation?.plan_id;
  const hasRun = isRunIdentifier(r.run_id);
  const initiator = r.initiator || {};
  const approval = r.approval || {};
  const decision = approval.decision && typeof approval.decision === "object" ? approval.decision : null;
  return {
    key: hasRun ? `run:${r.run_id}` : `plan:${planId}`,
    kind: hasRun ? "run" : "plan",
    runId: hasRun ? r.run_id : null,
    planId: isRunIdentifier(planId) ? planId : null,
    state: r.current_state || "UNKNOWN",
    stateReason: r.state_derivation?.reason_code || null,
    operation: r.operation?.type,
    agent: { name: r.agent?.name, id: r.agent?.agent_id, layer: r.agent?.layer, version: isGap(r.agent?.version) ? r.execution?.agent_version ?? r.agent?.version : r.agent.version },
    initiator: {
      id: initiator.actor_id,
      type: initiator.initiator_type || initiator.actor_type,
      verification: initiator.actor_verification,
      entryPoint: initiator.entry_point,
      authority: initiator.authority || null,
      declared: initiator.declared_identity && typeof initiator.declared_identity === "object" ? initiator.declared_identity : null,
    },
    organization: { id: r.organization_id, verification: initiator.organization_verification },
    tenant: { id: r.tenant_id, verification: initiator.tenant_verification },
    sourceSystem: initiator.source_system,
    approval: {
      state: approval.state,
      required: approval.required,
      basis: approval.basis,
      approver: decision ? decision.approver_actor_id : null,
      approverVerification: decision ? decision.actor_verification : null,
      decidedAt: decision ? decision.decided_at : null,
      reason: decision ? decision.reason : null,
    },
    createdBy: r.created_by && typeof r.created_by === "object" ? r.created_by : null,
    times: {
      created: r.created_at,
      started: r.started_at,
      lastChanged: r.last_transition_at,
      completed: r.completed_at,
      failed: r.failed_at,
      timedOut: r.timed_out_at,
    },
    failure: { code: r.failure_code, summary: r.failure_summary },
    execution: {
      provider: r.execution?.provider ?? r.provider,
      model: r.execution?.model ?? r.model,
      adapter: r.execution?.adapter ?? r.adapter,
      modelInvoked: r.execution?.model_invoked,
    },
    correlation: { id: r.correlation?.id ?? r.correlation_id, source: r.correlation?.source, continuity: r.correlation?.continuity },
    evidence: r.evidence && typeof r.evidence === "object" ? r.evidence : { status: null },
    artifacts: Array.isArray(r.artifact_refs) ? r.artifact_refs : [],
    retry: r.retry_lineage && typeof r.retry_lineage === "object" ? r.retry_lineage : null,
    dependencyRunIds: Array.isArray(r.dependency_run_ids) ? r.dependency_run_ids : [],
    lease: r.execution_lease && typeof r.execution_lease === "object" ? r.execution_lease : null,
    source: r.source || null,
    freshness: r.freshness || null,
  };
}

export function normalizeTimelineEvent(e) {
  const event = e && typeof e === "object" ? e : {};
  const provenance = PROVENANCE_COPY[event.provenance] || { label: display(event.provenance).text, legacy: false };
  return {
    id: event.event_id,
    label: EVENT_COPY[event.event_type] || display(event.event_type).text,
    type: event.event_type,
    from: event.from_state,
    to: event.to_state,
    at: event.occurred_at,
    actor: event.actor_ref,
    authority: event.authority_ref,
    reasonCode: event.reason_code,
    reasonSummary: event.reason_summary,
    evidenceCount: Array.isArray(event.evidence_refs) ? event.evidence_refs.length : 0,
    correlationId: event.correlation_id,
    provenance,
  };
}

// ------------------------------------------------------------------ envelopes

/** A payload is usable only when it is the exact read contract for its kind. */
export function validateEnvelope(payload, kind) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  if (payload.contract !== READ_CONTRACT || payload.kind !== kind || payload.read_only !== true || typeof payload.state !== "string") return false;
  if (kind === "runs_live" && !Array.isArray(payload.runs)) return false;
  if (kind === "run_timeline" && payload.state === "AVAILABLE" && !Array.isArray(payload.events)) return false;
  if (kind === "run_detail" && payload.state === "AVAILABLE" && (!payload.run || typeof payload.run !== "object")) return false;
  return true;
}

// ------------------------------------------------------------------ summary

/** Counts for backend-published states only; secondary states only when present. */
export function summarize(runs, supportedStates) {
  const supported = new Set(Array.isArray(supportedStates) ? supportedStates : []);
  const counts = {};
  for (const run of runs) counts[run.state] = (counts[run.state] || 0) + 1;
  const primary = PRIMARY_STATES.filter((s) => supported.has(s)).map((s) => ({ state: s, count: counts[s] || 0, ...runStateCopy(s) }));
  const secondary = Object.keys(counts)
    .filter((s) => !PRIMARY_STATES.includes(s) && (supported.has(s) || s === "UNKNOWN") && RUN_STATE_COPY[s])
    .sort()
    .map((s) => ({ state: s, count: counts[s], ...runStateCopy(s) }));
  return { primary, secondary, total: runs.length };
}

// ------------------------------------------------------------------ attention ordering

// Deterministic priority from actual states only (no invented score).
export const ATTENTION_ORDER = Object.freeze([
  "FAILED",
  "INTEGRITY_FAILED",
  "STORAGE_FAILED",
  "INCOMPLETE",
  "UNKNOWN",
  "ORPHANED",
  "TIMED_OUT",
  "APPROVAL_REQUIRED",
  "EXECUTING",
  "APPROVED",
  "APPROVAL_DENIED",
  "COMPLETED",
]);
const NEEDS_ATTENTION_UNTIL = ATTENTION_ORDER.indexOf("APPROVAL_REQUIRED");

export function attentionRank(run) {
  const ranks = [run.state, run.evidence?.status].map((s) => ATTENTION_ORDER.indexOf(s)).filter((i) => i >= 0);
  return ranks.length ? Math.min(...ranks) : ATTENTION_ORDER.length;
}

export function attentionReason(run) {
  const rank = attentionRank(run);
  return rank <= NEEDS_ATTENTION_UNTIL ? ATTENTION_ORDER[rank] : null;
}

const timeOf = (value) => {
  const t = Date.parse(value);
  return Number.isNaN(t) ? -Infinity : t;
};

export function sortByAttention(runs) {
  return [...runs].sort(
    (a, b) =>
      attentionRank(a) - attentionRank(b) ||
      timeOf(b.times.lastChanged) - timeOf(a.times.lastChanged) ||
      String(a.key).localeCompare(String(b.key)),
  );
}

// ------------------------------------------------------------------ filters

export const FILTER_FIELDS = Object.freeze({
  state: (run) => run.state,
  agent: (run) => display(run.agent.name).text,
  organization: (run) => display(run.organization.id).text,
  approval: (run) => display(run.approval.state).text,
  evidence: (run) => display(run.evidence.status).text,
});

export function filterOptions(runs) {
  const out = {};
  for (const [field, get] of Object.entries(FILTER_FIELDS)) out[field] = [...new Set(runs.map(get))].sort();
  return out;
}

export function applyFilters(runs, filters = {}) {
  return runs.filter((run) => Object.entries(filters).every(([field, value]) => !value || FILTER_FIELDS[field]?.(run) === value));
}

// ------------------------------------------------------------------ Simple Home selectors (future reuse)

export const selectNeedsAttention = (runs) => sortByAttention(runs).filter((r) => attentionReason(r) !== null);
export const selectRunning = (runs) => sortByAttention(runs.filter((r) => r.state === "EXECUTING"));
export const selectAwaitingApproval = (runs) => sortByAttention(runs.filter((r) => r.state === "APPROVAL_REQUIRED"));
export const selectRecentChanges = (runs, limit = 5) =>
  [...runs].sort((a, b) => timeOf(b.times.lastChanged) - timeOf(a.times.lastChanged) || String(a.key).localeCompare(String(b.key))).slice(0, limit);

// ------------------------------------------------------------------ small formatters

export function shortHash(value, length = 12) {
  const text = String(value || "");
  return /^[a-f0-9]{64}$/.test(text) ? `${text.slice(0, length)}…` : display(value).text;
}

export function formatBytes(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return display(value).text;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

export function transitionText(from, to) {
  const f = RUN_STATE_COPY[from] ? runStateCopy(from).label : null;
  const t = RUN_STATE_COPY[to] ? runStateCopy(to).label : display(to).text;
  return f ? `${f} → ${t}` : t;
}
