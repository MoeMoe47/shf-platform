import { normalizeHubRole } from "@/system/identity/hubAccessControl";

export const SHS_DEMO_USERS = [
  {
    id: "demo_client",
    name: "Jordan Ellis",
    email: "client@demo.shs",
    role: "client",
    roleLabel: "Client User",
    organization: "Silicon Heartland Hub Client",
    workspace: "Hub Workspace",
    landingRoute: "/hub",
    recommendedGoal: "setup-data",
  },
  {
    id: "demo_client_admin",
    name: "Morgan Reed",
    email: "admin@demo.shs",
    role: "client_admin",
    roleLabel: "Client Admin",
    organization: "Silicon Heartland Hub Client",
    workspace: "Hub Admin Workspace",
    landingRoute: "/hub",
    recommendedGoal: "generate-report",
  },
  {
    id: "demo_shs_admin",
    name: "Avery Stone",
    email: "shs@demo.shs",
    role: "shs_admin",
    roleLabel: "SHS Admin",
    organization: "Silicon Heartland Solutions",
    workspace: "SHS System Workspace",
    landingRoute: "/hub",
    recommendedGoal: "open-command-surface",
  },
];

export function getDemoUserByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return SHS_DEMO_USERS.find((user) => user.email === normalizedEmail) || null;
}

export function saveIdentitySession(user) {
  if (typeof window === "undefined" || !user) return;

  const normalizedRole = normalizeHubRole(user.role);

  localStorage.setItem("shsAuthStatus", "authenticated");
  localStorage.setItem("shsUserId", user.id);
  localStorage.setItem("shsUserName", user.name);
  localStorage.setItem("shsUserEmail", user.email);
  localStorage.setItem("shsUserRole", normalizedRole);
  localStorage.setItem("shsHubDemoRole", normalizedRole);
  localStorage.setItem(
    "shsUserRoleLabel",
    normalizedRole === "shs_admin"
      ? "SHS Admin"
      : normalizedRole === "client_admin"
      ? "Client Admin"
      : "Client User"
  );
  localStorage.setItem("shsOrganization", user.organization);
  localStorage.setItem("shsWorkspace", user.workspace);
  localStorage.setItem("shsRecommendedGoal", user.recommendedGoal || "");
}

export function clearIdentitySession() {
  if (typeof window === "undefined") return;

  [
    "shsAuthStatus",
    "shsUserId",
    "shsUserName",
    "shsUserEmail",
    "shsUserRole",
    "shsHubDemoRole",
    "shsUserRoleLabel",
    "shsOrganization",
    "shsWorkspace",
    "shsRecommendedGoal",
  ].forEach((key) => localStorage.removeItem(key));
}

export function getCurrentIdentity() {
  if (typeof window === "undefined") {
    return {
      isAuthenticated: false,
      role: "client",
      name: "Guest",
      email: "",
      organization: "",
      workspace: "",
    };
  }

  const role = normalizeHubRole(localStorage.getItem("shsUserRole") || localStorage.getItem("shsHubDemoRole"));

  return {
    isAuthenticated: localStorage.getItem("shsAuthStatus") === "authenticated",
    id: localStorage.getItem("shsUserId") || "",
    name: localStorage.getItem("shsUserName") || "Guest",
    email: localStorage.getItem("shsUserEmail") || "",
    role,
    roleLabel: localStorage.getItem("shsUserRoleLabel") || role,
    organization: localStorage.getItem("shsOrganization") || "",
    workspace: localStorage.getItem("shsWorkspace") || "",
    recommendedGoal: localStorage.getItem("shsRecommendedGoal") || "",
  };
}

export function getLandingRouteForUser(user) {
  const role = normalizeHubRole(user?.role);

  if (role === "shs_admin") return "/hub";
  if (role === "client_admin") return "/hub";
  return "/hub";
}

export function goToAdminHash(route) {
  if (typeof window === "undefined") return;

  const cleanRoute = String(route || "/hub").startsWith("/")
    ? String(route || "/hub")
    : `/${route}`;

  window.location.href = `/admin.html#${cleanRoute}`;
}
