import assert from "node:assert/strict";
import test from "node:test";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { FundingLineageService } from "../src/domain/government-assurance/service/funding-lineage-service.js";

const scope = { organizationId: "org_funding", tenantId: "tenant:org_funding", userId: "user_funding" };
const user = { ...scope, permissions: [SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_FUNDING_VIEW, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_FUNDING_LINK, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_FINANCIAL_LINEAGE_VIEW, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_PROVIDER_VIEW, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_PROGRAM_VIEW] };
class MemoryRepo {
  refs: any[] = []; edges: any[] = [];
  async createReference(input: any) { this.refs.push(input); return input; }
  async listReferences() { return this.refs; }
  async createEdge(input: any) { this.edges.push(input); return input; }
  async listEdges(_scope: any, filter: any) { return this.edges.filter((e) => !filter.reference || e.from_reference === filter.reference || e.to_reference === filter.reference); }
  async createProviderProjection(input: any) { return input; }
  async createProgramProjection(input: any) { return input; }
}
const reference = (repo: MemoryRepo, recordType: string, id: string, amount: number, provider = "provider-a") => repo.refs.push({ funding_reference_id: `${recordType}-${id}`, canonical_record_type: recordType, canonical_record_id: id, amount, provider_organization_reference: provider, program_reference: "program-1", provenance_reference: `prov-${id}`, source_system_id: "erp", source_record_id: id });

test("funding references and typed lineage preserve existing financial ownership", async () => {
  const repo = new MemoryRepo(); const sut = new FundingLineageService(repo as any);
  const award = await sut.createReference(user, { canonicalRecordType: "AWARD", canonicalRecordId: "award-1", amount: 1000000, providerOrganizationReference: "provider-a", programReference: "program-1", provenanceReference: "prov-award", sourceSystemId: "grant", sourceRecordId: "award-1" });
  assert.equal(award.canonical_record_id, "award-1");
  const edge = await sut.link(user, { fromType: "AWARD", fromReference: "award-1", toType: "PROGRAM", toReference: "program-1", relationshipType: "AWARDS", provenanceReference: "prov-edge", sourceSystemId: "grant", sourceRecordId: "edge-1" });
  assert.equal(edge.relationship_type, "AWARDS"); assert.equal(repo.refs.length, 1); assert.equal(repo.edges.length, 1);
});

test("allocation requires methodology and duplicate source links fail closed", async () => {
  const repo = new MemoryRepo(); const sut = new FundingLineageService(repo as any);
  await assert.rejects(() => sut.link(user, { fromType: "EXPENDITURE", fromReference: "exp-1", toType: "SERVICE", toReference: "service-1", relationshipType: "ALLOCATED", provenanceReference: "p", sourceRecordId: "same" }), /GPA_ALLOCATION_METHOD_MISSING/);
  await sut.link(user, { fromType: "EXPENDITURE", fromReference: "exp-1", toType: "SERVICE", toReference: "service-1", relationshipType: "DIRECT", provenanceReference: "p", sourceRecordId: "same" });
  await assert.rejects(() => sut.link(user, { fromType: "EXPENDITURE", fromReference: "exp-1", toType: "SERVICE", toReference: "service-1", relationshipType: "DIRECT", provenanceReference: "p", sourceRecordId: "same" }), /GPA_DUPLICATE_FUNDING_SOURCE_RECORD/);
});

test("provider and program summaries are scoped projections, not new authorities", async () => {
  const repo = new MemoryRepo(); reference(repo, "AWARD", "a", 1000000); reference(repo, "OBLIGATION", "o", 600000); reference(repo, "PAYMENT", "p", 100000); const sut = new FundingLineageService(repo as any);
  const provider = await sut.providerSummary(user, "provider-a"); const program = await sut.programSummary(user, "program-1");
  assert.equal(provider.summary.totalAwarded, 1000000); assert.equal(provider.summary.totalObligated, 600000); assert.equal(provider.summary.totalPaidOrReported, 100000); assert.equal(program.summary.references, 3);
});

test("financial lineage readiness exposes missing service/outcome links", async () => {
  const sut = new FundingLineageService(new MemoryRepo() as any); const result = await sut.readiness(user, { reference: "award-1", requiresOutcome: true });
  assert.equal(result.ready, false); assert.ok(result.blockers.includes("GPA_SERVICE_LINK_MISSING")); assert.ok(result.blockers.includes("GPA_OUTCOME_LINK_MISSING"));
});

test("cross-tenant context fails before lineage access", async () => {
  const sut = new FundingLineageService(new MemoryRepo() as any); await assert.rejects(() => sut.lineage({ ...user, tenantId: "tenant:other" }, "x"), /GOVERNMENT_ASSURANCE_ORG_CONTEXT_REQUIRED/);
});
