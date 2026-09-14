import {
  EXR_CAPABILITY_STATES,
  EXR_CAPABILITY_EXPOSURE_CONTRACTS,
  EXR_ROLE_CONTEXT_CONTRACTS,
  getRoleContext,
} from "./exrExperienceContracts.js";

export const EXR_IA_SCHEMA_VERSION = 1;

export const EXR_SURFACE_KINDS = Object.freeze([
  "PUBLIC_LANDING",
  "DISCOVERY",
  "DASHBOARD",
  "QUEUE",
  "WORKSPACE",
  "WORKFLOW",
  "DETAIL",
  "REPORT",
  "SETTINGS",
  "ADMIN",
  "HELP",
  "GUIDANCE",
  "DIRECTORY",
  "CATALOG",
]);

export const EXR_NAV_GROUPS = Object.freeze([
  "PUBLIC",
  "LEARN",
  "CAREER",
  "ORGANIZATION",
  "STUDIO",
  "CIVICSURE",
  "REPORTING",
  "ADMINISTRATION",
  "HELP",
]);

export const EXR_NOTIFICATION_SLOTS = Object.freeze([
  "NOTIFICATION_BELL_SLOT",
  "ATTENTION_PROJECTION_SLOT",
  "INBOX_DESTINATION_SLOT",
]);

const destination = (id, parent, actor, shell, route, kind, navGroup, order, config = {}) => ({
  id,
  parent,
  actor,
  shell,
  route,
  kind,
  navGroup,
  order,
  orgRequired: config.orgRequired ?? false,
  capability: config.capability ?? null,
  exposureRule: config.exposureRule ?? "AVAILABLE_WHEN_AUTHORIZED",
  workflowDependency: config.workflowDependency ?? null,
  helpSlot: config.helpSlot ?? "SHARED_HELP",
  notificationSlot: config.notificationSlot ?? "ATTENTION_PROJECTION_SLOT",
  aliasPolicy: config.aliasPolicy ?? "CANONICAL",
});

