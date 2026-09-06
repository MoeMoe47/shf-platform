import { randomUUID } from "node:crypto";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { OperationalAwarenessRepo } from "../repo/operational-awareness-repo.js";
import { toBriefResponse, toFindingResponse } from "../model/operational-awareness.js";

type Actor = { user_id?: string; id?: string; active_organization_id?: string; organization_id?: string; tenant_id?: string; permissions?: string[] };

export class OperationalAwarenessError extends Error {
  constructor(public code: string, message = code, public statusCode = 400) { super(message); }
}

function scopeOf(actor: Actor) {
  const userId = String(actor.user_id || actor.id || "");
  const organizationId = String(actor.active_organization_id || actor.organization_id || "");
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new OperationalAwarenessError("ORG_CONTEXT_REQUIRED", "Organization and tenant context are required.", 400);
  return { userId, organizationId, tenantId };
}

function requirePermission(actor: Actor, permission: string) {
  if (!hasPermission(actor.permissions || [], permission)) throw new OperationalAwarenessError("AWARENESS_PERMISSION_REQUIRED", "Operational awareness permission is required.", 403);
}

function periodDays(value: unknown) {
  const parsed = Number(value || 1);
  return Number.isFinite(parsed) ? Math.min(30, Math.max(1, Math.floor(parsed))) : 1;
}

function item(title: string, summary: string, verificationClass: string, sourceRefs: any[], extra: Record<string, unknown> = {}) {
  return { title, summary, verificationClass, sourceRefs, ...extra };
}

