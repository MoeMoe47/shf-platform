export const ARCADE_EXPERIENCE_FAMILIES = Object.freeze(["learning", "classic"]);

export const ARCADE_EXPERIENCE_TYPES = Object.freeze([
  "game",
  "simulation",
  "mission",
  "challenge",
  "scenario",
  "practice",
]);

export const ARCADE_EXPERIENCE_LIFECYCLE_STATUSES = Object.freeze([
  "planned",
  "preview",
  "active",
  "retired",
]);

export const ARCADE_EXPERIENCE_RUNTIME_TYPES = Object.freeze([
  null,
  "internal",
  "external",
  "metaverse_bridge",
]);

export const ARCADE_EXPERIENCE_RELATIONSHIP_TYPES = Object.freeze([
  "none",
  "reference",
]);

export const ARCADE_EXPERIENCE_TREASURY_RELATIONSHIP_TYPES = Object.freeze([
  "none",
  "policy_reference",
]);

export const ARCADE_EXPERIENCE_PROVENANCE_CLASSIFICATIONS = Object.freeze([
  "canonical_descriptor",
  "legacy_adapter",
  "preview_only",
]);

// Phase 6 — optional creator/source provenance. Provenance describes origin only; it never
// grants publishing authority (publishing remains studio-registry-moderation).
export const ARCADE_EXPERIENCE_CREATOR_SOURCES = Object.freeze(["SYSTEM", "INSTRUCTOR", "AUTHORIZED_CREATOR", "PARTNER"]);

// Phase 6 — optional presentation support declarations (never accommodation records).
export const ARCADE_EXPERIENCE_ACCESSIBILITY_SUPPORTS = Object.freeze([
  "reducedMotionSupported", "keyboardSupported", "screenReaderSupported", "captionsSupported", "alternateInputSupported", "highContrastSupported",
]);

// Phase 6 — optional capability flags added to the existing capability block (absent = false).
export const ARCADE_EXPERIENCE_OPTIONAL_CAPABILITIES = Object.freeze(["missionLaunch", "replay", "achievementEligible"]);

export const ARCADE_EXPERIENCE_AUTHORITY_MAP = Object.freeze({
  arcadeDefinition: "arcade",
  arcadeAttemptResult: "arcade",
  curriculum: "curriculum",
  career: "career",
  evidence: "verified-evidence",
  truth: "truth-spine",
  economy: "treasury",
  identity: "identity",
  metaverse: "metaverse",
  agents: "agent-fabric",
  publishing: "studio-registry-moderation",
  mission: "mission-content",
  team: "mission-team",
  achievements: "arcade",
});

export const ARCADE_EXPERIENCE_DESCRIPTOR_FIELD_GROUPS = Object.freeze([
  "id",
  "slug",
  "activityReference",
  "product",
  "lifecycle",
  "launch",
  "presentation",
  "capabilities",
  "relationships",
  "accessibility",
  "provenance",
]);

export const ARCADE_EXPERIENCE_DESCRIPTOR_PURPOSE = Object.freeze([
  "discovery",
  "presentation",
  "launch/runtime metadata",
  "capability description",
  "references to authoritative external systems",
]);
