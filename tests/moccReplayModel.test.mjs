import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  advanceMoccReplayCursor,
  createMoccReplayState,
  navigateMoccReplayEvent,
  MOCC_REPLAY_RECORD_KINDS,
  projectMoccHistoricalEvents,
  projectMoccReplayCoverage,
  projectMoccReplayEvents,
  projectMoccStaticContext,
  selectMoccReplayEvent,
  setMoccReplayWindow,
} from "../src/system/metaverse/operations/moccReplayModel.js";

const component = readFileSync(new URL("../src/pages/metaverse/operations/MetaverseOperationsCommandCenter.jsx", import.meta.url), "utf8");

function event(event_id, timestamp, event_type = "CIVIC.ACTIVITY") {
  return { event_id, timestamp, event_type, record_kind: "OBSERVED_EVENT", source_authority: "TEST_SOURCE", source_event_ref: `ref-${event_id}`, title: event_id };
}

test("historical projection accepts only explicitly timestamped source events and preserves provenance", () => {
  const records = projectMoccHistoricalEvents([
    { id: "civic-1", source: "CIVIC", event_type: "CIVIC.ACTIVITY", timestamp: "2026-02-01T01:00:00.000Z", source_authority: "SHF_CIVIC", source_ref: "civic-ref" },
    { id: "planned-only", source: "MISSION", starts_at: "2026-02-01T02:00:00.000Z", source_ref: "plan-ref" },
    { id: "undated", source: "MISSION", timestamp: null, source_ref: "undated-ref" },
  ]);
  assert.equal(records.length, 1);
  assert.equal(records[0].record_kind, "OBSERVED_EVENT");
  assert.equal(records[0].source_authority, "SHF_CIVIC");
  assert.equal(records[0].source_event_ref, "civic-ref");
  assert.equal(records[0].timestamp, "2026-02-01T01:00:00.000Z");
  assert.deepEqual(MOCC_REPLAY_RECORD_KINDS, ["OBSERVED_EVENT", "HISTORICAL_STATE", "STATIC_CONTEXT"]);
});

test("pending and disconnected sources cannot contribute replay records", () => {
  const records = projectMoccHistoricalEvents([
    { id: "traffic", event_type: "TRAFFIC.CONGESTION", timestamp: "2026-02-01T01:00:00Z", source_authority: "TRAFFIC_OWNER", source_ref: "traffic-1" },
    { id: "incident", event_type: "INCIDENT.FIRE", timestamp: "2026-02-01T01:00:00Z", source_authority: "DISPATCH", source_ref: "incident-1" },
    { id: "shnn", event_type: "SHNN.BROADCAST", timestamp: "2026-02-01T01:00:00Z", source_authority: "SHNN", source_ref: "shnn-1" },
  ]);
  assert.deepEqual(records, []);
});

test("canonical facilities are classified as static context without historical timestamps", () => {
  const context = projectMoccStaticContext([{ id: "main-data-center", destinationId: "destination-1", districtId: "data-center-district", label: "Main Data Center" }]);
  assert.deepEqual(context, [{
    record_id: "static-context:destination-1",
    record_kind: "STATIC_CONTEXT",
    title: "Main Data Center",
    source_authority: "METAVERSE_CANONICAL_SPATIAL_REGISTRY",
    source_reference: "destination-1",
    timestamp: null,
    spatial_reference: { facility_id: "main-data-center", destination_id: "destination-1", district_id: "data-center-district" },
  }]);
});

test("Replay model navigates only source events with valid timestamps inside the selected window", () => {
  const records = [event("b", "2026-02-01T01:00:00Z"), event("no-time", null), event("outside", "2026-01-31T23:59:59Z"), event("a", "2026-02-01T00:00:00Z")];
  const start = Date.parse("2026-02-01T00:00:00Z");
  const end = Date.parse("2026-02-01T02:00:00Z");
  const positioned = projectMoccReplayEvents(records, start, end);
  assert.deepEqual(positioned.map((record) => record.event_id), ["a", "b"]);
  let replay = { ...setMoccReplayWindow(createMoccReplayState(end), start, end), cursorTime: start };
  replay = navigateMoccReplayEvent(replay, records, 1);
  assert.equal(replay.selectedReplayEvent.event_id, "a");
  replay = navigateMoccReplayEvent(replay, records, 1);
  assert.equal(replay.selectedReplayEvent.event_id, "b");
  replay = navigateMoccReplayEvent(replay, records, 1);
  assert.equal(replay.selectedReplayEvent.event_id, "b");
  replay = navigateMoccReplayEvent(replay, records, -1);
  assert.equal(replay.selectedReplayEvent.event_id, "a");
});

test("Replay window updates clamp the independent cursor and clear an out-of-window selection", () => {
  const selected = event("a", "2026-02-01T00:30:00Z");
  let replay = setMoccReplayWindow(createMoccReplayState(Date.parse("2026-02-01T01:00:00Z")), Date.parse("2026-02-01T00:00:00Z"), Date.parse("2026-02-01T02:00:00Z"));
  replay = selectMoccReplayEvent(replay, selected);
  replay = setMoccReplayWindow(replay, Date.parse("2026-02-01T01:00:00Z"), Date.parse("2026-02-01T02:00:00Z"));
  assert.equal(replay.cursorTime, Date.parse("2026-02-01T01:00:00Z"));
  assert.equal(replay.selectedReplayEvent, null);
  assert.equal(replay.isPlaying, false);
});

