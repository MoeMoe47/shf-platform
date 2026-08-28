import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const boundary = fs.readFileSync(new URL("../docs/SHF_TRUTH_PUBLIC_APPROVAL_REPORT_GOVERNANCE_BOUNDARY.md", import.meta.url), "utf8");
const truth = fs.readFileSync(new URL("../services/shf-agent-fabric/services/truth_spine_service.py", import.meta.url), "utf8");
const metric = fs.readFileSync(new URL("../services/shf-agent-fabric/contracts/reporting/metric_registry.v1.json", import.meta.url), "utf8");
const disclosure = fs.readFileSync(new URL("../apps/shs-api/src/domain/reporting/report-public-disclosure-service.ts", import.meta.url), "utf8");
const impact = fs.readFileSync(new URL("../src/data/shfImpactData.js", import.meta.url), "utf8");

test("Truth public approval and report disclosure are distinct gates", () => {
  assert.match(boundary, /Classification: `TWO_DISTINCT_PUBLIC_GATES`/);
  assert.match(truth, /def approve_public\(/);
  assert.match(truth, /public_approved.*verification_status == "verified"/s);
  assert.match(metric, /"claim_approval_requirement": "public_approved"/);
  assert.match(disclosure, /PUBLIC_DISCLOSURE_APPROVED/);
  assert.match(boundary, /does not write Truth records or mutate/);
});

test("claim approval is versioned and separately permissioned", () => {
  assert.match(truth, /new_claim\["public_approved"\] = False/);
  assert.match(truth, /claim\.public_approved/);
  assert.match(boundary, /truth\.claim\.approve_public/);
  assert.match(boundary, /reports\.public_eligibility\.manage/);
  assert.match(boundary, /reports\.public_disclosure\.manage/);
});

test("aggregate disclosure cannot expose or mutate participant Truth", () => {
  assert.match(boundary, /must never copy or expose `subject_id`/);
  assert.match(boundary, /Suppression changes only the public representation/);
  assert.match(disclosure, /review_context/);
  assert.doesNotMatch(disclosure, /truth_spine_service/);
  assert.doesNotMatch(impact, /publicApproved: true/);
  assert.match(impact, /publicApproved === true/);
});

test("publication and non-Truth systems remain outside approval authority", () => {
  assert.match(boundary, /PUBLICATION_AUTHORIZED.*PUBLISHED/s);
  assert.match(boundary, /Impact Data Spine remains projection-only/);
  assert.match(boundary, /Oracle and AI.*cannot approve Truth claims/s);
  assert.match(boundary, /No Public Impact Snapshot connection/);
});
