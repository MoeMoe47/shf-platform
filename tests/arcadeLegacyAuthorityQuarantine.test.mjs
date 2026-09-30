import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";

import {
  ARCADE_EVENTS,
  arcadeEventRules,
  resolveCreditDelta,
  resolveSkillImpact,
  resolveWalletDelta,
} from "../src/shared/arcade/arcadeRules.js";
import { useArcadeLedger } from "../src/shared/arcade/useArcadeLedger.js";

const repoFiles = {
  rules: "../src/shared/arcade/arcadeRules.js",
  ledger: "../src/shared/arcade/useArcadeLedger.js",
  history: "../src/shared/arcade/useArcadeHistory.js",
};
const source = Object.fromEntries(
  Object.entries(repoFiles).map(([key, path]) => [
    key,
    readFileSync(new URL(path, import.meta.url), "utf8"),
  ]),
);

test("arcade rules identify themselves as non-authoritative legacy metadata", () => {
  assert.match(source.rules, /legacy compatibility metadata only/i);
  assert.match(source.rules, /do not authorize/i);
  assert.doesNotMatch(source.rules, /source of truth|reward authority|proof authority/i);
});

test("every retained event rule is descriptive and non-authoritative", () => {
  assert.deepEqual(Object.keys(arcadeEventRules), Object.values(ARCADE_EVENTS));
  for (const rule of Object.values(arcadeEventRules)) {
    assert.equal(rule.authoritative, false);
    assert.equal(rule.onChain, false);
    assert.doesNotMatch(rule.description, /proof|credential|micro-credential|reward|skill proof/i);
    assert.deepEqual(rule.wallet, {
      baseXp: 0,
      useGameXpReward: false,
      baseTokens: 0,
      useGameTokenReward: false,
      recordTransaction: false,
    });
    assert.equal(rule.credit.evuBase, 0);
    assert.equal(rule.credit.evuFromGameWeight, false);
    assert.equal(rule.credit.scoreDelta, 0);
    assert.deepEqual(rule.skills, { sel: [], workforce: [], cognitive: [], skillWeight: 0 });
    assert.equal(rule.polygon.actionType, "none");
  }
});

test("all delta resolvers fail closed regardless of supplied rule or game metadata", () => {
  const unsafeRule = {
    wallet: { baseXp: 900, useGameXpReward: true, baseTokens: -20, useGameTokenReward: true, recordTransaction: true },
    credit: { evuBase: 5, evuFromGameWeight: true, scoreDelta: 7 },
    skills: { sel: ["leadership"], workforce: ["career"], cognitive: ["focus"], skillWeight: 9 },
  };
  const unsafeGame = { xpReward: 500, tokenReward: 200, evuWeight: 8 };

  assert.deepEqual(resolveWalletDelta(unsafeRule, unsafeGame), { xp: 0, tokens: 0, recordTransaction: false });
  assert.deepEqual(resolveCreditDelta(unsafeRule, unsafeGame), { evu: 0, scoreDelta: 0 });
  assert.deepEqual(resolveSkillImpact(unsafeRule, unsafeGame), { sel: [], workforce: [], cognitive: [], weight: 0 });
});

test("useArcadeLedger imports no browser authority integrations or write calls", () => {
  assert.doesNotMatch(source.ledger, /appendEntry|useWallet|usePolygon|addTransaction|submitTx|creditLedger/);
  assert.doesNotMatch(source.ledger, /arcadeActivityId/);
  assert.match(source.ledger, /ARCADE_EVENTS/);
  assert.match(source.ledger, /recordArcadeEvent\s*=\s*React\.useCallback/);
});

test("recordArcadeEvent retains a deterministic quarantined compatibility response", async () => {
  let ledgerHook;
  function CaptureHook() {
    ledgerHook = useArcadeLedger();
    return null;
  }

  renderToStaticMarkup(React.createElement(CaptureHook));
  assert.deepEqual(Object.keys(ledgerHook).sort(), ["ARCADE_EVENTS", "recordArcadeEvent"]);

  const result = await ledgerHook.recordArcadeEvent(ARCADE_EVENTS.GAME_COMPLETE, {
    gameId: "debt-hunter",
    xpReward: 999,
  });

  assert.equal(result.accepted, false);
  assert.equal(result.authority, "server");
  assert.equal(result.legacyCompatibility, true);
  assert.equal(result.eventType, ARCADE_EVENTS.GAME_COMPLETE);
  assert.equal(result.reason, "LEGACY_BROWSER_AUTHORITY_DISABLED");
  assert.equal(typeof result.timestamp, "number");
  assert.equal(result.game, null);
  assert.equal(result.rule.authoritative, false);
  assert.deepEqual(result.walletDelta, { xp: 0, tokens: 0, recordTransaction: false });
  assert.deepEqual(result.creditDelta, { evu: 0, scoreDelta: 0 });
  assert.deepEqual(result.skillImpact, { sel: [], workforce: [], cognitive: [], weight: 0 });
});

test("event vocabulary remains compatibility-only and documents arcade.resulted", () => {
  assert.equal(ARCADE_EVENTS.GAME_COMPLETE, "arcade_game_complete");
  assert.match(source.rules, /ARCADE_EVENTS remains for caller compatibility/i);
  assert.match(source.rules, /arcade\.resulted/);
});

test("history and source catalog remain untouched", () => {
  assert.equal(source.history.includes("creditLedger.listRecentEntries"), true);
  const changed = execFileSync(
    "git",
    ["status", "--short", "--", "src/shared/arcade/useArcadeHistory.js", "src/data/arcade.js"],
    { encoding: "utf8" },
  );
  assert.equal(changed, "");
});