export const EXR_IA_DESTINATIONS = Object.freeze([
  destination("foundation", null, ["public"], "PUBLIC", "/top", "PUBLIC_LANDING", "PUBLIC", 10),
  destination("solutions", "foundation", ["public"], "PUBLIC", "/solutions/home", "DISCOVERY", "PUBLIC", 20),
  destination("impact", "foundation", ["public"], "PUBLIC", "/impact", "REPORT", "PUBLIC", 30),
  destination("universe", "foundation", ["public", "learner"], "PUBLIC", "/universe", "DISCOVERY", "PUBLIC", 40, { exposureRule: "OPTIONAL_DISCOVERY" }),
  destination("career-public", "foundation", ["public"], "CAREER", "/career", "DISCOVERY", "CAREER", 10),
  destination("civicsure-public", "foundation", ["public"], "CIVICSURE", "/civicsure", "DISCOVERY", "CIVICSURE", 10),
  destination("oas", "foundation", ["public"], "PUBLIC", "/oas", "GUIDANCE", "PUBLIC", 50),
  destination("store", "foundation", ["public", "learner"], "PUBLIC", "/store", "CATALOG", "PUBLIC", 60),
  destination("student", null, ["learner"], "LEARNER", "/curriculum.html#/dashboard", "DASHBOARD", "LEARN", 10, { orgRequired: true, capability: "student-learning" }),
  destination("calendar", "student", ["learner", "instructor"], "LEARNER", "/curriculum.html#/calendar", "WORKFLOW", "LEARN", 20, { orgRequired: true, workflowDependency: "scheduled-or-live-session" }),
  destination("live-learning", "calendar", ["learner", "instructor"], "LEARNER", "/curriculum.html#/live-sessions", "WORKFLOW", "LEARN", 30, { orgRequired: true, workflowDependency: "scheduled-or-live-session" }),
  destination("arcade", "student", ["learner"], "ARCADE", "/arcade.html#/", "WORKSPACE", "LEARN", 40, { orgRequired: true, capability: "student-learning" }),
  destination("projects", "student", ["learner", "instructor"], "LEARNER", "/curriculum.html#/projects", "WORKSPACE", "LEARN", 50, { orgRequired: true }),
  destination("portfolio", "projects", ["learner", "instructor"], "LEARNER", "/curriculum.html#/portfolio", "DETAIL", "LEARN", 60, { orgRequired: true }),
  destination("accessibility-settings", "student", ["learner"], "LEARNER", "/curriculum.html#/accessibility", "SETTINGS", "HELP", 10, { capability: "accessibility-settings", helpSlot: "SHARED_HELP" }),
  destination("career", null, ["learner"], "CAREER", "/career.html#/dashboard", "DASHBOARD", "CAREER", 10, { orgRequired: true, capability: "career-exploration" }),
  destination("hub", null, ["org_operator", "org_admin", "shs_admin"], "HUB", "/hub", "DASHBOARD", "ORGANIZATION", 10, { orgRequired: true, capability: "hub-operating-work", workflowDependency: "activated-organization" }),
  destination("hub-queue", "hub", ["org_operator", "org_admin", "shs_admin"], "HUB", "/hub/queue", "QUEUE", "ORGANIZATION", 20, { orgRequired: true, capability: "hub-operating-work", workflowDependency: "active-work" }),
  destination("organization-onboarding", null, ["applicant", "org_operator", "org_admin"], "HUB", "/operator/onboarding", "WORKFLOW", "ORGANIZATION", 30, { orgRequired: true, capability: "organization-application", workflowDependency: "onboarding-lifecycle" }),
  destination("first-service", "hub", ["org_operator", "org_admin"], "HUB", "/hub/first-service", "WORKFLOW", "ORGANIZATION", 40, { orgRequired: true, capability: "organization-first-service", workflowDependency: "ACTIVATED" }),
  destination("studio", null, ["studio_reviewer", "shs_admin"], "STUDIO", "/studio.html#/", "WORKSPACE", "STUDIO", 10, { orgRequired: true, capability: "studio-stage-work" }),
  destination("studio-qa", "studio", ["studio_reviewer", "shs_admin"], "STUDIO", "/studio.html#/qa", "QUEUE", "STUDIO", 20, { orgRequired: true, capability: "studio-stage-work", workflowDependency: "QA_REQUIRED" }),
  destination("studio-review", "studio", ["studio_reviewer", "shs_admin"], "STUDIO", "/studio.html#/review", "WORKFLOW", "STUDIO", 30, { orgRequired: true, capability: "studio-stage-work", workflowDependency: "IN_REVIEW" }),
  destination("civicsure-provider", null, ["provider"], "CIVICSURE", "/operator/civicsure/provider", "WORKSPACE", "CIVICSURE", 20, { orgRequired: true, capability: "civicsure-provider-work" }),
  destination("civicsure-operator", null, ["shs_admin"], "CIVICSURE", "/operator/civicsure/operator", "QUEUE", "CIVICSURE", 30, { orgRequired: true, workflowDependency: "assurance-work" }),
  destination("reporting", "hub", ["org_admin", "shs_admin"], "HUB", "/reporting", "REPORT", "REPORTING", 10, { orgRequired: true, capability: "reporting" }),
  destination("executive-command", "hub", ["shs_admin"], "HUB", "/executive-command", "DASHBOARD", "REPORTING", 20, { orgRequired: true, workflowDependency: "executive-scope" }),
  destination("truth-oracle", "hub", ["shs_admin"], "HUB", "/truth-spine", "DETAIL", "ADMINISTRATION", 20, { orgRequired: true, workflowDependency: "authorized-inspection" }),
  destination("accessibility-operations", "hub", ["accessibility_operator", "shs_admin"], "HUB", "/operator/accessibility-operations", "QUEUE", "ADMINISTRATION", 30, { orgRequired: true, capability: "accessibility-operations", workflowDependency: "operations-scope" }),
  destination("help", null, ["public", ...EXR_ROLE_CONTEXT_CONTRACTS.filter((entry) => entry.id !== "public").map((entry) => entry.id)], "SHARED", "/help", "HELP", "HELP", 10, { helpSlot: "SHARED_HELP" }),
]);

