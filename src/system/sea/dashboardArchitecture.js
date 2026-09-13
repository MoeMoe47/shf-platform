import { SEA_SERVICE_EXPERIENCE_CONTRACTS } from "./serviceExperienceContracts.js";

export const DASHBOARD_SECTIONS = Object.freeze(["CONTEXT", "ATTENTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"]);
export const ATTENTION_TYPES = Object.freeze(["ACTION_REQUIRED", "WAITING", "BLOCKED", "AT_RISK", "DEADLINE", "REVIEW_REQUIRED", "APPROVAL_REQUIRED"]);
export const SOURCE_STATUS = Object.freeze(["AVAILABLE", "PARTIAL", "UNAVAILABLE", "STALE", "NOT_APPLICABLE"]);
export const ACTION_HIERARCHY = Object.freeze(["PRIMARY", "SECONDARY", "REFERENCE"]);
export const NEXT_ACTION_PRIORITY = Object.freeze(["SAFETY_AUTHORITY", "REQUIRED_ACTION", "BLOCKER", "APPROVAL_REVIEW", "DEADLINE", "ACTIVE_WORK", "OPTIONAL", "REFERENCE"]);
export const DENSITY = Object.freeze(["LOW", "MODERATE", "HIGH"]);

const patterns = {
  LEARNER: { required: ["CONTEXT", "ATTENTION", "WORK", "HELP"], optional: ["PROGRESS", "INTELLIGENCE"], density: "LOW", prohibited: ["operator queue", "approval authority"] },
  INSTRUCTOR: { required: ["CONTEXT", "ATTENTION", "WORK", "HELP"], optional: ["PROGRESS", "INTELLIGENCE"], density: "MODERATE", prohibited: ["learner-only action authority"] },
  APPLICANT: { required: ["CONTEXT", "ATTENTION", "WORK", "HELP"], optional: ["PROGRESS", "INTELLIGENCE"], density: "LOW", prohibited: ["reviewer action", "activation authority"] },
  REVIEWER_OPERATOR: { required: ["CONTEXT", "ATTENTION", "WORK", "HELP"], optional: ["PROGRESS", "INTELLIGENCE"], density: "HIGH", prohibited: ["provider self-service authority"] },
  PROVIDER: { required: ["CONTEXT", "ATTENTION", "WORK", "HELP"], optional: ["PROGRESS", "INTELLIGENCE"], density: "MODERATE", prohibited: ["verification authority", "payment authority"] },
  BUILDER: { required: ["CONTEXT", "ATTENTION", "WORK", "HELP"], optional: ["PROGRESS", "INTELLIGENCE"], density: "MODERATE", prohibited: ["QA approval", "release approval"] },
  QA_REVIEW: { required: ["CONTEXT", "ATTENTION", "WORK", "HELP"], optional: ["PROGRESS", "INTELLIGENCE"], density: "HIGH", prohibited: ["builder authority", "release bypass"] },
  EXECUTIVE: { required: ["CONTEXT", "ATTENTION", "HELP"], optional: ["WORK", "PROGRESS", "INTELLIGENCE"], density: "LOW", prohibited: ["superuser", "direct downstream mutation"] },
  GOVERNED_AI_OPERATOR: { required: ["CONTEXT", "ATTENTION", "WORK", "HELP"], optional: ["PROGRESS", "INTELLIGENCE"], density: "HIGH", prohibited: ["unrestricted execution", "release authority"] },
  DOCUMENT_REQUIREMENT: { required: ["CONTEXT", "ATTENTION", "WORK", "HELP"], optional: ["PROGRESS", "INTELLIGENCE"], density: "MODERATE", prohibited: ["service completion authority"] },
  ANALYST_REPORTING: { required: ["CONTEXT", "ATTENTION", "WORK", "HELP"], optional: ["PROGRESS", "INTELLIGENCE"], density: "HIGH", prohibited: ["unverified outcome claim"] },
  PUBLIC: { required: ["CONTEXT", "HELP"], optional: ["WORK", "PROGRESS", "INTELLIGENCE"], density: "LOW", prohibited: ["protected role metadata", "private workflow data"] },
};

