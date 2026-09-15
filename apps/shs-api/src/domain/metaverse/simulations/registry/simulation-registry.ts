// MET-13 — canonical simulation/activity catalog.
//
// Every entry here has a matching MET-2 MetaverseActivity in
// ../../registry/city-registry.ts (added additively, alongside the
// existing 5 activities from MET-2/MET-7) with the identical id,
// district_id, and facility_id. Runtime entry, unlock projection, and
// protected-entry security all continue to flow through the existing
// MET-3/MET-5 machinery keyed by that shared id — this registry adds the
// MET-13 task/retry/evidence/team/accessibility shape only.
//
// Coverage: every canonical MET-2 district has at least one simulation
// here (§10/§45 of the MET-13 build brief). Four are flagship, multi-step
// simulations (§20): DATA CENTER OPERATIONS, AI AGENT BUILD/TEST, STUDENT
// ENTERPRISE PROJECT DELIVERY, and CITY INFRASTRUCTURE/BUDGET TRADEOFF.

import { METAVERSE_DISTRICT_IDS, SILICON_HEARTLAND_CITY_REGISTRY } from "../../registry/city-registry.js";
import type {
  SimulationAccessibleAlternative,
  SimulationDefinition,
  SimulationRetryModel,
  SimulationTaskStep,
} from "../model/simulation-contract.js";
import { validateSimulationDefinition } from "../model/simulation-contract.js";

function step(stepId: string, title: string, instructions: string, expectedAction: string, isOptional = false): SimulationTaskStep {
  return { stepId, title, instructions, expectedAction, isOptional };
}

function retry(policy: SimulationRetryModel["policy"], maxAttempts: number | null, notes: string): SimulationRetryModel {
  return { policy, maxAttempts, notes };
}

function accessible(nonSpatialAlternative: string, timedInteractionAccommodation: string | null = null): SimulationAccessibleAlternative {
  return {
    keyboardOperable: true,
    screenReaderEquivalent: true,
    reducedMotionSupported: true,
    colorIndependentState: true,
    nonSpatialAlternative,
    mobileTabletSupported: true,
    timedInteractionAccommodation,
  };
}

