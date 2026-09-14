import {
  EXR_CAPABILITY_EXPOSURE_CONTRACTS,
  EXR_CAPABILITY_STATES,
  EXR_NEXT_ACTION_SOURCES,
  getReturnTarget,
} from "./exrExperienceContracts.js";
import { EXR_NOTIFICATION_SLOTS, resolveExrNavigation } from "./exrInformationArchitecture.js";

export const EXR4_JOURNEY_IDS = Object.freeze([
  "organization-applicant",
  "activated-organization",
  "student",
  "instructor",
  "studio-builder",
  "studio-qa",
  "studio-reviewer",
  "civicsure-provider",
  "civicsure-operator",
  "accessibility-support-user",
  "bos-customer-operator",
]);

export const EXR4_EXPOSURE_STATES = EXR_CAPABILITY_STATES;

export const EXR4_JOURNEY_CONTRACTS = Object.freeze({
  "organization-applicant": { entry: "/operator/onboarding", context: "applicant organization", currentWork: "application case", help: "/help", returnTarget: "CURRENT_WORK" },
  "activated-organization": { entry: "/hub", context: "active organization", currentWork: "organization operating work", help: "/help", returnTarget: "CURRENT_WORK" },
  student: { entry: "/curriculum.html#/dashboard", context: "learner organization", currentWork: "current assignment or lesson", help: "/help", returnTarget: "CURRENT_WORK" },
  instructor: { entry: "/curriculum.html#/instructor/operations", context: "instructional scope", currentWork: "review and intervention queue", help: "/help", returnTarget: "ROLE_QUEUE" },
  "studio-builder": { entry: "/studio.html#/builder", context: "Studio project", currentWork: "build packet", help: "/help", returnTarget: "CURRENT_WORK" },
  "studio-qa": { entry: "/studio.html#/qa", context: "Studio project", currentWork: "QA queue", help: "/help", returnTarget: "ROLE_QUEUE" },
  "studio-reviewer": { entry: "/studio.html#/review", context: "Studio project", currentWork: "review and handoff", help: "/help", returnTarget: "ROLE_QUEUE" },
  "civicsure-provider": { entry: "/operator/civicsure/provider", context: "provider organization", currentWork: "assigned evidence work", help: "/help", returnTarget: "CURRENT_WORK" },
  "civicsure-operator": { entry: "/operator/civicsure/operator", context: "CivicSure assurance scope", currentWork: "verification queue", help: "/help", returnTarget: "ROLE_QUEUE" },
  "accessibility-support-user": { entry: "/operator/accommodations", context: "accessibility support", currentWork: "support or accommodation request", help: "/help", returnTarget: "CURRENT_WORK" },
  "bos-customer-operator": { entry: "/hub", context: "active organization", currentWork: "entitled service work", help: "/help", returnTarget: "CURRENT_WORK" },
});

const capabilityIds = new Set(EXR_CAPABILITY_EXPOSURE_CONTRACTS.map((entry) => entry.id));

export function resolveJourneyExperience({ journeyId, actor, organizationId = null, roleLabel = null, entitlements = [], workflowState = null, currentWork = null, hasRoleQueue = false, nextAction = null, nextActionSource = "NONE", isPublic = false } = {}) {
  const contract = EXR4_JOURNEY_CONTRACTS[journeyId];
  if (!contract) return { journeyId: null, state: "UNKNOWN", available: false, authorization: "SERVER_AUTHORITATIVE" };
  const returnTarget = getReturnTarget({ hasCurrentWork: Boolean(currentWork), hasRoleQueue, isPublic });
  return {
    journeyId,
    entry: contract.entry,
    context: { organizationId, role: roleLabel || actor || null },
    state: workflowState || "NO_DATA",
    currentWork: currentWork || "No current work is available.",
    nextAction: nextAction || "No action is currently required.",
    nextActionSource: EXR_NEXT_ACTION_SOURCES.includes(nextActionSource) ? nextActionSource : "NONE",
    returnTarget,
    help: contract.help,
    authorization: "SERVER_AUTHORITATIVE",
    notificationSlots: EXR_NOTIFICATION_SLOTS,
  };
}

export function resolveCapabilityExposure({ capability, permission = false, entitled = false, workflowReady = false, pending = false } = {}) {
  if (!capabilityIds.has(capability)) return "HIDDEN";
  if (pending) return "PENDING";
  if (!permission) return entitled ? "LOCKED" : "HIDDEN";
  if (!entitled) return "LOCKED";
  return workflowReady ? "AVAILABLE" : "VISIBLE";
}

export function resolveFirstServiceTransition({ organizationState, entitlements = [], firstService = null } = {}) {
  if (organizationState !== "ACTIVATED") return { state: "PENDING", route: "/operator/onboarding", service: null };
  const service = firstService || entitlements[0] || null;
  if (!service) return { state: "VISIBLE", route: "/hub", service: null };
  return { state: "AVAILABLE", route: `/services/${encodeURIComponent(service)}`, service };
}

export function resolveExr4Navigation(context = {}) {
  const projection = resolveExrNavigation(context);
  return {
    ...projection,
    entries: projection.entries.map(({ id, route, kind, navGroup, exposureState }) => ({ id, route, kind, navGroup, exposureState })),
    authorization: "SERVER_AUTHORITATIVE",
  };
}

export function validateExrJourneyExperience() {
  const errors = [];
  for (const journeyId of EXR4_JOURNEY_IDS) {
    const contract = EXR4_JOURNEY_CONTRACTS[journeyId];
    if (!contract?.entry || !contract.context || !contract.currentWork || !contract.help) errors.push(`${journeyId}: incomplete journey contract`);
  }
  if (EXR4_EXPOSURE_STATES.join(",") !== "HIDDEN,LOCKED,PENDING,VISIBLE,AVAILABLE") errors.push("capability state vocabulary drifted");
  if (!EXR_NOTIFICATION_SLOTS.length || EXR_NOTIFICATION_SLOTS.some((slot) => /unread|recipient|delivery|state/i.test(slot))) errors.push("notification slots must remain neutral");
  return { valid: errors.length === 0, errors };
}