function buildFindings(signals: any, scope: any) {
  const findings: any[] = [];
  for (const row of signals.security || []) findings.push({
    finding_id: `aw_security_${row.scan_id}`,
    dedupe_key: `security:${row.scan_id}`,
    organization_id: scope.organizationId, tenant_id: scope.tenantId,
    finding_type: "SECURITY_SCAN_RESULT", category: ["BLOCKED", "QUARANTINED"].includes(row.scan_status) ? "SECURITY_ALERT" : "GOVERNANCE_ALERT",
    severity: ["HIGH", "CRITICAL"].includes(String(row.risk_level || "").toUpperCase()) ? String(row.risk_level).toUpperCase() : "HIGH",
    priority: "HIGH", title: `Security review required for ${row.resource_type}:${row.resource_id}`,
    summary: `Input security status is ${row.scan_status}${row.finding_count ? ` with ${row.finding_count} finding(s)` : ""}.`, source_type: "INPUT_SECURITY",
    source_refs: [{ type: "ai_input_security_scan", id: row.scan_id }], confidence: 1,
    verification_class: "SECURITY_GOVERNANCE_FACT", metadata_json: { scanStatus: row.scan_status, decision: row.decision },
  });
  for (const row of signals.approvals || []) findings.push({
    finding_id: `aw_task_${row.conductor_task_id}`,
    dedupe_key: `task:${row.conductor_task_id}`,
    organization_id: scope.organizationId, tenant_id: scope.tenantId,
    finding_type: "CONDUCTOR_TASK", category: row.status === "APPROVAL_REQUIRED" ? "APPROVAL_REQUIRED" : "BLOCKER",
    severity: row.status === "APPROVAL_REQUIRED" ? "MEDIUM" : "HIGH", priority: row.status === "APPROVAL_REQUIRED" ? "HIGH" : "URGENT",
    title: row.status === "APPROVAL_REQUIRED" ? "A decision is waiting for approval" : "A planned operation is blocked",
    summary: row.approval_reason || row.description || `Conductor task is ${row.status}.`, source_type: "BOS_CONDUCTOR",
    source_refs: [{ type: "bos_conductor_task", id: row.conductor_task_id }, { type: "bos_conductor_request", id: row.conductor_request_id }], confidence: 1,
    verification_class: "CANONICAL_OPERATIONAL_FACT", metadata_json: { capability: row.capability, status: row.status },
  });
  for (const row of signals.agentExceptions || []) findings.push({
    finding_id: `aw_agent_${row.authority_code || "unknown"}_${row.security_code || "none"}`,
    dedupe_key: `agent-denial:${row.authority_code || "none"}:${row.security_code || "none"}`,
    organization_id: scope.organizationId, tenant_id: scope.tenantId,
    finding_type: "AGENT_AUTHORITY_EXCEPTION", category: "AGENT_EXCEPTION", severity: Number(row.count) >= 3 ? "HIGH" : "MEDIUM", priority: Number(row.count) >= 3 ? "URGENT" : "HIGH",
    title: "Agent governance denials require attention", summary: `${row.count} governed agent request(s) were denied${row.authority_code ? ` (${row.authority_code})` : ""}.`, source_type: "AGENT_ACTIVITY",
    source_refs: [{ type: "agent_activity_ledger", authorityCode: row.authority_code, securityCode: row.security_code }], confidence: 1,
    verification_class: "SECURITY_GOVERNANCE_FACT", metadata_json: { count: Number(row.count), lastSeen: row.last_seen },
  });
  const failedReads = (signals.reads || []).filter((row: any) => ["FAILED", "BLOCKED", "QUARANTINED", "REVIEW_REQUIRED"].includes(row.admission_status));
  if (failedReads.length) findings.push({
    finding_id: `aw_mcp_reads_${failedReads.map((row: any) => row.mcp_read_result_id).join("_")}`,
    dedupe_key: `mcp-read-failures:${failedReads.map((row: any) => row.mcp_read_result_id).sort().join(",")}`,
    organization_id: scope.organizationId, tenant_id: scope.tenantId, finding_type: "MCP_READ_RESULT", category: "SERVICE_DEGRADATION", severity: "MEDIUM", priority: "HIGH",
    title: "Approved external reads were not admitted", summary: `${failedReads.length} external result(s) failed security or admission checks.`, source_type: "MCP_READ_RESULT",
    source_refs: failedReads.map((row: any) => ({ type: "mcp_read_result", id: row.mcp_read_result_id })), external_source_refs: failedReads.map((row: any) => row.source_identity).filter(Boolean), confidence: 1,
    verification_class: "EXTERNAL_OBSERVATION", metadata_json: { statuses: failedReads.map((row: any) => row.admission_status) },
  });
  if (Number(signals.operations?.review_count || 0) > 0) findings.push({
    finding_id: "aw_review_backlog", dedupe_key: "review-backlog", organization_id: scope.organizationId, tenant_id: scope.tenantId, finding_type: "OPERATIONS_REVIEW_BACKLOG", category: "FOLLOW_UP", severity: "MEDIUM", priority: "HIGH",
    title: "Operational review work is waiting", summary: `${signals.operations.review_count} submission(s) need review or revision.`, source_type: "OPERATIONS", source_refs: [{ type: "operational_review_queue", count: Number(signals.operations.review_count) }], confidence: 1,
    verification_class: "CANONICAL_OPERATIONAL_FACT", metadata_json: {},
  });
  if (Number(signals.operations?.overdue_assignment_count || 0) > 0) findings.push({
    finding_id: "aw_overdue_assignments", dedupe_key: "overdue-assignments", organization_id: scope.organizationId, tenant_id: scope.tenantId, finding_type: "OVERDUE_ASSIGNMENTS", category: "DEADLINE", severity: "MEDIUM", priority: "HIGH",
    title: "Assignments are overdue", summary: `${signals.operations.overdue_assignment_count} assignment(s) are past due.`, source_type: "OPERATIONS", source_refs: [{ type: "assignments", count: Number(signals.operations.overdue_assignment_count) }], confidence: 1,
    verification_class: "CANONICAL_OPERATIONAL_FACT", metadata_json: {},
  });
  for (const row of signals.releases || []) {
    const blocked = ["BLOCKED", "QA_REQUIRED", "REVIEW_REQUIRED", "APPROVAL_REQUIRED", "FAILED", "ROLLBACK_REQUIRED"].includes(row.status);
    findings.push({
      finding_id: `aw_release_${row.release_request_id}`,
      dedupe_key: `release:${row.release_request_id}:${row.status}`,
      organization_id: scope.organizationId, tenant_id: scope.tenantId, finding_type: "ARAG_RELEASE_STATUS",
      category: row.status === "APPROVAL_REQUIRED" ? "APPROVAL_REQUIRED" : row.status === "RELEASED" || row.status === "ROLLED_BACK" ? "INFORMATIONAL" : "BLOCKER",
      severity: row.status === "ROLLBACK_REQUIRED" || row.status === "FAILED" ? "CRITICAL" : blocked ? "HIGH" : "INFO",
      priority: blocked ? "URGENT" : "NORMAL", title: `Governed release is ${row.status.toLowerCase().replaceAll("_", " ")}`,
      summary: blocked ? `ARAG-1 reports blocking condition(s): ${(row.blocking_codes || []).join(", ") || "review required"}.` : `ARAG-1 recorded release request ${row.status.toLowerCase().replaceAll("_", " ")}.`,
      source_type: "ARAG_1", source_refs: [{ type: "arag_release_request", id: row.release_request_id }], confidence: 1,
      verification_class: "CANONICAL_OPERATIONAL_FACT", metadata_json: { projectId: row.project_id, revision: row.workspace_revision, status: row.status },
    });
  }
  return findings;
}

