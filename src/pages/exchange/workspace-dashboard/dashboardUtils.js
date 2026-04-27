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

export function readAgendaItems() {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem("shs.agendaItems");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeAgendaItems(items) {
  if (typeof window === "undefined") return;
  localStorage.setItem("shs.agendaItems", JSON.stringify(items));
}

export function createAgendaItem(item) {
  const current = readAgendaItems();

  const nextItem = {
    id: `agenda-${Date.now()}`,
    title: item.title || "Untitled Agenda Item",
    type: item.type || "Meeting",
    date: item.date || "",
    time: item.time || "",
    status: item.status || "Scheduled",
    priority: item.priority || "Normal",
    context: item.context || "Workspace",
    notes: item.notes || "",
    createdAt: new Date().toISOString(),
  };

  const nextItems = [nextItem, ...current].slice(0, 40);
  writeAgendaItems(nextItems);

  window.dispatchEvent(new CustomEvent("shsDash:agendaUpdated", { detail: nextItems }));

  return nextItem;
}

export function readWorkspaceFiles() {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem("shs.workspaceFiles");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeWorkspaceFiles(files) {
  if (typeof window === "undefined") return;
  localStorage.setItem("shs.workspaceFiles", JSON.stringify(files));
}

export function createWorkspaceFile(fileMeta) {
  const current = readWorkspaceFiles();

  const nextFile = {
    id: `file-${Date.now()}`,
    name: fileMeta.name || "Untitled File",
    type: fileMeta.type || "Unknown",
    size: fileMeta.size || "Unknown size",
    category: fileMeta.category || "Workspace",
    status: fileMeta.status || "Uploaded",
    source: fileMeta.source || "Manual upload",
    uploadedAt: new Date().toISOString(),
  };

  const nextFiles = [nextFile, ...current].slice(0, 40);
  writeWorkspaceFiles(nextFiles);

  window.dispatchEvent(new CustomEvent("shsDash:filesUpdated", { detail: nextFiles }));

  return nextFile;
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "Unknown size";

  const size = Number(bytes);
  if (Number.isNaN(size)) return "Unknown size";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function readWorkspaceReports() {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem("shs.workspaceReports");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeWorkspaceReports(reports) {
  if (typeof window === "undefined") return;
  localStorage.setItem("shs.workspaceReports", JSON.stringify(reports));
}

export function createWorkspaceReport(reportMeta) {
  const current = readWorkspaceReports();

  const nextReport = {
    id: `report-${Date.now()}`,
    title: reportMeta.title || "Untitled Report",
    reportType: reportMeta.reportType || "Operational Summary",
    audience: reportMeta.audience || "Executive",
    format: reportMeta.format || "PDF",
    status: reportMeta.status || "Draft",
    notes: reportMeta.notes || "",
    createdAt: new Date().toISOString(),
  };

  const nextReports = [nextReport, ...current].slice(0, 40);
  writeWorkspaceReports(nextReports);

  window.dispatchEvent(new CustomEvent("shsDash:reportsUpdated", { detail: nextReports }));

  return nextReport;
}

export function dedupeWorkspaceReports(reports = []) {
  const seen = new Set();

  return reports.filter((report) => {
    const key = [
      report.title || "",
      report.reportType || "",
      report.audience || "",
      report.format || "",
      report.status || "",
      report.notes || "",
    ].join("|").toLowerCase().trim();

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function cleanWorkspaceReports() {
  const current = readWorkspaceReports();
  const cleaned = dedupeWorkspaceReports(current);
  writeWorkspaceReports(cleaned);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("shsDash:reportsUpdated", { detail: cleaned }));
  }

  return cleaned;
}

export function readCommandActionEvents() {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem("shs.commandActionEvents");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function formatCommandActivityTime(value) {
  if (!value) return "Just now";

  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Just now";
  }
}

export function openDashboardOverview() {
  if (typeof window === "undefined") return;

  localStorage.setItem("shs.dashboard.activePanel", "Overview");
  window.dispatchEvent(new CustomEvent("shsDash:panelChange", { detail: "Overview" }));

  if (window.location.hash !== "#/exchange/dashboard") {
    window.location.hash = "/exchange/dashboard";
  }
}
