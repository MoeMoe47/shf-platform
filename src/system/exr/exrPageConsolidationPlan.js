import { EXR_IA_ALIASES } from "./exrInformationArchitecture.js";

export const EXR_CONSOLIDATION_SCHEMA_VERSION = 1;

export const EXR_CONSOLIDATION_DISPOSITIONS = Object.freeze([
  "KEEP",
  "KEEP_AND_POLISH",
  "STREAMLINE",
  "REORGANIZE",
  "MERGE",
  "SPLIT_BY_ROLE",
  "MOVE",
  "TURN_INTO_WORKFLOW",
  "TURN_INTO_DETAIL_PAGE",
  "TURN_INTO_QUEUE",
  "TURN_INTO_DASHBOARD",
  "REPLACE",
  "RETIRE",
  "ALIAS_KEEP",
  "REDIRECT_CANDIDATE",
  "DEFER_TO_FRONTEND_DESIGN",
  "NOT_APPLICABLE",
]);

export const EXR_DASHBOARD_CLASSIFICATIONS = Object.freeze([
  "TRUE_DASHBOARD",
  "QUEUE",
  "WORKFLOW",
  "LANDING",
  "REPORT",
  "DETAIL",
  "DISCOVERY",
]);

export const EXR_CONSOLIDATION_PRIORITIES = Object.freeze([
  "P1_JOURNEY",
  "P2_STRUCTURAL",
  "P3_POLISH",
]);

const surface = (id, currentSurface, currentRoute, actor, currentType, canonicalSurfaceType, disposition, targetDestination, targetSurface, priority, config = {}) => ({
  id,
  currentSurface,
  currentRoute,
  actor,
  currentType,
  canonicalSurfaceType,
  disposition,
  targetDestination,
  targetSurface,
  priority,
  dependencies: config.dependencies || [],
  ncaIntegration: config.ncaIntegration || "NO_NCA_DEPENDENCY",
  frontendDesignDeferral: config.frontendDesignDeferral || false,
  exr4Owner: config.exr4Owner || null,
  retirementPrerequisites: config.retirementPrerequisites || [],
  roleMixed: config.roleMixed || false,
});