const contractById = new Map(SEA_SERVICE_EXPERIENCE_CONTRACTS.map((contract) => [contract.serviceId, contract]));
const project = (serviceId, role, pattern, overrides = {}) => {
  const contract = contractById.get(serviceId);
  return {
    schemaVersion: 1,
    projectionId: overrides.projectionId || `${serviceId}:${role}`,
    serviceId,
    contractVersion: contract?.version || 1,
    role,
    responsibility: overrides.responsibility || role,
    pattern,
    sections: { context: "REQUIRED", attention: "REQUIRED", work: "REQUIRED", progress: "OPTIONAL", intelligence: "OPTIONAL", help: "REQUIRED", ...overrides.sections },
    context: overrides.context || ["service", "role", "organization", "tenant", "workflowStage", "status"],
    attention: overrides.attention || ["ACTION_REQUIRED", "WAITING", "BLOCKED", "AT_RISK"],
    work: overrides.work || ["current domain work object"],
    progress: overrides.progress || { source: "DOMAIN_STATE", representation: "canonical state or stage; no invented percentage" },
    intelligence: overrides.intelligence || { source: "DOMAIN_PROJECTION", verification: "SOURCE_STATED", purpose: "decision support only" },
    help: { ogl: true, dgal: true, companion: Boolean(contract?.companion?.enabled ?? true), accessibleAlternative: true },
    nextAction: { source: contract?.nextAction?.source || "NONE", label: overrides.nextActionLabel || "Continue the authorized service action", priority: "REQUIRED_ACTION", safeActionRef: "contract.actions.primary[0]", explanation: "Eligibility and authorization come from the owning domain.", blockedBehavior: "show canonical reason and owner", waitingBehavior: "show responsible actor/system", fallbackBehavior: "show source status and safe help" },
    secondaryActions: ["open-context", "view-help"],
    recentActivity: overrides.recentActivity || "OPTIONAL",
    notifications: ["ACTION_REQUIRED", "STATE_CHANGED", "BLOCKER", "RESOLVED"],
    sourceStatus: ["AVAILABLE", "PARTIAL", "UNAVAILABLE", "STALE", "NOT_APPLICABLE"],
    responsivePriority: overrides.responsivePriority || ["CONTEXT", "ATTENTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"],
    density: patterns[pattern]?.density || "MODERATE",
    metrics: overrides.metrics || [],
    authorityNotes: { transitionAuthority: contract?.workflow?.transitionAuthority || "Owning domain", evidenceWrite: false, truthWrite: false, companionReadOnly: true },
  };
};

