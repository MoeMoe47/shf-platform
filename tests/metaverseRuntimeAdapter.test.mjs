import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { METAVERSE_ACTIVITY_PLACEHOLDERS } from "../src/system/metaverse/metaverseNavigationModel.js";
import {
  METAVERSE_UNLOCK_PROJECTION_META,
  canEnterMetaverseResource,
  resolveMetaverseUiUnlock,
} from "../src/system/metaverse/metaverseUnlockProjection.js";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const clientSource = readFileSync(new URL("../src/system/metaverse/metaverseRuntimeClient.js", import.meta.url), "utf8");
const mountSource = readFileSync(new URL("../src/components/metaverse/MetaverseActivityMount.jsx", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../src/entries/index.main.jsx", import.meta.url), "utf8");

test("MET-5 production adapter calls protected API", () => {
  assert.equal(METAVERSE_UNLOCK_PROJECTION_META.productionApiWired, true);
  assert.match(clientSource, /\/metaverse\/entry/);
  assert.match(pageSource, /requestMetaverseEntry/);
});

test("MET-5 dev fixture cannot run in production", () => {
  assert.match(clientSource, /if \(productionMode\(\)\) return false/);
  assert.match(clientSource, /VITE_METAVERSE_ENABLE_DEV_UNLOCK_FIXTURE !== "0"/);
});

test("MET-5 locked response renders explanation", () => {
  const locked = resolveMetaverseUiUnlock({ id: "data-center-foundations-introduction", type: "ACTIVITY" }, { fixtureEnabled: true });
  assert.equal(locked.decision, "LOCKED");
  assert.match(locked.reason_text, /enrollment|required/i);
  assert.match(pageSource, /entryNotice/);
});

test("MET-5 restricted response cannot enter", () => {
  const restricted = resolveMetaverseUiUnlock({ id: "civic-council-session", type: "ACTIVITY" }, { fixtureEnabled: true });
  assert.equal(canEnterMetaverseResource(restricted), false);
});

test("MET-5 session failure renders safe state", () => {
  assert.match(pageSource, /Your session expired/);
  assert.match(pageSource, /TEMPORARILY_UNAVAILABLE/);
});

test("MET-5 activity mount only occurs after allowed decisions", () => {
  assert.match(pageSource, /canEnterMetaverseResource\(contextUnlock\)/);
  assert.match(pageSource, /<MetaverseActivityMount/);
});

test("MET-5 direct route cannot render activity without protected decision", () => {
  assert.match(indexSource, /routePath\.startsWith\("\/metaverse\/"\)/);
  assert.match(pageSource, /Direct metaverse links require protected server authorization/);
});

test("MET-5 accessible navigator uses same runtime adapter", () => {
  assert.match(pageSource, /getUnlock=\{getUnlock\}/);
  assert.match(pageSource, /onSelectFacility=\{selectFacility\}/);
});

test("MET-5 no fake presence appears", () => {
  assert.doesNotMatch(pageSource, /\d+\s+online|student-\d|fake online/i);
  assert.match(pageSource, /No live presence rendered/);
});

test("MET-5 real Data Center lesson is mounted read-only", () => {
  assert.equal(METAVERSE_ACTIVITY_PLACEHOLDERS.some((item) => item.id === "data-center-foundations-introduction"), true);
  assert.match(mountSource, /data-center-foundations-introduction\.json/);
  assert.match(mountSource, /does not mark completion/);
});
