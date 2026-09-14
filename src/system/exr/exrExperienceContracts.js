import { SEA_SERVICE_EXPERIENCE_CONTRACTS } from "../sea/serviceExperienceContracts.js";

export const EXR_CONTRACT_SCHEMA_VERSION = 1;

export const EXR_CAPABILITY_STATES = Object.freeze([
  "HIDDEN",
  "LOCKED",
  "PENDING",
  "VISIBLE",
  "AVAILABLE",
]);

export const EXR_JOURNEY_STATES = Object.freeze([
  "DISCOVERY",
  "APPLICATION",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "ACTIVATED",
  "FIRST_SERVICE_USE",
  "OPERATING",
  "IN_PROGRESS",
  "WAITING",
  "BLOCKED",
  "COMPLETE",
]);

export const EXR_NEXT_ACTION_SOURCES = Object.freeze([
  "DOMAIN_PROJECTION",
  "WORKFLOW_STATE_MACHINE",
  "OGL_RESOLVER",
  "SEA_PROJECTION",
  "NONE",
]);

export const EXR_RETURN_TARGETS = Object.freeze([
  "CURRENT_WORK",
  "ROLE_QUEUE",
  "ROLE_DASHBOARD",
  "PUBLIC_DISCOVERY",
  "CONTEXT_SELECTION",
]);

const role = (id, label, organizationContext, defaultReturnTarget, allowedSurfaceKinds) => ({
  id,
  label,
  organizationContext,
  defaultReturnTarget,
  allowedSurfaceKinds,
});

export const EXR_ROLE_CONTEXT_CONTRACTS = Object.freeze([
  role("public", "Public visitor", "NONE", "PUBLIC_DISCOVERY", ["PUBLIC_LANDING", "DISCOVERY", "DIRECTORY", "CATALOG", "GUIDANCE"]),
  role("learner", "Learner", "ACTIVE_LEARNER_ORGANIZATION", "ROLE_DASHBOARD", ["DASHBOARD", "WORKFLOW", "DETAIL", "SETTINGS", "HELP"]),
  role("instructor", "Instructor", "ACTIVE_LEARNER_ORGANIZATION", "ROLE_QUEUE", ["DASHBOARD", "QUEUE", "WORKFLOW", "DETAIL", "HELP"]),
  role("parent", "Parent or guardian", "AUTHORIZED_LEARNER_ORGANIZATION", "ROLE_DASHBOARD", ["DASHBOARD", "DETAIL", "HELP"]),
  role("applicant", "Organization applicant", "APPLICANT_ORGANIZATION", "CURRENT_WORK", ["WORKFLOW", "DETAIL", "HELP"]),
  role("org_operator", "Organization operator", "ACTIVE_ORGANIZATION", "ROLE_DASHBOARD", ["DASHBOARD", "QUEUE", "WORKFLOW", "REPORT", "HELP"]),
  role("org_admin", "Organization administrator", "ACTIVE_ORGANIZATION", "ROLE_DASHBOARD", ["DASHBOARD", "QUEUE", "WORKFLOW", "REPORT", "SETTINGS", "HELP"]),
  role("provider", "CivicSure provider", "ACTIVE_PROVIDER_ORGANIZATION", "CURRENT_WORK", ["WORKSPACE", "WORKFLOW", "DETAIL", "HELP"]),
  role("studio_reviewer", "Studio reviewer", "ACTIVE_PROJECT_ORGANIZATION", "ROLE_QUEUE", ["QUEUE", "WORKFLOW", "DETAIL", "HELP"]),
  role("shs_admin", "SHS administrator", "ACTIVE_PLATFORM_ORGANIZATION", "ROLE_DASHBOARD", ["DASHBOARD", "QUEUE", "WORKFLOW", "DETAIL", "REPORT", "ADMIN", "HELP"]),
  role("accessibility_operator", "Accessibility operator", "AUTHORIZED_OPERATIONS_SCOPE", "ROLE_QUEUE", ["DASHBOARD", "QUEUE", "DETAIL", "WORKFLOW", "HELP"]),
  role("arag_release_actor", "ARAG release actor", "AUTHORIZED_RELEASE_SCOPE", "CURRENT_WORK", ["WORKFLOW", "DETAIL", "REPORT", "HELP"]),
]);

const capability = (id, label, serviceId, stateRules, primarySurface, nextActionSource) => ({
  id,
  label,
  serviceId,
  stateRules,
  primarySurface,
  nextActionSource,
});

