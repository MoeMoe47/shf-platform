import React, { useEffect, useMemo, useState } from "react";
import PermissionGuard from "@/auth/PermissionGuard";
import { AuthProvider } from "@/auth/auth-context";
import MetaverseMiniMap from "@/components/metaverse/MetaverseMiniMap.jsx";
import { METAVERSE_DISTRICTS, METAVERSE_FACILITIES, publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";
import { METAVERSE_SCENE_IMAGE_ASPECT_RATIO } from "@/system/metaverse/metaverseCameraProjection.js";
import { MINIMAP_ASSET, getDistrictQuickMapLocation } from "@/system/metaverse/metaverseMiniMapRegistry.js";
import { getCityOrchestration } from "@/system/metaverse/metaverseOrchestrationClient.js";
import { getMoccIntegrationStatus, MOCC_INTEGRATION_REGISTRY } from "@/system/metaverse/operations/moccIntegrationStatusRegistry.js";
import {
  filterMoccTimelineEvents,
  MOCC_TIMELINE_CATEGORIES,
  MOCC_TIMELINE_WINDOW_MS,
  moccTimelineCategory,
  projectMoccEvents,
  projectMoccTimelineEvents,
} from "@/system/metaverse/operations/moccEventProjection.js";
import { projectMoccOperationalOverlayEntities } from "@/system/metaverse/operations/moccOperationalOverlayProjection.js";
import { buildMoccDependencyGraph, filterMoccDependencyGraph, getMoccDependencyNodeDetails } from "@/system/metaverse/operations/moccDependencyGraph.js";
import { filterMoccOperations, projectMoccIncidents, projectMoccOperations } from "@/system/metaverse/operations/moccOperationsProjection.js";
import { filterMoccSchedules, MOCC_EXECUTION_READINESS, MOCC_SCHEDULE_STATUSES, projectMoccSchedules } from "@/system/metaverse/operations/moccSchedulingModel.js";
import {
  createMoccScenarioDraft,
  filterMoccScenarios,
  getMoccScenarioSpatialReferences,
  MOCC_SCENARIO_DOMAIN_OPTIONS,
  MOCC_SCENARIO_MODES,
  MOCC_SCENARIO_STATUSES,
  projectMoccScenario,
} from "@/system/metaverse/operations/moccScenarioModel.js";
import { analyzeMoccScenario, createMoccWhatIfNotRun } from "@/system/metaverse/operations/moccWhatIfModel.js";
import {
  advanceMoccReplayCursor,
  createMoccReplayState,
  formatMoccReplayDateTime,
  moccReplayEventKey,
  MOCC_REPLAY_SPEEDS,
  navigateMoccReplayEvent,
  parseMoccReplayDateTime,
  projectMoccHistoricalEvents,
  projectMoccReplayCoverage,
  projectMoccReplayEvents,
  projectMoccStaticContext,
  selectMoccReplayEvent,
  setMoccReplayWindow,
} from "@/system/metaverse/operations/moccReplayModel.js";
import {
  createDefaultMoccOverlayVisibility,
  MOCC_OPERATIONAL_OVERLAYS,
  setMoccOverlayVisibility,
} from "@/system/metaverse/operations/moccOperationalOverlayRegistry.js";
import "./metaverse-operations-command-center.css";

const CITY_CAMERA_ASSET = "public/assets/metaverse/city/silicon-heartland-city-night.png";
const METAVERSE_LOGO_ASSET = "public/assets/metaverse/branding/silicon-heartland-metaverse-logo-white.png";

const OPERATING_MODES = [
  { id: "MANUAL", label: "Admin", icon: "gear" },
  { id: "AI_ASSISTED", label: "AI Assisted", icon: "assist" },
  { id: "AI_SUPERVISED", label: "AI Supervised", icon: "network" },
  { id: "AI_SIMULATION", label: "AI Simulation", icon: "cube" },
];

const SYSTEM_LAYERS = [
  { label: "Living City", description: "City services & districts", status: getMoccIntegrationStatus("LIVING_CITY").status, icon: "building" },
  { label: "Traffic", description: "Roads, transit, mobility", status: getMoccIntegrationStatus("TRAFFIC").status, icon: "car" },
  { label: "Weather", description: "Forecasting & impacts", status: getMoccIntegrationStatus("WEATHER_OBSERVATIONS").status, icon: "cloud" },
  { label: "Missions", description: "Active missions", status: getMoccIntegrationStatus("MISSIONS").status, icon: "target" },
  { label: "Simulations", description: "Digital twin scenarios", status: getMoccIntegrationStatus("SIMULATIONS").status, icon: "cube" },
  { label: "Civic", description: "Government & services", status: getMoccIntegrationStatus("CIVIC").status, icon: "bank" },
  { label: "Agents", description: "AI & human operations", status: getMoccIntegrationStatus("AGENT_ACTIONS").status, icon: "agents" },
  { label: "Fire / EMS / 911", description: "Response coordination", status: getMoccIntegrationStatus("FIRE_EMS_INCIDENTS").status, icon: "fire" },
  { label: "Utilities", description: "Power, water, waste", status: getMoccIntegrationStatus("UTILITIES").status, icon: "drop" },
  { label: "Marine / Aviation", description: "Ports, waterways, airspace", status: getMoccIntegrationStatus("MARINE_AVIATION").status, icon: "plane" },
];

const DISTRICT_MARKER_THEMES = ["blue", "purple", "cyan", "teal", "blue", "green", "purple", "cyan", "amber"];
const PRIMARY_DISTRICT_MARKER_IDS = new Set([
  "career-education-district",
  "civic-district",
  "community-district",
  "data-center-district",
  "technology-innovation-district",
]);
const DISTRICT_DISPLAY_LABELS = {
  "career-education-district": "University District",
  "civic-district": "Civic & Commerce",
  "community-district": "North District",
  "data-center-district": "Downtown",
  "learning-arcade-district": "Learning Arcade",
  "public-realm": "Public Realm",
  "student-life-district": "Student Life",
  "technology-innovation-district": "East District",
  "treasury-commerce-district": "Civic & Commerce",
};

const DEPENDENCY_FILTERS = [
  ["EVENT", "Events"], ["MISSION", "Missions"], ["SYSTEM", "Systems"],
  ["FACILITY", "Infrastructure"], ["CIVIC", "Civic"], ["SIMULATION", "Simulations"], ["PENDING_INTEGRATION", "Pending integrations"],
];

let localScenarioSequence = 0;
let localScenarioEventSequence = 0;
let localWhatIfSequence = 0;

function DependenciesWorkspace({ graph }) {
  const [filters, setFilters] = useState(() => Object.fromEntries(DEPENDENCY_FILTERS.map(([key]) => [key, true])));
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const filteredGraph = useMemo(() => filterMoccDependencyGraph(graph, filters), [graph, filters]);
  const visibleGraph = useMemo(() => {
    const nodes = filteredGraph.nodes.slice(0, 36);
    const ids = new Set(nodes.map((node) => node.node_id));
    return { nodes, edges: filteredGraph.edges.filter((edge) => ids.has(edge.from_node) && ids.has(edge.to_node)) };
  }, [filteredGraph]);
  const details = getMoccDependencyNodeDetails(visibleGraph, selectedNodeId) || visibleGraph.nodes[0] || null;
  const columns = [
    visibleGraph.nodes.filter((node) => ["EVENT", "MISSION", "SIMULATION"].includes(node.node_type)),
    visibleGraph.nodes.filter((node) => ["INTEGRATION", "SYSTEM", "CIVIC"].includes(node.node_type)),
    visibleGraph.nodes.filter((node) => ["FACILITY", "DISTRICT", "DESTINATION", "INFRASTRUCTURE"].includes(node.node_type)),
  ];
  const positions = new Map();
  columns.forEach((column, columnIndex) => column.forEach((node, rowIndex) => positions.set(node.node_id, { x: 16 + columnIndex * 220, y: 18 + rowIndex * 76 })));
  const graphHeight = Math.max(230, ...columns.map((column) => 36 + column.length * 76));

  return (
    <section className="mocc__dependency-workspace" aria-label="Read-only dependencies">
      <aside className="mocc__dependency-filters">
        <h2>DEPENDENCIES</h2>
        <p>Source-backed relationships</p>
        {DEPENDENCY_FILTERS.map(([key, label]) => (
          <label key={key}><input type="checkbox" checked={filters[key]} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span><small>{key === "PENDING_INTEGRATION" ? graph.nodes.filter((node) => node.node_type === "INTEGRATION" && node.status === "PENDING").length : graph.nodes.filter((node) => node.node_type === key).length}</small></label>
        ))}
        <div className="mocc__dependency-readonly">READ ONLY</div>
      </aside>
      <section className="mocc__dependency-graph-panel">
        <header><strong>DEPENDENCY GRAPH</strong><span>{visibleGraph.nodes.length}{filteredGraph.nodes.length > visibleGraph.nodes.length ? ` of ${filteredGraph.nodes.length}` : ""} nodes · {visibleGraph.edges.length} relationships</span></header>
        {visibleGraph.nodes.length ? (
          <div className="mocc__dependency-canvas" role="group" aria-label="Dependency graph nodes and relationships">
            <svg className="mocc__dependency-edges" width="680" height={graphHeight} aria-hidden="true">
              <defs><marker id="mocc-dependency-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 8 4 0 8z" /></marker></defs>
              {visibleGraph.edges.map((edge) => {
                const from = positions.get(edge.from_node);
                const to = positions.get(edge.to_node);
                if (!from || !to) return null;
                return <g key={edge.edge_id}><line x1={from.x + 174} y1={from.y + 26} x2={to.x} y2={to.y + 26} markerEnd="url(#mocc-dependency-arrow)" /><title>{edge.relationship_type}</title></g>;
              })}
            </svg>
            {visibleGraph.nodes.map((node) => {
              const point = positions.get(node.node_id) || { x: 16, y: 18 };
              return <button type="button" key={node.node_id} className={`mocc__dependency-node mocc__dependency-node--${node.node_type.toLowerCase()}${node.status ? ` mocc__dependency-node--${statusClass(node.status)}` : ""}`} style={{ left: point.x, top: point.y }} aria-pressed={details?.node_id === node.node_id} onClick={() => setSelectedNodeId(node.node_id)}><strong>{node.label}</strong><small>{node.node_type} · {node.status || node.domain || "SOURCE RECORD"}</small></button>;
            })}
          </div>
        ) : <p className="mocc__dependency-empty">No source-backed nodes match these filters.</p>}
      </section>
      <aside className="mocc__dependency-details" aria-label="Selected dependency details">
        <h2>{details?.label || "Select a node"}</h2>
        {details ? <>
          <dl>
            <div><dt>Type</dt><dd>{details.node_type}</dd></div>
            {details.domain ? <div><dt>Domain</dt><dd>{details.domain}</dd></div> : null}
            {details.status ? <div><dt>Status</dt><dd>{details.status}</dd></div> : null}
            <div><dt>Source authority</dt><dd>{details.source_authority || "Unavailable"}</dd></div>
            <div><dt>Source reference</dt><dd>{details.source_reference || "Unavailable"}</dd></div>
            {details.metadata?.owning_system ? <div><dt>Owning system</dt><dd>{details.metadata.owning_system}</dd></div> : null}
            {details.metadata?.expected_interface ? <div><dt>Expected interface</dt><dd>{details.metadata.expected_interface}</dd></div> : null}
            {details.metadata?.mocc_ready_for ? <div><dt>MOCC ready for</dt><dd>{details.metadata.mocc_ready_for}</dd></div> : null}
            {details.spatial_reference?.district_id ? <div><dt>District</dt><dd>{details.spatial_reference.district_id}</dd></div> : null}
            {details.spatial_reference?.facility_id ? <div><dt>Facility</dt><dd>{details.spatial_reference.facility_id}</dd></div> : null}
          </dl>
          {details.metadata?.missing_dependency ? <p className="mocc__dependency-pending">Pending dependency: {details.metadata.missing_dependency}</p> : null}
          {details.metadata?.impact ? <p className="mocc__dependency-pending">Impact: {details.metadata.impact}</p> : null}
          {details.metadata?.completion_step ? <p className="mocc__dependency-pending">Completion: {details.metadata.completion_step}</p> : null}
          <h3>Upstream</h3><ul>{details.upstream?.length ? details.upstream.map((edge) => <li key={edge.edge_id}>{edge.relationship_type} · {visibleGraph.nodes.find((node) => node.node_id === edge.from_node)?.label}</li>) : <li>None recorded</li>}</ul>
          <h3>Downstream</h3><ul>{details.downstream?.length ? details.downstream.map((edge) => <li key={edge.edge_id}>{edge.relationship_type} · {visibleGraph.nodes.find((node) => node.node_id === edge.to_node)?.label}</li>) : <li>None recorded</li>}</ul>
        </> : <p>Select a source-backed node to inspect its recorded relationships.</p>}
      </aside>
    </section>
  );
}

function OperationsWorkspace({ records, graph, incidentsOnly = false }) {
  const [category, setCategory] = useState("all");
  const [state, setState] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const filteredRecords = useMemo(() => filterMoccOperations(records, { category, state, severity, activeOnly }), [records, category, state, severity, activeOnly]);
  const selected = filteredRecords.find((record) => record.event_id === selectedEventId) || filteredRecords[0] || null;
  const graphDetails = selected ? getMoccDependencyNodeDetails(graph, `event:${selected.event_id}`) : null;
  const pendingFireEms = incidentsOnly ? getMoccIntegrationStatus("FIRE_EMS_INCIDENTS") : null;
  const categoryOptions = [...new Set(records.map((record) => record.category).filter(Boolean))];
  const stateOptions = [...new Set(records.map((record) => record.state).filter(Boolean))];
  const severityOptions = [...new Set(records.map((record) => record.severity).filter(Boolean))];
  const categoryLabel = (value) => MOCC_TIMELINE_CATEGORIES.find((item) => item.id === value)?.label || value;

  return (
    <section className="mocc__operations-workspace" aria-label={incidentsOnly ? "Read-only incident workspace" : "Read-only operations workspace"}>
      <section className="mocc__operations-queue">
        <header className="mocc__operations-heading">
          <div><h2>{incidentsOnly ? "INCIDENT QUEUE" : "OPERATIONS QUEUE"}</h2><span>{filteredRecords.length} source-backed record{filteredRecords.length === 1 ? "" : "s"}</span></div>
          <div className="mocc__operations-filters">
            <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All</option>{categoryOptions.map((value) => <option key={value} value={value}>{categoryLabel(value)}</option>)}</select></label>
            <label>State<select value={state} onChange={(event) => setState(event.target.value)}><option value="all">All</option>{stateOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Severity<select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="all">All</option>{severityOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="mocc__operations-active-filter"><input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} />Active/current</label>
          </div>
        </header>
        <div className="mocc__operations-list">
          {filteredRecords.length ? filteredRecords.map((record) => (
            <button type="button" key={record.event_id} aria-pressed={selected?.event_id === record.event_id} onClick={() => setSelectedEventId(record.event_id)}>
              <span className="mocc__operations-record-main"><strong>{record.title}</strong><small>{record.event_type || "Event type unavailable"} · {categoryLabel(record.category)}</small></span>
              <span className="mocc__operations-record-meta"><strong>{record.severity || "—"}</strong><small>{record.state || "State unavailable"}</small></span>
              <em>{record.timestamp ? formatEventTimestamp(record.timestamp) : "Time unavailable"}</em>
            </button>
          )) : <p className="mocc__operations-empty">{incidentsOnly ? "No source-backed incident events are currently available." : "No source-backed operational events are currently available."}</p>}
        </div>
      </section>
      <aside className="mocc__operation-details" aria-label={incidentsOnly ? "Incident details" : "Operation details"}>
        <header><h2>{selected?.title || (incidentsOnly ? "INCIDENT DETAILS" : "OPERATION DETAILS")}</h2><span>READ ONLY</span></header>
        {selected ? <>
          <dl>
            <div><dt>Event</dt><dd>{selected.event_type || "Unavailable"}</dd></div>
            <div><dt>Timestamp</dt><dd>{formatEventTimestamp(selected.timestamp)}</dd></div>
            <div><dt>State / severity</dt><dd>{[selected.state, selected.severity].filter(Boolean).join(" · ") || "Unavailable"}</dd></div>
            <div><dt>Source authority</dt><dd>{selected.source_authority || "Unavailable"}</dd></div>
            <div><dt>Source reference</dt><dd>{selected.source_reference || "Unavailable"}</dd></div>
            {selected.location?.district_id ? <div><dt>District</dt><dd>{selected.location.district_id}</dd></div> : null}
            {selected.location?.facility_id ? <div><dt>Facility</dt><dd>{selected.location.facility_id}</dd></div> : null}
            {selected.mission_id ? <div><dt>Mission</dt><dd>{selected.mission_id}</dd></div> : null}
            {selected.scenario_id ? <div><dt>Scenario</dt><dd>{selected.scenario_id}</dd></div> : null}
            {selected.integration_status ? <div><dt>Integration</dt><dd>{selected.integration_status}</dd></div> : null}
            {selected.timestamp && Number.isFinite(Date.parse(selected.timestamp)) ? <div><dt>Timeline</dt><dd>Same normalized event · {selected.event_id}</dd></div> : <div><dt>Timeline</dt><dd>No source timestamp; not positioned</dd></div>}
          </dl>
          {selected.affected_entities.length ? <section><h3>Affected entities</h3><p>{selected.affected_entities.join(" · ")}</p></section> : null}
          {selected.dependencies.length ? <section><h3>Recorded dependencies</h3><p>{selected.dependencies.join(" · ")}</p></section> : null}
          {selected.evidence_refs.length ? <section><h3>Evidence references</h3><p>{selected.evidence_refs.join(" · ")}</p></section> : null}
          {selected.audit_refs.length ? <section><h3>Audit references</h3><p>{selected.audit_refs.join(" · ")}</p></section> : null}
          <section className="mocc__operation-relationships"><h3>Dependency graph</h3>
            {graphDetails && (graphDetails.upstream.length || graphDetails.downstream.length) ? <ul>
              {graphDetails.upstream.map((edge) => <li key={edge.edge_id}>Upstream · {edge.relationship_type} · {graph.nodes.find((node) => node.node_id === edge.from_node)?.label || edge.from_node}</li>)}
              {graphDetails.downstream.map((edge) => <li key={edge.edge_id}>Downstream · {edge.relationship_type} · {graph.nodes.find((node) => node.node_id === edge.to_node)?.label || edge.to_node}</li>)}
            </ul> : <p>No recorded graph relationships.</p>}
          </section>
        </> : <p className="mocc__operations-empty-detail">Select a source-backed record to inspect its details and provenance.</p>}
        {pendingFireEms ? <section className="mocc__incident-integration"><h3>Fire / EMS / 911</h3><strong>{pendingFireEms.status}</strong><p>{pendingFireEms.missing_dependency || pendingFireEms.expected_interface || "Integration readiness is recorded in the MOCC registry."}</p><small>Awaiting authoritative incident/dispatch read interface.</small></section> : null}
      </aside>
    </section>
  );
}

function ScheduleWorkspace({ schedules, dependencyGraph }) {
  const [filters, setFilters] = useState({ domain: "all", status: "all", readiness: "all", date: "" });
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const visibleSchedules = useMemo(() => filterMoccSchedules(schedules, filters), [schedules, filters]);
  const selected = visibleSchedules.find((schedule) => schedule.schedule_id === selectedScheduleId) || visibleSchedules[0] || null;
  const domains = [...new Set([...MOCC_INTEGRATION_REGISTRY.map((integration) => integration.domain), ...schedules.map((schedule) => schedule.domain)].filter(Boolean))];
  const requiredNodes = (selected?.required_dependencies || []).map((reference) => dependencyGraph.nodes.find((node) => node.node_id === reference) || null);

  return (
    <section className="mocc__schedule-workspace" aria-label="Governed read-only schedule workspace">
      <section className="mocc__schedule-queue">
        <header className="mocc__schedule-header"><div><h2>SCHEDULE QUEUE</h2><span>{visibleSchedules.length} planning record{visibleSchedules.length === 1 ? "" : "s"}</span></div><strong>PLANNING ONLY</strong></header>
        <div className="mocc__schedule-filters">
          <label>Domain<select value={filters.domain} onChange={(event) => setFilters((current) => ({ ...current, domain: event.target.value }))}><option value="all">All domains</option>{domains.map((domain) => <option key={domain} value={domain}>{domain}</option>)}</select></label>
          <label>Plan status<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="all">All statuses</option>{MOCC_SCHEDULE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          <label>Execution readiness<select value={filters.readiness} onChange={(event) => setFilters((current) => ({ ...current, readiness: event.target.value }))}><option value="all">All readiness</option>{MOCC_EXECUTION_READINESS.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          <label>Date<input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} /></label>
        </div>
        <div className="mocc__schedule-list">
          {visibleSchedules.length ? visibleSchedules.map((schedule) => (
            <button type="button" key={schedule.schedule_id} aria-pressed={selected?.schedule_id === schedule.schedule_id} onClick={() => setSelectedScheduleId(schedule.schedule_id)}>
              <span><strong>{schedule.title || "Untitled plan"}</strong><small>{schedule.domain || "Domain unavailable"} · {schedule.schedule_type || "Schedule type unavailable"}</small></span>
              <span><b>{schedule.schedule_status}</b><small>{schedule.planned_start ? formatEventTimestamp(schedule.planned_start) : "Start unavailable"}</small></span>
            </button>
          )) : <p className="mocc__schedule-empty">No source-backed schedule records are available. MOCC has not created or persisted any plans.</p>}
        </div>
      </section>
      <section className="mocc__schedule-details" aria-label="Selected schedule timing and details">
        <header><h2>{selected?.title || "PLANNED TIMING"}</h2><span>NOT AN OPERATIONAL EVENT</span></header>
        {selected ? <dl>
          <div><dt>Type / domain</dt><dd>{[selected.schedule_type, selected.domain].filter(Boolean).join(" · ") || "Unavailable"}</dd></div>
          <div><dt>Planned start</dt><dd>{selected.planned_start ? formatEventTimestamp(selected.planned_start) : "Unavailable"}</dd></div>
          <div><dt>Planned end</dt><dd>{selected.planned_end ? formatEventTimestamp(selected.planned_end) : "Unavailable"}</dd></div>
          <div><dt>Timezone</dt><dd>{selected.timezone || "Unavailable"}</dd></div>
          <div><dt>Target</dt><dd>{selected.target_reference || "Unavailable"}</dd></div>
          {selected.mission_id ? <div><dt>Mission reference</dt><dd>{selected.mission_id}</dd></div> : null}
          {selected.scenario_id ? <div><dt>Scenario reference</dt><dd>{selected.scenario_id}</dd></div> : null}
          <div><dt>Source</dt><dd>{[selected.source_authority, selected.source_reference].filter(Boolean).join(" · ") || "Unavailable"}</dd></div>
          <div><dt>Timeline</dt><dd>Planned records are not added to the operational timeline.</dd></div>
        </dl> : <p className="mocc__schedule-empty-detail">No schedule is selected. No schedule source or persistence interface is connected, so no sample plans are shown.</p>}
      </section>
      <aside className="mocc__schedule-readiness" aria-label="Schedule readiness and integrations">
        {selected ? <>
          <header><h2>READINESS</h2><span>{selected.execution_readiness}</span></header>
          <dl>
            <div><dt>Planning status</dt><dd>{selected.schedule_status}</dd></div>
            <div><dt>Integration</dt><dd>{selected.integration_status || "NOT REGISTERED"}</dd></div>
            <div><dt>Owning system</dt><dd>{selected.owning_system || "Unavailable"}</dd></div>
            <div><dt>Required authority</dt><dd>{selected.required_authorities.join(" · ") || "Unspecified"}</dd></div>
            <div><dt>Approval</dt><dd>{selected.approval_status}{selected.approved_by ? ` · ${selected.approved_by}` : ""}</dd></div>
          </dl>
          <section><h3>Required dependencies</h3>{requiredNodes.length ? <ul>{requiredNodes.map((node, index) => <li key={`${selected.required_dependencies[index]}-${index}`}>{node ? `${node.label} · ${node.status || node.node_type}` : `${selected.required_dependencies[index]} · unresolved`}</li>)}</ul> : <p>None recorded.</p>}</section>
          <section><h3>Conflicts</h3>{selected.conflicts.length ? <ul>{selected.conflicts.map((conflict, index) => <li key={`${conflict.code}-${index}`}>{conflict.code}{conflict.related_schedule_id ? ` · ${conflict.related_schedule_id}` : ""}</li>)}</ul> : <p>No conflicts detected from available records.</p>}</section>
        </> : <>
          <header><h2>INTEGRATION READINESS</h2><span>REGISTRY</span></header>
          <p className="mocc__schedule-readiness-note">These are integration states, not schedule availability or execution approvals.</p>
          <div className="mocc__schedule-integration-list">{MOCC_INTEGRATION_REGISTRY.map((integration) => <article key={integration.domain}><strong>{integration.domain.replaceAll("_", " ")}</strong><small className={`mocc__status mocc__status--${statusClass(integration.status)}`}>{statusLabel(integration.status)}</small><p>{integration.expected_interface || integration.owning_system || "No integration contract registered."}</p></article>)}</div>
        </>}
      </aside>
    </section>
  );
}

function ScenarioWorkspace({ dependencyGraph, schedules, drafts, setDrafts }) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [filters, setFilters] = useState({ domain: "all", status: "all" });
  const [domainToAdd, setDomainToAdd] = useState("");
  const [domainRequired, setDomainRequired] = useState(true);
  const [spatialToAdd, setSpatialToAdd] = useState("");
  const [dependencyToAdd, setDependencyToAdd] = useState("");
  const [missionToAdd, setMissionToAdd] = useState("");
  const [scenarioEvent, setScenarioEvent] = useState({ event_type: "", domain: "", relative_time_minutes: "0", target_reference: "" });
  const [condition, setCondition] = useState({ domain: "", key: "", value: "" });
  const projections = useMemo(() => drafts.map((draft) => projectMoccScenario(draft, { dependencyGraph, schedules })), [drafts, dependencyGraph, schedules]);
  const visibleScenarios = useMemo(() => filterMoccScenarios(projections, filters), [projections, filters]);
  const selected = drafts.find((draft) => draft.scenario_id === selectedScenarioId) || null;
  const assessment = selected ? projections.find((scenario) => scenario.scenario_id === selected.scenario_id) : null;
  const domainOptions = MOCC_SCENARIO_DOMAIN_OPTIONS.filter(({ domain }) => !selected?.participating_domains?.some((participant) => participant.domain === domain));
  const selectedDomains = selected?.participating_domains || [];
  const graphNodes = dependencyGraph.nodes;
  const missionNodes = graphNodes.filter((node) => node.node_type === "MISSION");
  const spatialOptions = getMoccScenarioSpatialReferences();
  const selectedSpatialRefs = selected?.spatial_references || [];
  const missionId = (node) => node.node_id.startsWith("mission:") ? node.node_id.slice("mission:".length) : node.source_reference;

  function updateSelected(patch) {
    if (!selected) return;
    setDrafts((current) => current.map((draft) => draft.scenario_id === selected.scenario_id ? { ...draft, ...patch } : draft));
  }

  function addDraft() {
    const draft = createMoccScenarioDraft(`local-draft-${++localScenarioSequence}`);
    setDrafts((current) => [...current, draft]);
    setSelectedScenarioId(draft.scenario_id);
  }

  function addParticipant() {
    if (!selected || !domainToAdd) return;
    updateSelected({ participating_domains: [...selectedDomains, { domain: domainToAdd, required: domainRequired }] });
    setDomainToAdd("");
  }

  function addScenarioEvent() {
    if (!selected || !scenarioEvent.event_type.trim() || !scenarioEvent.domain) return;
    updateSelected({
      planned_events: [...(selected.planned_events || []), {
        scenario_event_id: `local-event-${++localScenarioEventSequence}`,
        event_type: scenarioEvent.event_type.trim(),
        domain: scenarioEvent.domain,
        relative_time_minutes: Number(scenarioEvent.relative_time_minutes),
        target_reference: scenarioEvent.target_reference || null,
        parameters: {},
        dependencies: [],
      }],
    });
    setScenarioEvent((current) => ({ ...current, event_type: "", target_reference: "" }));
  }

  function addInitialCondition() {
    if (!selected || !condition.domain || !condition.key.trim() || !condition.value.trim()) return;
    const initialConditions = { ...(selected.initial_conditions || {}) };
    initialConditions[condition.domain] = { ...(initialConditions[condition.domain] || {}), [condition.key.trim()]: condition.value.trim() };
    updateSelected({ initial_conditions: initialConditions });
    setCondition((current) => ({ ...current, key: "", value: "" }));
  }

  return (
    <section className="mocc__scenario-workspace" aria-label="Simulation-only scenario composer">
      <aside className="mocc__scenario-catalog">
        <header><div><h2>SCENARIO CATALOG</h2><span>{visibleScenarios.length} local draft{visibleScenarios.length === 1 ? "" : "s"}</span></div><button type="button" onClick={addDraft}>+ New draft</button></header>
        <div className="mocc__scenario-filters">
          <label>Domain<select value={filters.domain} onChange={(event) => setFilters((current) => ({ ...current, domain: event.target.value }))}><option value="all">All domains</option>{MOCC_SCENARIO_DOMAIN_OPTIONS.map(({ domain, label }) => <option key={domain} value={domain}>{label}</option>)}</select></label>
          <label>Status<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="all">All statuses</option>{MOCC_SCENARIO_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        </div>
        <div className="mocc__scenario-list">
          {visibleScenarios.map((scenario) => <button type="button" key={scenario.scenario_id} aria-pressed={scenario.scenario_id === selectedScenarioId} onClick={() => setSelectedScenarioId(scenario.scenario_id)}><strong>{scenario.title || "Untitled local draft"}</strong><span>{scenario.status} · {scenario.mode || "Mode needed"}</span></button>)}
          {!visibleScenarios.length ? <p>No source-backed or persisted scenarios are available. Drafts created here remain in this browser session only.</p> : null}
        </div>
        <p className="mocc__scenario-local-note">LOCAL PLANNING ONLY · NOT PERSISTED · NOT EXECUTABLE</p>
      </aside>

      <section className="mocc__scenario-editor" aria-label="Scenario definition editor">
        <header><h2>{selected?.title || "SCENARIO COMPOSER"}</h2><span>SIMULATION CONFIGURATION ONLY</span></header>
        {selected ? <div className="mocc__scenario-form">
          <label>Title<input value={selected.title || ""} onChange={(event) => updateSelected({ title: event.target.value || null })} placeholder="Scenario title" /></label>
          <label>Scenario type<input value={selected.scenario_type || ""} onChange={(event) => updateSelected({ scenario_type: event.target.value || null })} placeholder="Operator-defined type" /></label>
          <label className="mocc__scenario-wide">Description<textarea value={selected.description || ""} onChange={(event) => updateSelected({ description: event.target.value || null })} rows="2" /></label>
          <label>Mode<select value={selected.mode || ""} onChange={(event) => updateSelected({ mode: event.target.value })}>{MOCC_SCENARIO_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select></label>
          <label>Duration (minutes)<input type="number" min="1" value={selected.duration_minutes ?? ""} onChange={(event) => updateSelected({ duration_minutes: event.target.value === "" ? null : Number(event.target.value) })} /></label>
          <label className="mocc__scenario-approval"><input type="checkbox" checked={selected.approval_required === true} onChange={(event) => updateSelected({ approval_required: event.target.checked ? true : false })} />Approval required · no connected approval authority</label>

          <section className="mocc__scenario-block mocc__scenario-wide">
            <h3>Participating domains</h3>
            <div className="mocc__scenario-add-row"><select aria-label="Domain to add" value={domainToAdd} onChange={(event) => setDomainToAdd(event.target.value)}><option value="">Select domain</option>{domainOptions.map(({ domain, label }) => <option key={domain} value={domain}>{label} · {getMoccIntegrationStatus(domain)?.status}</option>)}</select><label className="mocc__scenario-inline"><input type="checkbox" checked={domainRequired} onChange={(event) => setDomainRequired(event.target.checked)} />Required</label><button type="button" disabled={!domainToAdd} onClick={addParticipant}>Add</button></div>
            <ul>{selectedDomains.map(({ domain, required }) => <li key={domain}><span>{domain.replaceAll("_", " ")} · {getMoccIntegrationStatus(domain)?.status} · {required ? "Required" : "Optional"}</span><button type="button" aria-label={`Remove ${domain} domain`} onClick={() => updateSelected({ participating_domains: selectedDomains.filter((item) => item.domain !== domain) })}>×</button></li>)}</ul>
          </section>

          <section className="mocc__scenario-block mocc__scenario-wide">
            <h3>Initial conditions · simulation-only</h3>
            <div className="mocc__scenario-add-row"><select aria-label="Initial condition domain" value={condition.domain} onChange={(event) => setCondition((current) => ({ ...current, domain: event.target.value }))}><option value="">Domain</option>{selectedDomains.map(({ domain }) => <option key={domain} value={domain}>{domain.replaceAll("_", " ")}</option>)}</select><input aria-label="Initial condition key" value={condition.key} onChange={(event) => setCondition((current) => ({ ...current, key: event.target.value }))} placeholder="Parameter" /><input aria-label="Initial condition value" value={condition.value} onChange={(event) => setCondition((current) => ({ ...current, value: event.target.value }))} placeholder="Scenario value" /><button type="button" onClick={addInitialCondition} disabled={!condition.domain || !condition.key.trim() || !condition.value.trim()}>Add</button></div>
            <ul>{Object.entries(selected.initial_conditions || {}).flatMap(([domain, values]) => Object.entries(values || {}).map(([key, value]) => <li key={`${domain}-${key}`}><span>{domain.replaceAll("_", " ")} · {key}: {String(value)}</span><button type="button" aria-label={`Remove ${key} initial condition`} onClick={() => { const next = { ...selected.initial_conditions }; next[domain] = { ...next[domain] }; delete next[domain][key]; if (!Object.keys(next[domain]).length) delete next[domain]; updateSelected({ initial_conditions: next }); }}>×</button></li>))}</ul>
          </section>

          <section className="mocc__scenario-block mocc__scenario-wide">
            <h3>Planned scenario events · not operational events</h3>
            <div className="mocc__scenario-add-row"><input aria-label="Scenario event type" value={scenarioEvent.event_type} onChange={(event) => setScenarioEvent((current) => ({ ...current, event_type: event.target.value }))} placeholder="Simulated event type" /><select aria-label="Scenario event domain" value={scenarioEvent.domain} onChange={(event) => setScenarioEvent((current) => ({ ...current, domain: event.target.value }))}><option value="">Domain</option>{selectedDomains.map(({ domain }) => <option key={domain} value={domain}>{domain.replaceAll("_", " ")}</option>)}</select><input aria-label="Relative event time in minutes" type="number" min="0" value={scenarioEvent.relative_time_minutes} onChange={(event) => setScenarioEvent((current) => ({ ...current, relative_time_minutes: event.target.value }))} /><select aria-label="Scenario event canonical target" value={scenarioEvent.target_reference} onChange={(event) => setScenarioEvent((current) => ({ ...current, target_reference: event.target.value }))}><option value="">No spatial target</option>{spatialOptions.map(({ reference, label, status }) => <option key={reference} value={reference}>{label} · {status}</option>)}</select><button type="button" disabled={!scenarioEvent.event_type.trim() || !scenarioEvent.domain || scenarioEvent.relative_time_minutes === ""} onClick={addScenarioEvent}>Add</button></div>
            <ul>{(selected.planned_events || []).map((event) => <li key={event.scenario_event_id}><span>{event.event_type} · {event.domain} · +{event.relative_time_minutes} min{event.target_reference ? ` · ${event.target_reference}` : ""}</span><button type="button" aria-label={`Remove planned event ${event.event_type}`} onClick={() => updateSelected({ planned_events: selected.planned_events.filter((item) => item.scenario_event_id !== event.scenario_event_id) })}>×</button></li>)}</ul>
          </section>

          <section className="mocc__scenario-block">
            <h3>Canonical spatial references</h3>
            <div className="mocc__scenario-add-row"><select aria-label="Canonical spatial reference" value={spatialToAdd} onChange={(event) => setSpatialToAdd(event.target.value)}><option value="">Select location</option>{spatialOptions.filter(({ reference }) => !selectedSpatialRefs.includes(reference)).map(({ reference, label, status }) => <option key={reference} value={reference}>{label} · {status}</option>)}</select><button type="button" disabled={!spatialToAdd} onClick={() => { updateSelected({ spatial_references: [...selectedSpatialRefs, spatialToAdd] }); setSpatialToAdd(""); }}>Add</button></div>
            <ul>{assessment?.spatial_references.map(({ reference, status }) => <li key={reference}><span>{reference} · {status}</span><button type="button" aria-label={`Remove ${reference}`} onClick={() => updateSelected({ spatial_references: selectedSpatialRefs.filter((item) => item !== reference) })}>×</button></li>)}</ul>
          </section>

          <section className="mocc__scenario-block">
            <h3>Dependencies · MOCC-7 references</h3>
            <div className="mocc__scenario-add-row"><select aria-label="Dependency graph reference" value={dependencyToAdd} onChange={(event) => setDependencyToAdd(event.target.value)}><option value="">Select graph node</option>{graphNodes.filter((node) => !selected.dependencies?.includes(node.node_id)).map((node) => <option key={node.node_id} value={node.node_id}>{node.label} · {node.status || node.node_type}</option>)}</select><button type="button" disabled={!dependencyToAdd} onClick={() => { updateSelected({ dependencies: [...(selected.dependencies || []), dependencyToAdd] }); setDependencyToAdd(""); }}>Add</button></div>
            <ul>{(selected.dependencies || []).map((reference) => <li key={reference}><span>{reference}{graphNodes.some((node) => node.node_id === reference) ? " · resolved" : " · unresolved"}</span><button type="button" aria-label={`Remove dependency ${reference}`} onClick={() => updateSelected({ dependencies: selected.dependencies.filter((item) => item !== reference) })}>×</button></li>)}</ul>
          </section>

          <section className="mocc__scenario-block mocc__scenario-wide">
            <h3>Mission and schedule references</h3>
            <div className="mocc__scenario-add-row"><select aria-label="Mission reference" value={missionToAdd} onChange={(event) => setMissionToAdd(event.target.value)}><option value="">Mission reference</option>{missionNodes.filter((node) => !selected.mission_references?.includes(missionId(node))).map((node) => <option key={node.node_id} value={missionId(node)}>{node.label} · source-backed</option>)}</select><button type="button" disabled={!missionToAdd} onClick={() => { updateSelected({ mission_references: [...(selected.mission_references || []), missionToAdd] }); setMissionToAdd(""); }}>Add mission</button><select aria-label="Schedule reference" value="" onChange={(event) => { const reference = event.target.value; if (reference) updateSelected({ schedule_references: [...(selected.schedule_references || []), reference] }); }}><option value="">Schedule reference</option>{schedules.filter((schedule) => !selected.schedule_references?.includes(schedule.schedule_id)).map((schedule) => <option key={schedule.schedule_id} value={schedule.schedule_id}>{schedule.title || schedule.schedule_id}</option>)}</select></div>
            <ul>{[...(selected.mission_references || []).map((reference) => ({ type: "Mission", reference })), ...(selected.schedule_references || []).map((reference) => ({ type: "Schedule", reference }))].map(({ type, reference }) => <li key={`${type}-${reference}`}><span>{type} · {reference}</span><button type="button" aria-label={`Remove ${type} reference ${reference}`} onClick={() => updateSelected(type === "Mission" ? { mission_references: selected.mission_references.filter((item) => item !== reference) } : { schedule_references: selected.schedule_references.filter((item) => item !== reference) })}>×</button></li>)}</ul>
            {!schedules.length ? <p>No schedule records are currently available to reference.</p> : null}
          </section>
        </div> : <p className="mocc__scenario-empty">Create a local draft to define a simulation-only scenario. No templates or persisted scenario source are connected.</p>}
      </section>

      <aside className="mocc__scenario-readiness" aria-label="Scenario validation and readiness">
        <header><h2>READINESS</h2><span>{assessment?.simulation_readiness || "NO DRAFT"}</span></header>
        {assessment ? <>
          <div className="mocc__scenario-readiness-summary"><strong>{assessment.status}</strong><span>{assessment.execution_state} · sandbox execution unavailable</span></div>
          <dl><div><dt>Mode</dt><dd>{assessment.mode || "Unavailable"}</dd></div><div><dt>Duration</dt><dd>{assessment.duration_minutes ? `${assessment.duration_minutes} minutes` : "Required"}</dd></div><div><dt>Approval</dt><dd>{assessment.approval_required ? assessment.approval_status : "Not required / not configured"}</dd></div><div><dt>Source record</dt><dd>In-page state only</dd></div></dl>
          <section><h3>Participating integrations</h3>{assessment.participating_domains.length ? <ul>{assessment.participating_domains.map(({ domain, required, integration_status }) => <li key={domain}>{domain.replaceAll("_", " ")} · {integration_status} · {required ? "Required" : "Optional"}</li>)}</ul> : <p>No participating domains selected.</p>}</section>
          <section><h3>Validation</h3>{assessment.validation_issues.length ? <ul>{assessment.validation_issues.map((item, index) => <li key={`${item.code}-${item.domain || item.reference || index}`}>{item.code}{item.domain ? ` · ${item.domain}` : ""}{item.reference ? ` · ${item.reference}` : ""}</li>)}</ul> : <p>Definition passes current validation for a future sandbox simulation.</p>}</section>
          <section><h3>Authority boundary</h3><p>Initial conditions and planned events remain scenario configuration. No MOCC-3 event, live domain state, schedule, or command is created.</p></section>
        </> : <p className="mocc__scenario-empty">Scenario readiness is evaluated from the shared integration registry and source-backed references when a local draft is selected.</p>}
      </aside>
    </section>
  );
}

function WhatIfWorkspace({ scenarios, dependencyGraph, schedules, analyses, setAnalyses, selectedScenarioId, setSelectedScenarioId }) {
  const scenarioRows = useMemo(() => scenarios.map((scenario) => ({
    scenario,
    assessment: projectMoccScenario(scenario, { dependencyGraph, schedules }),
  })), [scenarios, dependencyGraph, schedules]);
  const selectedRow = scenarioRows.find(({ scenario }) => scenario.scenario_id === selectedScenarioId) || scenarioRows[0] || null;
  const selected = selectedRow?.scenario || null;
  const assessment = selectedRow?.assessment || null;
  const analysis = selected ? analyses[selected.scenario_id] || createMoccWhatIfNotRun(assessment) : createMoccWhatIfNotRun();
  const [selectedImpactKey, setSelectedImpactKey] = useState(null);
  const selectedImpact = analysis.derived_impacts.find((impact, index) => impactKey(impact, index) === selectedImpactKey) || null;

  function runAnalysis() {
    if (!selected) return;
    const next = analyzeMoccScenario(selected, { analysisId: `local-analysis-${++localWhatIfSequence}`, dependencyGraph, schedules });
    setAnalyses((current) => ({ ...current, [selected.scenario_id]: next }));
    setSelectedImpactKey(null);
  }

  function impactKey(impact, index) {
    return `${impact.impact_type}:${impact.target?.node_id}:${impact.source_condition?.scenario_event_id || impact.source_condition?.key || "input"}:${index}`;
  }

  const impactGroups = [
    ["Direct impacts", analysis.derived_impacts.filter((impact) => impact.impact_type === "DIRECT")],
    ["Dependency-exposed", analysis.derived_impacts.filter((impact) => impact.impact_type === "DEPENDENCY_EXPOSED")],
    ["Pending / unresolved", analysis.blocked_impacts],
  ];

  return (
    <section className="mocc__whatif-workspace" aria-label="Read-only What-If analysis workspace">
      <aside className="mocc__whatif-scenarios">
        <header><div><h2>SCENARIO INPUT</h2><span>{scenarioRows.length} in-page definition{scenarioRows.length === 1 ? "" : "s"}</span></div><strong>LOCAL ONLY</strong></header>
        <div className="mocc__whatif-scenario-list">
          {scenarioRows.map(({ scenario, assessment: rowAssessment }) => <button type="button" key={scenario.scenario_id} aria-pressed={scenario.scenario_id === selected?.scenario_id} onClick={() => { setSelectedScenarioId(scenario.scenario_id); setSelectedImpactKey(null); }}><strong>{scenario.title || "Untitled scenario"}</strong><span>{rowAssessment.status} · {rowAssessment.mode || "Mode unavailable"}</span></button>)}
          {!scenarioRows.length ? <p>No scenario definitions are available in this page session. Create a draft in SCENARIOS first.</p> : null}
        </div>
        {selected ? <dl className="mocc__whatif-input-summary"><div><dt>Mode</dt><dd>{assessment.mode || "Unavailable"}</dd></div><div><dt>Readiness</dt><dd>{assessment.simulation_readiness}</dd></div><div><dt>Input domains</dt><dd>{assessment.participating_domains.map(({ domain }) => domain.replaceAll("_", " ")).join(", ") || "None"}</dd></div></dl> : null}
      </aside>

      <section className="mocc__whatif-results" aria-label="Scenario impact projection">
        <header><div><h2>IMPACT ANALYSIS</h2><span>{selected?.title || "Select a scenario definition"}</span></div><button type="button" disabled={!selected} onClick={runAnalysis}>ANALYZE SCENARIO</button></header>
        <div className="mocc__whatif-status"><strong>{analysis.analysis_status}</strong><span>Deterministic projection · no simulation runtime</span><small>Analysis ID: {analysis.analysis_id || "Not run"}</small></div>
        {selected ? <div className="mocc__whatif-groups">
          <p className="mocc__whatif-domain-summary">Affected domains: {analysis.affected_domains.join(" · ") || "None established"}</p>
          {impactGroups.map(([label, impacts]) => <section key={label}><h3>{label}<span>{impacts.length}</span></h3>{impacts.length ? impacts.map((impact, index) => <button type="button" key={impactKey(impact, index)} aria-pressed={selectedImpactKey === impactKey(impact, index)} onClick={() => setSelectedImpactKey(impactKey(impact, index))}><strong>{impact.target?.label || impact.reference || "Unresolved reference"}</strong><span>{impact.impact_type} · {impact.explanation || impact.reason}</span></button>) : <p>{analysis.analysis_status === "NOT_RUN" ? "Run analysis to evaluate supported relationships." : "No results in this group."}</p>}</section>)}
        </div> : <p className="mocc__whatif-empty">What-If analysis uses only MOCC-10 scenario definitions available in this page session. No example scenario is supplied.</p>}
        <p className="mocc__whatif-isolation">What-If results are not operational events and are never added to Live Operations or the timeline.</p>
      </section>

      <aside className="mocc__whatif-details" aria-label="Analysis assumptions and traceability">
        <header><h2>ASSUMPTIONS &amp; LIMITS</h2><span>{analysis.analysis_status}</span></header>
        <section><h3>Assumptions</h3>{analysis.assumptions.length ? <ul>{analysis.assumptions.map((item, index) => <li key={`${item.source?.scenario_event_id || item.source?.key || index}`}>{item.statement}</li>)}</ul> : <p>{analysis.analysis_status === "NOT_RUN" ? "No assumptions applied; analysis has not been run." : "No scenario inputs were resolved."}</p>}</section>
        <section><h3>Pending integrations</h3>{analysis.pending_integrations.length ? <ul>{analysis.pending_integrations.map((item) => <li key={item.domain}><strong>{item.domain.replaceAll("_", " ")} · {item.status}</strong><span>{item.limitation}</span>{item.missing_dependency ? <span>{item.missing_dependency}</span> : null}</li>)}</ul> : <p>None identified in this analysis.</p>}</section>
        <section><h3>Blocking dependencies</h3>{analysis.blocking_dependencies.length ? <ul>{analysis.blocking_dependencies.map((item, index) => <li key={`${item.reference}-${index}`}><strong>{item.reference || "Unspecified"} · {item.status || "UNRESOLVED"}</strong><span>{item.reason}</span></li>)}</ul> : <p>None.</p>}</section>
        <section><h3>Unresolved references</h3>{analysis.unresolved_references.length ? <ul>{analysis.unresolved_references.map((item, index) => <li key={`${item.reference}-${index}`}>{item.type} · {item.reference || "Unavailable"}</li>)}</ul> : <p>None.</p>}</section>
        <section><h3>Limitations</h3><ul>{analysis.limitations.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>
        <section className="mocc__whatif-trace"><h3>Why this impact?</h3>{selectedImpact ? <>
          <p>{selectedImpact.explanation}</p><dl><div><dt>Impact type</dt><dd>{selectedImpact.impact_type}</dd></div><div><dt>Scenario input</dt><dd>{selectedImpact.source_condition?.kind === "INITIAL_CONDITION" ? `${selectedImpact.source_condition.domain}.${selectedImpact.source_condition.key} = ${String(selectedImpact.source_condition.value)}` : selectedImpact.source_condition?.event_type || "Scenario configuration"}</dd></div><div><dt>Scenario reference</dt><dd>{selectedImpact.scenario_reference || "Unavailable"}</dd></div><div><dt>Source node</dt><dd>{selectedImpact.source_node?.label || "Scenario input"}</dd></div><div><dt>Source authority</dt><dd>{selectedImpact.source_node?.source_authority || "Scenario definition"}</dd></div><div><dt>Source reference</dt><dd>{selectedImpact.source_node?.source_reference || selectedImpact.source_condition?.scenario_event_id || selectedImpact.source_condition?.domain || "Unavailable"}</dd></div><div><dt>Rule</dt><dd>{selectedImpact.rule}</dd></div></dl>
          {selectedImpact.path.length ? <ul>{selectedImpact.path.map((edge) => <li key={edge.edge_id}>{edge.relationship_type} · {edge.source_authority || "Authority unavailable"} · {edge.source_reference || "Reference unavailable"}</li>)}</ul> : <p>Direct scenario input; no relationship traversal.</p>}
          {selectedImpact.target?.spatial_reference ? <p>Canonical spatial reference retained for future visualization.</p> : null}
        </> : <p>Select a derived impact to inspect its source and relationship path.</p>}</section>
      </aside>
    </section>
  );
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-").replaceAll("_", "-").replaceAll("/", "-");
}

function statusLabel(status) {
  return status === "NOT_CONNECTED" ? "NOT CONNECTED" : status;
}

function MoccIcon({ name }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" };
  if (name === "gear") return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></svg>;
  if (name === "assist") return <svg {...common}><path d="M12 3l1.8 5.7L20 11l-6.2 2.3L12 19l-1.8-5.7L4 11l6.2-2.3L12 3z" /></svg>;
  if (name === "network") return <svg {...common}><circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" /><path d="M10.7 7.6 6.3 16.4M13.3 7.6l4.4 8.8M8 19h8" /></svg>;
  if (name === "cube") return <svg {...common}><path d="M12 3 4.5 7.3v9.4L12 21l7.5-4.3V7.3L12 3z" /><path d="m4.8 7.5 7.2 4.2 7.2-4.2M12 21v-9.3" /></svg>;
  if (name === "building") return <svg {...common}><path d="M4 21V7l8-4 8 4v14" /><path d="M8 21v-7h8v7M8 9h1M12 9h1M16 9h1" /></svg>;
  if (name === "car") return <svg {...common}><path d="M5 16h14l-1.5-5h-11L5 16zM7 16v3M17 16v3" /><circle cx="8" cy="19" r="1.5" /><circle cx="16" cy="19" r="1.5" /></svg>;
  if (name === "cloud") return <svg {...common}><path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.3 1.8A3.2 3.2 0 0 0 7 18z" /></svg>;
  if (name === "target") return <svg {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1.5" /></svg>;
  if (name === "bank") return <svg {...common}><path d="M4 10h16L12 4 4 10zM6 10v8M10 10v8M14 10v8M18 10v8M4 20h16" /></svg>;
  if (name === "agents") return <svg {...common}><circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M3 20c.6-4 2.3-6 5-6s4.4 2 5 6M11 20c.6-4 2.3-6 5-6s4.4 2 5 6" /></svg>;
  if (name === "fire") return <svg {...common}><path d="M12 22c4 0 7-2.8 7-6.8 0-3-1.8-5.2-4.6-7.8.2 2.1-.6 3.5-1.8 4.4C12.2 8.2 9.8 5.2 7 3c.7 4.7-2 6.6-2 11.5C5 19 8.1 22 12 22z" /></svg>;
  if (name === "drop") return <svg {...common}><path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z" /></svg>;
  if (name === "plane") return <svg {...common}><path d="M3 11.5 21 4l-6.5 16-3.5-7-8-1.5z" /><path d="m11 13 10-9" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>;
  if (name === "moon") return <svg {...common}><path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2z" /></svg>;
  if (name === "sun") return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></svg>;
  if (name === "wind") return <svg {...common}><path d="M3 8h10a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 18h7" /></svg>;
  if (name === "leaf") return <svg {...common}><path d="M20 4C10 4 5 9 5 18c8 0 13-5 15-14z" /><path d="M5 18c3-5 7-8 12-10" /></svg>;
  return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function formatDateParts(date) {
  return {
    date: new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
  };
}

function formatEventTimestamp(timestamp) {
  if (!timestamp || !Number.isFinite(Date.parse(timestamp))) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}

function formatTimelineDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function timelineDateAtCurrentClock(value, currentEnd) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const clock = new Date(currentEnd);
  const selected = new Date(year, month - 1, day, clock.getHours(), clock.getMinutes(), clock.getSeconds(), clock.getMilliseconds());
  return Number.isFinite(selected.getTime()) ? selected.getTime() : null;
}

function ReplayWorkspace({ events, staticContext, replay, setReplay }) {
  const replayEvents = useMemo(() => projectMoccReplayEvents(events, replay.windowStart, replay.windowEnd), [events, replay.windowStart, replay.windowEnd]);
  const coverage = useMemo(() => projectMoccReplayCoverage(events, replay.windowStart, replay.windowEnd, staticContext), [events, replay.windowStart, replay.windowEnd, staticContext]);
  const selectedKey = replay.selectedReplayEvent ? moccReplayEventKey(replay.selectedReplayEvent) : null;
  const selectedIndex = selectedKey ? replayEvents.findIndex((event) => moccReplayEventKey(event) === selectedKey) : -1;
  const hasPrevious = selectedIndex >= 0 ? selectedIndex > 0 : replayEvents.some((event) => Date.parse(event.timestamp) <= replay.cursorTime);
  const hasNext = selectedIndex >= 0 ? selectedIndex < replayEvents.length - 1 : replayEvents.some((event) => Date.parse(event.timestamp) >= replay.cursorTime);
  const selected = replay.selectedReplayEvent;

  function changeWindow(which, value) {
    const timestamp = parseMoccReplayDateTime(value);
    if (timestamp === null) return;
    setReplay((current) => setMoccReplayWindow(
      current,
      which === "start" ? timestamp : current.windowStart,
      which === "end" ? timestamp : current.windowEnd,
    ));
  }

  function jumpTo(time) {
    setReplay((current) => ({ ...current, cursorTime: time, selectedReplayEvent: null, isPlaying: false }));
  }

  return (
    <section className="mocc__replay-workspace" aria-label="Historical replay workspace">
      <header className="mocc__replay-banner">
        <div><strong>REPLAY MODE</strong><span>HISTORICAL / READ ONLY</span></div>
        <p>Local review of timestamped MOCC source records. No live state is changed.</p>
      </header>
      <section className="mocc__replay-console" aria-label="Replay controls">
        <label>Start Date / Time<input aria-label="Replay start date and time" type="datetime-local" value={formatMoccReplayDateTime(replay.windowStart)} onChange={(event) => changeWindow("start", event.target.value)} /></label>
        <label>End Date / Time<input aria-label="Replay end date and time" type="datetime-local" value={formatMoccReplayDateTime(replay.windowEnd)} onChange={(event) => changeWindow("end", event.target.value)} /></label>
        <div className="mocc__replay-transport" aria-label="Replay transport">
          <button type="button" aria-label="Jump to Start" title="Jump to Start" onClick={() => jumpTo(replay.windowStart)}>|&lt;</button>
          <button type="button" aria-label="Previous Event" title="Previous Event" disabled={!hasPrevious} onClick={() => setReplay((current) => navigateMoccReplayEvent(current, events, -1))}>&lt; Event</button>
          <button type="button" aria-label={replay.isPlaying ? "Pause" : "Play"} onClick={() => setReplay((current) => ({ ...current, isPlaying: !current.isPlaying && current.cursorTime < current.windowEnd }))}>{replay.isPlaying ? "Pause" : "Play"}</button>
          <button type="button" aria-label="Next Event" title="Next Event" disabled={!hasNext} onClick={() => setReplay((current) => navigateMoccReplayEvent(current, events, 1))}>Event &gt;</button>
          <button type="button" aria-label="Jump to End" title="Jump to End" onClick={() => jumpTo(replay.windowEnd)}>&gt;|</button>
        </div>
        <label className="mocc__replay-speed">Speed<select aria-label="Replay speed" value={replay.playbackSpeed} onChange={(event) => setReplay((current) => ({ ...current, playbackSpeed: Number(event.target.value) }))}>{MOCC_REPLAY_SPEEDS.map((speed) => <option key={speed} value={speed}>{speed}x</option>)}</select></label>
        <label className="mocc__replay-cursor">Historical Cursor<input aria-label="Historical cursor date and time" type="datetime-local" step="1" readOnly value={formatMoccReplayDateTime(replay.cursorTime, true)} /></label>
        <span className={`mocc__replay-state${replay.isPlaying ? " is-playing" : ""}`}>{replay.isPlaying ? "PLAYING" : "PAUSED"}</span>
      </section>
      <div className="mocc__replay-content">
        <section className="mocc__replay-history">
          <header><h2>HISTORICAL EVENT WINDOW</h2><span>{replayEvents.length} timestamped records</span></header>
          {replayEvents.length ? <ol>
            {replayEvents.map((event, index) => (
              <li key={`${event.source_authority || "source"}:${event.event_id || event.source_event_ref || index}`}>
                <button type="button" aria-pressed={Boolean(selected && moccReplayEventKey(selected) === moccReplayEventKey(event))} onClick={() => setReplay((current) => selectMoccReplayEvent(current, event))}>
                  <time dateTime={event.timestamp}>{formatEventTimestamp(event.timestamp)}</time>
                  <strong>{event.title || event.event_type || "Historical event"}</strong>
                  <span><b>OBSERVED_EVENT</b> · {event.event_type || "Uncategorized"} · {event.source_authority || "Source unavailable"}</span>
                </button>
              </li>
            ))}
          </ol> : <p className="mocc__replay-empty">No historical events available for this window.</p>}
          <p className="mocc__replay-isolation">Replay cursor and selection are local to this workspace; operational history is not replayed or changed.</p>
          <section className="mocc__replay-static-context" aria-label="Static context">
            <header><h2>STATIC_CONTEXT · NOT HISTORICAL_STATE</h2><span>{staticContext.length} canonical facilities</span></header>
            <ul>{staticContext.slice(0, 8).map((record) => <li key={record.record_id}><strong>{record.title}</strong><span>STATIC CONTEXT · {record.source_authority} · {record.source_reference}</span></li>)}</ul>
            {staticContext.length > 8 ? <p>{staticContext.length - 8} additional canonical facilities are available in the spatial registry.</p> : null}
          </section>
        </section>
        <aside className="mocc__replay-side">
          <section className="mocc__replay-coverage">
            <header><h2>REPLAY SOURCE COVERAGE</h2><span>Timestamped records only</span></header>
            <ul>{coverage.map((item) => <li key={item.id}><span>{item.label}</span><strong className={`is-${item.status.toLowerCase()}`}>{item.status}</strong><small>{item.recordCount ? `${item.recordCount} ${item.record_kind === "STATIC_CONTEXT" ? "static references" : "in window"}` : item.detail}</small></li>)}</ul>
            <p>OBSERVED EVENT records retain source timestamps and provenance. Coverage is not a claim about past domain state.</p>
          </section>
          <section className="mocc__replay-snapshots">
            <header><h2>HISTORICAL_STATE</h2><strong>UNAVAILABLE</strong></header>
            <p>No authoritative historical state snapshots are exposed by the current read source.</p>
          </section>
          <section className="mocc__replay-record">
            <header><h2>SELECTED HISTORICAL RECORD</h2></header>
            {selected ? <dl>
              <div><dt>Record kind</dt><dd>{selected.record_kind || "OBSERVED_EVENT"}</dd></div>
              <div><dt>Title / type</dt><dd>{selected.title || selected.event_type || "Unavailable"}</dd></div>
              <div><dt>Timestamp</dt><dd>{formatEventTimestamp(selected.timestamp)}</dd></div>
              <div><dt>Source authority</dt><dd>{selected.source_authority || "Unavailable"}</dd></div>
              <div><dt>Source reference</dt><dd>{selected.source_event_ref || selected.event_id || "Unavailable"}</dd></div>
              <div><dt>State / severity</dt><dd>{[selected.state, selected.severity].filter(Boolean).join(" · ") || "Unavailable"}</dd></div>
              <div><dt>Location</dt><dd>{selected.location?.district_id || selected.location?.facility_id || "Unavailable"}</dd></div>
              <div><dt>Mission / scenario</dt><dd>{[selected.mission_id, selected.scenario_id].filter(Boolean).join(" · ") || "Unavailable"}</dd></div>
            </dl> : <p>Select a source-backed record to inspect its available details.</p>}
          </section>
          <section className="mocc__replay-limitations">
            <h2>LIMITATIONS</h2>
            <p>Read-only cursor navigation only. No event reconstruction, command replay, rollback, or historical archive query.</p>
          </section>
        </aside>
      </div>
    </section>
  );
}

function CommandCenterSurface() {
  const [mode, setMode] = useState("MANUAL");
  const [activeSection, setActiveSection] = useState("Overview");
  const [orchestration, setOrchestration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [layersOpen, setLayersOpen] = useState(false);
  const [overlayVisibility, setOverlayVisibility] = useState(createDefaultMoccOverlayVisibility);
  const [timelineAnchorNow, setTimelineAnchorNow] = useState(() => Date.now());
  const [timelineWindowEnd, setTimelineWindowEnd] = useState(() => Date.now());
  const [timelineLive, setTimelineLive] = useState(true);
  const [timelineFilters, setTimelineFilters] = useState(() => Object.fromEntries(MOCC_TIMELINE_CATEGORIES.map(({ id }) => [id, true])));
  const [selectedTimelineKey, setSelectedTimelineKey] = useState(null);
  const [scenarioDrafts, setScenarioDrafts] = useState([]);
  const [whatIfAnalyses, setWhatIfAnalyses] = useState({});
  const [selectedWhatIfScenarioId, setSelectedWhatIfScenarioId] = useState(null);
  const [replay, setReplay] = useState(() => createMoccReplayState());
  const now = useMemo(() => new Date(), []);
  const currentTime = formatDateParts(now);

  useEffect(() => {
    let cancelled = false;

    getCityOrchestration()
      .then((data) => {
        if (!cancelled) {
          setOrchestration(data);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Metaverse orchestration is unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sourceCityEvents = Array.isArray(orchestration?.city_events)
    ? orchestration.city_events
    : [];
  const projectedEvents = projectMoccEvents(sourceCityEvents);
  const replayHistoricalEvents = projectMoccHistoricalEvents(sourceCityEvents);
  const replayStaticContext = useMemo(() => projectMoccStaticContext(METAVERSE_FACILITIES), []);
  const dependencyGraph = useMemo(() => buildMoccDependencyGraph({ events: projectedEvents }), [projectedEvents]);
  const operationRecords = projectMoccOperations(projectedEvents);
  const incidentRecords = projectMoccIncidents(projectedEvents);
  const scheduleRecords = useMemo(() => projectMoccSchedules([], { dependencyGraph }), [dependencyGraph]);
  const timelineWindowEvents = projectMoccTimelineEvents(projectedEvents, timelineWindowEnd);
  const timelineEvents = filterMoccTimelineEvents(timelineWindowEvents, timelineFilters);
  const selectedTimelineEvent = timelineEvents.find((event) => event.timeline_key === selectedTimelineKey) || null;
  const operationalOverlayEntities = projectMoccOperationalOverlayEntities({ events: projectedEvents, visibility: overlayVisibility });
  const cityOverlayEntities = operationalOverlayEntities.filter((entity) => entity.spatial_reference.coordinate_space_id !== "quick-map");
  const quickMapOverlayEntities = operationalOverlayEntities.filter((entity) => entity.spatial_reference.coordinate_space_id === "quick-map");

  function updateScenarioDrafts(nextDrafts) {
    setScenarioDrafts(nextDrafts);
    setWhatIfAnalyses({});
  }

  const pulses = Array.isArray(orchestration?.district_pulses)
    ? orchestration.district_pulses
    : [];

  const briefingItems = Array.isArray(orchestration?.briefing?.items)
    ? orchestration.briefing.items
    : [];

  const activeMode =
    OPERATING_MODES.find((item) => item.id === mode) || OPERATING_MODES[0];
  const systemHealth = error ? "DEGRADED" : loading ? "SYNC" : "READ";
  const projectionReady = !loading && !error && Boolean(orchestration);
  const cityCameraUrl = publicAssetUrl(CITY_CAMERA_ASSET);
  const quickMapUrl = publicAssetUrl(MINIMAP_ASSET);
  const logoUrl = publicAssetUrl(METAVERSE_LOGO_ASSET);
  const timelineMode = timelineLive ? "LIVE" : timelineWindowEnd <= timelineAnchorNow ? "HISTORICAL" : "WINDOW";

  useEffect(() => {
    if (activeSection !== "Replay" || !replay.isPlaying) return undefined;
    const timer = window.setInterval(() => {
      setReplay((current) => advanceMoccReplayCursor(current, 250));
    }, 250);
    return () => window.clearInterval(timer);
  }, [activeSection, replay.isPlaying, replay.playbackSpeed, replay.windowEnd]);

  useEffect(() => {
    if (activeSection !== "Replay") {
      setReplay((current) => current.isPlaying ? { ...current, isPlaying: false } : current);
    }
  }, [activeSection]);

  function goToNow() {
    const current = Date.now();
    setTimelineAnchorNow(current);
    setTimelineWindowEnd(current);
    setTimelineLive(true);
  }

  function moveTimelineWindow(direction) {
    const nextWindowEnd = timelineWindowEnd + direction * MOCC_TIMELINE_WINDOW_MS;
    setTimelineWindowEnd(nextWindowEnd);
    setTimelineLive(Math.abs(nextWindowEnd - timelineAnchorNow) < 1000);
  }

  function chooseTimelineDate(value) {
    const selectedDate = timelineDateAtCurrentClock(value, timelineWindowEnd);
    if (selectedDate === null) return;
    setTimelineWindowEnd(selectedDate);
    setTimelineLive(false);
  }

  return (
    <main className={`mocc${activeSection !== "Overview" ? " mocc--alternate" : ""}`}>
      <header className="mocc__header">
        <div className="mocc__brand">
          <img src={logoUrl} alt="Silicon Heartland Metaverse" />
        </div>
        <div className="mocc__title-block">
          <h1>Operations &amp; Orchestration Command Center</h1>
          <p className="mocc__doctrine">Separate authorities. Shared coordination. One living city.</p>
        </div>
        <div className="mocc__search" role="search">
          <MoccIcon name="search" />
          <span>Search city, assets, missions...</span>
        </div>
        <div className="mocc__clock">
          <MoccIcon name="moon" />
          <div>
            <span>{currentTime.date}</span>
            <strong>{currentTime.time}</strong>
            <em>AUTO TIME</em>
          </div>
        </div>
        <div className="mocc__control-status">
          <span className="mocc__control-label">ACTIVE CONTROLLER</span>
          <strong>{activeMode.label}</strong>
          <span className="mocc__read-only">MOCC-1 · READ ONLY</span>
        </div>
      </header>

      <nav className="mocc__topnav" aria-label="MOCC sections">
        {["Overview", "Live City", "Digital Twin", "Operations", "Incidents", "Missions", "Scenarios", "What-If", "Schedule", "Dependencies", "Replay", "Systems", "Agents", "Testing", "Audit", "Admin"].map((item) => (
          <button key={item} type="button" className={item === activeSection ? "is-active" : ""} aria-current={item === activeSection ? "page" : undefined} onClick={["Overview", "Operations", "Incidents", "Scenarios", "What-If", "Schedule", "Dependencies", "Replay"].includes(item) ? () => setActiveSection(item) : undefined}>{item}</button>
        ))}
      </nav>

      <section className="mocc__modebar">
        <div className="mocc__mode-options">
          <span>OPERATIONS CONTROL</span>
          {OPERATING_MODES.map((item) => (
            <button key={item.id} type="button" className={mode === item.id ? "is-active" : ""} onClick={() => setMode(item.id)}>
              <MoccIcon name={item.icon} />
              {item.label}
            </button>
          ))}
          <button type="button" className="mocc__human-control" onClick={() => setMode("MANUAL")}>
            <span aria-hidden="true">!</span>
            Take Human Control
          </button>
        </div>
      </section>

      {activeSection === "Dependencies" ? <DependenciesWorkspace graph={dependencyGraph} />
        : activeSection === "Schedule" ? <ScheduleWorkspace schedules={scheduleRecords} dependencyGraph={dependencyGraph} />
          : activeSection === "Scenarios" ? <ScenarioWorkspace dependencyGraph={dependencyGraph} schedules={scheduleRecords} drafts={scenarioDrafts} setDrafts={updateScenarioDrafts} />
            : activeSection === "What-If" ? <WhatIfWorkspace scenarios={scenarioDrafts} dependencyGraph={dependencyGraph} schedules={scheduleRecords} analyses={whatIfAnalyses} setAnalyses={setWhatIfAnalyses} selectedScenarioId={selectedWhatIfScenarioId} setSelectedScenarioId={setSelectedWhatIfScenarioId} />
              : activeSection === "Replay" ? <ReplayWorkspace events={replayHistoricalEvents} staticContext={replayStaticContext} replay={replay} setReplay={setReplay} />
          : activeSection === "Operations" ? <OperationsWorkspace records={operationRecords} graph={dependencyGraph} />
          : activeSection === "Incidents" ? <OperationsWorkspace records={incidentRecords} graph={dependencyGraph} incidentsOnly />
            : <>
      <section className="mocc__workspace">
        <aside className="mocc__left">
          <div className="mocc__panel-heading">
            <span>SYSTEM LAYERS</span>
            <button type="button" aria-label="System layer menu">☰</button>
          </div>
          <div className="mocc__system-list">
            {SYSTEM_LAYERS.map((system) => (
              <div className="mocc__system-row" key={system.label}>
                <span className="mocc__system-icon"><MoccIcon name={system.icon} /></span>
                <span className="mocc__system-copy">
                  <strong>{system.label}</strong>
                  <em>{system.description}</em>
                </span>
                <small className={`mocc__status mocc__status--${statusClass(system.status)}`}>{statusLabel(system.status)}</small>
                <span className="mocc__chevron" aria-hidden="true">›</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="mocc__center">
          <div className="mocc__digital-twin" style={{ "--mocc-city-camera": `url(${cityCameraUrl})` }}>
            <div className="mocc__digital-head">
              <div>
                <h2>DIGITAL TWIN</h2>
                <p>Silicon Heartland Metaverse — Live City View</p>
              </div>
              <div className="mocc__environment-strip">
                <span title="Weather integration pending"><MoccIcon name="sun" /><strong>Weather</strong><em>—</em></span>
                <span title="Wind integration pending"><MoccIcon name="wind" /><strong>Wind</strong><em>—</em></span>
                <span title="Air quality integration pending"><MoccIcon name="leaf" /><strong>Air Quality</strong><em>—</em></span>
              </div>
              <div className="mocc__view-controls" aria-label="Digital Twin view controls">
                <button type="button">City View</button>
                <button type="button" className="is-active">3D</button>
                <button type="button">2D</button>
                <button type="button" aria-label="Recenter">⌖</button>
                <button
                  type="button"
                  aria-label="Layers"
                  aria-expanded={layersOpen}
                  aria-controls="mocc-operational-layers"
                  onClick={() => setLayersOpen((open) => !open)}
                >▰</button>
                <button type="button" aria-label="Fullscreen">⛶</button>
              </div>
            </div>

            {layersOpen ? (
              <section className="mocc__overlay-menu" id="mocc-operational-layers" aria-label="Operational layers">
                <h3>OPERATIONAL LAYERS</h3>
                <div className="mocc__overlay-list">
                  {MOCC_OPERATIONAL_OVERLAYS.map((overlay) => {
                    const unavailable = overlay.status === "NOT_CONNECTED" || overlay.status === "UNAVAILABLE";
                    return (
                      <label className="mocc__overlay-row" key={overlay.overlay_id}>
                        <input
                          type="checkbox"
                          checked={Boolean(overlayVisibility[overlay.overlay_id])}
                          disabled={unavailable}
                          onChange={(event) => setOverlayVisibility((current) => setMoccOverlayVisibility(current, overlay.overlay_id, event.target.checked))}
                        />
                        <span className="mocc__overlay-name">{overlay.label}</span>
                        <small className={`mocc__overlay-status mocc__overlay-status--${statusClass(overlay.status)}`}>{statusLabel(overlay.status)}</small>
                        {overlay.status === "PENDING" && overlayVisibility[overlay.overlay_id] ? (
                          <em className="mocc__overlay-note">Pending integration</em>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <div className="mocc__city-camera" style={{ aspectRatio: METAVERSE_SCENE_IMAGE_ASPECT_RATIO }}>
              <div className="mocc__city-image" />
              <div className="mocc__city-route mocc__city-route--freeway" aria-hidden="true" />
              <div className="mocc__city-route mocc__city-route--bridge" aria-hidden="true" />
              {METAVERSE_DISTRICTS.filter((district) => PRIMARY_DISTRICT_MARKER_IDS.has(district.id)).map((district) => (
                <button
                  type="button"
                  key={district.id}
                  className={`mocc__city-marker mocc__city-marker--${DISTRICT_MARKER_THEMES[METAVERSE_DISTRICTS.indexOf(district)]}`}
                  style={{ left: `${district.x}%`, top: `${district.y}%` }}
                  aria-label={`${district.fullLabel || district.label} read-only Digital Twin marker`}
                >
                  <span className="mocc__city-pin"><MoccIcon name={district.id === "civic-district" ? "bank" : district.id === "career-education-district" ? "building" : "target"} /></span>
                  <strong>{DISTRICT_DISPLAY_LABELS[district.id] || district.fullLabel || district.label}</strong>
                </button>
              ))}
              {cityOverlayEntities.map((entity) => (
                <span
                  key={entity.entity_id}
                  className={`mocc__operational-marker mocc__operational-marker--${entity.overlay_id}`}
                  style={{ left: `${entity.spatial_reference.position.x}%`, top: `${entity.spatial_reference.position.y}%` }}
                  title={[entity.label, entity.source_authority, entity.source_reference, entity.state, entity.severity, entity.timestamp].filter(Boolean).join(" · ")}
                  aria-label={`${entity.label}; source ${entity.source_authority}; reference ${entity.source_reference}`}
                />
              ))}
              <div className="mocc__camera-card">
                <div className="mocc__camera-card-head"><span>▣ City Camera 01</span><strong>READ ONLY</strong></div>
                <div className="mocc__camera-card-image" />
                <span>Downtown — Live City Plate</span>
              </div>
              <div className="mocc__region-overview">
                <div className="mocc__region-head"><strong>REGION OVERVIEW</strong><span>N</span></div>
                <div className="mocc__region-map" style={{ backgroundImage: `url(${quickMapUrl})` }}>
                  {METAVERSE_DISTRICTS.slice(0, 5).map((district, index) => {
                    const quickMapLocation = getDistrictQuickMapLocation(district.id);
                    if (!quickMapLocation || quickMapLocation.status === "UNMAPPED") return null;
                    return (
                      <span
                        key={district.id}
                        className={`mocc__region-dot mocc__region-dot--${DISTRICT_MARKER_THEMES[index]}`}
                        style={{ left: `${quickMapLocation.x}%`, top: `${quickMapLocation.y}%` }}
                        title={district.fullLabel || district.label}
                      />
                    );
                  })}
                  {quickMapOverlayEntities.map((entity) => (
                    <span
                      key={entity.entity_id}
                      className={`mocc__quick-context-marker mocc__quick-context-marker--${entity.overlay_id}`}
                      style={{ left: `${entity.spatial_reference.position.x}%`, top: `${entity.spatial_reference.position.y}%` }}
                      title={`${entity.label} · provisional map context · ${entity.source_reference}`}
                      aria-label={`${entity.label}; provisional canonical Quick Map context`}
                    />
                  ))}
                </div>
              </div>
              <div className="mocc__quick-map-authority" aria-hidden="true">
                <MetaverseMiniMap
                  presentation="operations"
                  currentDistrictId={null}
                  youAreHereDistrictId={null}
                  pulses={pulses}
                  destinations={[]}
                  onTravel={() => {}}
                  districts={METAVERSE_DISTRICTS}
                  presenceCounts={[]}
                  events={sourceCityEvents}
                  opportunityCountsByDistrict={{}}
                  civicActive={Boolean(orchestration?.civic_state)}
                  activeRoomParticipants={null}
                  reducedMotion={false}
                  onSelectDistrict={() => {}}
                />
              </div>
            </div>
          </div>
          {error ? <div className="mocc__source-warning">Orchestration source unavailable: {error}</div> : null}
        </section>

        <aside className="mocc__right">
          <div className="mocc__panel-heading">
            <span>LIVE OPERATIONS</span>
            <small>{loading ? "Connecting" : error ? "Source degraded" : "Live Data"}</small>
          </div>
          <div className="mocc__metric-grid">
            <div><strong>{projectionReady ? projectedEvents.length : "—"}</strong><span>City Events</span></div>
            <div><strong>{projectionReady ? pulses.length : "—"}</strong><span>District Pulses</span></div>
            <div><strong>{projectionReady ? briefingItems.length : "—"}</strong><span>Briefing Items</span></div>
            <div><strong>{systemHealth === "READ" ? "READ" : "—"}</strong><span>System Health</span></div>
          </div>
          <section className="mocc__right-section">
            <div className="mocc__right-heading"><h3>ACTIVE EVENTS</h3><span>{projectedEvents.length ? `View All (${projectedEvents.length})` : "No source data"}</span></div>
            <div className="mocc__event-list">
              {projectedEvents.length === 0 ? (
                <p className="mocc__empty">{loading ? "Loading event sources." : error ? "Event source unavailable." : "No source events are currently available."}</p>
              ) : (
                projectedEvents.slice(0, 5).map((event, index) => (
                  <article key={event.event_id || event.source_event_ref || index} className="mocc__event" title={`${event.event_type || "Event"} · ${event.source_authority || "Authority unavailable"}`}>
                    <span className="mocc__event-icon">{index + 1}</span>
                    <strong>{event.title || event.event_type || "Event type unavailable"}</strong>
                    <em>{[event.source_authority, event.location?.district_id || event.location?.facility_id, formatEventTimestamp(event.timestamp)].filter(Boolean).join(" · ")}</em>
                    <small>{[event.severity, event.state].filter(Boolean).join(" · ") || "—"}</small>
                  </article>
                ))
              )}
            </div>
          </section>
          <section className="mocc__right-section">
            <div className="mocc__right-heading"><h3>CITY STATUS</h3><span>{loading ? "Syncing" : "As available"}</span></div>
            <div className="mocc__status-list">
              {[
                ["Population (Live)", "—", "Unavailable"],
                ["Active Vehicles", "—", "Operational feed pending"],
                ["Traffic State", "—", "Traffic foundation available"],
                ["Fire / EMS Incidents", "—", "Pending integration"],
                ["Students Online", "—", "Unavailable"],
                ["Active Missions", "—", "No source data"],
                ["System Health", error ? "Degraded" : "Read", error ? "Source issue" : "Read-only"],
              ].map(([label, value, note]) => (
                <div key={label}><span>{label}</span><strong>{value}</strong><em>{note}</em></div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="mocc__timeline">
        <div className="mocc__timeline-head">
          <div><h2>OPERATIONS TIMELINE</h2><p>Unified city events, missions, and system activity</p></div>
          <div className="mocc__timeline-controls">
            <div className="mocc__timeline-legend" aria-label="Filter timeline categories">
              {MOCC_TIMELINE_CATEGORIES.map(({ id, label }) => (
                <button
                  type="button"
                  key={id}
                  className={`mocc__timeline-filter mocc__timeline-filter--${id}${timelineFilters[id] ? " is-active" : ""}`}
                  aria-pressed={timelineFilters[id]}
                  onClick={() => setTimelineFilters((filters) => ({ ...filters, [id]: !filters[id] }))}
                >{label}</button>
              ))}
            </div>
            <span className={`mocc__timeline-mode mocc__timeline-mode--${timelineMode.toLowerCase()}`} title={timelineLive ? "Window anchored to the current operational time; no continuous streaming is implied." : "Selected fixed time window; no replay is active."}>{timelineMode}</span>
            <button type="button" aria-label="Timeline window duration: 24 hours" title="24-hour window">24 Hours</button>
          </div>
        </div>
        <div className="mocc__timeline-track">
          <button type="button" onClick={goToNow}>Now</button>
          <button type="button" aria-label="Previous timeline window" onClick={() => moveTimelineWindow(-1)}>‹</button>
          <button type="button" aria-label="Next timeline window" onClick={() => moveTimelineWindow(1)}>›</button>
          <input
            type="date"
            className="mocc__timeline-date"
            aria-label="Select timeline window date"
            value={formatTimelineDate(new Date(timelineWindowEnd))}
            onChange={(event) => chooseTimelineDate(event.target.value)}
          />
          <div className="mocc__timeline-ruler" aria-label="Read-only operations timeline">
            {timelineEvents.map((event) => (
              <button
                type="button"
                key={event.timeline_key}
                className={`mocc__timeline-pulse mocc__timeline-pulse--${moccTimelineCategory(event)}`}
                style={{
                  left: `${event.timelinePosition}%`,
                  top: `${event.timelineLaneCount === 1 ? 12 : 3 + (event.timelineLane * 20) / (event.timelineLaneCount - 1)}px`,
                }}
                aria-pressed={selectedTimelineKey === event.timeline_key}
                onClick={() => setSelectedTimelineKey(event.timeline_key)}
                title={[event.label, event.source_authority, event.source_event_ref, event.state, event.severity].filter(Boolean).join(" · ")}
                aria-label={`${event.label}, ${event.timestamp}, ${event.source_authority || "source authority unavailable"}`}
              />
            ))}
          </div>
        </div>
        {selectedTimelineEvent ? (
          <aside className="mocc__timeline-detail" aria-label="Selected timeline event">
            <button type="button" className="mocc__timeline-detail-close" aria-label="Close event details" onClick={() => setSelectedTimelineKey(null)}>×</button>
            <h3>{selectedTimelineEvent.label}</h3>
            <dl>
              <div><dt>Type</dt><dd>{selectedTimelineEvent.event_type || "Unavailable"}</dd></div>
              <div><dt>Time</dt><dd>{formatEventTimestamp(selectedTimelineEvent.timestamp)}</dd></div>
              <div><dt>Category</dt><dd>{MOCC_TIMELINE_CATEGORIES.find(({ id }) => id === selectedTimelineEvent.category)?.label || "Other"}</dd></div>
              {selectedTimelineEvent.state ? <div><dt>State</dt><dd>{selectedTimelineEvent.state}</dd></div> : null}
              {selectedTimelineEvent.severity ? <div><dt>Severity</dt><dd>{selectedTimelineEvent.severity}</dd></div> : null}
              <div><dt>Source</dt><dd>{selectedTimelineEvent.source_authority || "Unavailable"}</dd></div>
              {selectedTimelineEvent.source_event_ref ? <div><dt>Reference</dt><dd>{selectedTimelineEvent.source_event_ref}</dd></div> : null}
              {selectedTimelineEvent.location ? <div><dt>Location</dt><dd>{[selectedTimelineEvent.location.district_id, selectedTimelineEvent.location.facility_id].filter(Boolean).join(" · ")}</dd></div> : null}
              {selectedTimelineEvent.mission_id ? <div><dt>Mission</dt><dd>{selectedTimelineEvent.mission_id}</dd></div> : null}
              {selectedTimelineEvent.scenario_id ? <div><dt>Scenario</dt><dd>{selectedTimelineEvent.scenario_id}</dd></div> : null}
            </dl>
          </aside>
        ) : null}
      </section>
      </>}
    </main>
  );
}

export default function MetaverseOperationsCommandCenter() {
  return (
    <AuthProvider>
      <PermissionGuard permissions={["operations.awareness.read"]}>
        <CommandCenterSurface />
      </PermissionGuard>
    </AuthProvider>
  );
}
