import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CommercialProductRegistryService,
  COMMERCIAL_PRODUCT_REGISTRY_SCOPE,
} from "../src/domain/commercial-product-registry/service/commercial-product-registry-service.ts";
import { GOVERNANCE_CAPABILITIES } from "../src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts";

const actor = {
  user_id: "user_registry_service",
  active_organization_id: "org_registry_service",
  capabilities: GOVERNANCE_CAPABILITIES,
};

function product(overrides = {}) {
  return {
    commercialProductId: `cp_service_${Math.random().toString(36).slice(2)}`,
    canonicalName: "Service Registry Product",
    displayName: "Service Registry Product",
    slug: `service-registry-product-${Math.random().toString(36).slice(2)}`,
    commercialFamily: "DATA_CENTER",
    productType: "SERVICE",
    sellingEntity: "SHS",
    deliveryEntity: "PARTNER",
    ...overrides,
  };
}

const sourceAuthority = {
  sourceAuthorityType: "SERVICE_CATALOG",
  sourceDomain: "service-catalog",
  sourceRecordId: "svc_registry",
  sourceStatus: "FOUND",
  sourceProvenance: ["service test"],
};

class MemoryRepo {
  products = new Map<string, any>();
  sources: any[] = [];
  buyers: any[] = [];
  forms: any[] = [];
  gates: any[] = [];
  relationships: any[] = [];
  funding: any[] = [];
  entitlements: any[] = [];
  regulated = new Map<string, any>();
  implementation = new Map<string, any>();
  renewal = new Map<string, any>();
  social = new Map<string, any>();
  governance = new Map<string, any>();
  unavailable = false;

  async createProduct(input: any) {
    const row = {
      version: 1,
      status: "ACTIVE",
      lifecycle_state: "DISCOVERED",
      readiness: "UNKNOWN",
      sellability: "NEEDS_REVIEW",
      pricing_status: "NOT_DEFINED",
      margin_status: "NOT_DEFINED",
      commission_eligible_status: "UNKNOWN",
      renewal_model: "UNKNOWN",
      ...input,
    };
    this.products.set(row.commercial_product_id, row);
    return row;
  }
  async getProductById(id: string) { return this.products.get(id) || null; }
  async getProductBySlug(slug: string) { return [...this.products.values()].find((row) => row.slug === slug) || null; }
  async listProducts() {
    if (this.unavailable) throw Object.assign(new Error("offline"), { code: "ECONNREFUSED" });
    return [...this.products.values()];
  }
  async updateDescriptiveMetadata(id: string, input: any) { const row = this.products.get(id); Object.assign(row, input); return row; }
  async updateLifecycle(id: string, lifecycleState: string) { const row = this.products.get(id); row.lifecycle_state = lifecycleState; return row; }
  async updateReadiness(id: string, readiness: string, reason: string, authority: string, evidence: any[]) { const row = this.products.get(id); Object.assign(row, { readiness, readiness_reason: reason, readiness_authority: authority, readiness_evidence_references: evidence }); return row; }
  async updateSellability(id: string, sellability: string, reason: string, authority: string, blockers: string[], restrictions: string[]) { const row = this.products.get(id); Object.assign(row, { sellability, sellability_reason: reason, sellability_authority: authority, sellability_blockers: blockers, sellability_restrictions: restrictions }); return row; }
  async listSourceAuthorities(id: string) { return this.sources.filter((row) => row.commercial_product_id === id); }
  async addSourceAuthority(input: any) { this.sources.push(input); return input; }
  async replaceSourceAuthority(input: any) { const i = this.sources.findIndex((row) => row.commercial_product_id === input.commercial_product_id && row.source_record_id === input.source_record_id); if (i >= 0) this.sources[i] = { ...this.sources[i], ...input }; else this.sources.push(input); return this.sources[i >= 0 ? i : this.sources.length - 1]; }
  async deactivateSourceAuthority(id: string, status: string) { const row = this.sources.find((item) => item.source_reference_id === id); if (row) row.source_status = status; return row || null; }
  async listBuyers(id: string) { return this.buyers.filter((row) => row.commercial_product_id === id); }
  async addBuyerCompatibility(input: any) { this.buyers.push(input); return input; }
  async removeBuyerCompatibility(id: string, buyerType: string) { const i = this.buyers.findIndex((row) => row.commercial_product_id === id && row.buyer_type === buyerType); return i >= 0 ? this.buyers.splice(i, 1)[0] : null; }
  async listCommercialForms(id: string) { return this.forms.filter((row) => row.commercial_product_id === id); }
  async addCommercialForm(input: any) { this.forms.push(input); return input; }
  async removeCommercialForm(id: string, form: string) { const i = this.forms.findIndex((row) => row.commercial_product_id === id && row.commercial_form === form); return i >= 0 ? this.forms.splice(i, 1)[0] : null; }
  async listGates(id: string) { return this.gates.filter((row) => row.commercial_product_id === id); }
  async addReviewGate(input: any) { const i = this.gates.findIndex((row) => row.commercial_product_id === input.commercial_product_id && row.gate_type === input.gate_type); if (i >= 0) this.gates[i] = input; else this.gates.push(input); return input; }
  async listRelationships(id: string) { return this.relationships.filter((row) => row.source_product_id === id || row.target_product_id === id); }
  async addProductRelationship(input: any) { this.relationships.push(input); return input; }
  async deactivateProductRelationship(id: string) { const row = this.relationships.find((item) => item.relationship_id === id); if (row) row.status = "RETIRED"; return row || null; }
  async listFundingRelationships(id: string) { return this.funding.filter((row) => row.commercial_product_id === id); }
  async addFundingRelationship(input: any) { this.funding.push(input); return input; }
  async listEntitlements(id: string) { return this.entitlements.filter((row) => row.commercial_product_id === id); }
  async addEntitlementReference(input: any) { this.entitlements.push(input); return input; }
  async removeEntitlementReference(id: string, entitlementId: string, requirement: string) { const i = this.entitlements.findIndex((row) => row.commercial_product_id === id && row.entitlement_id === entitlementId && row.entitlement_requirement === requirement); return i >= 0 ? this.entitlements.splice(i, 1)[0] : null; }
  async getRegulatedProgramMetadata(id: string) { return this.regulated.get(id) || null; }
  async upsertRegulatedProgramMetadata(input: any) { this.regulated.set(input.commercial_product_id, input); return input; }
  async getImplementationSupport(id: string) { return this.implementation.get(id) || null; }
  async upsertImplementationSupport(input: any) { this.implementation.set(input.commercial_product_id, input); return input; }
  async getRenewalExpansion(id: string) { return this.renewal.get(id) || null; }
  async upsertRenewalExpansion(input: any) { this.renewal.set(input.commercial_product_id, input); return input; }
  async getSocialSelling(id: string) { return this.social.get(id) || null; }
  async upsertSocialSelling(input: any) { this.social.set(input.commercial_product_id, input); return input; }
  async getGovernanceState(id: string) { return this.governance.get(id) || null; }
  async upsertGovernanceState(input: any) { const row = this.products.get(input.commercial_product_id); Object.assign(row, { pricing_status: input.pricing_status || row.pricing_status, margin_status: input.margin_status || row.margin_status, commission_eligible_status: input.commission_eligible_status || row.commission_eligible_status }); this.governance.set(input.commercial_product_id, input); return input; }
}

