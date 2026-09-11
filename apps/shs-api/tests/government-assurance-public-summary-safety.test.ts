import test from "node:test";
import assert from "node:assert/strict";
import { PilotReportingService } from "../src/domain/government-assurance/service/pilot-reporting-service.js";

test("public GPA summary fails closed with a safe unpublished projection when scope is omitted", async () => {
  const result = await new PilotReportingService().publicSummary();
  assert.equal(result.availability, "NOT_PUBLISHED");
  assert.deepEqual(result.items, []);
  assert.deepEqual(result.scope, { jurisdiction: null });
  assert.equal(Object.prototype.hasOwnProperty.call(result, "warnings"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, "signals"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, "moneyAtRisk"), false);
});
