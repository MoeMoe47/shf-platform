import { query } from "../../db/client.js";
import { createAuthorizedReportProjection, type AuthorizedReportProjection, type ProductReportProjectionAdapter } from "./product-report-contract.js";

const REGISTRY_FAMILIES = new Set(["registry-record", "registration-summary"]);
const SOLUTIONS_FAMILIES = new Set(["client-operating", "service-delivery", "implementation", "executive-business-review", "assurance-control"]);

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

function period(input: any) {
  const value = input?.reportingPeriod || input?.reporting_period;
  return value && typeof value === "object" ? value : { label: String(value || "Current state") };
}

function titleFor(family: string) { return family.replace(/(^|-)([a-z])/g, (_m, _p, c) => ` ${String(c).toUpperCase()}`).trim(); }

function projectionPresentation(product: string, family: string, subject: string, generatedAt: string, rows: any[], refs: any[], notes: string[]) {
  const brand = product === "registry"
    ? { displayName: "Autonomous Registry", shortName: "Registry", headerLabel: "Autonomous Registry", subtitle: "Registry-owned records and lifecycle reporting" }
    : { displayName: "Silicon Heartland Solutions", shortName: "Solutions", headerLabel: "Silicon Heartland Solutions", subtitle: "Authorized client and service operations reporting" };
  return {
    brand,
    reportTitle: `${titleFor(family)} Report`,
    subjectLabel: subject || "Authorized organization scope",
    generatedAt,
    classification: "INTERNAL",
    summary: { subject: subject || "Organization scope", status: "CANONICAL_DATA" },
    sections: [{ title: "Governed Summary", tables: [{ headers: ["Measure", "Value", "Authority"], rows }], notes }, { title: "Boundaries", notes: ["Reporting is read-only and does not change the source authority, publication state, contract, entitlement, registration, or legal record."] }],
    methodology: { sourceAuthority: product === "registry" ? "Autonomous Registry submission and package authorities" : "Solutions service catalog, entitlement, agreement, and onboarding authorities", publication: "Generation does not publish or release the source record." },
    references: refs,
    metadata: { product, reportFamily: family, generatedAt, canonicalReferenceCount: refs.length, aiInvolvement: "No" },
  };
}

async function one(executor: typeof query, sql: string, params: unknown[]) { const result = await executor(sql, params); return result.rows[0] || null; }

export class RegistryReportAdapter implements ProductReportProjectionAdapter {
  productKey = "registry" as const;
  constructor(private dbQuery = query) {}
  supports(reportFamily: string) { return REGISTRY_FAMILIES.has(reportFamily); }

