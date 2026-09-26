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
const FABRIC_READ_BASE = "/api/v1-command-center/agent-fabric";
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
};

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
  const config = options.config === undefined ? bridgeConfig() : options.config;
  if (!config) return fail(spec.kind, "BRIDGE_NOT_CONFIGURED", "shs", "FABRIC_URL_MISSING");

  let headers: Record<string, string>;
  try {
    headers = (options.sign || signInternalRequest)("GET", spec.fabricPath, {});
  } catch (error: any) {
    // Credential names only; never the value.
    return fail(spec.kind, "BRIDGE_NOT_CONFIGURED", "shs", String(error?.message || "").toUpperCase() || "SERVICE_CREDENTIALS_MISSING");
  }

  const fetchImpl = options.fetchImpl || (fetch as unknown as FetchLike);
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, config.timeoutMs);
  let response: { status: number; text(): Promise<string> };
  try {
    response = await fetchImpl(`${config.fabricBaseUrl}${spec.fabricPath}`, {
      method: "GET",
      headers: { Accept: "application/json", ...headers },
      signal: controller.signal,
    });
  } catch {
    return fail(spec.kind, "BACKEND_UNAVAILABLE", "shs_to_fabric", timedOut ? "FABRIC_TIMEOUT" : "FABRIC_UNREACHABLE", timedOut ? 504 : 502);
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

  if (response.status === 401 || response.status === 403) return fail(spec.kind, "BRIDGE_REJECTED", "shs_to_fabric", `FABRIC_HTTP_${response.status}`);
  const isEnvelope = payload && typeof payload === "object" && !Array.isArray(payload);
  if (response.status >= 500 || (isEnvelope && payload.state === "BACKEND_ERROR")) {
    const reason = isEnvelope && payload.contract === READ_CONTRACT ? safeReasonCode(payload.reason_code, `FABRIC_HTTP_${response.status}`) : `FABRIC_HTTP_${response.status}`;
    return fail(spec.kind, "FABRIC_ERROR", "fabric", reason);
  }
  if (response.status !== 200) return fail(spec.kind, "FABRIC_ERROR", "fabric", `FABRIC_HTTP_${response.status}`);
  const validStates = VALID_STATES[spec.kind] || ["AVAILABLE"];
  if (!isEnvelope || payload.contract !== READ_CONTRACT || payload.kind !== spec.kind || payload.read_only !== true || !validStates.includes(payload.state)) {
    return fail(spec.kind, "INVALID_RESPONSE", "fabric", "CONTRACT_MISMATCH");
  }
  const minimized = MINIMIZE[spec.kind](payload);
  if (!minimized) return fail(spec.kind, "INVALID_RESPONSE", "fabric", "CONTRACT_MISMATCH");

  return {
    ok: true,
    status: 200,
    body: {
      contract: READ_CONTRACT,
      kind: spec.kind,
      read_only: true,
      state: payload.state,
      ...(payload.reason_code ? { reason_code: safeReasonCode(payload.reason_code) } : {}),
      access: "shs_bridge",
      generated_at: safeText(payload.generated_at),
      ...minimized,
    },
  };
}
