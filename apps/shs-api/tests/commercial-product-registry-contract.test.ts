import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  BUYER_TYPES,
  COMMERCIAL_FAMILIES,
  COMMERCIAL_FORMS,
  COMMERCIAL_PRODUCT_REGISTRY_AUTHORITY,
  FUNDING_RELATIONSHIP_STATUSES,
  GOVERNANCE_CAPABILITIES,
  MOCK_CONNECTION_STATUSES,
  PRODUCT_LIFECYCLE_STATES,
  PRODUCT_RELATIONSHIP_TYPES,
  READINESS_STATES,
  REVENUE_CLASSIFICATIONS,
  REVIEW_GATE_STATUSES,
  SALES_CONSUMER_AUTHORITY,
  SELLABILITY_STATUSES,
  assertNoCommissionCalculation,
  assertNoFundingEligibilityField,
  canTransitionProductLifecycle,
  isBuyerType,
  isCommercialFamily,
  isCommercialForm,
  isFundingRelationshipStatus,
  isMockConnectionStatus,
  isProductLifecycleState,
  isProductRelationshipType,
  isReadinessState,
  isReviewGateStatus,
  isSellabilityStatus,
  validateMockStatus,
  validateProductIdentityContract,
  validateProductRelationshipContract,
  validateReadinessContract,
  validateReviewGateContract,
  validateSellabilityContract,
  validateSourceAuthorityReference,
  type CommercialProductReadModel,
  type CommissionLeadershipMetadataContract,
  type RegulatedProgramMetadataContract,
  type SourceAuthorityReference,
} from "../src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts";

const sourceAuthority: SourceAuthorityReference = {
  sourceAuthorityType: "CURRICULUM",
  sourceRecordId: "curriculum:data-center",
  sourceStatus: "FOUND",
  sourceProvenance: ["docs/sales/commercial-catalog-audit/commercial-candidate-inventory.json"],
};

test("all 15 commercial families are valid and invalid family is rejected", () => {
  assert.equal(COMMERCIAL_FAMILIES.length, 15);
  for (const family of COMMERCIAL_FAMILIES) assert.equal(isCommercialFamily(family), true);
  assert.equal(isCommercialFamily("SALES_CREATED_PRODUCT"), false);
});

test("readiness states validate and invalid readiness is rejected", () => {
  assert.deepEqual([...READINESS_STATES], ["RED", "YELLOW", "GREEN", "BLUE", "UNKNOWN"]);
  for (const readiness of READINESS_STATES) assert.equal(isReadinessState(readiness), true);
  assert.equal(isReadinessState("READY_TO_SELL"), false);
});

test("sellability states validate and invalid sellability is rejected", () => {
  assert.deepEqual([...SELLABILITY_STATUSES], ["SELL_NOW", "PILOT", "DEVELOP", "NOT_SELLABLE", "NEEDS_REVIEW"]);
  for (const status of SELLABILITY_STATUSES) assert.equal(isSellabilityStatus(status), true);
  assert.equal(isSellabilityStatus("AUTO_SELL"), false);
});

test("review gate states validate and approval requires an authority", () => {
  for (const status of REVIEW_GATE_STATUSES) assert.equal(isReviewGateStatus(status), true);
  assert.throws(() => validateReviewGateContract({ gateType: "LEGAL", status: "APPROVED" }), /APPROVAL_AUTHORITY/);
  assert.equal(validateReviewGateContract({ gateType: "LEGAL", status: "APPROVED", authority: "legal-review" }).status, "APPROVED");
});

test("source authority references validate with provenance", () => {
  assert.equal(validateSourceAuthorityReference(sourceAuthority).sourceAuthorityType, "CURRICULUM");
  assert.throws(() => validateSourceAuthorityReference({ sourceAuthorityType: "SALES", sourceRecordId: "x", sourceStatus: "FOUND", sourceProvenance: ["x"] }), /TYPE/);
  assert.throws(() => validateSourceAuthorityReference({ sourceAuthorityType: "CURRICULUM", sourceStatus: "FOUND", sourceProvenance: [] }), /RECORD/);
});

