export const SHS_MANUAL_BROWSER_SIGNOFF_GROUPS = Object.freeze({
  public: "Public Pages",
  admin: "Admin / Workspace",
  lordOutcomes: "Lord of Outcomes",
  hub: "SHS Hub",
  reporting: "Reporting / Export",
  exchange: "Exchange / Truth Surfaces",
  auth: "Auth / Security",
  runtime: "Runtime Safety",
});

export const SHS_MANUAL_BROWSER_SIGNOFF_REGISTRY = Object.freeze([
  {
    id: "home",
    label: "Main Home",
    url: "/",
    group: "public",
    priority: 1,
    expectedResult: "Page opens, hero renders, no blank screen, no major console errors.",
  },
  {
    id: "solutions",
    label: "SHS Solutions",
    url: "/solutions.html",
    group: "public",
    priority: 1,
    expectedResult: "Public SHS sales/value story renders correctly.",
  },
  {
    id: "foundation",
    label: "SHF Foundation",
    url: "/foundation.html",
    group: "public",
    priority: 1,
    expectedResult: "Foundation page renders cleanly and donor/mission story is visible.",
  },
  {
    id: "lord-outcomes-home",
    label: "Lord of Outcomes Home",
    url: "/lord-of-outcomes.html",
    group: "lordOutcomes",
    priority: 1,
    expectedResult: "Readiness, hardening, route smoke, and role/security panels render without layout collision.",
  },
  {
    id: "admin-home",
    label: "Admin Home",
    url: "/admin.html",
    group: "admin",
    priority: 1,
    expectedResult: "Admin shell renders, sidebar/nav works, no auth context crash.",
  },
  {
    id: "login",
    label: "Login",
    url: "/admin.html#/login",
    group: "auth",
    priority: 1,
    expectedResult: "Login route renders without blank screen.",
  },
  {
    id: "identity",
    label: "Identity Management",
    url: "/admin.html#/identity",
    group: "auth",
    priority: 1,
    expectedResult: "Identity page renders and remains clearly admin/security related.",
  },
  {
    id: "admin-reporting",
    label: "Reporting Command Surface",
    url: "/admin.html#/reporting",
    group: "reporting",
    priority: 1,
    expectedResult: "Reporting command surface renders and export cards are visible.",
  },
  {
    id: "admin-briefing-export",
    label: "Briefing Export Panel",
    url: "/admin.html#/reporting/briefing",
    group: "reporting",
    priority: 2,
    expectedResult: "Briefing export panel renders without blank screen.",
  },
  {
    id: "admin-analyst-memo",
    label: "Analyst Memo Export Panel",
    url: "/admin.html#/reporting/analyst-memo",
    group: "reporting",
    priority: 2,
    expectedResult: "Analyst memo export panel renders without blank screen.",
  },
  {
    id: "hub-dashboard",
    label: "SHS Hub Workspace Dashboard",
    url: "/admin.html#/hub",
    group: "hub",
    priority: 1,
    expectedResult: "Hub dashboard renders with KPI row, hub workspace, agenda, and reporting readiness.",
  },
  {
    id: "hub-intake",
    label: "Hub Intake Navigator",
    url: "/admin.html#/hub/intake",
    group: "hub",
    priority: 2,
    expectedResult: "Hub intake page renders and referral form sections are visible.",
  },
  {
    id: "hub-lifecycle",
    label: "Hub Referral Lifecycle",
    url: "/admin.html#/hub/lifecycle",
    group: "hub",
    priority: 2,
    expectedResult: "Lifecycle board renders without cards covering each other.",
  },
  {
    id: "hub-imports",
    label: "Hub Files & Imports",
    url: "/admin.html#/hub/imports",
    group: "hub",
    priority: 2,
    expectedResult: "Imports page renders upload/import lane and validation sections.",
  },
  {
    id: "exchange-command",
    label: "Operational Command Surface",
    url: "/admin.html#/exchange",
    group: "exchange",
    priority: 1,
    expectedResult: "Operational command surface opens and no major runtime error appears.",
  },
  {
    id: "unified-truth",
    label: "Unified Truth Surface",
    url: "/admin.html#/unified-truth",
    group: "exchange",
    priority: 1,
    expectedResult: "Unified truth surface opens and truth/verification framing is visible.",
  },
  {
    id: "runtime-console",
    label: "Runtime Console Safety",
    url: "all_registered_routes",
    group: "runtime",
    priority: 1,
    expectedResult: "No major React hook errors, auth crashes, blank screens, or blocking console errors during normal navigation.",
  },
  {
    id: "responsive-laptop",
    label: "Laptop View Safety",
    url: "all_registered_routes",
    group: "runtime",
    priority: 1,
    expectedResult: "Key above-the-fold sections are visible on laptop without major clipping.",
  },
  {
    id: "responsive-mobile",
    label: "Mobile View Safety",
    url: "all_registered_routes",
    group: "runtime",
    priority: 2,
    expectedResult: "Pages stack cleanly on mobile with no major horizontal overflow.",
  },
]);

