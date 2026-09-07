import { StudioProjectService } from "../studio/service/studio-project-service.js";
import { createAuthorizedReportProjection, type AuthorizedReportProjection, type ProductReportProjectionAdapter } from "./product-report-contract.js";

const STUDIO_FAMILIES = new Set(["project-report", "qa-report", "review-report", "project-completion", "build-packet-evidence"]);
const OAS_FAMILIES = new Set(["conformance", "traceability", "testing-evidence"]);
const OAS_VERSION = "OAS-1";
const OAS_DOMAINS = [
  ["01", "Identity and Purpose"],
  ["02", "Autonomy and Agency"],
  ["03", "Safety and Risk"],
  ["04", "Transparency and Explainability"],
  ["05", "Human Oversight"],
  ["06", "Data and Privacy"],
  ["07", "Interoperability"],
  ["08", "Accountability and Governance"],
] as const;

function actorScope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  if (!organizationId || !tenantId || !userId) throw new Error("REPORT_SCOPE_REQUIRED");
  return { organizationId, tenantId, userId };
}

function required(value: unknown, code: string) {
  const result = String(value || "").trim();
  if (!result) throw new Error(code);
  return result;
}

function reference(type: string, id: string, label = id) { return { type, id, label }; }

function reportPeriod(input: any) {
  const value = input?.reportingPeriod || input?.reporting_period;
  if (value && typeof value === "object") return value;
  return { label: String(value || "Current state") };
}

function studioPresentation(family: string, project: any, buildPacket: any, workspace: any, qa: any, review: any, delivery: any, refs: any[], generatedAt: string) {
  const reportTitles: Record<string, string> = {
    "project-report": "Project Report",
    "qa-report": "QA Report",
    "review-report": "Review Report",
    "project-completion": "Project Completion Report",
    "build-packet-evidence": "Build Packet Evidence Report",
  };
  const tables: any[] = [];
  const projectRow = [project.projectId, project.title, project.projectType, project.status];
  if (family === "project-report" || family === "project-completion") {
    tables.push({ title: "Project Overview", headers: ["Project", "Title", "Type", "Lifecycle"], rows: [projectRow] });
    tables.push({ title: "Current Workspace", headers: ["Revision", "Revision ID", "State"], rows: [[workspace?.revision ?? "Not available", workspace?.revisionId || "Not available", workspace?.work ? "Present" : "No saved work payload"]] });
  }
  if (family === "qa-report" || family === "project-report" || family === "project-completion") {
    const run = qa?.run;
    tables.push({ title: "QA Summary", headers: ["Run", "Status", "Ruleset", "Workspace revision", "Findings"], rows: [[run?.qaRunId || "Not checked", qa?.status || "NOT_CHECKED", run?.rulesetVersion || "Not available", run?.workspaceRevision ?? qa?.workspaceRevision ?? "Not available", Array.isArray(run?.findings) ? run.findings.length : "Not available"]] });
  }
  if (family === "review-report" || family === "project-report" || family === "project-completion") {
    const submission = review?.submission;
    tables.push({ title: "Review Summary", headers: ["Submission", "Status", "Workspace revision", "Decision"], rows: [[submission?.submissionId || "Not submitted", submission?.status || "NOT_SUBMITTED", submission?.workspaceRevision ?? review?.currentWorkspaceRevision ?? "Not available", submission?.decision?.decision || "Pending"]] });
  }
  if (family === "build-packet-evidence" || family === "project-report" || family === "project-completion") {
    tables.push({ title: "Build Packet Evidence", headers: ["Packet", "Version", "Requirements", "Resources", "Source authority"], rows: [[buildPacket?.packetId || "Not available", buildPacket?.version || "Not available", Object.keys(buildPacket?.requirements || {}).length, buildPacket?.resources?.length || 0, "Studio Build Packet"]] });
  }
  if (family === "project-completion") {
    tables.push({ title: "Completion State", headers: ["Project status", "Delivery status", "Delivery record", "Completion evidence"], rows: [[project.status, delivery?.status || "NOT_READY", delivery?.record?.deliveryRecordId || "Not available", delivery?.record?.status === "FINALIZED" ? "Canonical delivery finalized" : "Completion not established"]] });
  }
  return {
    brand: { displayName: "Studio", shortName: "Studio", headerLabel: "Studio", subtitle: "Project and delivery assurance", category: "Studio Product Reporting", attribution: "Silicon Heartland" },
    reportTitle: reportTitles[family],
    subjectLabel: `${project.title || "Studio project"} (${project.projectId})`,
    reportingPeriod: reportPeriod({}),
    generatedAt,
    classification: "INTERNAL",
    summary: {
      project: project.title || project.projectId,
      lifecycle: project.status,
      qa: qa?.status || "NOT_CHECKED",
      review: review?.submission?.status || "NOT_SUBMITTED",
      delivery: delivery?.status || "NOT_READY",
    },
    sections: tables.map(({ title, ...tableSpec }) => ({ title, tables: [tableSpec] })),
    methodology: {
      source_authority: "Studio canonical project, workspace, QA, review, delivery, and Build Packet authorities",
      privacy: "Project report projections omit protected learner, reviewer, and submitted-work payload details unless the canonical authority exposes them for the authorized actor.",
      completion: "Report generation does not create or alter Studio lifecycle, QA, review, delivery, or evidence decisions.",
    },
    references: refs,
    metadata: { product: "Studio", reportFamily: family, sourceAuthority: "Studio", generatedAt, canonicalReferenceCount: refs.length },
  };
}

