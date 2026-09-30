import { defaultSpatialLayerRegistry } from "../../../shared/spatial/index.js";
import { getCommandCenterQualifiedClient } from "./qualifiedClientRegistry.js";

export const COMMAND_CENTER_QUALIFIED_LAYER_IDS = Object.freeze([
  "real-world.counties",
  "metaverse.quick-map.locations",
  "metaverse.regional-scenes",
]);

export const COMMAND_CENTER_LAYER_STATE_EVENTS = Object.freeze([
  "LAYER_VISIBILITY_CHANGED",
]);

const QUALIFIED_LAYER_IDS = new Set(COMMAND_CENTER_QUALIFIED_LAYER_IDS);

function freezeSnapshot({ workspaceId, coordinateSpace, visibleLayerIds }) {
  return Object.freeze({
    workspaceId,
    coordinateSpace,
    visibleLayerIds: Object.freeze([...visibleLayerIds]),
  });
}

function validateWorkspace(workspace) {
  const errors = [];
  const client = getCommandCenterQualifiedClient(workspace?.qualifiedClientId);
  if (!workspace || typeof workspace !== "object") {
    errors.push("workspace is required");
  } else if (!client || client.active !== true || client.spatialQualified !== true) {
    errors.push(`unqualified Command Center client: ${workspace.qualifiedClientId}`);
  } else {
    if (workspace.coordinateFamily !== client.coordinateFamily) {
      errors.push(`coordinateFamily does not match qualified client: ${workspace.workspaceId}`);
    }
    if (workspace.coordinateSpace !== client.coordinateSpace) {
      errors.push(`coordinateSpace does not match qualified client: ${workspace.workspaceId}`);
    }
  }
  return { client, errors };
}

function validateLayerForWorkspace(layerId, coordinateSpace) {
  if (!QUALIFIED_LAYER_IDS.has(layerId)) {
    return Object.freeze({ ok: false, errors: Object.freeze([`unknown or unqualified Command Center layer: ${layerId}`]) });
  }
  const result = defaultSpatialLayerRegistry.get(layerId);
  if (!result.ok) {
    return Object.freeze({ ok: false, errors: Object.freeze(result.errors || [`unknown spatial layer: ${layerId}`]) });
  }
  if (!result.layer.supportedCoordinateSpaces.includes(coordinateSpace)) {
    return Object.freeze({ ok: false, errors: Object.freeze([`layer ${layerId} is incompatible with ${coordinateSpace}`]) });
  }
  return Object.freeze({ ok: true, layer: result.layer });
}

export function createCommandCenterLayerState({ workspace, visibleLayerIds = [] } = {}) {
  const workspaceValidation = validateWorkspace(workspace);
  const visibleLayers = new Set();
  const errors = [...workspaceValidation.errors];

  if (!errors.length) {
    for (const layerId of visibleLayerIds) {
      const validation = validateLayerForWorkspace(layerId, workspace.coordinateSpace);
      if (validation.ok) visibleLayers.add(layerId);
      else errors.push(...validation.errors);
    }
  }

  if (errors.length) {
    return Object.freeze({
      ok: false,
      errors: Object.freeze(errors),
      snapshot: null,
    });
  }

  function snapshot() {
    return freezeSnapshot({
      workspaceId: workspace.workspaceId,
      coordinateSpace: workspace.coordinateSpace,
      visibleLayerIds: visibleLayers,
    });
  }

  return Object.freeze({
    ok: true,
    get snapshot() {
      return snapshot();
    },
    setLayerVisibility(layerId, visible) {
      const validation = validateLayerForWorkspace(layerId, workspace.coordinateSpace);
      if (!validation.ok) {
        return Object.freeze({
          ok: false,
          errors: validation.errors,
          snapshot: snapshot(),
        });
      }
      if (visible === true) visibleLayers.add(layerId);
      else visibleLayers.delete(layerId);
      return Object.freeze({
        ok: true,
        event: "LAYER_VISIBILITY_CHANGED",
        snapshot: snapshot(),
      });
    },
  });
}