export function buildManualBrowserSignoffModel({
  results = [],
  source = "shs_post_v1_manual_browser_signoff",
} = {}) {
  const resultById = new Map(results.map((result) => [result.id, result]));

  const rows = SHS_MANUAL_BROWSER_SIGNOFF_REGISTRY.map((item) => {
    const result = resultById.get(item.id) || {};
    const status = result.status || "not_tested";
    const passed = status === "passed";

    return {
      ...item,
      status,
      passed,
      finding: result.finding || "",
      severity: result.severity || "none",
      notes: result.notes || "",
      testedAt: result.testedAt || null,
    };
  });

  const tested = rows.filter((row) => row.status !== "not_tested");
  const passed = rows.filter((row) => row.status === "passed");
  const failed = rows.filter((row) => row.status === "failed");
  const blocked = rows.filter((row) => row.status === "blocked");
  const review = rows.filter((row) => row.status === "review");
  const notTested = rows.filter((row) => row.status === "not_tested");

  let signoffStatus = "not_started";
  let signoffLabel = "Manual Browser Signoff Not Started";
  let recommendedNextAction = "Run manual browser signoff across the registered V1 pages.";

  if (failed.length || blocked.length) {
    signoffStatus = "needs_fix";
    signoffLabel = "Manual Browser Fixes Needed";
    recommendedNextAction = "Fix failed or blocked browser signoff items before deployment.";
  } else if (review.length) {
    signoffStatus = "review_needed";
    signoffLabel = "Manual Browser Review Needed";
    recommendedNextAction = "Review flagged browser findings before final deployment.";
  } else if (notTested.length && tested.length) {
    signoffStatus = "in_progress";
    signoffLabel = "Manual Browser Signoff In Progress";
    recommendedNextAction = "Continue testing remaining browser signoff items.";
  } else if (!notTested.length && rows.length) {
    signoffStatus = "passed";
    signoffLabel = "Manual Browser Signoff Passed";
    recommendedNextAction = "Proceed to bundle/code-splitting optimization or deployment checklist.";
  }

  return {
    source,
    signoffStatus,
    signoffLabel,
    recommendedNextAction,
    summary: {
      totalItems: rows.length,
      testedItems: tested.length,
      passedItems: passed.length,
      failedItems: failed.length,
      blockedItems: blocked.length,
      reviewItems: review.length,
      notTestedItems: notTested.length,
    },
    rows,
    failed,
    blocked,
    review,
    notTested,
  };
}

export function buildManualBrowserSignoffRows(model) {
  if (!model) return [];

  return [
    ["Total Items", model.summary.totalItems],
    ["Tested Items", model.summary.testedItems],
    ["Passed Items", model.summary.passedItems],
    ["Failed Items", model.summary.failedItems],
    ["Blocked Items", model.summary.blockedItems],
    ["Review Items", model.summary.reviewItems],
    ["Not Tested", model.summary.notTestedItems],
  ];
}

export function manualBrowserSignoffStatusClass(status) {
  if (status === "passed") return "manual-signoff--passed";
  if (status === "needs_fix") return "manual-signoff--needs-fix";
  if (status === "review_needed") return "manual-signoff--review";
  if (status === "in_progress") return "manual-signoff--in-progress";
  return "manual-signoff--not-started";
}
