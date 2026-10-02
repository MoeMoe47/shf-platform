import type { MissionDefinition, MissionFamily } from "../model/mission-definition.js";

function makeMission(input: {
  missionId: string;
  slug: string;
  family: MissionFamily;
  title: string;
  summary: string;
  objectiveTitle: string;
  objectiveDescription: string;
  objectiveType: MissionDefinition["objectives"][number]["type"];
  role: string;
  sensitivity?: "GENERAL" | "SENSITIVE" | "SUPERVISED";
}): MissionDefinition {
  return {
    missionId: input.missionId,
    slug: input.slug,
    version: 1,
    status: "DRAFT",
    family: input.family,
    title: input.title,
    summary: input.summary,
    intendedAudience: ["scenario participants"],
    difficulty: "INTRODUCTORY",
    roles: [input.role],
    objectives: [{
      objectiveId: "primary-objective",
      title: input.objectiveTitle,
      description: input.objectiveDescription,
      type: input.objectiveType,
      required: true,
      order: 1,
      completionRule: { type: "EVENT_OCCURRED", eventType: "objective-observed" },
      metadata: {},
    }],
    stages: [{
      stageId: "scenario-stage",
      title: "Scenario",
      description: "Work through the bounded scenario objective.",
      order: 1,
      objectiveIds: ["primary-objective"],
      entryConditions: [],
      exitConditions: [{ type: "OBJECTIVE_COMPLETE", objectiveId: "primary-objective" }],
      optional: false,
      timeLimitSeconds: null,
    }],
    successConditions: [{ type: "OBJECTIVE_COMPLETE", objectiveId: "primary-objective" }],
    failureConditions: [],
    environmentRefs: [],
    runtimeScorePolicy: "NONE",
    aiCapabilities: { missionDirector: false, adaptiveDifficulty: false, npcDialogue: false, scenarioVariation: false },
    accessibility: {
      reducedMotionSupported: true,
      captionsAvailable: true,
      audioDescriptionsAvailable: false,
      visualReliance: "OPTIONAL",
      audioReliance: "NONE",
      inputModes: ["keyboard", "pointer"],
    },
    safety: {
      classification: input.sensitivity || "GENERAL",
      contentSensitivity: [],
      notes: ["Scenario role is fictional and does not imply real-world licensure or authority."],
    },
    metadata: {},
  };
}

export const MISSION_DEFINITION_FIXTURES: MissionDefinition[] = [
  makeMission({
    missionId: "fixture-learning-systems-check",
    slug: "learning-systems-check",
    family: "LEARNING",
    title: "Systems Check",
    summary: "A bounded practice scenario for inspecting a learning environment.",
    objectiveTitle: "Inspect the environment",
    objectiveDescription: "Identify the visible system state in the scenario.",
    objectiveType: "INSPECT",
    role: "learner",
  }),
  makeMission({
    missionId: "fixture-classic-route-planning",
    slug: "classic-route-planning",
    family: "CLASSIC",
    title: "Route Planning",
    summary: "An entertainment-oriented navigation challenge with no learning outcome claim.",
    objectiveTitle: "Reach the waypoint",
    objectiveDescription: "Navigate the fictional course to the waypoint.",
    objectiveType: "REACH",
    role: "player",
  }),
  makeMission({
    missionId: "fixture-public-safety-alarm-response",
    slug: "public-safety-alarm-response",
    family: "PUBLIC_SAFETY",
    title: "High-Rise Alarm Response",
    summary: "A supervised, fictional coordination scenario about acknowledging an alarm and escalating to an authorized responder.",
    objectiveTitle: "Escalate the alarm",
    objectiveDescription: "Select the designated escalation path in the fictional scenario.",
    objectiveType: "RESPOND",
    role: "dispatcher-trainee",
    sensitivity: "SUPERVISED",
  }),
  makeMission({
    missionId: "fixture-healthcare-patient-intake",
    slug: "healthcare-patient-intake",
    family: "HEALTHCARE",
    title: "Patient Intake and Specimen Collection",
    summary: "A fictional supervised workflow scenario; it is not clinical guidance or a credentialing activity.",
    objectiveTitle: "Review the intake sequence",
    objectiveDescription: "Order the provided fictional intake steps for discussion.",
    objectiveType: "OPERATE",
    role: "nurse-aide-trainee",
    sensitivity: "SENSITIVE",
  }),
  makeMission({
    missionId: "fixture-infrastructure-cooling-response",
    slug: "infrastructure-cooling-response",
    family: "INFRASTRUCTURE",
    title: "Cooling System Fault Response",
    summary: "A simulated data-center cooling observation and escalation exercise with no connection to live infrastructure.",
    objectiveTitle: "Report the cooling observation",
    objectiveDescription: "Select a fictional observation and report it through the scenario interface.",
    objectiveType: "REPORT",
    role: "operator-trainee",
  }),
];

// Phase 4G reference Mission: the existing data-center cooling fixture, bound to declared
// Metaverse context. Exported separately so the 4A fixture set is unchanged. Every provider
// behind it is SIMULATED (Phase 4F.5 audit); allowSimulatedContext opts in explicitly.
export const MISSION_WORLD_REFERENCE_FIXTURE: MissionDefinition = (() => {
  const base = MISSION_DEFINITION_FIXTURES.find((item) => item.missionId === "fixture-infrastructure-cooling-response")!;
  const value: MissionDefinition = JSON.parse(JSON.stringify(base));
  value.missionId = "fixture-infrastructure-world-response";
  value.slug = "infrastructure-world-response";
  value.title = "Data Center Power Event Response";
  value.summary = "A simulated data-center exercise that observes declared Metaverse power context. No live infrastructure is connected.";
  value.environmentRefs = [
    { system: "metaverse", environmentId: "main-data-center", required: true },
    { system: "metaverse", environmentId: "cooling-mechanical-plant", required: false },
  ];
  value.metaverseContext = {
    scenarioId: "INFRASTRUCTURE_FAILURE",
    requiredCapabilities: ["POWER_CONTEXT"],
    optionalCapabilities: ["DATA_CENTER_CONTEXT", "WEATHER_CONTEXT"],
    allowSimulatedContext: true,
    requiredUnavailablePolicy: "BLOCK_START",
  };
  value.aiCapabilities = { missionDirector: true, adaptiveDifficulty: false, npcDialogue: true, scenarioVariation: false };
  value.characters = [{
    characterId: "shift-supervisor", displayName: "Shift Supervisor", characterType: "SUPERVISOR", simulatedRole: "Simulated data-center shift supervisor",
    allowedBehaviors: ["SPEAK"], knowledgeScope: "CURRENT_STAGE", dialogueMode: "SCRIPTED_ONLY",
    scriptedLines: [{ lineId: "check-power", text: "Check the power feed before you report." }], scenarioFacts: [], availableStageIds: [],
  }];
  return value;
})();
