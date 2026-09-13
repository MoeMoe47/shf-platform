import assert from "node:assert/strict";
import test from "node:test";
import { OrientationContextService } from "../src/domain/orientation/service/orientation-context-service.js";
import type { OrientationActor } from "../src/domain/orientation/model/orientation-resolver.js";

const actor = (overrides: Partial<OrientationActor> = {}): OrientationActor => ({
  user_id: "user-a",
  organization_id: "org-a",
  active_organization_id: "org-a",
  tenant_id: "tenant:org-a",
  roles: ["student"],
  permissions: ["assignment.view"],
  ...overrides,
});

const dgal = async () => ({
  status: "RESOLVED",
  items: [{ guidanceId: "dgal:assignment", sourceId: "dgal:assignment", sourceDomain: "DGAL", title: "Open assignment", explanation: "Your assignment is ready.", category: "REQUIRED_NOW", required: true, priority: 2, canonicalKey: "assignment" }],
});

test("resolver composes a student slice from server actor, DGAL, and domain action sources", async () => {
  const resolver = new OrientationContextService();
  const result = await resolver.resolve(actor(), { destinationId: "curriculum", routeId: "curriculum.dashboard" }, {
    resolveDgal: dgal,
    resolveNextActions: async () => [{ id: "assignment:open", title: "Open assignment", state: "REQUIRED", required: true, priority: 1, source: { sourceId: "assignment-1", sourceDomain: "CURRICULUM" }, actionTarget: { route: "/curriculum.html#/dashboard" } }],
  });
  assert.equal(result.status, "RESOLVED");
  assert.equal(result.context.organizationId, "org-a");
  assert.equal(result.orientation?.presentation, "FIRST_TIME_ORIENTATION");
  assert.equal(result.checklist[0].completionSource, "DOMAIN_STATE");
  assert.equal(result.contextualGuidance.length, 2);
  assert.equal(result.orientation?.source.sourceDomain, "OGL");
});

test("resolver does not trust forged role or permission hints and filters unauthorized audiences", async () => {
  const resolver = new OrientationContextService();
  const result = await resolver.resolve(actor({ roles: ["org_admin"], permissions: ["documentation.center.view"] }), { destinationId: "curriculum" }, { resolveDgal: dgal });
  assert.equal(result.status, "FORBIDDEN");
  assert.equal(result.orientation, null);
});

test("resolver fails closed when active organization scope is invalid", async () => {
  const resolver = new OrientationContextService();
  await assert.rejects(() => resolver.resolve(actor({ tenant_id: "tenant:org-b" }), { destinationId: "curriculum" }, { resolveDgal: dgal }), /ORG_CONTEXT_REQUIRED/);
});

test("resolver reports DGAL source failure honestly and preserves safe orientation metadata", async () => {
  const resolver = new OrientationContextService();
  const result = await resolver.resolve(actor(), { destinationId: "curriculum", priorOrientationVersion: 1 }, { resolveDgal: async () => { throw new Error("dgal unavailable"); } });
  assert.equal(result.status, "PARTIAL");
  assert.equal(result.documentation.status, "UNAVAILABLE");
  assert.equal(result.orientation?.presentation, "CONTEXTUAL_GUIDANCE");
  assert.equal(result.contextualGuidance.some((item) => item.title === "No documents required"), false);
});

test("resolver applies deterministic order, deduplication, and reorientation metadata", async () => {
  const resolver = new OrientationContextService();
  const result = await resolver.resolve(actor(), { destinationId: "curriculum", priorOrientationVersion: 0 }, {
    resolveDgal: async () => ({ status: "RESOLVED", items: [{ guidanceId: "same", sourceId: "dgal:same", sourceDomain: "DGAL", title: "Same action", category: "OPTIONAL", required: false, priority: 50, canonicalKey: "same" }] }),
    resolveNextActions: async () => [{ id: "same", title: "Same action", state: "OPTIONAL", source: { sourceId: "domain:same", sourceDomain: "CURRICULUM" }, priority: 60 }],
  });
  assert.equal(result.reorientation.policy, "RECOMMENDED");
  assert.equal(result.orientation?.presentation, "REORIENTATION");
  assert.equal(result.contextualGuidance.filter((item) => item.title === "Same action").length, 1);
  assert.equal(result.contextualGuidance[0].title, "What's changed");
});

test("resolver supports test-only service projections without creating workflow state", async () => {
  const onboarding = { orientationId: "orientation:onboarding:applicant", destinationId: "onboarding", owningService: "organization-onboarding", version: 1, lifecycle: "ACTIVE", visibility: "ROLE_SCOPED", roles: ["applicant"], permissions: ["organization.onboarding.view"], title: "Organization onboarding", purpose: "Complete the next onboarding step.", tier: "TIER_A", tourId: null, accessibleAlternativeRef: { kind: "DGAL_GUIDANCE", id: "onboarding:steps" }, dgalReferences: [], companionTopics: ["onboarding next step"], safeActions: { open: { destinationId: "onboarding", routeId: "onboarding.application" } }, reorientation: { policy: "OPTIONAL", changeClassification: "WORKFLOW_SIGNIFICANT" } } as const;
  const result = await new OrientationContextService([onboarding]).resolve(actor({ roles: ["applicant"], permissions: ["organization.onboarding.view"] }), { destinationId: "onboarding" }, { resolveDgal: async () => ({ status: "NO_REQUIREMENTS", items: [] }), resolveNextActions: async () => [] });
  assert.equal(result.status, "RESOLVED");
  assert.equal(result.context.serviceKey, "organization-onboarding");
  assert.equal(result.orientation?.presentation, "FIRST_TIME_ORIENTATION");
  assert.equal("workflowComplete" in result, false);
});

test("resolver selects the CivicSure provider slice from canonical permission context", async () => {
  const result = await new OrientationContextService().resolve(actor({ roles: [], permissions: ["government.assurance.provider.self_service.view"] }), { destinationId: "civic", serviceKey: "ignored-client-hint" }, { resolveDgal: async () => ({ status: "NO_REQUIREMENTS", items: [] }) });
  assert.equal(result.status, "RESOLVED");
  assert.equal(result.context.serviceKey, "civicsure");
  assert.equal(result.orientation?.source.sourceDomain, "OGL");
  assert.equal(result.orientation?.safeActions.openWorkspace.destinationId, "civic");
});

test("resolver selects the CivicSure operator slice without granting verification authority", async () => {
  const result = await new OrientationContextService().resolve(actor({ roles: ["operator"], permissions: ["verification.view"] }), { destinationId: "civic", routeId: "civicsure.operator.verification" }, { resolveDgal: async () => ({ status: "NO_REQUIREMENTS", items: [] }) });
  assert.equal(result.status, "RESOLVED");
  assert.equal(result.orientation?.orientationId, "orientation:civicsure:operator");
  assert.equal(result.context.serviceKey, "civicsure");
  assert.equal("verify" in result, false);
  assert.equal("approve" in result, false);
});

test("resolver selects governed Agent Fabric guidance without granting execution authority", async () => {
  const result = await new OrientationContextService().resolve(actor({ roles: ["reviewer"], permissions: ["audit.view"] }), { destinationId: "agent-fabric" }, { resolveDgal: async () => ({ status: "NO_REQUIREMENTS", items: [] }) });
  assert.equal(result.status, "RESOLVED");
  assert.equal(result.context.serviceKey, "agent-fabric");
  assert.equal(result.orientation?.safeActions.openWorkspace.routeId, "agent-fabric.operator.workspace");
  assert.equal("execute" in result, false);
});
