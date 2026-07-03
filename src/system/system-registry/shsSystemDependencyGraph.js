import { SHS_SYSTEM_REGISTRY_ENTRIES } from "./shsSystemRegistryEntries";

export function listLayers() {
  return SHS_SYSTEM_REGISTRY_ENTRIES;
}

export function getLayerById(layerId) {
  return listLayers().find((layer) => layer.layer_id === layerId) || null;
}

export function listByCategory(category) {
  if (!category) return listLayers();
  return listLayers().filter((layer) => layer.category === category);
}

export function listByReleaseStatus(status) {
  if (!status) return listLayers();
  return listLayers().filter((layer) => layer.release_status === status);
}

export function getDependencies(layerId) {
  const layer = getLayerById(layerId);
  return (layer?.dependencies || []).map(getLayerById).filter(Boolean);
}

export function getDependents(layerId) {
  const declared = getLayerById(layerId)?.dependents || [];
  const inferred = listLayers()
    .filter((layer) => (layer.dependencies || []).includes(layerId))
    .map((layer) => layer.layer_id);
  return Array.from(new Set([...declared, ...inferred])).map(getLayerById).filter(Boolean);
}

function walk(layerId, nextFn, seen = new Set()) {
  nextFn(layerId).forEach((layer) => {
    if (!layer || seen.has(layer.layer_id)) return;
    seen.add(layer.layer_id);
    walk(layer.layer_id, nextFn, seen);
  });
  return Array.from(seen).map(getLayerById).filter(Boolean);
}

export function getTransitiveDependencies(layerId) {
  return walk(layerId, getDependencies);
}

export function getTransitiveDependents(layerId) {
  return walk(layerId, getDependents);
}

export function detectCircularDependencies() {
  const cycles = [];
  listLayers().forEach((layer) => {
    const transitive = getTransitiveDependencies(layer.layer_id).map((item) => item.layer_id);
    if (transitive.includes(layer.layer_id)) cycles.push(layer.layer_id);
  });
  return cycles;
}

export function detectMissingDependencies() {
  const ids = new Set(listLayers().map((layer) => layer.layer_id));
  return listLayers().flatMap((layer) =>
    (layer.dependencies || [])
      .filter((dependency) => !ids.has(dependency))
      .map((dependency) => ({ layer_id: layer.layer_id, dependency }))
  );
}

export function detectMissingDocs() {
  return listLayers().filter((layer) => !layer.docs?.length);
}

export function detectMissingValidators() {
  return listLayers().filter((layer) => layer.source_files?.length && !layer.validators?.length);
}

export function calculateLayerReadiness(layerId) {
  return getLayerById(layerId)?.readiness_score || 0;
}

export function calculateSystemReadiness() {
  const weighted = listLayers().flatMap((layer) => {
    const critical = ["governance", "truth", "security", "persistence", "tracking", "orchestrator", "registry"].includes(layer.category);
    return critical ? [layer.readiness_score, layer.readiness_score] : [layer.readiness_score];
  });
  const total = weighted.reduce((sum, score) => sum + score, 0);
  return Math.round(total / Math.max(1, weighted.length));
}

