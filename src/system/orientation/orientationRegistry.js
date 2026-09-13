import { universeDestinations } from "../../pages/universe-v1/universeDestinationRegistry.js";
import {
  OGL_CONTRACT_VERSION,
  assertValidOrientationContract,
  validateOrientationContract,
} from "./orientationContract.js";

const events = ["offered", "started", "skipped", "resumed", "completed", "abandoned", "documentation_opened", "companion_invoked", "next_action_opened", "whats_changed_seen"];

const commonAccessibility = {
  keyboard: true,
  screenReader: true,
  reducedMotion: true,
  mobile: true,
  nonTourAlternative: true,
  focusRequirements: ["restore-trigger-focus", "announce-step-status"],
};

const semantic = (anchorId) => ({ mode: "SEMANTIC_ANCHOR", anchorId });
const route = (destinationId, routeId) => ({ mode: "ROUTE_TARGET", destinationId, routeId });
const source = (kind, id) => ({ kind, id });

export const OGL_ORIENTATION_CONTRACTS = Object.freeze([
  {
    schemaVersion: OGL_CONTRACT_VERSION,
    orientationId: "orientation:shs-bos:executive-command",
    slug: "shs-bos-executive-command",
    destinationId: "shs-bos-executive-command",
    owningService: "shs-bos",
    version: 1,
    lifecycle: "ACTIVE",
    visibility: "ROLE_SCOPED",
    tier: "TIER_A",
    entryModes: ["FIRST_VISIT", "RETURNING_USER", "MANUAL_REPLAY", "REORIENTATION"],
    title: "SHS BOS Executive Command",
    purpose: { short: "Understand governed executive summaries and review priorities.", outcome: "The authorized operator can locate read-only command summaries without OGL gaining command, approval, or release authority." },
    audience: { roles: ["shs_admin", "operator", "auditor"], permissions: ["audit.view"], organizationTypes: ["enterprise", "government"] },
    capabilities: { orientation: true, guidedTour: true, contextualGuidance: true, checklist: false, guidanceCenter: true, documentation: false, companion: true, whatsChanged: false },
    tours: [{ tourId: "tour:shs-bos:executive-command", accessibleAlternativeRef: source("GUIDANCE_ARTICLE", "guidance:shs-bos:executive-command-steps"), steps: [{ stepId: "overview", order: 0, title: "Executive command overview", body: "Review the current governed summary and its review boundaries.", target: semantic("executive-command-overview"), missingAnchorPolicy: "SHOW_UNANCHORED" }] }],
    dgal: { guidanceRefs: [], documentRefs: [] },
    companion: { enabled: true, suggestedTopics: ["executive summary", "review priorities", "governance boundaries"], readOnly: true },
    safeActions: { openCommandCenter: route("shs-bos-executive-command", "shs.bos.executive-command") },
    accessibility: commonAccessibility,
    telemetryEvents: events,
    changeClassification: "WORKFLOW_SIGNIFICANT",
    reorientation: { policy: "RECOMMENDED", triggerOn: ["WORKFLOW_SIGNIFICANT"] },
    owner: { destinationOwner: "SHS BOS", orientationOwner: "OGL", contentOwner: "SHS BOS", accessibilityReview: "REQUIRED" },
  },
  {
    schemaVersion: OGL_CONTRACT_VERSION,
    orientationId: "orientation:hub:workspace",
    slug: "hub-workspace",
    destinationId: "bos",
    owningService: "hub",
    version: 1,
    lifecycle: "ACTIVE",
    visibility: "ROLE_SCOPED",
    tier: "TIER_A",
    entryModes: ["FIRST_VISIT", "RETURNING_USER", "MANUAL_REPLAY", "REORIENTATION"],
    title: "SHS Hub workspace",
    purpose: { short: "Understand the Hub workspace and the next operational steps.", outcome: "The user can locate the current Hub work without treating orientation as operational authority." },
    audience: { roles: ["instructor", "org_admin", "shs_admin"], permissions: [], organizationTypes: ["education", "enterprise"] },
    capabilities: { orientation: true, guidedTour: true, contextualGuidance: true, checklist: false, guidanceCenter: true, documentation: false, companion: true, whatsChanged: false },
    tours: [{ tourId: "hub:workspace", accessibleAlternativeRef: source("GUIDANCE_ARTICLE", "guidance:hub:workspace-steps"), steps: [{ stepId: "workspace", order: 0, title: "Your Hub workspace", body: "Start here to understand the current workspace and its available navigation.", target: route("bos", "hub.workspace"), missingAnchorPolicy: "SHOW_UNANCHORED" }] }],
    dgal: { guidanceRefs: [], documentRefs: [] },
    companion: { enabled: true, suggestedTopics: ["Hub workspace", "next operational step"], readOnly: true },
    safeActions: { openWorkspace: route("bos", "hub.workspace") },
    accessibility: commonAccessibility,
    telemetryEvents: events,
    changeClassification: "TOUR_STEP",
    reorientation: { policy: "OPTIONAL", triggerOn: ["TOUR_STEP"] },
    owner: { destinationOwner: "SHS Hub", orientationOwner: "OGL", contentOwner: "SHS Hub", accessibilityReview: "REQUIRED" },
  },
  {
    schemaVersion: OGL_CONTRACT_VERSION,
    orientationId: "orientation:curriculum:student-dashboard",
    slug: "curriculum-student-dashboard",
    destinationId: "curriculum",
    owningService: "curriculum",
    version: 1,
    lifecycle: "ACTIVE",
    visibility: "ROLE_SCOPED",
    tier: "TIER_A",
    entryModes: ["FIRST_VISIT", "RETURNING_USER", "MANUAL_REPLAY", "REORIENTATION"],
    title: "Student learning workspace",
    purpose: { short: "Understand your learning path and next assignment.", outcome: "The learner can locate current work and the canonical next step." },
    audience: { roles: ["student"], permissions: ["assignment.view"], organizationTypes: ["education"] },
    capabilities: { orientation: true, guidedTour: true, contextualGuidance: true, checklist: true, guidanceCenter: true, documentation: true, companion: true, whatsChanged: false },
    tours: [{ tourId: "tour:curriculum:student-dashboard", accessibleAlternativeRef: source("GUIDANCE_ARTICLE", "guidance:curriculum:student-dashboard-steps"), steps: [{ stepId: "workspace", order: 0, title: "Your learning workspace", body: "Start here to see the work assigned to you.", target: semantic("curriculum-workspace"), missingAnchorPolicy: "SHOW_UNANCHORED" }] }],
    checklist: [{ itemId: "current-assignment", label: "Open your current assignment", required: true, completionSource: "DOMAIN_STATE", sourceRef: source("CURRICULUM_ASSIGNMENT", "current"), action: route("curriculum", "curriculum.assignment.current") }],
    dgal: { guidanceRefs: [source("DGAL_GUIDANCE", "curriculum:student-dashboard")], documentRefs: [] },
    companion: { enabled: true, suggestedTopics: ["current assignment", "learning path"], readOnly: true },
    safeActions: { openDestination: route("curriculum", "curriculum.dashboard") },
    accessibility: commonAccessibility,
    telemetryEvents: events,
    changeClassification: "TOUR_STEP",
    reorientation: { policy: "RECOMMENDED", triggerOn: ["TOUR_STEP", "TARGET_ROUTE"] },
    owner: { destinationOwner: "Curriculum", orientationOwner: "OGL", contentOwner: "Curriculum", accessibilityReview: "REQUIRED" },
  },
  {
    schemaVersion: OGL_CONTRACT_VERSION,
    orientationId: "orientation:civicsure:provider",
    slug: "civicsure-provider",
    destinationId: "civic",
    owningService: "civicsure",
    version: 1,
    lifecycle: "ACTIVE",
    visibility: "ROLE_SCOPED",
    tier: "TIER_A",
    entryModes: ["FIRST_VISIT", "RETURNING_USER", "MANUAL_REPLAY"],
    title: "CivicSure provider workspace",
    purpose: { short: "Understand provider evidence work and what happens next.", outcome: "The provider can find the canonical requirement without gaining verification authority." },
    audience: { roles: ["provider"], permissions: ["government.assurance.provider.self_service.view"] },
    capabilities: { orientation: true, guidedTour: true, contextualGuidance: true, checklist: true, guidanceCenter: true, documentation: true, companion: true, whatsChanged: false },
    tours: [{ tourId: "tour:civicsure:provider", accessibleAlternativeRef: source("DGAL_GUIDANCE", "civicsure:provider:orientation"), steps: [{ stepId: "evidence-request", order: 0, title: "Evidence requests", body: "Review the request and use the canonical provider action.", target: semantic("civicsure-evidence-request"), missingAnchorPolicy: "SHOW_UNANCHORED" }] }],
    checklist: [{ itemId: "review-evidence-request", label: "Review the evidence request", required: true, completionSource: "DGAL_REQUIREMENT", sourceRef: source("DGAL_REQUIREMENT", "civicsure:provider:evidence"), action: route("civic", "civicsure.provider.evidence") }],
    dgal: { guidanceRefs: [source("DGAL_GUIDANCE", "civicsure:provider:evidence")], documentRefs: [source("DGAL_DOCUMENT", "civicsure:provider-packet")] },
    companion: { enabled: true, suggestedTopics: ["why evidence is required", "what happens after submission"], readOnly: true },
    safeActions: { openWorkspace: route("civic", "civicsure.provider.workspace") },
    accessibility: commonAccessibility,
    telemetryEvents: events,
    changeClassification: "WORKFLOW_SIGNIFICANT",
    reorientation: { policy: "RECOMMENDED", triggerOn: ["WORKFLOW_SIGNIFICANT"] },
    owner: { destinationOwner: "CivicSure", orientationOwner: "OGL", contentOwner: "CivicSure", accessibilityReview: "REQUIRED" },
  },
  {
    schemaVersion: OGL_CONTRACT_VERSION,
    orientationId: "orientation:curriculum:instructor-operations",
    slug: "curriculum-instructor-operations",
    destinationId: "curriculum",
    owningService: "curriculum",
    version: 1,
    lifecycle: "ACTIVE",
    visibility: "ROLE_SCOPED",
    tier: "TIER_A",
    entryModes: ["FIRST_VISIT", "RETURNING_USER", "MANUAL_REPLAY", "REORIENTATION"],
    title: "Instructor operational workspace",
    purpose: { short: "Understand cohort, assignment, and learner-progress work.", outcome: "The instructor can find canonical instructional next actions without OGL owning learner or assignment state." },
    audience: { roles: ["instructor"], permissions: ["cohort.view", "assignment.view"], organizationTypes: ["education"] },
    capabilities: { orientation: true, guidedTour: true, contextualGuidance: true, checklist: true, guidanceCenter: true, documentation: false, companion: true, whatsChanged: false },
    tours: [{ tourId: "tour:curriculum:instructor-operations", accessibleAlternativeRef: source("GUIDANCE_ARTICLE", "guidance:curriculum:instructor-operations-steps"), steps: [{ stepId: "workspace", order: 0, title: "Instructor workspace", body: "Start here to review cohorts, assignments, and learner progress.", target: semantic("curriculum-instructor-workspace"), missingAnchorPolicy: "SHOW_UNANCHORED" }] }],
    checklist: [{ itemId: "review-instructor-work", label: "Review instructional work", required: true, completionSource: "DOMAIN_STATE", sourceRef: source("CURRICULUM_INSTRUCTOR", "operations"), action: route("curriculum", "curriculum.instructor.operations") }],
    dgal: { guidanceRefs: [], documentRefs: [] },
    companion: { enabled: true, suggestedTopics: ["cohort progress", "assignment review", "learner progress"], readOnly: true },
    safeActions: { openWorkspace: route("curriculum", "curriculum.instructor.operations") },
    accessibility: commonAccessibility,
    telemetryEvents: events,
    changeClassification: "WORKFLOW_SIGNIFICANT",
    reorientation: { policy: "RECOMMENDED", triggerOn: ["WORKFLOW_SIGNIFICANT", "TARGET_ROUTE"] },
    owner: { destinationOwner: "Curriculum", orientationOwner: "OGL", contentOwner: "Curriculum", accessibilityReview: "REQUIRED" },
  },
  {
    schemaVersion: OGL_CONTRACT_VERSION,
    orientationId: "orientation:civicsure:operator",
    slug: "civicsure-operator",
    destinationId: "civic",
    owningService: "civicsure",
    version: 1,
    lifecycle: "ACTIVE",
    visibility: "ROLE_SCOPED",
    tier: "TIER_A",
    entryModes: ["FIRST_VISIT", "RETURNING_USER", "MANUAL_REPLAY", "REORIENTATION"],
    title: "CivicSure operator review workspace",
    purpose: { short: "Understand assurance review state and the next review step.", outcome: "The operator can locate canonical review information without OGL approving, verifying, or publishing anything." },
    audience: { roles: ["operator", "reviewer_verifier"], permissions: ["verification.view"], organizationTypes: ["government", "enterprise"] },
    capabilities: { orientation: true, guidedTour: true, contextualGuidance: true, checklist: true, guidanceCenter: true, documentation: true, companion: true, whatsChanged: false },
    tours: [{ tourId: "tour:civicsure:operator", accessibleAlternativeRef: source("GUIDANCE_ARTICLE", "guidance:civicsure:operator-steps"), steps: [{ stepId: "review-queue", order: 0, title: "Review queue", body: "Start with the current verification state and its readiness blockers.", target: semantic("civicsure-operator-review-queue"), missingAnchorPolicy: "SHOW_UNANCHORED" }] }],
    checklist: [{ itemId: "review-current-queue", label: "Review the current assurance queue", required: true, completionSource: "DOMAIN_STATE", sourceRef: source("CIVICSURE_VERIFICATION", "review-queue"), action: route("civic", "civicsure.operator.verification") }],
    dgal: { guidanceRefs: [source("DGAL_GUIDANCE", "civicsure:operator:review")], documentRefs: [] },
    companion: { enabled: true, suggestedTopics: ["verification readiness", "review blockers", "provider evidence context"], readOnly: true },
    safeActions: { openReviewQueue: route("civic", "civicsure.operator.verification") },
    accessibility: commonAccessibility,
    telemetryEvents: events,
    changeClassification: "WORKFLOW_SIGNIFICANT",
    reorientation: { policy: "RECOMMENDED", triggerOn: ["WORKFLOW_SIGNIFICANT"] },
    owner: { destinationOwner: "CivicSure", orientationOwner: "OGL", contentOwner: "CivicSure", accessibilityReview: "REQUIRED" },
  },
  {
    schemaVersion: OGL_CONTRACT_VERSION,
    orientationId: "orientation:agent-fabric:operator",
    slug: "agent-fabric-operator",
    destinationId: "agent-fabric",
    owningService: "agent-fabric",
    version: 1,
    lifecycle: "ACTIVE",
    visibility: "ROLE_SCOPED",
    tier: "TIER_A",
    entryModes: ["FIRST_VISIT", "RETURNING_USER", "MANUAL_REPLAY", "CHANGED_FEATURE"],
    title: "Governed agent operations",
    purpose: { short: "Understand policy, work orders, and human approval boundaries.", outcome: "The operator can inspect governed work without treating orientation as execution authority." },
    audience: { roles: ["operator", "reviewer"], permissions: ["audit.view", "ai.governance.view"] },
    capabilities: { orientation: true, guidedTour: true, contextualGuidance: true, checklist: false, guidanceCenter: true, documentation: true, companion: true, whatsChanged: true },
    tours: [{ tourId: "tour:agent-fabric:operator", accessibleAlternativeRef: source("DGAL_GUIDANCE", "agent-fabric:operator-boundaries"), steps: [{ stepId: "work-orders", order: 0, title: "Work orders and policy", body: "Review the approved scope before any governed action.", target: semantic("agent-fabric-work-orders"), missingAnchorPolicy: "REQUIRE_TARGET" }] }],
    dgal: { guidanceRefs: [source("DGAL_GUIDANCE", "agent-fabric:operator-boundaries")], documentRefs: [source("DGAL_DOCUMENT", "agent-fabric:controlled-pilot-packet")] },
    companion: { enabled: true, suggestedTopics: ["approved scope", "human approval"], readOnly: true },
    safeActions: { openWorkspace: route("agent-fabric", "agent-fabric.operator.workspace") },
    accessibility: commonAccessibility,
    telemetryEvents: events,
    changeClassification: "POLICY_RELATED",
    reorientation: { policy: "REQUIRED", triggerOn: ["POLICY_RELATED"] },
    owner: { destinationOwner: "Agent Fabric", orientationOwner: "OGL", contentOwner: "Agent Fabric", accessibilityReview: "REQUIRED" },
  },
  {
    schemaVersion: OGL_CONTRACT_VERSION,
    orientationId: "orientation:sales:pipeline",
    slug: "sales-pipeline",
    destinationId: "sales",
    owningService: "sales",
    version: 1,
    lifecycle: "ACTIVE",
    visibility: "ROLE_SCOPED",
    tier: "TIER_B",
    entryModes: ["FIRST_VISIT", "RETURNING_USER", "MANUAL_REPLAY"],
    title: "Sales pipeline",
    purpose: { short: "Understand sales follow-up and the next supported pipeline action.", outcome: "The authorized sales user can orient to the pipeline without OGL owning sales state." },
    audience: { roles: ["client", "client_admin"], permissions: [], organizationTypes: ["enterprise", "government"] },
    capabilities: { orientation: true, guidedTour: true, contextualGuidance: true, checklist: false, guidanceCenter: true, documentation: false, companion: false, whatsChanged: false },
    tours: [{ tourId: "tour:sales:pipeline", accessibleAlternativeRef: source("GUIDANCE_ARTICLE", "guidance:sales:pipeline-steps"), steps: [{ stepId: "pipeline", order: 0, title: "Sales pipeline", body: "Review the pipeline stages and the next supported sales move.", target: semantic("sales-pipeline"), missingAnchorPolicy: "SHOW_UNANCHORED" }] }],
    dgal: { guidanceRefs: [], documentRefs: [] },
    companion: { enabled: false, suggestedTopics: [], readOnly: true },
    safeActions: { openPipeline: route("sales", "sales.pipeline") },
    accessibility: commonAccessibility,
    telemetryEvents: events,
    changeClassification: "TOUR_STEP",
    reorientation: { policy: "OPTIONAL", triggerOn: ["TOUR_STEP"] },
    owner: { destinationOwner: "Sales", orientationOwner: "OGL", contentOwner: "Sales", accessibilityReview: "REQUIRED" },
  },
  {
    schemaVersion: OGL_CONTRACT_VERSION,
    orientationId: "orientation:career:learner",
    slug: "career-learner",
    destinationId: "career",
    owningService: "career",
    version: 1,
    lifecycle: "DRAFT",
    visibility: "AUTHENTICATED",
    tier: "TIER_B",
    entryModes: ["FIRST_VISIT", "RETURNING_USER", "MANUAL_REPLAY"],
    title: "Career pathway workspace",
    purpose: { short: "Find pathway guidance and the next career action.", outcome: "The learner can navigate canonical pathway recommendations without OGL owning career state." },
    audience: { roles: ["student"], permissions: ["careerEvent.view"] },
    capabilities: { orientation: true, guidedTour: true, contextualGuidance: true, checklist: false, guidanceCenter: true, documentation: true, companion: true, whatsChanged: false },
    tours: [{ tourId: "tour:career:learner", accessibleAlternativeRef: source("GUIDANCE_ARTICLE", "guidance:career:pathway"), steps: [{ stepId: "pathway", order: 0, title: "Your pathway", body: "Use the pathway view to understand the next recommended action.", target: semantic("career-pathway"), missingAnchorPolicy: "SHOW_UNANCHORED" }] }],
    dgal: { guidanceRefs: [source("DGAL_GUIDANCE", "career:pathway")], documentRefs: [] },
    companion: { enabled: true, suggestedTopics: ["pathway", "career readiness"], readOnly: true },
    safeActions: { openWorkspace: route("career", "career.dashboard") },
    accessibility: commonAccessibility,
    telemetryEvents: events,
    changeClassification: "COPY_ONLY",
    reorientation: { policy: "OPTIONAL", triggerOn: ["COPY_ONLY"] },
    owner: { destinationOwner: "Career", orientationOwner: "OGL", contentOwner: "Career", accessibilityReview: "REQUIRED" },
  },
]);