  async project(input: any, actor: any): Promise<AuthorizedReportProjection> {
    const family = required(input?.reportFamily || input?.report_family, "REPORT_FAMILY_REQUIRED");
    if (!this.supports(family)) throw new Error("REPORT_FAMILY_NOT_SUPPORTED");
    const s = scope(actor);
    const subject = required(input?.submissionId || input?.submission_id || input?.packageId || input?.package_id, "REGISTRY_SUBJECT_REQUIRED");
    const row = await one(this.dbQuery, `SELECT r.submission_id, r.organization_id, r.tenant_id, r.learner_id, r.project_id, r.package_id, r.package_version, r.package_hash, r.registry_provider, r.status, r.registry_reference, r.submitted_at, r.reviewed_at, r.resubmission_of, p.standard_version, p.schema_version, p.validation_status, pr.studio_owner_type, pr.studio_team_id FROM agent_registry_submissions r JOIN studio_agent_packages p ON p.package_id=r.package_id AND p.organization_id=r.organization_id AND p.tenant_id=r.tenant_id JOIN projects pr ON pr.project_id=r.project_id AND pr.organization_id=r.organization_id AND pr.tenant_id=r.tenant_id WHERE (r.submission_id=$1 OR r.package_id=$1) AND r.organization_id=$2 AND r.tenant_id=$3 ORDER BY r.created_at DESC LIMIT 1`, [subject, s.organizationId, s.tenantId]);
    if (!row) throw new Error("REGISTRY_RECORD_NOT_FOUND");
    const refs = [ref("REGISTRY_SUBMISSION", row.submission_id), ref("STUDIO_AGENT_PACKAGE", row.package_id), ref("STUDIO_PROJECT", row.project_id)];
    const rows = [
      ["Registry record", row.submission_id, "Autonomous Registry"],
      ["Subject package", row.package_id, "Studio Agent Package"],
      ["Registry status", row.status, "Autonomous Registry"],
      ["Registry reference", row.registry_reference || "Not recorded", "Autonomous Registry"],
      ["Package version", row.package_version, "Studio Agent Package"],
      ["Standard version", row.standard_version, "Source package metadata"],
      ["Validation status", row.validation_status, "Studio Agent Package"],
    ];
    const presentation = projectionPresentation("registry", family, row.submission_id, new Date().toISOString(), rows, refs, ["This report states Registry-owned registration facts only; it does not infer OAS conformance or Trust Bureau status."]);
    const reportPeriod = period(input);
    return createAuthorizedReportProjection({
      productKey: "registry", reportFamily: family, subject: row.submission_id,
      scope: { organizationId: s.organizationId, tenantId: s.tenantId, subjectReference: row.submission_id, jurisdiction: "Authorized-Scope" },
      reportingPeriod: reportPeriod, classification: "INTERNAL", generatedAt: new Date().toISOString(), canonicalReferences: refs,
      sourceVersions: [{ authority: "autonomous-registry", registryProvider: row.registry_provider, packageVersion: row.package_version, standardVersion: row.standard_version }],
      provenance: { adapter: "registry-reporting", sourceAuthority: "Autonomous Registry submission and package authorities" },
      payload: { reportType: family === "registry-record" ? "REGISTRY_RECORD" : "REGISTRATION_SUMMARY", reportVersion: 1, scope: { subjectReference: row.submission_id, jurisdiction: "Authorized-Scope", reportingPeriod: reportPeriod }, classification: "INTERNAL", generatedAt: new Date().toISOString(), canonicalReferences: refs, presentation: { ...presentation, reportingPeriod: reportPeriod }, registry: { family, record: { submissionId: row.submission_id, packageId: row.package_id, projectId: row.project_id, learnerId: row.learner_id, ownerType: row.studio_owner_type, teamId: row.studio_team_id, status: row.status, registryReference: row.registry_reference, submittedAt: row.submitted_at, reviewedAt: row.reviewed_at, packageVersion: row.package_version, packageHash: row.package_hash, standardVersion: row.standard_version, schemaVersion: row.schema_version } } },
    });
  }
}

export class SolutionsReportAdapter implements ProductReportProjectionAdapter {
  productKey = "solutions" as const;
  constructor(private dbQuery = query) {}
  supports(reportFamily: string) { return SOLUTIONS_FAMILIES.has(reportFamily); }

