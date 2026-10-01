import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("leaderboard client is authenticated, read-only, and preserves server errors", async () => {
  const client = await read("../src/shared/arcade/leaderboard/arcadeLeaderboardClient.js");
  assert.match(client, /API_BASE/);
  assert.match(client, /credentials:\s*["']include["']/);
  assert.match(client, /cache:\s*["']no-store["']/);
  assert.match(client, /ArcadeLeaderboardApiError/);
  assert.match(client, /correlationId/);
  assert.match(client, /details/);
  assert.match(client, /GET/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|indexedDB|method:\s*["']POST/);
});

test("routed Learning leaderboard renders server rank and defers Classic ranking", async () => {
  const page = await read("../src/pages/arcade/Leaderboard.jsx");
  assert.match(page, /useArcadeLeaderboard/);
  assert.match(page, /item\.rank/);
  assert.match(page, /item\.displayName/);
  assert.match(page, /No scored canonical Arcade Results are available for this Activity\./);
  assert.match(page, /The canonical Arcade leaderboard is temporarily unavailable\./);
  assert.match(page, /Server ranking is not yet available for Classic Arcade/);
  assert.doesNotMatch(page, /localStorage|Your Best|Submit to Leaderboard|crypto\.randomUUID|\b(?:xp|evu|wallet|polygon)\b/i);
  assert.doesNotMatch(page, /\/arcade\/(?:attempts|results|evidence|truth|treasury)/i);
});

test("leaderboard hook has no browser scoring or legacy fallback", async () => {
  const hook = await read("../src/shared/arcade/leaderboard/useArcadeLeaderboard.js");
  assert.match(hook, /getActivityLeaderboard/);
  assert.match(hook, /listLeaderboardActivities/);
  assert.doesNotMatch(hook, /localStorage|sessionStorage|creditLedger|useArcadeHistory|score\s*=/);
});

test("server projection ranks only canonical Results and has no write or authority handoff", async () => {
  const route = await read("../apps/shs-api/src/domain/arcade/api/routes.ts");
  const service = await read("../apps/shs-api/src/domain/arcade/service/leaderboard-service.ts");
  const repo = await read("../apps/shs-api/src/domain/arcade/repo/leaderboard-repo.ts");
  assert.match(route, /app\.get\("\/arcade\/leaderboards\/activities\/:activityId"/);
  assert.doesNotMatch(route, /app\.(?:post|put)\("\/arcade\/leaderboards/i);
  assert.match(service, /ARCADE_RESULTS_VIEW/);
  assert.match(service, /getActivityById/);
  assert.match(repo, /FROM arcade_results/);
  assert.match(repo, /RANK\(\) OVER \(ORDER BY score DESC\)/);
  assert.match(repo, /PARTITION BY r\.learner_user_id/);
  assert.match(repo, /r\.organization_id = \$1/);
  assert.match(repo, /r\.score IS NOT NULL/);
  assert.doesNotMatch(`${service}\n${repo}`, /INSERT INTO|UPDATE arcade_results|arcade\.resulted|Truth Spine|Treasury|\b(?:wallet|xp|evu|polygon)\b/i);
  assert.doesNotMatch(repo, /u\.email|email\s+AS\s+display/i);
  assert.match(repo, /displayName: row\.display_name/);
  assert.doesNotMatch(repo, /learnerUserId:\s*row\.learner_user_id/);
});

test("Classic local scoreboard sources are disconnected from routed leaderboard", async () => {
  const route = await read("../src/router/ArcadeRoutes.jsx");
  const page = await read("../src/pages/arcade/Leaderboard.jsx");
  const classicRoom = await read("../src/pages/arcade/ClassicalArcadeRoom.jsx");
  assert.match(route, /path="\/leaderboards"[\s\S]*?<Leaderboard \/>/);
  assert.doesNotMatch(page, /games\/index|safeRead|safeWrite|lbKeyByGame|bestKeyByGame/);
  assert.match(classicRoom, /Classic Leaderboard Preview/);
  assert.match(classicRoom, /Static demo display; server ranking is not yet available for Classic Arcade\./);
  assert.match(classicRoom, /to="\/leaderboards">Learning Leaderboard →/);
  assert.doesNotMatch(classicRoom, /to="\/leaderboards">View All/);
  assert.doesNotMatch(classicRoom, /toLocaleString\(\)\}\s*XP/);
});
