import { query } from "../../db/client.js";
import { createAuthorizedReportProjection, type AuthorizedReportProjection, type ProductReportProjectionAdapter } from "./product-report-contract.js";

const FAMILIES = new Set([
  "operating-review", "workflow-performance", "governance-control", "release-assurance-evidence", "control-exception",
  "agent-session", "policy-enforcement", "mcp-tool-access", "ai-security-event", "governed-ai-activity",
]);

const TYPES: Record<string, string> = {
  "operating-review": "BOS_OPERATING_REVIEW",
  "workflow-performance": "BOS_WORKFLOW_PERFORMANCE",
  "governance-control": "BOS_GOVERNANCE_CONTROL",
  "release-assurance-evidence": "BOS_RELEASE_ASSURANCE_EVIDENCE",
  "control-exception": "BOS_CONTROL_EXCEPTION",
  "agent-session": "BOS_AGENT_SESSION",
  "policy-enforcement": "BOS_POLICY_ENFORCEMENT",
  "mcp-tool-access": "BOS_MCP_TOOL_ACCESS",
  "ai-security-event": "BOS_AI_SECURITY_EVENT",
  "governed-ai-activity": "BOS_GOVERNED_AI_ACTIVITY",
};

function scope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || actor?.tenant || `tenant:${organizationId}`).trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  if (!organizationId || !tenantId || !userId) throw new Error("REPORT_SCOPE_REQUIRED");
  return { organizationId, tenantId, userId };
}

function required(value: unknown, code: string) {
  const result = String(value || "").trim();
  if (!result) throw new Error(code);
  return result;
}

function ref(type: string, id: string, label = id) { return { type, id, label }; }

function brand(family: string) {
  const ai = ["agent-session", "policy-enforcement", "mcp-tool-access", "ai-security-event", "governed-ai-activity"].includes(family);
  return { displayName: "Silicon Heartland Business Operating System", shortName: "BOS", headerLabel: ai ? "BOS / AI Governance" : "BOS", subtitle: ai ? "Governed AI and security reporting" : "Operational and governance reporting", category: ai ? "AI Governance Reporting" : "BOS Operational Reporting", attribution: "Silicon Heartland" };
}

function period(input: any) {
  const value = input?.reportingPeriod || input?.reporting_period;
  return value && typeof value === "object" ? value : { label: String(value || "Current state") };
}

function titleFor(family: string) { return family.replace(/(^|-)([a-z])/g, (_m, _p, c) => ` ${String(c).toUpperCase()}`).trim(); }

function presentation(family: string, subject: string, generatedAt: string, rows: any[], refs: any[], notes: string[] = []) {
  return {
    brand: brand(family), reportTitle: `${titleFor(family)} Report`, subjectLabel: subject || "Authorized organization scope", reportingPeriod: "Current state", generatedAt, classification: "INTERNAL",
    summary: { subject: subject || "Organization scope", status: "CANONICAL_DATA", privacy: "Metadata and references only; no raw prompts, content, credentials, or secrets" },
    sections: [{ title: "Governed Summary", tables: [{ headers: ["Measure", "Value", "Authority"], rows }], notes }, { title: "Boundaries", notes: ["Reporting does not alter workflow, policy, session, MCP, security, approval, or release state."] }],
    methodology: { source_authority: "BOS, ARAG-1, Agent Governance, Input Security, MCP, and Operational Awareness authorities", privacy: "Raw prompt/content payloads, secrets, credentials, exploit details, and sensitive resource content are omitted by default.", publication: "Generation does not publish, approve, release, or authorize any underlying operation." },
    references: refs, metadata: { product: "BOS", reportFamily: family, generatedAt, canonicalReferenceCount: refs.length, aiInvolvement: "No" },
  };
}

async function one(executor: typeof query, sql: string, params: unknown[]) { const result = await executor(sql, params); return result.rows[0] || null; }

export class BosAiGovernanceReportAdapter implements ProductReportProjectionAdapter {
  productKey = "bos" as const;
  constructor(private dbQuery = query) {}
  supports(reportFamily: string) { return FAMILIES.has(reportFamily); }