function harness(repo = new MemoryRepo()) {
  const auditEvents: any[] = [];
  const service = new CommercialProductRegistryService(repo as any, async (event: any) => { auditEvents.push(event); return event; }, async (fn: any) => fn({}));
  return { repo, service, auditEvents };
}

test("3C create product succeeds and audits material mutation", async () => {
  const { service, auditEvents } = harness();
  const created = await service.createProduct(product(), actor);
  assert.equal(created.commercial_family, "DATA_CENTER");
  assert.equal(auditEvents.at(-1).action_type, "commercial_product_registry.product_created");
});

test("3C invalid product input is rejected", async () => {
  const { service } = harness();
  await assert.rejects(() => service.createProduct(product({ commercialFamily: "SALES_FAKE" }), actor), /FAMILY|ENUM/);
});

test("3C generic descriptive update cannot change lifecycle readiness or sellability", async () => {
  const { service } = harness();
  const created = await service.createProduct(product(), actor);
  await assert.rejects(() => service.updateDescriptiveMetadata(created.commercial_product_id, { lifecycleState: "ACTIVE" }, actor), /GOVERNED_STATE_CHANGE/);
  await assert.rejects(() => service.updateDescriptiveMetadata(created.commercial_product_id, { readiness: "GREEN" }, actor), /GOVERNED_STATE_CHANGE/);
  await assert.rejects(() => service.updateDescriptiveMetadata(created.commercial_product_id, { sellability: "SELL_NOW" }, actor), /GOVERNED_STATE_CHANGE/);
});

test("3C valid lifecycle transition succeeds and invalid transition is rejected", async () => {
  const { service } = harness();
  const created = await service.createProduct(product(), actor);
  assert.equal((await service.transitionLifecycle(created.commercial_product_id, "DEFINED", { reason: "defined" }, actor)).lifecycle_state, "DEFINED");
  await assert.rejects(() => service.transitionLifecycle(created.commercial_product_id, "ACTIVE", { reason: "skip" }, actor), /TRANSITION_REJECTED/);
});

