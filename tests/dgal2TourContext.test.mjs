import test from "node:test";
import assert from "node:assert/strict";
import { createTourContext, createTourReturnTarget, isSafeTourRoute } from "../src/system/tour/tourContext.js";

test("tour context preserves bounded DGAL context and safe return targets", () => {
  assert.equal(isSafeTourRoute("/index.html#/civicsure/provider"), true);
  assert.equal(isSafeTourRoute("https://example.com"), false);
  assert.equal(isSafeTourRoute("javascript:alert(1)"), false);
  const context = createTourContext({
    tourId: "civicsure-provider",
    role: "provider",
    organizationId: "org-a",
    service: "civicsure",
    guidanceId: "civicsure:evidence-request:er-1",
    actionTarget: { route: "/index.html#/civicsure/provider", resourceType: "CIVICSURE_EVIDENCE_REQUEST", resourceId: "er-1" },
    returnTarget: { route: "/index.html#/civicsure/provider", service: "civicsure", workflow: "evidence", step: "request-er-1" },
  });
  assert.equal(context.tourId, "civicsure-provider");
  assert.equal(context.actionTarget.resourceId, "er-1");
  assert.equal(context.returnTarget.workflow, "evidence");
  assert.equal(createTourReturnTarget({ route: "//evil.example" }), null);
});
