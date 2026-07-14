const LEGACY_IDENTITY_KEYS = [
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
  "shsDevIdentityRoleOverride",
];

export function clearLegacyAuthoritativeIdentityState() {
  if (typeof window === "undefined") return;
  LEGACY_IDENTITY_KEYS.forEach((key) => window.localStorage.removeItem(key));
}

export function assertNoSessionTokenStorage() {
  if (typeof window === "undefined") return true;
  const forbidden = ["session", "token", "refresh", "cookie"];
  return !Object.keys(window.localStorage).some((key) =>
    forbidden.some((item) => key.toLowerCase().includes(item)) &&
    key.toLowerCase().includes("shs")
  );
}

