// Phase 9 — deterministic regional replay and bounded What-If (contracts for Phase 13, not the full engine).
//
// Replay re-applies a range of already-accepted events into a fresh REPLAY-mode MOL bus: order, correlation,
// causation and timestamps are preserved, side-effecting subscribers never run (so no impact is re-derived and no
// request is re-issued), and nothing reaches a domain authority. Replay manufactures no new truth.
// What-If clones simulated state into a separate TEST simulation labeled WHAT_IF; its output is never written back.

import { createMolEventBus } from "../mol/molEventBus.js";
import { projectMolWorldState } from "../mol/molWorldState.js";
import { createRegionalSimulation, REGIONAL_SIMULATION_SYSTEM_ID, REGIONAL_WORLD_TRUTH } from "./regionalSimulation.js";

export const REPLAY_LABEL = "REPLAY";
export const WHAT_IF_LABEL = "WHAT_IF";
export const REPLAY_STATES = Object.freeze(["READY", "PLAYING", "PAUSED", "COMPLETED"]);

function projectionSummary(worldState) {
  return Object.fromEntries(Object.entries(worldState.categories).map(([category, entries]) => [category,
    Object.fromEntries(Object.values(entries).map((entry) => [entry.key, entry.state]).sort(([a], [b]) => a.localeCompare(b)))]));
}

export function createReplaySession(events, { fromSequence = 1, toSequence = events.length, now } = {}) {
  if (!Number.isInteger(fromSequence) || !Number.isInteger(toSequence) || fromSequence < 1 || toSequence > events.length || fromSequence > toSequence) {
    return { ok: false, reason: "REPLAY_RANGE_INVALID" };
  }
  const range = events.slice(fromSequence - 1, toSequence).map((event) => structuredClone(event));
  const bus = createMolEventBus({ replay: true, ...(now !== undefined ? { now: () => now } : {}) });
  let cursor = 0;
  let state = "READY";
  const outcomes = [];

  function step() {
    if (cursor >= range.length) { state = "COMPLETED"; return null; }
    const event = range[cursor];
    cursor += 1;
    const result = bus.publish(event);
    outcomes.push({ sequence: fromSequence + cursor - 1, eventId: event.eventId, eventType: event.eventType, correlationId: event.correlationId, causationId: event.causationId, outcome: result.outcome });
    state = cursor >= range.length ? "COMPLETED" : "PAUSED";
    return result;
  }

  return {
    ok: true,
    session: Object.freeze({
      label: REPLAY_LABEL, mutatesAuthorities: false, ...REGIONAL_WORLD_TRUTH,
      range: { fromSequence, toSequence },
      step,
      pause: () => { if (state === "PLAYING") state = "PAUSED"; return state; },
      resume: () => { state = "PLAYING"; while (cursor < range.length) step(); state = "COMPLETED"; return state; },
      getState: () => state,
      inspect: (sequence) => (sequence >= fromSequence && sequence <= toSequence ? structuredClone(range[sequence - fromSequence]) : null),
      getTimeline: () => outcomes.map((item) => ({ ...item })),
      getProjection: () => projectionSummary(projectMolWorldState(bus.getEvents(), now !== undefined ? { now } : {})),
      // Compare the replayed projection with a current projection over the same events.
      compareWith: (currentEvents) => {
        const replayed = projectionSummary(projectMolWorldState(bus.getEvents(), now !== undefined ? { now } : {}));
        const current = projectionSummary(projectMolWorldState(currentEvents, now !== undefined ? { now } : {}));
        const differing = Object.keys(current).filter((category) => JSON.stringify(current[category]) !== JSON.stringify(replayed[category]));
        return { matches: differing.length === 0, differingCategories: differing };
      },
    }),
  };
}

// Clones the simulated state of `source` into an isolated TEST simulation (label WHAT_IF), applies a bounded
// scenario and returns both projections. Source domain events are re-applied; regional impacts are re-derived in
// the clone. The source simulation is never touched and the output is never canonical.
export function runWhatIf(source, { regionalScenarioId, seed = "what-if", advanceMs = 0, trafficRoutes = [] }) {
  const sourceState = source.getState();
  const created = createRegionalSimulation({ simulationId: `${source.simulationId}:what-if`, mode: "TEST", startAt: sourceState.clock.simulationTime, trafficRoutes, label: WHAT_IF_LABEL });
  if (!created.ok) return created;
  const clone = created.simulation;
  clone.start();
  for (const event of source.getEvents()) {
    if (event.sourceSystem === REGIONAL_SIMULATION_SYSTEM_ID) continue;
    clone.publishDomainEvent({ ...structuredClone(event), simulationId: clone.simulationId });
  }
  const scenario = clone.startScenario(regionalScenarioId, { seed });
  if (!scenario.ok) return { ok: false, reason: scenario.reason, label: WHAT_IF_LABEL };
  clone.advance(advanceMs);
  const before = sourceState;
  const after = clone.getState();
  return {
    ok: true, label: WHAT_IF_LABEL, writesCanonical: false, ...REGIONAL_WORLD_TRUTH,
    baseline: { infrastructure: before.infrastructureSummary, worldFlags: before.worldFlags },
    outcome: { infrastructure: after.infrastructureSummary, worldFlags: after.worldFlags },
    changedFlags: Object.keys(after.worldFlags).filter((key) => after.worldFlags[key] !== before.worldFlags[key]).sort(),
  };
}