export const DASHBOARD_PROJECTIONS = Object.freeze([
  project("student-learning", "learner", "LEARNER", { context: ["service", "role", "organization", "program", "course", "workflowStage", "status"], work: ["current assignment", "current lesson", "active project"], progress: { source: "DOMAIN_PROJECTION", representation: "course/unit/lesson and authorized skills/profile state" }, nextActionLabel: "Open current assignment", responsivePriority: ["CONTEXT", "ATTENTION", "nextAction", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"] }),
  project("instructor", "instructor", "INSTRUCTOR", { context: ["service", "role", "organization", "course", "cohort", "workflowStage", "status"], work: ["assignment review", "lesson preparation", "cohort work"], attention: ["ACTION_REQUIRED", "WAITING", "REVIEW_REQUIRED", "DEADLINE"], nextActionLabel: "Review instructional work", responsivePriority: ["CONTEXT", "ATTENTION", "WORK", "PROGRESS", "HELP"] }),
  project("curriculum", "learner", "LEARNER", { context: ["service", "role", "organization", "program", "course"], work: ["learning workspace"], nextActionLabel: "Continue curriculum work" }),
  project("career", "learner", "LEARNER", { context: ["service", "role", "pathway", "profile"], work: ["pathway exploration", "career-connected work"], nextActionLabel: "Continue pathway exploration", responsivePriority: ["CONTEXT", "ATTENTION", "nextAction", "WORK", "PROGRESS", "HELP"] }),
  project("organization-onboarding", "applicant", "APPLICANT", { context: ["service", "role", "organization", "application", "requestedServices", "workflowStage", "status"], work: ["application tasks", "required documents"], progress: { source: "WORKFLOW_STATE_MACHINE", representation: "SUBMITTED through GRADUATED lifecycle state" }, attention: ["ACTION_REQUIRED", "WAITING", "BLOCKED", "DEADLINE"], nextActionLabel: "Complete the next application requirement", responsivePriority: ["CONTEXT", "ATTENTION", "WORK", "PROGRESS", "HELP"] }),
  project("organization-onboarding", "reviewer", "REVIEWER_OPERATOR", { context: ["service", "role", "organization", "application", "workflowStage", "status"], work: ["review queue", "active application"], attention: ["REVIEW_REQUIRED", "ACTION_REQUIRED", "WAITING", "BLOCKED"], nextActionLabel: "Review the next application", responsivePriority: ["CONTEXT", "ATTENTION", "WORK", "PROGRESS", "HELP"] }),
  project("civicsure-provider", "provider", "PROVIDER", { context: ["service", "role", "organization", "provider", "program", "workflowStage", "status"], work: ["evidence submission", "correction response"], attention: ["ACTION_REQUIRED", "WAITING", "BLOCKED", "DEADLINE", "AT_RISK"], nextActionLabel: "Review the provider requirement", responsivePriority: ["CONTEXT", "ATTENTION", "WORK", "PROGRESS", "HELP"] }),
  project("civicsure-operator", "operator", "REVIEWER_OPERATOR", { context: ["service", "role", "organization", "providers", "programs", "verificationCases", "status"], work: ["verification queue", "active review case"], attention: ["REVIEW_REQUIRED", "ACTION_REQUIRED", "WAITING", "BLOCKED", "AT_RISK"], nextActionLabel: "Review the next assurance case", responsivePriority: ["CONTEXT", "ATTENTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"] }),
  project("studio", "builder", "BUILDER", { context: ["service", "role", "organization", "project", "workspace", "revision", "status"], work: ["workspace", "Build Packet"], attention: ["ACTION_REQUIRED", "BLOCKED", "WAITING", "AT_RISK"], nextActionLabel: "Continue the workspace build" }),
  project("studio", "reviewer", "QA_REVIEW", { projectionId: "studio:qa", responsibility: "QA", context: ["service", "role", "project", "revision", "qaRun", "status"], work: ["QA queue", "QA run", "findings"], attention: ["REVIEW_REQUIRED", "ACTION_REQUIRED", "BLOCKED", "AT_RISK"], nextActionLabel: "Review the next QA finding" }),
  project("studio", "reviewer", "QA_REVIEW", { context: ["service", "role", "project", "immutableSubmission", "revision", "status"], work: ["review queue", "submission detail"], attention: ["REVIEW_REQUIRED", "ACTION_REQUIRED", "BLOCKED", "WAITING"], nextActionLabel: "Review the submitted artifact" }),
  project("bos-hub", "org_admin", "EXECUTIVE", { context: ["service", "role", "organization", "tenant", "activeServices", "status"], work: ["operational work", "service queue"], attention: ["ACTION_REQUIRED", "WAITING", "BLOCKED", "AT_RISK"], nextActionLabel: "Open the owning service action", responsivePriority: ["CONTEXT", "ATTENTION", "nextAction", "WORK", "HELP", "INTELLIGENCE"] }),
  project("agent-fabric", "agent_operator", "GOVERNED_AI_OPERATOR", { context: ["service", "role", "organization", "workOrder", "session", "agent", "policy", "status"], work: ["active work order", "governed session"], attention: ["ACTION_REQUIRED", "WAITING", "BLOCKED", "AT_RISK", "APPROVAL_REQUIRED"], nextActionLabel: "Review the governed work order" }),
  project("arag-1", "approver", "GOVERNED_AI_OPERATOR", { context: ["service", "role", "workOrder", "repository", "provider", "release", "status"], work: ["release assurance work", "Evidence packet"], attention: ["APPROVAL_REQUIRED", "REVIEW_REQUIRED", "BLOCKED", "AT_RISK"], nextActionLabel: "Review the release gate" }),
  project("dgal", "user", "DOCUMENT_REQUIREMENT", { context: ["service", "role", "organization", "requirement", "document", "packet", "status"], work: ["required document", "packet"], attention: ["ACTION_REQUIRED", "WAITING", "BLOCKED", "DEADLINE"], nextActionLabel: "Open the applicable document" }),
  project("dgal", "admin", "DOCUMENT_REQUIREMENT", { context: ["service", "role", "organization", "documentLifecycle", "requirement", "status"], work: ["document lifecycle", "requirement status"], attention: ["REVIEW_REQUIRED", "ACTION_REQUIRED", "BLOCKED", "APPROVAL_REQUIRED"], nextActionLabel: "Review the document lifecycle" }),
  project("truth-spine", "auditor", "ANALYST_REPORTING", { context: ["service", "role", "scope", "projection", "version", "status"], work: ["Truth projection review"], attention: ["REVIEW_REQUIRED", "BLOCKED", "AT_RISK"], nextActionLabel: "Inspect the source-qualified projection" }),
  project("reporting-metric-registry", "analyst", "ANALYST_REPORTING", { context: ["service", "role", "report", "metric", "scope", "status"], work: ["report", "metric", "projection"], attention: ["ACTION_REQUIRED", "REVIEW_REQUIRED", "BLOCKED", "AT_RISK", "DEADLINE"], nextActionLabel: "Review report readiness", responsivePriority: ["CONTEXT", "ATTENTION", "WORK", "INTELLIGENCE", "HELP"] }),
  project("executive-command", "shs_admin", "EXECUTIVE", { sections: { work: "N/A" }, context: ["service", "role", "organization", "criticalAttention", "status"], work: ["bounded executive review"], attention: ["ACTION_REQUIRED", "WAITING", "BLOCKED", "AT_RISK"], nextActionLabel: "Open the owning service", responsivePriority: ["CONTEXT", "ATTENTION", "INTELLIGENCE", "HELP"] }),
]);

export const DASHBOARD_PATTERN_LIBRARY = Object.freeze(patterns);
export const DASHBOARD_ARCHITECTURE = Object.freeze({ schemaVersion: 1, sections: DASHBOARD_SECTIONS, attentionTypes: ATTENTION_TYPES, sourceStatus: SOURCE_STATUS, actionHierarchy: ACTION_HIERARCHY, nextActionPriority: NEXT_ACTION_PRIORITY, density: DENSITY, patterns: DASHBOARD_PATTERN_LIBRARY, projections: DASHBOARD_PROJECTIONS });
