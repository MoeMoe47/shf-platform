import { listLayers } from "./shsSystemDependencyGraph";

export function getLayerHealth(layerId) {
  return listLayers().find((layer) => layer.layer_id === layerId)?.health || null;
}

export function listLayerHealth() {
  return listLayers().map((layer) => ({
    layer_id: layer.layer_id,
    name: layer.name,
    health: layer.health,
    readiness_score: layer.readiness_score,
  }));
}

