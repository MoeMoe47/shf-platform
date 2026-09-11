import assert from "node:assert/strict";
import test from "node:test";
import { isPublicOpportunityCandidate } from "../src/domain/opportunities/service/public-visibility.js";

test("public visibility predicate rejects every non-public or unsafe state", () => {
  const base = { status: "OPEN", publicVisibility: "PUBLIC", audienceScope: "ORGANIZATION", actionUrl: "https://example.org", applicationDeadline: "2099-01-01" };
  assert.equal(isPublicOpportunityCandidate(base, "2026-01-01"), true);
  for (const patch of [
    { publicVisibility: "PRIVATE" }, { status: "DRAFT" }, { status: "CLOSED" },
    { audienceScope: "PROGRAM", programId: "program-private" }, { audienceScope: "COHORT", cohortId: "cohort-private" },
    { actionUrl: null, actionRoute: null }, { applicationDeadline: "2025-01-01" },
  ]) assert.equal(isPublicOpportunityCandidate({ ...base, ...patch }, "2026-01-01"), false);
});
