import { universeDestinations } from "../../pages/universe-v1/universeDestinationRegistry.js";

export const OGL_CONTRACT_VERSION = "1.0";

export const ORIENTATION_LIFECYCLES = Object.freeze(["DRAFT", "ACTIVE", "SUPERSEDED", "ARCHIVED"]);
export const ORIENTATION_ENTRY_MODES = Object.freeze([
  "FIRST_VISIT",
  "RETURNING_USER",
  "REORIENTATION",
  "CHANGED_FEATURE",
  "MANUAL_REPLAY",
]);
export const REORIENTATION_POLICIES = Object.freeze(["NONE", "OPTIONAL", "RECOMMENDED", "REQUIRED"]);
export const ORIENTATION_VISIBILITY = Object.freeze(["PUBLIC", "AUTHENTICATED", "ROLE_SCOPED"]);
export const ORIENTATION_TIERS = Object.freeze(["TIER_A", "TIER_B", "TIER_C"]);
export const MISSING_ANCHOR_POLICIES = Object.freeze([
  "SKIP_STEP",
  "SHOW_UNANCHORED",
  "PAUSE",
  "END_TOUR",
  "REQUIRE_TARGET",
]);
export const TARGET_MODES = Object.freeze(["SEMANTIC_ANCHOR", "ROUTE_TARGET", "UNANCHORED"]);
export const COMPLETION_SOURCES = Object.freeze([
  "DOMAIN_STATE",
  "DGAL_REQUIREMENT",
  "DOCUMENT_ACKNOWLEDGMENT",
  "SIGNATURE_STATE",
  "USER_EXPERIENCE_STATE",
]);
export const CHANGE_CLASSIFICATIONS = Object.freeze([
  "COPY_ONLY",
  "TOUR_STEP",
  "TARGET_ROUTE",
  "WORKFLOW_SIGNIFICANT",
  "POLICY_RELATED",
  "ACCESSIBILITY_CORRECTION",
]);

const CAPABILITY_KEYS = Object.freeze([
  "orientation",
  "guidedTour",
  "contextualGuidance",
  "checklist",
  "guidanceCenter",
  "documentation",
  "companion",
  "whatsChanged",
]);

const KNOWN_DESTINATIONS = new Set(universeDestinations.map((destination) => destination.id));
const ID_PATTERN = /^[a-z][a-z0-9._:-]*$/;

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function required(errors, condition, path, message) {
  if (!condition) errors.push(`${path}: ${message}`);
}

function validReference(value, path, errors) {
  required(errors, isRecord(value), path, "reference must be an object");
  if (!isRecord(value)) return;
  required(errors, typeof value.id === "string" && ID_PATTERN.test(value.id), `${path}.id`, "must be a stable reference id");
  required(errors, typeof value.kind === "string" && value.kind.length > 0, `${path}.kind`, "must identify the reference authority");
}

function validateTarget(target, path, errors) {
  required(errors, isRecord(target), path, "target must be an object");
  if (!isRecord(target)) return;
  required(errors, typeof target.mode === "string" && TARGET_MODES.includes(target.mode), `${path}.mode`, "has an invalid target mode");
  if (target.mode === "SEMANTIC_ANCHOR") {
    required(errors, typeof target.anchorId === "string" && ID_PATTERN.test(target.anchorId), `${path}.anchorId`, "must be a stable semantic anchor id");
  }
  if (target.mode === "ROUTE_TARGET") {
    required(errors, typeof target.destinationId === "string", `${path}.destinationId`, "must reference a canonical destination");
    required(errors, typeof target.routeId === "string" && ID_PATTERN.test(target.routeId), `${path}.routeId`, "must be a canonical route reference");
  }
  required(errors, target.externalUrl === undefined, `${path}.externalUrl`, "arbitrary external URLs are not allowed in internal targets");
}

