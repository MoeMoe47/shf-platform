// MET-8 — MET-7 City Mission reuse boundary (build brief §27).
//
// Read-only. An Opportunity may reference a mission_projection_id so the
// Exchange can show mission context, but this adapter never persists
// mission content and never re-derives it — it asks MET-7's own
// mission-projection-service for the live projection and reports back
// only what a sponsor needs to confirm the link is real.
import { getMissionForActor } from "../../missions/mission-projection-service.js";

export interface MissionLinkActor {
  user_id: string;
  organization_id: string;
  active_organization_id?: string;
  tenant_id?: string;
  roles?: string[];
  permissions?: string[];
}

export async function resolveMissionLinkForSponsor(actor: MissionLinkActor, missionProjectionId: string | null | undefined) {
  if (!missionProjectionId) return null;
  const mission = await getMissionForActor(actor, missionProjectionId);
  if (!mission) throw new Error("MISSION_NOT_FOUND");
  return {
    missionProjectionId: mission.missionProjectionId,
    missionTitle: mission.missionTitle,
    districtId: mission.location.districtId,
    facilityId: mission.location.facilityId,
    programId: mission.programId,
  };
}
