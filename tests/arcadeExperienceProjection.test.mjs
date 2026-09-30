import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateArcadeExperienceDescriptor } from "../src/shared/arcade/experience/arcadeExperienceValidation.js";
import {
  createArcadeExperienceProjection,
  createArcadeExperienceProjections,
} from "../src/shared/arcade/experience/arcadeExperienceProjection.js";
import {
  listClassicExperiences,
  listEvidenceResultCapableExperiences,
  listExperiencesByFamily,
  listLaunchableExperiences,
  listLearningExperiences,
  listPlayableExperiences,
} from "../src/shared/arcade/experience/arcadeExperienceSelectors.js";

const experienceFiles = [
  "../src/shared/arcade/experience/arcadeExperienceDescriptor.js",
  "../src/shared/arcade/experience/arcadeExperienceValidation.js",
  "../src/shared/arcade/experience/arcadeExperienceProjection.js",
  "../src/shared/arcade/experience/arcadeExperienceSelectors.js",
];

function baseDescriptor(overrides = {}) {
  return {
    id: "experience.learning.eco-city",
    slug: "eco-city",
    activityReference: {
      arcadeActivityId: "arcade-activity-eco-city",
    },
    product: {
      family: "learning",
      experienceType: "simulation",
    },
    lifecycle: {
      status: "active",
      launchable: true,
      playable: true,
    },
    launch: {
      route: "/arcade/learning/eco-city",
      runtimeType: "internal",
    },
    presentation: {
      title: "Eco City Simulation",
      shortTitle: "Eco City",
      description: "Balance energy, transit, and civic needs.",
      category: "Civic Systems",
      difficulty: "intermediate",
      artwork: "/assets/arcade/eco-city-hero.jpg",
      thumbnail: "/assets/arcade/eco-city-thumb.jpg",
    },
    capabilities: {
      leaderboardEligible: false,
      tournamentEligible: false,
      multiplayer: false,
      spectator: false,
      evidenceResultCapable: true,
    },
    relationships: {
      career: {
        relationshipType: "reference",
        pathwayReferences: ["career.pathway.civic-tech"],
      },
      metaverse: {
        relationshipType: "reference",
        experienceReferences: ["metaverse.learning-arcade-district"],
      },
      agentFabric: {
        relationshipType: "reference",
        capabilityReferences: ["agent.capability.simulation-coach"],
      },
      treasury: {
        relationshipType: "policy_reference",
        rewardPolicyReference: "treasury.policy.arcade.learning.standard",
      },
      studio: {
        relationshipType: "reference",
        projectReferences: ["studio.project.eco-city"],
      },
    },
    accessibility: {
      profileAware: true,
      reducedMotionRequired: false,
      keyboardRequired: true,
    },
    provenance: {
      classification: "canonical_descriptor",
      migratedFrom: [],
    },
    ...overrides,
  };
}

