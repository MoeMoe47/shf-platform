import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { assuranceScope, requireScope } from "../model/government-assurance.js";
import { query } from "../../../db/client.js";
import { MonitoringAuditService } from "./monitoring-audit-service.js";
import { RiskService } from "./risk-service.js";

function actor(input: any) {
  return { userId: String(input?.userId || input?.user_id || input?.id || ""), organizationId: String(input?.organizationId || input?.organization_id || input?.active_organization_id || ""), tenantId: String(input?.tenantId || input?.tenant_id || ""), permissions: input?.permissions || [], actor_type: input?.actor_type || input?.actorType || "user" };
}
function human(a: any) { if (["ai", "agent", "oracle", "system"].includes(String(a.actor_type).toLowerCase())) throw new Error("GPA_DECISION_ACTOR_DENIED"); }
function permission(a: any, name: string) { if (!hasPermission(a.permissions || [], name)) throw new Error("GPA_PERMISSION_REQUIRED"); }

export class AssuranceRiskWorkflowService {
  constructor(private risk = new RiskService(), private monitoring = new MonitoringAuditService()) {}

  async transitionWarning(inputActor: any, signalId: string, input: any) {
    const a = actor(inputActor); human(a); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_MONITORING_MANAGE);
    const scope = assuranceScope(a); requireScope(input, scope);
    const status = String(input.status || "UNDER_REVIEW");
    if (!["OPEN", "UNDER_REVIEW", "RESOLVED", "ESCALATED"].includes(status)) throw new Error("GPA_RISK_SIGNAL_STATUS_INVALID");
    if (status === "RESOLVED" && !input.rationale) throw new Error("GPA_RISK_RESOLUTION_RATIONALE_REQUIRED");
    const result = await query("SELECT * FROM gpa_risk_signals WHERE signal_id=$1 AND organization_id=$2 AND tenant_id=$3", [signalId, scope.organizationId, scope.tenantId]);
    const prior = result.rows[0]; if (!prior) throw new Error("GPA_RISK_SIGNAL_NOT_FOUND");
    if (prior.status === "RESOLVED" && status !== "RESOLVED") throw new Error("GPA_RISK_SIGNAL_TERMINAL");
    return (await query("UPDATE gpa_risk_signals SET status=$4, explanation=$5, provenance=$6 WHERE signal_id=$1 AND organization_id=$2 AND tenant_id=$3 RETURNING *", [signalId, scope.organizationId, scope.tenantId, status, input.rationale || prior.explanation, JSON.stringify({ ...(prior.provenance || {}), transition: { from: prior.status, to: status, actor: a.userId, rationale: input.rationale || null, at: new Date().toISOString() } })])).rows[0];
  }

  async escalateToFinding(inputActor: any, signalId: string, input: any) {
    const a = actor(inputActor); human(a); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_FINDING_DETERMINE);
    const scope = assuranceScope(a); requireScope(input, scope);
    const signal = (await query("SELECT * FROM gpa_risk_signals WHERE signal_id=$1 AND organization_id=$2 AND tenant_id=$3", [signalId, scope.organizationId, scope.tenantId])).rows[0];
    if (!signal) throw new Error("GPA_RISK_SIGNAL_NOT_FOUND");
    const finding = await this.monitoring.createFinding(inputActor, { ...input, monitoringReference: signalId, providerReference: input.providerReference || signal.provider_reference, programReference: input.programReference || signal.program_reference, status: input.status || "PROPOSED", severity: input.severity || signal.severity, materiality: input.materiality || signal.materiality, provenance: { ...(input.provenance || {}), riskSignalId: signalId, riskEvaluationId: signal.evaluation_id } });
    await this.transitionWarning(inputActor, signalId, { ...input, status: "ESCALATED", rationale: input.rationale || "Authorized review escalated risk signal to canonical finding." });
    return { signal, finding };
  }

  async createCorrectiveAction(inputActor: any, input: any) { return this.monitoring.createAction(inputActor, input); }

  async recordRetest(inputActor: any, input: any) {
    const a = actor(inputActor); human(a);
    const result = await this.monitoring.retest(inputActor, input);
    const status = input.result === "PASS" ? "RESOLVED" : "OPEN";
    if (input.signalId) await this.transitionWarning(inputActor, input.signalId, { ...input, status, rationale: input.result === "PASS" ? "Retest passed; awaiting authorized closure." : "Retest failed; risk remains active." });
    if (input.result !== "PASS" && input.findingId) await this.monitoring.determineFinding(inputActor, input.findingId, { status: "REMEDIATION_IN_PROGRESS", provenance: { failedRetest: true, retestEvidence: input.evidenceReferences || [] } });
    return result;
  }

  async closeRemediation(inputActor: any, input: any) {
    const a = actor(inputActor); human(a); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_DECISION_DETERMINE);
    const scope = assuranceScope(a); requireScope(input, scope);
    if (!input.decisionReference || !input.rationale) throw new Error("GPA_REMEDIATION_DECISION_REQUIRED");
    const action = (await query("SELECT * FROM gpa_corrective_actions WHERE corrective_action_id=$1 AND organization_id=$2 AND tenant_id=$3", [input.correctiveActionId, scope.organizationId, scope.tenantId])).rows[0];
    if (!action) throw new Error("GPA_CORRECTIVE_ACTION_NOT_FOUND");
    if (action.status !== "COMPLETE") throw new Error("GPA_REMEDIATION_RETEST_REQUIRED");
    const decision = await this.monitoring.createDecision(inputActor, { decisionId: input.decisionReference, decisionType: "REMEDIATION_CLOSURE", authorityReference: input.authorityReference || a.userId, subjectType: "CORRECTIVE_ACTION", subjectReference: input.correctiveActionId, evidenceConsidered: input.evidenceReferences || [], factsConsidered: input.factsConsidered || [], provenance: input.provenance || {} });
    const closedAction = await query("UPDATE gpa_corrective_actions SET status='CLOSED', approved_by=$4, completed_at=NOW(), provenance=provenance || $5::jsonb WHERE corrective_action_id=$1 AND organization_id=$2 AND tenant_id=$3 RETURNING *", [input.correctiveActionId, scope.organizationId, scope.tenantId, a.userId, JSON.stringify({ closureDecision: decision.decision_id, rationale: input.rationale })]);
    if (input.findingId) await this.monitoring.determineFinding(inputActor, input.findingId, { status: "RESOLVED", provenance: { closureDecision: decision.decision_id, rationale: input.rationale } });
    if (input.signalId) await this.transitionWarning(inputActor, input.signalId, { status: "RESOLVED", rationale: input.rationale, ...input });
    if (input.exposureReference) await this.risk.createExposure(inputActor, { ...input, exposureReference: input.exposureReference, status: "RESOLVED", amountAtRisk: input.amountAtRisk ?? 0, currency: input.currency || "USD", rationale: input.rationale, decisionReference: decision.decision_id });
    return { decision, correctiveAction: closedAction.rows[0] };
  }
}
