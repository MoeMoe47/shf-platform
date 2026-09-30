import { getCommandCenterQualifiedClient } from "./qualifiedClientRegistry.js";

export const COMMAND_CENTER_WORKSPACE_STATE_ALLOWED_FIELDS = Object.freeze([
  "workspaceId",
  "qualifiedClientId",
  "coordinateFamily",
  "coordinateSpace",
  "active",
  "visibleLayerIds",
  "selectedFeatureId",
  "highlightedFeatureIds",
  "panelState",
  "status",
]);

export const COMMAND_CENTER_WORKSPACE_STATUS = Object.freeze({
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
  UNQUALIFIED: "UNQUALIFIED",
});

export const COMMAND_CENTER_WORKSPACE_EVENTS = Object.freeze([
  "WORKSPACE_ACTIVATED",
]);

function immutableStringList(values = []) {
  return Object.freeze([...new Set(values.filter((value) => typeof value === "string" && value.length > 0))]);
}

function immutablePanelState(panelState) {
  if (!panelState || typeof panelState !== "object" || Array.isArray(panelState)) return null;
  return Object.freeze({ ...panelState });
}

function validateWorkspaceInput(workspace) {
  const errors = [];
  if (!workspace || typeof workspace !== "object") {
    return { errors: ["workspace is required"] };
  }
  if (typeof workspace.workspaceId !== "string" || !workspace.workspaceId) errors.push("workspaceId is required");

  const client = getCommandCenterQualifiedClient(workspace.qualifiedClientId);
  if (!client || client.active !== true || client.spatialQualified !== true) {
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

function createWorkspaceRecord(workspace, activeWorkspaceId) {
  return Object.freeze({
    workspaceId: workspace.workspaceId,
    qualifiedClientId: workspace.qualifiedClientId,
    coordinateFamily: workspace.coordinateFamily,
    coordinateSpace: workspace.coordinateSpace,
    active: workspace.workspaceId === activeWorkspaceId,
    visibleLayerIds: immutableStringList(workspace.visibleLayerIds),
    selectedFeatureId: typeof workspace.selectedFeatureId === "string" ? workspace.selectedFeatureId : null,
    highlightedFeatureIds: immutableStringList(workspace.highlightedFeatureIds),
    panelState: immutablePanelState(workspace.panelState),
    status: COMMAND_CENTER_WORKSPACE_STATUS.AVAILABLE,
  });
}

function freezeSnapshot(workspaces, activeWorkspaceId) {
  const frozenWorkspaces = Object.freeze(workspaces.map((workspace) => createWorkspaceRecord(workspace, activeWorkspaceId)));
  return Object.freeze({
    activeWorkspaceId,
    workspaces: frozenWorkspaces,
  });
}

export function createCommandCenterWorkspaceState({ workspaces = [], activeWorkspaceId = null } = {}) {
  const errors = [];
  const seenWorkspaceIds = new Set();

  for (const workspace of workspaces) {
    const validation = validateWorkspaceInput(workspace);
    errors.push(...validation.errors);
    if (seenWorkspaceIds.has(workspace?.workspaceId)) {
      errors.push(`duplicate workspaceId: ${workspace.workspaceId}`);
    }
    if (workspace?.workspaceId) seenWorkspaceIds.add(workspace.workspaceId);
  }

  const resolvedActiveWorkspaceId = activeWorkspaceId || workspaces[0]?.workspaceId || null;
  if (resolvedActiveWorkspaceId && !seenWorkspaceIds.has(resolvedActiveWorkspaceId)) {
    errors.push(`unknown active workspace: ${resolvedActiveWorkspaceId}`);
  }

  if (errors.length) {
    return Object.freeze({
      ok: false,
      errors: Object.freeze(errors),
    });
  }

  let currentActiveWorkspaceId = resolvedActiveWorkspaceId;

  function snapshot() {
    return freezeSnapshot(workspaces, currentActiveWorkspaceId);
  }

  return Object.freeze({
    ok: true,
    get activeWorkspaceId() {
      return currentActiveWorkspaceId;
    },
    get workspaces() {
      return snapshot().workspaces;
    },
    snapshot,
    activateWorkspace(workspaceId) {
      if (!seenWorkspaceIds.has(workspaceId)) {
        return Object.freeze({
          ok: false,
          errors: Object.freeze([`unknown workspace: ${workspaceId}`]),
          snapshot: snapshot(),
        });
      }
      currentActiveWorkspaceId = workspaceId;
      return Object.freeze({
        ok: true,
        event: "WORKSPACE_ACTIVATED",
        snapshot: snapshot(),
      });
    },
  });
}
