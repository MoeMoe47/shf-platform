import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { REVIEW_GATE_STATUSES, REVIEW_GATE_TYPES } from "../src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts";

const repoRoot = path.resolve(import.meta.dirname, "../../..");
const reviewPath = path.join(repoRoot, "docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json");
const onboardingPath = path.join(repoRoot, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json");
const [review, onboarding] = await Promise.all([
  readFile(reviewPath, "utf8").then(JSON.parse),
  readFile(onboardingPath, "utf8").then(JSON.parse),
]);
const byId = new Map(review.candidates.map((candidate: any) => [candidate.candidate_id, candidate]));

test("4B review manifest contains all 32 candidates and the exact 8 baseline source gaps", () => {
  assert.equal(review.candidates.length, 32);
  assert.deepEqual(review.counts, {
    total_candidates: 32, source_resolved: 21, source_unresolved: 11, baseline_source_authority_missing: 8,
    review_resolved: 0, review_partially_resolved: 0, review_pending: 32, production_onboarding_candidate: 0, sell_now: 0, green: 0,
  });
  assert.deepEqual(review.candidates.filter((candidate: any) => onboarding.candidates.find((item: any) => item.candidate_id === candidate.candidate_id)?.onboarding_disposition === "SOURCE_AUTHORITY_MISSING").map((candidate: any) => candidate.candidate_id).sort(), ["cc-005", "cc-011", "cc-012", "cc-014", "cc-015", "cc-016", "cc-018", "cc-032"]);
});

test("resolved sources retain credible in-repository provenance and unresolved sources fail closed", () => {
  for (const candidate of review.candidates) {
    if (candidate.source_resolution_status === "SOURCE_RESOLVED") {
      assert.ok(candidate.resolved_source_authorities.length > 0, candidate.candidate_id);
      assert.ok(candidate.resolved_source_authorities.every((source: any) => source.source_record_id && source.source_provenance?.length), candidate.candidate_id);
    } else {
      assert.equal(candidate.production_onboarding_eligibility, false);
      assert.ok(candidate.unresolved_source_requirements.length, candidate.candidate_id);
    }
  }
  for (const id of ["cc-009", "cc-027", "cc-028"]) assert.equal(byId.get(id)?.source_resolution_status, "SOURCE_UNRESOLVED");
});

test("all canonical review gates and statuses validate; approval requires authority and reference", () => {
  for (const candidate of review.candidates) {
    assert.equal(candidate.review_gates.length, REVIEW_GATE_TYPES.length);
    for (const gate of candidate.review_gates) {
      assert.ok((REVIEW_GATE_TYPES as readonly string[]).includes(gate.gate_type));
      assert.ok((REVIEW_GATE_STATUSES as readonly string[]).includes(gate.status));
      if (gate.status === "APPROVED") {
        assert.ok(gate.authority?.authority && gate.reference, `${candidate.candidate_id}:${gate.gate_type}`);
      }
    }
  }
  assert.ok(review.candidates.every((candidate: any) => !candidate.review_gates.some((gate: any) => gate.status === "APPROVED")));
});

test("readiness and sellability exactly preserve the audited states", () => {
  const totals = (rows: any[], field: string) => Object.fromEntries([...new Set(rows.map((row) => row[field]))].map((value) => [value, rows.filter((row) => row[field] === value).length]));
  assert.deepEqual(totals(review.candidates, "readiness"), { YELLOW: 10, UNKNOWN: 18, RED: 4 });
  assert.deepEqual(totals(review.candidates, "sellability"), { PILOT: 10, DEVELOP: 12, NEEDS_REVIEW: 6, NOT_SELLABLE: 4 });
  assert.equal(review.counts.sell_now, 0);
  assert.equal(review.counts.green, 0);
});

test("regulated, funding, pricing, margin, commission, and entitlement boundaries remain intact", () => {
  for (const candidate of review.candidates) {
    assert.equal(candidate.funding_review.limitation, "Product compatibility only; no customer eligibility, award approval, or guarantee.");
    assert.equal(candidate.pricing_review.numeric_price_present, false);
    assert.equal(candidate.margin_review.numeric_margin_present, false);
    assert.equal(candidate.commission_review.commission_numeric_present, false);
    assert.equal(candidate.commission_review.recruiting_revenue, false);
    assert.equal(candidate.entitlement_review.limitation, "Entitlement definitions remain external to Product Registry.");
    if (candidate.regulated_review.required) assert.equal(candidate.regulated_review.external_authority, null);
  }
});

test("production onboarding eligibility is distinct from sellability and remains false", () => {
  assert.ok(review.candidates.some((candidate: any) => candidate.sellability === "PILOT"));
  assert.ok(review.candidates.some((candidate: any) => candidate.sellability === "DEVELOP"));
  assert.ok(review.candidates.every((candidate: any) => candidate.production_onboarding_eligibility === false));
  assert.ok(review.candidates.every((candidate: any) => candidate.review_resolution_state !== "PRODUCTION_ONBOARDING_CANDIDATE"));
  assert.ok(review.candidates.every((candidate: any) => candidate.reviewed_at === null));
});

test("required authority and source-gap matrices exist and builder has no database write path", async () => {
  for (const filename of ["REVIEW_AUTHORITY_MATRIX.md", "8_SOURCE_AUTHORITY_GAPS.md", "32_CANDIDATE_REVIEW_MATRIX.md"]) {
    const content = await readFile(path.join(repoRoot, "docs/sales/commercial-product-registry-review", filename), "utf8");
    assert.ok(content.length > 100);
  }
  const builder = await readFile(path.join(repoRoot, "apps/shs-api/scripts/build-commercial-product-review-manifest.mjs"), "utf8");
  assert.doesNotMatch(builder, /DATABASE_URL|new Pool|INSERT INTO|\.query\(/);
});

test("4C adds no API route, runtime seed, migration seed, or production-onboarding execution path", async () => {
  const migration = await readFile(path.join(repoRoot, "apps/shs-api/migrations/155_commercial_product_human_review_history.sql"), "utf8");
  const service = await readFile(path.join(repoRoot, "apps/shs-api/src/domain/commercial-product-registry/review/commercial-product-review-service.ts"), "utf8");
  const router = await readFile(path.join(repoRoot, "apps/shs-api/src/api/router.ts"), "utf8");
  assert.doesNotMatch(migration, /INSERT\s+INTO\s+commercial_products|INSERT\s+INTO\s+commercial_product_review_decisions|INSERT\s+INTO\s+commercial_product_source_resolutions/i);
  assert.doesNotMatch(service, /onboard|createProduct|updateReadiness|updateSellability/i);
  assert.doesNotMatch(router, /commercial-product-review|review-decisions|source-resolutions/i);
});