export const EXR_PAGE_CONSOLIDATION_PLAN = Object.freeze([
  surface("EXR3-P01", "Foundation Top/Mission", "/top|/mission|/about", ["public"], "PUBLIC_LANDING", "PUBLIC_LANDING", "KEEP", "/top", "Foundation institutional entry", "P2_STRUCTURAL"),
  surface("EXR3-P02", "Foundation Impact", "/impact", ["public"], "REPORT", "REPORT", "KEEP_AND_POLISH", "/impact", "Foundation impact", "P3_POLISH", { frontendDesignDeferral: true }),
  surface("EXR3-P03", "Public Apps", "/apps", ["public"], "DIRECTORY", "DIRECTORY", "KEEP", "/apps", "Public app directory", "P2_STRUCTURAL"),
  surface("EXR3-P04", "Solutions Home", "/solutions/home", ["public"], "DISCOVERY", "DISCOVERY", "KEEP_AND_POLISH", "/solutions/home", "SHS service discovery", "P2_STRUCTURAL", { frontendDesignDeferral: true }),
  surface("EXR3-P05", "Hub Workspace", "/hub", ["org_operator", "org_admin"], "DASHBOARD", "DASHBOARD", "REORGANIZE", "/hub", "SHS/BOS organization operating environment", "P1_JOURNEY", { ncaIntegration: "NCA_INTEGRATION_REQUIRED", exr4Owner: "activated-organization" }),
  surface("EXR3-P06", "Hub Action Queue", "/hub/intake|/hub/queue|/hub/action-queue", ["org_operator"], "DASHBOARD", "QUEUE", "TURN_INTO_QUEUE", "/hub/queue", "Hub work queue", "P1_JOURNEY", { ncaIntegration: "NCA_INTEGRATION_REQUIRED", exr4Owner: "activated-organization", retirementPrerequisites: ["confirm alias usage", "preserve deep links"] }),
  surface("EXR3-P07", "Hub Reports", "/hub/reports", ["org_operator", "org_admin"], "REPORT", "REPORT", "STREAMLINE", "/reporting", "Contextual organization reporting", "P2_STRUCTURAL", { ncaIntegration: "NCA_INTEGRATION_REQUIRED" }),
  surface("EXR3-P08", "Executive Command", "/executive-command", ["shs_admin"], "DASHBOARD", "DASHBOARD", "KEEP_AND_POLISH", "/executive-command", "Executive intelligence", "P2_STRUCTURAL", { ncaIntegration: "NCA_INTEGRATION_REQUIRED", frontendDesignDeferral: true }),
  surface("EXR3-P09", "Reporting Command", "/reporting|/reports|/ops/reports", ["org_admin", "shs_admin"], "DASHBOARD", "REPORT", "MERGE", "/reporting", "Governed reporting command", "P1_JOURNEY", { ncaIntegration: "NCA_INTEGRATION_REQUIRED", exr4Owner: "activated-organization", retirementPrerequisites: ["map report links", "preserve report permissions", "confirm registry ownership"] }),
  surface("EXR3-P10", "Release Assurance", "/release-assurance", ["arag_release_actor", "shs_admin"], "WORKFLOW", "WORKFLOW", "KEEP", "/release-assurance", "ARAG release gate", "P1_JOURNEY", { exr4Owner: "bos-customer-operator" }),
  surface("EXR3-P11", "Truth Spine", "/truth-spine", ["shs_admin"], "DETAIL", "DETAIL", "KEEP_AND_POLISH", "/truth-spine", "Truth source inspection", "P2_STRUCTURAL", { frontendDesignDeferral: true }),
  surface("EXR3-P12", "Oracle", "/oracle", ["shs_admin"], "DETAIL", "DETAIL", "KEEP_AND_POLISH", "/oracle", "Oracle inspection", "P2_STRUCTURAL", { frontendDesignDeferral: true }),
  surface("EXR3-P13", "Agent Fabric", "/agent-fabric|/agents/workbench", ["agent_operator", "shs_admin"], "WORKSPACE", "WORKSPACE", "SPLIT_BY_ROLE", "/agent-fabric", "Agent operator workbench and admin oversight", "P1_JOURNEY", { roleMixed: true, exr4Owner: "bos-customer-operator", dependencies: ["Agent Fabric role projections"] }),
  surface("EXR3-P14", "Documentation Center", "/documentation|/documentation/:id", ["public", "user", "admin"], "HELP", "GUIDANCE", "MOVE", "/help", "Contextual DGAL guidance", "P2_STRUCTURAL", { frontendDesignDeferral: true }),
  surface("EXR3-P15", "Student Dashboard", "/curriculum.html#/dashboard", ["learner"], "DASHBOARD", "DASHBOARD", "KEEP_AND_POLISH", "/curriculum.html#/dashboard", "Student current-work dashboard", "P1_JOURNEY", { exr4Owner: "student" , frontendDesignDeferral: true }),
  surface("EXR3-P16", "Lesson", "/curriculum.html#/lesson/:id", ["learner", "instructor"], "WORKFLOW", "WORKFLOW", "KEEP", "/curriculum.html#/lesson/:id", "Lesson workflow", "P1_JOURNEY", { exr4Owner: "student" }),
  surface("EXR3-P17", "Parent Dashboard", "/curriculum.html#/parent", ["parent"], "DASHBOARD", "DETAIL", "SPLIT_BY_ROLE", "/curriculum.html#/parent", "Bounded learner support detail", "P2_STRUCTURAL", { roleMixed: true, frontendDesignDeferral: true, dependencies: ["bounded parent projection"] }),
  surface("EXR3-P18", "Calendar/Live Learning", "/curriculum.html#/calendar|/live-learning", ["learner", "instructor"], "WORKFLOW", "WORKFLOW", "TURN_INTO_WORKFLOW", "/curriculum.html#/calendar", "Schedule and live-session workflow", "P1_JOURNEY", { exr4Owner: "student" }),
  surface("EXR3-P19", "Projects/Portfolio", "/curriculum.html#/projects|/portfolio", ["learner", "instructor"], "WORKSPACE", "WORKSPACE", "REORGANIZE", "/curriculum.html#/projects", "Applied work workspace", "P2_STRUCTURAL"),
  surface("EXR3-P20", "Career Dashboard", "/career.html#/dashboard", ["learner"], "DASHBOARD", "DASHBOARD", "KEEP_AND_POLISH", "/career.html#/dashboard", "Career progression dashboard", "P1_JOURNEY", { exr4Owner: "student", frontendDesignDeferral: true }),
  surface("EXR3-P21", "Career Detail", "/career.html#/pathways|/opportunities|/credentials", ["learner", "public"], "DASHBOARD", "DETAIL", "TURN_INTO_DETAIL_PAGE", "/career.html#/pathways", "Pathway, opportunity, or credential detail", "P2_STRUCTURAL"),
  surface("EXR3-P22", "Studio Home", "/studio.html#/", ["studio_builder", "studio_qa", "studio_reviewer"], "WORKSPACE", "WORKSPACE", "REORGANIZE", "/studio.html#/", "Project-stage workspace entry", "P1_JOURNEY", { ncaIntegration: "NCA_INTEGRATION_REQUIRED", exr4Owner: "studio", roleMixed: true }),
  surface("EXR3-P23", "Studio Project", "/studio.html#/project/:id", ["studio_builder", "studio_qa", "studio_reviewer"], "WORKSPACE", "WORKSPACE", "KEEP", "/studio.html#/project/:id", "Stage-aware project context", "P1_JOURNEY", { exr4Owner: "studio" }),
  surface("EXR3-P24", "Studio Builder", "/studio.html#/builder|/admin.html#/builder", ["studio_builder"], "WORKFLOW", "WORKFLOW", "SPLIT_BY_ROLE", "/studio.html#/builder", "Builder stage workspace", "P1_JOURNEY", { roleMixed: true, exr4Owner: "studio", retirementPrerequisites: ["preserve admin builder deep link"] }),
  surface("EXR3-P25", "Studio QA", "/studio.html#/qa", ["studio_qa"], "DASHBOARD", "QUEUE", "TURN_INTO_QUEUE", "/studio.html#/qa", "Studio QA queue", "P1_JOURNEY", { exr4Owner: "studio" }),
  surface("EXR3-P26", "Studio Review/Handoff", "/studio.html#/review|/studio.html#/handoff", ["studio_reviewer", "shs_admin"], "WORKFLOW", "WORKFLOW", "TURN_INTO_WORKFLOW", "/studio.html#/review", "Review and handoff workflow", "P1_JOURNEY", { ncaIntegration: "NCA_INTEGRATION_REQUIRED", exr4Owner: "studio" }),
  surface("EXR3-P27", "CivicSure Explorer", "/civicsure/*", ["public"], "DASHBOARD", "DISCOVERY", "KEEP", "/civicsure", "CivicSure public discovery", "P2_STRUCTURAL"),
  surface("EXR3-P28", "CivicSure Provider", "/operator/civicsure/provider", ["provider"], "WORKSPACE", "WORKSPACE", "SPLIT_BY_ROLE", "/operator/civicsure/provider", "Assigned provider evidence workspace", "P1_JOURNEY", { roleMixed: true, exr4Owner: "civicsure-provider", dependencies: ["CivicSure provider projection"] }),
  surface("EXR3-P29", "CivicSure Operator", "/operator/civicsure/operator", ["shs_admin"], "DASHBOARD", "QUEUE", "TURN_INTO_QUEUE", "/operator/civicsure/operator", "CivicSure assurance queue", "P1_JOURNEY", { ncaIntegration: "NCA_INTEGRATION_REQUIRED", exr4Owner: "civicsure-operator" }),
  surface("EXR3-P30", "Organization Onboarding", "/operator/onboarding", ["applicant", "org_operator"], "DASHBOARD", "WORKFLOW", "TURN_INTO_WORKFLOW", "/operator/onboarding", "Applicant case and reviewer workflow", "P1_JOURNEY", { ncaIntegration: "NCA_INTEGRATION_REQUIRED", exr4Owner: "organization-applicant", roleMixed: true }),
  surface("EXR3-P31", "Accommodation", "/operator/accommodations", ["learner", "accessibility_operator"], "WORKFLOW", "WORKFLOW", "KEEP", "/operator/accommodations", "Contextual accommodation workflow", "P1_JOURNEY", { exr4Owner: "accessibility-support-user" }),
  surface("EXR3-P32", "Accessibility Operations", "/operator/accessibility-operations", ["accessibility_operator"], "DASHBOARD", "DASHBOARD", "KEEP_AND_POLISH", "/operator/accessibility-operations", "Accessibility operations dashboard and queues", "P1_JOURNEY", { ncaIntegration: "NCA_INTEGRATION_REQUIRED", exr4Owner: "accessibility-support-user", frontendDesignDeferral: true }),
  surface("EXR3-P33", "Accessibility Settings", "/curriculum.html#/accessibility", ["learner"], "SETTINGS", "SETTINGS", "MOVE", "/account/accessibility", "Personal accessibility settings", "P2_STRUCTURAL"),
  surface("EXR3-P34", "OAS", "/oas", ["public", "user"], "GUIDANCE", "GUIDANCE", "REORGANIZE", "/oas", "Orientation and destination guidance", "P2_STRUCTURAL"),
  surface("EXR3-P35", "Universe", "/universe", ["public", "user"], "DISCOVERY", "DISCOVERY", "KEEP_AND_POLISH", "/universe", "Optional ecosystem discovery", "P2_STRUCTURAL", { frontendDesignDeferral: true }),
  surface("EXR3-P36", "Arcade Shell", "/arcade.html#/", ["learner"], "WORKSPACE", "WORKSPACE", "KEEP_AND_POLISH", "/arcade.html#/", "Learning practice workspace", "P2_STRUCTURAL", { ncaIntegration: "NCA_INTEGRATION_REQUIRED", frontendDesignDeferral: true }),
  surface("EXR3-P37", "Store/Employer", "/store.html#/|/employer.html#/", ["public", "employer"], "CATALOG", "CATALOG", "STREAMLINE", "/store", "Catalog and employer discovery", "P2_STRUCTURAL", { ncaIntegration: "NCA_INTEGRATION_REQUIRED" }),
]);

