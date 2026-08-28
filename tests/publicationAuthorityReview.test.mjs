import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const contract = fs.readFileSync(new URL("../docs/SHF_PUBLICATION_AUTHORITY_CONTRACT.md", import.meta.url), "utf8");
const reporting = fs.readFileSync(new URL("../services/shf-agent-fabric/services/reporting_service.py", import.meta.url), "utf8");
const legacyPublish = fs.readFileSync(new URL("../services/shf-agent-fabric/routers/run_report_routes.py", import.meta.url), "utf8");
const permissions = fs.readFileSync(new URL("../apps/shs-api/src/auth/security-permissions.ts", import.meta.url), "utf8");
const routes = fs.readFileSync(new URL("../apps/shs-api/src/domain/reporting/routes.ts", import.meta.url), "utf8");

test("publication requires an immutable snapshot and remains separate from PUBLISHED", () => {
  assert.match(contract, /`PUBLICATION_AUTHORITY_READY`/);
  assert.match(contract, /PUBLICATION_AUTHORIZED.*PUBLISHED/s);
  assert.match(contract, /exact evaluated result\/snapshot ID/);
  assert.match(contract, /data-as-of timestamp/);
  assert.match(reporting, /report_result_id/);
  assert.match(reporting, /generated_at/);
  assert.match(contract, /later Truth changes can change the value/);
});

test("legacy publication code is not canonical SHF publication authority", () => {
  assert.match(legacyPublish, /@router\.post\("\/reports\/\{run_id\}\/publish"/);
  assert.match(legacyPublish, /published_report/);
  assert.match(legacyPublish, /report\.pdf/);
  assert.match(contract, /legacy run publication/);
  assert.match(routes, /publication-authorizations/);
  assert.doesNotMatch(routes, /\/reporting\/publication-authorizations[^\n]*publish/);
});

test("publication preserves upstream gates, suppression, and boundaries", () => {
  for (const value of [
    "public_approved",
    "PUBLIC_ELIGIBLE",
    "PUBLIC_DISCLOSURE_APPROVED",
    "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY",
    "<10",
    "12-month freshness",
    "Impact Data Spine remains projection-only",
  ]) assert.match(contract, new RegExp(value.replace(/[<>]/g, "\\$&")));
  assert.match(permissions, /REPORTS_PUBLISH/);
  assert.match(contract, /It must not reuse\nTruth approval, eligibility, disclosure/s);
  assert.match(contract, /No participant, Evidence, Source, or\s+Truth detail/);
});

test("no publication or snapshot behavior is connected in this review", () => {
  assert.match(contract, /Public Impact\s+Snapshot remains blocked/);
  assert.match(contract, /does not create `PUBLISHED`/);
  assert.match(contract, /actual publication separately/);
  assert.doesNotMatch(routes, /public URL|publish endpoint/i);
});
