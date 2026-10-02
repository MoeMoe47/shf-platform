import React, { useMemo, useRef, useState } from "react";
import MetaverseMiniMap from "@/components/metaverse/MetaverseMiniMap.jsx";
import { createRegionalSimulation, createReplaySession, listRegionalScenarios } from "@/system/metaverse/regional/index.js";
import {
  MOCC_OVERLAYS, MOCC_PERMISSIONS, buildMoccViewModel, createMoccAuditLog, createMoccPresentationState, executeMoccOperatorAction,
} from "@/system/metaverse/mocc/index.js";
import { createWorldAudioEngine } from "@/shared/experience/audio/index.js";
import { ACCESSIBILITY_SENSORY_KEYS, REGIONAL_WORLD_SENSORY_TRIGGERS, buildSensoryRegistry } from "@/shared/experience/sensory/index.js";
import "./mol-command-center.css";

// Phase 9 — /metaverse/dev/mocc. Core MOCC dev/test surface.
// The MOCC coordinates authorities; it does not replace them. This page drives an in-browser TEST-mode regional
// simulation with a local dev operator: it has no production authority and reaches no domain system. Authorized,
// audited production operations go through the /metaverse/operations API.
const DEV_OPERATOR = Object.freeze({ operatorId: "dev-operator", permissions: [MOCC_PERMISSIONS.VIEW, MOCC_PERMISSIONS.OPERATE] });
const STEP_MS = 5 * 60 * 1000;

function Section({ id, title, defaultOpen = false, children }) {
  return (
    <details className="mol-cc__section" open={defaultOpen}>
      <summary><h2 id={`${id}-title`} style={{ display: "inline" }}>{title}</h2></summary>
      {children}
    </details>
  );
}

