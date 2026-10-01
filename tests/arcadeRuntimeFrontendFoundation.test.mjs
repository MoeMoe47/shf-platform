import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  client: "src/shared/arcade/runtime/arcadeRuntimeClient.js",
  session: "src/shared/arcade/runtime/useArcadeRuntimeSession.js",
  save: "src/shared/arcade/runtime/useArcadeRuntimeSaveState.js",
  telemetry: "src/shared/arcade/runtime/useArcadeRuntimeTelemetry.js",
  harness: "src/pages/arcade/ArcadeRuntimeDevHarness.jsx",
  routes: "src/router/ArcadeRoutes.jsx",
  apiRoutes: "apps/shs-api/src/domain/arcade/api/runtime-routes.ts",
  sessionService: "apps/shs-api/src/domain/arcade/service/runtime-session-service.ts",
  sessionModel: "apps/shs-api/src/domain/arcade/model/runtime-session.ts",
  sessionApiTest: "apps/shs-api/tests/arcade-runtime-session.test.ts",
  saveService: "apps/shs-api/src/domain/arcade/service/runtime-save-state-service.ts",
  telemetryService: "apps/shs-api/src/domain/arcade/service/runtime-telemetry-service.ts",
  telemetryModel: "apps/shs-api/src/domain/arcade/model/runtime-telemetry.ts",
};

const source = Object.fromEntries(await Promise.all(
  Object.entries(files).map(async ([key, path]) => [key, await readFile(path, "utf8")]),
));

test("runtime client uses canonical SHS API base and authenticated fetch", () => {
  assert.match(source.client, /from "@\/lib\/apiClient\.js"/);
  assert.match(source.client, /credentials:\s*"include"/);
  assert.match(source.client, /cache:\s*"no-store"/);
  assert.doesNotMatch(source.client, /localhost|127\.0\.0\.1/);
});

test("runtime client preserves server error code, correlation, status, and details", () => {
  assert.match(source.client, /class ArcadeRuntimeApiError/);
  for (const field of ["status", "code", "correlationId", "details", "body"]) {
    assert.match(source.client, new RegExp(`this\\.${field}\\s*=`));
  }
  assert.match(source.client, /details\s*\|\|\s*flattenedDetails/);
  assert.match(source.client, /const \{ code, message, details, \.\.\.flattenedDetails \}/);
  assert.match(source.client, /code,\s*message,\s*details/);
});

test("runtime frontend has no persistent local authority storage", () => {
  for (const key of ["client", "session", "save", "telemetry", "harness"]) {
    assert.doesNotMatch(source[key], /localStorage|sessionStorage|indexedDB/);
  }
});

test("save conflicts remain errors and do not replace or merge server state", () => {
  assert.match(source.save, /catch \(nextError\)[\s\S]*?setError\(nextError\)[\s\S]*?throw nextError/);
  assert.doesNotMatch(source.save, /SAVE_REVISION_CONFLICT[\s\S]{0,160}(merge|overwrite|retry)/i);
  assert.match(source.client, /details:\s*details\s*\|\|\s*flattenedDetails/);
});

test("telemetry sequence conflicts remain visible and refresh from the server", () => {
  assert.match(source.telemetry, /RUNTIME_EVENT_SEQUENCE_CONFLICT/);
  assert.match(source.telemetry, /await reload\(\)/);
  assert.match(source.telemetry, /throw nextError/);
});

test("hooks do not derive mastery or characterize continuity/telemetry as verified", () => {
  assert.doesNotMatch(`${source.session}\n${source.save}\n${source.telemetry}`, /deriveMastery|masteryAchieved|verified evidence/i);
  assert.match(source.harness, /not verified progress/);
  assert.match(source.harness, /does not change session lifecycle or establish evidence/);
});

