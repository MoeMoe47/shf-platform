import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import test from "node:test";
import { registerCommercialProductRegistryRoutes } from "../src/domain/commercial-product-registry/api/routes.ts";

const read = "commercial_product.read";
const edit = "commercial_product.edit";
const create = "commercial_product.create";
const transitionLifecycle = "commercial_product.transition_lifecycle";
const retire = "commercial_product.retire";
const readiness = "commercial_product.review_readiness";
const sellability = "commercial_product.review_sellability";
const legal = "commercial_product.review_legal";
const regulatory = "commercial_product.review_regulatory";
const pricing = "commercial_product.review_pricing";
const margin = "commercial_product.review_margin";
const commission = "commercial_product.review_commission";
const sponsorship = "commercial_product.review_sponsorship";

const sourceAuthority = {
  sourceAuthorityType: "SERVICE_CATALOG",
  sourceDomain: "service-catalog",
  sourceRecordId: "svc-route",
  sourceStatus: "FOUND",
  sourceProvenance: ["route test"],
};

const products = [
  {
    commercialProductId: "cp_route_sell",
    name: "Route Sell Product",
    family: "DATA_CENTER",
    shortDescription: "Sell now",
    buyerFit: ["EMPLOYER"],
    readiness: "GREEN",
    sellability: "SELL_NOW",
    commercialForms: ["SUBSCRIPTION"],
    sellingEntity: "SHS",
    deliveryEntity: "PARTNER",
    pricingStatus: "APPROVED",
    fundingRelationship: "VERIFIED",
    implementationStatus: "APPROVED",
    supportStatus: "APPROVED",
    commissionEligibility: "UNDER_REVIEW",
    renewalModel: "ANNUAL",
    expansionPaths: ["cp_route_pilot"],
    reviewBlocks: [],
    sourceProvenance: [sourceAuthority],
    lastVerifiedAt: "2026-10-05T00:00:00.000Z",
    connectionStatus: { status: "CONNECTED" },
  },
  {
    commercialProductId: "cp_route_pilot",
    name: "Route Pilot Product",
    family: "CAREER_WORKFORCE",
    shortDescription: "Pilot",
    buyerFit: ["K12_SCHOOL"],
    readiness: "YELLOW",
    sellability: "PILOT",
    commercialForms: ["TRAINING"],
    sellingEntity: "SHS",
    deliveryEntity: "SHS",
    pricingStatus: "DRAFT",
    fundingRelationship: "POTENTIAL",
    implementationStatus: "PENDING",
    supportStatus: "UNKNOWN",
    commissionEligibility: "UNKNOWN",
    renewalModel: "UNKNOWN",
    expansionPaths: [],
    reviewBlocks: ["LEGAL"],
    sourceProvenance: [],
    lastVerifiedAt: "2026-10-04T00:00:00.000Z",
    connectionStatus: { status: "CONNECTED" },
  },
  {
    commercialProductId: "cp_route_develop",
    name: "Route Develop Product",
    family: "METAVERSE",
    buyerFit: ["ENTERPRISE"],
    readiness: "RED",
    sellability: "DEVELOP",
    commercialForms: ["PROFESSIONAL_SERVICE"],
    sellingEntity: "PARTNER",
    deliveryEntity: "PARTNER",
    pricingStatus: "NOT_DEFINED",
    fundingRelationship: "NOT_FOUND",
    implementationStatus: "UNKNOWN",
    supportStatus: "UNKNOWN",
    commissionEligibility: "UNKNOWN",
    renewalModel: "UNKNOWN",
    expansionPaths: [],
    reviewBlocks: ["PRICING"],
    sourceProvenance: [],
    connectionStatus: { status: "CONNECTED" },
  },
];

