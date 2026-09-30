import {
  ARCADE_EXPERIENCE_FAMILIES,
  ARCADE_EXPERIENCE_LIFECYCLE_STATUSES,
  ARCADE_EXPERIENCE_PROVENANCE_CLASSIFICATIONS,
  ARCADE_EXPERIENCE_RUNTIME_TYPES,
  ARCADE_EXPERIENCE_TREASURY_RELATIONSHIP_TYPES,
  ARCADE_EXPERIENCE_TYPES,
} from "./arcadeExperienceDescriptor.js";

const PROHIBITED_AUTHORITY_FIELDS = Object.freeze([
  "mastered",
  "masteryAchieved",
  "mastery_achieved",
  "verified",
  "verifiedEvidence",
  "verified_evidence",
  "completed",
  "completion",
  "credentialIssued",
  "credential_issued",
  "careerReady",
  "career_ready",
  "rewardEarned",
  "reward_earned",
  "walletBalance",
  "wallet_balance",
  "shfDollars",
  "shf_dollars",
  "xpBalance",
  "xp_balance",
  "evuBalance",
  "evu_balance",
  "creditScore",
  "credit_score",
  "employmentEligible",
  "employment_eligible",
]);

const EXTERNAL_OUTCOME_TRUTH_FIELDS = Object.freeze([
  "arcadeResult",
  "arcade_results",
  "attemptResult",
  "result",
  "resulted",
  "evidence",
  "evidenceVerified",
  "truthFact",
  "truthSpineFact",
  "curriculumComplete",
  "lessonComplete",
  "careerReadiness",
  "metaverseComplete",
  "identityVerified",
  "agentPolicyDecision",
  "treasuryTransaction",
]);

const REQUIRED_STRING_PATHS = Object.freeze(["id", "slug"]);