function validClassicPreviewDescriptor() {
  return baseDescriptor({
    id: "experience.classic.orbit-defender",
    slug: "orbit-defender",
    activityReference: {
      arcadeActivityId: null,
    },
    product: {
      family: "classic",
      experienceType: "game",
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
    capabilities: {
      leaderboardEligible: false,
      tournamentEligible: false,
      multiplayer: false,
      spectator: false,
      evidenceResultCapable: false,
    },
    relationships: {
      career: {
        relationshipType: "none",
        pathwayReferences: [],
      },
      metaverse: {
        relationshipType: "none",
        experienceReferences: [],
      },
      agentFabric: {
        relationshipType: "none",
        capabilityReferences: [],
      },
      treasury: {
        relationshipType: "none",
        rewardPolicyReference: null,
      },
      studio: {
        relationshipType: "none",
        projectReferences: [],
      },
    },
    provenance: {
      classification: "preview_only",
      migratedFrom: ["src/data/arcade.js"],
    },
  });
}

test("valid Learning descriptor passes validation", () => {
  const result = validateArcadeExperienceDescriptor(baseDescriptor());

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("valid Classic preview descriptor without activity id passes validation", () => {
  const result = validateArcadeExperienceDescriptor(validClassicPreviewDescriptor());

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("playable without launchable fails", () => {
  const result = validateArcadeExperienceDescriptor(
    baseDescriptor({
      lifecycle: {
        status: "active",
        launchable: false,
        playable: true,
      },
    }),
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /playable=true requires lifecycle\.launchable=true/);
});

test("launchable without route fails", () => {
  const result = validateArcadeExperienceDescriptor(
    baseDescriptor({
      launch: {
        route: null,
        runtimeType: "internal",
      },
    }),
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /launchable=true requires launch\.route/);
});

test("launchable with empty route fails", () => {
  const result = validateArcadeExperienceDescriptor(
    baseDescriptor({
      launch: {
        route: "   ",
        runtimeType: "internal",
      },
    }),
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /launchable=true requires launch\.route/);
});

test("evidenceResultCapable without arcadeActivityId fails", () => {
  const result = validateArcadeExperienceDescriptor(
    baseDescriptor({
      activityReference: {
        arcadeActivityId: null,
      },
    }),
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /evidenceResultCapable=true requires activityReference\.arcadeActivityId/);
});

test("prohibited field masteryAchieved fails", () => {
  const result = validateArcadeExperienceDescriptor(
    baseDescriptor({
      masteryAchieved: true,
    }),
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /masteryAchieved.*prohibited/);
});

test("prohibited field verifiedEvidence fails", () => {
  const result = validateArcadeExperienceDescriptor(
    baseDescriptor({
      capabilities: {
        ...baseDescriptor().capabilities,
        verifiedEvidence: true,
      },
    }),
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /verifiedEvidence.*prohibited/);
});

test("prohibited reward field fails", () => {
  const result = validateArcadeExperienceDescriptor(
    baseDescriptor({
      relationships: {
        ...baseDescriptor().relationships,
        treasury: {
          relationshipType: "policy_reference",
          rewardPolicyReference: "treasury.policy.arcade.learning.standard",
          rewardEarned: true,
        },
      },
    }),
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /rewardEarned.*prohibited/);
});

test("descriptor-owned Curriculum linkage fails validation", () => {
  const result = validateArcadeExperienceDescriptor(
    baseDescriptor({
      relationships: {
        ...baseDescriptor().relationships,
        curriculum: {
          relationshipType: "reference",
          arcadeActivityId: "arcade-activity-eco-city",
        },
      },
    }),
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /relationships\.curriculum is prohibited/);
});

test("projection preserves ArcadeActivity when supplied", () => {
  const descriptor = baseDescriptor();
  const arcadeActivity = {
    id: "arcade-activity-eco-city",
    deterministic_policy: { masteryScore: 0.8 },
  };

  const projection = createArcadeExperienceProjection(descriptor, arcadeActivity);

  assert.equal(projection.descriptor, descriptor);
  assert.equal(projection.arcadeActivity, arcadeActivity);
  assert.equal(projection.resolution.arcadeActivity, "resolved");
  assert.equal(projection.unresolved.arcadeActivityReference, null);
  assert.equal(projection.mismatch.arcadeActivityReference, null);
});

test("unresolved activity reference is surfaced, not fabricated", () => {
  const descriptor = baseDescriptor();
  const projection = createArcadeExperienceProjection(descriptor);

  assert.equal(projection.arcadeActivity, null);
  assert.equal(projection.resolution.arcadeActivity, "unresolved");
  assert.deepEqual(projection.unresolved.arcadeActivityReference, {
    arcadeActivityId: "arcade-activity-eco-city",
  });
});

test("activity reference mismatch fails closed", () => {
  const projection = createArcadeExperienceProjection(baseDescriptor(), {
    id: "arcade-activity-different",
  });

  assert.equal(projection.arcadeActivity, null);
  assert.equal(projection.resolution.arcadeActivity, "mismatch");
  assert.deepEqual(projection.mismatch.arcadeActivityReference, {
    arcadeActivityId: "arcade-activity-eco-city",
    suppliedArcadeActivityId: "arcade-activity-different",
  });
});

test("projection marks activity reference not applicable when no reference or activity exists", () => {
  const projection = createArcadeExperienceProjection(validClassicPreviewDescriptor());

  assert.equal(projection.arcadeActivity, null);
  assert.equal(projection.resolution.arcadeActivity, "not_applicable");
  assert.equal(projection.unresolved.arcadeActivityReference, null);
  assert.equal(projection.mismatch.arcadeActivityReference, null);
});

test("selectors do not mutate data", () => {
  const descriptors = [baseDescriptor(), validClassicPreviewDescriptor()];
  const before = JSON.stringify(descriptors);

  listLaunchableExperiences(descriptors);
  listPlayableExperiences(descriptors);
  listEvidenceResultCapableExperiences(descriptors);
  listLearningExperiences(descriptors);
  listClassicExperiences(descriptors);

  assert.equal(JSON.stringify(descriptors), before);
});

test("family filtering works", () => {
  const descriptors = [baseDescriptor(), validClassicPreviewDescriptor()];
  const projections = createArcadeExperienceProjections(descriptors, {
    "arcade-activity-eco-city": { id: "arcade-activity-eco-city" },
  });

  assert.deepEqual(
    listExperiencesByFamily(descriptors, "learning").map((experience) => experience.id),
    ["experience.learning.eco-city"],
  );
  assert.deepEqual(
    listClassicExperiences(projections).map((experience) => experience.experienceId),
    ["experience.classic.orbit-defender"],
  );
});

test("no external authority ownership is reassigned", () => {
  const projection = createArcadeExperienceProjection(baseDescriptor());

  assert.equal(projection.authority.arcadeDefinition, "arcade");
  assert.equal(projection.authority.arcadeAttemptResult, "arcade");
  assert.equal(projection.authority.curriculum, "curriculum");
  assert.equal(projection.authority.career, "career");
  assert.equal(projection.authority.evidence, "verified-evidence");
  assert.equal(projection.authority.truth, "truth-spine");
  assert.equal(projection.authority.economy, "treasury");
  assert.equal(projection.authority.identity, "identity");
  assert.equal(projection.authority.metaverse, "metaverse");
  assert.equal(projection.authority.agents, "agent-fabric");
  assert.equal(projection.authority.publishing, "studio-registry-moderation");
});

test("no descriptor helper writes localStorage", () => {
  const source = experienceFiles
    .map((filePath) => readFileSync(new URL(filePath, import.meta.url), "utf8"))
    .join("\n");

  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/);
});

test("descriptor helpers do not import external authority implementation modules", () => {
  const importLines = experienceFiles.flatMap((filePath) => {
    const source = readFileSync(new URL(filePath, import.meta.url), "utf8");
    return source.split("\n").filter((line) => /^\s*import\s/.test(line));
  });

  assert.deepEqual(
    importLines.filter((line) =>
      /treasury|truth|spine|curriculum|career|metaverse|agent|fabric|verified|evidence|studio|reward/i.test(line),
    ),
    [],
  );
});
