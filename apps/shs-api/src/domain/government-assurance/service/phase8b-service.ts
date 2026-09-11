import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { AiGovernanceService } from "../../ai-governance/service/ai-governance-service.js";
import { InputSecurityService } from "../../input-security/service/input-security-service.js";
import { ReportArtifactService } from "../../reporting/report-artifact-service.js";
import { ReportR1Service } from "../../reporting/report-r1-service.js";
import { createAuthorizedReportProjection, reportFamilyForType } from "../../reporting/product-report-contract.js";
import { PilotReportingService } from "./pilot-reporting-service.js";
import { assertAdvisoryAgentResult } from "../adapters/agent-fabric-boundary.js";

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
  const orderColumn = table === "gpa_audit_engagements"
    ? "opened_at"
    : table === "gpa_data_quality_evaluations"
      ? "evaluated_at"
      : "created_at";
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
  for (const item of data.reconciliations || []) if (item.reconciliation_case_id) refs.push(reference("Reconciliation", item.reconciliation_case_id));
  for (const item of data.audits || []) if (item.audit_engagement_id) refs.push(reference("Audit", item.audit_engagement_id));
  for (const item of data.sources || []) if (item.source_system_id) refs.push(reference("SourceSystem", item.source_system_id));
  return refs.slice(0, 40);
}

export class GovernmentAssurancePhase8BService {
  constructor(
    private ai = new AiGovernanceService(),
    private inputSecurity = new InputSecurityService(),
    private artifacts = new ReportArtifactService(),
    private r1 = new ReportR1Service(),
    private pilotReporting = new PilotReportingService(),
  ) {}

  private async context(s: any) {
    const [claims, metrics, truth, funding, findings, reconciliations, audits, sources, lineageEdges, monitoring, correctiveActions, quality, verification] = await Promise.all([
      rows("gpa_claims", s), rows("gpa_metric_results", s), rows("gpa_truth_facts", s, "status='ACCEPTED'"),
      rows("gpa_funding_references", s), rows("gpa_findings", s), rows("gpa_reconciliation_cases", s),
      rows("gpa_audit_engagements", s), rows("gpa_source_systems", s), rows("gpa_funding_lineage_edges", s),
      rows("gpa_monitoring_plans", s), rows("gpa_corrective_actions", s), rows("gpa_data_quality_evaluations", s), rows("gpa_verification_records", s),
    ]);
    return { claims, metrics, truth, funding, findings, reconciliations, audits, sources, lineageEdges, monitoring, correctiveActions, quality, verification };
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
    return assertAdvisoryAgentResult({
      status: "GROUNDED",
      session: session || { sessionId: input?.sessionId || input?.session_id || null },
      security: { scanId: scan.scanId, decision: scan.decision },
      canonicalFacts,
      analysis: "This advisory explanation is generated from the authorized canonical GPA records listed below. It does not determine Truth, Verification, Findings, Reconciliation, or institutional Decisions.",
      recommendation: "Review the linked canonical records and use the owning workflow for any determination.",
      canonicalReferences: refs,
      provenance: { agentIdentifier: ASSISTANT, principal: s.userId, organization: s.organizationId, tenant: s.tenantId, purpose: PURPOSE, generatedAt: new Date().toISOString(), authority },
    });
  }