export class StudioReportProjectionAdapter implements ProductReportProjectionAdapter {
  productKey = "studio" as const;
  constructor(private studio = new StudioProjectService()) {}
  supports(reportFamily: string) { return STUDIO_FAMILIES.has(reportFamily); }

  async project(input: any, actor: any): Promise<AuthorizedReportProjection> {
    const family = required(input?.reportFamily || input?.report_family, "REPORT_FAMILY_REQUIRED");
    if (!this.supports(family)) throw new Error("REPORT_FAMILY_NOT_SUPPORTED");
    const projectId = required(input?.projectId || input?.project_id || input?.subjectReference, "STUDIO_PROJECT_REQUIRED");
    const scope = actorScope(actor);
    const generatedAt = new Date().toISOString();
    const project = await this.studio.get(actor, projectId);
    const [buildPacket, workspace, qa, review, delivery] = await Promise.all([
      (family === "project-report" || family === "build-packet-evidence" || family === "project-completion") ? this.studio.getBuildPacket(actor, projectId) : Promise.resolve(null),
      (family === "project-report" || family === "qa-report" || family === "review-report" || family === "project-completion") ? this.studio.getWorkspace(actor, projectId) : Promise.resolve(null),
      (family === "project-report" || family === "qa-report" || family === "project-completion") ? this.studio.getCurrentQa(actor, projectId) : Promise.resolve(null),
      (family === "project-report" || family === "review-report" || family === "project-completion") ? this.studio.getCurrentReview(actor, projectId) : Promise.resolve(null),
      (family === "project-report" || family === "project-completion") ? this.studio.getDelivery(actor, projectId) : Promise.resolve(null),
    ]);
    if (family === "project-completion" && delivery?.record?.status !== "FINALIZED" && project.status !== "DELIVERED") throw new Error("STUDIO_COMPLETION_NOT_AVAILABLE");
    const refs = [reference("STUDIO_PROJECT", project.projectId, project.title), workspace?.revisionId && reference("STUDIO_REVISION", workspace.revisionId), buildPacket?.packetId && reference("STUDIO_BUILD_PACKET", buildPacket.packetId), qa?.run?.qaRunId && reference("STUDIO_QA_RUN", qa.run.qaRunId), review?.submission?.submissionId && reference("STUDIO_REVIEW_SUBMISSION", review.submission.submissionId), delivery?.record?.deliveryRecordId && reference("STUDIO_DELIVERY", delivery.record.deliveryRecordId)].filter(Boolean);
    const presentation = studioPresentation(family, project, buildPacket, workspace, qa, review, delivery, refs, generatedAt);
    const reportType = { "project-report": "STUDIO_PROJECT_REPORT", "qa-report": "STUDIO_QA_REPORT", "review-report": "STUDIO_REVIEW_REPORT", "project-completion": "STUDIO_PROJECT_COMPLETION", "build-packet-evidence": "STUDIO_BUILD_PACKET_EVIDENCE" }[family];
    return createAuthorizedReportProjection({
      productKey: "studio", reportFamily: family, subject: project.projectId,
      scope: { organizationId: scope.organizationId, tenantId: scope.tenantId, subjectReference: project.projectId, jurisdiction: input?.jurisdiction || null },
      reportingPeriod: reportPeriod(input), classification: "INTERNAL", generatedAt, canonicalReferences: refs,
      sourceVersions: [{ authority: "studio", projectStatus: project.status, workspaceRevision: workspace?.revision || null }],
      provenance: { adapter: "studio-product-reporting", sourceAuthority: "Studio", reportType },
      payload: { reportType, reportVersion: 1, scope: { subjectReference: project.projectId, jurisdiction: input?.jurisdiction || null, reportingPeriod: reportPeriod(input) }, classification: "INTERNAL", generatedAt, canonicalReferences: refs, presentation, studio: { project, buildPacket, workspace: workspace ? { revision: workspace.revision, revisionId: workspace.revisionId } : null, qa, review, delivery } },
    });
  }
}