const RELATIONSHIP_ARRAY_PATHS = Object.freeze([
  ["relationships", "career", "pathwayReferences"],
  ["relationships", "metaverse", "experienceReferences"],
  ["relationships", "agentFabric", "capabilityReferences"],
  ["relationships", "studio", "projectReferences"],
  ["provenance", "migratedFrom"],
]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getPathValue(source, path) {
  return path.reduce((current, key) => (current == null ? undefined : current[key]), source);
}

function addRequiredStringError(errors, descriptor, path) {
  const value = getPathValue(descriptor, path.split("."));
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${path} is required`);
  }
}

function addVocabularyError(errors, value, allowed, path) {
  if (!allowed.includes(value)) {
    errors.push(`${path} must be one of: ${allowed.map((item) => String(item)).join(", ")}`);
  }
}

function addStringArrayError(errors, descriptor, path) {
  const value = getPathValue(descriptor, path);
  const readablePath = path.join(".");
  if (!Array.isArray(value)) {
    errors.push(`${readablePath} must be an array of strings`);
    return;
  }

  value.forEach((item, index) => {
    if (typeof item !== "string") {
      errors.push(`${readablePath}[${index}] must be a string`);
    }
  });
}

function collectObjectFieldNames(value, path = [], names = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectObjectFieldNames(item, [...path, String(index)], names));
    return names;
  }

  if (!isObject(value)) {
    return names;
  }

  Object.keys(value).forEach((key) => {
    const nextPath = [...path, key];
    names.push({ key, path: nextPath.join(".") });
    collectObjectFieldNames(value[key], nextPath, names);
  });

  return names;
}

function addProhibitedFieldErrors(errors, descriptor) {
  const prohibited = new Set([...PROHIBITED_AUTHORITY_FIELDS, ...EXTERNAL_OUTCOME_TRUTH_FIELDS]);

  collectObjectFieldNames(descriptor).forEach(({ key, path }) => {
    if (prohibited.has(key)) {
      errors.push(`${path} is an authority/outcome field and is prohibited in Arcade experience descriptors`);
    }
  });
}

function validateRelationshipType(errors, descriptor, path, allowedTypes) {
  const value = getPathValue(descriptor, path);
  const readablePath = path.join(".");
  if (!allowedTypes.includes(value)) {
    errors.push(`${readablePath} must be one of: ${allowedTypes.join(", ")}`);
  }
}

export function validateArcadeExperienceDescriptor(descriptor) {
  const errors = [];

  if (!isObject(descriptor)) {
    return { valid: false, errors: ["descriptor must be an object"] };
  }

  REQUIRED_STRING_PATHS.forEach((path) => addRequiredStringError(errors, descriptor, path));

  const arcadeActivityId = descriptor.activityReference?.arcadeActivityId ?? null;
  if (arcadeActivityId !== null && typeof arcadeActivityId !== "string") {
    errors.push("activityReference.arcadeActivityId must be a string or null");
  }

  addVocabularyError(errors, descriptor.product?.family, ARCADE_EXPERIENCE_FAMILIES, "product.family");
  addVocabularyError(errors, descriptor.product?.experienceType, ARCADE_EXPERIENCE_TYPES, "product.experienceType");
  addVocabularyError(errors, descriptor.lifecycle?.status, ARCADE_EXPERIENCE_LIFECYCLE_STATUSES, "lifecycle.status");
  addVocabularyError(errors, descriptor.launch?.runtimeType, ARCADE_EXPERIENCE_RUNTIME_TYPES, "launch.runtimeType");

  if (typeof descriptor.lifecycle?.launchable !== "boolean") {
    errors.push("lifecycle.launchable must be boolean");
  }

  if (typeof descriptor.lifecycle?.playable !== "boolean") {
    errors.push("lifecycle.playable must be boolean");
  }

  if (descriptor.lifecycle?.playable === true && descriptor.lifecycle?.launchable !== true) {
    errors.push("lifecycle.playable=true requires lifecycle.launchable=true");
  }

  if (
    descriptor.lifecycle?.launchable === true &&
    (typeof descriptor.launch?.route !== "string" || descriptor.launch.route.trim().length === 0)
  ) {
    errors.push("lifecycle.launchable=true requires launch.route");
  }

  if (descriptor.capabilities?.evidenceResultCapable === true && !arcadeActivityId) {
    errors.push("capabilities.evidenceResultCapable=true requires activityReference.arcadeActivityId");
  }

  if (
    descriptor.product?.family === "learning" &&
    descriptor.capabilities?.evidenceResultCapable === true &&
    !arcadeActivityId
  ) {
    errors.push("learning evidence-result-capable experiences require activityReference.arcadeActivityId");
  }

  [
    "leaderboardEligible",
    "tournamentEligible",
    "multiplayer",
    "spectator",
    "evidenceResultCapable",
  ].forEach((key) => {
    if (typeof descriptor.capabilities?.[key] !== "boolean") {
      errors.push(`capabilities.${key} must be boolean`);
    }
  });

  ["profileAware", "reducedMotionRequired", "keyboardRequired"].forEach((key) => {
    if (typeof descriptor.accessibility?.[key] !== "boolean") {
      errors.push(`accessibility.${key} must be boolean`);
    }
  });

  if (descriptor.relationships && Object.hasOwn(descriptor.relationships, "curriculum")) {
    errors.push("relationships.curriculum is prohibited; resolve Curriculum Lesson linkage through curriculum_lesson_arcade_activities");
  }

  validateRelationshipType(
    errors,
    descriptor,
    ["relationships", "career", "relationshipType"],
    ["none", "reference"],
  );
  validateRelationshipType(
    errors,
    descriptor,
    ["relationships", "metaverse", "relationshipType"],
    ["none", "reference"],
  );
  validateRelationshipType(
    errors,
    descriptor,
    ["relationships", "agentFabric", "relationshipType"],
    ["none", "reference"],
  );
  validateRelationshipType(
    errors,
    descriptor,
    ["relationships", "treasury", "relationshipType"],
    ARCADE_EXPERIENCE_TREASURY_RELATIONSHIP_TYPES,
  );
  validateRelationshipType(
    errors,
    descriptor,
    ["relationships", "studio", "relationshipType"],
    ["none", "reference"],
  );

  const rewardPolicyReference = descriptor.relationships?.treasury?.rewardPolicyReference ?? null;
  if (rewardPolicyReference !== null && typeof rewardPolicyReference !== "string") {
    errors.push("relationships.treasury.rewardPolicyReference must be a string or null");
  }

  RELATIONSHIP_ARRAY_PATHS.forEach((path) => addStringArrayError(errors, descriptor, path));

  addVocabularyError(
    errors,
    descriptor.provenance?.classification,
    ARCADE_EXPERIENCE_PROVENANCE_CLASSIFICATIONS,
    "provenance.classification",
  );

  addProhibitedFieldErrors(errors, descriptor);

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const ARCADE_EXPERIENCE_PROHIBITED_AUTHORITY_FIELDS = PROHIBITED_AUTHORITY_FIELDS;
export const ARCADE_EXPERIENCE_EXTERNAL_OUTCOME_TRUTH_FIELDS = EXTERNAL_OUTCOME_TRUTH_FIELDS;