export const EXR_DASHBOARD_RECLASSIFICATION = Object.freeze([
  { id: "student", classification: "TRUE_DASHBOARD", disposition: "KEEP_AND_POLISH" },
  { id: "instructor-operations", classification: "WORKFLOW", disposition: "REORGANIZE" },
  { id: "parent", classification: "LANDING", disposition: "SPLIT_BY_ROLE" },
  { id: "career", classification: "TRUE_DASHBOARD", disposition: "KEEP_AND_POLISH" },
  { id: "hub-workspace", classification: "TRUE_DASHBOARD", disposition: "REORGANIZE" },
  { id: "hub-leadership", classification: "TRUE_DASHBOARD", disposition: "KEEP_AND_POLISH" },
  { id: "hub-queue", classification: "QUEUE", disposition: "TURN_INTO_QUEUE" },
  { id: "executive-command", classification: "TRUE_DASHBOARD", disposition: "KEEP_AND_POLISH" },
  { id: "reporting-command", classification: "REPORT", disposition: "MERGE" },
  { id: "organization-onboarding", classification: "WORKFLOW", disposition: "TURN_INTO_WORKFLOW" },
  { id: "civicsure-provider", classification: "WORKFLOW", disposition: "SPLIT_BY_ROLE" },
  { id: "civicsure-operator", classification: "QUEUE", disposition: "TURN_INTO_QUEUE" },
  { id: "studio-home", classification: "LANDING", disposition: "REORGANIZE" },
  { id: "studio-qa", classification: "QUEUE", disposition: "TURN_INTO_QUEUE" },
  { id: "studio-review", classification: "WORKFLOW", disposition: "TURN_INTO_WORKFLOW" },
  { id: "agent-fabric", classification: "WORKFLOW", disposition: "SPLIT_BY_ROLE" },
  { id: "arag", classification: "TRUE_DASHBOARD", disposition: "KEEP" },
  { id: "accessibility-operations", classification: "TRUE_DASHBOARD", disposition: "KEEP_AND_POLISH" },
  { id: "foundation-impact", classification: "REPORT", disposition: "KEEP_AND_POLISH" },
  { id: "civicsure-public", classification: "DISCOVERY", disposition: "KEEP" },
]);

