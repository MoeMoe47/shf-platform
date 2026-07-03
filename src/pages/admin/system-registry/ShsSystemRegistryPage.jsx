import React from "react";
import { SYSTEM_REGISTRY_CATEGORIES, SYSTEM_REGISTRY_RELEASE_STATUSES } from "@/system/system-registry/shsSystemRegistryTypes";
import { SHS_SYSTEM_REGISTRY_ENTRIES } from "@/system/system-registry/shsSystemRegistryEntries";
import { calculateSystemRegistryMetrics } from "@/system/system-registry/shsSystemRegistryMetrics";
import { calculateRegistrySystemReadiness } from "@/system/system-registry/shsSystemRegistryReadiness";
import { getBlastRadius } from "@/system/system-registry/shsSystemBlastRadius";
import { getDependencies, getDependents } from "@/system/system-registry/shsSystemDependencyGraph";
import { scanDeclaredSystemRegistry, getValidatorMatrix } from "@/system/system-registry/shsSystemRegistryScanner";
import { markSystemRegistryReviewNote, exportSystemRegistrySummary } from "@/system/system-registry/shsSystemRegistryStorage";
import { SHS_SYSTEM_ARCHITECTURE_TIMELINE } from "@/system/system-registry/shsSystemArchitectureTimeline";
import SystemRegistryOverviewPanel from "./components/SystemRegistryOverviewPanel";
import SystemLayerList from "./components/SystemLayerList";
import SystemLayerDetail from "./components/SystemLayerDetail";
import SystemDependencyGraphPanel from "./components/SystemDependencyGraphPanel";
import SystemBlastRadiusPanel from "./components/SystemBlastRadiusPanel";
import SystemReadinessPanel from "./components/SystemReadinessPanel";
import SystemRegistrySafetyPanel from "./components/SystemRegistrySafetyPanel";
import SystemValidatorMatrix from "./components/SystemValidatorMatrix";
import SystemLifecyclePanel from "./components/SystemLifecyclePanel";
import SystemArchitectureTimeline from "./components/SystemArchitectureTimeline";
import "./shsSystemRegistry.css";

export default function ShsSystemRegistryPage() {
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [releaseFilter, setReleaseFilter] = React.useState("");
  const [selectedLayerId, setSelectedLayerId] = React.useState("system_registry_dependency_intelligence");
  const [safetyResult, setSafetyResult] = React.useState(() => scanDeclaredSystemRegistry());
  const [blastRadius, setBlastRadius] = React.useState(() => getBlastRadius(selectedLayerId));
  const [reviewNote, setReviewNote] = React.useState("");
  const [exportStatus, setExportStatus] = React.useState("");

  const filteredLayers = React.useMemo(() => SHS_SYSTEM_REGISTRY_ENTRIES.filter((layer) => {
    if (categoryFilter && layer.category !== categoryFilter) return false;
    if (releaseFilter && layer.release_status !== releaseFilter) return false;
    return true;
  }), [categoryFilter, releaseFilter]);

  React.useEffect(() => {
    if (!filteredLayers.find((layer) => layer.layer_id === selectedLayerId)) {
      setSelectedLayerId(filteredLayers[0]?.layer_id || "system_registry_dependency_intelligence");
    }
  }, [filteredLayers, selectedLayerId]);

  const selectedLayer = SHS_SYSTEM_REGISTRY_ENTRIES.find((layer) => layer.layer_id === selectedLayerId) || filteredLayers[0];
  const metrics = React.useMemo(() => calculateSystemRegistryMetrics(SHS_SYSTEM_REGISTRY_ENTRIES), []);
  const readiness = React.useMemo(() => calculateRegistrySystemReadiness(SHS_SYSTEM_REGISTRY_ENTRIES), []);
  const dependencies = React.useMemo(() => getDependencies(selectedLayer?.layer_id), [selectedLayer]);
  const dependents = React.useMemo(() => getDependents(selectedLayer?.layer_id), [selectedLayer]);
  const validatorMatrix = React.useMemo(() => getValidatorMatrix(SHS_SYSTEM_REGISTRY_ENTRIES), []);

  function handleSafetyScan() {
    setSafetyResult(scanDeclaredSystemRegistry());
  }

  function handleBlastRadiusPreview() {
    setBlastRadius(getBlastRadius(selectedLayer.layer_id));
  }

  function handleReviewNote() {
    markSystemRegistryReviewNote(selectedLayer.layer_id, reviewNote || "Local owner review note recorded.");
    setReviewNote("");
  }

  function handleExportSummary() {
    const record = exportSystemRegistrySummary({
      total_layers: metrics.total_layers,
      system_readiness_score: readiness.score,
      selected_layer: selectedLayer.layer_id,
      safety_issue_count: safetyResult.issue_count,
    });
    setExportStatus(`Local export: ${record.export_id}`);
  }

  return (
    <main className="shs-system-registry-page">
      <section className="system-registry-hero">
        <div>
          <p>SHS System Registry & Dependency Intelligence V1</p>
          <h1>System Registry</h1>
          <span>Read-only architecture intelligence for SHS layers, dependencies, routes, validators, docs, health, lifecycle, timeline, and blast radius.</span>
        </div>
        <div className="system-registry-actions">
          <button type="button" onClick={handleSafetyScan}>Run Local Registry Safety Scan</button>
          <button type="button" onClick={handleBlastRadiusPreview}>Generate Blast Radius Preview</button>
          <button type="button" onClick={handleExportSummary}>Export Local Registry Summary</button>
        </div>
      </section>

      <section className="system-registry-filters">
        <label>
          Category
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="">All categories</option>
            {SYSTEM_REGISTRY_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label>
          Release status
          <select value={releaseFilter} onChange={(event) => setReleaseFilter(event.target.value)}>
            <option value="">All release statuses</option>
            {SYSTEM_REGISTRY_RELEASE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label>
          Local review note
          <input value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Add note for selected layer" />
        </label>
        <button type="button" onClick={handleReviewNote}>Mark Local Review Note</button>
      </section>

      {exportStatus && <p className="system-registry-export-status">{exportStatus}</p>}

      <section className="system-registry-grid">
        <SystemRegistryOverviewPanel metrics={metrics} readiness={readiness} />
        <SystemReadinessPanel readiness={readiness} />
        <SystemLayerList layers={filteredLayers} selectedLayerId={selectedLayer?.layer_id} onSelectLayer={setSelectedLayerId} />
        <SystemLayerDetail layer={selectedLayer} />
        <SystemDependencyGraphPanel layer={selectedLayer} dependencies={dependencies} dependents={dependents} />
        <SystemBlastRadiusPanel blastRadius={blastRadius} />
        <SystemRegistrySafetyPanel safetyResult={safetyResult} />
        <SystemValidatorMatrix rows={validatorMatrix} />
        <SystemLifecyclePanel layers={SHS_SYSTEM_REGISTRY_ENTRIES} />
        <SystemArchitectureTimeline timeline={SHS_SYSTEM_ARCHITECTURE_TIMELINE} />
      </section>
    </main>
  );
}

