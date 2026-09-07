import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { AiGovernanceService } from "../../ai-governance/service/ai-governance-service.js";
import { InputSecurityService } from "../../input-security/service/input-security-service.js";
import { ReportArtifactService } from "../../reporting/report-artifact-service.js";
import { PilotReportingService } from "./pilot-reporting-service.js";

const ASSISTANT = "gpa-governed-assistant";
const PURPOSE = "GOVERNMENT_PROGRAM_ASSURANCE";
const REPORTS = new Set(["EXECUTIVE_ASSURANCE", "PROGRAM_ASSURANCE", "PROVIDER_ASSURANCE", "FUNDING_LINEAGE", "AUDIT_PACKET"]);

function scope(actor: any) {
  const userId = String(actor?.user_id || actor?.id || "");
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("GPA_SCOPE_REQUIRED");
  return { userId, organizationId, tenantId };
}

function requirePermission(actor: any, permission: string) {
  if (!hasPermission(actor?.permissions || [], permission)) throw new Error("GPA_PERMISSION_REQUIRED");
  return scope(actor);
}

async function rows(table: string, s: any, where = "TRUE", params: any[] = []) {
  const orderColumn = table === "gpa_audit_engagements" ? "opened_at" : "created_at";
  const result = await query(`SELECT * FROM ${table} WHERE organization_id=$1 AND tenant_id=$2 AND ${where} ORDER BY ${orderColumn} DESC LIMIT 50`, [s.organizationId, s.tenantId, ...params]);
  return result.rows;
}

function reference(type: string, id: string, label = id) {
  return { type, id, label, href: `#/operator/government-assurance/${type.toLowerCase()}/${encodeURIComponent(id)}` };
}

function canonicalContext(data: any) {
  const refs: any[] = [];
  for (const item of data.claims || []) if (item.claim_id) refs.push(reference("Claim", item.claim_id));
  for (const item of data.metrics || []) if (item.metric_result_id) refs.push(reference("MetricResult", item.metric_result_id));
  for (const item of data.truth || []) if (item.truth_fact_id) refs.push(reference("TruthFact", item.truth_fact_id));
  for (const item of data.findings || []) if (item.finding_id) refs.push(reference("Finding", item.finding_id));
  for (const item of data.funding || []) if (item.funding_reference_id) refs.push(reference("Funding", item.funding_reference_id));
  return refs.slice(0, 40);
}

export class GovernmentAssurancePhase8BService {
  constructor(
    private ai = new AiGovernanceService(),
    private inputSecurity = new InputSecurityService(),
    private artifacts = new ReportArtifactService(),
    private pilotReporting = new PilotReportingService(),
  ) {}

  private async context(s: any) {
    const [claims, metrics, truth, funding, findings, reconciliations, audits, sources] = await Promise.all([
      rows("gpa_claims", s), rows("gpa_metric_results", s), rows("gpa_truth_facts", s, "status='ACCEPTED'"),
      rows("gpa_funding_references", s), rows("gpa_findings", s), rows("gpa_reconciliation_cases", s),
      rows("gpa_audit_engagements", s), rows("gpa_source_systems", s),
    ]);
    return { claims, metrics, truth, funding, findings, reconciliations, audits, sources };
  }

