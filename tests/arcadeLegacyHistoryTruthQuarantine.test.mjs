import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const hook = read("src/shared/arcade/useArcadeHistory.js");
const history = read("src/pages/arcade/History.jsx");
const duplicateHistory = read("src/pages/arcade/ArcadeHistory.jsx");
const activitySummary = read("src/components/arcade/ArcadeActivitySummary.jsx");
const sidebar = read("src/components/arcade/ArcadeSidebar.jsx");
const routes = read("src/router/ArcadeRoutes.jsx");
const northstar = read("src/pages/arcade/ArcadeDashboardNorthstar.jsx");

test("history hook identifies rows and summaries as non-authoritative local compatibility data", () => {
  assert.match(hook, /legacy\/local compatibility history only/i);
  assert.match(hook, /not canonical Arcade Results/i);
  assert.match(hook, /Verified Evidence records/i);
  assert.match(hook, /Treasury records/i);
  assert.match(hook, /Truth Spine facts/i);
  assert.match(hook, /institutional blockchain proof/i);
  assert.match(hook, /source: "legacy_local_history"/);
  assert.match(hook, /authoritative: false/);
  assert.doesNotMatch(hook, /real ledger-backed Arcade activity|canonical history|institutional activity/i);
});

test("history summary exposes bounded counts only and never aggregates outcomes", () => {
  const summaryFunction = hook.slice(hook.indexOf("export function buildSummary"));
  for (const field of ["totalEntries", "totalSessions", "distinctGames", "distinctEventTypes", "latestTimestamp"]) {
    assert.match(summaryFunction, new RegExp(`${field}\\s*:`));
  }
  for (const field of ["totalXp", "onChainCount", "evuTotal", "creditsTotal", "rewardTotal", "verifiedBadgeCount"]) {
    assert.doesNotMatch(summaryFunction, new RegExp(field));
  }
  assert.doesNotMatch(summaryFunction, /xpDelta|evuDelta|creditsDelta|onChain|txHash/);
});

test("normalized public events isolate legacy outcome metadata", () => {
  const normalizer = hook.slice(hook.indexOf("export function normalizeArcadeEntry"), hook.indexOf("export function buildSummary"));
  assert.match(normalizer, /legacyOutcomeMetadata:\s*\{/);
  const returnedEvent = normalizer.slice(normalizer.lastIndexOf("return {"));
  for (const field of ["xpDelta", "evuDelta", "creditsDelta", "onChain", "txHash"]) {
    assert.match(normalizer, new RegExp(`${field}: legacy`));
    assert.doesNotMatch(returnedEvent, new RegExp(`^\\s{4}${field}:`, "m"));
  }
  for (const field of ["id", "timestamp", "timestampReadable", "userId", "userName", "eventType", "gameId", "gameTitle", "cohort", "location", "device", "selTags", "workforceTags"]) {
    assert.match(normalizer, new RegExp(`\\b${field}\\b`));
  }
});

test("routed History page uses canonical result copy and exports no legacy outcome values", () => {
  assert.match(routes, /import History from "@\/pages\/arcade\/History\.jsx"/);
  assert.match(routes, /path="\/history"[\s\S]*?<History\s*\/>/);
  assert.match(history, /<h1[^>]*>Arcade History<\/h1>/);
  assert.match(history, /canonical Arcade Result system/);
  assert.match(history, /useCanonicalArcadeHistory/);
  assert.doesNotMatch(history, /useArcadeHistory/);
  for (const claim of [/XP earned/i, /XP Awarded/i, /Polygon-verified/i, /on-chain proof/i, /funder-ready/i, /reward proof/i, /Arcade Impact/i, /institutional impact/i]) {
    assert.doesNotMatch(history, claim);
  }
  assert.match(history, /Download CSV \(Canonical Arcade History\)/);
  const headers = history.match(/const fields = \[([\s\S]*?)\];/)?.[1] || "";
  for (const column of ["resultId", "attemptId", "activityId", "activitySlug", "activityTitle", "completedAt", "score", "maxScore", "passed", "masteryAchieved"]) {
    assert.match(headers, new RegExp(`"${column}"`));
  }
  assert.doesNotMatch(headers, /xpDelta|evuDelta|creditsDelta|onChain|txHash/);
});

test("unrouted ArcadeHistory is a redirect and cannot calculate a second outcome summary", () => {
  assert.doesNotMatch(routes, /ArcadeHistory\.jsx/);
  assert.match(duplicateHistory, /Navigate to="\/history" replace/);
  assert.doesNotMatch(duplicateHistory, /totalXp|onChainCount|evuDelta|creditsDelta|polygonTxHash|useArcadeHistory/);
});

test("activity summary and sidebar use legacy counts, not rewards or verified achievements", () => {
  assert.doesNotMatch(activitySummary, /totalXp|badgeCount|Games Played|Badges/);
  assert.match(activitySummary, /History Entries/);
  assert.match(activitySummary, /Activity Types/);
  assert.match(activitySummary, /Games Seen/);
  assert.match(activitySummary, /Latest legacy entry/);
  assert.doesNotMatch(sidebar, /useArcadeHistory|totalXp|levelFromXp|progressbar|\bXP\b|Level/);
  assert.match(sidebar, /to="\/rewards"/);
  assert.match(sidebar, /Managed by the rewards system/);
  assert.match(sidebar, /View Rewards/);
});

test("Northstar uses the compatibility badge constant and bounded dev copy", () => {
  assert.match(northstar, /ARCADE_EVENTS\.BADGE_CLAIMED/);
  assert.doesNotMatch(northstar, /ARCADE_EVENTS\.BADGE_CLAIM\b/);
  assert.match(northstar, /No institutional outcome is recorded/);
});

test("frozen verification authorities and prior migrations remain untouched", () => {
  const status = execFileSync("git", ["status", "--short", "--", "services/shf-agent-fabric", "apps/shs-api/src/domain/verified-evidence", "apps/shs-api/src/domain/trusted-reporting", "src/data/arcade.js"], { encoding: "utf8" });
  assert.equal(status, "");

  const migrationStatus = execFileSync("git", ["status", "--porcelain=v1", "-z", "--", "apps/shs-api/migrations"], { encoding: "utf8" });
  const changedMigrationPaths = migrationStatus
    .split("\0")
    .filter(Boolean)
    .map((entry) => entry.slice(3))
    .sort();

  assert.deepEqual(changedMigrationPaths, ["apps/shs-api/migrations/149_arcade_runtime_sessions.sql"]);
});
