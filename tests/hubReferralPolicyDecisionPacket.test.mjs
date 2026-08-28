import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const packet = read("docs/SHF_PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY_POLICY_DECISION_PACKET.md");
const registry = read("apps/shs-api/src/domain/reporting/report-public-governance-registry.ts");
const disclosurePolicy = read("apps/shs-api/src/domain/reporting/report-public-disclosure-policy-service.ts");
const disclosure = read("apps/shs-api/src/domain/reporting/report-public-disclosure-service.ts");
const snapshot = read("apps/shs-api/src/domain/reporting/report-public-snapshot-service.ts");
const publication = read("apps/shs-api/src/domain/reporting/report-publication-service.ts");
const publicClient = read("src/shared/reporting/publicImpactReportingClient.js");

test("Hub policy packet binds the exact registered report and process-only semantics", () => {
  assert.match(packet, /report\.hub\.referral\.created_count\.v1/);
  assert.match(packet, /REFERRAL_CREATION_ACTIVITY/);
  assert.match(packet, /does not establish service delivery/);
  assert.match(packet, /does not establish[\s\S]*community impact/);
  assert.match(registry, /required_policy_key: "PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY"/);
  assert.match(registry, /public_governance_status: "POLICY_REQUIRED"/);
});

test("packet records approved Hub values without silently inheriting curriculum policy", () => {
  assert.match(packet, /not inherited silently/);
  assert.match(packet, /not inherited from curriculum/);
  assert.match(packet, /curriculum policy[\s\S]*not[\s\S]*applicable to Hub referrals/);
  assert.match(packet, /SELECTED FOR V1|APPROVED/);
  assert.match(packet, /POLICY STATUS:\*\* `APPROVED`/);
  assert.match(packet, /INSTITUTIONALLY APPROVED POLICY v1/);
});

test("packet addresses referral-specific privacy dimensions and schema gaps", () => {
  for (const term of [
    "referral category",
    "provider",
    "partner",
    "repeated releases",
    "longitudinal",
    "cross-metric",
    "complementary suppression",
    "SCHEMA_EXTENSION_REQUIRED",
  ]) assert.match(packet, new RegExp(term, "i"));
});

test("Hub remains blocked from disclosure, snapshot, publication, and public UI", () => {
  assert.match(registry, /PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY/);
  assert.match(disclosurePolicy, /validatePolicyBinding|registration\.required_policy_key/);
  assert.match(disclosure, /HUB_REFERRAL_ACTIVITY_V1/);
  assert.match(snapshot, /No public snapshot evaluator is registered for this report/);
  assert.match(publication, /registration\.required_policy_key/);
  assert.doesNotMatch(publicClient, /hub\.referral\.created_count/);
  assert.match(packet, /PUBLIC_DISCLOSURE_APPROVED:\*\* available only after exact report review/);
});

test("packet preserves existing curriculum and restricted-reporting boundaries", () => {
  assert.match(packet, /Curriculum public behavior/);
  assert.match(packet, /Donor Summary restricted path/);
  assert.match(packet, /public_approved/);
  assert.match(packet, /Oracle|AI/);
  assert.match(packet, /No schema extension is implemented/);
});
