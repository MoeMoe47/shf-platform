// MOCC-1 — Operations Command Center / Digital Twin contract tests.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const miniMapSource = readFileSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url), "utf8");
const cityPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const operationsSource = readFileSync(new URL("../src/pages/metaverse/operations/MetaverseOperationsCommandCenter.jsx", import.meta.url), "utf8");
const operationsCss = readFileSync(new URL("../src/pages/metaverse/operations/metaverse-operations-command-center.css", import.meta.url), "utf8");
const eventProjectionSource = readFileSync(new URL("../src/system/metaverse/operations/moccEventProjection.js", import.meta.url), "utf8");

test("MOCC-1 — /metaverse/operations still routes to the distinct operations command center", () => {
  assert.match(cityPageSource, /import MetaverseOperationsCommandCenter/);
  assert.match(cityPageSource, /\^\\\/metaverse\\\/operations\\\/\?\$/);
  assert.match(cityPageSource, /return <MetaverseOperationsCommandCenter \/>/);
  assert.match(operationsSource, /Operations &amp; Orchestration Command Center/);
  assert.match(operationsSource, /Separate authorities\. Shared coordination\. One living city\./);
  assert.match(operationsSource, /permissions=\{\["operations\.awareness\.read"\]\}/);
});

test("MOCC-1 — normal student Mini Map still reads and persists the student's collapsed/compact/expanded preference", () => {
  assert.match(miniMapSource, /const \[mapState, setMapState\] = useState\(\(\) => readStoredMapState\(\)\);/);
  assert.match(miniMapSource, /function writeStoredMapState\(value\) \{[\s\S]{0,120}window\.localStorage\.setItem\(MAP_STATE_STORAGE_KEY, value\);/);
  assert.match(miniMapSource, /const setMapStateAndPersist = \(value\) => \{[\s\S]{0,80}setMapState\(value\);[\s\S]{0,80}writeStoredMapState\(value\);/);
  assert.match(cityPageSource, /<MetaverseMiniMap\s*\n\s*currentDistrictId=\{districtId\}/);
  assert.doesNotMatch(cityPageSource, /presentation="operations"[\s\S]{0,400}currentDistrictId=\{districtId\}/);
});

test("MOCC-1 — operations presentation derives an expanded effective state without overwriting student storage", () => {
  assert.match(miniMapSource, /presentation,/);
  assert.match(miniMapSource, /const operationsPresentation = presentation === "operations";/);
  assert.match(miniMapSource, /const effectiveMapState = operationsPresentation \? "expanded" : mapState;/);
  assert.doesNotMatch(miniMapSource, /writeStoredMapState\("expanded"\)/);
  const effectiveStateIndex = miniMapSource.indexOf('const effectiveMapState = operationsPresentation ? "expanded" : mapState;');
  const persistenceIndex = miniMapSource.indexOf("const setMapStateAndPersist = (value) => {");
  assert.ok(effectiveStateIndex > -1 && persistenceIndex > effectiveStateIndex);
  assert.doesNotMatch(miniMapSource.slice(effectiveStateIndex, persistenceIndex), /writeStoredMapState/);
});

test("MOCC-1 — operations presentation renders an expanded embedded Digital Twin and removes the collapse control", () => {
  assert.match(operationsSource, /<MetaverseMiniMap\s*\n\s*presentation="operations"/);
  assert.match(operationsSource, /className="mocc__quick-map-authority"/);
  assert.match(operationsSource, /className="mocc__digital-twin"/);
  assert.match(operationsSource, /className="mocc__city-camera"/);
  assert.match(operationsSource, /CITY_CAMERA_ASSET = "public\/assets\/metaverse\/city\/silicon-heartland-city-night\.png"/);
  assert.match(operationsSource, /METAVERSE_SCENE_IMAGE_ASPECT_RATIO/);
  assert.match(miniMapSource, /met-citymap--\$\{effectiveMapState\}\$\{operationsPresentation \? " met-citymap--operations" : ""\}/);
  assert.match(miniMapSource, /data-presentation=\{operationsPresentation \? "operations" : undefined\}/);
  assert.match(miniMapSource, /!\operationsPresentation \? \(\s*\n\s*effectiveMapState === "collapsed"/);
  assert.match(miniMapSource, /effectiveMapState === "expanded" && activeTab === "DISTRICT_MAP"/);
  assert.match(operationsCss, /--mocc-blue-600:\s*#0255ca;/);
  assert.match(operationsCss, /--mocc-blue-500:\s*#176fd2;/);
  assert.match(operationsCss, /\.mocc__digital-twin\s*\{/);
  assert.match(operationsCss, /\.mocc__city-camera\s*\{/);
  assert.match(operationsCss, /\.mocc__quick-map-authority\s*\{[^}]*display:\s*none;/s);
  assert.match(operationsCss, /\.mocc__camera-card\s*\{[^}]*width: 220px;[^}]*padding: 5px;/s);
  assert.match(operationsCss, /\.mocc__camera-card-image\s*\{[^}]*height: 48px;/s);
  assert.match(operationsCss, /\.mocc__region-overview\s*\{[^}]*width: 190px;[^}]*padding: 5px;/s);
  assert.match(operationsCss, /\.mocc__region-map\s*\{[^}]*height: 86px;[^}]*brightness\(0\.78\)/s);
});

test("MOCC-1 — operations Digital Twin reuses the canonical Quick Map, markers, overlays, infrastructure, and layer logic", () => {
  assert.match(miniMapSource, /const mapAssetUrl = publicAssetUrl\(MINIMAP_ASSET\);/);
  assert.match(miniMapSource, /backgroundImage: `url\(\$\{mapAssetUrl\}\)`/);
  assert.match(miniMapSource, /districts\.map\(\(district\) => \{/);
  assert.match(miniMapSource, /live = layerToggles\.events && hasActiveEvent/);
  assert.match(miniMapSource, /opportunityCount = layerToggles\.opportunities \? opportunityCountFor/);
  assert.match(miniMapSource, /infrastructureLocations\.map\(\(location\) => \(/);
  assert.match(miniMapSource, /aria-label=\{`\$\{district\.fullLabel \|\| district\.label\}/);
  assert.match(operationsSource, /districts=\{METAVERSE_DISTRICTS\}/);
  assert.match(operationsSource, /events=\{sourceCityEvents\}/);
  assert.match(operationsSource, /civicActive=\{Boolean\(orchestration\?\.civic_state\)\}/);
  assert.match(operationsSource, /MINIMAP_ASSET, getDistrictQuickMapLocation/);
  assert.match(operationsSource, /PRIMARY_DISTRICT_MARKER_IDS = new Set\(/);
  assert.match(operationsSource, /METAVERSE_DISTRICTS\.filter\(\(district\) => PRIMARY_DISTRICT_MARKER_IDS\.has\(district\.id\)\)/);
  assert.doesNotMatch(operationsSource, /Foreground South Belt/);
  assert.match(operationsSource, /style=\{\{ left: `\$\{district\.x\}%`, top: `\$\{district\.y\}%` \}\}/);
  assert.match(operationsSource, /const quickMapLocation = getDistrictQuickMapLocation\(district\.id\);/);
});

test("MOCC-1 — MOCC controls remain read-only display state and do not execute operational commands", () => {
  assert.match(operationsSource, /MOCC-1 · READ ONLY/);
  assert.match(operationsSource, /onClick=\{\(\) => setMode\(item\.id\)\}/);
  assert.match(operationsSource, /onClick=\{\(\) => setMode\("MANUAL"\)\}/);
  assert.match(operationsSource, /onTravel=\{\(\) => \{\}\}/);
  assert.doesNotMatch(operationsSource, /fastTravel|executeCommand|dispatchCommand|mutate|fetch\([^)]*,\s*\{\s*method:\s*["'](?:POST|PUT|DELETE)/i);
  assert.match(operationsSource, /Weather<\/strong><em>—<\/em>/);
  assert.match(operationsSource, /title="Wind integration pending"/);
  assert.match(operationsSource, /Active Vehicles", "—", "Operational feed pending"/);
});

test("MOCC-1 — Live Operations metrics stay source-backed and fit a compact four-card rail", () => {
  assert.match(operationsSource, /const projectionReady = !loading && !error && Boolean\(orchestration\);/);
  assert.match(operationsSource, /projectionReady \? projectedEvents\.length : "—"/);
  assert.match(operationsSource, /projectionReady \? pulses\.length : "—"/);
  assert.match(operationsSource, /projectionReady \? briefingItems\.length : "—"/);
  assert.match(operationsSource, /systemHealth === "READ" \? "READ" : "—"/);
  assert.match(operationsCss, /grid-template-columns: clamp\(220px, 17vw, 274px\) minmax\(0, 1fr\) clamp\(260px, 19vw, 304px\);/);
  assert.match(operationsCss, /\.mocc__metric-grid\s*\{[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/s);
  assert.match(operationsCss, /\.mocc__empty\s*\{[^}]*min-height: 38px;/s);
});

test("MOCC-6 — timeline markers require a source-backed event timestamp inside the selected window", () => {
  assert.match(operationsSource, /const timelineWindowEvents = projectMoccTimelineEvents\(projectedEvents, timelineWindowEnd\);/);
  assert.match(eventProjectionSource, /Date\.parse\(event\?\.timestamp \|\| ""\)/);
  assert.match(operationsSource, /timelineEvents\.map\(\(event\) =>/);
  assert.doesNotMatch(operationsSource, /Array\.from\(\{ length: 18 \}/);
  assert.match(operationsCss, /grid-template-rows: 28px minmax\(0, 1fr\);/);
  assert.match(operationsCss, /\.mocc__timeline-ruler\s*\{[^}]*height: 30px;[^}]*repeating-linear-gradient\(90deg, rgba\(80, 158, 219, 0\.14\)/s);
  assert.match(operationsCss, /\.mocc__timeline button\.mocc__timeline-pulse\s*\{[^}]*width: 7px;[^}]*height: 7px;/s);
  assert.match(operationsSource, /timelineLaneCount/);
});
