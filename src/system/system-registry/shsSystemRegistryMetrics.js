import { listLayers } from "./shsSystemDependencyGraph";

export function calculateSystemRegistryMetrics(layers = listLayers()) {
  const byCategory = {};
  const byReleaseStatus = {};
  const byLifecycleStatus = {};
  layers.forEach((layer) => {
    byCategory[layer.category] = (byCategory[layer.category] || 0) + 1;
    byReleaseStatus[layer.release_status] = (byReleaseStatus[layer.release_status] || 0) + 1;
    byLifecycleStatus[layer.lifecycle_status] = (byLifecycleStatus[layer.lifecycle_status] || 0) + 1;
  });
  return {
    total_layers: layers.length,
    by_category: byCategory,
    by_release_status: byReleaseStatus,
    by_lifecycle_status: byLifecycleStatus,
    average_health: Math.round(layers.reduce((sum, layer) => sum + (layer.health?.overall || 0), 0) / Math.max(1, layers.length)),
    validators_declared: layers.reduce((sum, layer) => sum + (layer.validators?.length || 0), 0),
    routes_declared: layers.filter((layer) => layer.admin_route || layer.public_route).length,
  };
}

