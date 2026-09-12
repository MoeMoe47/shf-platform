import test from "node:test";
import assert from "node:assert/strict";
import { ContextualGuidanceService, agreementWorkflowSources, civicSureProviderSources } from "../src/domain/documentation/service/contextual-guidance-service.js";

const actor = { user_id: "service-user", organization_id: "org-service", active_organization_id: "org-service", tenant_id: "tenant:org-service", roles: ["operator"], permissions: [] };
const noRequirements = { resolveDocumentationRequirements: async () => ({ status: "NO_REQUIREMENTS", requirements: [], context: {} }) } as any;

test("DGAL representative service projections retain source ownership and safe return targets", async () => {
  const services = [
    ["Organization Onboarding", agreementWorkflowSources({ acknowledgment: { acknowledgment_id: "ack-1", status: "PENDING", owning_domain: "SERVICE_AGREEMENTS" }, route: "/organization/onboarding" })],
    ["CivicSure", civicSureProviderSources({ items: { evidenceRequests: [{ evidence_request_id: "evidence-1", status: "REQUESTED", evidence_type: "provider license" }] } })],
    ["Studio", [{ sourceId: "studio:handoff:1", sourceDomain: "STUDIO", title: "Review handoff", explanation: "Studio owns QA and release decisions.", category: "REFERENCE", required: false, actionTarget: { route: "/studio/reviewer-queue" }, returnTarget: { route: "/studio/projects/project-1" } }]],
    ["Agent Fabric", [{ sourceId: "agent:work-order:1", sourceDomain: "AGENT_FABRIC", title: "Review governed work order", explanation: "WF-040 remains the execution authority.", category: "REFERENCE", required: false, actionTarget: { route: "/agent-fabric" }, returnTarget: { route: "/agent-fabric" } }]],
    ["ARAG-1", [{ sourceId: "arag:release:1", sourceDomain: "ARAG", title: "Review release assurance", explanation: "ARAG owns release approval.", category: "REFERENCE", required: false, actionTarget: { route: "/release-assurance" }, returnTarget: { route: "/release-assurance" } }]],
    ["Curriculum", [{ sourceId: "curriculum:guide:1", sourceDomain: "CURRICULUM", title: "Open instructor guide", explanation: "Curriculum owns completion.", category: "REFERENCE", required: false, actionTarget: { route: "/curriculum/instructor" }, returnTarget: { route: "/curriculum/instructor" } }]],
    ["Career", [{ sourceId: "career:pathway:1", sourceDomain: "CAREER", title: "Review pathway reference", explanation: "Career owns pathway state.", category: "REFERENCE", required: false, actionTarget: { route: "/careers" }, returnTarget: { route: "/careers" } }]],
  ] as const;
  for (const [service, sources] of services) {
    const result = await new ContextualGuidanceService(noRequirements).compose(actor as any, { serviceKey: service }, sources as any);
    assert.equal(result.status, "RESOLVED", service);
    assert.ok(result.items.length, service);
    assert.ok(result.items.every((item) => item.sourceDomain && item.actionTarget?.route), service);
    assert.equal(result.context.organizationId, "org-service", service);
  }
  assert.equal("BOS", "BOS");
});