function summary(items = products, status = { status: items.length ? "CONNECTED" : "CONNECTED_EMPTY" }) {
  return {
    sellNow: items.filter((item) => item.sellability === "SELL_NOW").length,
    pilot: items.filter((item) => item.sellability === "PILOT").length,
    develop: items.filter((item) => item.sellability === "DEVELOP").length,
    needsReview: items.filter((item) => item.sellability === "NEEDS_REVIEW").length,
    notSellable: items.filter((item) => item.sellability === "NOT_SELLABLE").length,
    status,
  };
}

function distributions(items = products, status = { status: items.length ? "CONNECTED" : "CONNECTED_EMPTY" }) {
  const countBy = (field: string) => Object.entries(items.reduce((acc: any, item: any) => {
    acc[item[field]] = (acc[item[field]] || 0) + 1;
    return acc;
  }, {})).map(([key, count]) => ({ key, count, status }));
  return {
    family: countBy("family"),
    readiness: countBy("readiness"),
    sellability: countBy("sellability"),
  };
}

function fakeService(empty = false) {
  const calls: any[] = [];
  const serviceProducts = empty ? [] : products;
  return {
    calls,
    async projectSalesProductReadModel(actor: any) {
      calls.push(["projectSalesProductReadModel", actor]);
      const status = { status: serviceProducts.length ? "CONNECTED" : "CONNECTED_EMPTY" };
      return { status, items: serviceProducts, summary: summary(serviceProducts, status), distributions: distributions(serviceProducts, status) };
    },
    async getProductById(id: string, actor: any) {
      calls.push(["getProductById", id, actor]);
      return serviceProducts.find((item) => item.commercialProductId === id)
        ? { commercial_product_id: id, display_name: serviceProducts.find((item) => item.commercialProductId === id)?.name }
        : null;
    },
    async getProductBySlug(slug: string, actor: any) {
      calls.push(["getProductBySlug", slug, actor]);
      return slug === "route-sell" ? { commercial_product_id: "cp_route_sell", slug } : null;
    },
    async getProductDetail(id: string, actor: any) {
      calls.push(["getProductDetail", id, actor]);
      const item = serviceProducts.find((product) => product.commercialProductId === id);
      return item ? { product: item, sourceAuthorities: item.sourceProvenance, buyers: item.buyerFit, commercialForms: item.commercialForms, reviewGates: item.reviewBlocks } : null;
    },
    async createProduct(input: any, actor: any) {
      calls.push(["createProduct", input, actor]);
      if (input.created_by) throw Object.assign(new Error("created_by is not client-assignable through this operation."), { code: "SERVER_DERIVED_FIELD_FORBIDDEN", statusCode: 400 });
      return { commercial_product_id: input.commercialProductId, created_by: actor.user_id };
    },
    async updateDescriptiveMetadata(id: string, input: any, actor: any) {
      calls.push(["updateDescriptiveMetadata", id, input, actor]);
      if (input.lifecycleState || input.readiness || input.sellability) throw Object.assign(new Error("governed state route required"), { code: "GOVERNED_STATE_CHANGE_REQUIRED", statusCode: 400 });
      return { commercial_product_id: id, display_name: input.displayName };
    },
    async transitionLifecycle(id: string, toState: string, input: any, actor: any) {
      calls.push(["transitionLifecycle", id, toState, input, actor]);
      if (toState === "ACTIVE") throw Object.assign(new Error("invalid transition"), { code: "COMMERCIAL_PRODUCT_LIFECYCLE_TRANSITION_REJECTED", statusCode: 400 });
      return { commercial_product_id: id, lifecycle_state: toState, updated_by: actor.user_id };
    },
    async reviewReadiness(id: string, input: any, actor: any) { calls.push(["reviewReadiness", id, input, actor]); return { commercial_product_id: id, readiness: input.readiness }; },
    async reviewSellability(id: string, input: any, actor: any) { calls.push(["reviewSellability", id, input, actor]); return { commercial_product_id: id, sellability: input.sellability, sellability_blockers: input.blockers, sellability_restrictions: input.restrictions }; },
    async manageReviewGate(id: string, input: any, actor: any) { calls.push(["manageReviewGate", id, input, actor]); return { commercial_product_id: id, gate_type: input.gateType, status: input.status }; },
    async listSourceAuthorities() { return [sourceAuthority]; },
    async addSourceAuthority(id: string, input: any, actor: any) { calls.push(["addSourceAuthority", id, input, actor]); return { source_reference_id: "src-route", ...input }; },
    async updateSourceAuthority(id: string, input: any, actor: any) { calls.push(["updateSourceAuthority", id, input, actor]); return { source_reference_id: "src-route", ...input }; },
    async deactivateSourceAuthority(id: string, sourceReferenceId: string, input: any, actor: any) { calls.push(["deactivateSourceAuthority", id, sourceReferenceId, input, actor]); return { source_reference_id: sourceReferenceId, source_status: "STALE" }; },
    async listBuyers() { return [{ buyer_type: "EMPLOYER" }]; },
    async addBuyerCompatibility(id: string, buyerType: string, input: any, actor: any) { calls.push(["addBuyerCompatibility", id, buyerType, input, actor]); return { buyer_type: buyerType }; },
    async removeBuyerCompatibility(id: string, buyerType: string, input: any, actor: any) { calls.push(["removeBuyerCompatibility", id, buyerType, input, actor]); return { buyer_type: buyerType }; },
    async listCommercialForms() { return [{ commercial_form: "SUBSCRIPTION" }]; },
    async addCommercialForm(id: string, form: string, input: any, actor: any) { calls.push(["addCommercialForm", id, form, input, actor]); return { commercial_form: form }; },
    async removeCommercialForm(id: string, form: string, input: any, actor: any) { calls.push(["removeCommercialForm", id, form, input, actor]); return { commercial_form: form }; },
    async listReviewGates() { return [{ gate_type: "LEGAL", status: "PENDING" }]; },
    async listFundingRelationships() { return [{ funding_relationship_status: "POTENTIAL", funding_category: "GRANT" }]; },
    async manageFundingRelationship(id: string, input: any, actor: any) {
      calls.push(["manageFundingRelationship", id, input, actor]);
      if (input.status === "ELIGIBLE") throw Object.assign(new Error("eligibility status not registry authority"), { code: "COMMERCIAL_PRODUCT_ENUM_INVALID" });
      if (input.eligibilityStatus === "ELIGIBLE") throw Object.assign(new Error("eligibility not registry authority"), { code: "FUNDING_ELIGIBILITY_NOT_REGISTRY_AUTHORITY" });
      return { funding_relationship_status: input.status, funding_category: input.category };
    },
    async listEntitlements() { return [{ entitlement_id: "svc:test", entitlement_requirement: "REQUIRED" }]; },
    async addEntitlementReference(id: string, input: any, actor: any) { calls.push(["addEntitlementReference", id, input, actor]); return { entitlement_id: input.entitlementId, entitlement_requirement: input.requirement }; },
    async removeEntitlementReference(id: string, entitlementId: string, requirement: string, input: any, actor: any) { calls.push(["removeEntitlementReference", id, entitlementId, requirement, input, actor]); return { entitlement_id: entitlementId, entitlement_requirement: requirement }; },
    async listRelationships() { return [{ relationship_id: "rel-route", source_product_id: "cp_route_sell", target_product_id: "cp_route_pilot", status: "ACTIVE" }]; },
    async addProductRelationship(input: any, actor: any) {
      calls.push(["addProductRelationship", input, actor]);
      if (input.sourceProductId === input.targetProductId) throw Object.assign(new Error("self relation"), { code: "PRODUCT_RELATIONSHIP_SELF_RELATION_INVALID" });
      if (input.relationshipId === "duplicate") throw Object.assign(new Error("duplicate active"), { code: "PRODUCT_RELATIONSHIP_DUPLICATE_ACTIVE" });
      return { relationship_id: input.relationshipId || "rel-new", source_product_id: input.sourceProductId, target_product_id: input.targetProductId };
    },
    async deactivateProductRelationship(id: string, relationshipId: string, input: any, actor: any) { calls.push(["deactivateProductRelationship", id, relationshipId, input, actor]); return { relationship_id: relationshipId, status: "RETIRED" }; },
    async updateRegulatedProgramMetadata(id: string, input: any, actor: any) { calls.push(["updateRegulatedProgramMetadata", id, input, actor]); return { commercial_product_id: id, ...input }; },
    async updateImplementationSupportMetadata(id: string, input: any, actor: any) { calls.push(["updateImplementationSupportMetadata", id, input, actor]); return { commercial_product_id: id, ...input }; },
    async updateRenewalExpansionMetadata(id: string, input: any, actor: any) { calls.push(["updateRenewalExpansionMetadata", id, input, actor]); return { commercial_product_id: id, ...input }; },
    async updateSocialSellingMetadata(id: string, input: any, actor: any) { calls.push(["updateSocialSellingMetadata", id, input, actor]); return { commercial_product_id: id, ...input }; },
    async updateGovernanceState(id: string, input: any, actor: any) { calls.push(["updateGovernanceState", id, input, actor]); return { commercial_product_id: id, ...input }; },
  };
}

