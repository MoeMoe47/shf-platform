// Phase 7 — canonical authored Mission source content (Silicon Heartland Data Center Community & Workforce
// Initiative). This is source material, not a publication: it reaches an organization only through the existing
// Mission Content workflow (Studio draft → review → publish), which assigns the exact published version. No
// second Mission engine, catalog or runtime exists here.
//
// Simulation only. Roles are simulation roles and imply no occupational qualification, licensure or authority.
// No real electrical, mechanical, HVAC or controls procedure is taught; every action is a declared, bounded,
// simulated decision. World context comes from MOL's SIMULATED power provider; the data-center system is
// UNAVAILABLE (PLANNED) and is consumed only as optional context, reported honestly.
import type { MissionDefinition } from "../model/mission-definition.js";

export const DATA_CENTER_COOLING_MISSION_ID = "data-center-cooling-failure-response";
export const DATA_CENTER_COOLING_MISSION_VERSION = 1;
export const DATA_CENTER_COOLING_ARCADE_ACTIVITY_ID = "arcade_activity_data_center_cooling_incident_v1";

const roleObjective = (objectiveId: string, order: number, title: string, description: string, type: MissionDefinition["objectives"][number]["type"],
  eventType: string, missionRole: string, required = true) => ({
  objectiveId, title, description, type, required, order,
  completionRule: { type: "ROLE_EVENT_OCCURRED" as const, eventType, missionRole },
  metadata: {},
});