function validateTour(tour, path, errors, requiresAlternative) {
  required(errors, isRecord(tour), path, "tour must be an object");
  if (!isRecord(tour)) return;
  required(errors, typeof tour.tourId === "string" && ID_PATTERN.test(tour.tourId), `${path}.tourId`, "must be a stable id");
  required(errors, Array.isArray(tour.steps) && tour.steps.length > 0, `${path}.steps`, "must contain at least one step");
  const stepIds = new Set();
  for (const [index, step] of (tour.steps || []).entries()) {
    const stepPath = `${path}.steps[${index}]`;
    required(errors, isRecord(step), stepPath, "step must be an object");
    if (!isRecord(step)) continue;
    required(errors, typeof step.stepId === "string" && ID_PATTERN.test(step.stepId), `${stepPath}.stepId`, "must be a stable id");
    required(errors, !stepIds.has(step.stepId), `${stepPath}.stepId`, "must be unique within the tour");
    stepIds.add(step.stepId);
    required(errors, Number.isInteger(step.order) && step.order >= 0, `${stepPath}.order`, "must be a non-negative integer");
    required(errors, typeof step.title === "string" && step.title.trim().length > 0, `${stepPath}.title`, "is required");
    required(errors, typeof step.body === "string" || isRecord(step.bodyRef), `${stepPath}.body`, "must be text or a bounded content reference");
    required(errors, isRecord(step.target), `${stepPath}.target`, "is required");
    if (step.target) validateTarget(step.target, `${stepPath}.target`, errors);
    required(errors, typeof step.missingAnchorPolicy === "string" && MISSING_ANCHOR_POLICIES.includes(step.missingAnchorPolicy), `${stepPath}.missingAnchorPolicy`, "has an invalid fallback");
  }
  if (requiresAlternative) validReference(tour.accessibleAlternativeRef, `${path}.accessibleAlternativeRef`, errors);
}