const SIMULATIONS: SimulationDefinition[] = [
  // ---- Data Center District: flagship #1 ------------------------------
  {
    simulationId: "data-center-operations-simulation",
    activityId: "data-center-operations-simulation",
    title: "Data Center Operations: Rack to Recovery",
    summary: "Configure a server rack, balance cooling load, plan power redundancy, and triage a simulated outage in sequence.",
    districtId: METAVERSE_DISTRICT_IDS.dataCenter,
    facilityId: "main-data-center",
    simulationType: "OPERATIONS_SIMULATION",
    sourceType: "CURRICULUM_LESSON",
    sourceRef: "src/content/lessons/data-center-foundations-student/",
    isFlagship: true,
    programId: null,
    careerPathwayId: "data-center-ai-infrastructure",
    lessonId: "data-center-foundations-introduction",
    assignmentId: null,
    missionProjectionId: null,
    difficulty: "STANDARD",
    participationMode: "EITHER",
    prerequisites: ["Membership in the organization; Data Center Foundations enrollment recommended but not required."],
    objective: "Practice the operational reasoning behind rack configuration, cooling balance, power redundancy, and outage response without touching real infrastructure.",
    instructions: "Work through each operations step in order. Each step presents a scenario and a small set of configuration choices; there is no single hidden correct answer, but each choice has a stated tradeoff you must acknowledge before continuing.",
    taskSteps: [
      step("rack-configuration", "Configure the server rack", "Choose a rack layout that balances density against airflow clearance.", "select_rack_layout_choice"),
      step("cooling-balance", "Balance the cooling system", "Given the rack's heat load, choose a cooling allocation across the room's cooling zones.", "submit_cooling_allocation"),
      step("power-redundancy", "Plan power redundancy", "Select an N+1 or 2N power redundancy plan and justify the tradeoff in cost vs. resilience.", "select_power_plan_and_justify"),
      step("outage-response", "Respond to a simulated outage", "A simulated alert fires; choose and sequence your incident response actions.", "submit_incident_response_sequence"),
      step("after-action-review", "Write an after-action reflection", "Summarize what the outage response would need in the real world (reviewer-facing note, not a grade).", "submit_reflection_artifact"),
    ],
    retryPolicy: retry("UNLIMITED_PRACTICE", null, "Operational reasoning practice; learners may retry the full sequence at will."),
    completionRules: { requiresAllRequiredSteps: true, requiresArtifactSubmission: true, requiresTeamConsensus: false, serverValidated: true },
    evidenceOutputs: ["OPERATIONAL_COMPLETION_FACT", "ARTIFACT", "EVIDENCE_CANDIDATE", "REFLECTION_INPUT"],
    assessmentBoundary: "EVIDENCE_CANDIDATE_ONLY",
    careerConnection: { careerPathwayId: "data-center-ai-infrastructure", notes: "Optional alignment to the existing Data Center & AI Infrastructure pathway; never required to attempt." },
    programConnection: { programId: null, packageIds: ["after-school-tech-explorer", "summer-data-center-camp"], notes: "Usable in Program Packages without any career pathway requirement." },
    teamMode: "EITHER",
    accessibleAlternative: accessible("Every configuration choice is also presented as a labeled radio-button list with a text description of the tradeoff; no diagram-only or drag-only interaction is required."),
    estimatedMinutes: 35,
    status: "ACTIVE",
    tags: ["data-center", "flagship", "operations"],
  },

  // ---- Technology & Innovation District: flagship #2 -------------------
  {
    simulationId: "ai-agent-build-test-simulation",
    activityId: "ai-agent-build-test-simulation",
    title: "Build & Test an AI Agent",
    summary: "Define a bounded agent task, configure guardrails, run it against prompt-injection style test scenarios, and review the results.",
    districtId: METAVERSE_DISTRICT_IDS.technologyInnovation,
    facilityId: "ai-agent-lab",
    simulationType: "TECHNICAL_SIMULATION",
    sourceType: "ORIGINAL_METAVERSE_SCENARIO",
    sourceRef: "docs/metaverse/MET-13_ACTIVITIES_SIMULATIONS_DISTRICT_DEPTH.md#ai-agent-build-test-simulation",
    isFlagship: true,
    programId: null,
    careerPathwayId: null,
    lessonId: null,
    assignmentId: null,
    missionProjectionId: null,
    difficulty: "STANDARD",
    participationMode: "EITHER",
    prerequisites: ["Membership in the organization."],
    objective: "Practice safe agent design: scoping a task, writing guardrails, and recognizing when an agent should refuse or escalate rather than comply.",
    instructions: "Work through each step. You will define what the agent is allowed to do, write a guardrail, then see the agent's behavior against a set of test prompts (including adversarial ones) and evaluate whether the guardrail held.",
    taskSteps: [
      step("define-agent-task", "Define the agent's bounded task", "Write a short scope statement for what the agent should and should not do.", "submit_scope_statement"),
      step("configure-guardrails", "Configure guardrails", "Choose which categories of request the agent must refuse or escalate.", "select_guardrail_categories"),
      step("run-test-scenarios", "Run test scenarios", "Review a set of simulated prompts, including prompt-injection attempts, and predict whether your guardrails hold.", "submit_prediction_per_scenario"),
      step("review-results", "Review the outcome", "Compare your predictions to the simulated outcome and note any guardrail gap you would fix.", "submit_reflection_artifact"),
    ],
    retryPolicy: retry("UNLIMITED_PRACTICE", null, "Learners may redesign guardrails and re-run scenarios freely."),
    completionRules: { requiresAllRequiredSteps: true, requiresArtifactSubmission: true, requiresTeamConsensus: false, serverValidated: true },
    evidenceOutputs: ["OPERATIONAL_COMPLETION_FACT", "ARTIFACT", "EVIDENCE_CANDIDATE", "REFLECTION_INPUT"],
    assessmentBoundary: "EVIDENCE_CANDIDATE_ONLY",
    careerConnection: { careerPathwayId: null, notes: "No canonical AI/agent career pathway exists in this repository yet; connection intentionally left null rather than fabricated." },
    programConnection: { programId: null, packageIds: ["after-school-tech-explorer", "weekend-ai-bootcamp"], notes: "Designed for enrichment/bootcamp use without a career pathway requirement." },
    teamMode: "EITHER",
    accessibleAlternative: accessible("All scenario prompts and guardrail choices are plain text with checkbox/radio selection; no live typing-speed or reaction-time component exists."),
    estimatedMinutes: 30,
    status: "ACTIVE",
    tags: ["ai", "agents", "flagship", "technology-innovation"],
  },

  // ---- Technology & Innovation District: flagship #3 (Enterprise) ------
  {
    simulationId: "enterprise-service-delivery-simulation",
    activityId: "enterprise-service-delivery-simulation",
    title: "Student Enterprise: Client Intake to Delivery",
    summary: "Walk a simulated client engagement from intake through estimation, delivery, QA, and presentation, reusing a learner's real Student Enterprise where one exists.",
    districtId: METAVERSE_DISTRICT_IDS.technologyInnovation,
    facilityId: "builder-studio",
    simulationType: "PROJECT_SIMULATION",
    sourceType: "ENTERPRISE_OPERATIONS_CONTEXT",
    sourceRef: "apps/shs-api/src/domain/metaverse/enterprise/",
    isFlagship: true,
    programId: null,
    careerPathwayId: null,
    lessonId: null,
    assignmentId: null,
    missionProjectionId: null,
    difficulty: "ADVANCED",
    participationMode: "TEAM",
    prerequisites: ["Active Studio team membership is required to complete in TEAM mode; the individual walkthrough has no team prerequisite."],
    objective: "Practice the operational sequence of a service engagement: intake, estimation, delivery, QA, and presentation, without any real client, payment, or employment relationship.",
    instructions: "If you are a member of an active Student Enterprise, this simulation will reference your enterprise's own catalog and role; if not, it runs as a standalone practice walkthrough. Complete each step with your team where applicable.",
    taskSteps: [
      step("client-intake", "Run a client intake conversation", "Draft the questions you would ask a simulated client to scope their request.", "submit_intake_notes"),
      step("project-estimation", "Estimate the engagement", "Break the request into tasks and estimate effort for each.", "submit_estimate_breakdown"),
      step("service-delivery", "Deliver the simulated work", "Describe how your team would divide and deliver the work.", "submit_delivery_plan"),
      step("qa-review", "Run a QA pass", "Identify at least two things you would check before calling the work done.", "submit_qa_checklist"),
      step("presentation", "Present the outcome", "Draft a short client-facing summary of what was delivered.", "submit_presentation_artifact"),
    ],
    retryPolicy: retry("REVIEW_REQUIRED", null, "A completed run can be revised, but re-submission after full completion requires instructor/reviewer acknowledgement to avoid silently overwriting a submitted showcase artifact."),
    completionRules: { requiresAllRequiredSteps: true, requiresArtifactSubmission: true, requiresTeamConsensus: true, serverValidated: true },
    evidenceOutputs: ["OPERATIONAL_COMPLETION_FACT", "ARTIFACT", "EVIDENCE_CANDIDATE", "PROJECT_CONTRIBUTION", "PORTFOLIO_CANDIDATE"],
    assessmentBoundary: "PROJECT",
    careerConnection: { careerPathwayId: null, notes: "Enterprise participation is educational/simulated (see MET-12 legal boundary); it is never employment and never implies a career pathway on its own." },
    programConnection: { programId: null, packageIds: ["summer-entrepreneurship-camp"], notes: "Fits enrichment/entrepreneurship programs; also usable by any Student Enterprise team." },
    teamMode: "TEAM",
    accessibleAlternative: accessible("Every step is a structured text form (intake notes, estimate table, delivery plan, checklist, presentation summary); no live/synchronous team interaction is required to complete the steps."),
    estimatedMinutes: 45,
    status: "ACTIVE",
    tags: ["enterprise", "studio", "flagship", "team"],
  },

  // ---- Civic District: flagship #4 -------------------------------------
  {
    simulationId: "civic-budget-tradeoff-simulation",
    activityId: "civic-budget-tradeoff-simulation",
    title: "City Infrastructure & Budget Tradeoff",
    summary: "Allocate a bounded simulated city budget across infrastructure priorities and see the stated tradeoffs of your choices.",
    districtId: METAVERSE_DISTRICT_IDS.civic,
    facilityId: "planning-department",
    simulationType: "CIVIC_SIMULATION",
    sourceType: "ORIGINAL_METAVERSE_SCENARIO",
    sourceRef: "docs/metaverse/MET-13_ACTIVITIES_SIMULATIONS_DISTRICT_DEPTH.md#civic-budget-tradeoff-simulation",
    isFlagship: true,
    programId: null,
    careerPathwayId: null,
    lessonId: null,
    assignmentId: null,
    missionProjectionId: null,
    difficulty: "STANDARD",
    participationMode: "EITHER",
    prerequisites: ["Membership in the organization. This simulation is intentionally not gated by SHF Civic eligibility — it is a bounded planning exercise, not a civic office simulation."],
    objective: "Practice tradeoff reasoning in public infrastructure planning: every dollar allocated to one priority is unavailable to another.",
    instructions: "Distribute a fixed simulated budget across infrastructure categories (roads, schools, parks, utilities, safety), then review the stated consequences of your allocation and revise once.",
    taskSteps: [
      step("propose-allocation", "Propose a budget allocation", "Distribute the fixed simulated budget across the five infrastructure categories.", "submit_allocation"),
      step("review-tradeoffs", "Review the tradeoffs", "Read the stated consequence of your allocation for each underfunded category.", "acknowledge_tradeoffs"),
      step("revise-allocation", "Revise once", "Optionally adjust your allocation once in light of the tradeoffs shown.", "submit_revised_allocation"),
      step("write-rationale", "Write a rationale", "Summarize why you allocated the budget the way you did.", "submit_reflection_artifact"),
    ],
    retryPolicy: retry("UNLIMITED_PRACTICE", null, "Budget tradeoff reasoning is practice; the simulated budget resets on retry."),
    completionRules: { requiresAllRequiredSteps: true, requiresArtifactSubmission: true, requiresTeamConsensus: false, serverValidated: true },
    evidenceOutputs: ["OPERATIONAL_COMPLETION_FACT", "ARTIFACT", "EVIDENCE_CANDIDATE", "REFLECTION_INPUT"],
    assessmentBoundary: "EVIDENCE_CANDIDATE_ONLY",
    careerConnection: { careerPathwayId: null, notes: "No career pathway connection; this is a civic-reasoning enrichment exercise." },
    programConnection: { programId: null, packageIds: ["community-civics-program"], notes: "Fits community/civics enrichment programs without any career or SHF Civic office requirement." },
    teamMode: "EITHER",
    accessibleAlternative: accessible("Budget allocation is a set of numeric input fields with running total, not a drag-and-drop slider board; all consequence text is written out, not icon-only."),
    estimatedMinutes: 20,
    status: "ACTIVE",
    tags: ["civic", "flagship", "budget", "planning"],
  },

  // ---- Career & Education District --------------------------------------
  {
    simulationId: "career-pathway-exploration-scenario",
    activityId: "career-pathway-exploration-scenario",
    title: "Career Pathway Exploration Scenario",
    summary: "Walk through a day-in-the-role scenario for a role on the Data Center & AI Infrastructure pathway and plan a skill gap.",
    districtId: METAVERSE_DISTRICT_IDS.careerEducation,
    facilityId: "career-pathway-center",
    simulationType: "SCENARIO",
    sourceType: "CAREER_PATHWAY_CONTENT",
    sourceRef: "docs/career/records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json",
    isFlagship: false,
    programId: null,
    careerPathwayId: "data-center-ai-infrastructure",
    lessonId: null,
    assignmentId: null,
    missionProjectionId: null,
    difficulty: "INTRODUCTORY",
    participationMode: "INDIVIDUAL",
    prerequisites: ["Membership in the organization."],
    objective: "Explore what a day in a Data Center & AI Infrastructure role involves and identify one skill gap to close next.",
    instructions: "Read the scenario, answer a short set of reflection prompts, and select a next skill-building step.",
    taskSteps: [
      step("read-scenario", "Read the role scenario", "Read a short day-in-the-role narrative grounded in the real pathway record.", "acknowledge_scenario"),
      step("skill-gap-plan", "Plan a skill gap", "Pick one skill area from the pathway record you want to build next.", "submit_skill_gap_selection"),
      step("reflect", "Reflect", "Write one sentence on why that skill matters for the role.", "submit_reflection_artifact"),
    ],
    retryPolicy: retry("UNLIMITED_PRACTICE", null, "Exploration exercise; no attempt limit."),
    completionRules: { requiresAllRequiredSteps: true, requiresArtifactSubmission: false, requiresTeamConsensus: false, serverValidated: true },
    evidenceOutputs: ["OPERATIONAL_COMPLETION_FACT", "REFLECTION_INPUT"],
    assessmentBoundary: "PRACTICE",
    careerConnection: { careerPathwayId: "data-center-ai-infrastructure", notes: "Reads the existing canonical pathway record; does not create pathway completion or milestone authority." },
    programConnection: { programId: null, packageIds: [], notes: "Open exploration; not required by any program package." },
    teamMode: "INDIVIDUAL",
    accessibleAlternative: accessible("Scenario is plain text with a list of skill-area choices; no timed or spatial interaction."),
    estimatedMinutes: 10,
    status: "ACTIVE",
    tags: ["career", "pathways", "exploration"],
  },

  // ---- Learning Arcade District ------------------------------------------
  {
    simulationId: "arcade-mission-prep-drill",
    activityId: "arcade-mission-prep-drill",
    title: "Mission Prep Drill",
    summary: "A short, practice-only concept drill intended to warm up for an upcoming City Mission or Arcade challenge.",
    districtId: METAVERSE_DISTRICT_IDS.learningArcade,
    facilityId: "simulation-hall",
    simulationType: "ARCADE_CHALLENGE",
    sourceType: "ARCADE_PRACTICE_CONTEXT",
    sourceRef: "apps/shs-api/src/domain/arcade/",
    isFlagship: false,
    programId: null,
    careerPathwayId: null,
    lessonId: null,
    assignmentId: null,
    missionProjectionId: null,
    difficulty: "INTRODUCTORY",
    participationMode: "EITHER",
    prerequisites: [],
    objective: "Warm up concept recall before a mission or Arcade attempt; this drill never produces a verified skill signal.",
    instructions: "Answer a short set of recall prompts. An untimed mode is always available alongside the timed mode.",
    taskSteps: [
      step("warmup-prompts", "Answer warmup prompts", "Answer a short set of recall prompts related to the linked mission topic.", "submit_prompt_answers"),
      step("review-answers", "Review your answers", "See which prompts you got right and read the explanation for any you missed.", "acknowledge_review"),
    ],
    retryPolicy: retry("UNLIMITED_PRACTICE", null, "Pure practice; Arcade's own canonical result/mastery signal is untouched by this drill."),
    completionRules: { requiresAllRequiredSteps: true, requiresArtifactSubmission: false, requiresTeamConsensus: false, serverValidated: true },
    evidenceOutputs: ["OPERATIONAL_COMPLETION_FACT"],
    assessmentBoundary: "PRACTICE",
    careerConnection: { careerPathwayId: null, notes: "Practice only." },
    programConnection: { programId: null, packageIds: ["after-school-tech-explorer"], notes: "Usable as optional enrichment inside any program package." },
    teamMode: "EITHER",
    accessibleAlternative: accessible("An untimed mode presents the same prompts as a plain list with no countdown.", "Untimed mode is always available as the accommodation; no separate request process is required."),
    estimatedMinutes: 8,
    status: "ACTIVE",
    tags: ["arcade", "practice", "side-mission-eligible"],
  },

  // ---- Treasury & Commerce District ---------------------------------------
  {
    simulationId: "enterprise-budgeting-simulation",
    activityId: "enterprise-budgeting-simulation",
    title: "Pricing & Resource Allocation Exercise",
    summary: "Set a simulated price and allocate a fixed simulated resource pool across a small enterprise's needs; no real balance is touched.",
    districtId: METAVERSE_DISTRICT_IDS.treasuryCommerce,
    facilityId: "student-economy-center",
    simulationType: "BUSINESS_SIMULATION",
    sourceType: "ORIGINAL_METAVERSE_SCENARIO",
    sourceRef: "docs/metaverse/MET-13_ACTIVITIES_SIMULATIONS_DISTRICT_DEPTH.md#enterprise-budgeting-simulation",
    isFlagship: false,
    programId: null,
    careerPathwayId: null,
    lessonId: null,
    assignmentId: null,
    missionProjectionId: null,
    difficulty: "STANDARD",
    participationMode: "EITHER",
    prerequisites: [],
    objective: "Practice pricing and resource-allocation reasoning without any real SHF Credits, Market order, or Treasury balance being created or changed.",
    instructions: "Set a simulated price for a sample catalog item and allocate a fixed simulated supply budget, then review the stated demand/margin tradeoff.",
    taskSteps: [
      step("set-price", "Set a simulated price", "Choose a price point for a sample catalog item.", "submit_price_choice"),
      step("allocate-resources", "Allocate resources", "Distribute a fixed simulated supply budget across production needs.", "submit_allocation"),
      step("review-tradeoff", "Review the tradeoff", "Read the stated demand/margin consequence of your choices.", "acknowledge_tradeoff"),
    ],
    retryPolicy: retry("UNLIMITED_PRACTICE", null, "All figures are simulated and reset on retry; no canonical Market listing, order, or Treasury balance is ever touched by this simulation."),
    completionRules: { requiresAllRequiredSteps: true, requiresArtifactSubmission: false, requiresTeamConsensus: false, serverValidated: true },
    evidenceOutputs: ["OPERATIONAL_COMPLETION_FACT", "REFLECTION_INPUT"],
    assessmentBoundary: "EVIDENCE_CANDIDATE_ONLY",
    careerConnection: { careerPathwayId: null, notes: "Business-reasoning enrichment; no career pathway connection." },
    programConnection: { programId: null, packageIds: ["summer-entrepreneurship-camp"], notes: "Fits entrepreneurship enrichment programs." },
    teamMode: "EITHER",
    accessibleAlternative: accessible("Pricing and allocation are numeric input fields with a running total; no slider-only or drag-only control exists."),
    estimatedMinutes: 15,
    status: "ACTIVE",
    tags: ["treasury", "commerce", "pricing"],
  },

  // ---- Community District --------------------------------------------------
  {
    simulationId: "community-accessibility-audit-challenge",
    activityId: "community-accessibility-audit-challenge",
    title: "Community Accessibility Audit",
    summary: "Review a description of a community space and identify accessibility gaps and fixes.",
    districtId: METAVERSE_DISTRICT_IDS.community,
    facilityId: "community-center",
    simulationType: "DESIGN_CHALLENGE",
    sourceType: "SIDE_MISSION_CONTENT",
    sourceRef: "docs/metaverse/MET-13_ACTIVITIES_SIMULATIONS_DISTRICT_DEPTH.md#community-accessibility-audit-challenge",
    isFlagship: false,
    programId: null,
    careerPathwayId: null,
    lessonId: null,
    assignmentId: null,
    missionProjectionId: null,
    difficulty: "INTRODUCTORY",
    participationMode: "EITHER",
    prerequisites: [],
    objective: "Practice accessibility-audit thinking on a written scenario of a community space.",
    instructions: "Read the space description, list the accessibility gaps you notice, and propose a fix for each.",
    taskSteps: [
      step("read-scenario", "Read the space description", "Read a short written description of a community space layout and its current features.", "acknowledge_scenario"),
      step("identify-gaps", "Identify accessibility gaps", "List at least two accessibility gaps you notice.", "submit_gap_list"),
      step("propose-fixes", "Propose fixes", "Propose one fix for each gap you listed.", "submit_fix_proposals"),
    ],
    retryPolicy: retry("UNLIMITED_PRACTICE", null, "Enrichment challenge; retry freely."),
    completionRules: { requiresAllRequiredSteps: true, requiresArtifactSubmission: true, requiresTeamConsensus: false, serverValidated: true },
    evidenceOutputs: ["OPERATIONAL_COMPLETION_FACT", "ARTIFACT", "EVIDENCE_CANDIDATE"],
    assessmentBoundary: "EVIDENCE_CANDIDATE_ONLY",
    careerConnection: { careerPathwayId: null, notes: "Community/service-learning enrichment." },
    programConnection: { programId: null, packageIds: ["community-civics-program", "nonprofit-service-program"], notes: "Designed for community/nonprofit program packages." },
    teamMode: "EITHER",
    accessibleAlternative: accessible("The entire challenge is text-based reading and free-text response; there is no floor-plan graphic dependency."),
    estimatedMinutes: 15,
    status: "ACTIVE",
    tags: ["community", "accessibility", "side-mission-eligible"],
  },

  // ---- Residential / Student Life District -----------------------------
  {
    simulationId: "team-time-management-challenge",
    activityId: "team-time-management-challenge",
    title: "Team Time Management Challenge",
    summary: "Practice sequencing and prioritizing a shared team workload under a deadline scenario.",
    districtId: METAVERSE_DISTRICT_IDS.studentLife,
    facilityId: "student-hub",
    simulationType: "TEAM_CHALLENGE",
    sourceType: "ORIGINAL_METAVERSE_SCENARIO",
    sourceRef: "docs/metaverse/MET-13_ACTIVITIES_SIMULATIONS_DISTRICT_DEPTH.md#team-time-management-challenge",
    isFlagship: false,
    programId: null,
    careerPathwayId: null,
    lessonId: null,
    assignmentId: null,
    missionProjectionId: null,
    difficulty: "INTRODUCTORY",
    participationMode: "EITHER",
    prerequisites: ["Team mode requires active team membership; individual mode has none."],
    objective: "Practice prioritizing and sequencing shared work under a deadline. This is a scheduling/prioritization exercise only — it never infers personality traits, mental health, or team-fit scores.",
    instructions: "Given a list of tasks with rough time estimates and a fixed deadline, sequence and assign them, then review the schedule's stated risk.",
    taskSteps: [
      step("list-tasks", "Review the task list", "Review a short list of tasks with time estimates.", "acknowledge_task_list"),
      step("sequence-tasks", "Sequence the tasks", "Order the tasks and, in team mode, assign them across teammates.", "submit_schedule"),
      step("review-risk", "Review the schedule risk", "Read the stated risk of your schedule against the deadline and note one change you would make.", "submit_reflection_artifact"),
    ],
    retryPolicy: retry("UNLIMITED_PRACTICE", null, "SEL/scheduling practice; retry freely."),
    completionRules: { requiresAllRequiredSteps: true, requiresArtifactSubmission: false, requiresTeamConsensus: false, serverValidated: true },
    evidenceOutputs: ["OPERATIONAL_COMPLETION_FACT", "REFLECTION_INPUT"],
    assessmentBoundary: "EVIDENCE_CANDIDATE_ONLY",
    careerConnection: { careerPathwayId: null, notes: "SEL/scheduling enrichment; no career connection." },
    programConnection: { programId: null, packageIds: ["after-school-tech-explorer"], notes: "Fits any enrichment package needing a teamwork/SEL activity." },
    teamMode: "EITHER",
    accessibleAlternative: accessible("Scheduling is a reorderable text list with explicit up/down controls, not drag-only; no personality inventory or biometric input exists."),
    estimatedMinutes: 15,
    status: "ACTIVE",
    tags: ["student-life", "sel", "teamwork"],
  },

  // ---- Public Realm --------------------------------------------------------
  {
    simulationId: "city-scavenger-hunt-side-mission",
    activityId: "city-scavenger-hunt-side-mission",
    title: "Silicon Heartland Scavenger Hunt",
    summary: "A light, optional Side Mission that sends a learner exploring the city's districts and facilities.",
    districtId: METAVERSE_DISTRICT_IDS.publicRealm,
    facilityId: "central-plaza",
    simulationType: "SIDE_MISSION_ACTIVITY",
    sourceType: "SIDE_MISSION_CONTENT",
    sourceRef: "docs/metaverse/MET-13_ACTIVITIES_SIMULATIONS_DISTRICT_DEPTH.md#city-scavenger-hunt-side-mission",
    isFlagship: false,
    programId: null,
    careerPathwayId: null,
    lessonId: null,
    assignmentId: null,
    missionProjectionId: null,
    difficulty: "INTRODUCTORY",
    participationMode: "EITHER",
    prerequisites: [],
    objective: "Orient a new learner to the city's districts and facilities through a light exploration prompt list.",
    instructions: "Work through a short list of 'find this' prompts, each naming a district or facility and a question about it. No career pathway or program enrollment is required.",
    taskSteps: [
      step("find-district", "Find a named district", "Navigate to (or select from the list view) the named district.", "acknowledge_visit"),
      step("find-facility", "Find a named facility", "Navigate to (or select from the list view) the named facility within that district.", "acknowledge_visit"),
      step("answer-prompt", "Answer the orientation question", "Answer a simple orientation question about what the facility is for.", "submit_prompt_answer"),
    ],
    retryPolicy: retry("UNLIMITED_PRACTICE", null, "Orientation activity; no attempt limit."),
    completionRules: { requiresAllRequiredSteps: true, requiresArtifactSubmission: false, requiresTeamConsensus: false, serverValidated: true },
    evidenceOutputs: ["OPERATIONAL_COMPLETION_FACT"],
    assessmentBoundary: "PRACTICE",
    careerConnection: { careerPathwayId: null, notes: "Pure orientation; no career connection." },
    programConnection: { programId: null, packageIds: [], notes: "Not tied to any program package; available to every learner as a Side Mission." },
    teamMode: "EITHER",
    accessibleAlternative: accessible("The entire hunt can be completed through the existing non-spatial district/facility list and search navigation (MET-2 accessibility_alternatives); no map-click is required."),
    estimatedMinutes: 10,
    status: "ACTIVE",
    tags: ["public-realm", "side-mission", "orientation"],
  },
];

