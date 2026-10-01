import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Mission Builder is routed inside Studio and not learner Arcade navigation", async () => {
  const routes = await read("../src/router/CurriculumRoutes.jsx");
  const home = await read("../src/pages/studio/StudioHome.jsx");
  assert.match(routes, /path="missions" element=\{<StudioMissionBuilder \/>\}/);
  assert.match(home, /canAuthorMissions[\s\S]*Open Mission Builder/);
  assert.match(home, /!auth\.hasRole\("student"\)/);
  const arcadeRoutes = await read("../src/router/ArcadeRoutes.jsx").catch(() => "");
  assert.doesNotMatch(arcadeRoutes, /studio\/missions/);
});

test("Draft client uses authenticated canonical API and no browser persistence", async () => {
  const client = await read("../src/lib/studio/missionDraftApi.js");
  assert.match(client, /API_BASE/);
  assert.match(client, /credentials:\s*"include"/);
  assert.match(client, /code:\s*envelope\.error\?\.code/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|indexedDB/);
});

test("Builder creates and saves drafts only; it cannot publish or launch them", async () => {
  const builder = await read("../src/pages/studio/StudioMissionBuilder.jsx");
  assert.match(builder, /createMissionDraft/);
  assert.match(builder, /updateMissionDraft\(draftId, revision, definition\)/);
  assert.match(builder, /Save Draft/);
  assert.match(builder, /DRAFT PREVIEW/);
  assert.match(builder, /Create a separate draft to author another Mission version/);
  assert.match(builder, /cannot be launched/);
  assert.doesNotMatch(builder, /publishMission|approveMission|startMissionRuntime|\/arcade\/mission-runtimes/);
  assert.doesNotMatch(builder, /localStorage|sessionStorage|indexedDB/);
});

test("Condition editor exposes only type-specific 4A operand shapes", async () => {
  const builder = await read("../src/pages/studio/StudioMissionBuilder.jsx");
  for (const shape of [
    'OBJECTIVE_COMPLETE: ["type", "objectiveId"]',
    'OBJECTIVE_COUNT: ["type", "count"]',
    'STAGE_COMPLETE: ["type", "stageId"]',
    'TIME_ELAPSED: ["type", "seconds"]',
    'STATE_EQUALS: ["type", "stateKey", "value"]',
    'STATE_THRESHOLD: ["type", "stateKey", "operator", "value"]',
    'EVENT_OCCURRED: ["type", "eventType"]',
  ]) assert.ok(builder.includes(shape), `Missing condition shape ${shape}`);
  assert.doesNotMatch(builder, /eval\s*\(|new Function/);
});

test("Objective and stage editing uses canonical enums and keyboard reorder buttons", async () => {
  const builder = await read("../src/pages/studio/StudioMissionBuilder.jsx");
  assert.match(builder, /const OBJECTIVES =/);
  assert.match(builder, /const FAMILIES =/);
  assert.match(builder, /Move objective up/);
  assert.match(builder, /Move objective down/);
  assert.match(builder, /Move stage up/);
  assert.match(builder, /Move stage down/);
  assert.match(builder, /Optional-stage bypass execution is not yet implemented/);
});

test("Activity, AI, scoring, and environment references carry authority boundaries", async () => {
  const builder = await read("../src/pages/studio/StudioMissionBuilder.jsx");
  assert.match(builder, /choosing an Activity does not create or change it/);
  assert.match(builder, /listLeaderboardActivities/);
  assert.match(builder, /No Activity reference/);
  assert.match(builder, /Capability declaration only/);
  assert.match(builder, /Governed AI execution is not enabled in 4C/);
  assert.match(builder, /does not create a canonical Arcade Result or leaderboard score/);
  assert.match(builder, /Reference fields do not create or modify environments/);
});

test("revision conflicts preserve current revision and offer explicit reload", async () => {
  const builder = await read("../src/pages/studio/StudioMissionBuilder.jsx");
  const client = await read("../src/lib/studio/missionDraftApi.js");
  assert.match(client, /details:\s*envelope\.error/);
  assert.match(client, /correlationId:\s*envelope\.correlation_id/);
  assert.match(builder, /MISSION_DRAFT_REVISION_CONFLICT/);
  assert.match(builder, /Reload latest/);
});

test("Builder controls meet 44px target, focus, and reduced-motion requirements", async () => {
  const css = await read("../src/styles/studio-mission-builder.css");
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test("draft API is separate from the published catalog and has no delete/publish route", async () => {
  const routes = await read("../apps/shs-api/src/domain/mission-content/api/mission-draft-routes.ts");
  const service = await read("../apps/shs-api/src/domain/mission-content/service/mission-draft-service.ts");
  assert.match(routes, /\/studio\/missions\/drafts/);
  assert.match(service, /definition\.status = "DRAFT"/);
  assert.match(service, /MISSION_DRAFT_REVISION_CONFLICT/);
  assert.doesNotMatch(routes, /publishedMissionResolver|PublishedMissionCatalog/);
  assert.doesNotMatch(routes, /app\.(delete|post)\("\/studio\/missions\/drafts\/[^"\n]*(publish|approve)/);
});
