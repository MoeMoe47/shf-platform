import test from "node:test";
import assert from "node:assert/strict";
import { ReportTemplateRegistry } from "../src/domain/reporting/report-template-registry.js";
import { RegistryReportAdapter, SolutionsReportAdapter } from "../src/domain/reporting/registry-solutions-report-adapter.js";

const actor = { user_id: "user_u5", active_organization_id: "org_u5", tenant_id: "tenant:org_u5" };

function registryQuery(sql: string) {
  if (sql.includes("agent_registry_submissions")) return Promise.resolve({ rows: [{ submission_id: "submission_u5", organization_id: "org_u5", tenant_id: "tenant:org_u5", learner_id: "learner_u5", project_id: "project_u5", package_id: "package_u5", package_version: 2, package_hash: "a".repeat(64), registry_provider: "local_test_registry", status: "ACCEPTED", registry_reference: "registry-ref-u5", submitted_at: "2026-09-07T00:00:00Z", reviewed_at: "2026-09-07T00:01:00Z", standard_version: "OAS-1", schema_version: "1", validation_status: "VALID", studio_owner_type: "INDIVIDUAL", studio_team_id: null }] });
  throw new Error(`unexpected registry query: ${sql}`);
}

function solutionsQuery(sql: string, params: unknown[] = []) {
  if (sql.includes("organization_service_entitlements e") && sql.includes("COUNT")) return Promise.resolve({ rows: [{ count: 3, active: 2 }] });
  if (sql.includes("FROM service_agreements WHERE consumer_organization_id")) return Promise.resolve({ rows: [{ count: 2, active: 1 }] });
  if (sql.includes("organization_onboarding_cases WHERE")) return Promise.resolve({ rows: [{ count: 1, open: 1 }] });
  if (sql.includes("JOIN service_catalog s ON s.service_id=e.service_id")) return Promise.resolve({ rows: params[1] === "missing" ? [] : [{ entitlement_id: "ent_u5", organization_id: "org_u5", status: "ACTIVE", effective_from: "2026-09-01", effective_until: null, reason: null, service_id: "svc_reporting", service_key: "reporting", name: "Reporting", service_status: "ACTIVE", provider_organization_id: "org_shf_001" }] });
  if (sql.includes("organization_onboarding_cases WHERE onboarding_case_id")) return Promise.resolve({ rows: [{ onboarding_case_id: "onboarding_u5", status: "ACTIVATED", organization_name: "U5 Client", organization_type: "PARTNER", requested_relationship_type: "NETWORK_MEMBER_OF", existing_organization_id: "org_u5", activated_organization_id: "org_u5", submitted_at: "2026-09-01", reviewed_at: "2026-09-02", activated_at: "2026-09-03", decision_reason: "approved", metadata_version: 1 }] });
  if (sql.includes("FROM service_agreements a JOIN service_catalog")) return Promise.resolve({ rows: [{ agreement_id: "agreement_u5", provider_organization_id: "org_shf_001", consumer_organization_id: "org_u5", service_id: "svc_reporting", status: "ACTIVE", effective_from: "2026-09-01", effective_until: null, service_scope: "governed reporting", support_level: "STANDARD", agreement_reference: "agreement-ref-u5", current_version: 1, service_key: "reporting", service_name: "Reporting" }] });
  throw new Error(`unexpected solutions query: ${sql}`);
}

test("U5 registers only supported Registry and Solutions families", () => {
  const registry = new ReportTemplateRegistry();
  for (const [product, family] of [["registry", "registry-record"], ["registry", "registration-summary"], ["solutions", "client-operating"], ["solutions", "service-delivery"], ["solutions", "implementation"], ["solutions", "executive-business-review"], ["solutions", "assurance-control"]] as const) {
    assert.equal(registry.resolve(product, family).productKey, product);
  }
  assert.throws(() => registry.resolve("registry", "status-history"), /REPORT_TEMPLATE_NOT_FOUND/);
  assert.throws(() => registry.resolve("solutions", "registry-record"), /REPORT_TEMPLATE_NOT_FOUND/);
});

test("Registry projection preserves Registry authority and does not infer OAS or Trust Bureau state", async () => {
  const projection = await new RegistryReportAdapter(registryQuery).project({ reportFamily: "registry-record", submissionId: "submission_u5" }, actor);
  assert.equal(projection.productKey, "registry");
  assert.equal(projection.classification, "INTERNAL");
  assert.equal((projection.payload as any).registry.record.status, "ACCEPTED");
  assert.match(String((projection.payload as any).presentation.sections[0].notes[0]), /does not infer OAS conformance or Trust Bureau/);
  assert.deepEqual(projection.canonicalReferences.map((item: any) => item.type), ["REGISTRY_SUBMISSION", "STUDIO_AGENT_PACKAGE", "STUDIO_PROJECT"]);
});

test("Solutions projections are scoped, deterministic, and read-only", async () => {
  const adapter = new SolutionsReportAdapter(solutionsQuery);
  const operating = await adapter.project({ reportFamily: "client-operating" }, actor);
  const service = await adapter.project({ reportFamily: "service-delivery", serviceKey: "reporting" }, actor);
  const implementation = await adapter.project({ reportFamily: "implementation", onboardingCaseId: "onboarding_u5" }, actor);
  const assurance = await adapter.project({ reportFamily: "assurance-control", agreementId: "agreement_u5" }, actor);
  for (const projection of [operating, service, implementation, assurance]) {
    assert.equal(projection.productKey, "solutions");
    assert.equal(projection.scope.organizationId, "org_u5");
    assert.equal(projection.scope.tenantId, "tenant:org_u5");
    assert.equal(projection.classification, "INTERNAL");
    assert.ok(projection.canonicalReferences.length > 0);
    assert.equal(JSON.stringify(projection).includes("password"), false);
  }
  await assert.rejects(() => adapter.project({ reportFamily: "service-delivery", serviceKey: "missing" }, actor), /SOLUTIONS_SERVICE_NOT_FOUND/);
});

test("Legal and cross-product families fail closed until canonical authorities and ecosystem identity exist", () => {
  const registry = new ReportTemplateRegistry();
  assert.throws(() => registry.resolve("solutions", "legal-readiness"), /REPORT_TEMPLATE_NOT_FOUND/);
  assert.throws(() => registry.resolve("solutions", "cross-product-assurance"), /REPORT_TEMPLATE_NOT_FOUND/);
});