export function getOrientationContract(orientationId) {
  return OGL_ORIENTATION_CONTRACTS.find((contract) => contract.orientationId === orientationId) || null;
}

export function listOrientationContracts({ lifecycle } = {}) {
  return OGL_ORIENTATION_CONTRACTS.filter((contract) => !lifecycle || contract.lifecycle === lifecycle);
}

export function validateOrientationRegistry(contracts = OGL_ORIENTATION_CONTRACTS) {
  const errors = [];
  const ids = new Set();
  const activeByDestination = new Map();
  const knownDestinationIds = new Set(universeDestinations.map((destination) => destination.id));
  for (const contract of contracts) {
    if (ids.has(contract.orientationId)) errors.push(`duplicate orientationId: ${contract.orientationId}`);
    ids.add(contract.orientationId);
    const result = validateOrientationContract(contract, { knownDestinationIds });
    errors.push(...result.errors.map((error) => `${contract.orientationId}: ${error}`));
    if (contract.lifecycle === "ACTIVE") {
      const key = `${contract.destinationId}:${contract.audience.roles.slice().sort().join(",")}`;
      if (activeByDestination.has(key)) errors.push(`duplicate active contract for ${key}`);
      activeByDestination.set(key, contract.orientationId);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidOrientationRegistry(contracts = OGL_ORIENTATION_CONTRACTS) {
  const result = validateOrientationRegistry(contracts);
  if (!result.valid) throw new Error(`Invalid OGL orientation registry:\n${result.errors.join("\n")}`);
  contracts.forEach(assertValidOrientationContract);
  return contracts;
}

assertValidOrientationRegistry();
