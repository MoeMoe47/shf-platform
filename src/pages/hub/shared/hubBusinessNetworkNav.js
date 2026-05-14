import { canAccessHubRoute, normalizeHubRole } from "@/system/identity/hubAccessControl";

export const HUB_ORBITER_LOGO = "/assets/shs/shs-orbiter-logo.png";

export const HUB_BUSINESS_NAV_ITEMS_ALL = [
  ["⌂", "Hub", "#/hub"],
  ["◎", "Network", "#/hub/network"],
  ["◇", "Intake", "#/hub/intake"],
  ["▤", "Queue", "#/hub/queue"],
  ["↻", "Life", "#/hub/lifecycle"],
  ["✦", "Growth", "#/hub/growth-network"],
  ["◉", "Intel", "#/hub/intelligence"],
  ["▦", "Bundles", "#/hub/bundles"],
  ["↗", "Opps", "#/hub/opportunities"],
  ["$", "Sales", "#/hub/sales-pipeline"],
  ["▧", "Reports", "#/hub/reports"],
];

function hashToRoute(hash) {
  return String(hash || "")
    .replace(/^#/, "")
    .replace(/^\/?/, "/");
}

function getStoredHubRole() {
  if (typeof window === "undefined") return "client";

  return normalizeHubRole(
    window.localStorage.getItem("shsUserRole") ||
    window.localStorage.getItem("shsHubDemoRole") ||
    "client"
  );
}

export function getHubBusinessNavItemsForRole(role = getStoredHubRole()) {
  const normalizedRole = normalizeHubRole(role);

  return HUB_BUSINESS_NAV_ITEMS_ALL.filter(([, , hash]) => {
    const route = hashToRoute(hash);
    return canAccessHubRoute(normalizedRole, route);
  });
}

export const HUB_BUSINESS_NAV_ITEMS = getHubBusinessNavItemsForRole();

export function setHubHash(hash) {
  if (typeof window !== "undefined") {
    window.location.hash = hash;
  }
}
