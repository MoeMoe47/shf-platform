import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildCommercialProductOnboardingManifest, runOnboarding, validateOnboardingCandidate } from "../src/domain/commercial-product-registry/onboarding/commercial-product-onboarding.js";
import { COMMERCIAL_FAMILIES, READINESS_STATES, SELLABILITY_STATUSES } from "../src/domain/commercial-product-registry/model/commercial-product-registry-contract.js";

const root = path.resolve(import.meta.dirname, "../../..");
const readJson = async (relativePath: string) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));

async function manifest() {
  const [inventory, design] = await Promise.all([
    readJson("docs/sales/commercial-catalog-audit/commercial-candidate-inventory.json"),
    readJson("docs/sales/commercial-product-registry-design/initial-32-candidate-design-mapping.json"),
  ]);
  return buildCommercialProductOnboardingManifest(inventory, design);
}

test("manifest reconciles 32 audited candidates and locked family/readiness/sellability counts", async () => {
  const result = await manifest();
  assert.equal(result.candidates.length, 32);
  assert.deepEqual(Object.fromEntries(COMMERCIAL_FAMILIES.map((family) => [family, result.candidates.filter((c: any) => c.family === family).length])), {
    CORE_EDUCATION: 5, CAREER_WORKFORCE: 2, DATA_CENTER: 2, HEALTHCARE_WORKFORCE: 1, FIRE_PUBLIC_SAFETY: 1,
    INFRASTRUCTURE_WORKFORCE: 1, LOGISTICS_SUPPLY_CHAIN: 1, APPRENTICESHIP_WBL: 2, AVIATION: 1, CREATOR_MEDIA_SHNN: 1,
    LEARNING_GAMING: 2, METAVERSE: 3, CIVIC_FINANCIAL_CAPABILITY: 2, INSTITUTIONAL_TECH_SHS: 5, ASSURANCE_VERIFICATION_REPORTING: 3,
  });
  assert.deepEqual(Object.fromEntries(SELLABILITY_STATUSES.map((status) => [status, result.candidates.filter((c: any) => c.sellability === status).length])), {
    SELL_NOW: 0, PILOT: 10, DEVELOP: 12, NOT_SELLABLE: 4, NEEDS_REVIEW: 6,
  });
  assert.deepEqual(Object.fromEntries(READINESS_STATES.map((state) => [state, result.candidates.filter((c: any) => c.readiness === state).length])), {
    RED: 4, YELLOW: 10, GREEN: 0, BLUE: 0, UNKNOWN: 18,
  });
});

test("candidate identities are deterministic and contract-valid; raw unsupported labels stay explicit", async () => {
  const result = await manifest();
  const productIds = new Set<string>();
  for (const candidate of result.candidates) {
    assert.match(candidate.candidate_id, /^cc-\d{3}$/);
    assert.match(candidate.proposed_commercial_product_id, /^cp_[a-z0-9_]+$/);
    assert.ok(!productIds.has(candidate.proposed_commercial_product_id));
    productIds.add(candidate.proposed_commercial_product_id);
    const errors = validateOnboardingCandidate(candidate);
    if (candidate.onboarding_disposition === "SOURCE_AUTHORITY_MISSING") assert.ok(errors.includes("SOURCE_AUTHORITY_REQUIRED"));
    else assert.deepEqual(errors, []);
    assert.ok(Array.isArray(candidate.unmapped_commercial_forms));
    assert.ok(Array.isArray(candidate.source_audit_refs));
  }
});

test("missing source authority candidates are not registered and report blockers", async () => {
  const result = await manifest();
  const missing = result.candidates.filter((c: any) => c.onboarding_disposition === "SOURCE_AUTHORITY_MISSING");
  assert.ok(missing.length >= 6);
  assert.ok(missing.every((c: any) => c.source_authorities.length === 0 && c.review_requirements.includes("SOURCE_AUTHORITY_MISSING")));
});

