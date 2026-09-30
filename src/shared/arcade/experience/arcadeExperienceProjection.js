import { ARCADE_EXPERIENCE_AUTHORITY_MAP } from "./arcadeExperienceDescriptor.js";

function hasActivityReference(descriptor) {
  return Boolean(descriptor?.activityReference?.arcadeActivityId);
}

function resolveArcadeActivityReference(arcadeActivityId, arcadeActivity) {
  if (!arcadeActivityId && !arcadeActivity) {
    return "not_applicable";
  }

  if (arcadeActivityId && !arcadeActivity) {
    return "unresolved";
  }

  if (arcadeActivityId && arcadeActivity?.id === arcadeActivityId) {
    return "resolved";
  }

  return "mismatch";
}

export function createArcadeExperienceProjection(descriptor, arcadeActivity = null) {
  const arcadeActivityId = descriptor?.activityReference?.arcadeActivityId ?? null;
  const arcadeActivityResolution = resolveArcadeActivityReference(arcadeActivityId, arcadeActivity);
  const unresolvedArcadeActivityReference = arcadeActivityResolution === "unresolved";
  const mismatchedArcadeActivityReference = arcadeActivityResolution === "mismatch";

  return {
    experienceId: descriptor?.id ?? null,
    slug: descriptor?.slug ?? null,
    descriptor,
    arcadeActivity: arcadeActivityResolution === "resolved" ? arcadeActivity : null,
    resolution: {
      arcadeActivity: arcadeActivityResolution,
    },
    unresolved: {
      arcadeActivityReference: unresolvedArcadeActivityReference
        ? {
            arcadeActivityId,
          }
        : null,
    },
    mismatch: {
      arcadeActivityReference: mismatchedArcadeActivityReference
        ? {
            arcadeActivityId,
            suppliedArcadeActivityId: arcadeActivity?.id ?? null,
          }
        : null,
    },
    hasArcadeActivityReference: hasActivityReference(descriptor),
    authority: ARCADE_EXPERIENCE_AUTHORITY_MAP,
  };
}

export function createArcadeExperienceProjections(descriptors, arcadeActivitiesById = {}) {
  return descriptors.map((descriptor) => {
    const arcadeActivityId = descriptor?.activityReference?.arcadeActivityId ?? null;
    return createArcadeExperienceProjection(descriptor, arcadeActivityId ? arcadeActivitiesById[arcadeActivityId] : null);
  });
}
