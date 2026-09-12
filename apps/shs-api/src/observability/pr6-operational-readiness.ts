export type ReadinessStatus = "READY" | "NOT_READY";
export type IncidentState = "DETECTED" | "TRIAGED" | "CONTAINED" | "RECOVERED" | "REVIEWED";

export const PR6_SCOPED_GAPS = [
  { gapId: "PR0-GAP-013", status: "BLOCKED — EXTERNAL DEPENDENCY", dependency: "cloud failover and recovery exercise" },
  { gapId: "PR0-GAP-014", status: "BLOCKED — EXTERNAL DEPENDENCY", dependency: "hosted dashboards, alert destinations, and on-call ownership" },
  { gapId: "PR0-GAP-015", status: "BLOCKED — EXTERNAL DEPENDENCY", dependency: "centralized production log pipeline and retention" },
  { gapId: "PR0-GAP-020", status: "BLOCKED — EXTERNAL DEPENDENCY", dependency: "Azure subscription, domains, TLS, ingress, and deployed smoke test" },
  { gapId: "PR0-GAP-021", status: "BLOCKED — EXTERNAL DEPENDENCY", dependency: "production migration rehearsal with backup and rollback decision" },
  { gapId: "PR0-GAP-022", status: "BLOCKED — EXTERNAL DEPENDENCY", dependency: "deployed version rollback and timed recovery drill" },
  { gapId: "PR0-GAP-023", status: "BLOCKED — EXTERNAL DEPENDENCY", dependency: "production-like load test environment and scale thresholds" },
] as const;

export const PR6_OPERATIONAL_THRESHOLDS = Object.freeze({
  maxConcurrentLocalProbe: 25,
  maxRequestBodyBytes: 1_048_576,
  maxListPageSize: 100,
  maxWorkerLeaseSeconds: 300,
  maxRetryAttempts: 5,
});

export const PR6_RPO_TARGETS = Object.freeze({
  tier1Canonical: "technical target: restore from the latest protected database backup; production measurement pending",
  tier2EvidenceArtifacts: "technical target: restore from the latest protected object/report backup; production measurement pending",
  tier3DerivedProjections: "recompute from authoritative sources after Tier 1 and Tier 2 recovery",
});

export const PR6_RTO_TARGETS = Object.freeze({
  tier1Canonical: "technical target: restore and validate service/database before accepting work; no contractual SLA",
  tier2EvidenceArtifacts: "technical target: restore referenced artifacts before artifact-dependent workflows; no contractual SLA",
  tier3DerivedProjections: "technical target: recompute after authoritative recovery; no contractual SLA",
});

export function evaluateReadiness(input: { liveness: boolean; database: boolean; migrationState: "CURRENT" | "PENDING" | "DRIFT" | "UNKNOWN"; requiredConfig: boolean }): { status: ReadinessStatus; reasons: string[] } {
  const reasons = [
    ...(!input.liveness ? ["process_not_live"] : []),
    ...(!input.database ? ["database_unavailable"] : []),
    ...(input.migrationState !== "CURRENT" ? [`migration_${input.migrationState.toLowerCase()}`] : []),
    ...(!input.requiredConfig ? ["required_configuration_missing"] : []),
  ];
  return { status: reasons.length ? "NOT_READY" : "READY", reasons };
}

export function percentile(values: number[], p: number) {
  if (!values.length) throw new Error("percentile_values_required");
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

export function validateIncidentTransition(from: IncidentState, to: IncidentState) {
  const transitions: Record<IncidentState, IncidentState[]> = {
    DETECTED: ["TRIAGED"], TRIAGED: ["CONTAINED"], CONTAINED: ["RECOVERED"], RECOVERED: ["REVIEWED"], REVIEWED: [],
  };
  if (!transitions[from].includes(to)) throw new Error("incident_transition_invalid");
  return { from, to };
}
