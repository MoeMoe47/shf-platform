import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildReviewPackets } from "../src/domain/commercial-product-registry/review/review-packet-generator.ts";
import { REVIEW_GATE_TYPES } from "../src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts";
import {
  CommercialProductProductionOnboardingService,
  PRODUCTION_ONBOARD_CAPABILITY,
  hasProductionOnboardingCapabilityContract,
} from "../src/domain/commercial-product-registry/onboarding/commercial-product-production-onboarding-service.ts";

const root = path.resolve(import.meta.dirname, "../../..");
const [reviewManifest, onboardingManifest] = await Promise.all([
  readFile(path.join(root, "docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json"), "utf8").then(JSON.parse),
  readFile(path.join(root, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json"), "utf8").then(JSON.parse),
]);
const generatedAt = "2026-10-05T12:00:00.000Z";
const packets = buildReviewPackets(reviewManifest, onboardingManifest, generatedAt);
const packetMap = new Map(packets.map((packet) => [packet.candidate_id, packet]));

const actor = (capabilities = [PRODUCTION_ONBOARD_CAPABILITY]) => ({
  user_id: "operator-4i",
  active_organization_id: "org-4i",
  organization_id: "org-4i",
  tenant_id: "tenant:org-4i",
  capabilities,
});

function decision(candidateId: string, gateType: string, status = "APPROVED", version = 1) {
  return {
    review_decision_id: `decision_${candidateId}_${gateType}_${version}`.replaceAll("-", "_"),
    candidate_id: candidateId,
    commercial_product_id: packetMap.get(candidateId)?.commercial_product_id,
    gate_type: gateType,
    decision_status: status,
    decision_reason: status === "BLOCKED" ? "TEST_ONLY blocked gate." : "TEST_ONLY governed decision.",
    authority_type: gateType === "REGULATORY" ? "EXTERNAL_REGULATOR" : "COMMERCIAL_GOVERNANCE_AUTHORITY",
    authority_reference: `TEST_ONLY:${gateType}:authority`,
    evidence_references: [`TEST_ONLY:${gateType}:evidence`],
    reviewer_actor_id: "reviewer-4i",
    reviewer_org_id: "org-4i",
    reviewed_at: generatedAt,
    version,
  };
}

function source(candidateId: string, status = "RESOLVED", version = 1) {
  return {
    source_resolution_id: `source_${candidateId}_${version}`.replaceAll("-", "_"),
    candidate_id: candidateId,
    commercial_product_id: packetMap.get(candidateId)?.commercial_product_id,
    resolution_status: status,
    authority_domain: "CURRICULUM",
    authority_reference: "TEST_ONLY:source-authority",
    evidence_reference: "TEST_ONLY:source-evidence",
    remaining_requirements: [],
    resolved_by_actor: "reviewer-4i",
    resolved_by_org: "org-4i",
    resolved_at: generatedAt,
    version,
  };
}

function harness(candidateId = "cc-002", overrides: { decisions?: any[]; source?: any; existing?: any; onboarding?: any } = {}) {
  const rows: Record<string, any[]> = { products: [], sources: [], buyers: [], forms: [], gates: [], funding: [], entitlements: [], regulated: [], implementation: [], renewal: [], governance: [], onboardings: [], audits: [] };
  if (overrides.existing) rows.products.push(overrides.existing);
  if (overrides.onboarding) rows.onboardings.push(overrides.onboarding);
  const decisions = overrides.decisions ?? REVIEW_GATE_TYPES.map((gate) => decision(candidateId, gate));
  const latestSource = Object.hasOwn(overrides, "source") ? overrides.source : source(candidateId);
  const registry: any = {
    getProductById: async (id: string) => rows.products.find((row) => row.commercial_product_id === id) || null,
    createProduct: async (input: any) => { rows.products.push({ ...input }); return rows.products.at(-1); },
    addSourceAuthority: async (input: any) => { rows.sources.push(input); return input; },
    addBuyerCompatibility: async (input: any) => { rows.buyers.push(input); return input; },
    addCommercialForm: async (input: any) => { rows.forms.push(input); return input; },
    addReviewGate: async (input: any) => { rows.gates.push(input); return input; },
    addFundingRelationship: async (input: any) => { rows.funding.push(input); return input; },
    addEntitlementReference: async (input: any) => { rows.entitlements.push(input); return input; },
    upsertRegulatedProgramMetadata: async (input: any) => { rows.regulated.push(input); return input; },
    upsertImplementationSupport: async (input: any) => { rows.implementation.push(input); return input; },
    upsertRenewalExpansion: async (input: any) => { rows.renewal.push(input); return input; },
    upsertGovernanceState: async (input: any) => { rows.governance.push(input); return input; },
  };
  const review: any = {
    listDecisionHistory: async () => decisions,
    listSourceResolutionHistory: async () => latestSource ? [latestSource] : [],
    getLatestDecision: async (_candidateId: string, gateType: string) => decisions.find((row) => row.gate_type === gateType) || null,
    getLatestSourceResolution: async () => latestSource,
  };
  const executor: any = {
    query: async (sql: string, params: any[] = []) => {
      if (/pg_advisory_xact_lock/.test(sql)) return { rows: [] };
      if (/SELECT \* FROM commercial_product_production_onboardings/.test(sql)) return { rows: rows.onboardings.filter((row) => row.candidate_id === params[0]) };
      if (/INSERT INTO commercial_product_production_onboardings/.test(sql)) {
        const row = {
          onboarding_id: params[0],
          candidate_id: params[1],
          commercial_product_id: params[2],
          organization_id: params[3],
          operator_user_id: params[4],
          source_resolution_id: params[5],
          source_resolution_version: params[6],
          review_decision_refs: JSON.parse(params[7]),
          eligibility_snapshot: JSON.parse(params[8]),
          lineage_snapshot: JSON.parse(params[9]),
          lifecycle_state: params[10],
          readiness: params[11],
          sellability: params[12],
        };
        rows.onboardings.push(row);
        return { rows: [row] };
      }
      return { rows: [] };
    },
  };
  const service = new CommercialProductProductionOnboardingService(
    onboardingManifest,
    packetMap,
    registry,
    review,
    async (event: any) => rows.audits.push(event),
    async (fn: any) => fn(executor),
    () => new Date(generatedAt),
  );
  return { service, rows, decisions, latestSource };
}

test("4I capability is separate from create/edit/reviewer/sales.admin permissions", async () => {
  assert.equal(hasProductionOnboardingCapabilityContract(), true);
  const { service, rows } = harness();
  for (const caps of [["commercial_product.create"], ["commercial_product.edit"], ["commercial_product.review_legal"], ["sales.admin"]]) {
    await assert.rejects(service.dryRun("cc-002", actor(caps)), (error: any) => error.code === "PRODUCTION_ONBOARD_CAPABILITY_REQUIRED");
  }
  assert.equal(rows.products.length, 0);
});

test("dry-run consumes persisted review/source state and performs zero mutation", async () => {
  const { service, rows } = harness();
  const report = await service.dryRun("cc-002", actor());
  assert.equal(report.mutationPerformed, false);
  assert.equal(report.eligibility.eligible, true);
  assert.equal(report.proposed.lifecycle, "REVIEW");
  assert.equal(report.proposed.readiness, "YELLOW");
  assert.equal(report.proposed.sellability, "PILOT");
  assert.equal(rows.products.length, 0);
  assert.equal(rows.onboardings.length, 0);
  assert.equal(rows.audits.length, 0);
});

test("negative gates block production onboarding without fabricating decisions", async () => {
  const missingSource = harness("cc-002", { source: null });
  assert.equal((await missingSource.service.dryRun("cc-002", actor())).eligibility.eligible, false);

  const missingDecision = harness("cc-002", { decisions: REVIEW_GATE_TYPES.filter((gate) => gate !== "LEGAL").map((gate) => decision("cc-002", gate)) });
  assert.ok((await missingDecision.service.dryRun("cc-002", actor())).eligibility.blockers.includes("missing_required_review_decision:LEGAL"));

  const blocked = harness("cc-002", { decisions: REVIEW_GATE_TYPES.map((gate) => decision("cc-002", gate, gate === "LEGAL" ? "BLOCKED" : "APPROVED")) });
  assert.ok((await blocked.service.dryRun("cc-002", actor())).eligibility.blockers.includes("blocked_gate:LEGAL"));

  const stale = harness("cc-002", { decisions: REVIEW_GATE_TYPES.map((gate) => ({ ...decision("cc-002", gate), expires_at: gate === "LEGAL" ? "2026-10-01T00:00:00.000Z" : null })) });
  assert.ok((await stale.service.dryRun("cc-002", actor())).eligibility.blockers.includes("stale_gate:LEGAL"));

  const unknown = harness("cc-002", { decisions: REVIEW_GATE_TYPES.map((gate) => decision("cc-002", gate, gate === "LEGAL" ? "UNKNOWN" : "APPROVED")) });
  assert.ok((await unknown.service.dryRun("cc-002", actor())).eligibility.blockers.includes("unknown_mandatory_gate:LEGAL"));

  const missingEvidence = harness("cc-002", { decisions: REVIEW_GATE_TYPES.map((gate) => ({ ...decision("cc-002", gate), evidence_references: gate === "LEGAL" ? [] : [`TEST_ONLY:${gate}:evidence`] })) });
  assert.ok((await missingEvidence.service.dryRun("cc-002", actor())).eligibility.blockers.includes("missing_evidence:LEGAL"));
});

test("regulated candidate remains blocked without regulatory authority decision", async () => {
  const ctx = harness("cc-009", { decisions: REVIEW_GATE_TYPES.map((gate) => decision("cc-009", gate, gate === "REGULATORY" ? "PENDING" : "APPROVED")) });
  const report = await ctx.service.dryRun("cc-009", actor());
  assert.equal(report.regulatedRequirements.regulated, true);
  assert.ok(report.eligibility.blockers.includes("regulated_candidate_requires_external_regulatory_or_training_authority"));
});

test("execute registers exactly one eligible TEST_ONLY candidate and is idempotent", async () => {
  const ctx = harness();
  const dry = await ctx.service.dryRun("cc-002", actor());
  const result = await ctx.service.execute("cc-002", actor(), {
    confirmation: "ONBOARD_CANDIDATE",
    expectedCandidateVersion: dry.expectedVersions.candidateVersion,
    expectedSourceVersion: dry.expectedVersions.sourceVersion,
    expectedDecisionVersions: dry.expectedVersions.decisionVersions,
  });
  assert.equal(result.status, "REGISTERED");
  assert.equal(result.product.commercial_product_id, "cp_data_center_employer_validation_package");
  assert.equal(result.product.lifecycle_state, "REVIEW");
  assert.equal(result.product.readiness, "YELLOW");
  assert.equal(result.product.sellability, "PILOT");
  assert.equal(ctx.rows.products.length, 1);
  assert.equal(ctx.rows.onboardings.length, 1);
  assert.equal(ctx.rows.gates.length, REVIEW_GATE_TYPES.length);
  assert.ok(ctx.rows.audits.some((event) => event.action_type === "commercial_product_registry.production_onboarding_attempted"));
  assert.ok(ctx.rows.audits.some((event) => event.action_type === "commercial_product_registry.production_onboarding_succeeded"));

  const second = await ctx.service.execute("cc-002", actor(), { confirmation: "ONBOARD_CANDIDATE" });
  assert.equal(second.status, "ALREADY_ONBOARDED");
  assert.equal(second.idempotent, true);
  assert.equal(ctx.rows.products.length, 1);
});

test("stale dry-run versions, missing confirmation, and protected-field injection are rejected", async () => {
  const ctx = harness();
  await assert.rejects(ctx.service.execute("cc-002", actor(), { confirmation: "ONBOARD_CANDIDATE", expectedCandidateVersion: 999 }), (error: any) => error.code === "CANDIDATE_VERSION_STALE");
  await assert.rejects(ctx.service.execute("cc-002", actor(), {}), (error: any) => error.code === "PRODUCTION_ONBOARD_CONFIRMATION_REQUIRED");
  await assert.rejects(ctx.service.execute("cc-002", actor(), { confirmation: "ONBOARD_CANDIDATE", sellability: "SELL_NOW" }), (error: any) => error.code === "PROTECTED_FIELD_INJECTION_REJECTED");
});