  async project(input: any, actor: any): Promise<AuthorizedReportProjection> {
    const family = required(input?.reportFamily || input?.report_family, "REPORT_FAMILY_REQUIRED");
    if (!this.supports(family)) throw new Error("REPORT_FAMILY_NOT_SUPPORTED");
    const s = scope(actor);
    const generatedAt = new Date().toISOString();
    const refs: any[] = [];
    const rows: any[] = [];
    let subject = s.organizationId;
    let payload: Record<string, unknown>;

    if (family === "client-operating" || family === "executive-business-review") {
      const services = await this.dbQuery("SELECT COUNT(*)::int AS count, COUNT(*) FILTER (WHERE e.status='ACTIVE')::int AS active FROM organization_service_entitlements e WHERE e.organization_id=$1", [s.organizationId]);
      const agreements = await this.dbQuery("SELECT COUNT(*)::int AS count, COUNT(*) FILTER (WHERE status='ACTIVE')::int AS active FROM service_agreements WHERE consumer_organization_id=$1", [s.organizationId]);
      const onboarding = await this.dbQuery("SELECT COUNT(*)::int AS count, COUNT(*) FILTER (WHERE status IN ('SUBMITTED','UNDER_REVIEW','APPROVED'))::int AS open FROM organization_onboarding_cases WHERE submitted_by_organization_id=$1 OR existing_organization_id=$1 OR activated_organization_id=$1", [s.organizationId]);
      rows.push(["Service entitlements", services.rows[0]?.count || 0, "Solutions Service Catalog"], ["Active entitlements", services.rows[0]?.active || 0, "Solutions Service Catalog"], ["Service agreements", agreements.rows[0]?.count || 0, "Solutions Service Agreements"], ["Active agreements", agreements.rows[0]?.active || 0, "Solutions Service Agreements"], ["Open onboarding cases", onboarding.rows[0]?.open || 0, "Organization Onboarding"]);
      refs.push(ref("SOLUTIONS_ORGANIZATION", s.organizationId));
      subject = s.organizationId;
      payload = { family, organization: { organizationId: s.organizationId, tenantId: s.tenantId }, summary: rows };
    } else if (family === "service-delivery") {
      const serviceKey = required(input?.serviceKey || input?.service_key, "SOLUTIONS_SERVICE_REQUIRED");
      const result = await this.dbQuery("SELECT e.entitlement_id, e.organization_id, e.status, e.effective_from, e.effective_until, e.reason, s.service_id, s.service_key, s.name, s.status AS service_status, s.provider_organization_id FROM organization_service_entitlements e JOIN service_catalog s ON s.service_id=e.service_id WHERE e.organization_id=$1 AND (s.service_key=$2 OR e.entitlement_id=$2) ORDER BY e.updated_at DESC LIMIT 1", [s.organizationId, serviceKey]);
      const row = result.rows[0];
      if (!row) throw new Error("SOLUTIONS_SERVICE_NOT_FOUND");
      subject = row.service_key;
      refs.push(ref("SOLUTIONS_SERVICE", row.service_id, row.service_key), ref("SOLUTIONS_ENTITLEMENT", row.entitlement_id));
      rows.push(["Service", row.name, "Solutions Service Catalog"], ["Entitlement status", row.status, "Solutions Entitlements"], ["Service status", row.service_status, "Solutions Service Catalog"], ["Provider organization", row.provider_organization_id, "Solutions Service Catalog"]);
      payload = { family, service: { serviceId: row.service_id, serviceKey: row.service_key, name: row.name, entitlementId: row.entitlement_id, status: row.status, effectiveFrom: row.effective_from, effectiveUntil: row.effective_until, providerOrganizationId: row.provider_organization_id } };
    } else if (family === "implementation") {
      const caseId = required(input?.onboardingCaseId || input?.onboarding_case_id, "SOLUTIONS_IMPLEMENTATION_REQUIRED");
      const row = await one(this.dbQuery, "SELECT onboarding_case_id, status, organization_name, organization_type, requested_relationship_type, existing_organization_id, activated_organization_id, submitted_at, reviewed_at, activated_at, decision_reason, metadata_version FROM organization_onboarding_cases WHERE onboarding_case_id=$1 AND (submitted_by_organization_id=$2 OR existing_organization_id=$2 OR activated_organization_id=$2)", [caseId, s.organizationId]);
      if (!row) throw new Error("SOLUTIONS_IMPLEMENTATION_NOT_FOUND");
      subject = row.onboarding_case_id;
      refs.push(ref("SOLUTIONS_ONBOARDING_CASE", row.onboarding_case_id));
      rows.push(["Implementation status", row.status, "Organization Onboarding"], ["Organization", row.organization_name, "Organization Onboarding"], ["Relationship", row.requested_relationship_type, "Organization Onboarding"], ["Decision reason", row.decision_reason || "Not recorded", "Organization Onboarding"]);
      payload = { family, implementation: { onboardingCaseId: row.onboarding_case_id, status: row.status, organizationName: row.organization_name, organizationType: row.organization_type, relationshipType: row.requested_relationship_type, existingOrganizationId: row.existing_organization_id, activatedOrganizationId: row.activated_organization_id, submittedAt: row.submitted_at, reviewedAt: row.reviewed_at, activatedAt: row.activated_at, decisionReason: row.decision_reason, metadataVersion: row.metadata_version } };
    } else {
      const agreementId = required(input?.agreementId || input?.agreement_id || input?.serviceKey || input?.service_key, "SOLUTIONS_ASSURANCE_SCOPE_REQUIRED");
      const row = await one(this.dbQuery, `SELECT a.agreement_id, a.provider_organization_id, a.consumer_organization_id, a.service_id, a.status, a.effective_from, a.effective_until, a.service_scope, a.support_level, a.agreement_reference, a.current_version, s.service_key, s.name AS service_name FROM service_agreements a JOIN service_catalog s ON s.service_id=a.service_id WHERE (a.agreement_id=$1 OR s.service_key=$1) AND (a.provider_organization_id=$2 OR a.consumer_organization_id=$2) ORDER BY a.updated_at DESC LIMIT 1`, [agreementId, s.organizationId]);
      if (!row) throw new Error("SOLUTIONS_AGREEMENT_NOT_FOUND");
      subject = row.agreement_id;
      refs.push(ref("SOLUTIONS_SERVICE_AGREEMENT", row.agreement_id), ref("SOLUTIONS_SERVICE", row.service_id, row.service_key));
      rows.push(["Agreement status", row.status, "Solutions Service Agreements"], ["Service", row.service_name, "Solutions Service Catalog"], ["Current version", row.current_version, "Solutions Service Agreements"], ["Support level", row.support_level || "Not recorded", "Solutions Service Agreements"]);
      payload = { family, agreement: { agreementId: row.agreement_id, providerOrganizationId: row.provider_organization_id, consumerOrganizationId: row.consumer_organization_id, serviceId: row.service_id, serviceKey: row.service_key, status: row.status, effectiveFrom: row.effective_from, effectiveUntil: row.effective_until, serviceScope: row.service_scope, supportLevel: row.support_level, agreementReference: row.agreement_reference, currentVersion: row.current_version } };
    }

    const reportPeriod = period(input);
    const presentation = projectionPresentation("solutions", family, subject, generatedAt, rows, refs, ["Only canonical Solutions service, entitlement, agreement, and onboarding records are included; no Foundation or unrestricted BOS data is queried."]);
    return createAuthorizedReportProjection({ productKey: "solutions", reportFamily: family, subject, scope: { organizationId: s.organizationId, tenantId: s.tenantId, subjectReference: subject, jurisdiction: "Authorized-Scope" }, reportingPeriod: reportPeriod, classification: "INTERNAL", generatedAt, canonicalReferences: refs, sourceVersions: [{ authority: "solutions", generatedAt }], provenance: { adapter: "solutions-reporting", sourceAuthority: "Solutions service catalog, entitlement, agreement, and onboarding authorities" }, payload: { reportType: `SOLUTIONS_${family.toUpperCase().replaceAll("-", "_")}`, reportVersion: 1, scope: { subjectReference: subject, jurisdiction: "Authorized-Scope", reportingPeriod: reportPeriod }, classification: "INTERNAL", generatedAt, canonicalReferences: refs, presentation: { ...presentation, reportingPeriod: reportPeriod }, solutions: payload } });
  }
}

export const registryReportAdapter = new RegistryReportAdapter();
export const solutionsReportAdapter = new SolutionsReportAdapter();
export const registrySolutionsAdapters = [registryReportAdapter, solutionsReportAdapter];
