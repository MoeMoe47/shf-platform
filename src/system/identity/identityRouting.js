import { normalizeHubRole } from "@/system/identity/hubAccessControl";

const SHS_DEV_ADMIN_OVERRIDE_KEY = "shsDevIdentityRoleOverride";
const SHS_DEV_ADMIN_EMAILS_KEY = "shsDevIdentityAdminEmails";
const SHS_DEV_ADMIN_EMAILS = ["admin@demo.shs", "shs@demo.shs"];

function isLocalDevelopmentHost() {
  if (typeof window === "undefined") return false;

  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function canUseLocalDevelopmentIdentityOverride(email) {
  if (!import.meta.env.DEV || !isLocalDevelopmentHost()) return false;

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return false;

  const configuredEmails = String(localStorage.getItem(SHS_DEV_ADMIN_EMAILS_KEY) || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return [...SHS_DEV_ADMIN_EMAILS, ...configuredEmails].includes(normalizedEmail);
}

function getLocalDevelopmentRoleOverride(email) {
  if (!canUseLocalDevelopmentIdentityOverride(email)) return "";

  const overrideRole = normalizeHubRole(localStorage.getItem(SHS_DEV_ADMIN_OVERRIDE_KEY));
  return overrideRole === "shs_admin" ? overrideRole : "";
}

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

export function seedLocalShsAdminIdentityForDevelopment() {
  if (typeof window === "undefined") return false;

  /*
    Local development helper only:
    - Requires Vite dev mode and a localhost-style host.
    - Does not change hubAccessControl; /ops remains shs_admin-only.
    - Production builds cannot use this path because import.meta.env.DEV is false.

    Browser console usage:
    window.SHS_DEV_IDENTITY.seedShsAdmin()
  */
  if (!import.meta.env.DEV || !isLocalDevelopmentHost()) return false;

  const shsAdminUser = getDemoUserByEmail("shs@demo.shs");
  if (!shsAdminUser) return false;

  saveIdentitySession(shsAdminUser);
  localStorage.setItem(SHS_DEV_ADMIN_OVERRIDE_KEY, "shs_admin");
  return true;
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
    SHS_DEV_ADMIN_OVERRIDE_KEY,
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

  const storedEmail = localStorage.getItem("shsUserEmail") || "";
  const storedRole = normalizeHubRole(localStorage.getItem("shsUserRole") || localStorage.getItem("shsHubDemoRole"));
  const developmentRoleOverride = getLocalDevelopmentRoleOverride(storedEmail);
  const role = developmentRoleOverride || storedRole;

  return {
    isAuthenticated: localStorage.getItem("shsAuthStatus") === "authenticated",
    id: localStorage.getItem("shsUserId") || "",
    name: localStorage.getItem("shsUserName") || "Guest",
    email: storedEmail,
    role,
    roleLabel: developmentRoleOverride ? "SHS Admin (local dev)" : localStorage.getItem("shsUserRoleLabel") || role,
    organization: localStorage.getItem("shsOrganization") || "",
    workspace: localStorage.getItem("shsWorkspace") || "",
    recommendedGoal: localStorage.getItem("shsRecommendedGoal") || "",
  };
}

if (typeof window !== "undefined" && import.meta.env.DEV && isLocalDevelopmentHost()) {
  /*
    Intentionally exposed only during local Vite development so the project
    owner can recover an admin demo session without weakening production auth.
  */
  window.SHS_DEV_IDENTITY = {
    seedShsAdmin: seedLocalShsAdminIdentityForDevelopment,
    setShsAdminOverride() {
      const email = localStorage.getItem("shsUserEmail") || "";
      if (!canUseLocalDevelopmentIdentityOverride(email)) return false;
      localStorage.setItem(SHS_DEV_ADMIN_OVERRIDE_KEY, "shs_admin");
      return true;
    },
    clearOverride() {
      localStorage.removeItem(SHS_DEV_ADMIN_OVERRIDE_KEY);
      return true;
    },
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
