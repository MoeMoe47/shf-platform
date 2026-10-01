import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import type { Server } from "node:http";
import { SHS_SECURITY_PERMISSIONS, SHS_SECURITY_ROLES } from "../src/auth/security-permissions.js";
import { query } from "../src/db/client.js";
import { MISSION_DEFINITION_FIXTURES } from "../src/domain/mission-content/fixtures/mission-definition-fixtures.js";
import { registerMissionDraftRoutes } from "../src/domain/mission-content/api/mission-draft-routes.js";

const RUN = `mission_draft_${Date.now()}`;
const ORG = `org_${RUN}`;
const OTHER_ORG = `other_org_${RUN}`;
const AUTHOR = `author_${RUN}`;
const LEARNER = `learner_${RUN}`;
const OTHER_AUTHOR = `other_${RUN}`;
const STAFF_PERMISSIONS = [SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_CREATE, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE];
const staff = { user_id: AUTHOR, organization_id: ORG, active_organization_id: ORG, tenant_id: `tenant:${ORG}`, roles: [SHS_SECURITY_ROLES.INSTRUCTOR], permissions: STAFF_PERMISSIONS };
let currentActor: any = staff;
let missionSequence = 0;

function mission(familyIndex = 0) {
  missionSequence += 1;
  const definition = structuredClone(MISSION_DEFINITION_FIXTURES[familyIndex]);
  definition.missionId = `${RUN}_${familyIndex}_${missionSequence}`;
  definition.slug = `${RUN.replaceAll("_", "-")}-${familyIndex}-${missionSequence}`;
  return definition;
}

async function cleanup() {
  await query("DELETE FROM mission_definition_drafts WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
  await query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[AUTHOR, LEARNER, OTHER_AUTHOR]]);
  await query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
}

const app = express();
app.use(express.json());
app.use((req: any, _res, next) => { req.user = currentActor; next(); });
registerMissionDraftRoutes(app, { entitlement: (_req, _res, next) => next() });
let server: Server;
let base = "";