function briefFrom(signals: any, findings: any[], scope: any) {
  const verifiedOutcomes = (signals.outcomes || []).map((row: any) => item(row.fact_type || "Verified outcome", "Verified by the Truth Spine fact projection.", "VERIFIED_FACT", [{ type: "curriculum_truth_fact", id: row.truth_fact_id }], { occurredAt: row.occurred_at }));
  const externalSignals = (signals.reads || []).filter((row: any) => row.admission_status === "ADMITTED").map((row: any) => item("Approved external signal", `Read from ${row.source_identity || row.mcp_server_id}.`, "EXTERNAL_OBSERVATION", [{ type: "mcp_read_result", id: row.mcp_read_result_id }], { sourceIdentity: row.source_identity }));
  const needsAttention = findings.filter((row) => ["OPEN", "ACKNOWLEDGED"].includes(row.status || "OPEN"));
  const recommendations = findings.map((row) => item(`Consider: ${row.title}`, row.summary, "RECOMMENDATION", [{ type: "awareness_finding", id: row.finding_id }]));
  return {
    label: "OPERATING BRIEF",
    whatChanged: [...verifiedOutcomes, ...externalSignals],
    needsAttention: needsAttention.map((row) => item(row.title, row.summary, row.verification_class, row.source_refs, { findingId: row.finding_id, severity: row.severity, priority: row.priority })),
    decisionsRequired: findings.filter((row) => row.category === "APPROVAL_REQUIRED").map((row) => item(row.title, row.summary, row.verification_class, row.source_refs, { findingId: row.finding_id })),
    risksBlockers: findings.filter((row) => ["RISK", "BLOCKER", "SECURITY_ALERT", "GOVERNANCE_ALERT", "AGENT_EXCEPTION", "SERVICE_DEGRADATION"].includes(row.category)).map((row) => item(row.title, row.summary, row.verification_class, row.source_refs, { findingId: row.finding_id, severity: row.severity })),
    opportunities: findings.filter((row) => row.category === "OPPORTUNITY").map((row) => item(row.title, row.summary, "RECOMMENDATION", row.source_refs, { findingId: row.finding_id })),
    agentActivity: [{ title: "Governed agent activity", summary: `${signals.activity?.simulation_count || 0} simulation(s) observed; ${signals.activity?.failed_count || 0} failed or denied.`, verificationClass: "SECURITY_GOVERNANCE_FACT", sourceRefs: [{ type: "ai_agent_activity_ledger", organizationId: scope.organizationId }] }],
    securityGovernance: findings.filter((row) => ["SECURITY_ALERT", "GOVERNANCE_ALERT", "AGENT_EXCEPTION"].includes(row.category)).map((row) => item(row.title, row.summary, row.verification_class, row.source_refs, { findingId: row.finding_id })),
    verifiedOutcomes,
    externalSignals,
    recommendedNextActions: recommendations,
  };
}

export class OperationalAwarenessService {
  constructor(private repo = new OperationalAwarenessRepo(), private outbox = new IntegrationOutboxRepo()) {}

  private async emit(type: string, subjectType: string, subjectId: string, scope: any, payload: Record<string, unknown> = {}) {
    await this.outbox.enqueue({ producer_id: "shs-api.operational-awareness", event_type: type, subject_type: subjectType, subject_id: subjectId, organization_id: scope.organizationId, tenant_id: scope.tenantId, originating_actor_id: scope.userId, originating_actor_type: "user", occurred_at: new Date().toISOString(), idempotency_key: `${type}:${subjectId}`, correlation_id: `awareness:${subjectId}`, destination: "shs-reporting", payload });
  }

