import { SEA_SERVICE_EXPERIENCE_CONTRACTS } from "./serviceExperienceContracts.js";
import { DASHBOARD_PROJECTIONS } from "./dashboardArchitecture.js";

export const VISUAL_AUTHORITY_STATES = Object.freeze([
  "APPROVED_MOCK",
  "LOCKED_DIRECTION",
  "EXISTING_IMPLEMENTATION",
  "NO_CANONICAL_VISUAL_AUTHORITY",
]);
export const PAGE_SHELL_TYPES = Object.freeze([
  "LEARNER_SHELL",
  "FULL_APPLICATION_SHELL",
  "OPERATOR_CONSOLE_SHELL",
  "EMBEDDED_WORKSPACE_SHELL",
  "DOCUMENT_CENTERED_SHELL",
  "PUBLIC_PAGE_SHELL",
]);
export const VISUAL_DENSITIES = Object.freeze(["LOW", "MODERATE", "HIGH"]);
export const VISUAL_STATUS_KEYS = Object.freeze([
  "ACTION_REQUIRED",
  "WAITING",
  "BLOCKED",
  "AT_RISK",
  "IN_PROGRESS",
  "COMPLETE",
  "VERIFIED",
  "UNVERIFIED",
  "PUBLIC_APPROVED",
  "UNKNOWN",
]);

const STATUS_SEMANTICS = Object.freeze({
  ACTION_REQUIRED: { treatment: "prominent labeled attention region with responsible actor and safe action", textRequired: true, iconAllowed: true, colorOnlyAllowed: false },
  WAITING: { treatment: "quiet status region naming the responsible actor or dependency; never a primary CTA", textRequired: true, iconAllowed: true, colorOnlyAllowed: false },
  BLOCKED: { treatment: "clearly labeled blocker with canonical reason, owner, prerequisite, and safe remediation when available", textRequired: true, iconAllowed: true, colorOnlyAllowed: false },
  AT_RISK: { treatment: "source-backed risk callout with reason and time/context signal", textRequired: true, iconAllowed: true, colorOnlyAllowed: false },
  IN_PROGRESS: { treatment: "state label or staged progress representation sourced from domain state", textRequired: true, iconAllowed: true, colorOnlyAllowed: false },
  COMPLETE: { treatment: "completed state with plain-language label and source context", textRequired: true, iconAllowed: true, colorOnlyAllowed: false },
  VERIFIED: { treatment: "explicit source-qualified verification label; never inferred from styling", textRequired: true, iconAllowed: true, colorOnlyAllowed: false },
  UNVERIFIED: { treatment: "explicit unverified or draft label adjacent to the value", textRequired: true, iconAllowed: true, colorOnlyAllowed: false },
  PUBLIC_APPROVED: { treatment: "explicit public-approval label only when the authority states it", textRequired: true, iconAllowed: true, colorOnlyAllowed: false },
  UNKNOWN: { treatment: "unknown or unavailable label with source-status explanation", textRequired: true, iconAllowed: true, colorOnlyAllowed: false },
});

const contractById = new Map(SEA_SERVICE_EXPERIENCE_CONTRACTS.map((contract) => [contract.serviceId, contract]));
const projectionById = new Map(DASHBOARD_PROJECTIONS.map((projection) => [projection.projectionId, projection]));

const sharedAcceptance = [
  "Required regions appear in declared order.",
  "The canonical next action is the visually dominant safe action.",
  "Role and source-status semantics remain visible in text.",
  "OGL, DGAL, and Companion help remain available without competing with required work.",
  "The implementation does not add service, Evidence, Truth, approval, release, or verification authority.",
];

