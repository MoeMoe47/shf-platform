const SAFE_ACCESSIBILITY_FIELDS = [
  "label",
  "stateText",
  "selected",
  "highlighted",
  "freshnessText",
  "verificationText",
  "unavailableText",
];

const SAFE_INTERACTION_FIELDS = [
  "selectable",
  "focusable",
  "interactionType",
  "selectionContext",
];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function fail(message) {
  throw new TypeError(message);
}

function copyAllowed(source, fields) {
  const result = {};
  for (const field of fields) {
    if (source[field] !== undefined) result[field] = source[field];
  }
  return Object.freeze(result);
}

function toAccessibleItem(marker) {
  if (!isRecord(marker)) fail("Quick Map accessibility input must contain marker objects");
  if (typeof marker.id !== "string" || marker.id.length === 0) fail("Accessible marker requires an ID");
  if (typeof marker.label !== "string" || marker.label.length === 0) fail("Accessible marker requires a label");
  if (typeof marker.state !== "string" || marker.state.length === 0) fail("Accessible marker requires a state");
  if (!isRecord(marker.accessibility)) fail("Accessible marker requires accessibility metadata");
  if (!isRecord(marker.interaction)) fail("Accessible marker requires interaction metadata");

  const accessibility = copyAllowed(marker.accessibility, SAFE_ACCESSIBILITY_FIELDS);
  const interaction = copyAllowed(marker.interaction, SAFE_INTERACTION_FIELDS);
  if (typeof accessibility.label !== "string" || typeof accessibility.stateText !== "string") {
    fail("Accessible marker requires safe label and state text");
  }

  return Object.freeze({
    id: marker.id,
    label: marker.label,
    state: marker.state,
    modifiers: Object.freeze(Array.isArray(marker.modifiers) ? marker.modifiers.slice() : []),
    accessibility,
    interaction,
  });
}

export function toQuickMapAccessibleItems(markers) {
  if (!Array.isArray(markers)) fail("Quick Map accessibility input must be an array");
  return Object.freeze(markers.map(toAccessibleItem));
}