function Table({ caption, columns, rows, empty = "None." }) {
  if (!rows.length) return <p className="mol-cc__empty">{empty}</p>;
  return (
    <div className="mol-cc__tableWrap" role="region" aria-label={caption} tabIndex={0}>
      <table className="mol-cc__table">
        <caption>{caption}</caption>
        <thead><tr>{columns.map(([key, label]) => <th key={key} scope="col">{label}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{columns.map(([key]) => <td key={key}>{row[key] === null || row[key] === undefined ? "—" : String(row[key])}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default function MoccCommandCenterPage() {
  const ref = useRef(null);
  if (!ref.current) {
    const registry = buildSensoryRegistry();
    ref.current = {
      simulation: createRegionalSimulation({ simulationId: "dev-mocc", mode: "TEST" }).simulation,
      auditLog: createMoccAuditLog(),
      presentation: createMoccPresentationState(),
      registry,
      presented: 0,
    };
  }
  const [version, setVersion] = useState(0);
  const [scenarioId, setScenarioId] = useState("REGIONAL_POWER_DISRUPTION");
  const [filters, setFilters] = useState({});
  const [replay, setReplay] = useState(null);
  const [access, setAccess] = useState({ noAudio: false, reducedSensory: false });
  const [announcement, setAnnouncement] = useState("");
  const session = ref.current;

  function act(controlId, params = {}) {
    const outcome = executeMoccOperatorAction({ simulation: session.simulation, operator: DEV_OPERATOR, controlId, params, auditLog: session.auditLog, presentation: session.presentation });
    setAnnouncement(`${controlId}: ${outcome.decision}${outcome.result?.reason ? ` (${outcome.result.reason})` : ""}`);
    setVersion((value) => value + 1);
  }

  const viewModel = useMemo(
    () => buildMoccViewModel({ simulation: session.simulation, auditLog: session.auditLog, presentation: session.presentation, operator: DEV_OPERATOR, replay, timelineFilters: filters }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, replay, filters],
  );

  // World Audio test: present every simulated event through the Sensory Director, honoring accessibility.
  const audio = useMemo(() => {
    const accessibility = Object.fromEntries(ACCESSIBILITY_SENSORY_KEYS.map((key) => [key, Boolean(access[key])]));
    const engine = createWorldAudioEngine({ sensoryRegistry: session.registry, policyId: "policy.regional-world", accessibility, triggers: REGIONAL_WORLD_SENSORY_TRIGGERS });
    engine.setDistrict("environment-audio.city-core");
    for (const event of session.simulation.getEvents()) engine.handleWorldEvent(event);
    return { mix: engine.getMix(), signage: engine.getSignage(), mood: engine.getCityMood(session.simulation.getState()) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, access]);

  const top = viewModel.topBar;
  return (
    <main className="mol-cc" aria-labelledby="mocc-title">
      <header className="mol-cc__header">
        <p className="mol-cc__eyebrow">Dev / test mode — in-browser simulated state, no production authority</p>
        <h1 id="mocc-title">{viewModel.name}</h1>
        <p className="mol-cc__boundary">{viewModel.boundary}</p>
        <p>
          Mode: <strong>{top.simulationMode}</strong> · Status: <strong>{top.simulationStatus}</strong> · World clock: <strong>{top.worldClock}</strong> ·
          Scenario: <strong>{top.scenario ?? "none"}</strong> · Active alerts: <strong>{top.activeAlerts}</strong> · Real world: <strong>no</strong>
        </p>
        <p aria-live="polite">{announcement}</p>
        <div role="group" aria-label="Simulation controls">
          <button type="button" onClick={() => act("START_SIMULATION")}>Start</button>{" "}
          <button type="button" onClick={() => act("PAUSE_SIMULATION")}>Pause</button>{" "}
          <button type="button" onClick={() => act("RESUME_SIMULATION")}>Resume</button>{" "}
          <button type="button" onClick={() => act("ADVANCE_SIMULATION", { advanceMs: STEP_MS })}>Step 5 min</button>{" "}
          <button type="button" onClick={() => act("RESET_SIMULATION", { confirmed: true, reason: "dev reset" })}>Reset</button>{" "}
          <label>Scenario{" "}
            <select value={scenarioId} onChange={(event) => setScenarioId(event.target.value)}>
              {listRegionalScenarios().map((item) => <option key={item.regionalScenarioId} value={item.regionalScenarioId}>{item.title}</option>)}
            </select>
          </label>{" "}
          <button type="button" onClick={() => act("START_SCENARIO", { regionalScenarioId: scenarioId })}>Start scenario</button>
        </div>
      </header>

      <Section id="digital-twin" title="Digital twin (existing Quick Map)" defaultOpen>
        <MetaverseMiniMap spatialMarkers={[]} reducedMotion />
        <div role="group" aria-label="Overlays">
          {MOCC_OVERLAYS.filter((item) => item.status === "IMPLEMENTED").map((item) => (
            <label key={item.overlayId} style={{ marginRight: 12 }}>
              <input type="checkbox" checked={session.presentation.isVisible(item.overlayId)} onChange={() => act("TOGGLE_OVERLAY", { overlayId: item.overlayId })} /> {item.title}
            </label>
          ))}
        </div>
        {viewModel.digitalTwin.overlays.filter((overlay) => overlay.visible).map((overlay) => (
          <Table key={overlay.overlayId} caption={`${overlay.title} — features`} columns={[["key", "Feature"], ["state", "State"], ["sourceSystem", "Source"], ["mapStatus", "Map"]]}
            rows={overlay.features} empty="No active features." />
        ))}
        <p className="mol-cc__empty">Unmapped features are listed, never placed: only calibrated Quick Map locations can position a marker. Planned overlays: {MOCC_OVERLAYS.filter((item) => item.status === "PLANNED").length}.</p>
      </Section>

      <Section id="system-health" title="System health" defaultOpen>
        <Table caption="Registered systems" columns={[["systemId", "System"], ["authority", "Authority"], ["mode", "Mode"], ["maturity", "Maturity"], ["health", "Health"], ["currentScenarioImpact", "Scenario impact"]]}
          rows={viewModel.systemHealth} />
      </Section>

      <Section id="timeline" title="Event timeline" defaultOpen>
        <label>Severity{" "}
          <select value={filters.severity ?? ""} onChange={(event) => setFilters({ ...filters, severity: event.target.value || undefined })}>
            {["", "INFO", "MINOR", "MODERATE", "MAJOR", "CRITICAL"].map((value) => <option key={value} value={value}>{value || "Any"}</option>)}
          </select>
        </label>
        <Table caption="Timeline (CURRENT / SIMULATION / REPLAY / TEST)" columns={[["sequence", "#"], ["label", "Label"], ["eventType", "Event"], ["category", "Category"], ["sourceSystem", "Source"], ["severity", "Severity"], ["correlationId", "Correlation"]]}
          rows={viewModel.timeline.entries} empty="No events yet." />
      </Section>

      <Section id="dependencies" title="Dependencies (read-only)">
        <Table caption="DECLARED and SIMULATED edges" columns={[["tag", "Tag"], ["from", "From"], ["to", "To"]]} rows={viewModel.dependencies.edges.filter((edge) => edge.tag === "SIMULATED" || edge.from.startsWith("system:"))} />
      </Section>

      <Section id="replay" title="Replay">
        <button type="button" disabled={!session.simulation.getEvents().length} onClick={() => {
          const created = createReplaySession(session.simulation.getEvents());
          if (created.ok) { created.session.resume(); setReplay(created.session); }
        }}>Replay all events</button>
        {replay ? <p>Label: <strong>REPLAY</strong> · State: {replay.getState()} · Matches current projection: {String(replay.compareWith(session.simulation.getEvents()).matches)}</p> : null}
      </Section>

      <Section id="world-audio" title="World audio test">
        <label><input type="checkbox" checked={access.noAudio} onChange={(event) => setAccess({ ...access, noAudio: event.target.checked })} /> No audio</label>{" "}
        <label><input type="checkbox" checked={access.reducedSensory} onChange={(event) => setAccess({ ...access, reducedSensory: event.target.checked })} /> Reduced sensory</label>
        <p>City mood: <strong>{audio.mood.mood}</strong> · Music: <strong>{audio.mix.musicState}</strong> · Visual alerts: {audio.mix.visualAlerts.length}</p>
        <Table caption="Mix" columns={[["soundId", "Sound"], ["priorityClass", "Priority"], ["state", "State"], ["gain", "Gain"], ["reason", "Reason"]]} rows={audio.mix.sources} />
        <Table caption="Signage" columns={[["message", "Message"], ["sourceEventId", "Source event"]]} rows={audio.signage} />
      </Section>

      <Section id="audit" title="Operator audit">
        <Table caption="Audit records" columns={[["sequence", "#"], ["operatorId", "Operator"], ["controlId", "Control"], ["decision", "Decision"], ["simulationTime", "Simulation time"]]} rows={viewModel.audit} />
      </Section>
    </main>
  );
}