const base = (projectionId, config) => {
  const projection = projectionById.get(projectionId);
  const contract = contractById.get(projection?.serviceId);
  return {
    schemaVersion: 1,
    visualContractId: `visual:${projectionId}`,
    serviceId: projection.serviceId,
    role: projection.role,
    responsibility: projection.responsibility,
    route: contract.routes[0],
    projectionId,
    projectionVersion: projection.contractVersion,
    version: 1,
    lifecycle: "DRAFT_FOR_SEA4_IMPLEMENTATION",
    priority: config.priority || "A",
    visualAuthority: {
      status: config.visualAuthority || "NO_CANONICAL_VISUAL_AUTHORITY",
      source: config.visualSource || null,
      mockRef: config.mockRef || null,
    },
    pageShell: config.pageShell,
    pageStructure: {
      desktopOrder: config.desktopOrder,
      tabletOrder: config.tabletOrder || config.desktopOrder,
      mobileOrder: config.mobileOrder,
      requiredRegions: projection.sections,
      optionalRegions: config.optionalRegions || ["PROGRESS", "INTELLIGENCE", "RECENT_ACTIVITY"],
      prohibitedRegions: config.prohibitedRegions || ["unrelated database-shaped cards", "unauthorized domain controls"],
      navigationRelationship: config.navigationRelationship || "Remain inside the owning service shell; route actions through domain authority.",
    },
    hierarchy: {
      context: "orienting header and service scope",
      attention: "source-backed attention region below context",
      nextAction: "one dominant safe primary action after attention",
      work: "current domain work objects",
      progress: "domain state or staged progress",
      intelligence: "decision-useful source-backed signals",
      help: "OGL/DGAL/Companion support region",
    },
    actions: {
      primary: { treatment: "one dominant button or linked work object; disabled or replaced by honest state when unavailable", source: projection.nextAction.source },
      secondary: { treatment: "quiet supporting actions grouped near the primary workflow", refs: projection.secondaryActions },
      reference: { treatment: "tertiary links in help or context areas", refs: ["open-context", "view-help"] },
      sensitive: "approval, verification, release, signature, and destructive actions require explicit authority labels and must never be implied by decoration.",
    },
    components: config.components,
    statusSemantics: STATUS_SEMANTICS,
    density: config.density,
    responsive: {
      desktop: config.desktopComposition || "Full declared region order with role-appropriate density.",
      tablet: config.tabletComposition || "Preserve hierarchy; split high-volume work from detail where needed.",
      mobile: config.mobileComposition || "Reflow declared regions; do not merely shrink desktop.",
      priorityOrder: projection.responsivePriority.map((item) => item.toUpperCase()),
    },
    accessibility: {
      readingOrder: config.mobileOrder,
      focusOrder: config.mobileOrder,
      semanticRegions: ["main", "context", "attention", "work", "progress", "intelligence", "help"],
      statusTextRequired: true,
      touchTargets: "Use current shared control minimums; do not hide required actions behind hover.",
      reducedMotion: "No essential state or hierarchy depends on motion.",
    },
    states: {
      loading: "section-level loading where practical; preserve context shell",
      partial: "identify unavailable source beside the affected region",
      empty: "show empty only when an available source confirms no work or attention",
      unavailable: "show source unavailable and safe help; never imply nothing is required",
      stale: "show freshness/stale label when source provides it",
      error: "keep primary service shell usable and isolate failed optional regions",
    },
    brand: config.brand,
    acceptance: {
      required: [...sharedAcceptance, ...(config.acceptance || [])],
      allowed: ["Minor spacing, card width, and internal component arrangement may vary while hierarchy and semantics remain unchanged.", "Chart type may vary when source, verification class, and decision use remain visible."],
      prohibited: ["Turn WAITING into ACTION_REQUIRED.", "Use color as the only status signal.", "Promote reference or unavailable actions above the canonical next action.", "Collapse distinct responsibilities into a generic dashboard.", ...(config.prohibited || [])],
    },
  };
};

const standard = {
  brand: { product: "Silicon Heartland service shell", direction: "Use current shared design system; SEA-4 must not invent cross-product branding." },
  components: { attention: "labeled alert/list", work: "LIST", progress: "STATE_SUMMARY", intelligence: "METRIC_OR_EXCEPTION_LIST", help: "OGL_GUIDANCE_REGION" },
};

