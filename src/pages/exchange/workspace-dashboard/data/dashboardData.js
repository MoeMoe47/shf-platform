export const LOGO_SRC = "/assets/branding/shs_orbiter_logo.png";

export const routeMap = {
  "Command Surface": "/exchange/command",
  Aggregation: "/exchange/aggregation",
  Verification: "/exchange/verification",
  Reconciliation: "/exchange/reconciliation",
  Oracle: "/exchange/oracle",
  Analyst: "/exchange/analyst",
  Reporting: "/exchange/reporting",
  "Audit Ledger": "/exchange/audit-ledger",
  "Files & Data": "/exchange/files",
  Integrations: "/exchange/integrations",
};

export const navItems = [
  ["⌂", "Overview", "blue"],
  ["●", "Profile", "green"],
  ["▦", "Workspace", "violet"],
  ["⬢", "Apps", "green"],
  ["▤", "Reports", "blue"],
  ["▰", "Files", "blue"],
  ["⚠", "Notifications", "gold"],
  ["📅", "Calendar", "teal"],
  ["🎥", "Conference", "teal"],
  ["✍", "Journal", "violet"],
  ["🛡", "Security", "green"],
  ["▥", "Organization", "cyan"],
  ["▣", "Billing", "green"],
  ["⚙", "Settings", "muted"],
  ["?", "Help Center", "muted"],
];

export const statusChips = [
  ["🛡", "Identity Verified", "green"],
  ["⌘", "Workspace Active", "blue"],
  ["🔔", "2 Notifications", "orange"],
  ["▥", "Reports Ready", "green"],
  ["🔒", "Secure Session", "teal"],
];

export const kpis = [
  ["▧", "Active Workspaces", "5", "↑ 25%", "vs last 30 days", "blue"],
  ["▤", "Saved Reports", "24", "↑ 12%", "vs last 30 days", "violet"],
  ["☑", "Pending Tasks", "8", "↑ 3%", "requires attention", "orange"],
  ["☁", "Recent Uploads", "17", "↑ 41%", "vs last 30 days", "green"],
  ["🔔", "Notifications", "2", "new", "unread messages", "violet"],
  ["🛡", "Access Level", "Tier 3", "Active", "High Clearance", "green"],
];

export const apps = [
  ["🌐", "Command Surface", "Operational overview & command", "blue"],
  ["⬢", "Aggregation", "Data intake & aggregation", "teal"],
  ["🛡", "Verification", "Entity & controls verification", "blue"],
  ["⚖", "Reconciliation", "Contradictions & resolution", "gold"],
  ["🔮", "Oracle", "AI truth engine & contradictions", "violet"],
  ["✦", "Analyst", "AI analyst narratives & insights", "violet"],
  ["▥", "Reporting", "Dashboards & custom reports", "green"],
  ["▤", "Audit Ledger", "Complete audit trail & logs", "teal"],
  ["📁", "Files & Data", "Documents & evidence library", "blue"],
  ["🧩", "Integrations", "Connected systems & APIs", "orange"],
  ["🎥", "Conference", "Start, join, or schedule workspace meetings", "teal"],
  ["📅", "Calendar", "Meetings, deadlines, and follow-up reviews", "green"],
  ["✍", "Journal", "Notes, reflections, and operator logs", "violet"],
];

export const recentActivity = [
  ["▤", "Verification completed for Hamilton County providers", "Verification Module", "10:24 AM", "Completed", "green"],
  ["⚠", "Contradiction review required: Franklin County dataset", "Oracle Truth Engine", "Yesterday", "Requires Review", "orange"],
  ["📁", "New evidence package uploaded", "Files & Data", "May 16, 2025", "Completed", "green"],
  ["▥", "Monthly operational report generated", "Reporting Module", "May 16, 2025", "Completed", "green"],
];

export const agendaItems = [
  ["🎥", "Provider verification conference", "Today · 1:30 PM", "Zoom ready", "teal"],
  ["📅", "Franklin contradiction review", "Today · 3:00 PM", "Command handoff", "orange"],
  ["🛡", "Evidence follow-up deadline", "Tomorrow · 10:00 AM", "Verification", "green"],
];

export const journalItems = [
  ["✍", "Operator reflection", "Draft note from today’s workspace review", "Private"],
  ["▤", "Meeting notes", "Hamilton provider verification call", "Linked"],
  ["⚑", "Follow-up note", "Franklin dataset contradiction context", "Review"],
];

export const files = [
  ["📁", "Franklin_County_Evidence_Package.zip", "2h ago"],
  ["📁", "Hamilton_Providers_List_2025.xlsx", "1d ago"],
  ["📁", "Q2_Contradictions_Log.pdf", "2d ago"],
];
