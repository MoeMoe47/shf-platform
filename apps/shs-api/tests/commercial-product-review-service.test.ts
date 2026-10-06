import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { REVIEW_GATE_TYPES } from "../src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts";
import { CommercialProductReviewService } from "../src/domain/commercial-product-registry/review/commercial-product-review-service.ts";
import { buildReviewPackets } from "../src/domain/commercial-product-registry/review/review-packet-generator.ts";
import { reassessReviewPacket, REVIEW_GATE_POLICY, resolveCandidateIdentity, summarizeReviewAssessments, validateDecisionInput, validateSourceResolutionInput } from "../src/domain/commercial-product-registry/review/review-contract.ts";

const root = path.resolve(import.meta.dirname, "../../..");
const [reviewManifest, onboardingManifest] = await Promise.all([
  readFile(path.join(root, "docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json"), "utf8").then(JSON.parse),
  readFile(path.join(root, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json"), "utf8").then(JSON.parse),
]);
const generatedAt = "2026-10-05T12:00:00.000Z";
const packets = buildReviewPackets(reviewManifest, onboardingManifest, generatedAt);
const identityMap = new Map(packets.map((packet) => [packet.candidate_id, packet.commercial_product_id]));
const packetMap = new Map(packets.map((packet) => [packet.candidate_id, packet]));

function harness(packet = packets[0], assignmentAllowed: boolean | ((input: any) => boolean) = true) {
  const decisions: any[] = [];
  const resolutions: any[] = [];
  const audits: any[] = [];
  const isAllowed = (input: any) => typeof assignmentAllowed === "function" ? assignmentAllowed(input) : assignmentAllowed;
  const repo: any = {
    lockStream: async () => {},
    getLatestDecision: async (candidateId: string, gate: string) => decisions.filter((row) => row.candidate_id === candidateId && row.gate_type === gate).at(-1) || null,
    insertDecision: async (row: any) => { decisions.push({ ...row }); return decisions.at(-1); },
    listDecisionHistory: async (candidateId: string) => decisions.filter((row) => row.candidate_id === candidateId),
    getLatestSourceResolution: async (candidateId: string) => resolutions.filter((row) => row.candidate_id === candidateId).at(-1) || null,
    insertSourceResolution: async (row: any) => { resolutions.push({ ...row }); return resolutions.at(-1); },
    listSourceResolutionHistory: async (candidateId: string) => resolutions.filter((row) => row.candidate_id === candidateId),
  };
  const transaction = (fn: any) => fn({ query: async () => ({ rows: [] }) });
  const assignments: any = {
    assertIdentityMembership: async () => true,
    assertActiveAssignment: async (input: any) => isAllowed(input) ? { assignment_id: "test-assignment", allowed_gate_types: [input.gateType] } : null,
    findActiveForCandidate: async (_actorId: string, _orgId: string, candidateId: string) => isAllowed({ candidateId, gateType: "LEGAL" }) ? [{ assignment_id: "test-assignment", candidate_id: candidateId, allowed_gate_types: ["LEGAL"] }] : [],
    listActiveForReviewer: async () => isAllowed({ candidateId: packet.candidate_id, gateType: "LEGAL" }) ? [{ assignment_id: "test-assignment", candidate_id: packet.candidate_id, allowed_gate_types: ["LEGAL"] }] : [],
  };
  const service = new CommercialProductReviewService(identityMap, packetMap, repo, async (event: any) => audits.push(event), transaction, () => new Date(generatedAt), assignments);
  return { service, decisions, resolutions, audits, packet };
}

const actor = (capability: string) => ({ user_id: "reviewer-1", active_organization_id: "org-review-1", organization_id: "org-review-1", tenant_id: "tenant:org-review-1", capabilities: [capability] });

test("review packet generator creates 32 deterministic identity packets without approvals", () => {
  const first = buildReviewPackets(reviewManifest, onboardingManifest, generatedAt);
  const second = buildReviewPackets(reviewManifest, onboardingManifest, generatedAt);
  assert.equal(first.length, 32);
  assert.deepEqual(first, second);
  assert.ok(first.every((packet) => packet.generated_at === generatedAt && packet.packet_version === 1));
  assert.equal(first.find((packet) => packet.candidate_id === "cc-005")?.source_resolution_status, "SOURCE_UNRESOLVED");
  assert.ok(first.every((packet) => packet.current_review_gates.length === REVIEW_GATE_TYPES.length));
  assert.ok(first.every((packet) => packet.production_onboarding_eligibility === false));
});

test("candidate/product pair and gate-specific authority are enforced; generic Sales edit is insufficient", async () => {
  const ctx = harness();
  assert.throws(() => resolveCandidateIdentity("cc-005", "cp_wrong", identityMap), /IDENTITY_MISMATCH/);
  const input = { candidateId: ctx.packet.candidate_id, commercialProductId: ctx.packet.commercial_product_id, gateType: "LEGAL", decisionStatus: "PENDING", reviewedAt: generatedAt };
  await assert.rejects(ctx.service.recordDecision(input, actor("commercial_product.edit")), (error: any) => error.code === "REVIEW_CAPABILITY_REQUIRED");
  assert.equal(ctx.decisions.length, 0);
});

test("identity capability without a candidate-and-gate assignment is denied", async () => {
  const ctx = harness(packets[0], false);
  const input = { candidateId: ctx.packet.candidate_id, commercialProductId: ctx.packet.commercial_product_id, gateType: "LEGAL", decisionStatus: "PENDING", reviewedAt: generatedAt };
  await assert.rejects(ctx.service.recordDecision(input, actor(REVIEW_GATE_POLICY.LEGAL.capability)), (error: any) => error.code === "REVIEW_ASSIGNMENT_REQUIRED");
  assert.equal(ctx.decisions.length, 0);
});

test("candidate and gate assignment scope are independently enforced on decisions", async () => {
  const scoped = harness(packets[0], (input: any) => input.candidateId === packets[0].candidate_id && input.gateType === "LEGAL");
  const legal = { candidateId: packets[0].candidate_id, commercialProductId: packets[0].commercial_product_id, gateType: "LEGAL", decisionStatus: "PENDING", reviewedAt: generatedAt };
  const wrongCandidate = { ...legal, candidateId: packets[1].candidate_id, commercialProductId: packets[1].commercial_product_id };
  const wrongGate = { ...legal, gateType: "REGULATORY" };
  await assert.rejects(scoped.service.recordDecision(wrongCandidate, actor(REVIEW_GATE_POLICY.LEGAL.capability)), (error: any) => error.code === "REVIEW_ASSIGNMENT_REQUIRED");
  await assert.rejects(scoped.service.recordDecision(wrongGate, actor(REVIEW_GATE_POLICY.REGULATORY.capability)), (error: any) => error.code === "REVIEW_ASSIGNMENT_REQUIRED");
  const accepted = await scoped.service.recordDecision(legal, actor(REVIEW_GATE_POLICY.LEGAL.capability));
  assert.equal(accepted.review_assignment_id, "test-assignment");
  assert.equal(scoped.decisions.length, 1);
});

test("candidate-scoped reads expose only assigned queue, packet gates, and history", async () => {
  const ctx = harness(packets[0], (input: any) => input.candidateId === packets[0].candidate_id && input.gateType === "LEGAL");
  ctx.decisions.push({ candidate_id: packets[0].candidate_id, gate_type: "LEGAL", decision_status: "PENDING", version: 1 });
  ctx.decisions.push({ candidate_id: packets[0].candidate_id, gate_type: "REGULATORY", decision_status: "PENDING", version: 1 });
  const queue = await ctx.service.listQueue(actor("commercial_product.read"));
  assert.deepEqual(queue.map((item: any) => item.candidate_id), [packets[0].candidate_id]);
  assert.deepEqual(queue[0].assigned_gate_types, ["LEGAL"]);
  const packet = await ctx.service.getPacket(packets[0].candidate_id, actor("commercial_product.read"));
  assert.ok(packet.packet.current_review_gates.every((gate: any) => gate.gate_type === "LEGAL"));
  assert.equal(packet.latest_decisions.length, 1);
  assert.equal(packet.latest_decisions[0].gate_type, "LEGAL");
  assert.equal(packet.latest_source_resolution, null);
  assert.equal(packet.reassessment.assessment_scope, "ASSIGNED_GATES");
  await assert.rejects(ctx.service.getPacket(packets[1].candidate_id, actor("commercial_product.read")), (error: any) => error.code === "REVIEW_ASSIGNMENT_REQUIRED");
});

test("APPROVED requires an allowed authority and evidence; BLOCKED requires a reason", async () => {
  const ctx = harness();
  const base = { candidateId: ctx.packet.candidate_id, commercialProductId: ctx.packet.commercial_product_id, gateType: "LEGAL", reviewedAt: generatedAt };
  await assert.rejects(ctx.service.recordDecision({ ...base, decisionStatus: "APPROVED" }, actor(REVIEW_GATE_POLICY.LEGAL.capability)), (error: any) => error.code === "REVIEW_APPROVAL_AUTHORITY_REQUIRED");
  await assert.rejects(ctx.service.recordDecision({ ...base, decisionStatus: "APPROVED", authorityType: "SALES", authorityReference: "sales:approval", evidenceReferences: ["docs/legal/review.md"] }, actor(REVIEW_GATE_POLICY.LEGAL.capability)), (error: any) => error.code === "REVIEW_AUTHORITY_TYPE_INVALID");
  await assert.rejects(ctx.service.recordDecision({ ...base, decisionStatus: "BLOCKED" }, actor(REVIEW_GATE_POLICY.LEGAL.capability)), (error: any) => error.code === "REVIEW_DECISION_REASON_REQUIRED");
  assert.equal(ctx.decisions.length, 0);
});

test("decision supersession is append-only and audited; readiness and sellability are not mutated", async () => {
  const ctx = harness();
  const base = { candidateId: ctx.packet.candidate_id, commercialProductId: ctx.packet.commercial_product_id, gateType: "LEGAL", reviewedAt: generatedAt };
  const first = await ctx.service.recordDecision({ ...base, decisionStatus: "PENDING", decisionReason: "Awaiting counsel." }, actor(REVIEW_GATE_POLICY.LEGAL.capability));
  assert.equal(first.review_assignment_id, "test-assignment");
  await assert.rejects(ctx.service.recordDecision({ ...base, decisionStatus: "APPROVED", authorityType: "LEGAL_COUNSEL", authorityReference: "legal:review:1", evidenceReferences: ["evidence:legal:1"] }, actor(REVIEW_GATE_POLICY.LEGAL.capability)), (error: any) => error.code === "REVIEW_SUPERSESSION_REQUIRED");
  const second = await ctx.service.recordDecision({ ...base, decisionStatus: "APPROVED", decisionReason: "Counsel decision recorded.", authorityType: "LEGAL_COUNSEL", authorityReference: "legal:review:1", evidenceReferences: ["evidence:legal:1"], supersedesDecisionId: first.review_decision_id }, actor(REVIEW_GATE_POLICY.LEGAL.capability));
  assert.equal(first.decision_status, "PENDING");
  assert.equal(second.version, 2);
  assert.equal(second.supersedes_decision_id, first.review_decision_id);
  assert.equal(ctx.decisions.length, 2);
  assert.ok(ctx.audits.some((event) => event.action_type.endsWith("review_decision_superseded")));
  assert.ok(ctx.audits.some((event) => event.action_type.endsWith("review_decision_recorded")));
  assert.equal(ctx.audits.length, 3);
  assert.equal(ctx.packet.current_readiness, "YELLOW");
  assert.equal(ctx.packet.current_sellability, "PILOT");
});

test("expected review versions reject stale writers and funding decisions cannot claim customer eligibility or awards", async () => {
  const ctx = harness();
  const base = { candidateId: ctx.packet.candidate_id, commercialProductId: ctx.packet.commercial_product_id, gateType: "LEGAL", reviewedAt: generatedAt };
  const first = await ctx.service.recordDecision({ ...base, decisionStatus: "PENDING", expectedVersion: 0 }, actor(REVIEW_GATE_POLICY.LEGAL.capability));
  await assert.rejects(ctx.service.recordDecision({ ...base, decisionStatus: "BLOCKED", decisionReason: "Blocked pending review.", supersedesDecisionId: first.review_decision_id, expectedVersion: 0 }, actor(REVIEW_GATE_POLICY.LEGAL.capability)), (error: any) => error.code === "REVIEW_SUPERSESSION_CONFLICT");
  assert.equal(ctx.decisions.length, 1);

  const fundingInput = { candidateId: ctx.packet.candidate_id, commercialProductId: ctx.packet.commercial_product_id, gateType: "FUNDING", decisionStatus: "PENDING", decisionReason: "Customer is eligible for a grant award.", reviewedAt: generatedAt };
  await assert.rejects(ctx.service.recordDecision(fundingInput, actor(REVIEW_GATE_POLICY.FUNDING.capability)), (error: any) => error.code === "FUNDING_ELIGIBILITY_NOT_REGISTRY_AUTHORITY");
  assert.equal(ctx.decisions.length, 1);
});

test("system actors cannot approve and unsupported financial or funding fields are rejected by the input contract", async () => {
  const ctx = harness();
  const input = { candidateId: ctx.packet.candidate_id, commercialProductId: ctx.packet.commercial_product_id, gateType: "PRICING", decisionStatus: "APPROVED", decisionReason: "Reference only", authorityType: "APPROVED_PRICING_AUTHORITY", authorityReference: "pricing:review", evidenceReferences: ["pricing:policy"], reviewedAt: generatedAt };
  await assert.rejects(ctx.service.recordDecision(input, { ...actor(REVIEW_GATE_POLICY.PRICING.capability), actor_system_id: "codex" }), (error: any) => error.code === "REVIEW_HUMAN_ACTOR_REQUIRED");
  await assert.rejects(ctx.service.recordDecision({ ...input, priceAmount: 100 }, actor(REVIEW_GATE_POLICY.PRICING.capability)), (error: any) => error.code === "REVIEW_INPUT_FIELD_FORBIDDEN");
  await assert.rejects(ctx.service.recordDecision({ ...input, eligibilityStatus: "ELIGIBLE" }, actor(REVIEW_GATE_POLICY.PRICING.capability)), (error: any) => error.code === "REVIEW_INPUT_FIELD_FORBIDDEN");
});

test("source resolution requires a source capability, authority reference, evidence, and non-demo authority", async () => {
  const ctx = harness(packets.find((packet) => packet.candidate_id === "cc-005")!);
  const base = { candidateId: ctx.packet.candidate_id, commercialProductId: ctx.packet.commercial_product_id, resolvedAt: generatedAt };
  await assert.rejects(ctx.service.recordSourceResolution({ ...base, resolutionStatus: "RESOLVED" }, actor("commercial_product.edit")), (error: any) => error.code === "REVIEW_CAPABILITY_REQUIRED");
  await assert.rejects(ctx.service.recordSourceResolution({ ...base, resolutionStatus: "RESOLVED", authorityDomain: "CURRICULUM", authorityReference: "src/data/demo-catalog.json", evidenceReference: "evidence:1" }, actor("commercial_product.review_source_authority")), (error: any) => error.code === "SOURCE_RESOLUTION_REFERENCE_NOT_AUTHORITATIVE");
  await assert.rejects(ctx.service.recordSourceResolution({ ...base, resolutionStatus: "RESOLVED", authorityDomain: "CURRICULUM", authorityReference: "curriculum:record:pd-1", evidenceReference: "evidence:verified:1", remainingRequirements: ["owner signoff"] }, actor("commercial_product.review_source_authority")), (error: any) => error.code === "SOURCE_RESOLUTION_REQUIREMENTS_REMAIN");
  const row = await ctx.service.recordSourceResolution({ ...base, resolutionStatus: "RESOLVED", authorityDomain: "CURRICULUM", authorityReference: "curriculum:record:pd-1", authorityVersion: "v3", evidenceReference: "evidence:verified:1" }, actor("commercial_product.review_source_authority"));
  assert.equal(row.resolution_status, "RESOLVED");
  assert.equal(ctx.resolutions.length, 1);
  assert.ok(ctx.audits.some((event) => event.action_type.endsWith("source_resolution_recorded")));
});

test("source resolution requires both source capability and candidate source assignment, not review-gate assignment", async () => {
  const sourcePacket = packets.find((packet) => packet.candidate_id === "cc-005")!;
  const ctx = harness(sourcePacket, (input: any) => input.candidateId === "cc-005" && input.gateType === "SOURCE_AUTHORITY");
  const sourceBase = { commercialProductId: sourcePacket.commercial_product_id, resolutionStatus: "UNRESOLVED", resolutionReason: "Still missing authority.", resolvedAt: generatedAt };
  await assert.rejects(ctx.service.recordSourceResolution({ ...sourceBase, candidateId: "cc-006", commercialProductId: identityMap.get("cc-006") }, actor("commercial_product.review_source_authority")), (error: any) => error.code === "REVIEW_ASSIGNMENT_REQUIRED");
  const resolved = await ctx.service.recordSourceResolution({ ...sourceBase, candidateId: "cc-005" }, actor("commercial_product.review_source_authority"));
  assert.equal(resolved.review_assignment_id, "test-assignment");
  await assert.rejects(ctx.service.recordDecision({ candidateId: "cc-005", commercialProductId: sourcePacket.commercial_product_id, gateType: "LEGAL", decisionStatus: "PENDING", reviewedAt: generatedAt }, actor(REVIEW_GATE_POLICY.LEGAL.capability)), (error: any) => error.code === "REVIEW_ASSIGNMENT_REQUIRED");
});

test("reassessment reflects gate/source history and never emits readiness or sellability upgrades", () => {
  const base: any = {
    candidate_id: "cc-999", commercial_product_id: "cp_review_case", candidate_name: "Test only", family: "CORE_EDUCATION",
    current_lifecycle: "REVIEW", current_readiness: "YELLOW", current_sellability: "PILOT", source_resolution_status: "SOURCE_UNRESOLVED",
    resolved_source_authorities: [], unresolved_source_requirements: [{ required_evidence: "canonical authority" }], selling_entity: "SHS", delivery_entity: "SHS",
    regulated_metadata: {}, current_review_gates: [{ gate_type: "LEGAL", status: "PENDING" }], required_reviewers: [], required_evidence: [], existing_evidence_references: [],
    unresolved_blockers: [], review_notes: [], decision_history_references: [], production_onboarding_eligibility: false, contract_valid: true, packet_version: 1, generated_at: generatedAt,
  };
  const pending = reassessReviewPacket(base, []);
  assert.equal(pending.source_status, "SOURCE_UNRESOLVED");
  assert.equal(pending.review_status, "REVIEW_PENDING");
  assert.equal(pending.production_onboarding_eligibility, false);
  const resolved = reassessReviewPacket(base, [{ gate_type: "LEGAL", decision_status: "APPROVED" }], { resolution_status: "RESOLVED", remaining_requirements: [] });
  assert.equal(resolved.source_status, "SOURCE_RESOLVED");
  assert.equal(resolved.review_status, "REVIEW_RESOLVED");
  assert.equal(resolved.production_onboarding_eligibility, true);
  assert.ok(!("readiness" in resolved) && !("sellability" in resolved) && !("SELL_NOW" in resolved) && !("GREEN" in resolved));
  const stale = reassessReviewPacket(base, [{ gate_type: "LEGAL", decision_status: "APPROVED", expires_at: "2026-10-04T00:00:00.000Z" }], { resolution_status: "STALE" }, generatedAt);
  assert.equal(stale.source_status, "SOURCE_STALE");
  assert.deepEqual(stale.stale_gates, ["LEGAL"]);
  assert.equal(stale.production_onboarding_eligibility, false);
});

test("decision and source resolution contract enum and authority requirements are explicit", () => {
  assert.throws(() => validateDecisionInput({ gateType: "OTHER", decisionStatus: "APPROVED", reviewedAt: generatedAt }, []), /REVIEW_GATE_TYPE_INVALID/);
  assert.throws(() => validateDecisionInput({ gateType: "LEGAL", decisionStatus: "APPROVED", reviewedAt: generatedAt }, REVIEW_GATE_POLICY.LEGAL.authorityTypes), /REVIEW_APPROVAL_AUTHORITY_REQUIRED/);
  assert.throws(() => validateSourceResolutionInput({ resolutionStatus: "RESOLVED", resolvedAt: generatedAt }), /SOURCE_RESOLUTION_AUTHORITY_REQUIRED/);
  assert.equal(validateSourceResolutionInput({ resolutionStatus: "STALE", resolutionReason: "Expired", resolvedAt: generatedAt }).resolutionStatus, "STALE");
});

test("status summary projects source, review, blocked, stale, and eligibility counts without sales states", () => {
  const counts = summarizeReviewAssessments([
    { source_status: "SOURCE_RESOLVED", review_status: "REVIEW_PARTIALLY_RESOLVED", blocking_gates: [], stale_gates: [], production_onboarding_eligibility: false },
    { source_status: "SOURCE_STALE", review_status: "REVIEW_PENDING", blocking_gates: ["LEGAL"], stale_gates: ["PRICING"], production_onboarding_eligibility: false },
    { source_status: "SOURCE_RESOLVED", review_status: "REVIEW_RESOLVED", blocking_gates: [], stale_gates: [], production_onboarding_eligibility: true },
  ]);
  assert.deepEqual(counts, { total: 3, source_resolved: 2, source_unresolved: 1, review_pending: 1, review_partially_resolved: 1, review_resolved: 1, blocked: 1, stale: 1, production_onboarding_eligible: 1 });
  assert.ok(!("SELL_NOW" in counts) && !("GREEN" in counts));
});
