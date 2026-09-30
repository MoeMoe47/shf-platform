import { getCommandCenterQualifiedClient } from "./qualifiedClientRegistry.js";

export const COMMAND_CENTER_PRESENTATION_EVENTS = Object.freeze([
  "SELECTION_CHANGED",
  "SELECTION_CLEARED",
  "HIGHLIGHT_CHANGED",
]);

export const COMMAND_CENTER_PROHIBITED_STATE_EXPORTS = Object.freeze([
  "authorize",
  "approve",
  "publish",
  "navigate",
  "changeScene",
  "dispatch",
  "routeTraffic",
  "routeWater",
  "routeTransit",
  "transformCoordinates",
  "convertCoordinateSpace",
  "assignJurisdiction",
  "assignServiceArea",
  "determineEligibility",
  "mutateDomainRecord",
  "establishMetricTruth",
]);

const UNSAFE_PUBLICATION_STATES = new Set([
  "HIDDEN",
  "RESTRICTED",
  "SUPPRESSED",
  "NOT_PUBLISHED",
  "INVALID",
]);

function isUnsafeFeature(feature) {
  return (
    UNSAFE_PUBLICATION_STATES.has(feature?.publicationState) ||
    UNSAFE_PUBLICATION_STATES.has(feature?.publicEligibility?.level) ||
    UNSAFE_PUBLICATION_STATES.has(feature?.publicEligibility?.publicationState)
  );
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

function freezeSelectionReference(selection) {
  if (!selection) return null;
  return Object.freeze({
    workspaceId: selection.workspaceId,
    featureId: selection.featureId,
    layerId: selection.layerId,
    coordinateSpace: selection.coordinateSpace,
  });
}

function freezeSnapshot({ activeSelection, highlightedFeatureIds }) {
  return Object.freeze({
    activeSelection: freezeSelectionReference(activeSelection),
    highlightedFeatureIds: Object.freeze([...highlightedFeatureIds]),
  });
}

function createFeatureMap(features = []) {
  return new Map(features.map((feature) => [feature.featureId, feature]));
}

export function createCommandCenterSelectionCoordinator({ workspaces = [] } = {}) {
  const workspaceMap = new Map();
  const featureMapsByWorkspace = new Map();
  const errors = [];

  for (const workspace of workspaces) {
    const validation = validateWorkspace(workspace);
    errors.push(...validation.errors);
    if (workspaceMap.has(workspace?.workspaceId)) errors.push(`duplicate workspaceId: ${workspace.workspaceId}`);
    if (!validation.errors.length) {
      workspaceMap.set(workspace.workspaceId, Object.freeze({
        workspaceId: workspace.workspaceId,
        qualifiedClientId: workspace.qualifiedClientId,
        coordinateFamily: workspace.coordinateFamily,
        coordinateSpace: workspace.coordinateSpace,
      }));
      featureMapsByWorkspace.set(workspace.workspaceId, createFeatureMap(workspace.features));
    }
  }

  let activeSelection = null;
  let highlightedFeatureIds = Object.freeze([]);

  function snapshot() {
    return freezeSnapshot({ activeSelection, highlightedFeatureIds });
  }

  function invalid(errorsForResult) {
    return Object.freeze({
      ok: false,
      errors: Object.freeze(errorsForResult),
      snapshot: snapshot(),
    });
  }

  function validateFeatureReference({ workspaceId, featureId, layerId, coordinateFamily, coordinateSpace }) {
    const workspace = workspaceMap.get(workspaceId);
    if (!workspace) return { errors: [`unknown workspace: ${workspaceId}`] };

    const feature = featureMapsByWorkspace.get(workspaceId)?.get(featureId);
    const validationErrors = [];
    if (!feature) validationErrors.push(`unknown feature: ${featureId}`);
    if (coordinateFamily !== workspace.coordinateFamily) validationErrors.push("coordinateFamily does not match workspace");
    if (coordinateSpace !== workspace.coordinateSpace) validationErrors.push("coordinateSpace does not match workspace");
    if (feature) {
      if (feature.coordinateFamily !== workspace.coordinateFamily) validationErrors.push("feature coordinateFamily does not match workspace");
      if (feature.coordinateSpaceId !== workspace.coordinateSpace) validationErrors.push("feature coordinateSpace does not match workspace");
      if (feature.layerId !== layerId) validationErrors.push("layerId does not match feature");
      if (isUnsafeFeature(feature)) validationErrors.push("feature is not selectable in Command Center presentation state");
    }
    return { workspace, feature, errors: validationErrors };
  }

  if (errors.length) {
    return Object.freeze({
      ok: false,
      errors: Object.freeze(errors),
      snapshot,
    });
  }

  return Object.freeze({
    ok: true,
    snapshot,
    selectFeature(selection) {
      const validation = validateFeatureReference(selection || {});
      if (validation.errors.length) return invalid(validation.errors);

      activeSelection = Object.freeze({
        workspaceId: validation.workspace.workspaceId,
        featureId: validation.feature.featureId,
        layerId: validation.feature.layerId,
        coordinateSpace: validation.workspace.coordinateSpace,
      });
      return Object.freeze({
        ok: true,
        event: "SELECTION_CHANGED",
        snapshot: snapshot(),
      });
    },
    clearSelection(reason = "clear") {
      activeSelection = null;
      return Object.freeze({
        ok: true,
        event: "SELECTION_CLEARED",
        reason,
        snapshot: snapshot(),
      });
    },
    highlightFeatures({ workspaceId, featureIds = [], source = "presentation" } = {}) {
      const workspace = workspaceMap.get(workspaceId);
      if (!workspace) return invalid([`unknown workspace: ${workspaceId}`]);

      const featureMap = featureMapsByWorkspace.get(workspaceId);
      const nextHighlights = [];
      const validationErrors = [];
      for (const featureId of featureIds) {
        const feature = featureMap.get(featureId);
        if (!feature) {
          validationErrors.push(`unknown feature: ${featureId}`);
        } else if (feature.coordinateSpaceId !== workspace.coordinateSpace || isUnsafeFeature(feature)) {
          validationErrors.push(`feature cannot be highlighted: ${featureId}`);
        } else {
          nextHighlights.push(featureId);
        }
      }
      if (validationErrors.length) return invalid(validationErrors);

      highlightedFeatureIds = Object.freeze([...new Set(nextHighlights)]);
      return Object.freeze({
        ok: true,
        event: "HIGHLIGHT_CHANGED",
        source,
        snapshot: snapshot(),
      });
    },
    clearHighlights(reason = "clear") {
      highlightedFeatureIds = Object.freeze([]);
      return Object.freeze({
        ok: true,
        event: "HIGHLIGHT_CHANGED",
        reason,
        snapshot: snapshot(),
      });
    },
  });
}
