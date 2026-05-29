export const SHS_ROUTE_SMOKE_GROUPS = Object.freeze({
  public: "Public Pages",
  admin: "Admin / Command Pages",
  lordOutcomes: "Lord of Outcomes",
  hub: "SHS Hub",
  reporting: "Reporting / Export",
  exchange: "Exchange / Truth Surfaces",
  auth: "Auth / Security",
});

export const SHS_ROUTE_SMOKE_REGISTRY = Object.freeze([
  {
    id: "home",
    label: "Main Home",
    url: "/",
    group: "public",
    expectedAccess: "public",
    priority: 1,
  },
  {
    id: "solutions",
    label: "SHS Solutions",
    url: "/solutions.html",
    group: "public",
    expectedAccess: "public",
    priority: 1,
  },
  {
    id: "foundation",
    label: "SHF Foundation",
    url: "/foundation.html",
    group: "public",
    expectedAccess: "public",
    priority: 1,
  },
  {
    id: "lord-outcomes-home",
    label: "Lord of Outcomes Home",
    url: "/lord-of-outcomes.html",
    group: "lordOutcomes",
    expectedAccess: "public_or_internal",
    priority: 1,
  },
  {
    id: "admin-home",
    label: "Admin Home",
    url: "/admin.html",
    group: "admin",
    expectedAccess: "protected",
    priority: 1,
  },
  {
    id: "admin-reporting",
    label: "Reporting Command Surface",
    url: "/admin.html#/reporting",
    group: "reporting",
    expectedAccess: "protected",
    priority: 1,
  },
  {
    id: "admin-briefing-export",
    label: "Briefing Export Panel",
    url: "/admin.html#/reporting/briefing",
    group: "reporting",
    expectedAccess: "protected",
    priority: 2,
  },
  {
    id: "admin-analyst-memo",
    label: "Analyst Memo Export Panel",
    url: "/admin.html#/reporting/analyst-memo",
    group: "reporting",
    expectedAccess: "protected",
    priority: 2,
  },
  {
    id: "hub-dashboard",
    label: "SHS Hub Workspace Dashboard",
    url: "/admin.html#/hub",
    group: "hub",
    expectedAccess: "protected",
    priority: 1,
  },
  {
    id: "hub-intake",
    label: "Hub Intake Navigator",
    url: "/admin.html#/hub/intake",
    group: "hub",
    expectedAccess: "protected",
    priority: 2,
  },
  {
    id: "hub-lifecycle",
    label: "Hub Referral Lifecycle",
    url: "/admin.html#/hub/lifecycle",
    group: "hub",
    expectedAccess: "protected",
    priority: 2,
  },
  {
    id: "hub-imports",
    label: "Hub Files & Imports",
    url: "/admin.html#/hub/imports",
    group: "hub",
    expectedAccess: "protected",
    priority: 2,
  },
  {
    id: "exchange-command",
    label: "Operational Command Surface",
    url: "/admin.html#/exchange",
    group: "exchange",
    expectedAccess: "protected",
    priority: 1,
  },
  {
    id: "unified-truth",
    label: "Unified Truth Surface",
    url: "/admin.html#/unified-truth",
    group: "exchange",
    expectedAccess: "protected",
    priority: 1,
  },
  {
    id: "identity",
    label: "Identity Management",
    url: "/admin.html#/identity",
    group: "auth",
    expectedAccess: "admin_only",
    priority: 1,
  },
  {
    id: "login",
    label: "Login",
    url: "/admin.html#/login",
    group: "auth",
    expectedAccess: "public_auth",
    priority: 1,
  },
]);

export function buildRouteSmokeTestModel({
  results = [],
  source = "shs_v1_route_smoke_test",
} = {}) {
  const resultById = new Map(results.map((result) => [result.id, result]));

  const rows = SHS_ROUTE_SMOKE_REGISTRY.map((route) => {
    const result = resultById.get(route.id) || {};

    const status = result.status || "not_tested";
    const passed = status === "passed";

    return {
      ...route,
      status,
      passed,
      httpStatus: result.httpStatus ?? null,
      consoleErrors: Array.isArray(result.consoleErrors) ? result.consoleErrors : [],
      notes: result.notes || "",
    };
  });

  const tested = rows.filter((row) => row.status !== "not_tested");
  const passed = rows.filter((row) => row.status === "passed");
  const failed = rows.filter((row) => row.status === "failed");
  const blocked = rows.filter((row) => row.status === "blocked");
  const notTested = rows.filter((row) => row.status === "not_tested");

  let routeSmokeStatus = "not_started";
  let routeSmokeLabel = "Not Started";
  let recommendedNextAction = "Run route smoke tests across all V1 route groups.";

  if (failed.length || blocked.length) {
    routeSmokeStatus = "needs_fix";
    routeSmokeLabel = "Route Fixes Needed";
    recommendedNextAction = "Fix failed or blocked routes before V1 signoff.";
  } else if (notTested.length && tested.length) {
    routeSmokeStatus = "in_progress";
    routeSmokeLabel = "Route Smoke Testing In Progress";
    recommendedNextAction = "Continue testing remaining routes.";
  } else if (!notTested.length && rows.length) {
    routeSmokeStatus = "passed";
    routeSmokeLabel = "Route Smoke Tests Passed";
    recommendedNextAction = "Proceed to role/security UX checks.";
  }

  return {
    source,
    routeSmokeStatus,
    routeSmokeLabel,
    recommendedNextAction,
    summary: {
      totalRoutes: rows.length,
      testedRoutes: tested.length,
      passedRoutes: passed.length,
      failedRoutes: failed.length,
      blockedRoutes: blocked.length,
      notTestedRoutes: notTested.length,
    },
    rows,
    failed,
    blocked,
    notTested,
  };
}

export function buildRouteSmokeRows(model) {
  if (!model) return [];

  return [
    ["Total Routes", model.summary.totalRoutes],
    ["Tested Routes", model.summary.testedRoutes],
    ["Passed Routes", model.summary.passedRoutes],
    ["Failed Routes", model.summary.failedRoutes],
    ["Blocked Routes", model.summary.blockedRoutes],
    ["Not Tested", model.summary.notTestedRoutes],
  ];
}

export function routeSmokeStatusClass(status) {
  if (status === "passed") return "route-smoke--passed";
  if (status === "needs_fix") return "route-smoke--needs-fix";
  if (status === "in_progress") return "route-smoke--in-progress";
  return "route-smoke--not-started";
}