function oasPresentation(family: string, subject: string, standardVersion: string, generatedAt: string) {
  const rows = OAS_DOMAINS.map(([id, label]) => [id, label, "NOT_EVALUATED", "No canonical OAS conformance evidence authority is available"]);
  const titles: Record<string, string> = { conformance: "Conformance Report", traceability: "Traceability Report", "testing-evidence": "Testing and Evidence Report" };
  return {
    brand: { displayName: "Open Autonomous Standard", shortName: "OAS", headerLabel: "OAS", subtitle: "Open Autonomous Standard", category: "Standards Reporting", attribution: "Silicon Heartland" },
    reportTitle: titles[family], subjectLabel: subject, reportingPeriod: standardVersion, generatedAt, classification: "INTERNAL",
    summary: { standard: standardVersion, subject, status: "NOT_EVALUATED", evidence: "No canonical evidence supplied", boundary: "OAS only; no Registry or Trust Bureau determination" },
    sections: [
      { title: "Scope", notes: [`Subject: ${subject}`, `Standard version: ${standardVersion}`, "This report describes OAS requirements only. It does not register an agent, issue trust status, or certify an implementation."] },
      { title: family === "conformance" ? "Conformance Requirements" : family === "traceability" ? "Requirements Traceability" : "Testing and Evidence", tables: [{ headers: ["Domain", "Requirement area", "Status", "Evidence"], rows }] },
      { title: "Gaps and Boundaries", notes: ["All requirements are marked NOT_EVALUATED because this repository does not contain a canonical OAS subject/evidence/test authority. Missing evidence is not treated as non-conformance.", "OAS Standard ≠ Autonomous Registry ≠ Trust Bureau."] },
    ],
    methodology: { source_authority: "OAS public working-draft standard definitions in the repository", evaluation: "No conformance calculation is performed without a canonical OAS evidence/test authority", publication: "Generation does not publish or approve a public OAS record" },
    references: [reference("OAS_STANDARD", standardVersion, "OAS public working draft")].concat(OAS_DOMAINS.map(([id, label]) => reference("OAS_DOMAIN", `${standardVersion}:${id}`, label))),
    metadata: { product: "Open Autonomous Standard", reportFamily: family, standardVersion, generatedAt, conformanceStatus: "NOT_EVALUATED", registryStatus: "NOT_APPLICABLE", trustBureauStatus: "NOT_APPLICABLE" },
  };
}

export class OasReportProjectionAdapter implements ProductReportProjectionAdapter {
  productKey = "oas" as const;
  supports(reportFamily: string) { return OAS_FAMILIES.has(reportFamily); }
  async project(input: any, actor: any): Promise<AuthorizedReportProjection> {
    const family = required(input?.reportFamily || input?.report_family, "REPORT_FAMILY_REQUIRED");
    if (!this.supports(family)) throw new Error("REPORT_FAMILY_NOT_SUPPORTED");
    const subject = required(input?.subjectReference || input?.subject_reference || input?.subject, "OAS_SUBJECT_REQUIRED");
    const standardVersion = String(input?.standardVersion || input?.standard_version || OAS_VERSION).trim();
    if (standardVersion !== OAS_VERSION) throw new Error("OAS_STANDARD_VERSION_NOT_FOUND");
    const scope = actorScope(actor);
    const generatedAt = new Date().toISOString();
    const refs = oasPresentation(family, subject, standardVersion, generatedAt).references;
    const presentation = oasPresentation(family, subject, standardVersion, generatedAt);
    const reportType = { conformance: "OAS_CONFORMANCE", traceability: "OAS_TRACEABILITY", "testing-evidence": "OAS_TESTING_EVIDENCE" }[family];
    return createAuthorizedReportProjection({ productKey: "oas", reportFamily: family, subject, scope: { organizationId: scope.organizationId, tenantId: scope.tenantId, subjectReference: subject }, reportingPeriod: standardVersion, classification: "INTERNAL", generatedAt, canonicalReferences: refs, sourceVersions: [{ authority: "oas", standardVersion }], provenance: { adapter: "oas-product-reporting", sourceAuthority: "OAS public working-draft definitions" }, payload: { reportType, reportVersion: 1, scope: { subjectReference: subject, reportingPeriod: standardVersion }, classification: "INTERNAL", generatedAt, canonicalReferences: refs, presentation, oas: { standardVersion, subject, status: "NOT_EVALUATED" } } });
  }
}

export const studioOasAdapters = Object.freeze([new StudioReportProjectionAdapter(), new OasReportProjectionAdapter()]);
