import React, { useEffect, useMemo, useRef, useState } from "react";
import trafficRouteData from "@/system/metaverse/traffic/metaverseTrafficRoutes.json";
import {
  MOL_HEALTH_STATES,
  buildMolCommandCenterViewModel,
  createMolScenarioRun,
  createMolSession,
  listMolSystems,
  molStatusLabel,
  projectMolWorldState,
  replayMolEvents,
} from "@/system/metaverse/mol/index.js";
import "./mol-command-center.css";

// Phase 4F.5 — /metaverse/dev/orchestration. Diagnostic MOL command surface.
// It drives an in-memory MOL session with approved seeded scenarios only; it has
// no production-admin powers and reaches no domain authority.
const AUTOPLAY_INTERVAL_MS = 800;
const routes = trafficRouteData.routes || [];

function Table({ caption, columns, rows, empty = "None." }) {
  if (!rows.length) return <p className="mol-cc__empty">{empty}</p>;
  return (
    <div className="mol-cc__tableWrap" role="region" aria-label={caption} tabIndex={0}>
      <table className="mol-cc__table">
        <caption>{caption}</caption>
        <thead><tr>{columns.map(([key, label]) => <th key={key} scope="col">{label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.__key ?? index}>{columns.map(([key]) => <td key={key}>{row[key] === null || row[key] === undefined ? "—" : String(row[key])}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section className="mol-cc__section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </section>
  );
}

export default function MolCommandCenterPage() {
  const sessionRef = useRef(null);
  if (!sessionRef.current) sessionRef.current = createMolSession({ trafficRoutes: routes });
  const runRef = useRef(null);
  const [version, setVersion] = useState(0);
  const [scenarioId, setScenarioId] = useState("BRIDGE_INCIDENT");
  const [autoplay, setAutoplay] = useState(false);
  const [replay, setReplay] = useState(null);
  const [healthTarget, setHealthTarget] = useState("road-traffic");
  const [healthState, setHealthState] = useState("DEGRADED");
  const [announcement, setAnnouncement] = useState("");
  const refresh = () => setVersion((value) => value + 1);

  const viewModel = useMemo(
    () => buildMolCommandCenterViewModel(sessionRef.current, { scenarioRun: runRef.current, replay }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, replay],
  );

  function ensureRun() {
    if (!runRef.current || runRef.current.scenarioId !== scenarioId || runRef.current.getState() === "COMPLETED") {
      runRef.current = createMolScenarioRun({
        bus: sessionRef.current.bus, scenarioId, trafficRoutes: routes,
        seed: `seed-${Date.now()}`, startAt: new Date().toISOString(),
      });
    }
    return runRef.current;
  }

  function stepOnce() {
    const run = ensureRun();
    const result = run.step();
    if (result) setAnnouncement(`${result.outcome}: ${result.eventId}`);
    if (run.getState() === "COMPLETED") setAutoplay(false);
    refresh();
  }

  useEffect(() => {
    if (!autoplay) return undefined;
    const timer = window.setInterval(stepOnce, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, scenarioId]);

  function runAll() {
    const state = ensureRun().run();
    setAnnouncement(`Scenario ${scenarioId} ${state.toLowerCase()}.`);
    refresh();
  }

  function replayChain() {
    const events = sessionRef.current.bus.getEvents();
    const now = sessionRef.current.now();
    const result = replayMolEvents(events, { now });
    const live = projectMolWorldState(events, { now });
    setReplay({ timeline: result.timeline, matchesLive: JSON.stringify(result.worldState.categories) === JSON.stringify(live.categories) });
    setAnnouncement(`Replayed ${result.timeline.length} events.`);
  }

  function reset() {
    sessionRef.current = createMolSession({ trafficRoutes: routes });
    runRef.current = null;
    setAutoplay(false);
    setReplay(null);
    setAnnouncement("Session reset.");
    refresh();
  }

  function applyHealth() {
    const result = sessionRef.current.bus.setSystemHealth(healthTarget, healthState, "operator-marked in dev command center");
    setAnnouncement(result.outcome === "ACCEPTED" ? `${healthTarget} marked ${healthState}.` : `Health change rejected: ${(result.reasons || []).join(", ")}`);
    refresh();
  }

  const { worldStatus } = viewModel;
  const activeRun = viewModel.scenario.active;

  return (
    <main className="mol-cc" aria-labelledby="mol-cc-title">
      <header className="mol-cc__header">
        <p className="mol-cc__eyebrow">Developer · Phase 4F.5</p>
        <h1 id="mol-cc-title">Metaverse Orchestration Command Center</h1>
        <p className="mol-cc__boundary">{viewModel.boundary}</p>
        <p className="mol-cc__note">In-memory session. Providers are explicitly simulated; nothing here moves traffic, routes vessels, or writes Evidence, Truth, Identity, Curriculum or Career records.</p>
      </header>
      <p className="mol-cc__sr" role="status" aria-live="polite">{announcement}</p>

      <Section id="world-status" title="World status">
        <dl className="mol-cc__stats">
          <div><dt>Orchestration</dt><dd>{molStatusLabel(worldStatus.orchestrationState)}</dd></div>
          <div><dt>Healthy systems</dt><dd>{worldStatus.activeSystems}</dd></div>
          <div><dt>Degraded systems</dt><dd>{worldStatus.degradedSystems.join(", ") || "None"}</dd></div>
          <div><dt>Unavailable systems</dt><dd>{worldStatus.unavailableSystems.join(", ") || "None"}</dd></div>
          <div><dt>Active events</dt><dd>{worldStatus.activeEvents}</dd></div>
          <div><dt>Active incidents</dt><dd>{worldStatus.activeIncidents}</dd></div>
          <div><dt>Active missions</dt><dd>Not observed ({worldStatus.activeMissionsNote})</dd></div>
          <div><dt>Throughput</dt><dd>{worldStatus.eventThroughput.accepted} accepted · {worldStatus.eventThroughput.rejected} rejected · {worldStatus.eventThroughput.duplicates} duplicate</dd></div>
        </dl>
      </Section>

      <Section id="system-registry" title="System registry">
        <Table caption="Registered systems, authority, mode and health" rows={viewModel.systemRegistry.map((row) => ({
          ...row, __key: row.systemId, mode: row.simulated ? `${row.mode} (simulated)` : row.mode, capabilities: row.capabilities.join(", ") || "—",
        }))} columns={[["displayName", "System"], ["authorityDomain", "Authority"], ["mode", "Mode"], ["maturity", "Maturity"], ["healthLabel", "Health"], ["capabilities", "Capabilities"]]} />
        <details>
          <summary>Authority matrix</summary>
          <Table caption="What MOL may read, request and never control" rows={viewModel.authorityMatrix.map((row) => ({ ...row, __key: row.system }))}
            columns={[["system", "System"], ["owns", "Owns"], ["molMayRead", "MOL may read"], ["molMayRequest", "MOL may request"], ["molMayNotControl", "MOL may not control"]]} />
        </details>
      </Section>

      <Section id="event-stream" title="Live event stream">
        <Table caption="Most recent accepted events, newest first" empty="No events yet. Run or step an approved scenario."
          rows={viewModel.eventStream.map((row) => ({ ...row, __key: row.sequence, processing: molStatusLabel(row.processing), causationId: row.causationId || "—", simulated: row.simulated ? "Simulated" : "Live" }))}
          columns={[["occurredAt", "Time"], ["eventType", "Event"], ["sourceSystem", "Source"], ["severity", "Severity"], ["correlationId", "Correlation"], ["causationId", "Caused by"], ["status", "Status"], ["simulated", "Provider"], ["processing", "Processing"]]} />
      </Section>

      <Section id="dependency-graph" title="Dependency graph">
        <p>{viewModel.dependencyGraph.nodeCount} referenced nodes. Dependencies are listed as text; no graph-only view.</p>
        <Table caption="Declared dependencies (dependent depends on dependency)" rows={viewModel.dependencyGraph.edges.map((edge) => ({ ...edge, __key: `${edge.from}>${edge.to}` }))}
          columns={[["from", "Dependent"], ["type", "Relationship"], ["to", "Dependency"]]} />
        <h3>Impacted downstream</h3>
        {viewModel.dependencyGraph.impacts.length ? viewModel.dependencyGraph.impacts.map((impact) => (
          <Table key={impact.causationEventId} caption={`Impact of ${impact.origin}${impact.truncated ? " (truncated at bound)" : ""}`}
            rows={impact.impacted.map((item) => ({ ...item, __key: item.nodeId }))} columns={[["nodeId", "Node"], ["kind", "Kind"], ["depth", "Depth"], ["via", "Via"]]} />
        )) : <p className="mol-cc__empty">No dependency impact assessed yet.</p>}
      </Section>

      <Section id="world-state" title="World state">
        <p>Projection only. Each value is owned by its source system.</p>
        <Table caption="Current projections with authoritative source and freshness" empty="No projected state."
          rows={viewModel.worldState.map((row) => ({ ...row, __key: `${row.category}:${row.key}`, simulated: row.simulated ? "Simulated" : "Live" }))}
          columns={[["category", "Category"], ["key", "Subject"], ["state", "State"], ["sourceSystem", "Authoritative source"], ["updatedAt", "Last update"], ["freshnessLabel", "Freshness"], ["simulated", "Provider"]]} />
      </Section>

      <Section id="scenario-replay" title="Scenario and replay">
        <div className="mol-cc__controls">
          <label htmlFor="mol-cc-scenario">Approved scenario</label>
          <select id="mol-cc-scenario" value={scenarioId} onChange={(event) => { setScenarioId(event.target.value); setAutoplay(false); }}>
            {viewModel.scenario.approved.map((item) => <option key={item.scenarioId} value={item.scenarioId}>{item.title} ({item.steps} steps)</option>)}
          </select>
          <button type="button" onClick={runAll}>Run scenario</button>
          <button type="button" onClick={stepOnce}>Step</button>
          <button type="button" onClick={() => setAutoplay(true)} disabled={autoplay}>Resume autoplay</button>
          <button type="button" onClick={() => { setAutoplay(false); runRef.current?.pause(); refresh(); }} disabled={!autoplay}>Pause</button>
          <button type="button" onClick={replayChain}>Replay event chain</button>
          <button type="button" onClick={reset}>Reset session</button>
        </div>
        <p>Active run: {activeRun ? `${activeRun.scenarioId} · ${activeRun.state}` : "none"}</p>
        <Table caption="Scenario timeline" empty="No scenario steps yet." rows={(activeRun?.timeline || []).map((row) => ({ ...row, __key: row.eventId, outcome: molStatusLabel(row.outcome), reasons: row.reasons.join(", ") || "—" }))}
          columns={[["step", "Step"], ["eventType", "Event"], ["sourceSystem", "Source"], ["outcome", "Outcome"], ["reasons", "Reasons"]]} />
        <Table caption="Record-only action requests routed to owning authorities" empty="No action requests."
          rows={viewModel.scenario.actionRequests.map((row) => ({ ...row, __key: row.requestId, executes: row.executes ? "Yes" : "No (record only)" }))}
          columns={[["targetSystem", "Target system"], ["action", "Requested action"], ["subjectRef", "Subject"], ["causationEventId", "Caused by"], ["executes", "Executes"]]} />
        {viewModel.scenario.replay && (
          <>
            <p>Replay {viewModel.scenario.replay.matchesLive ? "✓ reconstructs the same world state" : "✕ diverged from the live projection"}; side-effecting subscribers did not run.</p>
            <Table caption="Replayed event chain" rows={viewModel.scenario.replay.timeline.map((row) => ({ ...row, __key: row.eventId, causationId: row.causationId || "—" }))}
              columns={[["sequence", "#"], ["eventId", "Event ID"], ["eventType", "Event"], ["correlationId", "Correlation"], ["causationId", "Caused by"], ["outcome", "Outcome"]]} />
          </>
        )}
      </Section>

      <Section id="diagnostics" title="Diagnostics">
        <div className="mol-cc__controls">
          <label htmlFor="mol-cc-health-system">System</label>
          <select id="mol-cc-health-system" value={healthTarget} onChange={(event) => setHealthTarget(event.target.value)}>
            {listMolSystems().map((system) => <option key={system.systemId} value={system.systemId}>{system.displayName}</option>)}
          </select>
          <label htmlFor="mol-cc-health-state">Health</label>
          <select id="mol-cc-health-state" value={healthState} onChange={(event) => setHealthState(event.target.value)}>
            {MOL_HEALTH_STATES.map((state) => <option key={state} value={state}>{molStatusLabel(state)}</option>)}
          </select>
          <button type="button" onClick={applyHealth}>Record health change</button>
        </div>
        <Table caption="Validation failures (dead-letter)" empty="No validation failures."
          rows={viewModel.diagnostics.validationFailures.map((row) => ({ ...row, __key: row.deadLetterId, reasons: row.reasons.join("; ") }))}
          columns={[["deadLetterId", "Record"], ["eventId", "Event ID"], ["eventType", "Event"], ["reasons", "Reasons"]]} />
        <Table caption="Processing failures" empty="No processing failures."
          rows={viewModel.diagnostics.processingFailures.map((row) => ({ ...row, __key: row.deadLetterId, reasons: row.reasons.join("; ") }))}
          columns={[["deadLetterId", "Record"], ["eventId", "Event ID"], ["subscriberId", "Subscriber"], ["attempts", "Attempts"], ["reasons", "Reasons"]]} />
        <Table caption="Stale projections" empty="No stale projections."
          rows={viewModel.diagnostics.staleProjections.map((row) => ({ ...row, __key: `${row.category}:${row.key}`, freshness: molStatusLabel(row.freshness) }))}
          columns={[["category", "Category"], ["key", "Subject"], ["sourceSystem", "Source"], ["freshness", "Freshness"]]} />
        <p>Unavailable systems: {viewModel.diagnostics.unavailableSystems.join(", ") || "None"}. Dropped dead-letter records: {viewModel.diagnostics.deadLettersDropped}.</p>
      </Section>
    </main>
  );
}
