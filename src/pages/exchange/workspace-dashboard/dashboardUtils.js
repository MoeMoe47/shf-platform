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

export function readJournalEntries() {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem("shs.journalEntries");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeJournalEntries(entries) {
  if (typeof window === "undefined") return;
  localStorage.setItem("shs.journalEntries", JSON.stringify(entries));
}

export function createJournalEntry(entry) {
  const entries = readJournalEntries();

  const nextEntry = {
    id: `journal-${Date.now()}`,
    title: entry.title || "Untitled Note",
    body: entry.body || "",
    visibility: entry.visibility || "Private",
    contextType: entry.contextType || "Workspace",
    createdAt: new Date().toISOString(),
    status: entry.status || "Private",
  };

  const nextEntries = [nextEntry, ...entries].slice(0, 25);
  writeJournalEntries(nextEntries);

  window.dispatchEvent(new CustomEvent("shsDash:journalUpdated", { detail: nextEntries }));

  return nextEntry;
}
