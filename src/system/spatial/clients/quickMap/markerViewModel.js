const QUICK_MAP_SPACE = "metaverse.quick-map";
const METAVERSE_FAMILY = "METAVERSE";
const ALLOWED_STATUSES = new Set(["PROJECTED", "STALE", "UNAVAILABLE", "RESTRICTED", "SUPPRESSED", "INVALID"]);
const HIDDEN_STATUSES = new Set(["SUPPRESSED", "INVALID"]);
const SAFE_INTERACTIONS = new Set(["SELECT", "FOCUS", "HIGHLIGHT", "OPEN_RECORD"]);
const SAFE_MODIFIERS = ["SELECTED", "HIGHLIGHTED", "STALE", "UNVERIFIED"];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function invalid(message) {
  throw new TypeError(message);
}

function positionFrom(value) {
  const candidates = [value?.position, value?.geometry, value?.feature?.position, value?.feature?.geometry];
  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    const coordinates = Array.isArray(candidate.coordinates) ? candidate.coordinates : null;
    const x = candidate.x ?? coordinates?.[0];
    const y = candidate.y ?? coordinates?.[1];
    if (typeof x === "number" && typeof y === "number" && Number.isFinite(x) && Number.isFinite(y)) {
      return { x, y };
    }
  }
  return null;
}

function assertPosition(position) {
  if (!position || position.x < 0 || position.x > 100 || position.y < 0 || position.y > 100) {
    invalid("Quick Map marker coordinates must be finite values within 0..100");
  }
  return position;
}

function safeAccessibility(accessibility, fallbackLabel, state) {
  const source = isRecord(accessibility) ? accessibility : {};
  const safe = {};
  for (const key of ["label", "stateText", "selected", "highlighted", "freshnessText", "verificationText", "unavailableText"]) {
    if (source[key] !== undefined) safe[key] = source[key];
  }
  safe.label ??= fallbackLabel;
  safe.stateText ??= state;
  return Object.freeze(safe);
}

function safeModifiers(presentation) {
  const supplied = Array.isArray(presentation?.modifiers) ? new Set(presentation.modifiers) : new Set();
  return Object.freeze(SAFE_MODIFIERS.filter((modifier) => supplied.has(modifier)));
}

function safeInteraction(feature, restricted = false) {
  if (restricted) {
    return Object.freeze({ selectable: false, interactionType: "FOCUS" });
  }
  const allowed = Array.isArray(feature?.allowedInteractions)
    ? feature.allowedInteractions.filter((entry) => SAFE_INTERACTIONS.has(entry))
    : [];
  return Object.freeze({
    selectable: allowed.includes("SELECT"),
    focusable: true,
    interactionType: allowed.includes("SELECT") ? "SELECT" : "FOCUS",
  });
}

function markerFromResult(result) {
  if (!isRecord(result) || result.kind !== "CLIENT") invalid("Quick Map accepts sanitized ClientProjectionResult values only");
  if (!ALLOWED_STATUSES.has(result.status)) invalid("Unknown client projection status");
  if (HIDDEN_STATUSES.has(result.status)) return null;

  if (result.status === "RESTRICTED") {
    const position = positionFrom(result);
    if (!position || !result.resultRef || typeof result.resultRef !== "string") return null;
    const bounded = assertPosition(position);
    return Object.freeze({
      id: result.resultRef,
      x: bounded.x,
      y: bounded.y,
      label: "Restricted item",
      state: "RESTRICTED",
      modifiers: Object.freeze([]),
      accessibility: safeAccessibility(result.accessibility, "Restricted item", "Restricted"),
      interaction: safeInteraction(null, true),
    });
  }

  const feature = result.feature;
  if (!isRecord(feature)) invalid("Visible Quick Map results require a sanitized feature");
  if (feature.coordinateFamily !== METAVERSE_FAMILY || feature.coordinateSpaceId !== QUICK_MAP_SPACE) {
    invalid("Quick Map accepts only METAVERSE metaverse.quick-map features");
  }
  if (typeof feature.featureId !== "string" || feature.featureId.length === 0) invalid("Quick Map markers require a feature ID");
  const bounded = assertPosition(positionFrom(result));
  const state = result.presentation?.resolvedVisualState || (result.status === "STALE" ? "STALE" : result.status);
  const label = typeof feature.label === "string" ? feature.label : typeof feature.title === "string" ? feature.title : "Spatial feature";
  return Object.freeze({
    id: feature.featureId,
    x: bounded.x,
    y: bounded.y,
    label,
    state,
    modifiers: safeModifiers(result.presentation),
    accessibility: safeAccessibility(result.accessibility, label, state),
    interaction: safeInteraction(feature),
  });
}

export function toQuickMapMarkerModels(results) {
  if (!Array.isArray(results)) invalid("Quick Map marker input must be an array");
  return Object.freeze(results.map(markerFromResult).filter(Boolean));
}

export function mergeQuickMapMarkerSources({ legacyMarkers = [], spatialMarkers = [] } = {}) {
  if (!Array.isArray(legacyMarkers) || !Array.isArray(spatialMarkers)) invalid("Quick Map marker sources must be arrays");
  return Object.freeze([...legacyMarkers.map((marker) => ({ ...marker })), ...spatialMarkers.map((marker) => ({ ...marker }))]);
}
