import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const workflow = fs.readFileSync(new URL("../docs/SHF_HUB_TRUTH_PUBLIC_APPROVAL_WORKFLOW.md", import.meta.url), "utf8");
const truth = fs.readFileSync(new URL("../services/shf-agent-fabric/services/truth_spine_service.py", import.meta.url), "utf8");
const routes = fs.readFileSync(new URL("../services/shf-agent-fabric/routers/truth_routes.py", import.meta.url), "utf8");
const metric = fs.readFileSync(new URL("../services/shf-agent-fabric/contracts/reporting/metric_registry.v1.json", import.meta.url), "utf8");

test("Hub Truth identity and lifecycle are explicit and version-bound", () => {
  assert.match(workflow, /hub_referral_created/);
  assert.match(workflow, /referral_created/);
  assert.match(workflow, /lineage\.hub\.referral\.created\.v1/);
  assert.match(truth, /new_claim\["public_approved"\] = False/);
  assert.match(truth, /claim\.version_created/);
  assert.match(metric, /"claim_approval_requirement": "internal_approved; public mode additionally requires canonical_public_visibility_predicate"/);
});

test("Hub public approval is blocked because the current flag also exposes raw claims", () => {
  assert.match(workflow, /HUB_PUBLIC_APPROVED_SEMANTICS_UNSAFE_FOR_PARTICIPANT_LINKED_TRUTH/);
  assert.match(workflow, /no separate\nclaim state.*aggregate/i);
  assert.match(routes, /@router\.get\("\/public\/claims"\)/);
  assert.match(routes, /@router\.get\("\/public\/claims\/\{claim_id\}"\)/);
  assert.match(truth, /def is_publicly_visible\(/);
  assert.match(truth, /claim\.get\("public_approved"\) is not True/);
});

test("Hub approval remains separate from report governance and downstream publication", () => {
  assert.match(workflow, /truth\.claim\.approve_public/);
  assert.match(workflow, /No Hub claim may become raw-public `public_approved`/);
  assert.match(workflow, /no automatic report eligibility, disclosure, snapshot, publication/);
  assert.match(workflow, /Oracle\/AI cannot create or approve Truth claims/);
});