test("buyer compatibility vocabulary validates", () => {
  assert.equal(BUYER_TYPES.includes("K12_SCHOOL"), true);
  assert.equal(BUYER_TYPES.includes("ENTERPRISE"), true);
  for (const buyer of BUYER_TYPES) assert.equal(isBuyerType(buyer), true);
  assert.equal(isBuyerType("schools"), false);
});

test("commercial forms validate and allow multiple forms", () => {
  const forms = ["PER_COHORT_LICENSE", "TRAINING", "GRANT_SUPPORTED"] as const;
  assert.equal(COMMERCIAL_FORMS.includes("ENTERPRISE_CONTRACT"), true);
  for (const form of forms) assert.equal(isCommercialForm(form), true);
  assert.equal(isCommercialForm("TUITION_PRICE"), false);
});

test("funding relationship status validates without eligibility authority", () => {
  for (const status of FUNDING_RELATIONSHIP_STATUSES) assert.equal(isFundingRelationshipStatus(status), true);
  assert.doesNotThrow(() => assertNoFundingEligibilityField({ status: "POTENTIAL" }));
  assert.throws(() => assertNoFundingEligibilityField({ eligibilityStatus: "ELIGIBLE" }), /FUNDING_ELIGIBILITY/);
});

test("entitlement references remain external by contract shape", () => {
  const entitlement = {
    requiredEntitlementIds: ["svc:studio"],
    optionalEntitlementIds: ["svc:reporting"],
    entitlementAuthority: "ENTITLEMENTS",
    entitlementStatusReference: "entitlement-status:svc:studio",
  };
  assert.deepEqual(entitlement.requiredEntitlementIds, ["svc:studio"]);
  assert.equal(entitlement.entitlementAuthority, "ENTITLEMENTS");
});

test("product relationship type validates and invalid self-relation is rejected", () => {
  for (const type of PRODUCT_RELATIONSHIP_TYPES) assert.equal(isProductRelationshipType(type), true);
  assert.equal(validateProductRelationshipContract({ relationshipId: "r1", sourceProductId: "cp_a", targetProductId: "cp_b", relationshipType: "ADD_ON", direction: "SOURCE_TO_TARGET", status: "DRAFT", provenance: ["design"] }).relationshipType, "ADD_ON");
  assert.throws(() => validateProductRelationshipContract({ relationshipId: "r2", sourceProductId: "cp_a", targetProductId: "cp_a", relationshipType: "ADD_ON", direction: "SOURCE_TO_TARGET", status: "DRAFT", provenance: ["design"] }), /SELF_RELATION/);
});

test("product lifecycle states validate and invalid basic transition is rejected", () => {
  for (const state of PRODUCT_LIFECYCLE_STATES) assert.equal(isProductLifecycleState(state), true);
  assert.equal(canTransitionProductLifecycle("DISCOVERED", "DEFINED"), true);
  assert.equal(canTransitionProductLifecycle("DISCOVERED", "ACTIVE"), false);
});

test("product identity contract rejects unstable or incomplete identity", () => {
  const identity = validateProductIdentityContract({
    commercialProductId: "cp_data_center_pathway",
    canonicalName: "Data Center Pathway",
    displayName: "Data Center Pathway",
    slug: "data-center-pathway",
    commercialFamily: "DATA_CENTER",
    productType: "CONTENT_LICENSE",
    version: 1,
    status: "ACTIVE",
  });
  assert.equal(identity.commercialProductId, "cp_data_center_pathway");
  assert.throws(() => validateProductIdentityContract({ ...identity, commercialProductId: "route:/products/1" }), /ID_INVALID/);
});

test("readiness and sellability contracts carry reasons and authority without coupling", () => {
  assert.equal(validateReadinessContract({ readiness: "YELLOW", reason: "controlled pilot only", evidenceReferences: [sourceAuthority] }).readiness, "YELLOW");
  assert.equal(validateSellabilityContract({ sellabilityStatus: "PILOT", reason: "pilot only", blockers: ["pricing"], restrictions: ["controlled cohort"], sourceAuthority }).sellabilityStatus, "PILOT");
  assert.equal(isReadinessState("YELLOW") && isSellabilityStatus("PILOT"), true);
});

