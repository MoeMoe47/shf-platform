import {
  PUBLICATION_ELIGIBILITY_LEVELS,
  defaultCoordinateSpaceRegistry,
  defaultSpatialLayerRegistry,
  isPublicProjectionEligible,
  validateSpatialSelection,
} from "../../shared/spatial/index.js";

const SELECTION_LIFECYCLE = Object.freeze({
  NONE: "NONE",
  SELECTED: "SELECTED",
  UPDATED: "UPDATED",
  CLEARED: "CLEARED",
});

function freezeSelection(selection) {
  return Object.freeze({
    ...selection,
    eligibleActions: Object.freeze([...(selection.eligibleActions || [])]),
  });
}

function createFeatureMap(features = []) {
  return new Map(features.map((feature) => [feature.featureId, feature]));
}

function isNotPublished(feature) {
  return (
    feature?.publicationState === PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED ||
    feature?.publicEligibility?.publicationState === PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED ||
    feature?.publicEligibility?.level === PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED
  );
}

function selectionMatchesFeature(selection, feature) {
  const errors = [];
  for (const field of ["domain", "sourceAuthority", "coordinateFamily", "coordinateSpaceId", "layerId"]) {
    if (selection[field] !== feature[field]) errors.push(`${field} does not match selected feature`);
  }
  return errors;
}

export function createSpatialSelectionStore({
  features = [],
  coordinateRegistry = defaultCoordinateSpaceRegistry,
  layerRegistry = defaultSpatialLayerRegistry,
  allowNotPublishedSelection = false,
} = {}) {
  let featureMap = createFeatureMap(features);
  let currentSelection = null;
  let lifecycle = SELECTION_LIFECYCLE.NONE;
  const subscribers = [];

  function validateSelectionCandidate(selection) {
    const validation = validateSpatialSelection(selection, { coordinateRegistry, layerRegistry });
    const errors = [...validation.errors];
    const feature = featureMap.get(selection?.featureId);

    if (!feature) {
      errors.push(`unknown feature: ${selection?.featureId}`);
    } else {
      errors.push(...selectionMatchesFeature(selection, feature));
      if (!allowNotPublishedSelection && isNotPublished(feature)) {
        errors.push(`feature is not published: ${feature.featureId}`);
      }
    }

    return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), feature });
  }

  function notify(event) {
    const failures = [];
    for (const subscriber of [...subscribers]) {
      try {
        subscriber.handler(event);
      } catch (error) {
        failures.push(error);
      }
    }
    return Object.freeze({ failures: Object.freeze(failures) });
  }

  function setSelection(selection, nextLifecycle) {
    const validation = validateSelectionCandidate(selection);
    if (!validation.valid) {
      return Object.freeze({ ok: false, errors: validation.errors, lifecycle, selection: currentSelection });
    }
    currentSelection = freezeSelection(selection);
    lifecycle = nextLifecycle;
    const notification = notify({ type: lifecycle, selection: currentSelection });
    return Object.freeze({
      ok: notification.failures.length === 0,
      errors: Object.freeze([]),
      failures: notification.failures,
      lifecycle,
      selection: currentSelection,
    });
  }

  return Object.freeze({
    getSelection() {
      return currentSelection;
    },
    getLifecycle() {
      return lifecycle;
    },
    getFeature(featureId) {
      return featureMap.get(featureId) || null;
    },
    listFeatures() {
      return Object.freeze([...featureMap.values()]);
    },
    replaceFeatures(nextFeatures = []) {
      featureMap = createFeatureMap(nextFeatures);
      return this.handleStaleSelection("feature-catalog-replaced");
    },
    select(selection) {
      return setSelection(selection, SELECTION_LIFECYCLE.SELECTED);
    },
    updateSelection(selection) {
      return setSelection(selection, SELECTION_LIFECYCLE.UPDATED);
    },
    clearSelection(reason = "clear") {
      currentSelection = null;
      lifecycle = SELECTION_LIFECYCLE.CLEARED;
      const notification = notify({ type: SELECTION_LIFECYCLE.CLEARED, reason });
      return Object.freeze({ ok: notification.failures.length === 0, failures: notification.failures, lifecycle, selection: null, reason });
    },
    subscribe(handler) {
      if (typeof handler !== "function") throw new Error("selection subscriber must be a function");
      const subscription = Object.freeze({ handler });
      subscribers.push(subscription);
      return subscription;
    },
    unsubscribe(subscriptionOrHandler) {
      const index = subscribers.findIndex((subscriber) => subscriber === subscriptionOrHandler || subscriber.handler === subscriptionOrHandler);
      if (index === -1) return false;
      subscribers.splice(index, 1);
      return true;
    },
    handleStaleSelection(reason = "stale-selection") {
      if (!currentSelection) return Object.freeze({ ok: true, lifecycle, selection: null, reason: "none" });
      const validation = validateSelectionCandidate(currentSelection);
      if (validation.valid && !isNotPublished(validation.feature)) {
        return Object.freeze({ ok: true, lifecycle, selection: currentSelection, reason: "still-valid" });
      }
      return this.clearSelection(reason);
    },
    isCurrentSelectionPubliclyEligible() {
      if (!currentSelection) return false;
      const feature = featureMap.get(currentSelection.featureId);
      return Boolean(feature && isPublicProjectionEligible(feature.publicEligibility));
    },
  });
}

export { SELECTION_LIFECYCLE };
