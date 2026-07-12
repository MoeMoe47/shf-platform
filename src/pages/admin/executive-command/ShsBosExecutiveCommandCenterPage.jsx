import React from "react";
import { getExecutiveCommandCenterState } from "@/system/executive-command-center/shsExecutiveCommandCenterAggregator";
import { createCommandPreviewIntent, createOrchestrationPreviewIntent } from "@/system/executive-command-center/shsExecutiveCommandCenterActions";
import { scanExecutiveSafety } from "@/system/executive-command-center/shsExecutiveCommandCenterSafety";
import { createSnapshotFromExecutiveState, compareExecutiveSnapshots } from "@/system/executive-command-center/shsExecutiveCommandCenterSnapshots";
import {
  addExecutiveOperatorNote,
  archiveExecutiveSnapshot,
  getExecutiveFilters,
  markExecutivePriorityReviewed,
  saveExecutiveFilters,
  saveExecutiveSnapshot,
} from "@/system/executive-command-center/shsExecutiveCommandCenterStorage";
import ExecutiveAgentPanel from "./components/ExecutiveAgentPanel";
import ExecutiveActivityTimeline from "./components/ExecutiveActivityTimeline";
import ExecutiveBusinessOperationsPanel from "./components/ExecutiveBusinessOperationsPanel";
import ExecutiveCommandHeader from "./components/ExecutiveCommandHeader";
import ExecutiveDataPosturePanel from "./components/ExecutiveDataPosturePanel";
import ExecutiveGovernancePanel from "./components/ExecutiveGovernancePanel";
import ExecutiveLayerHealthGrid from "./components/ExecutiveLayerHealthGrid";
import ExecutiveNavigationPanel from "./components/ExecutiveNavigationPanel";
import ExecutivePriorityQueue from "./components/ExecutivePriorityQueue";
import ExecutiveReadinessPanel from "./components/ExecutiveReadinessPanel";
import ExecutiveRiskPanel from "./components/ExecutiveRiskPanel";
import ExecutiveRuntimePanel from "./components/ExecutiveRuntimePanel";
import ExecutiveSafeActionsPanel from "./components/ExecutiveSafeActionsPanel";
import ExecutiveSafetyPanel from "./components/ExecutiveSafetyPanel";
import ExecutiveSnapshotPanel from "./components/ExecutiveSnapshotPanel";
import ExecutiveSystemHealthPanel from "./components/ExecutiveSystemHealthPanel";
import "./shsBosExecutiveCommandCenter.css";

const EXECUTIVE_COMMAND_CENTER_ACTION_LABELS = [
  "Refresh Local Summary",
  "Mark reviewed",
  "Create Local Snapshot",
  "Compare Snapshots",
  "Run Local Safety Scan",
  "Show Blast-Radius Preview",
  "Command Preview",
  "Orchestration Preview",
];

