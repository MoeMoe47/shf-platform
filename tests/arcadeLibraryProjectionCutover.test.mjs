import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { arcadeGames } from "../src/data/arcade.js";
import { adaptLegacyArcadeGames } from "../src/shared/arcade/experience/legacyArcadeCatalogAdapter.js";

const source = readFileSync(new URL("../src/pages/arcade/ArcadeLibrary.jsx", import.meta.url), "utf8");
const entries = adaptLegacyArcadeGames(arcadeGames);

test("ArcadeLibrary adapts the catalog and renders validated entries", () => {
  assert.match(source, /adaptLegacyArcadeGames\(arcadeGames\)/);
  assert.match(source, /adaptedGames\.filter\(\(entry\) => entry\.validation\?\.valid === true\)/);
  assert.doesNotMatch(source, /arcadeGames\.(?:filter|map)/);
});

test("cards render descriptor title, description, difficulty, lifecycle, and capabilities", () => {
  assert.match(source, /presentation\.title/);
  assert.match(source, /presentation\.description/);
  assert.match(source, /presentation\.difficulty/);
  assert.match(source, /lifecycle\.status/);
  assert.match(source, /lifecycle\.playable/);
  assert.match(source, /capabilities\.evidenceResultCapable/);
});

test("filtering and visible tags use legacy metadata only for discovery", () => {
  assert.match(source, /const \{ selTags, workforceTags \} = entry\.legacyMetadata/);
  assert.match(source, /legacyMetadata\.selTags/);
  assert.match(source, /legacyMetadata\.workforceTags/);
  for (const label of ["All Games", "SEL Skills", "Workforce Ready", "Career Path", "Cognitive Fitness", "Leadership"]) {
    assert.ok(source.includes(label), `Missing filter label: ${label}`);
  }
});

test("legacy reward and authority claims are absent from the rendered page", () => {
  for (const forbidden of [
    "xpReward",
    "polygonAction",
    "On-Chain Badge",
    "blockchain-backed",
    "12,340",
    "On-Chain Proofs",
    "alert(",
  ]) {
    assert.equal(source.includes(forbidden), false, `Unexpected legacy claim: ${forbidden}`);
  }
  assert.match(source, /Verified results and portfolio evidence/);
  assert.match(source, /the systems that own those records/);
});

test("hero metrics derive from valid adapted descriptors", () => {
  assert.match(source, /validGames\.length/);
  assert.match(source, /entry\.descriptor\.lifecycle\.status === "preview"/);
  assert.match(source, /entry\.descriptor\.lifecycle\.playable === true/);
  assert.deepEqual(
    [entries.length, entries.filter(({ descriptor }) => descriptor.lifecycle.status === "preview").length, entries.filter(({ descriptor }) => descriptor.lifecycle.playable).length],
    [4, 4, 0],
  );
});

test("library does not assign Arcade Activity IDs or external authority", () => {
  assert.ok(entries.every(({ descriptor }) => descriptor.activityReference.arcadeActivityId === null));
  assert.doesNotMatch(source, /arcadeActivityId\s*[:=]/);
  assert.doesNotMatch(source, /from\s+["'][^"']*(treasury|evidence|truth|career|curriculum)[^"']*["']/i);
});

test("every legacy card has a disabled Preview control with no launch branch or handler", () => {
  assert.match(
    source,
    /<button\s+type="button"\s+className="shf-arcade-library__play-btn"\s+disabled\s*>\s*Preview\s*<\/button>/,
  );
  assert.doesNotMatch(source, /canLaunch|lifecycle\.launchable|["']Play["']/);
  const previewButton = source.match(/<button\s+type="button"\s+className="shf-arcade-library__play-btn"[\s\S]*?<\/button>/)?.[0] ?? "";
  assert.doesNotMatch(previewButton, /onClick|window\.location|navigate\(/);
  assert.equal(entries.length, 4);
});

test("invalid adapter entries are excluded instead of made playable", () => {
  const invalid = adaptLegacyArcadeGames([{ id: "incomplete" }])[0];
  assert.equal(invalid.validation.valid, false);
  assert.match(source, /filter\(\(entry\) => entry\.validation\?\.valid === true\)/);
  assert.equal(invalid.descriptor.lifecycle.playable, false);
  assert.equal(invalid.descriptor.lifecycle.launchable, false);
});
