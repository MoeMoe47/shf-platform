import { SPATIAL_INTERACTION_TYPES, SPATIAL_INTERACTION_TYPE_VALUES, validateSpatialInteraction } from "../../shared/spatial/index.js";

const FEATURE_SCOPED_TYPES = Object.freeze([
  SPATIAL_INTERACTION_TYPES.SELECT,
  SPATIAL_INTERACTION_TYPES.FOCUS,
  SPATIAL_INTERACTION_TYPES.HIGHLIGHT,
  SPATIAL_INTERACTION_TYPES.OPEN_RECORD,
  SPATIAL_INTERACTION_TYPES.REQUEST_ROUTE,
  SPATIAL_INTERACTION_TYPES.FOLLOW_ROUTE,
  SPATIAL_INTERACTION_TYPES.INSPECT_EVIDENCE,
  SPATIAL_INTERACTION_TYPES.REQUEST_DOMAIN_ACTION,
]);

function canonicalType(event) {
  return event?.interactionType || event?.type;
}

function legacyValidationShape(event) {
  return {
    ...event,
    type: canonicalType(event),
    publisherId: event?.publisherId || event?.originClient,
  };
}

export function validateSpatialInteractionEvent(event) {
  const errors = [];
  const type = canonicalType(event);
  const baseValidation = validateSpatialInteraction(legacyValidationShape(event));
  errors.push(...baseValidation.errors);

  if (!SPATIAL_INTERACTION_TYPE_VALUES.includes(type)) errors.push("interactionType is invalid");
  for (const field of ["interactionId", "timestamp", "originClient", "originComponent", "domain", "sourceAuthority", "correlationId"]) {
    if (typeof event?.[field] !== "string" || event[field].trim().length === 0) errors.push(`${field} is required`);
  }
  if (!event?.provenance || typeof event.provenance !== "object") errors.push("provenance is required");

  if (FEATURE_SCOPED_TYPES.includes(type)) {
    for (const field of ["featureId", "layerId", "coordinateFamily", "coordinateSpaceId"]) {
      if (typeof event?.[field] !== "string" || event[field].trim().length === 0) errors.push(`${field} is required for ${type}`);
    }
  }

  if (type === SPATIAL_INTERACTION_TYPES.REQUEST_DOMAIN_ACTION) {
    if (!event?.requestedAction || typeof event.requestedAction !== "object") errors.push("requestedAction is required for REQUEST_DOMAIN_ACTION");
  }

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze([...new Set(errors)]) });
}

export function createSpatialInteractionBus() {
  const subscribersByType = new Map();
  const seenInteractionIds = new Set();

  function subscribe(type, handler) {
    if (!SPATIAL_INTERACTION_TYPE_VALUES.includes(type)) throw new Error(`unknown interaction type: ${type}`);
    if (typeof handler !== "function") throw new Error("interaction subscriber must be a function");
    if (!subscribersByType.has(type)) subscribersByType.set(type, []);
    const subscription = Object.freeze({ type, handler });
    subscribersByType.get(type).push(subscription);
    return subscription;
  }

  function unsubscribe(typeOrSubscription, maybeHandler) {
    const type = typeof typeOrSubscription === "string" ? typeOrSubscription : typeOrSubscription?.type;
    const subscribers = subscribersByType.get(type);
    if (!subscribers) return false;
    const index = subscribers.findIndex((subscriber) => subscriber === typeOrSubscription || subscriber.handler === maybeHandler);
    if (index === -1) return false;
    subscribers.splice(index, 1);
    return true;
  }

  function publish(event) {
    const type = canonicalType(event);
    const validation = validateSpatialInteractionEvent(event);
    if (!validation.valid) {
      return Object.freeze({ ok: false, errors: validation.errors, delivered: 0, failures: Object.freeze([]), correlationId: event?.correlationId });
    }
    if (seenInteractionIds.has(event.interactionId)) {
      return Object.freeze({
        ok: false,
        errors: Object.freeze([`duplicate interaction id: ${event.interactionId}`]),
        delivered: 0,
        failures: Object.freeze([]),
        correlationId: event.correlationId,
      });
    }
    seenInteractionIds.add(event.interactionId);

    const subscribers = subscribersByType.get(type) || [];
    const failures = [];
    let delivered = 0;
    const immutableEvent = Object.freeze({ ...event, interactionType: type });
    for (const subscriber of [...subscribers]) {
      try {
        subscriber.handler(immutableEvent);
        delivered += 1;
      } catch (error) {
        failures.push(error);
      }
    }
    return Object.freeze({
      ok: failures.length === 0,
      errors: Object.freeze([]),
      delivered,
      failures: Object.freeze(failures),
      correlationId: event.correlationId,
    });
  }

  return Object.freeze({
    publish,
    subscribe,
    unsubscribe,
    subscriberCount(type) {
      return (subscribersByType.get(type) || []).length;
    },
  });
}