test("3C readiness review requires provenance and sellability preserves blocker and reason", async () => {
  const { service, repo } = harness();
  const created = await service.createProduct(product(), actor);
  await assert.rejects(() => service.reviewReadiness(created.commercial_product_id, { readiness: "GREEN", reason: "ready" }, actor), /evaluatedByAuthority/);
  await service.reviewReadiness(created.commercial_product_id, { readiness: "YELLOW", reason: "pilot", evaluatedByAuthority: "ops", evidenceReferences: [sourceAuthority] }, actor);
  assert.equal(repo.products.get(created.commercial_product_id).readiness_authority, "ops");
  await service.reviewSellability(created.commercial_product_id, { sellability: "PILOT", reason: "pilot only", blockers: ["pricing"], restrictions: ["named pilots"], sourceAuthority }, actor);
  assert.deepEqual(repo.products.get(created.commercial_product_id).sellability_blockers, ["pricing"]);
  assert.equal(repo.products.get(created.commercial_product_id).sellability_reason, "pilot only");
});

test("3C approved review gate requires credible authority or reference", async () => {
  const { service } = harness();
  const created = await service.createProduct(product(), actor);
  await assert.rejects(() => service.manageReviewGate(created.commercial_product_id, { gateType: "LEGAL", status: "APPROVED" }, actor), /APPROVAL_AUTHORITY/);
  assert.equal((await service.manageReviewGate(created.commercial_product_id, { gateType: "LEGAL", status: "APPROVED", authority: "legal" }, actor)).status, "APPROVED");
});

test("3C funding compatibility cannot become eligibility and source authority is validated", async () => {
  const { service } = harness();
  const created = await service.createProduct(product(), actor);
  await assert.rejects(() => service.manageFundingRelationship(created.commercial_product_id, { status: "VERIFIED", category: "GRANT", eligibilityStatus: "ELIGIBLE" }, actor), /FUNDING_ELIGIBILITY/);
  await assert.rejects(() => service.addSourceAuthority(created.commercial_product_id, { sourceAuthorityType: "SALES", sourceRecordId: "x", sourceStatus: "FOUND", sourceProvenance: ["x"] }, actor), /ENUM_INVALID/);
  assert.equal((await service.manageFundingRelationship(created.commercial_product_id, { status: "POTENTIAL", category: "GRANT", limitations: ["compatibility only"] }, actor)).funding_relationship_status, "POTENTIAL");
});

test("3C duplicate buyer and form mappings are rejected", async () => {
  const { service } = harness();
  const created = await service.createProduct(product(), actor);
  await service.addBuyerCompatibility(created.commercial_product_id, "EMPLOYER", {}, actor);
  await assert.rejects(() => service.addBuyerCompatibility(created.commercial_product_id, "EMPLOYER", {}, actor), /BUYER_COMPATIBILITY_DUPLICATE/);
  await service.addCommercialForm(created.commercial_product_id, "SUBSCRIPTION", {}, actor);
  await assert.rejects(() => service.addCommercialForm(created.commercial_product_id, "SUBSCRIPTION", {}, actor), /COMMERCIAL_FORM_DUPLICATE/);
});

test("3C product relationships reject invalid self-relation and duplicate active relation", async () => {
  const { service } = harness();
  const a = await service.createProduct(product({ commercialProductId: "cp_rel_a", slug: "rel-a" }), actor);
  const b = await service.createProduct(product({ commercialProductId: "cp_rel_b", slug: "rel-b" }), actor);
  await assert.rejects(() => service.addProductRelationship({ sourceProductId: a.commercial_product_id, targetProductId: a.commercial_product_id, relationshipType: "ADD_ON", direction: "SOURCE_TO_TARGET", status: "ACTIVE" }, actor), /SELF_RELATION/);
  await service.addProductRelationship({ sourceProductId: a.commercial_product_id, targetProductId: b.commercial_product_id, relationshipType: "ADD_ON", direction: "SOURCE_TO_TARGET", status: "ACTIVE" }, actor);
  await assert.rejects(() => service.addProductRelationship({ sourceProductId: a.commercial_product_id, targetProductId: b.commercial_product_id, relationshipType: "ADD_ON", direction: "SOURCE_TO_TARGET", status: "ACTIVE" }, actor), /DUPLICATE_ACTIVE/);
});

test("3C regulated authority metadata is preserved without inferring approval", async () => {
  const { service, repo } = harness();
  const created = await service.createProduct(product(), actor);
  await service.updateRegulatedProgramMetadata(created.commercial_product_id, { programTypes: ["HEALTHCARE"], regulatoryAuthority: "state board", externalTrainingAuthorityRequired: "PENDING", scopeLimitations: ["no licensure claim"] }, actor);
  assert.equal(repo.regulated.get(created.commercial_product_id).regulatory_authority, "state board");
  assert.equal(repo.regulated.get(created.commercial_product_id).external_training_authority_required, "PENDING");
});