export const EXR_ALIAS_CONSOLIDATION_PLAN = Object.freeze(
  EXR_IA_ALIASES.map((alias) => ({
    ...alias,
    classification: alias.classification === "DEFER_TO_EXR_3" ? "REDIRECT_CANDIDATE" : alias.classification,
    exr3Action: alias.classification === "DEFER_TO_EXR_3" ? "plan redirect after usage, permissions, and deep-link review" : alias.exr3Action,
  })),
);

export const EXR_NCA_INTEGRATION_SURFACES = Object.freeze(
  EXR_PAGE_CONSOLIDATION_PLAN.filter((entry) => entry.ncaIntegration === "NCA_INTEGRATION_REQUIRED").map((entry) => entry.id),
);

export const EXR_EXR4_BACKLOG = Object.freeze([
  { id: "EXR4-01", journey: "organization-applicant", priority: "P1_JOURNEY", surfaces: ["EXR3-P30"], goal: "Implement applicant case, reviewer queue/detail, activation, and first-service transition composition.", dependencies: ["onboarding lifecycle", "entitlement projection"] },
  { id: "EXR4-02", journey: "activated-organization", priority: "P1_JOURNEY", surfaces: ["EXR3-P05", "EXR3-P06", "EXR3-P07"], goal: "Implement Hub as role/org/entitlement-aware operating environment.", dependencies: ["Hub APIs", "NCA shell slots"] },
  { id: "EXR4-03", journey: "student", priority: "P1_JOURNEY", surfaces: ["EXR3-P15", "EXR3-P16", "EXR3-P18"], goal: "Prioritize current learning work, next action, and lesson progression.", dependencies: ["Curriculum projections"] },
  { id: "EXR4-04", journey: "instructor", priority: "P1_JOURNEY", surfaces: ["EXR3-P16", "EXR3-P18"], goal: "Expose instructor work queues and session workflows without student-control leakage.", dependencies: ["Curriculum role projections"] },
  { id: "EXR4-05", journey: "studio", priority: "P1_JOURNEY", surfaces: ["EXR3-P22", "EXR3-P23", "EXR3-P24", "EXR3-P25", "EXR3-P26"], goal: "Implement Builder to QA to Review/Handoff stage-aware experience.", dependencies: ["Studio workflow authority"] },
  { id: "EXR4-06", journey: "civicsure-provider", priority: "P1_JOURNEY", surfaces: ["EXR3-P28"], goal: "Implement assigned provider evidence workspace with public/operator separation.", dependencies: ["CivicSure provider projection"] },
  { id: "EXR4-07", journey: "civicsure-operator", priority: "P1_JOURNEY", surfaces: ["EXR3-P29"], goal: "Implement operator assurance queue and correction workflow.", dependencies: ["CivicSure operator APIs"] },
  { id: "EXR4-08", journey: "bos-customer-operator", priority: "P1_JOURNEY", surfaces: ["EXR3-P05", "EXR3-P10", "EXR3-P13"], goal: "Reconcile BOS operating context, governed agent work, and ARAG handoff.", dependencies: ["BOS/ARAG authority boundaries"] },
  { id: "EXR4-09", journey: "accessibility-support-user", priority: "P1_JOURNEY", surfaces: ["EXR3-P31", "EXR3-P32", "EXR3-P33"], goal: "Implement contextual accessibility, accommodation, operations, and support entry paths.", dependencies: ["AX-4", "AX-5", "AX-6"] },
]);

