// SHF AIEL Phase 3 — Personal Accessibility Profile service.
//
// NON-NEGOTIABLE (Constitution §6/§13): this service owns nothing beyond
// a learner's own presentation preferences. It never writes to Truth
// Spine, Operational Events, or Evidence — only the ordinary settings-
// history audit mechanism every other domain in this codebase already
// uses. It never accepts or exposes an Authorized Accommodation field
// (enforced structurally by patch-validator.ts's forbidden-key scan, not
// just by convention).
import { randomBytes } from "node:crypto";
import { AccessibilityProfileRepo } from "../repo/accessibility-profile-repo.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { validatePatch, applyMergePatch, PatchValidationError } from "../model/patch-validator.js";
import {
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  type AccessibilityPreferences,
  type AccessibilityProfileRow,
  type DefaultAccessibilityProfile,
} from "../model/accessibility-profile.js";

const repo = new AccessibilityProfileRepo();

export interface ProfileActor {
  user_id: string;
  organization_id: string; // used only for the audit-event's routing field, never a scope constraint on the profile row itself
}

export class StaleRevisionError extends Error {
  constructor() {
    super("accessibility_profile_stale_revision");
    this.name = "StaleRevisionError";
  }
}

export { PatchValidationError };

function toResponseShape(row: AccessibilityProfileRow) {
  return {
    userId: row.userId,
    profileVersion: row.profileVersion,
    revision: row.revision,
    preferences: row.preferences,
    isDefault: false as const,
  };
}

function defaultResponseShape(userId: string): DefaultAccessibilityProfile {
  return { userId, profileVersion: 1, revision: null, preferences: DEFAULT_ACCESSIBILITY_PREFERENCES, isDefault: true };
}

// Never creates a row (Phase 2 §15 / phase brief Step 6) — a learner who
// never touched the accessibility page leaves zero database footprint.
export async function getProfileForActor(actor: ProfileActor) {
  const row = await repo.findForUser(actor.user_id);
  return row ? toResponseShape(row) : defaultResponseShape(actor.user_id);
}

async function auditProfileEvent(actor: ProfileActor, actionType: "accessibility_profile.updated" | "accessibility_profile.reset", row: AccessibilityProfileRow) {
  await writeAuditEvent({
    audit_event_id: `audit_${randomBytes(16).toString("hex")}`,
    organization_id: actor.organization_id,
    actor_user_id: actor.user_id,
    target_object_type: "accessibility_profile",
    target_object_id: row.id,
    action_type: actionType,
    // Ordinary settings-history values only — never an accommodation
    // field (structurally impossible here; row.preferences can never
    // contain one, per patch-validator.ts's forbidden-key scan on every
    // write path that produced it) and never routed to Truth Spine/
    // Operational Events/Evidence (writeAuditEvent() only ever writes to
    // the ordinary audit_events table — see audit-helper.ts).
    new_state_json: { preferences: row.preferences, revision: row.revision },
    correlation_id: `corr_${row.id}_${row.revision}`,
    source_channel: "api",
  });
}

// expectedRevision: null/undefined means "I believe no row exists yet."
// A mismatch in either direction (client expects a row that doesn't
// exist, client expects no row but one does, or the revision number
// itself doesn't match) is a StaleRevisionError — the caller must GET
// again before retrying, never silently resolved.
export async function patchProfileForActor(
  actor: ProfileActor,
  patch: unknown,
  expectedRevision: number | null | undefined,
): Promise<ReturnType<typeof toResponseShape>> {
  const issues = validatePatch(patch);
  if (issues.length) throw new PatchValidationError(issues);

  const existing = await repo.findForUser(actor.user_id);

  if (!existing) {
    if (expectedRevision !== null && expectedRevision !== undefined) throw new StaleRevisionError();
    const merged = applyMergePatch<AccessibilityPreferences>(DEFAULT_ACCESSIBILITY_PREFERENCES, patch as Record<string, any>);
    const created = await repo.create(`a11yprofile_${randomBytes(16).toString("hex")}`, actor.user_id, merged);
    await auditProfileEvent(actor, "accessibility_profile.updated", created);
    return toResponseShape(created);
  }

  if (expectedRevision === null || expectedRevision === undefined || expectedRevision !== existing.revision) {
    throw new StaleRevisionError();
  }

  const merged = applyMergePatch<AccessibilityPreferences>(existing.preferences, patch as Record<string, any>);
  const updated = await repo.updateWithRevisionCheck(actor.user_id, expectedRevision, merged);
  if (!updated) throw new StaleRevisionError(); // lost a race between the read above and this write
  await auditProfileEvent(actor, "accessibility_profile.updated", updated);
  return toResponseShape(updated);
}

export type ResetScope =
  | { kind: "ALL" }
  | { kind: "GROUP"; group: keyof AccessibilityPreferences }
  | { kind: "FIELD"; group: keyof AccessibilityPreferences; field: string };

// Reset never deletes the row (docs/SHF_AIEL_PERSISTENCE_API_CONTRACT_V1.md
// §16) — it is itself just a specialized, revision-checked write, so it
// gets the same CAS protection and the same ordinary audit trail as an
// explicit preference change, preserving the distinction between "never
// chose anything" (no row) and "deliberately reset" (a row with a real
// revision history entry).
export async function resetProfileForActor(
  actor: ProfileActor,
  scope: ResetScope,
  expectedRevision: number | null | undefined,
): Promise<ReturnType<typeof toResponseShape>> {
  const existing = await repo.findForUser(actor.user_id);

  if (!existing) {
    // Nothing to reset — the learner already has the platform default by
    // definition. Never create a row purely to reset it to what it
    // already effectively is.
    return defaultResponseShape(actor.user_id) as any;
  }

  if (expectedRevision === null || expectedRevision === undefined || expectedRevision !== existing.revision) {
    throw new StaleRevisionError();
  }

  let nextPreferences: AccessibilityPreferences;
  if (scope.kind === "ALL") {
    nextPreferences = { ...DEFAULT_ACCESSIBILITY_PREFERENCES };
  } else if (scope.kind === "GROUP") {
    nextPreferences = { ...existing.preferences, [scope.group]: { ...DEFAULT_ACCESSIBILITY_PREFERENCES[scope.group] } };
  } else {
    const defaultsForGroup = DEFAULT_ACCESSIBILITY_PREFERENCES[scope.group] as Record<string, unknown>;
    nextPreferences = {
      ...existing.preferences,
      [scope.group]: { ...(existing.preferences[scope.group] as Record<string, unknown>), [scope.field]: defaultsForGroup[scope.field] },
    };
  }

  const updated = await repo.updateWithRevisionCheck(actor.user_id, expectedRevision, nextPreferences);
  if (!updated) throw new StaleRevisionError();
  await auditProfileEvent(actor, "accessibility_profile.reset", updated);
  return toResponseShape(updated);
}
