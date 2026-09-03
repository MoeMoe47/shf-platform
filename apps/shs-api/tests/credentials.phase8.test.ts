import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase8_${Date.now()}`;
const ADMIN = "user_admin_001";
const LEARNER = "user_no_assignment_001";

async function api(path: string, opts: { method?: string; userId?: string; body?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer dev-token:${opts.userId || ADMIN}` },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function createDefinition(slug: string) {
  return api("/credentials/definitions", { method: "POST", body: {
    slug: `${RUN}-${slug}`, name: `${RUN} ${slug}`, credentialType: "INTERNAL",
    issuingAuthority: "Silicon Heartland Foundation",
  } });
}

async function cleanup() {
  await query("DELETE FROM learner_credentials WHERE credential_definition_id IN (SELECT credential_definition_id FROM credential_definitions WHERE slug LIKE $1)", [`${RUN}-%`]);
  await query("DELETE FROM integration_outbox WHERE producer_id='shs-api.credentials' AND payload_json->'payload'->>'credential_definition_id' IN (SELECT credential_definition_id FROM credential_definitions WHERE slug LIKE $1)", [`${RUN}-%`]);
  await query("DELETE FROM credential_definitions WHERE slug LIKE $1", [`${RUN}-%`]);
}

before(cleanup);
after(cleanup);

test("Phase 8 issuance stores bounded provenance/hash and one issued event", async () => {
  const definition = await createDefinition("provenance");
  assert.equal(definition.status, 201);
  const issued = await api("/credentials/issue", { method: "POST", body: {
    credentialDefinitionId: definition.json.data.id, learnerUserId: LEARNER,
    status: "ISSUED", issuer: "forged", verificationHash: "forged",
  } });
  assert.equal(issued.status, 201);
  assert.equal(issued.json.data.credentialVersion, 1);
  assert.equal(issued.json.data.provenance.policy, "MANUAL_INSTITUTIONAL_ISSUANCE");
  assert.match(issued.json.data.verificationHash, /^[0-9a-f]{64}$/);
  const event = await query("SELECT event_type, payload_json FROM integration_outbox WHERE producer_id='shs-api.credentials' AND subject_id=$1", [issued.json.data.id]);
  assert.equal(event.rows.filter((row: any) => row.event_type === "credential.issued").length, 1);
  assert.equal(event.rows[0].payload_json.payload.provenance_policy, "MANUAL_INSTITUTIONAL_ISSUANCE");
});

test("Phase 8 concurrent issuance is bounded by the canonical active identity", async () => {
  const definition = await createDefinition("concurrent");
  assert.equal(definition.status, 201);
  const results = await Promise.all([1, 2, 3].map(() => api("/credentials/issue", { method: "POST", body: {
    credentialDefinitionId: definition.json.data.id, learnerUserId: LEARNER,
  } })));
  assert.equal(results.filter((result) => result.status === 201).length, 1);
  assert.equal(results.filter((result) => result.status === 409).length, 2);
  const rows = await query("SELECT COUNT(*)::int AS count FROM learner_credentials WHERE credential_definition_id=$1 AND learner_user_id=$2 AND status='ISSUED'", [definition.json.data.id, LEARNER]);
  assert.equal(rows.rows[0].count, 1);
});