  async generateReport(actor: any, input: any) {
    const s = requirePermission(actor, SHS_SECURITY_PERMISSIONS.REPORTS_EXPORT);
    const reportType = String(input?.reportType || input?.report_type || "").trim().toUpperCase();
    if (!REPORTS.has(reportType)) throw new Error("GPA_REPORT_TYPE_INVALID");
    const dashboard = await this.pilotReporting.dashboard({ ...actor, organization_id: s.organizationId, tenant_id: s.tenantId });
    const data = await this.context(s);
    const subjectReference = String(input?.subjectReference || input?.subject_reference || "").trim() || null;
    if (["PROGRAM_ASSURANCE", "PROVIDER_ASSURANCE", "FUNDING_LINEAGE"].includes(reportType) && !subjectReference) throw new Error("GPA_REPORT_SUBJECT_REQUIRED");
    const matches = (item: any, values: string[]) => values.some((key) => String(item?.[key] || "") === subjectReference);
    const filterScoped = (items: any[], keys: string[]) => items.filter((item: any) => matches(item, keys));
    let filtered = data;
    if (reportType === "PROGRAM_ASSURANCE") {
      const funding = filterScoped(data.funding, ["program_reference", "programReference", "program"]);
      if (!funding.length) throw new Error("GPA_REPORT_SUBJECT_NOT_FOUND");
      filtered = { ...data, funding, claims: filterScoped(data.claims, ["program_reference", "programReference"]), metrics: filterScoped(data.metrics, ["program_reference", "programReference"]), truth: filterScoped(data.truth, ["program_reference", "programReference"]), findings: filterScoped(data.findings, ["program_reference", "programReference"]), reconciliations: filterScoped(data.reconciliations, ["program_reference", "programReference"]), audits: filterScoped(data.audits, ["program_reference", "programReference"]), monitoring: filterScoped(data.monitoring, ["program_reference", "programReference"]), correctiveActions: filterScoped(data.correctiveActions, ["program_reference", "programReference"]), quality: filterScoped(data.quality, ["program_reference", "programReference"]), verification: filterScoped(data.verification, ["program_reference", "programReference"]), lineageEdges: filterScoped(data.lineageEdges, ["from_reference", "to_reference"]) };
    } else if (reportType === "PROVIDER_ASSURANCE") {
      const funding = filterScoped(data.funding, ["provider_organization_reference", "providerReference", "provider"]);
      if (!funding.length) throw new Error("GPA_REPORT_SUBJECT_NOT_FOUND");
      filtered = { ...data, funding, claims: filterScoped(data.claims, ["provider_reference", "providerReference"]), metrics: filterScoped(data.metrics, ["provider_reference", "providerReference"]), truth: filterScoped(data.truth, ["provider_reference", "providerReference"]), findings: filterScoped(data.findings, ["provider_reference", "providerReference"]), reconciliations: filterScoped(data.reconciliations, ["provider_reference", "providerReference"]), audits: filterScoped(data.audits, ["provider_reference", "providerReference"]), monitoring: filterScoped(data.monitoring, ["provider_reference", "providerReference"]), correctiveActions: filterScoped(data.correctiveActions, ["provider_reference", "providerReference"]), quality: filterScoped(data.quality, ["provider_reference", "providerReference"]), verification: filterScoped(data.verification, ["provider_reference", "providerReference"]), lineageEdges: filterScoped(data.lineageEdges, ["from_reference", "to_reference"]) };
    } else if (reportType === "FUNDING_LINEAGE") {
      const funding = filterScoped(data.funding, ["funding_reference_id", "fundingReferenceId", "canonical_record_id"]);
      if (!funding.length) throw new Error("GPA_REPORT_SUBJECT_NOT_FOUND");
      filtered = { ...data, funding, lineageEdges: filterScoped(data.lineageEdges, ["from_reference", "to_reference"]) };
    } else if (reportType === "AUDIT_PACKET") {
      filtered = { ...data, audits: !subjectReference ? data.audits : filterScoped(data.audits, ["audit_engagement_id", "auditEngagementId"]) };
    }
    const canonicalReferences = canonicalContext(filtered);
    const reportVersion = reportType === "EXECUTIVE_ASSURANCE" ? 2 : 1;
    const report = { reportType, reportVersion, scope: { organizationId: s.organizationId, tenantId: s.tenantId, subjectReference, jurisdiction: input?.jurisdiction || input?.jurisdiction_name || null, reportingPeriod: input?.reportingPeriod || input?.reporting_period || null }, generatedAt: new Date().toISOString(), classification: reportType === "AUDIT_PACKET" ? "RESTRICTED_EXTERNAL" : "INTERNAL", canonicalFacts: { dashboard, ...filtered }, canonicalReferences, verificationState: { truthFacts: (filtered.truth || []).length, claims: (filtered.claims || []).length }, aiInvolvement: null };
    const manifest = canonicalReferences.length ? canonicalReferences.map((ref: any) => ({ report_id: `${ref.type}:${ref.id}`, report_version: 1 })) : [{ report_id: `gpa:${reportType}`, report_version: 1 }];
    const reportFamily = reportFamilyForType(reportType);
    if (!reportFamily) throw new Error("GPA_REPORT_FAMILY_INVALID");
    const projection = createAuthorizedReportProjection({
      productKey: "civicsure",
      reportFamily,
      subject: subjectReference,
      scope: report.scope,
      reportingPeriod: report.scope.reportingPeriod,
      classification: report.classification as "INTERNAL" | "RESTRICTED_EXTERNAL" | "PUBLIC",
      generatedAt: report.generatedAt,
      canonicalReferences: report.canonicalReferences,
      provenance: { source: "government-assurance-phase8b" },
      payload: report,
    });
    const artifact = await this.artifacts.createArtifact({ product_key: "civicsure", report_family: reportFamily, composition_type: `GPA_${reportType}`, composition_version: reportVersion, classification: report.classification, generation_idempotency_key: input?.idempotencyKey || `gpa:${reportType}:${s.organizationId}:${subjectReference || "scope"}:${Date.now()}`, canonical_input_manifest: { reports: manifest } }, actor);
    const formats = ["JSON", "HTML", "PDF"];
    const foundation = await this.r1.snapshotAndRender(projection, artifact, actor, formats);
    return { artifact: foundation.artifact, report, snapshot: foundation.snapshot, template: foundation.template, renderedFiles: foundation.renderedFiles };
  }
}