test("3C implementation support renewal social metadata are governed", async () => {
  const { service, repo } = harness();
  const created = await service.createProduct(product(), actor);
  await service.updateImplementationSupportMetadata(created.commercial_product_id, { implementationRequired: "PENDING", supportRequired: "APPROVED", slaStatus: "UNKNOWN" }, actor);
  await service.updateRenewalExpansionMetadata(created.commercial_product_id, { renewalModel: "ANNUAL", expansionPaths: ["cp_next"] }, actor);
  await service.updateSocialSellingMetadata(created.commercial_product_id, { approvedPublicMarketing: "PENDING", approvedSocialSharing: "BLOCKED", salesLanguageStatus: "RESTRICTED" }, actor);
  assert.equal(repo.implementation.get(created.commercial_product_id).implementation_required, "PENDING");
  assert.deepEqual(repo.renewal.get(created.commercial_product_id).expansion_paths, ["cp_next"]);
  assert.equal(repo.social.get(created.commercial_product_id).sales_language_status, "RESTRICTED");
});

test("3C pricing margin commission remain metadata only and recruiting is not revenue", async () => {
  const { service, repo } = harness();
  const created = await service.createProduct(product(), actor);
  await assert.rejects(() => service.updateGovernanceState(created.commercial_product_id, { pricingStatus: "APPROVED", priceAmount: 100 }, actor), /FINANCIAL_CALCULATION/);
  await assert.rejects(() => service.updateGovernanceState(created.commercial_product_id, { commissionEligibleStatus: "APPROVED", commissionRate: 0.2 }, actor), /COMMISSION_CALCULATION|FINANCIAL_CALCULATION/);
  await assert.rejects(() => service.updateGovernanceState(created.commercial_product_id, { revenueClassifications: ["RECRUITING"] }, actor), /RECRUITING_REVENUE/);
  await service.updateGovernanceState(created.commercial_product_id, { pricingStatus: "APPROVED", pricingModel: "reference only", marginStatus: "UNDER_REVIEW", commissionEligibleStatus: "UNDER_REVIEW", revenueClassifications: ["LICENSE"] }, actor);
  assert.equal(repo.products.get(created.commercial_product_id).pricing_status, "APPROVED");
  assert.equal(repo.products.get(created.commercial_product_id).margin_status, "UNDER_REVIEW");
  assert.equal(repo.products.get(created.commercial_product_id).commission_eligible_status, "UNDER_REVIEW");
});

test("3C Sales read model is truthful and empty registry returns CONNECTED_EMPTY", async () => {
  const { service } = harness();
  assert.equal((await service.projectSalesProductReadModel(actor)).status.status, "CONNECTED_EMPTY");
  const created = await service.createProduct(product({ sellability: "SELL_NOW", readiness: "GREEN" }), actor);
  await service.addBuyerCompatibility(created.commercial_product_id, "EMPLOYER", {}, actor);
  await service.addCommercialForm(created.commercial_product_id, "SUBSCRIPTION", {}, actor);
  const projected = await service.projectSalesProductReadModel(actor);
  assert.equal(projected.status.status, "CONNECTED");
  assert.equal(projected.summary.sellNow, 1);
  assert.equal(projected.distributions.family.find((row: any) => row.key === "DATA_CENTER").count, 1);
  assert.equal(projected.distributions.readiness.find((row: any) => row.key === "GREEN").count, 1);
  assert.equal(projected.distributions.sellability.find((row: any) => row.key === "SELL_NOW").count, 1);
});

test("3C unavailable repository returns NOT_CONNECTED through read adapter boundary", async () => {
  const repo = new MemoryRepo();
  repo.unavailable = true;
  const { service } = harness(repo);
  assert.equal((await service.projectSalesProductReadModel(actor)).status.status, "NOT_CONNECTED");
});

test("3C entitlement references remain references and GLOBAL_CANONICAL scope is explicit", async () => {
  const { service } = harness();
  const created = await service.createProduct(product(), actor);
  const entitlement = await service.addEntitlementReference(created.commercial_product_id, { entitlementId: "svc:studio", requirement: "REQUIRED", entitlementAuthority: "ENTITLEMENTS" }, actor);
  assert.equal(entitlement.entitlement_authority, "ENTITLEMENTS");
  assert.equal(COMMERCIAL_PRODUCT_REGISTRY_SCOPE.identityScope, "GLOBAL_CANONICAL");
});

test("3C no 32-candidate runtime seed exists in service source", () => {
  const source = readFileSync(new URL("../src/domain/commercial-product-registry/service/commercial-product-registry-service.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /cc-00[1-9]|Data Center & AI Infrastructure Curriculum Pathway|PILOT 10|SELL_NOW 0/);
});
