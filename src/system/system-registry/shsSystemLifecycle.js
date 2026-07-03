import { listLayers } from "./shsSystemDependencyGraph";

export function listLifecycleStates(layers = listLayers()) {
  return layers.map((layer) => ({
    layer_id: layer.layer_id,
    name: layer.name,
    lifecycle_status: layer.lifecycle_status,
    release_status: layer.release_status,
    production_status: layer.production_status,
    current_version: layer.current_version,
  }));
}