export const EXR_IA_ALIASES = Object.freeze([
  { route: "/hub/action-queue", classification: "ALIAS_KEEP", canonicalTarget: "/hub/queue", exr3Action: "evaluate redirect after usage review" },
  { route: "/hub/referrals", classification: "ALIAS_KEEP", canonicalTarget: "/hub/lifecycle", exr3Action: "evaluate redirect after usage review" },
  { route: "/request-demo", classification: "ALIAS_KEEP", canonicalTarget: "/solutions/home", exr3Action: "preserve CTA semantics; remove duplicate destination later" },
  { route: "/contact", classification: "ALIAS_KEEP", canonicalTarget: "/solutions/home", exr3Action: "preserve CTA semantics; remove duplicate destination later" },
  { route: "/transparency", classification: "ALIAS_KEEP", canonicalTarget: "/blockchain-transparency", exr3Action: "verify public links before redirect" },
  { route: "/reports", classification: "DEFER_TO_EXR_3", canonicalTarget: "/reporting", exr3Action: "consolidate after audience/source review" },
  { route: "/ops/reports", classification: "DEFER_TO_EXR_3", canonicalTarget: "/reporting", exr3Action: "consolidate after operator acceptance" },
  { route: "/admin.html#/builder", classification: "DEFER_TO_EXR_3", canonicalTarget: "/studio.html#/builder", exr3Action: "preserve Studio authority while reconciling entry" },
  { route: "/civic.html#/civicsure", classification: "ALIAS_KEEP", canonicalTarget: "/civicsure", exr3Action: "verify public product boundary" },
  { route: "/curriculum.html#/accessibility", classification: "CANONICAL", canonicalTarget: "/curriculum.html#/accessibility", exr3Action: "place from account/help without route deletion" },
]);

export const EXR_IA_SHELLS = Object.freeze([
  { shell: "PUBLIC", audience: ["public"], orgContext: "NONE", roleContext: "PUBLIC_VISITOR", primaryNav: "PUBLIC", helpSlot: "SHARED_HELP", notificationSlot: null },
  { shell: "LEARNER", audience: ["learner", "instructor", "parent"], orgContext: "ACTIVE_LEARNER_ORGANIZATION", roleContext: "ACTIVE_ROLE", primaryNav: "LEARN", helpSlot: "SHARED_HELP", notificationSlot: "NOTIFICATION_BELL_SLOT" },
  { shell: "HUB", audience: ["org_operator", "org_admin", "shs_admin"], orgContext: "ACTIVE_ORGANIZATION", roleContext: "ACTIVE_ROLE", primaryNav: "ORGANIZATION", helpSlot: "SHARED_HELP", notificationSlot: "NOTIFICATION_BELL_SLOT" },
  { shell: "STUDIO", audience: ["studio_reviewer", "shs_admin"], orgContext: "ACTIVE_PROJECT_ORGANIZATION", roleContext: "PROJECT_ROLE", primaryNav: "STUDIO", helpSlot: "SHARED_HELP", notificationSlot: "ATTENTION_PROJECTION_SLOT" },
  { shell: "CIVICSURE", audience: ["provider", "shs_admin"], orgContext: "ACTIVE_CIVICSURE_ORGANIZATION", roleContext: "CIVICSURE_ROLE", primaryNav: "CIVICSURE", helpSlot: "SHARED_HELP", notificationSlot: "ATTENTION_PROJECTION_SLOT" },
  { shell: "SHARED", audience: ["public", ...EXR_ROLE_CONTEXT_CONTRACTS.filter((entry) => entry.id !== "public").map((entry) => entry.id)], orgContext: "CONTEXTUAL", roleContext: "CONTEXTUAL", primaryNav: "CONTEXTUAL", helpSlot: "SHARED_HELP", notificationSlot: "NOTIFICATION_BELL_SLOT" },
]);

const destinationById = new Map(EXR_IA_DESTINATIONS.map((entry) => [entry.id, entry]));
const roleById = new Map(EXR_ROLE_CONTEXT_CONTRACTS.map((entry) => [entry.id, entry]));
const capabilityById = new Map(EXR_CAPABILITY_EXPOSURE_CONTRACTS.map((entry) => [entry.id, entry]));

function matchesRole(entry, actor) {
  return entry.actor.includes(actor);
}

function resolveEntryState(entry, context) {
  if (!entry.capability) return entry.exposureRule === "OPTIONAL_DISCOVERY" ? "VISIBLE" : "AVAILABLE";
  const contract = capabilityById.get(entry.capability);
  if (!contract) return "HIDDEN";
  const condition = context.capabilityConditions?.[entry.capability] || context.workflowState || "default";
  let state = contract.stateRules?.[condition] || context.capabilityStates?.[entry.capability] || null;
  if (!state && entry.orgRequired && !context.organizationId) state = "HIDDEN";
  if (!state) state = context.entitlements?.includes(entry.capability) ? "AVAILABLE" : "HIDDEN";
  return EXR_CAPABILITY_STATES.includes(state) ? state : "HIDDEN";
}