test("harness route is direct-link development tooling and Classic requires no Activity ID", () => {
  assert.match(source.routes, /path="\/dev\/runtime"/);
  assert.match(source.harness, /DEVELOPMENT \/ TEST HARNESS/);
  assert.match(source.harness, /useState\("classic"\)/);
  assert.match(source.harness, /family === "learning" && activityId\.trim\(\)/);
  assert.doesNotMatch(source.harness, /activityId\s*:\s*["'`]([0-9a-f-]{20,})/i);
});

test("runtime client calls only the existing runtime API and has no Result/truth/reward path", () => {
  for (const name of [
    "startRuntimeSession", "listRuntimeSessions", "getRuntimeSession", "pauseRuntimeSession",
    "resumeRuntimeSession", "completeRuntimeSession", "abandonRuntimeSession",
    "getRuntimeSaveState", "putRuntimeSaveState", "listRuntimeEvents", "appendRuntimeEvent",
  ]) assert.match(source.client, new RegExp(`export function ${name}\\(`));
  assert.doesNotMatch(source.client, /"\/arcade\/results|"\/evidence|"\/truth-spine|"\/treasury|"\/wallet/i);
});

test("runtime lifecycle remains server-controlled; no browser outcome APIs are called", () => {
  assert.match(source.session, /pauseRuntimeSession|resumeRuntimeSession|completeRuntimeSession|abandonRuntimeSession/);
  assert.match(source.harness, /Runtime completion does not submit an Arcade Result/);
  assert.doesNotMatch(source.harness, /deriveMastery|arcade\.resulted|appendEntry|addTransaction|submitTx/);
});

test("Learning session request uses backend contract activityId and maps to arcadeActivityId DTO", () => {
  assert.match(source.sessionService, /body\?\.activityId/);
  assert.match(source.sessionService, /arcadeActivityId:\s*activityId/);
  assert.match(source.sessionModel, /arcadeActivityId:\s*string\s*\|\s*null/);
  assert.match(source.sessionApiTest, /body:\s*\{[\s\S]{0,240}activityId/);
  assert.match(source.harness, /\{\s*activityId:\s*activityId\.trim\(\)\s*\}/);
  assert.doesNotMatch(source.harness, /arcadeActivityId\s*:/);
});

test("lifecycle response DTO shapes match hook normalization", () => {
  assert.match(source.apiRoutes, /service\.start\([\s\S]*?\.json\(ok\(result\)\)/);
  assert.match(source.sessionService, /return started;/);
  assert.match(source.sessionApiTest, /created\.json\.data\.session/);
  assert.match(source.apiRoutes, /ok\(await service\.get\([\s\S]*?\)\)/);
  assert.match(source.sessionApiTest, /own\.json\.data\.id/);
  assert.match(source.sessionService, /return \{ session, changed: true \}/);
  assert.match(source.sessionApiTest, /paused\.json\.data\.session\.status/);
  assert.match(source.session, /sessionFromActionResponse\(result\)/);
  assert.match(source.session, /sessionFromGetResponse\(result\)/);
});

test("save GET wraps nullable saveState and PUT returns the saved-state DTO", () => {
  assert.match(source.saveService, /return \{ sessionId, saveState \}/);
  assert.match(source.saveService, /return saved;/);
  assert.match(source.apiRoutes, /saveStateService\.get[\s\S]*?ok\(/);
  assert.match(source.apiRoutes, /saveStateService\.save[\s\S]*?ok\(/);
  assert.match(source.save, /response\.saveState \?\? null/);
  assert.match(source.save, /setSaveState\(result\)/);
});

test("telemetry GET page and POST event DTO match client hook expectations", () => {
  assert.match(source.telemetryService, /return \{ sessionId: id, items, nextAfterSequence:/);
  assert.match(source.telemetryService, /return result\.event/);
  assert.match(source.telemetryModel, /interface ArcadeRuntimeTelemetryEvent/);
  assert.match(source.telemetry, /response\.items \|\| \[\]/);
  assert.match(source.telemetry, /setEvents\(\(current\) => \[\.\.\.current, result\]/);
});