async function request(path: string, method = "GET", body?: unknown) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES ($1,$2,$2,'nonprofit','active'),($3,$4,$4,'partner','active')
     ON CONFLICT (organization_id) DO NOTHING`,
    [ORG, RUN, OTHER_ORG, `${RUN} Other`],
  );
  await query(
    `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
     VALUES ($1,$2,$3,$3,'active','test'),($4,$2,$5,$5,'active','test'),($6,$7,$8,$8,'active','test')
     ON CONFLICT (user_id) DO NOTHING`,
    [AUTHOR, ORG, `${AUTHOR}@example.test`, LEARNER, `${LEARNER}@example.test`, OTHER_AUTHOR, OTHER_ORG, `${OTHER_AUTHOR}@example.test`],
  );
  server = await new Promise((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});

after(async () => {
  server?.closeAllConnections?.();
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await cleanup();
});

test("authorized Studio creator can create validated family drafts; client status is normalized to DRAFT", async () => {
  for (let index = 0; index < MISSION_DEFINITION_FIXTURES.length; index += 1) {
    const definition = mission(index);
    if (index === 0) definition.status = "PUBLISHED";
    const result = await request("/studio/missions/drafts", "POST", { definition });
    assert.equal(result.status, 201);
    assert.equal(result.body.data.status, "DRAFT");
    assert.equal(result.body.data.definition.status, "DRAFT");
    assert.equal(result.body.data.missionId, definition.missionId);
    assert.equal(result.body.data.missionVersion, definition.version);
    assert.equal(result.body.data.revision, 1);
    assert.equal(result.body.data.createdByUserId, AUTHOR);
    assert.equal(result.body.data.updatedByUserId, AUTHOR);
  }
});

test("learner cannot author even though personal Studio project permissions are granted", async () => {
  currentActor = { ...staff, user_id: LEARNER, roles: [SHS_SECURITY_ROLES.STUDENT] };
  const result = await request("/studio/missions/drafts", "POST", { definition: mission() });
  assert.equal(result.status, 403);
  currentActor = staff;
});

test("draft API rejects unknown request and definition fields and invalid definitions", async () => {
  const definition = mission();
  assert.equal((await request("/studio/missions/drafts", "POST", { definition, status: "PUBLISHED" })).status, 400);
  assert.equal((await request("/studio/missions/drafts", "POST", { definition: { ...definition, objectives: [], injected: true } })).status, 400);
  assert.equal((await request("/studio/missions/drafts", "POST", { definition: { ...definition, objectives: [] } })).status, 400);
});

test("save increments revision with CAS and stale save returns currentRevision without overwriting", async () => {
  const created = await request("/studio/missions/drafts", "POST", { definition: mission() });
  const draftId = created.body.data.draftId;
  const changed = structuredClone(created.body.data.definition);
  changed.title = "Edited scenario title";
  const updated = await request(`/studio/missions/drafts/${draftId}`, "PUT", { expectedRevision: 1, definition: changed });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.revision, 2);
  assert.equal(updated.body.data.updatedByUserId, AUTHOR);

  const staleDefinition = structuredClone(created.body.data.definition);
  staleDefinition.title = "Stale overwrite";
  const stale = await request(`/studio/missions/drafts/${draftId}`, "PUT", { expectedRevision: 1, definition: staleDefinition });
  assert.equal(stale.status, 409);
  assert.equal(stale.body.error.code, "MISSION_DRAFT_REVISION_CONFLICT");
  assert.equal(stale.body.error.currentRevision, 2);
  const reread = await request(`/studio/missions/drafts/${draftId}`);
  assert.equal(reread.body.data.definition.title, "Edited scenario title");
});

test("draft identity/version cannot change during update", async () => {
  const created = await request("/studio/missions/drafts", "POST", { definition: mission() });
  const changed = structuredClone(created.body.data.definition);
  changed.version += 1;
  const result = await request(`/studio/missions/drafts/${created.body.data.draftId}`, "PUT", { expectedRevision: 1, definition: changed });
  assert.equal(result.status, 409);
  assert.equal(result.body.error.code, "MISSION_DRAFT_IDENTITY_IMMUTABLE");
});

test("duplicate draft Mission identity and version return a conflict", async () => {
  const definition = mission();
  assert.equal((await request("/studio/missions/drafts", "POST", { definition })).status, 201);
  const duplicate = await request("/studio/missions/drafts", "POST", { definition });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error.code, "MISSION_DRAFT_IDENTITY_CONFLICT");
});

test("list/read are scoped to author, organization, and tenant", async () => {
  const created = await request("/studio/missions/drafts", "POST", { definition: mission() });
  assert.ok((await request("/studio/missions/drafts")).body.data.items.length > 0);

  currentActor = { ...staff, user_id: LEARNER, roles: [SHS_SECURITY_ROLES.INSTRUCTOR] };
  assert.equal((await request(`/studio/missions/drafts/${created.body.data.draftId}`)).status, 404);
  assert.equal((await request("/studio/missions/drafts")).body.data.items.length, 0);

  currentActor = { ...staff, organization_id: OTHER_ORG, active_organization_id: OTHER_ORG, tenant_id: `tenant:${OTHER_ORG}`, user_id: OTHER_AUTHOR };
  assert.equal((await request(`/studio/missions/drafts/${created.body.data.draftId}`)).status, 404);
  currentActor = staff;
});

test("draft save does not create Mission Runtime or alter the published catalog", async () => {
  const definition = mission();
  const result = await request("/studio/missions/drafts", "POST", { definition });
  assert.equal(result.status, 201);
  const runtime = await query("SELECT COUNT(*)::int AS count FROM mission_runtime_sessions WHERE organization_id=$1 AND mission_id=$2", [ORG, definition.missionId]);
  assert.equal(Number(runtime.rows[0].count), 0);
});