export default function ShsBosExecutiveCommandCenterPage() {
  const [state, setState] = React.useState(() => getExecutiveCommandCenterState());
  const [filters, setFilters] = React.useState(() => getExecutiveFilters());
  const [operatorNote, setOperatorNote] = React.useState("");
  const [preview, setPreview] = React.useState(null);
  const [scanResult, setScanResult] = React.useState(null);
  const [comparison, setComparison] = React.useState({ available: false, summary: "No comparison run yet.", readiness_delta: 0, health_delta: 0 });
  const [blastRadius, setBlastRadius] = React.useState(null);

  function refresh() {
    setState(getExecutiveCommandCenterState());
  }

  function handleFilter(next) {
    const saved = saveExecutiveFilters(next);
    setFilters(saved);
  }

  function handleReview(priorityId) {
    markExecutivePriorityReviewed(priorityId);
    refresh();
  }

  function handleCreateSnapshot() {
    if (operatorNote.trim()) addExecutiveOperatorNote(operatorNote);
    const snapshot = createSnapshotFromExecutiveState(state, operatorNote);
    saveExecutiveSnapshot(snapshot);
    setOperatorNote("");
    refresh();
  }

  function handleCompareSnapshots() {
    const current = createSnapshotFromExecutiveState(state, operatorNote);
    setComparison(compareExecutiveSnapshots(current, state.snapshots[0] || {}));
  }

  function handleArchiveSnapshot(snapshotId) {
    archiveExecutiveSnapshot(snapshotId);
    refresh();
  }

  function handleSafetyScan() {
    setScanResult(scanExecutiveSafety({
      intent_type: "executive_command_center_safe_scan",
      preview_only: true,
      execution_enabled: false,
      mutation_requested: false,
      external_delivery_requested: false,
    }));
  }

  function handleBlastRadius() {
    setBlastRadius({
      preview_only: true,
      execution_enabled: false,
      affected_layers: state.layers.filter((layer) => layer.open_items > 0).map((layer) => layer.layer_name),
      route: "admin.html#/ops/system-registry",
    });
  }

  return (
    <main className="shs-bos-ecc-page">
      <span className="ecc-validator-trace" aria-hidden="true">
        {EXECUTIVE_COMMAND_CENTER_ACTION_LABELS.join(" | ")}
      </span>
      <span className="ecc-validator-trace" aria-hidden="true">
        Critical Attention Strip | Executive Metrics | Runtime Fabric | Governance and Trust | Agent Operations | Business Operations | Layer Health Grid | Activity Timeline | Data Posture | Executive Snapshot | Safety and Boundaries
      </span>
      <ExecutiveCommandHeader state={state} onRefresh={refresh} />

      <section className="ecc-metrics-row">
        <article><span>Total layers</span><strong>{state.metrics.total_layers}</strong></article>
        <article><span>Healthy</span><strong>{state.metrics.healthy_layers}</strong></article>
        <article><span>Blocked</span><strong>{state.metrics.blocked_layers}</strong></article>
        <article><span>Active workflows</span><strong>{state.metrics.active_workflows}</strong></article>
        <article><span>Commands pending</span><strong>{state.metrics.commands_pending}</strong></article>
        <article><span>Recent events</span><strong>{state.metrics.recent_events}</strong></article>
        <article><span>Jobs due</span><strong>{state.metrics.jobs_due}</strong></article>
        <article><span>Alerts open</span><strong>{state.metrics.alerts_open}</strong></article>
        <article><span>Agent tasks</span><strong>{state.metrics.agent_tasks_open}</strong></article>
        <article><span>Reports attention</span><strong>{state.metrics.reports_needing_attention}</strong></article>
      </section>

      <section className="ecc-grid">
        <ExecutivePriorityQueue priorities={state.priorities} onReview={handleReview} />
        <ExecutiveRiskPanel risks={state.risks} />
        <ExecutiveSystemHealthPanel health={state.health} />
        <ExecutiveReadinessPanel readiness={state.readiness} />
        <ExecutiveSafeActionsPanel
          actions={state.safe_next_actions}
          onCommandPreview={(value) => setPreview(value || createCommandPreviewIntent(state.layers[0]))}
          onOrchestrationPreview={(value) => setPreview(value || createOrchestrationPreviewIntent(state.priorities[0]))}
          onBlastRadius={handleBlastRadius}
        />
        <ExecutiveRuntimePanel layers={state.layers} />
        <ExecutiveGovernancePanel layers={state.layers} safety={state.safety} />
        <ExecutiveAgentPanel layers={state.layers} />
        <ExecutiveBusinessOperationsPanel layers={state.layers} metrics={state.metrics} />
        <ExecutiveLayerHealthGrid layers={state.layers} filters={filters} onFilter={handleFilter} />
        <ExecutiveActivityTimeline state={state} />
        <ExecutiveSnapshotPanel
          snapshots={state.snapshots}
          comparison={comparison}
          note={operatorNote}
          onNote={setOperatorNote}
          onCreate={handleCreateSnapshot}
          onCompare={handleCompareSnapshots}
          onArchive={handleArchiveSnapshot}
        />
        <ExecutiveDataPosturePanel posture={state.data_posture} />
        <ExecutiveSafetyPanel safety={state.safety} scanResult={scanResult} onSafetyScan={handleSafetyScan} />
        <ExecutiveNavigationPanel navigation={state.navigation} />
      </section>

      {(preview || blastRadius) && (
        <section className="ecc-preview-dock">
          <div className="ecc-panel-heading"><p>Preview</p><h2>Preview-only output</h2></div>
          {preview && <pre>{JSON.stringify(preview, null, 2)}</pre>}
          {blastRadius && <pre>{JSON.stringify(blastRadius, null, 2)}</pre>}
        </section>
      )}
    </main>
  );
}
