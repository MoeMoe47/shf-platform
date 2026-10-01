import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const client = read("../src/shared/arcade/replay/arcadeReplayClient.js");
const hook = read("../src/shared/arcade/replay/useArcadeReplay.js");
const page = read("../src/pages/arcade/ArcadeResultReplay.jsx");
const history = read("../src/pages/arcade/History.jsx");
const routes = read("../src/router/ArcadeRoutes.jsx");
const service = read("../apps/shs-api/src/domain/arcade/service/replay-service.ts");
const repo = read("../apps/shs-api/src/domain/arcade/repo/replay-repo.ts");

test("Replay client uses authenticated canonical API and preserves bounded error information", () => {
  assert.match(client, /API_BASE/);
  assert.match(client, /credentials:\s*"include"/);
  assert.match(client, /\/arcade\/results\/.*\/replay/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|indexedDB/);
  assert.match(client, /error\.code\s*=/);
  assert.match(client, /error\.correlationId\s*=/);
});

test("Replay is explanatory, source-attributed, and does not derive or write authority", () => {
  assert.match(page, /Replay explains existing records/);
  assert.match(page, /Source: \{event\.sourceType\}/);
  assert.match(page, /no canonical Session-to-Attempt relationship exists/);
  assert.doesNotMatch(`${client}\n${hook}\n${page}\n${service}\n${repo}`, /deriveMastery|verified evidence|Truth Spine|Treasury|localStorage|xpDelta|evuDelta|polygon/i);
  assert.doesNotMatch(service, /INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM|deriveMastery|outbox/i);
});

test("Replay remains rooted in a stored Result and never infers Session association", () => {
  assert.match(repo, /JOIN arcade_attempts t[\s\S]*t\.arcade_attempt_id = r\.arcade_attempt_id/);
  assert.match(repo, /JOIN arcade_activities a ON a\.arcade_activity_id = r\.arcade_activity_id/);
  assert.match(service, /runtimeSession:\s*null/);
  assert.doesNotMatch(`${service}\n${repo}`, /nearest|same user|started_at\s*[+-]|experience_id\s*=/i);
  assert.match(routes, /path="\/history\/:resultId\/replay"/);
});

test("timeline separates Attempt start from canonical completion status and sorts explicit events", () => {
  assert.match(service, /kind: "ATTEMPT_STARTED"[\s\S]*?details: \{\}/);
  assert.match(service, /if \(source\.attempt\.completedAt !== null\)[\s\S]*?kind: "ATTEMPT_COMPLETED"[\s\S]*?occurredAt: source\.attempt\.completedAt[\s\S]*?details: \{ status: source\.attempt\.status \}/);
  assert.match(service, /kind: "RESULT_RECORDED"[\s\S]*?order: 2/);
  assert.match(service, /order: 0[\s\S]*?order: 1[\s\S]*?order: 2[\s\S]*?order: 3[\s\S]*?order: 4/);
  assert.match(service, /timeline\.sort\(\(a, b\) => a\.occurredAt\.localeCompare\(b\.occurredAt\)[\s\S]*?a\.order - b\.order/);
});

test("canonical History links only actual server Result IDs to Replay", () => {
  assert.match(history, /to=\{`\/history\/\$\{encodeURIComponent\(item\.resultId\)\}\/replay`\}/);
  assert.match(history, /useCanonicalArcadeHistory/);
  assert.doesNotMatch(history, /useArcadeHistory/);
  assert.match(routes, /path="\/history\/:resultId\/replay"/);
});
