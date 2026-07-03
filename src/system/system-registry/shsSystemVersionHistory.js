import { getLayerById, listLayers } from "./shsSystemDependencyGraph";

export function getVersionHistory(layerId) {
  return getLayerById(layerId)?.version_history || [];
}

export function listVersionHistory() {
  return listLayers().map((layer) => ({
    layer_id: layer.layer_id,
    name: layer.name,
    current_version: layer.current_version,
    version_history: layer.version_history || [],
    release_commit: layer.release_commit,
    release_tag: layer.release_tag,
    release_date: layer.release_date,
  }));
}