test("candidate state is never upgraded and governed boundaries stay metadata-only", async () => {
  const result = await manifest();
  const audit = await readJson("docs/sales/commercial-catalog-audit/commercial-candidate-inventory.json");
  const byId = new Map(audit.candidates.map((c: any) => [c.id, c]));
  for (const candidate of result.candidates) {
    const source: any = byId.get(candidate.candidate_id);
    assert.equal(candidate.readiness, source.readiness);
    assert.equal(candidate.sellability, source.sellability_status);
    assert.equal(candidate.version, 1);
    assert.equal(candidate.pricing_metadata.pricing_status, "NOT_DEFINED");
    assert.equal(candidate.pricing_metadata.price_amount, undefined);
    assert.equal(candidate.commission_metadata.commission_rate, undefined);
    assert.equal(candidate.commission_metadata.leadership_override_amount, undefined);
    assert.ok(!JSON.stringify(candidate.funding_relationships).includes("ELIGIBLE"));
    assert.ok(!JSON.stringify(candidate).includes("BOOKED_REVENUE"));
  }
  assert.equal(result.candidates.find((c: any) => c.candidate_id === "cc-001").sellability, "PILOT");
  assert.equal(result.candidates.find((c: any) => c.candidate_id === "cc-003").readiness, "UNKNOWN");
  assert.equal(result.candidates.find((c: any) => c.candidate_id === "cc-012").sellability, "NOT_SELLABLE");
});

test("Design-2 PILOT_READY candidates with unapproved gates are registered only in REVIEW", async () => {
  const result = await manifest();
  const pilot = result.candidates.filter((candidate: any) => candidate.sellability === "PILOT" && candidate.registration_allowed);
  assert.ok(pilot.length > 0);
  assert.ok(pilot.every((candidate: any) => candidate.lifecycle === "REVIEW" && candidate.onboarding_disposition === "REVIEW_REQUIRED"));
  assert.ok(pilot.every((candidate: any) => candidate.review_gates.every((gate: any) => gate.status !== "APPROVED" || gate.reference)));
});

test("unsupported canonical enums, identity gaps, duplicates, funding eligibility and financial fields are rejected", async () => {
  const candidate = (await manifest()).candidates.find((c: any) => c.registration_allowed);
  assert.ok(candidate);
  for (const [field, value] of [["family", "ALIEN_FAMILY"], ["product_type", "TRAINING"], ["lifecycle", "PILOT_ACTIVE_UNKNOWN"], ["readiness", "GREENISH"], ["sellability", "SELL_EVERYTHING"]]) {
    assert.ok(validateOnboardingCandidate({ ...candidate, [field]: value }).length > 0, field);
  }
  assert.ok(validateOnboardingCandidate({ ...candidate, canonical_name: "" }).length > 0);
  assert.ok(validateOnboardingCandidate({ ...candidate, source_authorities: [] }).includes("SOURCE_AUTHORITY_REQUIRED"));
  assert.ok(validateOnboardingCandidate({ ...candidate, buyer_types: ["ANY_BUYER"] }).some((x) => x.includes("UNSUPPORTED_BUYER_TYPE")));
  assert.ok(validateOnboardingCandidate({ ...candidate, commercial_forms: ["PER_UNIVERSE"] }).some((x) => x.includes("UNSUPPORTED_COMMERCIAL_FORM")));
  assert.ok(validateOnboardingCandidate({ ...candidate, funding_relationships: [{ status: "POTENTIAL", categories: ["GRANT"], eligible: true }] }).includes("FUNDING_ELIGIBILITY_NOT_REGISTRY_AUTHORITY"));
  const duplicateResult = await runOnboarding({ manifest: { candidates: [candidate, { ...candidate, candidate_id: "cc-duplicate" }] }, service: { async getProductDetail() { return null; } }, actor: {} });
  assert.equal(duplicateResult.results[1].disposition, "REJECTED_DUPLICATE");
});

