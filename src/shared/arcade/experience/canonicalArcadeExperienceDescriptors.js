// Phase 7 — canonical Arcade Experience Descriptors (the first real Learning descriptor).
//
// Learning Arcade and Classic Arcade share platform infrastructure but remain separate product authorities.
// A descriptor declares product semantics and references; it owns no Mission, curriculum, career or Evidence.
//
// Data Center Cooling Failure Response:
// - activityReference → the canonical arcade_activities row "arcade_activity_data_center_cooling_incident_v1",
//   provisioned through the Arcade authority (provisionCanonicalArcadeActivity), PASSED_FLAG mastery rule.
// - launchable: the Arcade Integration Fabric launches the exact published Mission version through the canonical
//   start. playable: false — there is no client Mission player yet; launch.route is the existing Learning entry
//   surface, not a player.
// - No leaderboard (no authoritative score) and no achievements (no achievement store).
export const CANONICAL_DATA_CENTER_COOLING_DESCRIPTOR = Object.freeze({
  id: "experience.learning.data-center-cooling-incident",
  slug: "data-center-cooling-incident",
  activityReference: { arcadeActivityId: "arcade_activity_data_center_cooling_incident_v1" },
  product: { family: "learning", experienceType: "mission" },
  lifecycle: { status: "active", launchable: true, playable: false },
  launch: { route: "/learning", runtimeType: "internal" },
  presentation: {
    title: "Data Center Cooling Failure Response",
    shortTitle: "Cooling Failure Response",
    description: "A simulated team incident: a power event causes a cooling failure in the data hall. Diagnose, verify power, and apply a bounded simulated response.",
    category: "workforce",
    difficulty: "beginner",
    artwork: null,
    thumbnail: null,
  },
  capabilities: {
    leaderboardEligible: false,
    tournamentEligible: false,
    multiplayer: true,
    spectator: false,
    evidenceResultCapable: true,
    missionLaunch: true,
    replay: true,
    achievementEligible: false,
  },
  relationships: {
    career: { relationshipType: "reference", pathwayReferences: ["career_data_center_technician"] },
    metaverse: { relationshipType: "reference", experienceReferences: ["main-data-center", "cooling-mechanical-plant", "power-electrical-facility"] },
    agentFabric: { relationshipType: "none", capabilityReferences: [] },
    treasury: { relationshipType: "none", rewardPolicyReference: null },
    studio: { relationshipType: "none", projectReferences: [] },
    mission: { relationshipType: "reference", missionReferences: [{ missionId: "data-center-cooling-failure-response", missionVersion: 1 }] },
  },
  accessibility: {
    profileAware: true,
    reducedMotionRequired: false,
    keyboardRequired: false,
    supports: { keyboardSupported: true, reducedMotionSupported: true, captionsSupported: true },
  },
  provenance: { classification: "canonical_descriptor", migratedFrom: [], source: "SYSTEM" },
});

export const CANONICAL_ARCADE_EXPERIENCE_DESCRIPTOR_LIST = Object.freeze([CANONICAL_DATA_CENTER_COOLING_DESCRIPTOR]);
