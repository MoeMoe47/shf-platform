const DEFAULT_SHRV1_BASE_URL = "http://127.0.0.1:5174";
const DEFAULT_SHF_NEXT_BASE_URL = "http://127.0.0.1:5175";

const FORBIDDEN_URL_PATTERNS = [
  /ADMIN_API_KEY/i,
  /admin[_-]?api[_-]?key/i,
  /authorization/i,
  /bearer\s+/i,
  /token=/i,
  /api[_-]?key=/i,
  /roles?=/i,
  /permissions?=/i,
];

function envValue(name) {
  if (typeof import.meta !== "undefined" && import.meta.env?.[name]) {
    return import.meta.env[name];
  }

  if (typeof process !== "undefined" && process.env?.[name]) {
    return process.env[name];
  }

  return "";
}

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function safeBaseUrl(value, fallback) {
  const candidate = trimTrailingSlash(value || fallback);
  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol)) return fallback;
    if (FORBIDDEN_URL_PATTERNS.some((pattern) => pattern.test(parsed.href))) return fallback;
    return parsed.href.replace(/\/+$/, "");
  } catch {
    return fallback;
  }
}

function normalizeHashRoute(hashRoute = "") {
  const value = String(hashRoute || "").trim();
  const withoutAdmin = value.startsWith("admin.html#") ? value.replace("admin.html#", "") : value;
  const withoutHash = withoutAdmin.startsWith("#") ? withoutAdmin.slice(1) : withoutAdmin;
  return withoutHash.startsWith("/") ? withoutHash : `/${withoutHash}`;
}