export const DATA_CENTER_COOLING_FAILURE_RESPONSE_V1: MissionDefinition = Object.freeze({
  missionId: DATA_CENTER_COOLING_MISSION_ID,
  slug: DATA_CENTER_COOLING_MISSION_ID,
  version: DATA_CENTER_COOLING_MISSION_VERSION,
  status: "DRAFT",
  family: "INFRASTRUCTURE",
  title: "Data Center Cooling Failure Response",
  summary: "A simulated team exercise: a power event at the facility causes a cooling failure in the data hall. "
    + "The team acknowledges the alarm, diagnoses the cooling fault, verifies the power path, and applies a bounded simulated response. "
    + "No live infrastructure is connected.",
  intendedAudience: ["secondary learners", "adult learners"],
  difficulty: "INTRODUCTORY",
  roles: ["facility-technician-trainee", "electrical-technician-trainee", "incident-coordinator-trainee"],
  objectives: [
    roleObjective("acknowledge-cooling-alarm", 1, "Acknowledge the cooling alarm", "Acknowledge the simulated high-temperature alarm in the data hall.", "OBSERVE",
      "cooling-alarm-acknowledged", "FACILITY_TECHNICIAN"),
    roleObjective("diagnose-cooling-fault", 2, "Diagnose the cooling fault", "Use the simulated monitoring view to identify which cooling unit stopped and why.", "INSPECT",
      "cooling-fault-diagnosed", "FACILITY_TECHNICIAN"),
    roleObjective("verify-power-path", 3, "Verify the power path", "Confirm in the simulation which upstream power event affected the cooling plant.", "INSPECT",
      "power-path-verified", "ELECTRICAL_TECHNICIAN"),
    roleObjective("confirm-backup-power", 4, "Confirm backup power status", "Check the simulated UPS and generator status before any response.", "INSPECT",
      "backup-power-confirmed", "ELECTRICAL_TECHNICIAN"),
    roleObjective("apply-simulated-response", 5, "Apply the simulated response", "Select the runbook step that brings redundant cooling online in the simulation.", "RESPOND",
      "simulated-redundant-cooling-engaged", "FACILITY_TECHNICIAN"),
    roleObjective("report-incident-status", 6, "Report incident status", "Report the incident status to the simulated shift supervisor.", "REPORT",
      "incident-status-reported", "INCIDENT_COORDINATOR", false),
    roleObjective("escalate-incident", 7, "Escalate if needed", "Escalate the incident to the simulated supervisor when the response is not confirmed.", "REPORT",
      "incident-escalated", "INCIDENT_COORDINATOR", false),
  ],
  stages: [
    {
      stageId: "detect-and-diagnose", title: "Detect and diagnose", description: "Recognize the alarm and find the cause.", order: 1,
      objectiveIds: ["acknowledge-cooling-alarm", "diagnose-cooling-fault", "verify-power-path"], entryConditions: [],
      exitConditions: [
        { type: "OBJECTIVE_COMPLETE", objectiveId: "acknowledge-cooling-alarm" },
        { type: "OBJECTIVE_COMPLETE", objectiveId: "diagnose-cooling-fault" },
        { type: "OBJECTIVE_COMPLETE", objectiveId: "verify-power-path" },
      ],
      optional: false, timeLimitSeconds: null,
    },
    {
      stageId: "respond-and-stabilize", title: "Respond and stabilize", description: "Apply the bounded simulated response and communicate status.", order: 2,
      objectiveIds: ["confirm-backup-power", "apply-simulated-response", "report-incident-status", "escalate-incident"],
      entryConditions: [{ type: "STAGE_COMPLETE", stageId: "detect-and-diagnose" }],
      exitConditions: [
        { type: "OBJECTIVE_COMPLETE", objectiveId: "confirm-backup-power" },
        { type: "OBJECTIVE_COMPLETE", objectiveId: "apply-simulated-response" },
      ],
      optional: false, timeLimitSeconds: null,
    },
  ],
  successConditions: [
    { type: "OBJECTIVE_COMPLETE", objectiveId: "acknowledge-cooling-alarm" },
    { type: "OBJECTIVE_COMPLETE", objectiveId: "diagnose-cooling-fault" },
    { type: "OBJECTIVE_COMPLETE", objectiveId: "verify-power-path" },
    { type: "OBJECTIVE_COMPLETE", objectiveId: "confirm-backup-power" },
    { type: "OBJECTIVE_COMPLETE", objectiveId: "apply-simulated-response" },
  ],
  failureConditions: [],
  environmentRefs: [
    { system: "metaverse", environmentId: "main-data-center", required: true },
    { system: "metaverse", environmentId: "cooling-mechanical-plant", required: true },
    { system: "metaverse", environmentId: "power-electrical-facility", required: false },
  ],
  arcadeActivityId: DATA_CENTER_COOLING_ARCADE_ACTIVITY_ID,
  runtimeScorePolicy: "NONE",
  aiCapabilities: { missionDirector: false, adaptiveDifficulty: false, npcDialogue: true, scenarioVariation: false },
  accessibility: {
    reducedMotionSupported: true,
    captionsAvailable: true,
    audioDescriptionsAvailable: false,
    visualReliance: "OPTIONAL",
    audioReliance: "NONE",
    inputModes: ["keyboard", "pointer"],
  },
  safety: {
    classification: "GENERAL",
    contentSensitivity: [],
    notes: [
      "Simulation only: no real electrical, mechanical, HVAC or controls procedure is taught or authorized.",
      "Simulation roles do not imply real-world licensure, qualification or authority.",
      "Never act on real equipment based on this exercise; real facilities require authorized, trained personnel.",
    ],
  },
  metaverseContext: {
    scenarioId: "INFRASTRUCTURE_FAILURE",
    requiredCapabilities: ["POWER_CONTEXT"],
    optionalCapabilities: ["DATA_CENTER_CONTEXT"],
    allowSimulatedContext: true,
    requiredUnavailablePolicy: "BLOCK_START",
  },
  characters: [{
    characterId: "shift-supervisor", displayName: "Shift Supervisor", characterType: "SUPERVISOR", simulatedRole: "Simulated data-center shift supervisor",
    allowedBehaviors: ["SPEAK"], knowledgeScope: "CURRENT_STAGE", dialogueMode: "SCRIPTED_ONLY",
    scriptedLines: [
      { lineId: "check-power", text: "Before you report, check what happened upstream on the power side." },
      { lineId: "no-real-equipment", text: "Remember: this is a simulation. Real equipment is only handled by authorized staff." },
    ],
    scenarioFacts: [], availableStageIds: [],
  }],
  multiplayer: {
    enabled: true, minParticipants: 2, maxParticipants: 3, teamMode: "SINGLE_TEAM", lateJoinPolicy: "NONE",
    roles: [
      { roleId: "FACILITY_TECHNICIAN", label: "Facility Technician (simulation role)", required: true, maxParticipants: 1 },
      { roleId: "ELECTRICAL_TECHNICIAN", label: "Electrical Technician (simulation role)", required: true, maxParticipants: 1 },
      { roleId: "INCIDENT_COORDINATOR", label: "Incident Coordinator (simulation role)", required: false, maxParticipants: 1 },
    ],
  },
  metadata: {},
} as MissionDefinition);

export const CANONICAL_MISSION_SOURCES: readonly MissionDefinition[] = Object.freeze([DATA_CENTER_COOLING_FAILURE_RESPONSE_V1]);