export function validateOrientationContract(contract, options = {}) {
  const errors = [];
  required(errors, isRecord(contract), "contract", "must be an object");
  if (!isRecord(contract)) return { valid: false, errors };

  required(errors, contract.schemaVersion === OGL_CONTRACT_VERSION, "schemaVersion", `must be ${OGL_CONTRACT_VERSION}`);
  required(errors, typeof contract.orientationId === "string" && ID_PATTERN.test(contract.orientationId), "orientationId", "must be a stable id");
  required(errors, typeof contract.slug === "string" && ID_PATTERN.test(contract.slug), "slug", "must be a stable id");
  required(errors, Number.isInteger(contract.version) && contract.version > 0, "version", "must be a positive integer");
  required(errors, typeof contract.lifecycle === "string" && ORIENTATION_LIFECYCLES.includes(contract.lifecycle), "lifecycle", "is invalid");
  required(errors, typeof contract.destinationId === "string", "destinationId", "must reference the canonical destination registry");
  if (contract.destinationId && options.knownDestinationIds) {
    required(errors, options.knownDestinationIds.has(contract.destinationId), "destinationId", "is not in the supplied canonical destination registry");
  } else if (contract.destinationId) {
    required(errors, KNOWN_DESTINATIONS.has(contract.destinationId), "destinationId", "is not in the Universe destination registry");
  }
  required(errors, typeof contract.owner?.orientationOwner === "string" && contract.owner.orientationOwner.length > 0, "owner.orientationOwner", "is required");
  required(errors, typeof contract.owner?.contentOwner === "string" && contract.owner.contentOwner.length > 0, "owner.contentOwner", "is required");
  required(errors, typeof contract.visibility === "string" && ORIENTATION_VISIBILITY.includes(contract.visibility), "visibility", "is invalid");
  required(errors, Array.isArray(contract.entryModes) && contract.entryModes.every((mode) => ORIENTATION_ENTRY_MODES.includes(mode)), "entryModes", "contains an invalid entry mode");
  required(errors, Array.isArray(contract.audience?.roles) && contract.audience.roles.length > 0, "audience.roles", "must reference at least one canonical role");
  required(errors, contract.audience?.roles?.every((role) => typeof role === "string" && ID_PATTERN.test(role)), "audience.roles", "contains an invalid role reference");
  required(errors, typeof contract.audience?.permissions?.every === "function" && contract.audience.permissions.every((permission) => typeof permission === "string" && permission.includes(".")), "audience.permissions", "must use canonical permission references");
  required(errors, isRecord(contract.capabilities), "capabilities", "is required");
  if (isRecord(contract.capabilities)) {
    for (const key of Object.keys(contract.capabilities)) required(errors, CAPABILITY_KEYS.includes(key), `capabilities.${key}`, "is not a known capability");
    for (const key of CAPABILITY_KEYS) required(errors, typeof contract.capabilities[key] === "boolean", `capabilities.${key}`, "must be boolean");
  }
  required(errors, typeof contract.tier === "string" && ORIENTATION_TIERS.includes(contract.tier), "tier", "is invalid");
  required(errors, typeof contract.reorientation?.policy === "string" && REORIENTATION_POLICIES.includes(contract.reorientation.policy), "reorientation.policy", "is invalid");
  required(errors, typeof contract.changeClassification === "string" && CHANGE_CLASSIFICATIONS.includes(contract.changeClassification), "changeClassification", "is invalid");
  required(errors, isRecord(contract.accessibility), "accessibility", "is required");
  for (const key of ["keyboard", "screenReader", "reducedMotion", "mobile", "nonTourAlternative"]) required(errors, contract.accessibility?.[key] === true, `accessibility.${key}`, "must be explicitly supported/declared");
  required(errors, Array.isArray(contract.telemetryEvents), "telemetryEvents", "must be an explicit bounded event list");
  required(errors, isRecord(contract.companion), "companion", "metadata is required even when disabled");
  required(errors, Array.isArray(contract.companion?.suggestedTopics), "companion.suggestedTopics", "must be an array");
  required(errors, isRecord(contract.safeActions), "safeActions", "is required");
  if (isRecord(contract.safeActions)) for (const [key, target] of Object.entries(contract.safeActions)) validateTarget(target, `safeActions.${key}`, errors);
  if (contract.capabilities?.guidedTour) {
    required(errors, Array.isArray(contract.tours) && contract.tours.length > 0, "tours", "guided tours require tour definitions");
    for (const [index, tour] of (contract.tours || []).entries()) validateTour(tour, `tours[${index}]`, errors, contract.accessibility.nonTourAlternative);
  }
  if (contract.capabilities?.checklist) {
    required(errors, Array.isArray(contract.checklist), "checklist", "checklist capability requires item definitions");
    for (const [index, item] of (contract.checklist || []).entries()) {
      const path = `checklist[${index}]`;
      required(errors, isRecord(item), path, "item must be an object");
      if (!isRecord(item)) continue;
      required(errors, typeof item.itemId === "string" && ID_PATTERN.test(item.itemId), `${path}.itemId`, "must be a stable id");
      required(errors, typeof item.completionSource === "string" && COMPLETION_SOURCES.includes(item.completionSource), `${path}.completionSource`, "is invalid");
      required(errors, isRecord(item.sourceRef), `${path}.sourceRef`, "must identify the canonical completion source");
      required(errors, typeof item.required === "boolean", `${path}.required`, "must be explicit");
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidOrientationContract(contract, options = {}) {
  const result = validateOrientationContract(contract, options);
  if (!result.valid) throw new Error(`Invalid Orientation Contract ${contract?.orientationId || "<unknown>"}:\n${result.errors.join("\n")}`);
  return contract;
}

export function adaptSharedTourDefinition(definition, orientationId) {
  return {
    tourId: definition.tourId || definition.id,
    orientationId,
    title: definition.title || definition.name || "Guided tour",
    description: definition.description || null,
    restartable: definition.restartable !== false,
    skippable: definition.skippable !== false,
    dismissible: definition.dismissible !== false,
    resumable: definition.resumable === true,
    accessibleAlternativeRef: definition.accessibleAlternativeRef || null,
    steps: (definition.steps || []).map((step, index) => ({
      stepId: step.stepId || step.id || `step-${index + 1}`,
      order: Number.isInteger(step.order) ? step.order : index,
      title: step.title || "Tour step",
      body: step.body || step.content || step.description || null,
      target: step.target || { mode: "UNANCHORED" },
      missingAnchorPolicy: step.missingAnchorPolicy || "SHOW_UNANCHORED",
      accessibilityLabel: step.accessibilityLabel || step.title || "Tour step",
    })),
  };
}

export function adaptHubTourDefinition(definition, orientationId) {
  return adaptSharedTourDefinition({ ...definition, tourId: definition.tourId || definition.id || definition.pageKey }, orientationId);
}