function normalizePathname(pathname = "/") {
  const [path, query = ""] = String(pathname || "/").trim().split("?");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

function ensureSafePath(value) {
  const path = String(value || "");
  if (!path.startsWith("/")) return "";
  if (path.startsWith("//")) return "";
  if (FORBIDDEN_URL_PATTERNS.some((pattern) => pattern.test(path))) return "";
  return path;
}

export const routeOwnership = Object.freeze({
  shrv1: Object.freeze([
    { key: "truthSpine", route: "admin.html#/truth-spine", owner: "shrv1", access: "admin" },
    { key: "oracle", route: "admin.html#/oracle", owner: "shrv1", access: "admin" },
    { key: "aiGuardrails", route: "admin.html#/ai-guardrails", owner: "shrv1", access: "admin" },
    { key: "gameTheory", route: "admin.html#/game-theory", owner: "shrv1", access: "admin" },
    { key: "agentFabric", route: "admin.html#/agent-fabric", owner: "shrv1", access: "admin" },
    { key: "systemOrchestrator", route: "admin.html#/ops/orchestrator", owner: "shrv1", access: "admin" },
    { key: "agentWorkbench", route: "admin.html#/ops/agents", owner: "shrv1", access: "admin" },
    { key: "registry", route: "admin.html#/registry", owner: "shrv1", access: "admin" },
    { key: "watchtower", route: "admin.html#/watchtower", owner: "shrv1", access: "admin_redirect" },
    { key: "lordOutcomes", route: "admin.html#/lord-outcomes", owner: "shrv1", access: "admin" },
    { key: "reporting", route: "admin.html#/reporting", owner: "shrv1", access: "admin" },
    { key: "command", route: "admin.html#/command", owner: "shrv1", access: "admin" },
    { key: "dashboard", route: "admin.html#/dashboard", owner: "shrv1", access: "admin" },
  ]),
  shfNext: Object.freeze([
    { key: "home", route: "/", owner: "shf-next", access: "public" },
    { key: "foundation", route: "/foundation", owner: "shf-next", access: "public" },
    { key: "impactReport", route: "/foundation/impact-report", owner: "shf-next", access: "public" },
    { key: "dataApproval", route: "/foundation/data-approval", owner: "shf-next", access: "internal_notice" },
    { key: "solutions", route: "/solutions", owner: "shf-next", access: "public" },
    { key: "ops", route: "/ops", owner: "shf-next", access: "internal_notice" },
    { key: "opsWildcard", route: "/ops/*", owner: "shf-next", access: "internal_notice" },
    { key: "clientOps", route: "/ops/clientops", owner: "shf-next", access: "internal_notice" },
    { key: "studio", route: "/studio/*", owner: "shf-next", access: "public_or_internal_by_subroute" },
    { key: "studioTemplates", route: "/studio/templates", owner: "shf-next", access: "public" },
    { key: "studioTemplatesBrowse", route: "/studio/templates/browse", owner: "shf-next", access: "public" },
  ]),
});

export const crossAppRouteTargets = Object.freeze({
  shrv1CommandToShfImpactReport: Object.freeze({
    sourceApp: "shrv1",
    sourceRoute: "admin.html#/command",
    targetApp: "shf-next",
    targetRoute: "/foundation/impact-report",
    reason: "Command Center generates/reviews SHF impact report presentation.",
  }),
  shrv1ReportsToShfImpactPrint: Object.freeze({
    sourceApp: "shrv1",
    sourceRoute: "admin.html#/reports",
    targetApp: "shf-next",
    targetRoute: "/foundation/impact-report/print?style=premium&period=annual",
    reason: "Reports admin opens the SHF print renderer without duplicating it.",
  }),
  shrv1TruthToShfDataApproval: Object.freeze({
    sourceApp: "shrv1",
    sourceRoute: "admin.html#/truth-spine",
    targetApp: "shf-next",
    targetRoute: "/foundation/data-approval",
    reason: "Truth/readiness review links to the public data approval gate.",
  }),
  shrv1BuilderToShfTemplatesBrowse: Object.freeze({
    sourceApp: "shrv1",
    sourceRoute: "admin.html#/builder",
    targetApp: "shf-next",
    targetRoute: "/studio/templates/browse",
    reason: "BuilderHub admin opens the live template marketplace.",
  }),
  shrv1WebMakerToShfTemplatesBrowse: Object.freeze({
    sourceApp: "shrv1",
    sourceRoute: "/studio/templates",
    targetApp: "shf-next",
    targetRoute: "/studio/templates/browse",
    reason: "Public WebMaker can point to the richer marketplace after owner approval.",
  }),
  shrv1OpsProductionToShfOpsCommand: Object.freeze({
    sourceApp: "shrv1",
    sourceRoute: "admin.html#/ops/production",
    targetApp: "shf-next",
    targetRoute: "/ops/command",
    reason: "Production ops admin opens the live ops command overview.",
  }),
  shrv1AgentWorkbenchToShfClientOps: Object.freeze({
    sourceApp: "shrv1",
    sourceRoute: "admin.html#/ops/agents",
    targetApp: "shf-next",
    targetRoute: "/ops/clientops",
    reason: "Agent Workbench can reference ClientOps context without exposing public or autonomous execution.",
  }),
  shrv1OpsProjectsToShfOpsProjects: Object.freeze({
    sourceApp: "shrv1",
    sourceRoute: "admin.html#/ops/projects",
    targetApp: "shf-next",
    targetRoute: "/ops/projects",
    reason: "Project setup/governance opens the live project dashboard.",
  }),
  shrv1BuildPacketToShfBuildPackets: Object.freeze({
    sourceApp: "shrv1",
    sourceRoute: "admin.html#/ops/build-packet",
    targetApp: "shf-next",
    targetRoute: "/ops/library/build-packets",
    reason: "Build packet admin review opens the live build packet library tab.",
  }),
  shrv1ScreenshotQaToShfQa: Object.freeze({
    sourceApp: "shrv1",
    sourceRoute: "admin.html#/ops/screenshot-qa",
    targetApp: "shf-next",
    targetRoute: "/ops/qa",
    reason: "Screenshot QA/admin review opens the live QA + Delivery workflow.",
  }),
  shfClientOpsToShrv1AgentFabric: Object.freeze({
    sourceApp: "shf-next",
    sourceRoute: "/ops/clientops",
    targetApp: "shrv1",
    targetRoute: "admin.html#/agent-fabric",
    reason: "ClientOps can review governance/Agent Fabric status.",
  }),
  shfClientOpsToShrv1Reports: Object.freeze({
    sourceApp: "shf-next",
    sourceRoute: "/ops/clientops",
    targetApp: "shrv1",
    targetRoute: "admin.html#/reports",
    reason: "ClientOps monthly/reporting workflow opens trust-aware reports admin.",
  }),
  shfDataApprovalToShrv1Truth: Object.freeze({
    sourceApp: "shf-next",
    sourceRoute: "/foundation/data-approval",
    targetApp: "shrv1",
    targetRoute: "admin.html#/truth-spine",
    reason: "Approval Gateway links to Truth Spine authority for internal users.",
  }),
  shfImpactReportToShrv1Reports: Object.freeze({
    sourceApp: "shf-next",
    sourceRoute: "/foundation/impact-report",
    targetApp: "shrv1",
    targetRoute: "admin.html#/reports",
    reason: "Impact report generator links back to verified/report readiness admin.",
  }),
  shfStudioTemplatesToShrv1Builder: Object.freeze({
    sourceApp: "shf-next",
    sourceRoute: "/studio/templates",
    targetApp: "shrv1",
    targetRoute: "admin.html#/builder",
    reason: "Template marketplace can link to BuilderHub/admin governance for internal users.",
  }),
});

export const shrv1RoutesToSmoke = Object.freeze([
  "admin.html#/agent-fabric",
  "admin.html#/ops/agents",
  "admin.html#/ops/orchestrator",
  "admin.html#/registry",
  "admin.html#/truth-spine",
  "admin.html#/oracle",
  "admin.html#/ai-guardrails",
  "admin.html#/game-theory",
  "admin.html#/lord-outcomes",
  "admin.html#/analytics",
  "admin.html#/dev/docs",
]);

export const shfNextRoutesToSmoke = Object.freeze([
  "/",
  "/foundation",
  "/foundation/impact-report",
  "/solutions",
  "/studio/templates",
  "/studio/templates/browse",
  "/ops",
  "/ops/clientops",
  "/foundation/data-approval",
]);

export function getShrv1BaseUrl() {
  return safeBaseUrl(envValue("VITE_SHRV1_BASE_URL"), DEFAULT_SHRV1_BASE_URL);
}

export function getShfNextBaseUrl() {
  return safeBaseUrl(envValue("VITE_SHF_NEXT_BASE_URL"), DEFAULT_SHF_NEXT_BASE_URL);
}

export function buildShrv1AdminUrl(hashRoute = "/hub", options = {}) {
  const safeHashRoute = normalizeHashRoute(hashRoute);
  const returnTo = options.returnTo ? ensureSafePath(options.returnTo) : "";
  const suffix = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
  return `${getShrv1BaseUrl()}/admin.html#${safeHashRoute}${suffix}`;
}

export function buildShfNextUrl(pathname = "/", options = {}) {
  const safePath = ensureSafePath(normalizePathname(pathname)) || "/";
  const returnTo = options.returnTo ? ensureSafePath(options.returnTo) : "";
  const separator = safePath.includes("?") ? "&" : "?";
  const suffix = returnTo ? `${separator}returnTo=${encodeURIComponent(returnTo)}` : "";
  return `${getShfNextBaseUrl()}${safePath}${suffix}`;
}

export function getCrossAppRouteTarget(routeKey) {
  const target = crossAppRouteTargets[routeKey];
  if (!target) return null;

  const targetUrl =
    target.targetApp === "shrv1"
      ? buildShrv1AdminUrl(target.targetRoute)
      : buildShfNextUrl(target.targetRoute);

  return Object.freeze({ ...target, targetUrl });
}

export function isExternalCrossAppUrl(url) {
  try {
    const parsed = new URL(url);
    const allowedOrigins = [new URL(getShrv1BaseUrl()).origin, new URL(getShfNextBaseUrl()).origin];
    if (!allowedOrigins.includes(parsed.origin)) return false;
    return !FORBIDDEN_URL_PATTERNS.some((pattern) => pattern.test(parsed.href));
  } catch {
    return false;
  }
}