export const EXR_CAPABILITY_EXPOSURE_CONTRACTS = Object.freeze([
  capability("public-service-discovery", "Service discovery", "shf-public-impact", { public: "AVAILABLE", authenticated: "VISIBLE" }, "DISCOVERY", "SEA_PROJECTION"),
  capability("organization-application", "Organization application", "organization-onboarding", { public: "VISIBLE", applicant: "AVAILABLE", operator: "AVAILABLE", activated: "HIDDEN" }, "WORKFLOW", "WORKFLOW_STATE_MACHINE"),
  capability("organization-first-service", "First entitled service", "bos-hub", { pending: "PENDING", activated: "AVAILABLE", unentitled: "HIDDEN" }, "WORKFLOW", "DOMAIN_PROJECTION"),
  capability("hub-operating-work", "Organization operating work", "bos-hub", { entitled: "AVAILABLE", unentitled: "HIDDEN", suspended: "LOCKED" }, "DASHBOARD", "OGL_RESOLVER"),
  capability("student-learning", "Assigned learning", "student-learning", { assigned: "AVAILABLE", not_assigned: "HIDDEN", blocked: "LOCKED", complete: "VISIBLE" }, "DASHBOARD", "DOMAIN_PROJECTION"),
  capability("instructor-operations", "Instructor operations", "instructor", { authorized: "AVAILABLE", unauthorized: "HIDDEN", waiting: "PENDING" }, "QUEUE", "DOMAIN_PROJECTION"),
  capability("career-exploration", "Career exploration", "career", { public: "VISIBLE", entitled: "AVAILABLE", unavailable: "LOCKED" }, "DASHBOARD", "DOMAIN_PROJECTION"),
  capability("studio-stage-work", "Studio stage work", "studio", { assigned_stage: "AVAILABLE", other_stage: "VISIBLE", unauthorized: "HIDDEN", waiting: "PENDING" }, "WORKFLOW", "WORKFLOW_STATE_MACHINE"),
  capability("civicsure-provider-work", "Provider evidence work", "civicsure-provider", { assigned: "AVAILABLE", unassigned: "HIDDEN", correction_required: "PENDING" }, "WORKSPACE", "DOMAIN_PROJECTION"),
  capability("accessibility-settings", "Personal Accessibility Settings", "curriculum", { supported: "AVAILABLE", unsupported: "HIDDEN" }, "SETTINGS", "NONE"),
  capability("accommodation-workflow", "Institutional accommodation", "organization-onboarding", { requestor: "AVAILABLE", unauthorized: "HIDDEN", under_review: "PENDING", active: "AVAILABLE" }, "WORKFLOW", "WORKFLOW_STATE_MACHINE"),
  capability("accessibility-operations", "Accessibility Operations", "bos-hub", { operator: "AVAILABLE", non_operator: "HIDDEN", human_review: "PENDING" }, "QUEUE", "DOMAIN_PROJECTION"),
  capability("reporting", "Contextual reporting", "reporting-metric-registry", { authorized: "AVAILABLE", unauthorized: "HIDDEN", pending_data: "PENDING" }, "REPORT", "SEA_PROJECTION"),
]);

const journey = (id, audience, stages, currentWorkKinds, returnTarget, nextActionSource) => ({
  id,
  audience,
  stages,
  currentWorkKinds,
  returnTarget,
  nextActionSource,
});

export const EXR_CUSTOMER_JOURNEY_CONTRACTS = Object.freeze([
  journey("public-discovery", ["public"], ["DISCOVERY"], ["DISCOVERY", "DIRECTORY", "CATALOG"], "PUBLIC_DISCOVERY", "SEA_PROJECTION"),
  journey("organization-onboarding", ["applicant", "org_operator"], ["DISCOVERY", "APPLICATION", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "ACTIVATED", "FIRST_SERVICE_USE", "OPERATING"], ["WORKFLOW", "DETAIL"], "CURRENT_WORK", "WORKFLOW_STATE_MACHINE"),
  journey("student-learning", ["learner"], ["IN_PROGRESS", "WAITING", "BLOCKED", "COMPLETE"], ["DASHBOARD", "WORKFLOW", "DETAIL"], "CURRENT_WORK", "DOMAIN_PROJECTION"),
  journey("instructor-operations", ["instructor"], ["IN_PROGRESS", "WAITING", "BLOCKED", "COMPLETE"], ["QUEUE", "WORKFLOW", "DETAIL"], "ROLE_QUEUE", "DOMAIN_PROJECTION"),
  journey("career-progression", ["learner", "public"], ["DISCOVERY", "IN_PROGRESS", "COMPLETE"], ["DASHBOARD", "DETAIL"], "ROLE_DASHBOARD", "DOMAIN_PROJECTION"),
  journey("studio-lifecycle", ["studio_reviewer", "shs_admin"], ["IN_PROGRESS", "UNDER_REVIEW", "APPROVED", "COMPLETE"], ["WORKSPACE", "QUEUE", "WORKFLOW", "DETAIL"], "CURRENT_WORK", "WORKFLOW_STATE_MACHINE"),
  journey("civicsure-assurance", ["provider", "shs_admin"], ["IN_PROGRESS", "UNDER_REVIEW", "BLOCKED", "COMPLETE"], ["WORKSPACE", "QUEUE", "WORKFLOW", "DETAIL"], "CURRENT_WORK", "DOMAIN_PROJECTION"),
  journey("accessibility-support", ["learner", "accessibility_operator"], ["DISCOVERY", "APPLICATION", "UNDER_REVIEW", "IN_PROGRESS", "COMPLETE"], ["SETTINGS", "WORKFLOW", "QUEUE", "HELP"], "CURRENT_WORK", "WORKFLOW_STATE_MACHINE"),
  journey("arag-release", ["arag_release_actor", "shs_admin"], ["IN_PROGRESS", "WAITING", "BLOCKED", "APPROVED", "COMPLETE"], ["WORKFLOW", "DETAIL", "REPORT"], "CURRENT_WORK", "DOMAIN_PROJECTION"),
]);

