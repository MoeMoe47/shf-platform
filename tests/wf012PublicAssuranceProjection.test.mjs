import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const explorer = readFileSync("apps/shf-web/src/pages/civicsure/explorer/CivicSureExplorerPage.jsx", "utf8");
const detail = readFileSync("apps/shf-web/src/pages/civicsure/explorer/CivicSureProgramDetailPage.jsx", "utf8");
const boundary = readFileSync("apps/shs-api/src/domain/government-assurance/adapters/public-projection-boundary.ts", "utf8");
const routes = readFileSync("apps/shs-api/src/domain/reporting/routes.ts", "utf8");

test("WF-012 active public consumer uses the canonical public projection", () => {
  assert.match(explorer, /listPublicAssuranceProjections/);
  assert.doesNotMatch(explorer, /civicsureExplorerMockData|ExplorerMetrics|ExplorerMapPanel|FollowTheMoneyCard/);
  assert.match(detail, /getPublicAssuranceProjection/);
  assert.doesNotMatch(detail, /programDetailMockData/);
  assert.match(routes, /\/public\/assurance\/projections/);
  assert.match(boundary, /source_type/);
  assert.match(boundary, /projection_status/);
  assert.match(boundary, /public_reference/);
});
