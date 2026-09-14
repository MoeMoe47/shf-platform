// tests/universeRegistryPhase0Governance.test.mjs
//
// CCV2 Phase 0 (Career Center V2 governance/correctness audit) baseline
// coverage for the canonical Universe destination registry:
//   src/pages/universe-v1/universeDestinationRegistry.js
//
// Universe is frontend-only navigation infrastructure today (a static
// destination list consumed by the cinematic scene and the /universe/directory
// gateway) — there is no backend API to test. These tests exercise the real,
// current contract honestly rather than inventing one: registry shape,
// unique/valid destination records, and the specific SHF Civic / CivicSure
// separation this phase corrected.
import assert from "node:assert/strict";
import test from "node:test";
import {
  universeDestinations,
  isDestinationAvailable,
  needsHardNavigation,
} from "../src/pages/universe-v1/universeDestinationRegistry.js";

test("Universe destination registry: every record has a unique id", () => {
  const ids = universeDestinations.map((d) => d.id);
  const seen = new Set();
  const duplicates = [];
  for (const id of ids) {
    if (seen.has(id)) duplicates.push(id);
    seen.add(id);
  }
  assert.deepEqual(duplicates, [], `duplicate destination ids found: ${duplicates.join(", ")}`);
  assert.ok(ids.length > 0, "registry must not be empty");
});

test("Universe destination registry: every record has a well-formed shape", () => {
  for (const d of universeDestinations) {
    assert.equal(typeof d.id, "string", `destination missing string id: ${JSON.stringify(d)}`);
    assert.ok(d.id.length > 0, "destination id must not be empty");
    assert.equal(typeof d.route, "string", `${d.id}: route must be a string`);
    assert.match(d.route, /^\/universe\//, `${d.id}: route must live under /universe/`);
    assert.equal(typeof d.destinationType, "string", `${d.id}: destinationType required`);
    if (d.destinationType === "same-origin-app" || d.destinationType === "independent-local-app") {
      assert.equal(typeof d.productionPath, "string", `${d.id}: productionPath required for ${d.destinationType}`);
      assert.ok(d.productionPath.length > 0, `${d.id}: productionPath must not be empty`);
    }
    assert.equal(typeof d.sourceEvidence, "string", `${d.id}: sourceEvidence required (no invented destinations)`);
    assert.ok(d.sourceEvidence.length > 0, `${d.id}: sourceEvidence must not be empty`);
  }
});

test("Universe destination registry: Career Center and Arcade destinations are present and reuse the existing entries, not a second list", () => {
  const career = universeDestinations.find((d) => d.id === "career");
  const arcade = universeDestinations.find((d) => d.id === "arcade");
  assert.ok(career, "career destination must exist in the canonical registry");
  assert.equal(career.productionPath, "/career.html#/");
  assert.ok(arcade, "arcade destination must exist in the canonical registry");
  assert.equal(arcade.productionPath, "/arcade.html#/");
});

test("CCV2 Phase 0: Universe 'civic' destination resolves to SHF Civic, not CivicSure", () => {
  const civic = universeDestinations.find((d) => d.id === "civic");
  assert.ok(civic, "a 'civic' destination must exist in the registry");
  assert.equal(civic.productionPath, "/civic.html#/", "the 'civic' id must resolve to SHF Civic's own entry (civic.html), not CivicSure");
  assert.doesNotMatch(civic.productionPath, /civicsure/i, "the 'civic' destination must not resolve into CivicSure's route");
  assert.doesNotMatch(`${civic.label} ${civic.title}`, /CivicSure/i, "the 'civic' destination's label/title must not read as CivicSure");
  assert.equal(isDestinationAvailable(civic), true);
  assert.equal(needsHardNavigation(civic), true, "civic.html is a separate multi-page entry and requires a real browser navigation");
});

test("CCV2 Phase 0: CivicSure remains a separate, distinct Universe destination", () => {
  const civicsure = universeDestinations.find((d) => d.id === "civicsure");
  assert.ok(civicsure, "a distinct 'civicsure' destination must exist in the registry");
  assert.equal(civicsure.productionPath, "/index.html#/civicsure");
  assert.match(civicsure.label, /CivicSure/);
  assert.doesNotMatch(civicsure.productionPath, /^\/civic\.html/, "CivicSure must not resolve into SHF Civic's civic.html entry");
});

test("CCV2 Phase 0: SHF Civic and CivicSure destinations never collide on id, label, or productionPath", () => {
  const civic = universeDestinations.find((d) => d.id === "civic");
  const civicsure = universeDestinations.find((d) => d.id === "civicsure");
  assert.ok(civic && civicsure, "both destinations must exist");
  assert.notEqual(civic.id, civicsure.id);
  assert.notEqual(civic.productionPath, civicsure.productionPath);
  assert.notEqual(civic.label, civicsure.label);
});
