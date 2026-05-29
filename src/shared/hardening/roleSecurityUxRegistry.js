export const SHS_ROLE_SECURITY_GROUPS = Object.freeze({
  auth: "Auth / Login",
  protectedRoutes: "Protected Routes",
  adminAccess: "Admin Access",
  hubAccess: "Hub Access",
  reportingAccess: "Reporting Access",
  navigation: "Role-Based Navigation",
  runtimeSafety: "Runtime Safety",
});

export const SHS_ROLE_SECURITY_UX_REGISTRY = Object.freeze([
  {
    id: "login-route-renders",
    label: "Login Route Renders",
    group: "auth",
    expectedBehavior: "Login route opens without blank screen or runtime crash.",
    route: "/admin.html#/login",
    expectedAccess: "public_auth",
    priority: 1,
  },
  {
    id: "auth-context-loads",
    label: "Auth Context Loads",
    group: "auth",
    expectedBehavior: "Auth context initializes and does not throw runtime errors.",
    route: "/admin.html",
    expectedAccess: "protected",
    priority: 1,
  },
  {
    id: "admin-home-protected",
    label: "Admin Home Protected",
    group: "protectedRoutes",
    expectedBehavior: "Admin home should be treated as protected workspace access.",
    route: "/admin.html",
    expectedAccess: "protected",
    priority: 1,
  },
  {
    id: "identity-admin-only",
    label: "Identity Management Admin-Only",
    group: "adminAccess",
    expectedBehavior: "Identity Management should be admin-only and clearly separated from general users.",
    route: "/admin.html#/identity",
    expectedAccess: "admin_only",
    priority: 1,
  },
  {
    id: "hub-dashboard-protected",
    label: "Hub Dashboard Protected",
    group: "hubAccess",
    expectedBehavior: "Hub dashboard should require protected workspace access.",
    route: "/admin.html#/hub",
    expectedAccess: "protected",
    priority: 1,
  },
  {
    id: "hub-intake-protected",
    label: "Hub Intake Protected",
    group: "hubAccess",
    expectedBehavior: "Hub intake page should require protected workspace access.",
    route: "/admin.html#/hub/intake",
    expectedAccess: "protected",
    priority: 2,
  },
  {
    id: "hub-lifecycle-protected",
    label: "Hub Lifecycle Protected",
    group: "hubAccess",
    expectedBehavior: "Hub lifecycle page should require protected workspace access.",
    route: "/admin.html#/hub/lifecycle",
    expectedAccess: "protected",
    priority: 2,
  },
  {
    id: "hub-imports-protected",
    label: "Hub Imports Protected",
    group: "hubAccess",
    expectedBehavior: "Hub imports page should require protected workspace access.",
    route: "/admin.html#/hub/imports",
    expectedAccess: "protected",
    priority: 2,
  },
  {
    id: "reporting-protected",
    label: "Reporting Protected",
    group: "reportingAccess",
    expectedBehavior: "Reporting command surface should require protected workspace access.",
    route: "/admin.html#/reporting",
    expectedAccess: "protected",
    priority: 1,
  },
  {
    id: "briefing-export-protected",
    label: "Briefing Export Protected",
    group: "reportingAccess",
    expectedBehavior: "Briefing export panel should require protected workspace access.",
    route: "/admin.html#/reporting/briefing",
    expectedAccess: "protected",
    priority: 2,
  },
  {
    id: "analyst-memo-protected",
    label: "Analyst Memo Protected",
    group: "reportingAccess",
    expectedBehavior: "Analyst memo panel should require protected workspace access.",
    route: "/admin.html#/reporting/analyst-memo",
    expectedAccess: "protected",
    priority: 2,
  },
  {
    id: "sidebar-role-visibility",
    label: "Sidebar Role Visibility",
    group: "navigation",
    expectedBehavior: "Sidebar/nav should not expose admin-only surfaces to the wrong role.",
    route: "/admin.html",
    expectedAccess: "role_based",
    priority: 1,
  },
  {
    id: "protected-route-fallback",
    label: "Protected Route Fallback",
    group: "protectedRoutes",
    expectedBehavior: "Unauthorized users should see redirect, sign-in, or access notice instead of blank screen.",
    route: "/admin.html#/hub",
    expectedAccess: "protected",
    priority: 1,
  },
  {
    id: "no-major-console-errors",
    label: "No Major Console Errors",
    group: "runtimeSafety",
    expectedBehavior: "Normal navigation should not show major React/runtime/auth errors.",
    route: "all_registered_routes",
    expectedAccess: "all",
    priority: 1,
  },
]);

export function buildRoleSecurityUxModel({
  results = [],
  source = "shs_v1_role_security_ux",
} = {}) {
  const resultById = new Map(results.map((result) => [result.id, result]));

  const rows = SHS_ROLE_SECURITY_UX_REGISTRY.map((check) => {
    const result = resultById.get(check.id) || {};
    const status = result.status || "not_tested";
    const passed = status === "passed";

    return {
      ...check,
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

  let roleSecurityStatus = "not_started";
  let roleSecurityLabel = "Not Started";
  let recommendedNextAction = "Run role/security UX checks across auth, protected routes, navigation, and runtime safety.";

  if (failed.length || blocked.length) {
    roleSecurityStatus = "needs_fix";
    roleSecurityLabel = "Role/Security Fixes Needed";
    recommendedNextAction = "Fix failed or blocked role/security checks before V1 signoff.";
  } else if (review.length) {
    roleSecurityStatus = "review_needed";
    roleSecurityLabel = "Review Needed";
    recommendedNextAction = "Review role/security findings before final signoff.";
  } else if (notTested.length && tested.length) {
    roleSecurityStatus = "in_progress";
    roleSecurityLabel = "Role/Security UX Checks In Progress";
    recommendedNextAction = "Continue testing remaining role/security UX checks.";
  } else if (!notTested.length && rows.length) {
    roleSecurityStatus = "passed";
    roleSecurityLabel = "Role/Security UX Checks Passed";
    recommendedNextAction = "Proceed to final V1 stability report.";
  }

  return {
    source,
    roleSecurityStatus,
    roleSecurityLabel,
    recommendedNextAction,
    summary: {
      totalChecks: rows.length,
      testedChecks: tested.length,
      passedChecks: passed.length,
      failedChecks: failed.length,
      blockedChecks: blocked.length,
      reviewChecks: review.length,
      notTestedChecks: notTested.length,
    },
    rows,
    failed,
    blocked,
    review,
    notTested,
  };
}

export function buildRoleSecurityUxRows(model) {
  if (!model) return [];

  return [
    ["Total Checks", model.summary.totalChecks],
    ["Tested Checks", model.summary.testedChecks],
    ["Passed Checks", model.summary.passedChecks],
    ["Failed Checks", model.summary.failedChecks],
    ["Blocked Checks", model.summary.blockedChecks],
    ["Review Checks", model.summary.reviewChecks],
    ["Not Tested", model.summary.notTestedChecks],
  ];
}

export function roleSecurityUxStatusClass(status) {
  if (status === "passed") return "role-security--passed";
  if (status === "needs_fix") return "role-security--needs-fix";
  if (status === "review_needed") return "role-security--review";
  if (status === "in_progress") return "role-security--in-progress";
  return "role-security--not-started";
}
