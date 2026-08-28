import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const contract = fs.readFileSync(new URL("../docs/SHF_VERIFIED_OUTCOME_AUTHORITY_CONTRACT.md", import.meta.url), "utf8");
const submission = fs.readFileSync(new URL("../services/shf-agent-fabric/fabric/outcomes/schemas.py", import.meta.url), "utf8");
const store = fs.readFileSync(new URL("../services/shf-agent-fabric/fabric/outcomes/store.py", import.meta.url), "utf8");
const verifier = fs.readFileSync(new URL("../services/shf-agent-fabric/fabric/outcomes/verify.py", import.meta.url), "utf8");
const routes = fs.readFileSync(new URL("../services/shf-agent-fabric/routers/api_v1/outcomes_routes.py", import.meta.url), "utf8");
const impact = fs.readFileSync(new URL("../src/pages/shf-command/SHFImpactCommandCenter.jsx", import.meta.url), "utf8");

test("existing outcome submission is identified without overstating employment semantics", () => {
  assert.match(submission, /participant_id/);
  assert.match(submission, /program_id/);
  assert.match(submission, /outcome_type/);
  assert.match(submission, /artifact_ids/);
  assert.match(submission, /evidence_root_hash/);
  assert.match(routes, /\/api\/v1\/outcomes/);
  assert.match(store, /sqlite3/);
  assert.match(store, /outcome_submissions/);
  assert.match(verifier, /status = "VERIFIED"/);
  assert.match(verifier, /MVP/);
  assert.match(contract, /JOB_90D/);
  assert.match(contract, /not yet a canonical outcome fact/);
});

test("activity, advisory, and public boundaries remain explicit", () => {
  assert.match(contract, /referral\.created.*activity|referral\.created/);
  assert.match(contract, /lesson\.completed/);
  assert.match(contract, /funding_commitment\.committed/);
  assert.match(contract, /Oracle|Impact Data Spine/);
  assert.match(contract, /public_approved/);
  assert.match(contract, /generic\s+`ImpactRecord`/);
  assert.match(impact, /REPORTING_DATA_AVAILABLE = false/);
  assert.doesNotMatch(contract, /create.*Reporting Service endpoint/);
});
