import { query } from "../../db/client.js";
import { createAuthorizedReportProjection, type AuthorizedReportProjection, type ProductReportProjectionAdapter } from "./product-report-contract.js";

const FAMILIES = new Set(["legal-artifact-summary", "legal-authority-obligation", "legal-readiness", "legal-evidence-decision-trace"]);
function scope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!organizationId || !tenantId) throw new Error("REPORT_SCOPE_REQUIRED");
  return { organizationId, tenantId };
}

export class LegalReportAdapter implements ProductReportProjectionAdapter {
  productKey = "legal" as const;
  supports(reportFamily: string) { return FAMILIES.has(reportFamily); }
  async project(input: any, actor: any): Promise<AuthorizedReportProjection> {
    const family = String(input?.reportFamily || input?.report_family || "").trim();
    if (!this.supports(family)) throw new Error("REPORT_FAMILY_NOT_SUPPORTED");
    const s = scope(actor);
    const artifactId = String(input?.artifactId || input?.artifact_id || "").trim();
    if (!artifactId) throw new Error("LEGAL_ARTIFACT_REQUIRED");
    const artifact = (await query("SELECT artifact_id, artifact_type, title, status, effective_at, superseded_at, jurisdiction, authoritative_reference, content_hash, classification, confidentiality, privilege_state FROM legal_artifacts WHERE artifact_id=$1 AND organization_id=$2 AND tenant_id=$3", [artifactId, s.organizationId, s.tenantId])).rows[0];
    if (!artifact) throw new Error("LEGAL_ARTIFACT_NOT_FOUND");
    if (artifact.confidentiality === "CONFIDENTIAL" && !["org_admin", "shs_admin", "shf_admin", "super_admin"].some((role) => (actor?.roles || []).includes(role))) throw new Error("LEGAL_ARTIFACT_RESTRICTED");
    const decisions = (await query("SELECT decision_id, authority_reference, disposition, decision_at FROM legal_decisions WHERE artifact_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY decision_at DESC", [artifactId, s.organizationId, s.tenantId])).rows;
    const obligations = (await query("SELECT obligation_id, accountable_entity_reference, status, effective_at, due_at, technical_binding_reference, evidence_reference FROM legal_obligations WHERE artifact_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY updated_at DESC", [artifactId, s.organizationId, s.tenantId])).rows;
    const refs = [{ type: "LEGAL_ARTIFACT", id: artifact.artifact_id }, ...decisions.map((item: any) => ({ type: "LEGAL_DECISION", id: item.decision_id })), ...obligations.map((item: any) => ({ type: "LEGAL_OBLIGATION", id: item.obligation_id }))];
    const generatedAt = new Date().toISOString();
    const payload = {
      reportType: family.toUpperCase().replaceAll("-", "_"), reportVersion: 1, classification: artifact.classification, generatedAt, canonicalReferences: refs, scope: { subjectReference: artifact.artifact_id },
      presentation: { brand: { displayName: "Legal Authority", shortName: "Legal", headerLabel: "Legal Authority", subtitle: "Metadata-only legal record projection" }, reportTitle: family.replaceAll("-", " "), subjectLabel: artifact.title, classification: artifact.classification, sections: [{ title: "Artifact", rows: [["Type", artifact.artifact_type], ["Status", artifact.status], ["Authority reference", artifact.authoritative_reference], ["Hash", artifact.content_hash], ["Confidentiality", artifact.confidentiality], ["Privilege state", artifact.privilege_state]] }, { title: "Decisions and obligations", rows: [...decisions.map((item: any) => ["Decision", `${item.authority_reference}: ${item.disposition}`]), ...obligations.map((item: any) => ["Obligation", `${item.accountable_entity_reference}: ${item.status}`])]}], methodology: { sourceAuthority: "Canonical Legal runtime authority", disclosure: "Privileged body content is never projected by default." } },
      legal: { artifact, decisions, obligations },
    };
    return createAuthorizedReportProjection({ productKey: "legal", reportFamily: family, subject: artifact.artifact_id, scope: { organizationId: s.organizationId, tenantId: s.tenantId, subjectReference: artifact.artifact_id }, classification: artifact.classification, generatedAt, canonicalReferences: refs, sourceVersions: [{ authority: "legal-runtime", artifactHash: artifact.content_hash }], provenance: { adapter: "legal-reporting", sourceAuthority: "Legal runtime authority" }, payload });
  }
}

export const legalReportAdapter = new LegalReportAdapter();
