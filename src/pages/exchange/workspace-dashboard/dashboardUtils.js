import { routeMap } from "./data/dashboardData";

export function readStoredProfile() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("shs.workspaceProfile") || "{}");
  } catch {
    return {};
  }
}

export function writeProfile(profile) {
  if (typeof window === "undefined") return;

  localStorage.setItem("shs.workspaceProfile", JSON.stringify(profile));

  localStorage.setItem("shs.operatorProfile", JSON.stringify({
    name: profile.name || "Alex Morgan",
    role: profile.role || "Senior Analyst",
    photoUrl: profile.photoUrl || "",
    clearanceLevel: profile.clearanceLevel || "Tier 3 - High",
    sessionStatus: "active",
    lastVerifiedAt: "10:42 AM ET",
  }));
}

export function goToExchangeRoute(path) {
  if (typeof window === "undefined") return;
  window.location.hash = path;
}

export function openDashboardPanel(panel) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("shsDash:setPanel", { detail: panel }));
}

export function handleWorkspaceTile(title) {
  if (["Conference", "Calendar", "Journal"].includes(title)) {
    openDashboardPanel(title);
    return;
  }

  goToExchangeRoute(routeMap[title] || "/exchange/dashboard");
}