export const METAVERSE_SIMULATION_REGISTRY: readonly SimulationDefinition[] = SIMULATIONS;

export function getSimulationById(simulationId: string): SimulationDefinition | undefined {
  return METAVERSE_SIMULATION_REGISTRY.find((sim) => sim.simulationId === simulationId);
}

export function listSimulationsForDistrict(districtId: string): SimulationDefinition[] {
  return METAVERSE_SIMULATION_REGISTRY.filter((sim) => sim.districtId === districtId);
}

export function listSimulationsForFacility(facilityId: string): SimulationDefinition[] {
  return METAVERSE_SIMULATION_REGISTRY.filter((sim) => sim.facilityId === facilityId);
}

export function listFlagshipSimulations(): SimulationDefinition[] {
  return METAVERSE_SIMULATION_REGISTRY.filter((sim) => sim.isFlagship);
}

export function validateSimulationRegistry(): string[] {
  const errors: string[] = [];
  const ids = METAVERSE_SIMULATION_REGISTRY.map((sim) => sim.simulationId);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) errors.push(`duplicate simulation ids: ${duplicates.join(",")}`);

  for (const sim of METAVERSE_SIMULATION_REGISTRY) {
    errors.push(...validateSimulationDefinition(sim));
    const activity = SILICON_HEARTLAND_CITY_REGISTRY.activities.find((item) => item.id === sim.activityId);
    if (!activity) {
      errors.push(`${sim.simulationId}: activity_id does not resolve to a MET-2 city registry activity`);
    } else {
      if (activity.district_id !== sim.districtId) errors.push(`${sim.simulationId}: district_id does not match the registered activity's district`);
      if (activity.facility_id !== sim.facilityId) errors.push(`${sim.simulationId}: facility_id does not match the registered activity's facility`);
    }
    const district = SILICON_HEARTLAND_CITY_REGISTRY.districts.find((item) => item.id === sim.districtId);
    if (!district) errors.push(`${sim.simulationId}: district_id does not resolve to a MET-2 city registry district`);
    const facility = SILICON_HEARTLAND_CITY_REGISTRY.facilities.find((item) => item.id === sim.facilityId);
    if (!facility) errors.push(`${sim.simulationId}: facility_id does not resolve to a MET-2 city registry facility`);
    else if (facility.district_id !== sim.districtId) errors.push(`${sim.simulationId}: facility does not belong to the declared district`);
  }

  const requiredDistrictIds = Object.values(METAVERSE_DISTRICT_IDS);
  for (const districtId of requiredDistrictIds) {
    if (!METAVERSE_SIMULATION_REGISTRY.some((sim) => sim.districtId === districtId)) {
      errors.push(`missing meaningful simulation for required district: ${districtId}`);
    }
  }

  const flagshipCount = listFlagshipSimulations().length;
  if (flagshipCount < 4) errors.push(`expected at least 4 flagship simulations, found ${flagshipCount}`);

  return errors;
}