  async assist(actor: any, input: any) {
    const s = requirePermission(actor, SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_USE);
    if (!hasPermission(actor?.permissions || [], SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE) || !hasPermission(actor?.permissions || [], SHS_SECURITY_PERMISSIONS.AI_SECURITY_SCAN)) throw new Error("GPA_AI_GOVERNANCE_REQUIRED");
    const prompt = String(input?.prompt || "").trim();
    if (!prompt) throw new Error("GPA_AI_PROMPT_REQUIRED");
    const resourceId = String(input?.resourceId || input?.resource_id || `request_${randomUUID()}`);
    const scan = await this.inputSecurity.scanInput(actor, { resourceType: "gpa_assistant_prompt", resourceId, content: prompt, sourceKind: "USER_PROMPT" });
    if (["BLOCK", "QUARANTINE", "REQUIRE_REVIEW"].includes(String(scan.decision))) {
      return { status: "BLOCKED", security: { decision: scan.decision, scanId: scan.scanId, findingCount: scan.findingCount }, canonicalReferences: [], message: "This request cannot be admitted to the governed GPA assistant context." };
    }
    const delegationId = String(input?.delegationId || input?.delegation_id || "");
    const resource = { resourceType: "gpa_pilot_scope", resourceId: String(input?.pilotConfigurationId || input?.pilot_configuration_id || "scope") };
    let session: any = null;
    if (delegationId && !input?.sessionId && !input?.session_id) {
      session = await this.ai.createSession(actor, { delegationId, agentIdentifier: ASSISTANT, purpose: PURPOSE, resource, action: "agent.session.open", expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() });
    }
    const authority = await this.ai.evaluateAgentAuthority({ principalUserId: s.userId, organizationId: s.organizationId, tenantId: s.tenantId, delegationId, sessionId: input?.sessionId || input?.session_id || session?.sessionId, agentIdentifier: ASSISTANT, purpose: PURPOSE, resource, action: "gpa.assistant.answer" });
    if (!authority.allowed) return { status: "DENIED", denialCode: authority.denialCode, canonicalReferences: [], message: "GPA assistant access is not authorized for this purpose, scope, or delegation." };
    const data = await this.context(s);
    const lower = prompt.toLowerCase();
    const dashboard = await this.pilotReporting.dashboard({ ...actor, organization_id: s.organizationId, tenant_id: s.tenantId });
    const canonicalFacts = lower.includes("fund") ? { funding: data.funding.slice(0, 20), summary: dashboard.summary } : lower.includes("metric") || lower.includes("truth") ? { metrics: data.metrics.slice(0, 20), truth: data.truth.slice(0, 20) } : lower.includes("claim") || lower.includes("evidence") || lower.includes("verification") ? { claims: data.claims.slice(0, 20), truth: data.truth.slice(0, 20) } : { summary: dashboard.summary, actionRequired: dashboard.actionRequired, truth: data.truth.slice(0, 10), findings: data.findings.slice(0, 10) };
    const refs = canonicalContext({ ...data, metrics: canonicalFacts.metrics || data.metrics, truth: canonicalFacts.truth || data.truth, funding: canonicalFacts.funding || data.funding });
    return {
      status: "GROUNDED",
      session: session || { sessionId: input?.sessionId || input?.session_id || null },
      security: { scanId: scan.scanId, decision: scan.decision },
      canonicalFacts,
      analysis: "This advisory explanation is generated from the authorized canonical GPA records listed below. It does not determine Truth, Verification, Findings, Reconciliation, or institutional Decisions.",
      recommendation: "Review the linked canonical records and use the owning workflow for any determination.",
      canonicalReferences: refs,
      provenance: { agentIdentifier: ASSISTANT, principal: s.userId, organization: s.organizationId, tenant: s.tenantId, purpose: PURPOSE, generatedAt: new Date().toISOString(), authority },
    };
  }

  async generateReport(actor: any, input: any) {
    const s = requirePermission(actor, SHS_SECURITY_PERMISSIONS.REPORTS_EXPORT);
    const reportType = String(input?.reportType || input?.report_type || "").trim().toUpperCase();
    if (!REPORTS.has(reportType)) throw new Error("GPA_REPORT_TYPE_INVALID");
    const dashboard = await this.pilotReporting.dashboard({ ...actor, organization_id: s.organizationId, tenant_id: s.tenantId });
    const data = await this.context(s);
    const subjectReference = String(input?.subjectReference || input?.subject_reference || "").trim() || null;
    const filtered = reportType === "PROGRAM_ASSURANCE" ? { ...data, funding: data.funding.filter((x: any) => x.program_reference === subjectReference) } : reportType === "PROVIDER_ASSURANCE" ? { ...data, funding: data.funding.filter((x: any) => x.provider_organization_reference === subjectReference) } : reportType === "FUNDING_LINEAGE" ? { ...data, funding: data.funding.filter((x: any) => !subjectReference || x.funding_reference_id === subjectReference) } : reportType === "AUDIT_PACKET" ? { ...data, audits: data.audits.filter((x: any) => !subjectReference || x.audit_engagement_id === subjectReference) } : data;
    const canonicalReferences = canonicalContext(filtered);
    const report = { reportType, reportVersion: 1, scope: { organizationId: s.organizationId, tenantId: s.tenantId, subjectReference, reportingPeriod: input?.reportingPeriod || input?.reporting_period || null }, generatedAt: new Date().toISOString(), classification: reportType === "AUDIT_PACKET" ? "RESTRICTED_EXTERNAL" : "INTERNAL", canonicalFacts: { dashboard, ...filtered }, canonicalReferences, verificationState: { truthFacts: (filtered.truth || []).length, claims: (filtered.claims || []).length }, aiInvolvement: input?.aiInvolvement || null };
    const manifest = canonicalReferences.length ? canonicalReferences.map((ref: any) => ({ report_id: `${ref.type}:${ref.id}`, report_version: 1 })) : [{ report_id: `gpa:${reportType}`, report_version: 1 }];
    const artifact = await this.artifacts.createArtifact({ composition_type: `GPA_${reportType}`, composition_version: 1, classification: report.classification, generation_idempotency_key: input?.idempotencyKey || `gpa:${reportType}:${s.organizationId}:${subjectReference || "scope"}:${Date.now()}`, canonical_input_manifest: { reports: manifest } }, actor);
    return { artifact, report };
  }
}
