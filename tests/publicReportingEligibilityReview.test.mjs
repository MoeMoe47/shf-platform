import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const contract = fs.readFileSync(new URL("../docs/SHF_PUBLIC_REPORTING_ELIGIBILITY_CONTRACT.md", import.meta.url), "utf8");
const impactData = fs.readFileSync(new URL("../src/data/shfImpactData.js", import.meta.url), "utf8");
const command = fs.readFileSync(new URL("../src/pages/shf-command/SHFImpactCommandCenter.jsx", import.meta.url), "utf8");

test("public eligibility remains separate from internal Truth approval", () => {
  assert.match(contract, /Internal approval is not public eligibility/);
  assert.match(contract, /`public_approved` is a separate server-owned state and cannot be/);
  assert.match(contract, /PUBLIC_DISCLOSURE_APPROVED/);
  assert.match(contract, /PUBLICATION_AUTHORIZED.*PUBLISHED/s);
});

test("all report candidates retain bounded semantics and disclosure gating", () => {
  for (const id of [
    "curriculum.lesson.completion_count.v1",
    "hub.referral.created_count.v1",
    "exchange.funding.commitment_count.v1",
    "workforce.employment.started_verified_count.v1",
  ]) assert.match(contract, new RegExp(id.replaceAll(".", "\\.")));
  assert.match(contract, /threshold is invented by this contract/);
  assert.match(contract, /PUBLIC_ELIGIBLE_WITH_DISCLOSURE_POLICY/);
  assert.match(contract, /INTERNAL_ONLY/);
});

test("Impact Data Spine and public snapshot remain fail-closed", () => {
  assert.match(contract, /public projection layer over approved canonical/);
  assert.match(contract, /static records are retained as `Sample`\/`Draft` demo data/);
  assert.match(contract, /remains\s+`PUBLIC_APPROVAL_REQUIRED`/);
  assert.match(command, /Public Impact Snapshot/);
  assert.doesNotMatch(impactData, /publicApproved: true/);
  assert.match(impactData, /publicApproved: false/);
  assert.match(impactData, /dataStatus: "Sample"/);
});

test("Oracle and frontend cannot become public approval authority", () => {
  assert.match(contract, /Oracle.*cannot create values, change formulas, infer\s+impact, approve disclosure/s);
  assert.match(contract, /frontend, Metric Registry, Reporting Service, Oracle, and generated narrative/);
  assert.match(contract, /No public shortcut may read operational records/);
});

test("curriculum public eligibility remains separate from Truth claim approval", () => {
  assert.match(contract, /curriculum\.lesson\.completion_count\.v1/);
  assert.match(contract, /server-owned,\s+report\/version-bound eligibility authority/);
  assert.match(contract, /distinct from viewing, exporting, distributing, and Truth claim public\s+approval/);
  assert.match(contract, /Privacy approval and publication remain separate gates/);
  assert.doesNotMatch(contract, /PUBLIC_IMPACT_SNAPSHOT_CONNECTED/);
});
