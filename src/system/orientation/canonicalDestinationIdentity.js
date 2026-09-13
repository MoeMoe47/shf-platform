const AUTHENTICATED_BOS_ROUTES = Object.freeze([
  "/hub",
  "admin.html#/hub",
]);

export const CANONICAL_AUTHENTICATED_DESTINATIONS = Object.freeze({
  BOS_HUB: "bos",
});

export function resolveAuthenticatedDestination(route) {
  const value = String(route || "").trim();
  return AUTHENTICATED_BOS_ROUTES.includes(value)
    ? CANONICAL_AUTHENTICATED_DESTINATIONS.BOS_HUB
    : null;
}

export function isPublicBosDiscoveryRoute(route) {
  return String(route || "").trim() === "/solutions.html#/home";
}
