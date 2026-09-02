// SHF AIEL Phase 3 — merge-patch validation for the Personal Accessibility
// Profile. Implements docs/SHF_AIEL_PERSISTENCE_API_CONTRACT_V1.md §12/§14
// exactly: a known field with an invalid enum value is a hard validation
// error (422); an entirely unknown top-level key is preserved, never
// rejected (forward-compat round-trip safety) — these are deliberately
// different outcomes for different situations, not an oversight.
import {
  TEXT_SCALE_VALUES, CONTRAST_MODE_VALUES, FOCUS_EMPHASIS_VALUES, TARGET_SIZE_VALUES,
  MEDIA_PREFERENCE_VALUES, MOTION_PREFERENCE_VALUES, CELEBRATION_INTENSITY_VALUES,
  READING_SUPPORT_VALUES, READ_ALOUD_PREFERENCE_VALUES,
} from "./accessibility-profile.js";

// Constitution §6/§8 + phase brief Step 4: a patch must never be able to
// smuggle in an accommodation, identity, or scope field under any key name
// at any depth this validator can see. This is a defensive belt-and-
// suspenders check — no route ever reads these values back out even if
// present, but rejecting them outright at the door is cheaper to reason
// about than trusting every future consumer to ignore them correctly.
const FORBIDDEN_KEYS = new Set([
  "accommodation", "accommodations", "authorizedaccommodation", "authorizedaccommodations",
  "disability", "disabilitytype", "diagnosis",
  "userid", "user_id", "organizationid", "organization_id",
  "membershipid", "membership_id", "tenantid", "tenant_id",
]);

export class PatchValidationError extends Error {
  constructor(public issues: string[]) {
    super(`Invalid accessibility profile patch: ${issues.join("; ")}`);
    this.name = "PatchValidationError";
  }
}

const KNOWN_GROUP_FIELDS: Record<string, Record<string, readonly string[]>> = {
  presentation: { textScale: TEXT_SCALE_VALUES, contrastMode: CONTRAST_MODE_VALUES },
  interaction: { focusEmphasis: FOCUS_EMPHASIS_VALUES, targetSize: TARGET_SIZE_VALUES },
  media: { captionPreference: MEDIA_PREFERENCE_VALUES, transcriptPreference: MEDIA_PREFERENCE_VALUES },
  sensory: { motionPreference: MOTION_PREFERENCE_VALUES, celebrationIntensity: CELEBRATION_INTENSITY_VALUES },
  learningSupport: { preferredReadingSupport: READING_SUPPORT_VALUES, readAloudPreference: READ_ALOUD_PREFERENCE_VALUES },
};

function scanForForbiddenKeys(value: unknown, issues: string[], path = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      issues.push(`forbidden field "${path}${key}" is not allowed in a preferences patch`);
    }
    scanForForbiddenKeys((value as Record<string, unknown>)[key], issues, `${path}${key}.`);
  }
}

// Validates only what this version of the code knows about. An entirely
// unrecognized top-level key (e.g. a field a newer server version added)
// is left untouched here — validatePatch() never rejects for that reason,
// only for a known field holding an invalid value, or a malformed known
// group (not an object), or a forbidden key appearing anywhere.
export function validatePatch(patch: unknown): string[] {
  const issues: string[] = [];
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return ["patch body must be a JSON object"];
  }
  scanForForbiddenKeys(patch, issues);

  for (const [groupName, fields] of Object.entries(KNOWN_GROUP_FIELDS)) {
    const group = (patch as Record<string, unknown>)[groupName];
    if (group === undefined) continue; // omitted group — untouched by merge-patch, not an error
    if (group === null || typeof group !== "object" || Array.isArray(group)) {
      issues.push(`"${groupName}" must be an object`);
      continue;
    }
    for (const [fieldName, allowedValues] of Object.entries(fields)) {
      const value = (group as Record<string, unknown>)[fieldName];
      if (value === undefined) continue; // omitted field — untouched
      if (typeof value !== "string" || !(allowedValues as readonly string[]).includes(value)) {
        issues.push(`"${groupName}.${fieldName}" must be one of: ${allowedValues.join(", ")}`);
      }
    }
  }
  return issues;
}

// Server-side merge-patch (RFC 7396-style): a submitted field replaces
// that field; an absent field is untouched; unknown keys anywhere in the
// stored object survive because this function only ever assigns keys the
// patch actually named, at whatever depth it named them — it never
// reconstructs the object from a fixed known-field list, which is exactly
// what would silently drop an unrecognized stored field.
export function applyMergePatch<T extends Record<string, any>>(stored: T, patch: Record<string, any>): T {
  const result: Record<string, any> = { ...stored };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete result[key];
      continue;
    }
    if (typeof value === "object" && !Array.isArray(value) && typeof result[key] === "object" && result[key] !== null) {
      result[key] = applyMergePatch(result[key], value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