export const EXR_PUBLIC_ENTRY_CONTRACT = Object.freeze({
  foundation: { role: "institutional_public_entry", routes: ["/top", "/mission", "/impact", "/apps"] },
  solutions: { role: "service_discovery_entry", routes: ["/solutions/home", "/layers", "/request-demo"] },
  universe: { role: "optional_discovery_experience", routes: ["/universe"] },
  products: { role: "secondary_destination", routes: ["/career", "/civicsure", "/oas", "/store"] },
});

export const EXR_HUB_CONTRACT = Object.freeze({
  owner: "SHS/BOS",
  purpose: "Organization operating environment with role projections",
  excluded: ["generic ecosystem super-dashboard", "SHF platform administration", "source-domain workflow authority"],
  roleProjections: ["org_operator", "org_admin", "shs_admin"],
  contextRequired: ["organization", "role", "entitlement"],
});

export const EXR_ACCESSIBILITY_PLACEMENT_CONTRACT = Object.freeze({
  personalSettings: "ACCOUNT_SETTINGS",
  accommodation: "LEARNER_SUPPORT_OR_ORGANIZATION_WORKFLOW",
  helpCompanion: "SHARED_HELP",
  operations: "AUTHORIZED_OPERATOR_ADMIN",
  separation: ["PERSONAL_ACCESSIBILITY", "INSTITUTIONAL_ACCOMMODATION", "ACCESSIBILITY_OPERATIONS", "HUMAN_SUPPORT"],
});

export const EXR_REPORTING_ENTRY_CONTRACT = Object.freeze({
  strategy: "CONTEXT_SPECIFIC_GOVERNED_REGISTRY",
  personalProgress: "CURRICULUM",
  operational: "REPORTING_AND_HUB_PROJECTION",
  executive: "EXECUTIVE_COMMAND",
  publicImpact: "FOUNDATION_AND_CIVICSURE_PUBLIC",
  funder: "AUTHORIZED_FUNDING_SURFACE",
  truthOracle: "SOURCE_AUTHORITY_INSPECTION",
});

export const EXR_SHELL_OWNERSHIP_CONTRACT = Object.freeze({
  exr: ["shell_ia", "primary_navigation", "secondary_navigation", "organization_context", "role_context", "placement_slots", "page_composition"],
  notifications: ["notification_state", "recipient_projection", "bell_inbox_behavior", "communication_delivery_state", "attention_data_projection"],
});

export function getSeaContract(serviceId) {
  return SEA_SERVICE_EXPERIENCE_CONTRACTS.find((entry) => entry.serviceId === serviceId) || null;
}

export function getRoleContext(roleId) {
  return EXR_ROLE_CONTEXT_CONTRACTS.find((entry) => entry.id === roleId) || null;
}

export function resolveCapabilityState(capabilityId, condition) {
  const contract = EXR_CAPABILITY_EXPOSURE_CONTRACTS.find((entry) => entry.id === capabilityId);
  return contract?.stateRules?.[condition] || "HIDDEN";
}

export function getJourneyContract(journeyId) {
  return EXR_CUSTOMER_JOURNEY_CONTRACTS.find((entry) => entry.id === journeyId) || null;
}

export function getReturnTarget({ hasCurrentWork = false, hasRoleQueue = false, isPublic = false } = {}) {
  if (hasCurrentWork) return "CURRENT_WORK";
  if (hasRoleQueue) return "ROLE_QUEUE";
  if (isPublic) return "PUBLIC_DISCOVERY";
  return "ROLE_DASHBOARD";
}
