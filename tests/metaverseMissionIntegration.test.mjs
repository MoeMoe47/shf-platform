import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const clientSource = readFileSync(new URL("../src/system/metaverse/metaverseMissionClient.js", import.meta.url), "utf8");
const listSource = readFileSync(new URL("../src/components/metaverse/MetaverseMissionList.jsx", import.meta.url), "utf8");
const hotspotSource = readFileSync(new URL("../src/components/metaverse/MetaverseHotspot.jsx", import.meta.url), "utf8");
const controlsSource = readFileSync(new URL("../src/components/metaverse/MetaverseCameraControls.jsx", import.meta.url), "utf8");
const sidebarSource = readFileSync(new URL("../src/components/metaverse/MetaverseSidebar.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("MET-7 mission client talks to the real mission API only and sends no client-authority fields", () => {
  assert.match(clientSource, /\/metaverse\/missions/);
  assert.match(clientSource, /credentials: "include"/);
  assert.equal(/organization_id\s*:/.test(clientSource), false);
  assert.equal(/student_id\s*:/.test(clientSource), false);
  assert.equal(/user_id\s*:\s*["']/.test(clientSource), false);
  assert.equal(/completion\s*:\s*true/.test(clientSource), false);
  assert.match(clientSource, /clientAuthorityFieldsSent:\s*false/);
});

test("MET-7 mission client exposes list/get/enter/events/submit and nothing that writes truth directly", () => {
  assert.match(clientSource, /export function listMissions/);
  assert.match(clientSource, /export function getMission\(/);
  assert.match(clientSource, /export function enterMission\(/);
  assert.match(clientSource, /export function recordMissionActivityCompleted\(/);
  assert.match(clientSource, /export function submitMission\(/);
});

test("MET-7 city page wires mission state through the real client, never a hardcoded mission array", () => {
  assert.match(pageSource, /listMissions\(\)/);
  assert.match(pageSource, /enterMissionApi\(/);
  assert.match(pageSource, /const \[missions, setMissions\] = useState\(\[\]\)/);
  assert.doesNotMatch(pageSource, /missionTitle:\s*["']/);
  assert.doesNotMatch(pageSource, /missionProjectionId:\s*["']miss_/);
});

test("MET-7 mission markers/counts are derived from the fetched missions list only, never fabricated", () => {
  assert.match(pageSource, /missionCountsByDistrict/);
  assert.match(pageSource, /missionCountsByFacility/);
  assert.match(pageSource, /missionCount:\s*missionCountsByDistrict\[district\.id\]\s*\|\|\s*0/);
  assert.match(pageSource, /missionCount:\s*missionCountsByFacility\[facility\.id\]\s*\|\|\s*0/);
  // the counts object is built purely from the `missions` state array — no
  // literal numeric fallback that would render a badge without real data
  assert.doesNotMatch(pageSource, /missionCount:\s*\d+/);
});

test("MET-7 mission entry always goes through the protected mission-aware endpoint, never a direct navigation bypass", () => {
  assert.match(pageSource, /const handleSelectMission = async \(mission\) => \{/);
  assert.match(pageSource, /result = await enterMissionApi\(mission\.missionProjectionId\)/);
  assert.match(pageSource, /if \(!result\?\.can_enter\)/);
  // a denial must surface a reason, never silently no-op
  assert.match(pageSource, /setEntryNotice\(result\?\.entry\?\.decision\?\.reason_text \|\| result\?\.mission\?\.nextAction\?\.reason/);
});

test("MET-7 a locked/blocked mission surfaces its real reason text, not a generic message only", () => {
  assert.match(pageSource, /result\?\.mission\?\.nextAction\?\.reason/);
  assert.match(listSource, /mission\.nextAction\.label/);
  assert.match(listSource, /mission\.nextAction\.reason/);
});

test("MET-7 mission list renders real prerequisite/status/arcade fields from server data only", () => {
  assert.match(listSource, /mission\.missionStatus/);
  assert.match(listSource, /mission\.location\.districtId/);
  assert.match(listSource, /mission\.arcadeRelations/);
  assert.match(listSource, /requiredOrRecommended/);
  assert.match(listSource, /masteryAchieved/);
  assert.doesNotMatch(listSource, /verified\s*mastery/i);
  assert.doesNotMatch(listSource, /credential/i);
  assert.doesNotMatch(listSource, /job\s*eligib/i);
});

test("MET-7 mission list is the accessible, non-spatial equivalent to walking the city — proper labeling/roles, no fake data", () => {
  assert.match(listSource, /aria-label="Accessible mission list"/);
  assert.match(listSource, /role="status"/);
  assert.match(listSource, /missions\.map\(/);
  assert.doesNotMatch(listSource, /missions\.push\(/);
  assert.doesNotMatch(listSource, /const missions = \[/);
});

test("MET-7 mission hotspot badge is decorative-only and count is also exposed via the accessible label", () => {
  assert.match(hotspotSource, /item\.missionCount/);
  assert.match(hotspotSource, /aria-hidden="true">\{item\.missionCount\}/);
  assert.match(hotspotSource, /mission\$\{item\.missionCount === 1 \? "" : "s"\}/);
});

// UI AUTHORITY RECONCILIATION — owner decision: the sidebar supersedes
// the floating lower-right Locations/Missions/Opportunity Exchange
// cluster that MET-7/MET-8 originally required on the city canvas
// (MetaverseCameraControls.jsx). The underlying capability (opening the
// mission list, wired to the real missionsOpen/missions.length state)
// is unchanged and still required — only the floating PRESENTATION of
// it is gone, proven accessible instead through MetaverseSidebar's
// "Missions" nav item, which drives the exact same state.
test("MET-7 (superseded) — camera controls no longer render a Missions toggle; the capability moved to the sidebar", () => {
  assert.doesNotMatch(controlsSource, /onToggleMissions/, "the floating Missions toggle must be gone from the camera controls cluster");
  assert.doesNotMatch(controlsSource, />Missions</, "no floating Missions button text on the city canvas");
});

test("MET-7 (superseded) — the sidebar's Missions nav item is wired to the exact same real state (missionsOpen/missionCount) the old floating toggle used", () => {
  assert.match(sidebarSource, /<NavItem icon="🧭" label="Missions" sublabel="[^"]*" active=\{missionsOpen\} badge=\{missionCount\} onClick=\{onMissions\} expanded=\{expanded\} \/>/);
  assert.match(pageSource, /<MetaverseSidebar[\s\S]{0,400}missionsOpen=\{missionsOpen\}/, "MetaverseCityPage.jsx must still pass the real missionsOpen state into the sidebar");
  assert.match(pageSource, /<MetaverseSidebar[\s\S]{0,400}missionCount=\{missions\.length\}/, "the sidebar's mission badge must come from the real fetched missions array, never a hardcoded count");
  assert.match(pageSource, /onMissions=\{\(\) => openPanel\(setMissionsOpen\)\}/, "the sidebar's Missions click must open the SAME missionsOpen state the mission list panel reads");
  assert.match(pageSource, /<MetaverseMissionList/);
  assert.match(pageSource, /onSelectMission=\{handleSelectMission\}/);
});

test("MET-7 mission panel and badge styling reuse the existing met-* design language, not a new system", () => {
  assert.match(cssSource, /\.met-missions\s*\{/);
  assert.match(cssSource, /\.met-missions__card\s*\{/);
  assert.match(cssSource, /\.met-hotspot__mission-count\s*\{/);
});

test("MET-7 portfolio/career labels are never asserted as verified unless the mission data itself says so", () => {
  // the list renders career context, if any, straight from mission data —
  // it never hardcodes a "verified"/"eligible" string itself
  assert.doesNotMatch(listSource, /verified\s*(evidence|outcome)/i);
  assert.doesNotMatch(listSource, /eligible\s*for\s*(a\s*)?job/i);
});
