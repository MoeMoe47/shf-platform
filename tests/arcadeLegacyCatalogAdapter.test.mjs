import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

import { arcadeGames, sections } from "../src/data/arcade.js";
import {
  adaptLegacyArcadeGames,
  adaptLegacyDisplaySections,
} from "../src/shared/arcade/experience/legacyArcadeCatalogAdapter.js";

const adaptedGames = adaptLegacyArcadeGames(arcadeGames);
const adaptedDisplayGames = adaptLegacyDisplaySections(sections);
const adapterSource = readFileSync(new URL("../src/shared/arcade/experience/legacyArcadeCatalogAdapter.js", import.meta.url), "utf8");

test("all four legacy arcadeGames adapt as valid Learning previews without Activity IDs", () => {
  assert.equal(adaptedGames.length, 4);
  assert.deepEqual(adaptedGames.map(({ validation }) => validation.valid), [true, true, true, true]);
  for (const { descriptor } of adaptedGames) {
    assert.equal(descriptor.activityReference.arcadeActivityId, null);
    assert.equal(descriptor.product.family, "learning");
    assert.equal(descriptor.lifecycle.status, "preview");
    assert.equal(descriptor.lifecycle.launchable, false);
    assert.equal(descriptor.lifecycle.playable, false);
    assert.equal(descriptor.capabilities.evidenceResultCapable, false);
    assert.equal(descriptor.launch.route, null);
  }
});

test("legacy game classifications and difficulty are normalized", () => {
  assert.deepEqual(adaptedGames.map(({ descriptor }) => descriptor.product.experienceType), ["game", "game", "simulation", "game"]);
  assert.deepEqual(adaptedGames.map(({ descriptor }) => descriptor.presentation.difficulty), ["intermediate", "beginner", "advanced", "beginner"]);
});

test("legacy reward, Polygon, SEL, and workforce fields stay outside descriptors", () => {
  for (const { descriptor, legacyMetadata } of adaptedGames) {
    for (const key of ["xpReward", "polygonAction", "selTags", "workforceTags"]) {
      assert.equal(Object.hasOwn(descriptor, key), false);
      assert.equal(Object.values(descriptor).some((value) => value && typeof value === "object" && Object.hasOwn(value, key)), false);
    }
    assert.ok(legacyMetadata);
  }
  assert.equal(adaptedGames[0].legacyMetadata.xpReward, 150);
  assert.equal(adaptedGames[0].legacyMetadata.polygonAction, "arcade_game_complete");
  assert.deepEqual(adaptedGames[0].legacyMetadata.selTags, ["self-management", "planning"]);
  assert.deepEqual(adaptedGames[0].legacyMetadata.workforceTags, ["financial literacy"]);
});

test("broken legacy routes remain migration metadata and never become launch routes", () => {
  for (const { descriptor, legacyMetadata } of adaptedGames) {
    assert.equal(descriptor.launch.route, null);
    assert.match(legacyMetadata.sourceRoute, /^\/arcade\/games\//);
    assert.ok(descriptor.provenance.migratedFrom.includes(`src/data/arcade.js:${legacyMetadata.sourceRoute}`));
  }
});

test("adapter creates no Arcade Activity and does not expose guessed Activity relationships", () => {
  assert.ok(adaptedGames.every(({ descriptor }) => descriptor.activityReference.arcadeActivityId === null));
});

test("all eight display games adapt as non-result-producing Classic previews", () => {
  assert.equal(adaptedDisplayGames.length, 8);
  for (const { descriptor, validation } of adaptedDisplayGames) {
    assert.equal(validation.valid, true);
    assert.equal(descriptor.product.family, "classic");
    assert.equal(descriptor.product.experienceType, "game");
    assert.equal(descriptor.lifecycle.status, "preview");
    assert.equal(descriptor.lifecycle.launchable, false);
    assert.equal(descriptor.lifecycle.playable, false);
    assert.equal(descriptor.activityReference.arcadeActivityId, null);
    assert.equal(Object.values(descriptor.capabilities).some(Boolean), false);
  }
});

test("display title, tag, and artwork remain presentation metadata", () => {
  const first = adaptedDisplayGames[0].descriptor.presentation;
  assert.equal(first.title, "Grid Runner");
  assert.equal(first.category, "Racing");
  assert.equal(first.artwork, "/arcade/grid-runner.jpg");
  assert.equal(adaptedDisplayGames[0].descriptor.presentation.difficulty, null);
});

test("malformed source data returns deterministic validation instead of throwing", () => {
  const adapted = adaptLegacyArcadeGames([{ title: "Missing ID" }])[0];
  assert.equal(adapted.validation.valid, false);
  assert.deepEqual(adapted.validation.errors, ["id is required", "slug is required"]);

  const missingTitle = adaptLegacyArcadeGames([{ id: "missing-title" }])[0];
  assert.equal(missingTitle.validation.valid, false);
  assert.deepEqual(missingTitle.validation.errors, ["presentation.title is required for legacy catalog adaptation"]);
});

test("adapter has no browser storage side effects or authority implementation imports", () => {
  assert.doesNotMatch(adapterSource, /localStorage|sessionStorage|indexedDB/);
  assert.doesNotMatch(adapterSource, /from\s+["'][^"']*(treasury|truth|evidence|curriculum|career|metaverse|agent|identity|studio)[^"']*["']/i);
});

test("legacy source catalog and deferred history consumer are unchanged in the worktree", () => {
  const changed = execFileSync("git", ["status", "--short", "--", "src/data/arcade.js", "src/shared/arcade/useArcadeHistory.js"], { encoding: "utf8" });
  assert.equal(changed, "");
});
