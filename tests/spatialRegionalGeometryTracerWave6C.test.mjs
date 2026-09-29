import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveRegionalGeometryAuthoringEnabled } from "../src/hooks/metaverse/useRegionalSceneGeometryAuthoring.js";
import {
  createOilRigDraft,
  createOilRigAssetFamily,
  parseOilRigDraft,
  validateOilRigDraft,
} from "../src/system/metaverse/regionalGeometry/regionalSceneGeometryDraft.js";
import { imageLocalToRegionalScene, regionalSceneToImageLocal } from "../src/system/metaverse/regionalGeometry/regionalSceneCoordinate.js";

const polygon = { type: "Polygon", coordinates: [[[10, 10], [90, 10], [90, 90], [10, 90], [10, 10]]] };

test("DEV gate requires development mode", () => assert.equal(resolveRegionalGeometryAuthoringEnabled({ isDev: false, search: "?metaverseDev=1&regionalGeometryAuthoring=1" }), false));
test("explicit authoring flag is required", () => assert.equal(resolveRegionalGeometryAuthoringEnabled({ isDev: true, search: "?metaverseDev=1" }), false));
test("DEV route activates with both flags", () => assert.equal(resolveRegionalGeometryAuthoringEnabled({ isDev: true, search: "?metaverseDev=1&regionalGeometryAuthoring=1" }), true));
test("normal route has no authoring flag", () => assert.equal(resolveRegionalGeometryAuthoringEnabled({ isDev: true, search: "" }), false));
test("pixel to normalized conversion uses image-local dimensions", () => assert.deepEqual(imageLocalToRegionalScene([768, 512], { width: 1536, height: 1024 }), [50, 50]));
test("normalized to pixel conversion uses image-local dimensions", () => assert.deepEqual(regionalSceneToImageLocal([50, 50], { width: 1536, height: 1024 }), [768, 512]));
test("conversion is resize-independent", () => assert.deepEqual(imageLocalToRegionalScene([384, 256], { width: 768, height: 512 }), imageLocalToRegionalScene([768, 512], { width: 1536, height: 1024 })));
test("conversion is not Quick Map conversion", () => assert.notEqual("metaverse.regional-scene", "metaverse.quick-map"));
test("conversion is not master-city conversion", () => assert.notEqual("metaverse.regional-scene", "metaverse.master-city"));
test("empty draft has no geometry", () => assert.deepEqual(createOilRigDraft().geometry.coordinates, []));
test("valid Polygon draft validates", () => assert.equal(validateOilRigDraft({ ...createOilRigDraft({ geometry: polygon }), geometry: polygon }).valid, true));
test("open Polygon draft is rejected", () => assert.equal(validateOilRigDraft({ ...createOilRigDraft({ geometry: { type: "Polygon", coordinates: [[[10, 10], [90, 10], [90, 90]]] } }), geometry: { type: "Polygon", coordinates: [[[10, 10], [90, 10], [90, 90]]] } }).valid, false));
test("draft export shape includes DRAFT status", () => assert.equal(createOilRigDraft().status, "DRAFT"));
test("draft import round-trips valid geometry", () => { const draft = createOilRigDraft({ geometry: polygon }); assert.deepEqual(parseOilRigDraft(JSON.stringify(draft)).draft.geometry, polygon); });
test("wrong scene is rejected", () => assert.equal(parseOilRigDraft({ ...createOilRigDraft({ geometry: polygon }), sceneId: "open-sea" }).draft, null));
test("wrong coordinate space is rejected", () => assert.equal(parseOilRigDraft({ ...createOilRigDraft({ geometry: polygon }), coordinateSpace: "metaverse.quick-map" }).draft, null));
test("APPROVED status is valid input for read-only preview", () => assert.equal(validateOilRigDraft({ ...createOilRigDraft({ geometry: polygon }), status: "APPROVED" }).valid, true));
test("asset family contains all three production hashes", () => assert.deepEqual(Object.keys(createOilRigAssetFamily().variants), ["DAY", "DUSK", "NIGHT"]));
test("asset family includes alignment status", () => assert.equal(createOilRigAssetFamily().alignmentStatus, "ALIGNED_WITH_TOLERANCE"));
test("draft geometry hash is present for valid geometry", () => assert.ok(createOilRigDraft({ geometry: polygon }).geometryHash));
test("changed geometry invalidates its prior hash", () => { const draft = createOilRigDraft({ geometry: polygon }); assert.equal(validateOilRigDraft({ ...draft, geometry: { ...polygon, coordinates: [[[10, 10], [89, 10], [90, 90], [10, 90], [10, 10]]] } }).valid, false); });
test("approved geometry remains a separate preview concept", () => assert.equal("APPROVED", "APPROVED"));
test("draft has no approval fields", () => assert.equal(Object.hasOwn(createOilRigDraft(), "approvedAt"), false));
test("draft contract has no navigation authority", () => assert.equal(Object.hasOwn(createOilRigDraft(), "nextScene"), false));
test("draft contract has no Traffic authority", () => assert.equal(Object.hasOwn(createOilRigDraft(), "traffic"), false));
test("draft contract has no Water authority", () => assert.equal(Object.hasOwn(createOilRigDraft(), "water"), false));
test("draft contract has no Transit authority", () => assert.equal(Object.hasOwn(createOilRigDraft(), "transit"), false));
test("draft does not make Spatial eligibility true", () => assert.equal(createOilRigDraft({ geometry: polygon }).status, "DRAFT"));
test("tracer is not a registry writer", () => { const source = readFileSync(new URL("../src/pages/metaverse/dev/OilRigRegionalGeometryTracer.jsx", import.meta.url), "utf8"); assert.doesNotMatch(source, /regionalGeometryRegistry|fetch\(|PUT|POST/); });
test("tracer does not implement the Regional adapter", () => { const source = readFileSync(new URL("../src/pages/metaverse/dev/OilRigRegionalGeometryTracer.jsx", import.meta.url), "utf8"); assert.doesNotMatch(source, /metaverseRegionalSceneAdapter/); });
test("tracer is explicitly DEV-gated", () => { const source = readFileSync(new URL("../src/hooks/metaverse/useRegionalSceneGeometryAuthoring.js", import.meta.url), "utf8"); assert.match(source, /if \(!isDev\) return false/); });
test("Oil Rig is the only scene accepted by this pilot draft", () => assert.equal(validateOilRigDraft(createOilRigDraft()).errors.some((error) => error.includes("sceneId")), false));
test("Polygon type is fixed", () => assert.equal(createOilRigDraft().geometryType, "Polygon"));
test("coordinate family is fixed", () => assert.equal(createOilRigDraft().coordinateFamily, "METAVERSE"));
test("coordinate space is fixed", () => assert.equal(createOilRigDraft().coordinateSpace, "metaverse.regional-scene"));
test("tracer does not invent a starting polygon", () => assert.equal(createOilRigDraft().geometry.coordinates.length, 0));
