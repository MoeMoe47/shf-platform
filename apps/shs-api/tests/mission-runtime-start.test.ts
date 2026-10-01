import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import type { Server } from "node:http";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { query } from "../src/db/client.js";
import { ArcadeRuntimeSessionService } from "../src/domain/arcade/service/runtime-session-service.js";
import { ServerPublishedMissionCatalog, PublishedMissionCatalogError } from "../src/domain/mission-content/catalog/published-mission-catalog.js";
import { MISSION_DEFINITION_FIXTURES } from "../src/domain/mission-content/fixtures/mission-definition-fixtures.js";
import type { MissionDefinition } from "../src/domain/mission-content/model/mission-definition.js";
import { registerMissionRuntimeRoutes } from "../src/domain/mission-runtime/api/routes.js";
import { MissionRuntimeService, type MissionRuntimeActor } from "../src/domain/mission-runtime/service/mission-runtime-service.js";
import { MissionRuntimeStartService } from "../src/domain/mission-runtime/service/mission-runtime-start-service.js";

const RUN = `mission_start_${Date.now()}`;
const USER = `user_${RUN}`;
const OTHER_USER = `other_${RUN}`;
const ORG = `org_${RUN}`;
const OTHER_ORG = `other_org_${RUN}`;
const BASE = process.env.SHS_API_TEST_BASE_URL || "http://127.0.0.1:8091";
const actor: MissionRuntimeActor = { user_id: USER, organization_id: ORG, permissions: [SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT] };
function definitionFor(status: MissionDefinition["status"], suffix: string): MissionDefinition {
  const definition = structuredClone(MISSION_DEFINITION_FIXTURES[0]);
  definition.status = status;
  definition.missionId = `${definition.missionId}-${suffix}`;
  definition.slug = `${definition.slug}-${suffix}`;
  return definition;
}
const published = () => definitionFor("PUBLISHED", "catalog-published");
const catalogDefinitions = [published(), definitionFor("DRAFT", "catalog-draft"), definitionFor("REVIEW", "catalog-review"), definitionFor("RETIRED", "catalog-retired")];
const catalog = new ServerPublishedMissionCatalog(catalogDefinitions);
const runtime = new MissionRuntimeService();
const startService = new MissionRuntimeStartService(catalog, runtime);

async function cleanup() {
  await query("DELETE FROM mission_runtime_sessions WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
  await query("DELETE FROM arcade_runtime_sessions WHERE experience_id LIKE $1", [`${RUN}:%`]);
  await query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[USER, OTHER_USER, `cross_${USER}`]]);
  await query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
}

async function countRuntimeRows() {
  const result = await query("SELECT COUNT(*)::int AS count FROM mission_runtime_sessions WHERE organization_id=$1 AND mission_id=$2", [ORG, catalogDefinitions[0].missionId]);
  return Number(result.rows[0].count);
}