test("Replay playback advances locally at the selected rate and stops at window end", () => {
  const start = 1000;
  let replay = { ...createMoccReplayState(5000), windowStart: start, windowEnd: 5000, cursorTime: 4000, playbackSpeed: 4, isPlaying: true };
  replay = advanceMoccReplayCursor(replay, 200);
  assert.equal(replay.cursorTime, 4800);
  assert.equal(replay.isPlaying, true);
  replay = advanceMoccReplayCursor(replay, 200);
  assert.equal(replay.cursorTime, 5000);
  assert.equal(replay.isPlaying, false);
  const paused = advanceMoccReplayCursor({ ...replay, isPlaying: false }, 500);
  assert.equal(paused.cursorTime, 5000);
});

test("Replay source coverage reports historical capability without converting live status into historical fact", () => {
  const records = [
    event("civic", "2026-02-01T00:10:00Z"),
    event("mission", "2026-01-30T00:10:00Z", "MISSION.ACTIVITY"),
    event("pending-traffic", "2026-02-01T00:20:00Z", "TRAFFIC.CONGESTION"),
  ];
  const context = projectMoccStaticContext([{ id: "facility-1", destinationId: "destination-1", label: "Facility" }]);
  const coverage = projectMoccReplayCoverage(records, Date.parse("2026-02-01T00:00:00Z"), Date.parse("2026-02-01T01:00:00Z"), context);
  assert.equal(coverage.find((row) => row.id === "civic").status, "AVAILABLE");
  assert.equal(coverage.find((row) => row.id === "missions").status, "PARTIAL");
  assert.equal(coverage.find((row) => row.id === "traffic").status, "PENDING");
  assert.equal(coverage.find((row) => row.id === "traffic").recordCount, 0);
  assert.equal(coverage.find((row) => row.id === "weather").status, "PENDING");
  assert.equal(coverage.find((row) => row.id === "fire-ems").status, "PENDING");
  assert.equal(coverage.find((row) => row.id === "utilities").status, "UNAVAILABLE");
  assert.equal(coverage.find((row) => row.id === "marine-aviation").status, "PARTIAL");
  assert.equal(coverage.find((row) => row.id === "agents").status, "PENDING");
  assert.equal(coverage.find((row) => row.id === "students").status, "PENDING");
  assert.equal(coverage.find((row) => row.id === "shnn").status, "UNAVAILABLE");
  assert.equal(coverage.find((row) => row.id === "infrastructure").status, "AVAILABLE");
  assert.equal(coverage.find((row) => row.id === "infrastructure").record_kind, "STATIC_CONTEXT");
  assert.deepEqual(coverage.map((row) => row.label), ["Missions", "Simulations", "Civic", "Traffic", "Weather", "Fire / EMS", "Utilities", "Marine / Aviation", "Agents", "Students / Multiplayer", "SHNN", "Infrastructure context"]);
});

test("connected event projections without explicit historical timestamps remain PARTIAL, not historical records", () => {
  const coverage = projectMoccReplayCoverage([], 0, 100);
  assert.equal(coverage.find((row) => row.id === "missions").status, "PARTIAL");
  assert.equal(coverage.find((row) => row.id === "civic").status, "PARTIAL");
  assert.equal(coverage.find((row) => row.id === "missions").recordCount, 0);
  assert.match(coverage.find((row) => row.id === "missions").detail, /no timestamped historical archive records/);
});

test("Replay navigation opens a separate read-only workspace and playback is cleaned up on exit", () => {
  assert.match(component, /activeSection === "Replay" \? <ReplayWorkspace/);
  assert.match(component, /"Dependencies", "Replay"\]\./);
  assert.match(component, /HISTORICAL \/ READ ONLY/);
  assert.match(component, /No historical events available for this window\./);
  assert.match(component, /projectMoccHistoricalEvents\(sourceCityEvents\)/);
  assert.match(component, /STATIC_CONTEXT · NOT HISTORICAL_STATE/);
  assert.match(component, /No authoritative historical state snapshots are exposed/);
  assert.match(component, /if \(activeSection !== "Replay" \|\| !replay\.isPlaying\) return undefined;/);
  assert.match(component, /return \(\) => window\.clearInterval\(timer\);/);
  assert.match(component, /const timelineWindowEvents = projectMoccTimelineEvents\(projectedEvents, timelineWindowEnd\);/);
  assert.match(component, /const \[replay, setReplay\] = useState\(\(\) => createMoccReplayState\(\)\);/);
  assert.doesNotMatch(component, /setTimelineWindowEnd\(replay\.|timelineWindowEnd\s*=\s*replay\./);
  assert.match(component, /<ReplayWorkspace events=\{replayHistoricalEvents\} staticContext=\{replayStaticContext\} replay=\{replay\} setReplay=\{setReplay\}/);
  const replayWorkspace = component.slice(component.indexOf("function ReplayWorkspace"), component.indexOf("function CommandCenterSurface"));
  assert.doesNotMatch(replayWorkspace, /setTimeline|setOrchestration|executeCommand|dispatchCommand|fastTravel|localStorage|fetch\(/i);
});