  async run(actor: Actor, body: any = {}) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.OPERATIONS_AWARENESS_MANAGE);
    const scope = scopeOf(actor);
    const end = new Date(); const start = new Date(end.getTime() - periodDays(body.periodDays) * 86400000);
    const signals = await this.repo.collectSignals(scope.organizationId, scope.tenantId, start);
    const rows = [];
    for (const candidate of buildFindings(signals, scope)) rows.push(await this.repo.createFinding(candidate));
    for (const row of rows) await this.emit("awareness.finding.created", "awareness_finding", row.finding_id, scope, { verification_class: row.verification_class, source_type: row.source_type });
    return { items: rows.map(toFindingResponse), period: { start: start.toISOString(), end: end.toISOString() } };
  }

  async listFindings(actor: Actor, status?: string) { requirePermission(actor, SHS_SECURITY_PERMISSIONS.OPERATIONS_AWARENESS_READ); const scope = scopeOf(actor); return (await this.repo.listFindings(scope.organizationId, scope.tenantId, status)).map(toFindingResponse); }
  async getFinding(actor: Actor, findingId: string) { requirePermission(actor, SHS_SECURITY_PERMISSIONS.OPERATIONS_AWARENESS_READ); const scope = scopeOf(actor); const row = await this.repo.getFinding(findingId, scope.organizationId, scope.tenantId); if (!row) throw new OperationalAwarenessError("AWARENESS_FINDING_NOT_FOUND", "Awareness finding was not found.", 404); return toFindingResponse(row); }

  async updateFindingStatus(actor: Actor, findingId: string, status: string) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.OPERATIONS_AWARENESS_MANAGE); const scope = scopeOf(actor); const normalized = String(status).toUpperCase();
    if (!["ACKNOWLEDGED", "RESOLVED", "DISMISSED"].includes(normalized)) throw new OperationalAwarenessError("AWARENESS_STATUS_INVALID", "Only acknowledgement, resolution, or dismissal may be recorded.");
    const row = await this.repo.updateFindingStatus({ finding_id: findingId, organization_id: scope.organizationId, tenant_id: scope.tenantId, status: normalized, actor_id: scope.userId });
    if (!row) throw new OperationalAwarenessError("AWARENESS_FINDING_NOT_FOUND", "Awareness finding was not found.", 404);
    await this.emit(`awareness.finding.${normalized.toLowerCase()}`, "awareness_finding", findingId, scope, { status: normalized });
    return toFindingResponse(row);
  }

  async generateBrief(actor: Actor, body: any = {}) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.REPORTING_DAILY_BRIEF_GENERATE); const scope = scopeOf(actor);
    const end = new Date(); const start = new Date(end.getTime() - periodDays(body.periodDays) * 86400000); const signals = await this.repo.collectSignals(scope.organizationId, scope.tenantId, start);
    const candidates = buildFindings(signals, scope); const persisted = []; for (const candidate of candidates) persisted.push(await this.repo.createFinding(candidate));
    const brief = briefFrom(signals, persisted, scope); const row = await this.repo.createBrief({ brief_id: `brief_${randomUUID()}`, organization_id: scope.organizationId, tenant_id: scope.tenantId, reporting_period_start: start, reporting_period_end: end, generated_for: scope.userId, source_window: { start: start.toISOString(), end: end.toISOString() }, finding_refs: persisted.map((finding: any) => ({ type: "awareness_finding", id: finding.finding_id })), verified_outcome_refs: brief.verifiedOutcomes.flatMap((entry: any) => entry.sourceRefs), agent_activity_refs: brief.agentActivity.flatMap((entry: any) => entry.sourceRefs), external_observation_refs: brief.externalSignals.flatMap((entry: any) => entry.sourceRefs), brief_json: brief });
    await this.emit("daily_brief.generated", "daily_operating_brief", row.brief_id, scope, { verification_classes: ["VERIFIED_FACT", "CANONICAL_OPERATIONAL_FACT", "SECURITY_GOVERNANCE_FACT", "EXTERNAL_OBSERVATION", "RECOMMENDATION"] });
    return toBriefResponse(row);
  }

  async getLatestBrief(actor: Actor) { requirePermission(actor, SHS_SECURITY_PERMISSIONS.REPORTING_DAILY_BRIEF_READ); const scope = scopeOf(actor); const row = await this.repo.getLatestBrief(scope.organizationId, scope.tenantId); return row ? toBriefResponse(row) : null; }
  async getLatestBriefForConductor(actor: Actor) { requirePermission(actor, SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_READ); const scope = scopeOf(actor); const row = await this.repo.getLatestBrief(scope.organizationId, scope.tenantId); return row ? toBriefResponse(row) : null; }
  async listBriefs(actor: Actor) { requirePermission(actor, SHS_SECURITY_PERMISSIONS.REPORTING_DAILY_BRIEF_READ); const scope = scopeOf(actor); return (await this.repo.listBriefs(scope.organizationId, scope.tenantId)).map(toBriefResponse); }
  async getBrief(actor: Actor, briefId: string) { requirePermission(actor, SHS_SECURITY_PERMISSIONS.REPORTING_DAILY_BRIEF_READ); const scope = scopeOf(actor); const row = await this.repo.getBrief(briefId, scope.organizationId, scope.tenantId); if (!row) throw new OperationalAwarenessError("DAILY_BRIEF_NOT_FOUND", "Daily Operating Brief was not found.", 404); return toBriefResponse(row); }
}