async function withRoute(fn: (base: string) => Promise<void>, user: any = {
  user_id: USER,
  organization_id: ORG,
  active_organization_id: ORG,
  tenant_id: `tenant:${ORG}`,
  permissions: [SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT],
}) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    if (user) req.user = user;
    next();
  });
  registerMissionRuntimeRoutes(app, { startService });
  const server: Server = await new Promise((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  try {
    await fn(`http://127.0.0.1:${(server.address() as any).port}`);
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

async function post(base: string, body: unknown) {
  const response = await fetch(`${base}/arcade/mission-runtimes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
     VALUES ($1,$2,$3,'Mission Runtime Learner','active','local'),($4,$2,$5,'Other Learner','active','local'),($6,$7,$8,'Other Org Learner','active','local')
     ON CONFLICT (user_id) DO NOTHING`,
    [USER, ORG, `${USER}@test.invalid`, OTHER_USER, `${OTHER_USER}@test.invalid`, `cross_${USER}`, OTHER_ORG, `cross_${USER}@test.invalid`],
  );
});

after(cleanup);

test("published catalog resolves exact PUBLISHED version only and returns independent clones", async () => {
  const first = await catalog.resolvePublishedMission({ missionId: catalogDefinitions[0].missionId, version: 1 });
  assert.equal(first?.status, "PUBLISHED");
  assert.equal(await catalog.resolvePublishedMission({ missionId: catalogDefinitions[0].missionId, version: 2 }), null);
  assert.equal(await catalog.resolvePublishedMission({ missionId: "unknown-mission", version: 1 }), null);
  for (const version of catalogDefinitions.slice(1)) {
    assert.equal(await catalog.resolvePublishedMission({ missionId: version.missionId, version: version.version }), null);
  }
  first!.title = "caller mutation";
  assert.equal((await catalog.resolvePublishedMission({ missionId: catalogDefinitions[0].missionId, version: 1 }))?.title, catalogDefinitions[0].title);
});

test("catalog rejects invalid definitions and duplicate missionId/version identities", () => {
  const invalid = { ...published(), title: "<script>bad</script>" } as MissionDefinition;
  assert.throws(() => new ServerPublishedMissionCatalog([invalid]), Error);
  assert.throws(() => new ServerPublishedMissionCatalog([published(), published()]), PublishedMissionCatalogError);
});

test("start request rejects missing identity, invalid version, and all content injection fields", async () => {
  await withRoute(async (base) => {
    for (const body of [
      {},
      { missionId: catalogDefinitions[0].missionId },
      { missionId: catalogDefinitions[0].missionId, missionVersion: "latest" },
      { missionId: catalogDefinitions[0].missionId, missionVersion: 1, definition: published() },
      { missionId: catalogDefinitions[0].missionId, missionVersion: 1, objectives: [] },
      { missionId: catalogDefinitions[0].missionId, missionVersion: 1, stages: [] },
      { missionId: catalogDefinitions[0].missionId, missionVersion: 1, conditions: [] },
      { missionId: catalogDefinitions[0].missionId, missionVersion: 1, status: "PUBLISHED" },
    ]) {
      const response = await post(base, body);
      assert.equal(response.status, 400, JSON.stringify(body));
      assert.match(response.body.error.code, /MISSION_RUNTIME_START|MISSION_ID|MISSION_VERSION/);
    }
  });
});

test("start route requires authenticated organization-scoped runtime permission", async () => {
  await withRoute(async (base) => {
    const response = await post(base, { missionId: catalogDefinitions[0].missionId, missionVersion: 1 });
    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, "AUTH_REQUIRED");
  }, null);
});

test("HTTP start resolves server content, persists an exact snapshot, and preserves idempotency", async () => {
  const beforeCount = await countRuntimeRows();
  await withRoute(async (base) => {
    const request = { missionId: catalogDefinitions[0].missionId, missionVersion: 1, idempotencyKey: `${RUN}:start` };
    const first = await post(base, request);
    assert.equal(first.status, 201);
    const session = first.body.data.session;
    assert.equal(session.missionId, request.missionId);
    assert.equal(session.missionVersion, request.missionVersion);
    assert.equal(session.status, "ACTIVE");
    assert.equal(session.revision, 1);
    assert.equal("definitionSnapshot" in session, false);
    assert.equal("organizationId" in session, false);
    assert.equal("userId" in session, false);

    const repeated = await post(base, request);
    assert.equal(repeated.status, 200);
    assert.equal(repeated.body.data.reused, true);
    assert.equal(repeated.body.data.session.id, session.id);

    const wrongVersion = await post(base, { ...request, missionVersion: 2, idempotencyKey: `${RUN}:wrong-version` });
    assert.equal(wrongVersion.status, 404);
    const draft = await post(base, { missionId: catalogDefinitions[1].missionId, missionVersion: 1, idempotencyKey: `${RUN}:draft` });
    assert.equal(draft.status, 404);
    assert.equal(await countRuntimeRows(), beforeCount + 1);
  });
});

test("explicit Arcade Runtime link is accepted only for the same owner and organization", async () => {
  const arcade = new ArcadeRuntimeSessionService();
  const sameOwner = await arcade.start({ ...actor, roles: [] }, { experienceId: `${RUN}:linked`, family: "learning", sessionType: "mission" });
  const otherOwner = await arcade.start({ ...actor, user_id: OTHER_USER, roles: [] }, { experienceId: `${RUN}:other-owner`, family: "classic", sessionType: "mission" });
  const otherOrg = await arcade.start({ ...actor, user_id: `cross_${USER}`, organization_id: OTHER_ORG, roles: [] }, { experienceId: `${RUN}:other-org`, family: "classic", sessionType: "mission" });

  await withRoute(async (base) => {
    const linked = await post(base, { missionId: catalogDefinitions[0].missionId, missionVersion: 1, idempotencyKey: `${RUN}:same-owner`, arcadeRuntimeSessionId: sameOwner.session.id });
    assert.equal(linked.status, 201);
    assert.equal(linked.body.data.session.arcadeRuntimeSessionId, sameOwner.session.id);

    for (const [id, suffix] of [[otherOwner.session.id, "cross-user"], [otherOrg.session.id, "cross-org"]]) {
      const denied = await post(base, { missionId: catalogDefinitions[0].missionId, missionVersion: 1, idempotencyKey: `${RUN}:${suffix}`, arcadeRuntimeSessionId: id });
      assert.equal(denied.status, 404);
      assert.equal(denied.body.error.code, "ARCADE_RUNTIME_SESSION_NOT_FOUND");
    }
  });
});

test("live SHS route rejects browser MissionDefinition injection before catalog lookup", async () => {
  const token = (userId: string) => ({ Authorization: `Bearer dev-token:${userId}` });
  for (const field of ["definition", "objectives", "stages", "conditions", "status", "runtimeScorePolicy", "aiCapabilities", "environmentRefs"]) {
    const response = await fetch(`${BASE}/arcade/mission-runtimes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...token("user_student_001") },
      body: JSON.stringify({ missionId: "fixture-learning-systems-check", missionVersion: 1, [field]: {} }),
    });
    const body = await response.json();
    assert.equal(response.status, 400, field);
    assert.equal(body.error.code, "MISSION_RUNTIME_START_FIELD_INVALID", field);
  }

  const exactIdentityOnly = await fetch(`${BASE}/arcade/mission-runtimes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...token("user_student_001") },
    body: JSON.stringify({ missionId: "fixture-learning-systems-check", missionVersion: 1 }),
  });
  assert.equal(exactIdentityOnly.status, 404, "production catalog is intentionally empty; draft fixtures are not promoted");
});
