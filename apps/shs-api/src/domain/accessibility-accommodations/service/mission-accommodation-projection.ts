// Phase 4G — minimum-necessary accommodation projection for Mission Runtime.
//
// Owned by the accommodation authority. Mission Runtime consumes it; it never
// becomes accommodation authority. Only ACTIVE institutional grants
// (authorized_accommodations, migration 057) inside their effective window are
// considered, and only closed REQUIREMENT flags leave this domain: no stored
// `value`, case/request records, notes, reviewers, identifiers, diagnoses or
// supporting documentation. Learner accessibility preferences (migration 056)
// are a separate, presentation-only concern.
//
// The flags express requirements, not execution. The accommodation domain does
// not yet expose a validated, normalized timing policy (no canonical multiplier,
// extra duration or break/pause policy; `value` is unvalidated and the
// `accommodation-value.ts` validator referenced by migration 057 does not exist).
// Until it does, consumers must not derive or apply timing semantics:
// EXTENDED_ASSESSMENT_TIME is not unlimited time, and ADDITIONAL_BREAKS is not
// disabled expiration.
import { query } from "../../../db/client.js";

export const MISSION_ACCOMMODATION_PROJECTION_VERSION = 2;

export interface MissionAccommodationProjection {
  projectionVersion: number;
  // EXTENDED_ASSESSMENT_TIME is active: a timing adjustment is required (amount not established by authority).
  timingAdjustmentRequired: boolean;
  // ADDITIONAL_BREAKS is active: break accommodation is required (break semantics not established by authority).
  breakAccommodationRequired: boolean;
  // ALTERNATE_PRESENTATION: presentation layer must offer an alternate presentation.
  alternatePresentationRequired: boolean;
  // ALTERNATE_INPUT_METHOD: interaction layer must accept an alternate input method.
  alternateInputRequired: boolean;
  // No validated normalized timing policy exists in the accommodation domain yet.
  timingPolicy: null;
}

export type MissionAccommodationProvider = (scope: { organizationId: string; userId: string; at: string }) => Promise<MissionAccommodationProjection | null>;

export function projectMissionAccommodations(types: readonly string[]): MissionAccommodationProjection | null {
  const active = new Set(types);
  const projection: MissionAccommodationProjection = {
    projectionVersion: MISSION_ACCOMMODATION_PROJECTION_VERSION,
    timingAdjustmentRequired: active.has("EXTENDED_ASSESSMENT_TIME"),
    breakAccommodationRequired: active.has("ADDITIONAL_BREAKS"),
    alternatePresentationRequired: active.has("ALTERNATE_PRESENTATION"),
    alternateInputRequired: active.has("ALTERNATE_INPUT_METHOD"),
    timingPolicy: null,
  };
  const required = projection.timingAdjustmentRequired || projection.breakAccommodationRequired
    || projection.alternatePresentationRequired || projection.alternateInputRequired;
  return required ? projection : null;
}

export const getMissionAccommodationProjection: MissionAccommodationProvider = async ({ organizationId, userId, at }) => {
  const result = await query(
    `SELECT DISTINCT accommodation_type FROM authorized_accommodations
     WHERE organization_id=$1 AND user_id=$2 AND status='ACTIVE'
       AND effective_at <= $3 AND (expires_at IS NULL OR expires_at > $3)`,
    [organizationId, userId, at],
  );
  return projectMissionAccommodations(result.rows.map((row: any) => String(row.accommodation_type)));
};
