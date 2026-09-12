import test from "node:test";
import assert from "node:assert/strict";
import { ContextualGuidanceService, GUIDANCE_CATEGORIES, civicSureProviderSources } from "../src/domain/documentation/service/contextual-guidance-service.js";

const actor = { user_id: "user-a", organization_id: "org-a", active_organization_id: "org-a", tenant_id: "tenant:org-a", roles: ["provider"], permissions: [] };

function requirement(overrides: Record<string, unknown> = {}) {
  return {
    requirementId: "rule-evidence", ruleKey: "evidence", requirementType: "REQUIRED_DOCUMENT", required: true,
    title: "Submit evidence", explanation: "CivicSure requires evidence before review.", sourceDomain: "CIVICSURE",
    sourceReference: "evidence-request-1", organizationId: "org-a", serviceKey: "civicsure", workflowType: "PROVIDER",
    workflowStage: "EVIDENCE", resourceType: "REQUEST", resourceId: "request-1", documentTypeId: "evidence", templateId: null,
    guidanceItemId: null, actionReference: "/index.html#/civicsure/provider", priority: 1, versionReference: null,
    sources: ["evidence-request-1"], ...overrides,
  } as any;
}

class FakeDgal {
  constructor(private readonly result: any) {}
  async resolveDocumentationRequirements() { return this.result; }
}

test("composition is deterministic, ordered, explainable, and deduplicated", async () => {
  const service = new ContextualGuidanceService(new FakeDgal({ status: "RESOLVED", requirements: [requirement()], context: {} }) as any);
  const result = await service.compose(actor, { serviceKey: "civicsure" }, [
    { sourceId: "civicsure:evidence-request:1", sourceDomain: "CIVICSURE", title: "Submit evidence", explanation: "Provide the assigned evidence.", category: GUIDANCE_CATEGORIES.REQUIRED_NOW, required: true, priority: 1, canonicalKey: "evidence", actionTarget: { route: "/index.html#/civicsure/provider" } },
    { sourceId: "studio:reference", sourceDomain: "STUDIO", title: "Studio guide", explanation: "Reference guide.", category: GUIDANCE_CATEGORIES.REFERENCE, priority: 50, actionTarget: { route: "/curriculum.html#/studio" } },
  ]);
  assert.equal(result.status, "RESOLVED");
  assert.deepEqual(result.items.map((item) => item.title), ["Submit evidence", "Studio guide"]);
  assert.equal(result.items[0].sourceReferences.length, 2);
  assert.equal(result.items[0].requirementReferences[0], "rule-evidence");
});

test("unknown mandatory context is not reported as no actions", async () => {
  const service = new ContextualGuidanceService(new FakeDgal({ status: "UNKNOWN", requirements: [], unresolved: ["service_entitlement"], context: {} }) as any);
  const result = await service.compose(actor, { serviceKey: "civicsure" });
  assert.equal(result.status, "UNKNOWN");
  assert.notEqual(result.status, "NO_ACTIONS");
  assert.deepEqual(result.unresolved, ["service_entitlement"]);
});

test("source unavailability and conflicts remain explicit", async () => {
  const available = new ContextualGuidanceService(new FakeDgal({ status: "NO_REQUIREMENTS", requirements: [], context: {} }) as any);
  const unavailable = await available.compose(actor, {}, [{ sourceId: "civicsure", sourceDomain: "CIVICSURE", title: "CivicSure", explanation: "Unavailable", category: GUIDANCE_CATEGORIES.REFERENCE, available: false, unavailableReason: "provider_timeout" }]);
  assert.equal(unavailable.status, "SOURCE_UNAVAILABLE");
  assert.deepEqual(unavailable.unavailableSources, ["CIVICSURE"]);

  const conflict = new ContextualGuidanceService(new FakeDgal({ status: "NO_REQUIREMENTS", requirements: [], context: {} }) as any);
  const result = await conflict.compose(actor, {}, [
    { sourceId: "a", sourceDomain: "A", title: "A", explanation: "A", category: GUIDANCE_CATEGORIES.REQUIRED_NOW, required: true, priority: 1, canonicalKey: "same" },
    { sourceId: "b", sourceDomain: "B", title: "B", explanation: "B", category: GUIDANCE_CATEGORIES.OPTIONAL, required: false, priority: 1, canonicalKey: "same" },
  ]);
  assert.equal(result.status, "CONFLICT");
});

test("CivicSure source adapter identifies provider and reviewer ownership", () => {
  const sources = civicSureProviderSources({ items: {
    evidenceRequests: [{ evidence_request_id: "er-1", evidence_type: "license", status: "OPEN", requirement_reference: "license" }, { evidence_request_id: "er-2", evidence_type: "policy", status: "SUBMITTED" }],
    findings: [{ finding_id: "f-1", finding_type: "quality", severity: "HIGH", status: "OPEN", description: "Respond", provider_response_state: "OPEN" }],
    correctiveActions: [{ corrective_action_id: "ca-1", status: "OPEN", required_action: "Correct it" }],
  } });
  assert.equal(sources.filter((item) => item.category === GUIDANCE_CATEGORIES.REQUIRED_NOW).length, 3);
  assert.equal(sources.find((item) => item.sourceId.endsWith("er-2"))?.waitingOn, "OPERATOR");
  assert.equal(sources.find((item) => item.sourceId.endsWith("er-1"))?.actionTarget?.route, "/index.html#/civicsure/provider");
  assert.equal(sources.find((item) => item.sourceId.endsWith("er-1"))?.returnTarget?.resourceId, "er-1");
});

test("unsafe action targets are rejected", async () => {
  const service = new ContextualGuidanceService(new FakeDgal({ status: "NO_REQUIREMENTS", requirements: [], context: {} }) as any);
  await assert.rejects(() => service.compose(actor, {}, [{ sourceId: "unsafe", sourceDomain: "TEST", title: "Unsafe", explanation: "", category: GUIDANCE_CATEGORIES.REFERENCE, actionTarget: { route: "https://example.com" } }]), /unsafe/);
});