export function resolveExrNavigation(context = {}) {
  const actor = context.actor || (context.isPublic ? "public" : "");
  const role = getRoleContext(actor);
  const entries = EXR_IA_DESTINATIONS
    .filter((entry) => matchesRole(entry, actor))
    .map((entry) => ({ ...entry, exposureState: resolveEntryState(entry, context) }))
    .filter((entry) => entry.exposureState !== "HIDDEN")
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return {
    actor,
    roleContext: role?.id || null,
    organizationId: context.organizationId || null,
    entries,
    notificationSlots: EXR_NOTIFICATION_SLOTS,
    authorization: "SERVER_AUTHORITATIVE",
  };
}

export function getCanonicalDestination(route) {
  return EXR_IA_DESTINATIONS.find((entry) => entry.route === route) || null;
}

export function getAliasClassification(route) {
  return EXR_IA_ALIASES.find((entry) => entry.route === route) || null;
}

export function getParentChain(destinationId) {
  const chain = [];
  let current = destinationById.get(destinationId) || null;
  while (current) {
    chain.unshift(current);
    current = current.parent ? destinationById.get(current.parent) : null;
  }
  return chain;
}

export function getShellContract(shell) {
  return EXR_IA_SHELLS.find((entry) => entry.shell === shell) || null;
}

export function validateExrInformationArchitecture() {
  const errors = [];
  const ids = new Set();
  const routes = new Set();
  for (const entry of EXR_IA_DESTINATIONS) {
    if (ids.has(entry.id)) errors.push(`duplicate destination id: ${entry.id}`);
    ids.add(entry.id);
    if (routes.has(entry.route)) errors.push(`duplicate canonical route: ${entry.route}`);
    routes.add(entry.route);
    if (entry.parent && !destinationById.has(entry.parent)) errors.push(`${entry.id}: missing parent ${entry.parent}`);
    if (!EXR_SURFACE_KINDS.includes(entry.kind)) errors.push(`${entry.id}: invalid surface kind`);
    if (!EXR_NAV_GROUPS.includes(entry.navGroup)) errors.push(`${entry.id}: invalid navigation group`);
    if (entry.actor.some((actor) => !roleById.has(actor))) errors.push(`${entry.id}: unknown actor`);
    if (entry.capability && !capabilityById.has(entry.capability)) errors.push(`${entry.id}: unknown capability ${entry.capability}`);
    if (!EXR_NOTIFICATION_SLOTS.includes(entry.notificationSlot) && entry.notificationSlot !== null) errors.push(`${entry.id}: invalid notification slot`);
  }
  for (const alias of EXR_IA_ALIASES) {
    if (!alias.classification || !alias.canonicalTarget || !alias.exr3Action) errors.push(`${alias.route}: incomplete alias classification`);
    if (alias.classification === "CANONICAL" && alias.route !== alias.canonicalTarget) errors.push(`${alias.route}: canonical alias target mismatch`);
  }
  if (EXR_IA_DESTINATIONS.find((entry) => entry.id === "universe")?.parent !== "foundation") errors.push("Universe must remain under Foundation discovery");
  if (EXR_HUB_CONTRACT_CHECK() === false) errors.push("Hub ownership boundary failed");
  if (!EXR_ACCESSIBILITY_CHECK()) errors.push("Accessibility placement boundary failed");
  if (!EXR_REPORTING_CHECK()) errors.push("Reporting placement boundary failed");
  if (EXR_IA_SHELLS.some((entry) => entry.notificationSlot && !EXR_NOTIFICATION_SLOTS.includes(entry.notificationSlot))) errors.push("shell notification slot invalid");
  return errors;
}

function EXR_HUB_CONTRACT_CHECK() {
  const hub = EXR_IA_DESTINATIONS.find((entry) => entry.id === "hub");
  return hub?.shell === "HUB" && hub?.actor.includes("org_operator") && hub?.orgRequired === true;
}

function EXR_ACCESSIBILITY_CHECK() {
  const settings = EXR_IA_DESTINATIONS.find((entry) => entry.id === "accessibility-settings");
  const operations = EXR_IA_DESTINATIONS.find((entry) => entry.id === "accessibility-operations");
  const help = EXR_IA_DESTINATIONS.find((entry) => entry.id === "help");
  return settings?.kind === "SETTINGS" && operations?.kind === "QUEUE" && help?.kind === "HELP";
}

function EXR_REPORTING_CHECK() {
  const reporting = EXR_IA_DESTINATIONS.find((entry) => entry.id === "reporting");
  const executive = EXR_IA_DESTINATIONS.find((entry) => entry.id === "executive-command");
  return reporting?.kind === "REPORT" && executive?.kind === "DASHBOARD";
}