test("Sales read model accepts truthful status states including NOT_CONNECTED and STALE", () => {
  const readModel: CommercialProductReadModel = {
    commercialProductId: "cp_data_center_pathway",
    name: "Data Center Pathway",
    family: "DATA_CENTER",
    shortDescription: "Pilot-only pathway.",
    buyerFit: ["K12_SCHOOL"],
    readiness: "YELLOW",
    sellability: "PILOT",
    commercialForms: ["PER_COHORT_LICENSE"],
    sellingEntity: "JOINT_STRUCTURE_REVIEW_REQUIRED",
    deliveryEntity: "SHF",
    pricingStatus: "NOT_DEFINED",
    fundingRelationship: "POTENTIAL",
    implementationStatus: "PENDING",
    supportStatus: "UNKNOWN",
    commissionEligibility: "UNKNOWN",
    renewalModel: "UNKNOWN",
    expansionPaths: [],
    reviewBlocks: ["PRICING"],
    sourceProvenance: [sourceAuthority],
    connectionStatus: { status: "NOT_CONNECTED", reason: "adapter unavailable" },
  };
  assert.equal(validateMockStatus(readModel.connectionStatus).status, "NOT_CONNECTED");
  assert.equal(validateMockStatus({ status: "STALE", staleAfter: "2026-10-01T00:00:00.000Z" }).status, "STALE");
});

test("all mock connection states are representable", () => {
  for (const status of MOCK_CONNECTION_STATUSES) assert.equal(isMockConnectionStatus(status), true);
  assert.equal(isMockConnectionStatus("FAKE_CONNECTED"), false);
});

test("no candidate seed data is embedded in production contract source", () => {
  const source = readFileSync(new URL("../src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /cc-00[1-9]|Data Center & AI Infrastructure Curriculum Pathway|SELL_NOW 0|PILOT 10/);
});

test("recruiting is not represented as revenue classification", () => {
  assert.equal(REVENUE_CLASSIFICATIONS.includes("LICENSE"), true);
  assert.equal((REVENUE_CLASSIFICATIONS as readonly string[]).includes("RECRUITING"), false);
});

test("commission metadata is non-calculating", () => {
  const metadata: CommissionLeadershipMetadataContract = {
    commissionEligibleStatus: "ELIGIBLE_AFTER_APPROVAL",
    commissionPolicyReference: "future-policy",
    leadershipOverrideEligible: "PENDING",
    renewalCommissionEligible: "UNKNOWN",
    expansionCommissionEligible: "UNKNOWN",
  };
  assert.equal(metadata.commissionEligibleStatus, "ELIGIBLE_AFTER_APPROVAL");
  assert.doesNotThrow(() => assertNoCommissionCalculation(metadata));
  assert.throws(() => assertNoCommissionCalculation({ commissionRate: 0.2 }), /COMMISSION_CALCULATION/);
});

test("regulated-program metadata supports external authority", () => {
  const regulated: RegulatedProgramMetadataContract = {
    programTypes: ["HEALTHCARE", "STNA"],
    regulatoryAuthority: "external-state-authority",
    externalTrainingAuthorityRequired: "PENDING",
    credentialAuthority: "external-credential-authority",
    partnerRequired: true,
    scopeLimitations: ["simulation only"],
    salesLanguageRestrictions: ["no licensure claim"],
  };
  assert.equal(regulated.partnerRequired, true);
  assert.equal(regulated.externalTrainingAuthorityRequired, "PENDING");
});

test("source provenance can represent multiple authorities", () => {
  const authorities: SourceAuthorityReference[] = [
    sourceAuthority,
    { sourceAuthorityType: "ENTITLEMENTS", sourceRecordId: "entitlement:studio", sourceStatus: "FOUND", sourceProvenance: ["service catalog"] },
  ];
  for (const authority of authorities) validateSourceAuthorityReference(authority);
  assert.equal(authorities.length, 2);
});

test("contracts do not make Sales the source authority", () => {
  assert.equal(COMMERCIAL_PRODUCT_REGISTRY_AUTHORITY, "COMMERCIAL_PRODUCT_REGISTRY");
  assert.equal(SALES_CONSUMER_AUTHORITY, "SALES_CONSUMER");
  assert.equal((GOVERNANCE_CAPABILITIES as readonly string[]).includes("commercial_product.review_pricing"), true);
  assert.equal((GOVERNANCE_CAPABILITIES as readonly string[]).includes("sales.product_authority"), false);
});

