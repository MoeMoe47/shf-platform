import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { assuranceScope, requireScope } from "../model/government-assurance.js";
import { RiskService } from "./risk-service.js";

function actor(input: any) { return { userId: String(input?.userId || input?.user_id || input?.id || ""), organizationId: String(input?.organizationId || input?.organization_id || input?.active_organization_id || ""), tenantId: String(input?.tenantId || input?.tenant_id || ""), permissions: input?.permissions || [], actor_type: input?.actor_type || input?.actorType || "user" }; }
function permission(a: any) { if (!hasPermission(a.permissions || [], SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_MONITORING_MANAGE)) throw new Error("GPA_PERMISSION_REQUIRED"); }

export class AssuranceOutcomeRiskIntegrationService {
  constructor(private risk = new RiskService()) {}

  async verificationOutcome(inputActor: any, input: any) {
    const a = actor(inputActor); permission(a); const scope = assuranceScope(a); requireScope(input, scope);
    if (!input.claimId || !input.verificationId || !input.outcome) throw new Error("GPA_VERIFICATION_RISK_FIELDS_REQUIRED");
    const outcome = String(input.outcome).toUpperCase();
    if (!["VERIFIED", "PASSED", "FAILED", "UNRESOLVED", "DISPUTED", "INCONCLUSIVE"].includes(outcome)) throw new Error("GPA_VERIFICATION_RISK_OUTCOME_INVALID");
    const blocked = ["FAILED", "UNRESOLVED", "DISPUTED", "INCONCLUSIVE"].includes(outcome) || input.evidenceState !== "COMPLETE";
    if (!blocked) return { outcome, claimId: input.claimId, verificationId: input.verificationId, truthEligible: true, risk: null, exposure: null };
    if (!input.ruleId) throw new Error("GPA_VERIFICATION_RISK_RULE_REQUIRED");
    const risk = await this.risk.evaluate(inputActor, { ruleId: input.ruleId, ruleVersion: input.ruleVersion || 1, value: input.value ?? 1, threshold: input.threshold, operator: input.operator || ">", providerReference: input.providerReference, programReference: input.programReference, cycleReference: input.cycleReference, affectedReferences: [input.claimId, input.verificationId], confidence: input.confidence, explanation: input.explanation || `Verification ${input.verificationId} is ${outcome}; accepted Truth is blocked.`, provenance: { ...(input.provenance || {}), claimId: input.claimId, evidenceState: input.evidenceState || "UNKNOWN", verificationId: input.verificationId, outcome } });
    const exposure = input.financialReference && input.amountAtRisk != null && input.currency ? await this.risk.createExposure(inputActor, { ...input, exposureReference: input.financialReference, status: input.status || "POTENTIAL", signalReferences: risk.signal ? [risk.signal.signal_id] : [], claimReferences: [input.claimId], evidenceReferences: input.evidenceReferences || [], rationale: input.rationale || `Financial exposure associated with ${outcome} verification.` }) : null;
    return { outcome, claimId: input.claimId, verificationId: input.verificationId, truthEligible: false, risk, exposure };
  }

  async reconciliationOutcome(inputActor: any, input: any) {
    const a = actor(inputActor); permission(a); const scope = assuranceScope(a); requireScope(input, scope);
    if (!input.reconciliationCaseId || !input.claimId || !input.status) throw new Error("GPA_RECONCILIATION_RISK_FIELDS_REQUIRED");
    const status = String(input.status).toUpperCase();
    if (!["OPEN", "UNDER_REVIEW", "UNRESOLVED", "RESOLVED"].includes(status)) throw new Error("GPA_RECONCILIATION_RISK_STATUS_INVALID");
    const unresolved = status !== "RESOLVED";
    const risk = unresolved ? await this.risk.evaluate(inputActor, { ruleId: input.ruleId, ruleVersion: input.ruleVersion || 1, value: input.value ?? 1, threshold: input.threshold, operator: input.operator || ">", providerReference: input.providerReference, programReference: input.programReference, cycleReference: input.cycleReference, affectedReferences: [input.claimId, input.reconciliationCaseId], confidence: input.confidence, explanation: input.explanation || `Reconciliation ${input.reconciliationCaseId} remains ${status}; affected assurance is blocked.`, provenance: { ...(input.provenance || {}), claimId: input.claimId, reconciliationCaseId: input.reconciliationCaseId, status } }) : null;
    const exposure = input.financialReference && input.amountAtRisk != null && input.currency ? await this.risk.createExposure(inputActor, { ...input, exposureReference: input.financialReference, status: unresolved ? (input.statusAtRisk || "UNDER_REVIEW") : "RESOLVED", signalReferences: risk?.signal ? [risk.signal.signal_id] : input.signalReferences || [], claimReferences: [input.claimId], reconciliationReferences: [input.reconciliationCaseId], rationale: input.rationale || `Reconciliation ${input.reconciliationCaseId} is ${status}.` }) : null;
    return { reconciliationCaseId: input.reconciliationCaseId, claimId: input.claimId, status, affectedResultBlocked: unresolved, truthEligible: !unresolved, risk, exposure };
  }
}
