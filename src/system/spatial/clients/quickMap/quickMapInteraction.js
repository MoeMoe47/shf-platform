import { SPATIAL_INTERACTION_TYPES } from "../../../../shared/spatial/index.js";

const QUICK_MAP_ORIGIN = "metaverse.quick-map";
const QUICK_MAP_COMPONENT = "MetaverseMiniMap";
const QUICK_MAP_PROJECTION = "quick-map-client";
let interactionCounter = 0;

function nextId(type, featureId) {
  interactionCounter += 1;
  return `${QUICK_MAP_ORIGIN}:${type.toLowerCase()}:${interactionCounter}:${featureId}`;
}

function contextFor(marker) {
  const context = marker?.interaction?.selectionContext;
  if (!context || context.featureId !== marker.id) return null;
  if (context.coordinateFamily !== "METAVERSE" || context.coordinateSpaceId !== QUICK_MAP_ORIGIN) return null;
  if (!Number.isFinite(marker.x) || !Number.isFinite(marker.y) || marker.x < 0 || marker.x > 100 || marker.y < 0 || marker.y > 100) return null;
  if (["featureId", "domain", "sourceAuthority", "coordinateFamily", "coordinateSpaceId", "layerId"].some((field) => typeof context[field] !== "string" || context[field].length === 0)) return null;
  return context;
}

function safeProvenance(context) {
  return Object.freeze({
    sourceAuthority: context.sourceAuthority,
    sourceReference: QUICK_MAP_ORIGIN,
    projectionAdapter: QUICK_MAP_PROJECTION,
    projectionVersion: "wave4c",
  });
}

export function createQuickMapInteractionController({ store, bus, clock = () => new Date() } = {}) {
  if (!store || !bus) throw new Error("Quick Map interaction controller requires a selection store and interaction bus");
  let activeMarker = null;

  function envelope(type, marker, payload = {}) {
    const context = contextFor(marker);
    if (!context) return null;
    const interactionId = nextId(type, context.featureId);
    return Object.freeze({
      interactionId,
      interactionType: type,
      featureId: context.featureId,
      layerId: context.layerId,
      domain: context.domain,
      sourceAuthority: context.sourceAuthority,
      coordinateFamily: context.coordinateFamily,
      coordinateSpaceId: context.coordinateSpaceId,
      timestamp: clock().toISOString(),
      originClient: QUICK_MAP_ORIGIN,
      originComponent: QUICK_MAP_COMPONENT,
      correlationId: context.featureId,
      payload: Object.freeze({ ...payload }),
      provenance: safeProvenance(context),
    });
  }

  function publish(type, marker, payload) {
    const event = envelope(type, marker, payload);
    if (!event) return Object.freeze({ ok: false, errors: Object.freeze(["marker is not a Spatial Quick Map marker"]), event: null });
    const result = bus.publish(event);
    return Object.freeze({ ...result, event });
  }

  function selectionFor(marker, reason, selectionId) {
    const context = contextFor(marker);
    if (!context) return null;
    return Object.freeze({
      selectionId,
      featureId: context.featureId,
      domain: context.domain,
      sourceAuthority: context.sourceAuthority,
      coordinateFamily: context.coordinateFamily,
      coordinateSpaceId: context.coordinateSpaceId,
      layerId: context.layerId,
      selectionReason: reason,
      timestamp: clock().toISOString(),
      provenance: safeProvenance(context),
      eligibleActions: Object.freeze(Array.isArray(context.eligibleActions) ? context.eligibleActions.filter((action) => typeof action === "string") : []),
    });
  }

  return Object.freeze({
    activate(marker) {
      if (!marker?.interaction?.selectable) return Object.freeze({ ok: false, errors: Object.freeze(["marker is not selectable"]), selection: store.getSelection() });
      const event = envelope(SPATIAL_INTERACTION_TYPES.SELECT, marker, { reason: "activation" });
      const selection = event ? selectionFor(marker, "activation", event.interactionId) : null;
      if (!selection) return Object.freeze({ ok: false, errors: Object.freeze(["marker is not a Spatial Quick Map marker"]), selection: store.getSelection() });
      const selected = store.select(selection);
      if (!selected.ok) return Object.freeze({ ...selected, event: null });
      const published = bus.publish(event);
      if (!published.ok) store.clearSelection("interaction-publish-failed");
      else activeMarker = marker;
      return Object.freeze({ ...published, selection: store.getSelection(), event });
    },
    deselect(reason = "clear") {
      const marker = activeMarker;
      const published = marker ? publish(SPATIAL_INTERACTION_TYPES.DESELECT, marker, { reason }) : Object.freeze({ ok: true, delivered: 0, failures: Object.freeze([]), event: null });
      const cleared = store.clearSelection(reason);
      activeMarker = null;
      return Object.freeze({ ...cleared, ...published, selection: null });
    },
    focus(marker) {
      return publish(SPATIAL_INTERACTION_TYPES.FOCUS, marker, { reason: "focus" });
    },
    highlight(marker) {
      return publish(SPATIAL_INTERACTION_TYPES.HIGHLIGHT, marker, { active: true });
    },
    clearHighlight(marker) {
      return publish(SPATIAL_INTERACTION_TYPES.HIGHLIGHT, marker, { active: false });
    },
    openRecord(marker) {
      return publish(SPATIAL_INTERACTION_TYPES.OPEN_RECORD, marker, { reason: "open-record-request" });
    },
  });
}
