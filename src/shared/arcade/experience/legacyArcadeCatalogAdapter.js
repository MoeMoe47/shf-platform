import { validateArcadeExperienceDescriptor } from "./arcadeExperienceValidation.js";

function normalizeText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeDifficulty(value) {
  const difficulty = normalizeText(value);
  return difficulty ? difficulty.toLowerCase() : null;
}

function stringList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : value ?? null;
}

function legacyMetadata(game) {
  return {
    xpReward: game?.xpReward ?? null,
    polygonAction: game?.polygonAction ?? null,
    selTags: stringList(game?.selTags),
    workforceTags: stringList(game?.workforceTags),
    sourceRoute: game?.route ?? null,
  };
}

function createDescriptor({ game, family, experienceType, category, artwork }) {
  const id = normalizeText(game?.id);
  const sourceRoute = normalizeText(game?.route);
  const provenance = ["src/data/arcade.js"];
  if (sourceRoute) {
    provenance.push(`src/data/arcade.js:${sourceRoute}`);
  }

  const descriptor = {
    id: id ? `experience.${family}.${id}` : null,
    slug: id,
    activityReference: {
      arcadeActivityId: null,
    },
    product: {
      family,
      experienceType,
    },
    lifecycle: {
      status: "preview",
      launchable: false,
      playable: false,
    },
    launch: {
      route: null,
      runtimeType: null,
    },
    presentation: {
      title: normalizeText(game?.title),
      shortTitle: null,
      description: family === "learning" ? normalizeText(game?.subtitle) : null,
      category: normalizeText(category),
      difficulty: normalizeDifficulty(game?.difficulty),
      artwork: normalizeText(artwork),
      thumbnail: null,
    },
    capabilities: {
      leaderboardEligible: false,
      tournamentEligible: false,
      multiplayer: false,
      spectator: false,
      evidenceResultCapable: false,
    },
    relationships: {
      career: { relationshipType: "none", pathwayReferences: [] },
      metaverse: { relationshipType: "none", experienceReferences: [] },
      agentFabric: { relationshipType: "none", capabilityReferences: [] },
      treasury: { relationshipType: "none", rewardPolicyReference: null },
      studio: { relationshipType: "none", projectReferences: [] },
    },
    accessibility: {
      profileAware: false,
      reducedMotionRequired: false,
      keyboardRequired: false,
    },
    provenance: {
      classification: "legacy_adapter",
      migratedFrom: provenance,
    },
  };

  return descriptor;
}

function adapt(game, options) {
  const descriptor = createDescriptor({ game, ...options });
  const phase2AValidation = validateArcadeExperienceDescriptor(descriptor);
  const errors = [...phase2AValidation.errors];
  if (!descriptor.presentation.title) {
    errors.push("presentation.title is required for legacy catalog adaptation");
  }

  return {
    descriptor,
    legacyMetadata: options.family === "learning" ? legacyMetadata(game) : {
      sourceRoute: null,
      hue: game?.hue ?? null,
    },
    validation: {
      valid: errors.length === 0,
      errors,
    },
  };
}

export function adaptLegacyArcadeGame(game) {
  const experienceTypeById = {
    "debt-hunter": "game",
    "career-rush": "game",
    "client-sim": "simulation",
    "resume-quest": "game",
  };
  const experienceType = experienceTypeById[game?.id] ?? "game";
  return adapt(game, { family: "learning", experienceType, category: null, artwork: null });
}

export function adaptLegacyArcadeGames(games) {
  if (!Array.isArray(games)) {
    return [];
  }
  return games.map(adaptLegacyArcadeGame);
}

export function adaptLegacyDisplayGame(game, context = {}) {
  return adapt(game, {
    family: "classic",
    experienceType: "game",
    category: game?.tag ?? context.category ?? null,
    artwork: game?.art ?? null,
  });
}

export function adaptLegacyDisplaySections(sections) {
  if (!Array.isArray(sections)) {
    return [];
  }
  return sections.flatMap((section) =>
    Array.isArray(section?.items)
      ? section.items.map((game) => adaptLegacyDisplayGame(game, { sectionId: section.id }))
      : [],
  );
}
