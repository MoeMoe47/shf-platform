import test from "node:test";
import assert from "node:assert/strict";
import { AssuranceRiskWorkflowService } from "../src/domain/government-assurance/service/assurance-risk-workflow-service.js";

const ai = { userId: "wave3f-ai", organizationId: "wave3f-org", tenantId: "tenant:wave3f-org", actor_type: "AI", permissions: ["GOVERNMENT_ASSURANCE_MONITORING_MANAGE", "GOVERNMENT_ASSURANCE_FINDING_DETERMINE", "GOVERNMENT_ASSURANCE_DECISION_DETERMINE"] };

test("AI/system actors cannot transition or close consequential risk state", async () => {
  const workflow = new AssuranceRiskWorkflowService();
  await assert.rejects(() => workflow.transitionWarning(ai, "signal-1", { status: "ESCALATED" }), /GPA_DECISION_ACTOR_DENIED/);
  await assert.rejects(() => workflow.closeRemediation(ai, { correctiveActionId: "action-1", decisionReference: "decision-1", rationale: "attempt" }), /GPA_DECISION_ACTOR_DENIED/);
});
