import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("routed Arcade History uses canonical server history with no legacy fallback", async () => {
  const page = await read("../src/pages/arcade/History.jsx");
  assert.match(page, /useCanonicalArcadeHistory/);
  assert.doesNotMatch(page, /useArcadeHistory/);
  assert.match(page, /No canonical Arcade results have been recorded yet\./);
  assert.match(page, /Canonical Arcade history is temporarily unavailable\./);
  assert.match(page, /Download CSV \(Canonical Arcade History\)/);
  assert.match(page, /masteryAchieved/);
  assert.doesNotMatch(page, /Verified Arcade results/);
  for (const field of ["xpDelta", "evuDelta", "creditsDelta", "polygon", "wallet"]) {
    assert.doesNotMatch(page, new RegExp(field, "i"));
  }
});

test("history uses one page-size constant for API limit and previous-page offset", async () => {
  const page = await read("../src/pages/arcade/History.jsx");
  assert.match(page, /const PAGE_SIZE = 50/);
  assert.match(page, /useCanonicalArcadeHistory\(\{ limit: PAGE_SIZE \}\)/);
  assert.match(page, /offset - PAGE_SIZE/);
  assert.doesNotMatch(page, /offset - 50/);
});

test("canonical history client is authenticated, read-only, and does not substitute local data", async () => {
  const client = await read("../src/shared/arcade/canonicalArcadeHistoryClient.js");
  const hook = await read("../src/shared/arcade/useCanonicalArcadeHistory.js");
  assert.match(client, /\/arcade\/results/);
  assert.match(client, /credentials: "include"/);
  assert.match(client, /cache: "no-store"/);
  assert.doesNotMatch(client, /method:\s*["']POST/i);
  assert.doesNotMatch(client, /localStorage|creditLedger|useArcadeHistory/);
  assert.match(hook, /Canonical Arcade history is temporarily unavailable\./);
  assert.doesNotMatch(hook, /useArcadeHistory|creditLedger|localStorage/);
});

test("CSV uses canonical Result fields only", async () => {
  const page = await read("../src/pages/arcade/History.jsx");
  for (const field of ["resultId", "attemptId", "activityId", "activitySlug", "activityTitle", "completedAt", "score", "maxScore", "passed", "masteryAchieved"]) {
    assert.ok(page.includes(`"${field}"`), `missing CSV field ${field}`);
  }
  for (const field of ["xp", "evu", "credits", "txHash", "onChain", "wallet"]) {
    assert.doesNotMatch(page, new RegExp(`"${field}"`, "i"));
  }
});

test("legacy history stays non-authoritative and rewards sidebar stays independent", async () => {
  const legacy = await read("../src/shared/arcade/useArcadeHistory.js");
  const sidebar = await read("../src/components/arcade/ArcadeSidebar.jsx");
  assert.match(legacy, /legacy\/local compatibility history/i);
  assert.match(legacy, /authoritative:\s*false/);
  assert.doesNotMatch(sidebar, /useArcadeHistory|totalXp|levelFromXp/);
});

test("canonical Truth Spine and evidence handoff implementation remains outside this cutover", async () => {
  const status = await import("node:child_process").then(({ execFileSync }) => execFileSync("git", ["status", "--short", "--", "services/shf-agent-fabric", "apps/shs-api/src/domain/verified-evidence", "apps/shs-api/src/domain/trusted-reporting"], { encoding: "utf8" }));
  assert.equal(status.trim(), "");
});