async function withApi(routeService: any, run: (baseUrl: string, service: any) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res: any, next: any) => {
    const permissions = req.header("x-test-permission");
    if (permissions) {
      req.user = {
        user_id: "test-cpr-user",
        active_organization_id: "test-cpr-org",
        tenant_id: "tenant:test-cpr-org",
        permissions: permissions.split(","),
      };
    }
    next();
  });
  registerCommercialProductRegistryRoutes(app, routeService as any);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    await run(`http://127.0.0.1:${address.port}`, routeService);
  } finally {
    server.close();
    await once(server, "close");
  }
}

async function request(baseUrl: string, path: string, permission: string, init: any = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "content-type": "application/json", "x-test-permission": permission, ...(init.headers || {}) },
  });
}

test("3D Commercial Product Registry HTTP read routes enforce auth, empty state, filters, summary, distributions, pagination, sorting, and no demo seed", async () => {
  await withApi(fakeService(), async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/commercial-products`)).status, 401);
    assert.equal((await request(baseUrl, "/commercial-products", edit)).status, 403);

    const list = await request(baseUrl, "/commercial-products?family=DATA_CENTER&readiness=GREEN&sellability=SELL_NOW&buyer_type=EMPLOYER&commercial_form=SUBSCRIPTION&selling_entity=SHS&delivery_entity=PARTNER&funding_relationship=VERIFIED&page_size=1&sort=name", read);
    assert.equal(list.status, 200);
    const listPayload: any = await list.json();
    assert.equal(listPayload.data.total, 1);
    assert.equal(listPayload.data.items[0].commercialProductId, "cp_route_sell");

    assert.equal((await request(baseUrl, "/commercial-products?family=FAKE", read)).status, 400);
    assert.equal((await request(baseUrl, "/commercial-products?readiness=FAKE", read)).status, 400);
    assert.equal((await request(baseUrl, "/commercial-products?sellability=FAKE", read)).status, 400);
    assert.equal((await request(baseUrl, "/commercial-products?sort=raw_sql", read)).status, 400);

    const bounded = await request(baseUrl, "/commercial-products?page_size=500&sort=last_verified_at&direction=desc", read);
    assert.equal((await bounded.json() as any).data.pageSize, 100);

    const summaryResponse = await request(baseUrl, "/commercial-products/summary", read);
    assert.deepEqual((await summaryResponse.json() as any).data, summary());
    const distributionsResponse = await request(baseUrl, "/commercial-products/distributions", read);
    const distPayload: any = await distributionsResponse.json();
    assert.equal(distPayload.data.family.find((row: any) => row.key === "DATA_CENTER").count, 1);
    assert.equal(distPayload.data.readiness.find((row: any) => row.key === "GREEN").count, 1);
    assert.equal(distPayload.data.sellability.find((row: any) => row.key === "SELL_NOW").count, 1);

    const detail = await request(baseUrl, "/commercial-products/cp_route_sell", read);
    assert.equal((await detail.json() as any).data.product.commercialProductId, "cp_route_sell");
    assert.equal((await request(baseUrl, "/commercial-products/slug/route-sell", read)).status, 200);
    assert.equal((await request(baseUrl, "/commercial-products/sales-read-model", read)).status, 200);
    assert.doesNotMatch(JSON.stringify(listPayload), /cc-00[1-9]|PILOT 10|SELL_NOW 0/);
  });

  await withApi(fakeService(true), async (baseUrl) => {
    const response = await request(baseUrl, "/commercial-products", read);
    const payload: any = await response.json();
    assert.deepEqual(payload.data.items, []);
    assert.equal(payload.data.status.status, "CONNECTED_EMPTY");
  });
});

test("3D Commercial Product Registry HTTP mutation routes enforce capabilities, protected fields, governed state routes, gate-specific authority, boundaries, and actor propagation", async () => {
  await withApi(fakeService(), async (baseUrl, service) => {
    assert.equal((await request(baseUrl, "/commercial-products", read, { method: "POST", body: JSON.stringify({}) })).status, 403);
    const created = await request(baseUrl, "/commercial-products", create, { method: "POST", body: JSON.stringify({ commercialProductId: "cp_created" }) });
    assert.equal(created.status, 201);
    assert.equal(service.calls.at(-1)[2].user_id, "test-cpr-user");
    assert.equal((await request(baseUrl, "/commercial-products", create, { method: "POST", body: JSON.stringify({ commercialProductId: "cp_created", created_by: "client" }) })).status, 400);

    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell", read, { method: "PATCH", body: JSON.stringify({ displayName: "x" }) })).status, 403);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell", edit, { method: "PATCH", body: JSON.stringify({ lifecycleState: "ACTIVE" }) })).status, 400);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell", edit, { method: "PATCH", body: JSON.stringify({ readiness: "GREEN" }) })).status, 400);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell", edit, { method: "PATCH", body: JSON.stringify({ sellability: "SELL_NOW" }) })).status, 400);

    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/lifecycle", read, { method: "POST", body: JSON.stringify({ toState: "DEFINED", reason: "ok" }) })).status, 403);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/lifecycle", edit, { method: "POST", body: JSON.stringify({ toState: "DEFINED", reason: "ok" }) })).status, 403);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/lifecycle", retire, { method: "POST", body: JSON.stringify({ toState: "DEFINED", reason: "ok" }) })).status, 403);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/lifecycle", transitionLifecycle, { method: "POST", body: JSON.stringify({ toState: "DEFINED", reason: "ok" }) })).status, 200);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/lifecycle", transitionLifecycle, { method: "POST", body: JSON.stringify({ toState: "RETIRED", reason: "retire" }) })).status, 403);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/lifecycle", retire, { method: "POST", body: JSON.stringify({ toState: "RETIRED", reason: "retire" }) })).status, 200);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/lifecycle", transitionLifecycle, { method: "POST", body: JSON.stringify({ toState: "ACTIVE", reason: "skip" }) })).status, 400);
    assert.equal(service.calls.at(-1)[0], "transitionLifecycle");

    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/readiness-review", edit, { method: "POST", body: JSON.stringify({ readiness: "GREEN", reason: "ready" }) })).status, 403);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/readiness-review", readiness, { method: "POST", body: JSON.stringify({ readiness: "GREEN", reason: "ready", evaluatedByAuthority: "ops" }) })).status, 200);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/sellability-review", edit, { method: "POST", body: JSON.stringify({ sellability: "PILOT", reason: "pilot", blockers: ["pricing"], restrictions: ["named"], sourceAuthority }) })).status, 403);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/sellability-review", sellability, { method: "POST", body: JSON.stringify({ sellability: "PILOT", reason: "pilot", blockers: ["pricing"], restrictions: ["named"], sourceAuthority }) })).status, 200);

    for (const [gate, permission] of [["LEGAL", legal], ["REGULATORY", regulatory], ["PRICING", pricing], ["MARGIN", margin], ["COMMISSION", commission], ["PARTNER", sponsorship]] as const) {
      assert.equal((await request(baseUrl, `/commercial-products/cp_route_sell/review-gates/${gate}`, edit, { method: "POST", body: JSON.stringify({ status: "APPROVED", authority: "board" }) })).status, 403);
      assert.equal((await request(baseUrl, `/commercial-products/cp_route_sell/review-gates/${gate}`, permission, { method: "POST", body: JSON.stringify({ status: "APPROVED", authority: "board" }) })).status, 200);
    }
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/review-gates/TAX", edit, { method: "POST", body: JSON.stringify({ status: "APPROVED", authority: "tax" }) })).status, 403);

    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/source-authorities", read)).status, 200);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/source-authorities", edit, { method: "POST", body: JSON.stringify(sourceAuthority) })).status, 201);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/buyers", edit, { method: "POST", body: JSON.stringify({ buyerType: "EMPLOYER" }) })).status, 201);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/buyers", edit, { method: "POST", body: JSON.stringify({ buyerType: "FAKE" }) })).status, 400);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/commercial-forms", edit, { method: "POST", body: JSON.stringify({ commercialForm: "SUBSCRIPTION" }) })).status, 201);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/commercial-forms", edit, { method: "POST", body: JSON.stringify({ commercialForm: "FAKE" }) })).status, 400);

    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/funding-relationships", edit, { method: "POST", body: JSON.stringify({ status: "ELIGIBLE", category: "GRANT" }) })).status, 400);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/funding-relationships", edit, { method: "POST", body: JSON.stringify({ status: "VERIFIED", category: "GRANT", eligibilityStatus: "ELIGIBLE" }) })).status, 400);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/entitlement-references", edit, { method: "POST", body: JSON.stringify({ entitlementId: "svc:test", requirement: "REQUIRED" }) })).status, 201);

    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/relationships", edit, { method: "POST", body: JSON.stringify({ targetProductId: "cp_route_sell", relationshipType: "ADD_ON", direction: "SOURCE_TO_TARGET" }) })).status, 400);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/relationships", edit, { method: "POST", body: JSON.stringify({ relationshipId: "duplicate", targetProductId: "cp_route_pilot", relationshipType: "ADD_ON", direction: "SOURCE_TO_TARGET" }) })).status, 409);

    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/regulated-program", edit, { method: "PATCH", body: JSON.stringify({ regulatoryAuthority: "state" }) })).status, 403);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/regulated-program", regulatory, { method: "PATCH", body: JSON.stringify({ regulatoryAuthority: "state", scopeLimitations: ["no certification claim"] }) })).status, 200);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/implementation-support", edit, { method: "PATCH", body: JSON.stringify({ slaStatus: "UNKNOWN" }) })).status, 200);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/renewal-expansion", edit, { method: "PATCH", body: JSON.stringify({ renewalModel: "ANNUAL" }) })).status, 200);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/social-selling", edit, { method: "PATCH", body: JSON.stringify({ approvedPublicMarketing: "APPROVED" }) })).status, 403);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/social-selling", sponsorship, { method: "PATCH", body: JSON.stringify({ approvedPublicMarketing: "PENDING" }) })).status, 200);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/governance-state", pricing, { method: "PATCH", body: JSON.stringify({ pricingStatus: "APPROVED", pricingReference: "ref" }) })).status, 200);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/governance-state", margin, { method: "PATCH", body: JSON.stringify({ marginStatus: "UNDER_REVIEW" }) })).status, 200);
    assert.equal((await request(baseUrl, "/commercial-products/cp_route_sell/governance-state", commission, { method: "PATCH", body: JSON.stringify({ commissionEligibleStatus: "UNDER_REVIEW", commissionPolicyReference: "policy" }) })).status, 200);
  });
});