  async project(input: any, actor: any): Promise<AuthorizedReportProjection> {
    const family = required(input?.reportFamily || input?.report_family, "REPORT_FAMILY_REQUIRED");
    if (!this.supports(family)) throw new Error("REPORT_FAMILY_NOT_SUPPORTED");
    const s = scope(actor);
    const generatedAt = new Date().toISOString();
    const refs: any[] = [];
    const rows: any[] = [];
    let subject = "";

    if (family === "operating-review") {
      const activity = await one(this.dbQuery, "SELECT COUNT(*)::int AS simulations, COUNT(*) FILTER (WHERE status IN ('DENIED','FAILED'))::int AS failed, MAX(created_at) AS last_activity FROM ai_agent_activity_ledger WHERE organization_id=$1 AND tenant_id=$2", [s.organizationId, s.tenantId]);
      const findings = await one(this.dbQuery, "SELECT COUNT(*)::int AS open FROM operational_awareness_findings WHERE organization_id=$1 AND tenant_id=$2 AND status='OPEN'", [s.organizationId, s.tenantId]);
      const releases = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM arag_release_requests WHERE organization_id=$1 AND tenant_id=$2", [s.organizationId, s.tenantId]);
      rows.push(["Agent activity records", activity?.simulations || 0, "AI activity ledger"], ["Failed or denied activity", activity?.failed || 0, "AI activity ledger"], ["Open operational findings", findings?.open || 0, "Operational Awareness"], ["Release assurance requests", releases?.count || 0, "ARAG-1"]);
      refs.push(ref("BOS_ORGANIZATION", s.organizationId, "Authorized BOS organization scope"));
    } else if (family === "workflow-performance") {
      subject = required(input?.workflowReference || input?.workflow_reference || input?.conductorRequestId || input?.conductor_request_id, "BOS_WORKFLOW_REQUIRED");
      const request = await one(this.dbQuery, "SELECT conductor_request_id, status, requested_operation_ref, created_at, completed_at FROM bos_conductor_requests WHERE conductor_request_id=$1 AND organization_id=$2 AND tenant_id=$3", [subject, s.organizationId, s.tenantId]);
      if (!request) throw new Error("BOS_WORKFLOW_NOT_FOUND");
      const tasks = await one(this.dbQuery, "SELECT COUNT(*)::int AS count, COUNT(*) FILTER (WHERE status IN ('BLOCKED','DENIED','FAILED'))::int AS exceptions FROM bos_conductor_tasks WHERE conductor_request_id=$1 AND organization_id=$2 AND tenant_id=$3", [subject, s.organizationId, s.tenantId]);
      refs.push(ref("BOS_CONDUCTOR_REQUEST", request.conductor_request_id));
      rows.push(["Status", request.status, "BOS Conductor"], ["Tasks", tasks?.count || 0, "BOS Conductor"], ["Task exceptions", tasks?.exceptions || 0, "BOS Conductor"]);
    } else if (family === "governance-control") {
      subject = required(input?.policyId || input?.policy_id || input?.workOrderReference || input?.work_order_reference, "BOS_CONTROL_REQUIRED");
      const policy = await one(this.dbQuery, "SELECT policy_id, work_order_reference, policy_version, status, required_qa_status, required_review_status, required_approval FROM arag_work_order_policies WHERE (policy_id=$1 OR work_order_reference=$1) AND organization_id=$2 AND tenant_id=$3 ORDER BY policy_version DESC LIMIT 1", [subject, s.organizationId, s.tenantId]);
      if (!policy) throw new Error("BOS_CONTROL_NOT_FOUND");
      refs.push(ref("ARAG_POLICY", policy.policy_id, policy.work_order_reference));
      rows.push(["Policy version", policy.policy_version, "ARAG-1 policy authority"], ["Status", policy.status, "ARAG-1 policy authority"], ["Required approval", policy.required_approval ? "Yes" : "No", "ARAG-1 policy authority"], ["Required QA", policy.required_qa_status, "ARAG-1 policy authority"], ["Required review", policy.required_review_status, "ARAG-1 policy authority"]);
    } else if (family === "release-assurance-evidence") {
      subject = required(input?.releaseRequestId || input?.release_request_id, "BOS_RELEASE_REQUIRED");
      const release = await one(this.dbQuery, "SELECT release_request_id, project_id, workspace_revision, repository_reference, provider_key, target_environment, policy_decision, status, blocking_codes, acting_agent_identifier, agent_session_id, model_provider, model_identifier, updated_at FROM arag_release_requests WHERE release_request_id=$1 AND organization_id=$2 AND tenant_id=$3", [subject, s.organizationId, s.tenantId]);
      if (!release) throw new Error("BOS_RELEASE_NOT_FOUND");
      const approval = await one(this.dbQuery, "SELECT approver_user_id, decision, rationale, created_at FROM arag_release_approvals WHERE release_request_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY created_at DESC LIMIT 1", [subject, s.organizationId, s.tenantId]);
      const packet = await one(this.dbQuery, "SELECT packet_id, packet_version, packet_hash FROM arag_assurance_packets WHERE release_request_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY packet_version DESC LIMIT 1", [subject, s.organizationId, s.tenantId]);
      refs.push(ref("ARAG_RELEASE_REQUEST", release.release_request_id), approval && ref("ARAG_RELEASE_APPROVAL", `${subject}:${approval.created_at}`), packet && ref("ARAG_ASSURANCE_PACKET", packet.packet_id));
      rows.push(["Release status", release.status, "ARAG-1 release authority"], ["Policy decision", release.policy_decision, "ARAG-1 policy authority"], ["Target environment", release.target_environment, "ARAG-1 release authority"], ["Human approval", approval?.decision || "Not recorded", "ARAG-1 approval authority"], ["Evidence packet", packet?.packet_id || "Not recorded", "ARAG-1 assurance packet authority"]);
    } else if (family === "control-exception") {
      subject = required(input?.findingId || input?.finding_id, "BOS_EXCEPTION_REQUIRED");
      const finding = await one(this.dbQuery, "SELECT finding_id, finding_type, category, severity, priority, title, status, source_type, source_refs, evidence_refs, first_observed_at, last_observed_at FROM operational_awareness_findings WHERE finding_id=$1 AND organization_id=$2 AND tenant_id=$3", [subject, s.organizationId, s.tenantId]);
      if (!finding) throw new Error("BOS_EXCEPTION_NOT_FOUND");
      refs.push(ref("OPERATIONAL_AWARENESS_FINDING", finding.finding_id, finding.title));
      rows.push(["Type", finding.finding_type, "Operational Awareness"], ["Severity", finding.severity, "Operational Awareness"], ["Status", finding.status, "Operational Awareness"], ["Evidence references", Array.isArray(finding.evidence_refs) ? finding.evidence_refs.length : 0, "Operational Awareness"]);
    } else if (family === "agent-session") {
      subject = required(input?.sessionId || input?.session_id, "AI_SESSION_REQUIRED");
      const session = await one(this.dbQuery, "SELECT session_id, agent_identifier, acting_for_user_id, status, started_at, closed_at, model_provider, model_identifier, autonomy_profile, security_metadata FROM ai_agent_sessions WHERE session_id=$1 AND organization_id=$2 AND tenant_id=$3", [subject, s.organizationId, s.tenantId]);
      if (!session) throw new Error("AI_SESSION_NOT_FOUND");
      refs.push(ref("AI_AGENT_SESSION", session.session_id));
      rows.push(["Agent", session.agent_identifier, "AI Governance"], ["Delegated human", session.acting_for_user_id, "AI Governance"], ["Status", session.status, "AI Governance"], ["Model/provider", [session.model_provider, session.model_identifier].filter(Boolean).join(" / ") || "Not recorded", "AI Governance"], ["Autonomy profile", session.autonomy_profile, "AI Governance"]);
    } else if (family === "policy-enforcement") {
      subject = required(input?.admissionId || input?.admission_id || input?.policySubject, "AI_POLICY_EVENT_REQUIRED");
      const admission = await one(this.dbQuery, "SELECT admission_id, session_id, resource_type, resource_classification, decision, decision_code, admitted, evaluated_at FROM ai_context_admission_decisions WHERE admission_id=$1 AND organization_id=$2 AND tenant_id=$3", [subject, s.organizationId, s.tenantId]);
      if (!admission) throw new Error("AI_POLICY_EVENT_NOT_FOUND");
      refs.push(ref("AI_CONTEXT_ADMISSION", admission.admission_id));
      rows.push(["Decision", admission.decision, "AI Context Admission"], ["Decision code", admission.decision_code, "AI Context Admission"], ["Admitted", admission.admitted ? "Yes" : "No", "AI Context Admission"], ["Resource classification", admission.resource_classification, "AI Governance"]);
    } else if (family === "mcp-tool-access") {
      subject = required(input?.invocationId || input?.invocation_id, "MCP_INVOCATION_REQUIRED");
      const invocation = await one(this.dbQuery, "SELECT mcp_invocation_id, session_id, mcp_server_id, mcp_tool_id, requested_action, authority_allowed, authority_code, policy_allowed, policy_code, classification, approval_required, status, security_code, created_at FROM mcp_invocations WHERE mcp_invocation_id=$1 AND organization_id=$2 AND tenant_id=$3", [subject, s.organizationId, s.tenantId]);
      if (!invocation) throw new Error("MCP_INVOCATION_NOT_FOUND");
      refs.push(ref("MCP_INVOCATION", invocation.mcp_invocation_id));
      rows.push(["Server", invocation.mcp_server_id, "Governed MCP Gateway"], ["Tool", invocation.mcp_tool_id || "Resource access", "Governed MCP Gateway"], ["Requested action", invocation.requested_action, "Governed MCP Gateway"], ["Authorization", invocation.authority_allowed ? "Allowed" : "Denied", "Authority decision"], ["Policy", invocation.policy_allowed ? "Allowed" : "Denied", "MCP tool policy"], ["Status", invocation.status, "Governed MCP Gateway"]);
    } else if (family === "ai-security-event") {
      subject = required(input?.scanId || input?.scan_id || input?.findingId || input?.finding_id, "AI_SECURITY_EVENT_REQUIRED");
      const scan = await one(this.dbQuery, "SELECT scan_id, resource_type, resource_id, scan_status, risk_level, decision, finding_count, created_at FROM ai_input_security_scans WHERE scan_id=$1 AND organization_id=$2 AND tenant_id=$3", [subject, s.organizationId, s.tenantId]);
      if (!scan) throw new Error("AI_SECURITY_EVENT_NOT_FOUND");
      refs.push(ref("AI_SECURITY_SCAN", scan.scan_id));
      rows.push(["Event status", scan.scan_status, "Agent Input Security Gateway"], ["Risk level", scan.risk_level, "Agent Input Security Gateway"], ["Decision", scan.decision, "Agent Input Security Gateway"], ["Finding count", scan.finding_count, "Agent Input Security Gateway"], ["Payload", "Redacted", "Security boundary"]);
    } else if (family === "governed-ai-activity") {
      const activity = await one(this.dbQuery, "SELECT COUNT(*)::int AS sessions, COUNT(*) FILTER (WHERE status IN ('DENIED','FAILED'))::int AS failed, COALESCE(SUM(proposed_action_count),0)::int AS actions, COALESCE(SUM(denied_action_count),0)::int AS denied, COALESCE(SUM(mcp_invocation_count),0)::int AS mcp FROM ai_agent_activity_ledger WHERE organization_id=$1 AND tenant_id=$2", [s.organizationId, s.tenantId]);
      const security = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM ai_input_security_scans WHERE organization_id=$1 AND tenant_id=$2 AND scan_status IN ('BLOCKED','QUARANTINED','REVIEW_REQUIRED','SUSPICIOUS')", [s.organizationId, s.tenantId]);
      refs.push(ref("AI_ACTIVITY_LEDGER", `${s.organizationId}:${s.tenantId}`, "Authorized aggregate activity"));
      rows.push(["Sessions", activity?.sessions || 0, "AI activity ledger"], ["Failed or denied", activity?.failed || 0, "AI activity ledger"], ["Proposed actions", activity?.actions || 0, "AI activity ledger"], ["Denied actions", activity?.denied || 0, "AI activity ledger"], ["MCP invocations", activity?.mcp || 0, "AI activity ledger"], ["Security events requiring attention", security?.count || 0, "Input Security Gateway"]);
    }

    const reportPeriod = period(input);
    const reportType = TYPES[family];
    const presentationModel = presentation(family, subject, generatedAt, rows, refs.filter(Boolean));
    return createAuthorizedReportProjection({
      productKey: "bos", reportFamily: family, subject: subject || s.organizationId,
      scope: { organizationId: s.organizationId, tenantId: s.tenantId, subjectReference: subject || s.organizationId, jurisdiction: "Authorized-Scope" },
      reportingPeriod: reportPeriod, classification: "INTERNAL", generatedAt, canonicalReferences: refs.filter(Boolean), sourceVersions: [{ authority: "bos-ai-governance", generatedAt }],
      provenance: { adapter: "bos-ai-governance-reporting", sourceAuthority: "BOS, ARAG-1, AI Governance, Input Security, MCP, and Operational Awareness authorities", reportType },
      payload: { reportType, reportVersion: 1, scope: { subjectReference: subject || s.organizationId, jurisdiction: "Authorized-Scope", reportingPeriod: reportPeriod }, classification: "INTERNAL", generatedAt, canonicalReferences: refs.filter(Boolean), presentation: { ...presentationModel, reportingPeriod: reportPeriod }, bos: { reportFamily: family, subject: subject || s.organizationId, rows } },
    });
  }
}

export const bosAiGovernanceAdapter = new BosAiGovernanceReportAdapter();