test("dry-run performs no service mutation and apply is idempotent through Product Registry service", async () => {
  const source = (await manifest()).candidates.find((c: any) => c.registration_allowed);
  assert.ok(source);
  const candidate = { ...source, review_gates: [], funding_relationships: [], regulated_metadata: { ...source.regulated_metadata, external_training_authority_required: "UNKNOWN", partner_required: false } };
  const oneCandidateManifest = { candidates: [candidate] };
  const mutations: string[] = [];
  let product: any = null;
  let detail: any = null;
  const service = {
    async getProductDetail() { return detail; },
    async createProduct(input: any) {
      mutations.push("createProduct");
      product = { commercial_product_id: input.commercialProductId, canonical_name: input.canonicalName, display_name: input.displayName, slug: input.slug, commercial_family: input.commercialFamily, product_type: input.productType, lifecycle_state: input.lifecycleState, readiness: input.readiness, readiness_reason: input.readinessReason, sellability: input.sellability, sellability_reason: input.sellabilityReason, selling_entity: input.sellingEntity, delivery_entity: input.deliveryEntity, entity_review_flags: input.entityReviewFlags };
      detail = { product, sourceAuthorities: input.sourceAuthorities.map((s: any) => ({ ...s, source_authority_type: s.source_authority_type, source_domain: s.source_domain, source_record_id: s.source_record_id, source_status: s.source_status })), buyers: input.buyerCompatibility.map((buyer_type: string) => ({ buyer_type })), commercialForms: input.commercialForms.map((commercial_form: string) => ({ commercial_form })), reviewGates: [], fundingRelationships: [], regulatedProgram: null, implementationSupport: null, renewalExpansion: null, governanceState: null };
      return product;
    },
    async updateImplementationSupportMetadata() { mutations.push("implementation"); detail.implementationSupport = {}; },
    async updateRenewalExpansionMetadata() { mutations.push("renewal"); detail.renewalExpansion = {}; },
    async updateGovernanceState() { mutations.push("governance"); detail.governanceState = {}; },
  };
  const actor = { user_id: "operator", active_organization_id: "org", capabilities: ["commercial_product.create", "commercial_product.read"] };
  const dry = await runOnboarding({ manifest: oneCandidateManifest, service, actor });
  assert.equal(dry.results[0].dry_run, true);
  assert.deepEqual(mutations, []);
  const applied = await runOnboarding({ manifest: oneCandidateManifest, service, actor, mode: "APPLY" });
  assert.equal(applied.results[0].disposition, "REGISTERED");
  const afterFirst = [...mutations];
  const rerun = await runOnboarding({ manifest: oneCandidateManifest, service, actor, mode: "APPLY" });
  assert.equal(rerun.results[0].disposition, "RECONCILED_EXISTING");
  assert.deepEqual(mutations, afterFirst);
  assert.equal(mutations.filter((method) => method === "createProduct").length, 1);
});

test("onboarding manifest is not wired into startup or migrations and frontend repository remains absent from backend changes", async () => {
  const source = await readFile(path.join(root, "apps/shs-api/src/server.ts"), "utf8");
  assert.doesNotMatch(source, /commercial-product-registry-onboarding|runOnboarding/);
  const migrations = (await import("node:fs/promises")).readdir;
  const names = await migrations(path.join(root, "apps/shs-api/migrations"));
  const sql = await Promise.all(names.filter((name) => name.endsWith(".sql")).map((name) => readFile(path.join(root, "apps/shs-api/migrations", name), "utf8")));
  assert.ok(sql.every((text) => !/INSERT\s+INTO\s+commercial_products/i.test(text)));
  assert.doesNotMatch(await readFile(path.join(root, "apps/shs-api/src/domain/commercial-product-registry/onboarding/commercial-product-onboarding.ts"), "utf8"), /shf-next/);
});