export function getConsolidationById(id) {
  return EXR_PAGE_CONSOLIDATION_PLAN.find((entry) => entry.id === id) || null;
}

export function validateExrPageConsolidation() {
  const errors = [];
  const ids = new Set();
  const targets = new Set(EXR_PAGE_CONSOLIDATION_PLAN.map((entry) => entry.targetSurface));
  for (const entry of EXR_PAGE_CONSOLIDATION_PLAN) {
    if (ids.has(entry.id)) errors.push(`duplicate consolidation id: ${entry.id}`);
    ids.add(entry.id);
    if (!EXR_CONSOLIDATION_DISPOSITIONS.includes(entry.disposition)) errors.push(`${entry.id}: invalid disposition`);
    if (!EXR_CONSOLIDATION_PRIORITIES.includes(entry.priority)) errors.push(`${entry.id}: invalid priority`);
    if (!entry.targetDestination || !entry.targetSurface) errors.push(`${entry.id}: missing target`);
    if (["MERGE", "SPLIT_BY_ROLE", "REPLACE", "RETIRE"].includes(entry.disposition) && !entry.dependencies.length && !entry.retirementPrerequisites.length) errors.push(`${entry.id}: structural change lacks dependency plan`);
    if (entry.disposition === "SPLIT_BY_ROLE" && (!entry.roleMixed || entry.actor.length < 1)) errors.push(`${entry.id}: split must identify role-mixed actor boundary`);
    if (entry.priority === "P1_JOURNEY" && !entry.exr4Owner) errors.push(`${entry.id}: P1 journey lacks EXR-4 owner`);
    if (entry.disposition === "RETIRE" && (!entry.retirementPrerequisites.length || !entry.targetDestination)) errors.push(`${entry.id}: retirement prerequisites incomplete`);
    if (entry.targetSurface && !targets.has(entry.targetSurface)) errors.push(`${entry.id}: target surface missing`);
    if (entry.ncaIntegration === "NCA_INTEGRATION_REQUIRED" && entry.ncaIntegration.includes("STATE")) errors.push(`${entry.id}: consolidation plan must not own notification state`);
  }
  if (EXR_PAGE_CONSOLIDATION_PLAN.length !== 37) errors.push(`expected 37 page surfaces, found ${EXR_PAGE_CONSOLIDATION_PLAN.length}`);
  if (EXR_DASHBOARD_RECLASSIFICATION.length !== 20) errors.push(`expected 20 dashboard surfaces, found ${EXR_DASHBOARD_RECLASSIFICATION.length}`);
  if (EXR_ALIAS_CONSOLIDATION_PLAN.some((entry) => !["ALIAS_KEEP", "REDIRECT_CANDIDATE", "CANONICAL"].includes(entry.classification))) errors.push("all aliases must have a final EXR-3 classification");
  if (EXR_EXR4_BACKLOG.some((entry) => entry.priority === "P1_JOURNEY" && !entry.goal)) errors.push("P1 backlog item missing implementation goal");
  return { valid: errors.length === 0, errors };
}