export const VISUAL_EXPERIENCE_CONTRACTS = Object.freeze([
  base("student-learning:learner", { ...standard, pageShell: "LEARNER_SHELL", density: "LOW", visualAuthority: "EXISTING_IMPLEMENTATION", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "CARD_LIST", progress: "STAGED_PROGRESS", intelligence: "METRIC_SUMMARY", help: "OGL_DGAL_COMPANION" }, brand: { product: "SHF Curriculum", direction: "Calm institutional learner shell." }, acceptance: ["Continue learning is visually primary without making the page admin-like.", "Career connection is secondary to current learning work."] }),
  base("instructor:instructor", { ...standard, pageShell: "LEARNER_SHELL", density: "MODERATE", visualAuthority: "EXISTING_IMPLEMENTATION", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "QUEUE_LIST", progress: "COHORT_SUMMARY", intelligence: "EXCEPTION_LIST", help: "OGL_DGAL_COMPANION" }, brand: { product: "SHF Curriculum", direction: "Moderate-density instructional workspace." }, acceptance: ["Cohort context and instructional work precede learner progress detail."] }),
  base("curriculum:learner", { ...standard, pageShell: "LEARNER_SHELL", density: "LOW", visualAuthority: "EXISTING_IMPLEMENTATION", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP"], components: { ...standard.components, work: "WORKSPACE_LINK", progress: "STAGED_PROGRESS", intelligence: "NOT_APPLICABLE", help: "OGL_DGAL_COMPANION" }, brand: { product: "SHF Curriculum", direction: "Learner curriculum workspace." } }),
  base("career:learner", { ...standard, pageShell: "LEARNER_SHELL", density: "LOW", visualAuthority: "LOCKED_DIRECTION", visualSource: "SEA-0 Career design documentation", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "CARD_LIST", progress: "MILESTONE_LIST", intelligence: "SUPPORTED_SIGNAL_SUMMARY", help: "OGL_COMPANION" }, brand: { product: "SHF Career", direction: "Learner-friendly career direction; preserve documented public branding." }, acceptance: ["Do not imply labor-market data or opportunities unless the domain supplies them."] }),
  base("organization-onboarding:applicant", { ...standard, pageShell: "FULL_APPLICATION_SHELL", density: "LOW", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP"], components: { ...standard.components, work: "TASK_GROUP", progress: "LIFECYCLE_STEPPER", intelligence: "NOT_APPLICABLE", help: "OGL_DGAL_COMPANION" }, brand: { product: "SHS Organization Onboarding", direction: "Guided and reassuring institutional application shell." }, acceptance: ["Applicant sees requirements and reviewer waiting state, never reviewer controls."] }),
  base("organization-onboarding:reviewer", { ...standard, pageShell: "OPERATOR_CONSOLE_SHELL", density: "HIGH", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "QUEUE_TABLE", progress: "STATE_TIMELINE", intelligence: "READINESS_SUMMARY", help: "OGL_DGAL" }, brand: { product: "SHS Organization Onboarding", direction: "Operational review queue." }, acceptance: ["Review controls appear only when the onboarding domain authorizes them."] }),
  base("civicsure-provider:provider", { ...standard, pageShell: "FULL_APPLICATION_SHELL", density: "MODERATE", visualAuthority: "EXISTING_IMPLEMENTATION", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "TASK_GROUP", progress: "VERIFICATION_STATE", intelligence: "PROVIDER_STATUS", help: "OGL_DGAL_COMPANION" }, brand: { product: "CivicSure", direction: "Institutional evidence-centered provider experience." }, acceptance: ["Provider controls never resemble operator verification controls."] }),
  base("civicsure-operator:operator", { ...standard, pageShell: "OPERATOR_CONSOLE_SHELL", density: "HIGH", visualAuthority: "EXISTING_IMPLEMENTATION", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "QUEUE_TABLE", progress: "CASE_TIMELINE", intelligence: "RISK_EXCEPTION_LIST", help: "OGL_DGAL" }, brand: { product: "CivicSure", direction: "Moderate/high-density verification operator console." }, acceptance: ["Human verification decision authority is explicit and never automated by visual treatment."] }),
  base("studio:builder", { ...standard, pageShell: "EMBEDDED_WORKSPACE_SHELL", density: "MODERATE", visualAuthority: "LOCKED_DIRECTION", visualSource: "SEA-0 Studio design documentation", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP"], components: { ...standard.components, work: "WORKSPACE_LINK", progress: "READINESS_STEPPER", intelligence: "NOT_APPLICABLE", help: "OGL_DGAL" }, brand: { product: "SHS Studio", direction: "Workspace-centered builder shell." }, acceptance: ["Builder view does not expose QA, reviewer, or release decisions as builder actions."] }),
  base("studio:qa", { ...standard, pageShell: "EMBEDDED_WORKSPACE_SHELL", density: "HIGH", visualAuthority: "LOCKED_DIRECTION", visualSource: "SEA-0 Studio design documentation", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "QUEUE_TABLE", progress: "QA_STATE_SUMMARY", intelligence: "FINDINGS_LIST", help: "OGL_DGAL" }, brand: { product: "SHS Studio", direction: "Inspection and verification workspace." }, acceptance: ["QA responsibility remains distinct from reviewer decision and release authority."] }),
  base("studio:reviewer", { ...standard, pageShell: "EMBEDDED_WORKSPACE_SHELL", density: "HIGH", visualAuthority: "LOCKED_DIRECTION", visualSource: "SEA-0 Studio design documentation", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "QUEUE_TABLE", progress: "REVIEW_STATE_TIMELINE", intelligence: "AUDIT_SUMMARY", help: "OGL_DGAL" }, brand: { product: "SHS Studio", direction: "Review and decision workspace." }, acceptance: ["Reviewer sees immutable submission context and no builder mutation controls."] }),
  base("bos-hub:org_admin", { ...standard, pageShell: "FULL_APPLICATION_SHELL", density: "MODERATE", visualAuthority: "LOCKED_DIRECTION", visualSource: "SEA-0 SHS command surface direction", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "SERVICE_WORK_LIST", progress: "SERVICE_STATE_SUMMARY", intelligence: "OPERATIONAL_SUMMARY", help: "OGL_DGAL" }, brand: { product: "SHS BOS / Hub", direction: "Premium institutional operational workspace." }, acceptance: ["Hub remains an operational entry/workspace, not an everything dashboard."] }),
  base("agent-fabric:agent_operator", { ...standard, pageShell: "OPERATOR_CONSOLE_SHELL", density: "HIGH", visualAuthority: "EXISTING_IMPLEMENTATION", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "QUEUE_TABLE", progress: "GOVERNANCE_STAGE", intelligence: "POLICY_RISK_SUMMARY", help: "OGL_DGAL" }, brand: { product: "SHS Governed AI", direction: "Governed operations console; never autonomous-control-center styling." }, acceptance: ["WF-040 and tool/resource restrictions remain visually explicit.", "No unrestricted execution control is presented."], prohibited: ["Do not present unrestricted execution controls."] }),
  base("arag-1:approver", { ...standard, pageShell: "OPERATOR_CONSOLE_SHELL", density: "HIGH", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "WORKFLOW_STAGE_LIST", progress: "RELEASE_GATE_STEPPER", intelligence: "RISK_EXCEPTION_LIST", help: "OGL_DGAL" }, brand: { product: "ARAG-1", direction: "Release-assurance console with clear AI work and human gate separation." }, acceptance: ["AI WORK, POLICY CHECK, HUMAN APPROVAL, and RELEASE GATE are visually separate.", "No autonomous release control is presented."] }),
  base("dgal:user", { ...standard, pageShell: "DOCUMENT_CENTERED_SHELL", density: "MODERATE", visualAuthority: "EXISTING_IMPLEMENTATION", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP"], components: { ...standard.components, work: "DOCUMENT_LIST", progress: "DOCUMENT_STATE_TIMELINE", intelligence: "NOT_APPLICABLE", help: "OGL_GUIDANCE_REGION" }, brand: { product: "DGAL", direction: "Document and requirement-centered." }, acceptance: ["Generated, sent, viewed, acknowledged, signed, and completed remain distinct."] }),
  base("dgal:admin", { ...standard, pageShell: "DOCUMENT_CENTERED_SHELL", density: "HIGH", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "QUEUE_TABLE", progress: "DOCUMENT_LIFECYCLE", intelligence: "DOCUMENT_HEALTH", help: "OGL_GUIDANCE_REGION" }, brand: { product: "DGAL", direction: "Administrative document lifecycle workspace." }, acceptance: ["Document lifecycle controls do not become service completion controls."] }),
  base("truth-spine:auditor", { ...standard, pageShell: "OPERATOR_CONSOLE_SHELL", density: "HIGH", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "HELP", "INTELLIGENCE"], components: { ...standard.components, work: "PROJECTION_TABLE", progress: "SOURCE_READINESS", intelligence: "PROVENANCE_SUMMARY", help: "OGL_DGAL" }, brand: { product: "Truth Spine", direction: "High-integrity source inspection; no outcome overclaim." }, acceptance: ["Every displayed value carries source/verification semantics."] }),
  base("reporting-metric-registry:analyst", { ...standard, pageShell: "OPERATOR_CONSOLE_SHELL", density: "HIGH", visualAuthority: "EXISTING_IMPLEMENTATION", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "PROGRESS", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "WORK", "INTELLIGENCE", "HELP"], components: { ...standard.components, work: "REPORT_TABLE", progress: "READINESS_STEPPER", intelligence: "SOURCE_QUALIFIED_METRICS", help: "OGL_DGAL" }, brand: { product: "Reporting / Metric Registry", direction: "Analyst/operator information integrity." }, acceptance: ["Verified, unverified, draft, public-approved, and unknown states are explicit."] }),
  base("executive-command:shs_admin", { ...standard, pageShell: "FULL_APPLICATION_SHELL", density: "LOW", visualAuthority: "LOCKED_DIRECTION", visualSource: "SEA-0 SHS command surface direction", desktopOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "INTELLIGENCE", "HELP"], mobileOrder: ["CONTEXT", "ATTENTION", "NEXT_ACTION", "INTELLIGENCE", "HELP"], components: { ...standard.components, work: "NOT_APPLICABLE", progress: "NOT_APPLICABLE", intelligence: "VERIFIED_SUMMARY", help: "OGL_GUIDANCE_REGION" }, brand: { product: "SHS Executive Command", direction: "Calm high-signal bounded executive view." }, acceptance: ["Every action refers to an owning service; no superuser control plane is presented."] }),
]);

export const VISUAL_PRIORITY_A_PROJECTION_IDS = Object.freeze(VISUAL_EXPERIENCE_CONTRACTS.map((contract) => contract.projectionId));
export const VISUAL_EXPERIENCE_CONTRACT_SCHEMA_VERSION = 1;
export { STATUS_SEMANTICS };
