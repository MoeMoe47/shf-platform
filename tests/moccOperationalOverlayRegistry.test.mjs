import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { QUICK_MAP_COORDINATE_SPACE } from "../src/system/metaverse/metaverseMiniMapRegistry.js";
import { getMoccIntegrationStatus } from "../src/system/metaverse/operations/moccIntegrationStatusRegistry.js";
import {
  createDefaultMoccOverlayVisibility,
  getMoccRenderableOverlayEntities,
  MOCC_OPERATIONAL_OVERLAYS,
  setMoccOverlayVisibility,
} from "../src/system/metaverse/operations/moccOperationalOverlayRegistry.js";

const componentSource = readFileSync(new URL("../src/pages/metaverse/operations/MetaverseOperationsCommandCenter.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/operations/metaverse-operations-command-center.css", import.meta.url), "utf8");

test("MOCC-5A registry covers planned domains and reuses canonical integration records", () => {
  const ids = MOCC_OPERATIONAL_OVERLAYS.map(({ overlay_id }) => overlay_id);
  assert.equal(new Set(ids).size, ids.length);
  for (const item of MOCC_OPERATIONAL_OVERLAYS) {
    assert.equal(item.integration_status, getMoccIntegrationStatus(item.integration_domain));
    assert.equal(item.status, item.integration_status?.status ?? "NOT_CONNECTED");
    assert.equal(item.default_visible, false);
    assert.ok(item.category);
    assert.ok(item.legend_key);
  }
  assert.equal(MOCC_OPERATIONAL_OVERLAYS.find(({ overlay_id }) => overlay_id === "traffic").status, "PENDING");
  assert.equal(MOCC_OPERATIONAL_OVERLAYS.find(({ overlay_id }) => overlay_id === "missions").status, "CONNECTED");
  assert.equal(MOCC_OPERATIONAL_OVERLAYS.find(({ overlay_id }) => overlay_id === "marine").status, "PARTIAL");
  assert.equal(MOCC_OPERATIONAL_OVERLAYS.find(({ overlay_id }) => overlay_id === "power").status, "NOT_CONNECTED");
});

test("pending and disconnected overlays cannot expose fabricated entities; connected projections retain source provenance", () => {
  const entity = Object.freeze({ id: "event-1", source_authority: "MET-7_PROGRAM_MISSION", location: Object.freeze({ district_id: "civic-district" }) });
  assert.deepEqual(getMoccRenderableOverlayEntities("traffic", [entity]), []);
  assert.deepEqual(getMoccRenderableOverlayEntities("shnn-media", [entity]), []);
  const projected = getMoccRenderableOverlayEntities("missions", [entity, { id: "unattributed" }]);
  assert.deepEqual(projected, [entity]);
  assert.equal(projected[0].source_authority, "MET-7_PROGRAM_MISSION");
  assert.equal(Object.isFrozen(entity), true);
});

test("visibility is local immutable presentation state and does not mutate source records", () => {
  const source = Object.freeze({ mission_id: "mission-1", state: "ACTIVE" });
  const before = structuredClone(source);
  const initial = createDefaultMoccOverlayVisibility();
  const next = setMoccOverlayVisibility(initial, "missions", true);
  assert.notEqual(next, initial);
  assert.equal(initial.missions, false);
  assert.equal(next.missions, true);
  assert.equal(source.state, before.state);
  assert.equal(setMoccOverlayVisibility(next, "unknown", true), next);
});

test("spatial overlays reference Quick Map rather than defining another coordinate authority", () => {
  for (const item of MOCC_OPERATIONAL_OVERLAYS.filter(({ spatial_authority }) => spatial_authority)) {
    assert.equal(item.spatial_authority, QUICK_MAP_COORDINATE_SPACE.id);
  }
  const source = readFileSync(new URL("../src/system/metaverse/operations/moccOperationalOverlayRegistry.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bcoordinates?\s*:\s*\[|\bx\s*:\s*\d+|\by\s*:\s*\d+/i);
});

test("Layers control toggles compact local visibility state without replacing canonical district markers", () => {
  assert.match(componentSource, /aria-label="Layers"[\s\S]*?aria-expanded=\{layersOpen\}[\s\S]*?setLayersOpen/);
  assert.match(componentSource, /setMoccOverlayVisibility\(current, overlay\.overlay_id, event\.target\.checked\)/);
  assert.match(componentSource, /overlay\.status === "NOT_CONNECTED" \|\| overlay\.status === "UNAVAILABLE"/);
  assert.match(componentSource, /overlay\.status === "PENDING" && overlayVisibility\[overlay\.overlay_id\]/);
  assert.match(componentSource, /METAVERSE_DISTRICTS\.filter\(\(district\) => PRIMARY_DISTRICT_MARKER_IDS\.has\(district\.id\)\)/);
  assert.match(componentSource, /events=\{sourceCityEvents\}/);
  assert.match(cssSource, /\.mocc__overlay-menu\s*\{/);
  assert.match(cssSource, /\.mocc__overlay-status--partial,[\s\S]*?\.mocc__overlay-status--foundation\s*\{/);
});
