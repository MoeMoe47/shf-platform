// apps/shf-web/src/pages/civicsure/explorer/searchResultsMockData.js
//
// DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA.
//
// Static corpus (and the small pure search/filter/sort helpers that
// operate on it) for the CivicSure Search Results page FRAME
// (visual/UI build only — see docs/ui/CIVICSURE_SEARCH_RESULTS_FRAME.md).
// Nothing here is wired to a live search index, GPA data models, the
// Truth Spine, Evidence authority, Metric Registry, Public Disclosure,
// Shared Reporting, or any other CivicSure assurance system. Matching
// is a simplified case-insensitive substring check against each
// record's title/description/keywords — explicitly DEMO relevance
// logic, not a production search ranking policy.
//
// Records deliberately reuse ids and figures already established
// elsewhere in the suite (clean-energy-workforce-training,
// community-future-network, franklin-county,
// ohio-workforce-innovation-fund,
// ohio-department-workforce-development, employment-placement,
// employment-placement-evidence-fy2026) so their "View →" links land
// on already-built, already-working pages instead of placeholders.
// The corpus is intentionally sized so the default demo query
// "workforce" returns exactly the counts shown in the approved brief
// (27 total: 8 programs, 4 providers, 2 counties, 3 funding, 2
// agencies, 4 outcomes, 3 evidence, 1 report).
export const RESULT_TYPES = [
  { key: "all", label: "All" },
  { key: "program", label: "Programs" },
  { key: "provider", label: "Providers" },
  { key: "county", label: "Counties" },
  { key: "funding", label: "Funding" },
  { key: "agency", label: "Agencies" },
  { key: "outcome", label: "Outcomes" },
  { key: "evidence", label: "Evidence" },
  { key: "report", label: "Reports" },
];

export const RESULT_TYPE_LABELS = {
  program: "Program",
  provider: "Provider",
  county: "County",
  funding: "Funding",
  agency: "Agency",
  outcome: "Outcome",
  evidence: "Evidence",
  report: "Report",
};

export const DEFAULT_QUERY = "workforce";

export const SEARCH_SUGGESTIONS = [
  "workforce training",
  "Franklin County",
  "youth programs",
  "mental health",
  "employment outcomes",
  "public funding",
  "Community Future Network",
];

export const GEOGRAPHY_FILTERS = ["All Ohio", "Franklin County", "Delaware County", "Licking County"];
export const CATEGORY_FILTERS = ["All", "Workforce", "Education", "Housing", "Health", "Community Development"];
export const STATUS_FILTERS = ["All", "Active", "Verified", "On Track", "Pending Review", "Open Exception"];
export const PERIOD_FILTERS = ["All", "FY2026", "FY2025"];

export const SORT_OPTIONS = [
  { key: "relevance", label: "Relevance" },
  { key: "recent", label: "Recently Updated" },
  { key: "funding", label: "Funding Amount" },
  { key: "alphabetical", label: "Alphabetical" },
];

const STATUS_BADGE_STATES = new Set(["verified", "on-track", "pending-review", "open-exception"]);

function toStatusState(statusLabel) {
  const map = { Verified: "verified", "On Track": "on-track", "Pending Review": "evidence-pending", "Open Exception": "open-exception" };
  return map[statusLabel] || null;
}

// Each record carries: type, title, description, keywords (search
// surface), geography/category/reportingPeriod (filter fields),
// statusLabel (shown as a StatusBadge when it maps to one of the
// suite's states, or a plain .cse-pill for lifecycle labels like
// "Active"/"Final"), fundingValue (millions, for the funding sort —
// 0 for types with no natural funding figure), lastUpdated (for the
// recency sort), meta (ordered label/value pairs shown on the card),
// and detailRoute (null where no demo detail page exists yet).
export const SEARCH_RESULTS = [
  // ---------------------------- Programs (8) ----------------------------
  {
    id: "clean-energy-workforce-training",
    type: "program",
    title: "Clean Energy Workforce Training",
    description: "Trains adult participants for clean-energy jobs and verifies employment placements after program completion.",
    keywords: ["workforce", "workforce training", "clean energy", "training", "franklin county", "employment"],
    geography: "Franklin County",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "On Track",
    fundingValue: 4.0,
    lastUpdated: "2026-08-28",
    meta: [
      { label: "Funding", value: "$4.0M" },
      { label: "Evidence", value: "94% coverage" },
    ],
    detailRoute: "#/explorer/programs/clean-energy-workforce-training",
  },
  {
    id: "summer-stem-initiative",
    type: "program",
    title: "Summer STEM Initiative",
    description: "A summer workforce-readiness program building STEM credentials for youth participants.",
    keywords: ["workforce", "stem", "youth", "youth programs", "delaware county", "education", "credential"],
    geography: "Delaware County",
    category: "Education",
    reportingPeriod: "FY2026",
    statusLabel: "On Track",
    fundingValue: 1.8,
    lastUpdated: "2026-08-20",
    meta: [
      { label: "Funding", value: "$1.8M" },
      { label: "Evidence", value: "78% coverage" },
    ],
    detailRoute: null,
  },
  {
    id: "community-mental-health-access",
    type: "program",
    title: "Community Mental Health Access",
    description: "Connects residents to behavioral health services, including workforce reentry support for people returning to stable employment.",
    keywords: ["mental health", "behavioral health", "workforce", "workforce reentry", "licking county", "health"],
    geography: "Licking County",
    category: "Health",
    reportingPeriod: "FY2026",
    statusLabel: "Open Exception",
    fundingValue: 2.6,
    lastUpdated: "2026-07-30",
    meta: [
      { label: "Funding", value: "$2.6M" },
      { label: "Evidence", value: "81% coverage" },
    ],
    detailRoute: null,
  },
  {
    id: "supportive-housing-program",
    type: "program",
    title: "Supportive Housing Program",
    description: "Provides stable housing placements that support long-term workforce participation for previously unhoused residents.",
    keywords: ["housing", "workforce", "supportive housing", "franklin county"],
    geography: "Franklin County",
    category: "Housing",
    reportingPeriod: "FY2025",
    statusLabel: "Verified",
    fundingValue: 5.4,
    lastUpdated: "2025-12-20",
    meta: [
      { label: "Funding", value: "$5.4M" },
      { label: "Evidence", value: "88% coverage" },
    ],
    detailRoute: null,
  },
  {
    id: "adult-basic-education-program",
    type: "program",
    title: "Adult Basic Education Program",
    description: "Provides literacy and workforce-readiness instruction for adults preparing to enter or re-enter the workforce.",
    keywords: ["workforce", "adult education", "literacy", "education", "franklin county"],
    geography: "Franklin County",
    category: "Education",
    reportingPeriod: "FY2026",
    statusLabel: "On Track",
    fundingValue: 1.2,
    lastUpdated: "2026-08-14",
    meta: [
      { label: "Funding", value: "$1.2M" },
      { label: "Evidence", value: "83% coverage" },
    ],
    detailRoute: null,
  },
  {
    id: "apprenticeship-readiness-program",
    type: "program",
    title: "Apprenticeship Readiness Program",
    description: "Prepares participants for registered apprenticeships in skilled-trade workforce pathways.",
    keywords: ["workforce", "apprenticeship", "skilled trades", "delaware county"],
    geography: "Delaware County",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "Pending Review",
    fundingValue: 0.9,
    lastUpdated: "2026-08-05",
    meta: [
      { label: "Funding", value: "$0.9M" },
      { label: "Evidence", value: "70% coverage" },
    ],
    detailRoute: null,
  },
  {
    id: "veterans-workforce-reentry-program",
    type: "program",
    title: "Veterans Workforce Reentry Program",
    description: "Supports veterans transitioning into civilian workforce roles with training and employer connections.",
    keywords: ["workforce", "veterans", "reentry", "franklin county"],
    geography: "Franklin County",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "Verified",
    fundingValue: 2.1,
    lastUpdated: "2026-08-22",
    meta: [
      { label: "Funding", value: "$2.1M" },
      { label: "Evidence", value: "91% coverage" },
    ],
    detailRoute: null,
  },
  {
    id: "rural-broadband-workforce-access",
    type: "program",
    title: "Rural Broadband Workforce Access",
    description: "Expands broadband access in rural communities to support remote workforce training and telework opportunities.",
    keywords: ["workforce", "broadband", "rural", "licking county", "community development"],
    geography: "Licking County",
    category: "Community Development",
    reportingPeriod: "FY2026",
    statusLabel: "On Track",
    fundingValue: 3.3,
    lastUpdated: "2026-08-11",
    meta: [
      { label: "Funding", value: "$3.3M" },
      { label: "Evidence", value: "85% coverage" },
    ],
    detailRoute: null,
  },

  // ---------------------------- Providers (4) ----------------------------
  {
    id: "community-future-network",
    type: "provider",
    title: "Community Future Network",
    description: "A community-focused nonprofit delivering workforce and educational programs for underserved youth and adults.",
    keywords: ["workforce", "nonprofit", "columbus", "franklin county", "youth"],
    geography: "Franklin County",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "Verified",
    fundingValue: 3.25,
    lastUpdated: "2026-08-28",
    meta: [
      { label: "Programs", value: "12 active programs" },
    ],
    detailRoute: "#/explorer/providers/community-future-network",
    orgType: "Nonprofit Provider",
    orgLocation: "Columbus, OH",
  },
  {
    id: "central-ohio-workforce-collaborative",
    type: "provider",
    title: "Central Ohio Workforce Collaborative",
    description: "A regional nonprofit collaborative delivering workforce training programs across central Ohio counties.",
    keywords: ["workforce", "nonprofit", "delaware county", "collaborative"],
    geography: "Delaware County",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "On Track",
    fundingValue: 1.9,
    lastUpdated: "2026-08-18",
    meta: [
      { label: "Programs", value: "5 active programs" },
    ],
    detailRoute: null,
    orgType: "Nonprofit Provider",
    orgLocation: "Delaware, OH",
  },
  {
    id: "youth-opportunity-network",
    type: "provider",
    title: "Youth Opportunity Network",
    description: "Delivers youth workforce and career-readiness programs in partnership with local employers.",
    keywords: ["workforce", "youth", "youth programs", "nonprofit", "fairfield county"],
    geography: "Licking County",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "Open Exception",
    fundingValue: 1.1,
    lastUpdated: "2026-07-25",
    meta: [
      { label: "Programs", value: "3 active programs" },
    ],
    detailRoute: null,
    orgType: "Nonprofit Provider",
    orgLocation: "Fairfield County, OH",
  },
  {
    id: "ohio-valley-skills-alliance",
    type: "provider",
    title: "Ohio Valley Skills Alliance",
    description: "A nonprofit provider delivering skilled-trade workforce apprenticeship readiness programs.",
    keywords: ["workforce", "apprenticeship", "skilled trades", "nonprofit", "delaware county"],
    geography: "Delaware County",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "On Track",
    fundingValue: 0.9,
    lastUpdated: "2026-08-05",
    meta: [
      { label: "Programs", value: "2 active programs" },
    ],
    detailRoute: null,
    orgType: "Nonprofit Provider",
    orgLocation: "Delaware, OH",
  },

  // ---------------------------- Counties (2) ----------------------------
  {
    id: "franklin-county",
    type: "county",
    title: "Franklin County",
    description: "Explore public programs, funding, providers, outcomes, and evidence across Franklin County, including workforce programs.",
    keywords: ["franklin county", "workforce", "ohio", "county"],
    geography: "Franklin County",
    category: "Community Development",
    reportingPeriod: "FY2026",
    statusLabel: "Verified",
    fundingValue: 428,
    lastUpdated: "2026-08-01",
    meta: [
      { label: "Programs", value: "248" },
      { label: "Funding", value: "$428M" },
    ],
    detailRoute: "#/explorer/counties/franklin-county",
  },
  {
    id: "delaware-county",
    type: "county",
    title: "Delaware County",
    description: "Explore public programs, funding, providers, outcomes, and evidence across Delaware County, including workforce programs.",
    keywords: ["delaware county", "workforce", "ohio", "county"],
    geography: "Delaware County",
    category: "Community Development",
    reportingPeriod: "FY2026",
    statusLabel: "On Track",
    fundingValue: 96,
    lastUpdated: "2026-08-03",
    meta: [
      { label: "Programs", value: "63" },
      { label: "Funding", value: "$96M" },
    ],
    detailRoute: null,
  },

  // ---------------------------- Funding (3) ----------------------------
  {
    id: "ohio-workforce-innovation-fund",
    type: "funding",
    title: "Ohio Workforce Innovation Fund",
    description: "State funding supporting workforce training, career pathways, and employer-connected programs across Ohio.",
    keywords: ["workforce", "public funding", "state funding", "innovation fund"],
    geography: "All Ohio",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "Active",
    fundingValue: 25.0,
    lastUpdated: "2026-08-10",
    meta: [
      { label: "Authorized", value: "$25.0M" },
    ],
    detailRoute: "#/explorer/funding/ohio-workforce-innovation-fund",
    fundingType: "State Funding",
  },
  {
    id: "ohio-stem-education-fund",
    type: "funding",
    title: "Ohio STEM Education Fund",
    description: "State education funding supporting STEM and workforce-readiness programs for youth.",
    keywords: ["workforce", "public funding", "stem", "education", "state funding"],
    geography: "All Ohio",
    category: "Education",
    reportingPeriod: "FY2026",
    statusLabel: "Active",
    fundingValue: 2.0,
    lastUpdated: "2026-08-05",
    meta: [
      { label: "Authorized", value: "$2.0M" },
    ],
    detailRoute: null,
    fundingType: "State Funding",
  },
  {
    id: "federal-workforce-development-grant",
    type: "funding",
    title: "Federal Workforce Development Grant",
    description: "Federal grant funding supporting regional workforce development collaboratives.",
    keywords: ["workforce", "public funding", "federal funding", "grant"],
    geography: "All Ohio",
    category: "Workforce",
    reportingPeriod: "FY2025",
    statusLabel: "Active",
    fundingValue: 2.1,
    lastUpdated: "2025-12-01",
    meta: [
      { label: "Authorized", value: "$2.1M" },
    ],
    detailRoute: null,
    fundingType: "Federal Funding",
  },

  // ---------------------------- Agencies (2) ----------------------------
  {
    id: "ohio-department-workforce-development",
    type: "agency",
    title: "Ohio Department of Workforce Development",
    description: "Oversees workforce development programs, funding, provider relationships, and performance initiatives across Ohio.",
    keywords: ["workforce", "state agency", "ohio"],
    geography: "All Ohio",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "Verified",
    fundingValue: 684,
    lastUpdated: "2026-08-15",
    meta: [
      { label: "Programs", value: "42" },
      { label: "Funding administered", value: "$684M" },
    ],
    detailRoute: "#/explorer/agencies/ohio-department-workforce-development",
    agencyType: "State Agency",
  },
  {
    id: "ohio-department-job-family-services",
    type: "agency",
    title: "Ohio Department of Job and Family Services",
    description: "Administers public assistance and workforce-connected family services programs across Ohio.",
    keywords: ["workforce", "state agency", "family services", "ohio"],
    geography: "All Ohio",
    category: "Community Development",
    reportingPeriod: "FY2026",
    statusLabel: "On Track",
    fundingValue: 210,
    lastUpdated: "2026-08-09",
    meta: [
      { label: "Programs", value: "18" },
      { label: "Funding administered", value: "$210M" },
    ],
    detailRoute: null,
    agencyType: "State Agency",
  },

  // ---------------------------- Outcomes (4) ----------------------------
  {
    id: "employment-placement",
    type: "outcome",
    title: "Employment Placement",
    description: "Measures the share of eligible workforce program participants who obtained verified employment within the reporting period.",
    keywords: ["workforce", "employment outcomes", "employment", "placement"],
    geography: "Franklin County",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "Verified",
    fundingValue: 0,
    lastUpdated: "2026-08-28",
    meta: [
      { label: "Actual", value: "59.3%" },
      { label: "Target", value: "55%" },
      { label: "Evidence", value: "94%" },
    ],
    detailRoute: "#/explorer/outcomes/employment-placement",
  },
  {
    id: "credential-attainment",
    type: "outcome",
    title: "Credential Attainment",
    description: "Measures the share of workforce program participants who earned a recognized credential during the reporting period.",
    keywords: ["workforce", "employment outcomes", "credential", "education"],
    geography: "Delaware County",
    category: "Education",
    reportingPeriod: "FY2026",
    statusLabel: "Pending Review",
    fundingValue: 0,
    lastUpdated: "2026-08-20",
    meta: [
      { label: "Actual", value: "54%" },
      { label: "Target", value: "60%" },
      { label: "Evidence", value: "78%" },
    ],
    detailRoute: null,
  },
  {
    id: "training-completion",
    type: "outcome",
    title: "Training Completion",
    description: "Measures the share of workforce program participants who completed eligible training activity during the reporting period.",
    keywords: ["workforce", "employment outcomes", "training", "completion"],
    geography: "All Ohio",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "Verified",
    fundingValue: 0,
    lastUpdated: "2026-08-15",
    meta: [
      { label: "Actual", value: "83%" },
      { label: "Target", value: "80%" },
      { label: "Evidence", value: "90%" },
    ],
    detailRoute: null,
  },
  {
    id: "employer-satisfaction",
    type: "outcome",
    title: "Employer Satisfaction",
    description: "Measures employer satisfaction with workforce program graduates hired during the reporting period.",
    keywords: ["workforce", "employment outcomes", "employer", "satisfaction"],
    geography: "All Ohio",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "Verified",
    fundingValue: 0,
    lastUpdated: "2026-08-15",
    meta: [
      { label: "Actual", value: "78%" },
      { label: "Target", value: "75%" },
      { label: "Evidence", value: "81%" },
    ],
    detailRoute: null,
  },

  // ---------------------------- Evidence (3) ----------------------------
  {
    id: "employment-placement-evidence-fy2026",
    type: "evidence",
    title: "Employment Placement Evidence — FY2026",
    description: "Public-safe verification summary for the evidence supporting the Employment Placement workforce outcome.",
    keywords: ["workforce", "evidence", "employment", "verification"],
    geography: "Franklin County",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "Verified",
    fundingValue: 0,
    lastUpdated: "2026-08-28",
    meta: [{ label: "Coverage", value: "94%" }],
    detailRoute: "#/explorer/evidence/employment-placement-evidence-fy2026",
  },
  {
    id: "credential-attainment-evidence-fy2026",
    type: "evidence",
    title: "Credential Attainment Evidence — FY2026",
    description: "Public-safe verification summary for the evidence supporting the Credential Attainment workforce outcome.",
    keywords: ["workforce", "evidence", "credential", "verification"],
    geography: "Delaware County",
    category: "Education",
    reportingPeriod: "FY2026",
    statusLabel: "Pending Review",
    fundingValue: 0,
    lastUpdated: "2026-08-20",
    meta: [{ label: "Coverage", value: "78%" }],
    detailRoute: null,
  },
  {
    id: "training-completion-evidence-fy2026",
    type: "evidence",
    title: "Training Completion Evidence — FY2026",
    description: "Public-safe verification summary for the evidence supporting the Training Completion workforce outcome.",
    keywords: ["workforce", "evidence", "training", "verification"],
    geography: "All Ohio",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "Verified",
    fundingValue: 0,
    lastUpdated: "2026-08-15",
    meta: [{ label: "Coverage", value: "90%" }],
    detailRoute: null,
  },

  // ---------------------------- Reports (1) ----------------------------
  {
    id: "fy2026-workforce-outcome-assurance-report",
    type: "report",
    title: "FY2026 Workforce Outcome Assurance Report",
    description: "The immutable assurance report covering verified workforce outcomes for FY2026.",
    keywords: ["workforce", "report", "assurance report"],
    geography: "All Ohio",
    category: "Workforce",
    reportingPeriod: "FY2026",
    statusLabel: "Final",
    fundingValue: 0,
    lastUpdated: "2026-08-28",
    meta: [{ label: "Version", value: "R3" }],
    detailRoute: null,
    reportVersion: "R3",
  },
];

export function getResultTypeLabel(type) {
  return RESULT_TYPE_LABELS[type] || type;
}

export function getStatusBadgeState(statusLabel) {
  const state = toStatusState(statusLabel);
  return STATUS_BADGE_STATES.has(state) ? state : null;
}

function matchesQuery(record, query) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    record.title.toLowerCase().includes(q) ||
    record.description.toLowerCase().includes(q) ||
    record.keywords.some((k) => k.toLowerCase().includes(q))
  );
}

function matchesFilters(record, filters) {
  if (filters.geography !== "All Ohio" && record.geography !== filters.geography) return false;
  if (filters.category !== "All" && record.category !== filters.category) return false;
  if (filters.status !== "All" && record.statusLabel !== filters.status) return false;
  if (filters.period !== "All" && record.reportingPeriod !== filters.period) return false;
  return true;
}

export const DEFAULT_FILTERS = { geography: "All Ohio", category: "All", status: "All", period: "All" };

export function searchResults(query, filters) {
  return SEARCH_RESULTS.filter((r) => matchesQuery(r, query) && matchesFilters(r, filters));
}

export function countsByType(results) {
  const counts = { all: results.length };
  for (const type of Object.keys(RESULT_TYPE_LABELS)) {
    counts[type] = results.filter((r) => r.type === type).length;
  }
  return counts;
}

export function sortResults(results, sortKey) {
  const copy = [...results];
  if (sortKey === "recent") {
    copy.sort((a, b) => (a.lastUpdated < b.lastUpdated ? 1 : -1));
  } else if (sortKey === "funding") {
    copy.sort((a, b) => b.fundingValue - a.fundingValue);
  } else if (sortKey === "alphabetical") {
    copy.sort((a, b) => a.title.localeCompare(b.title));
  }
  // "relevance" (default) preserves the corpus's built-in demo order.
  return copy;
}

// Explainability: a short, honest sentence naming where the query
// text was found, never a fabricated relevance score.
export function getMatchExplanation(record, query) {
  if (!query.trim()) return null;
  const q = query.trim().toLowerCase();
  const where = [];
  if (record.title.toLowerCase().includes(q)) where.push("title");
  if (record.category.toLowerCase().includes(q)) where.push(`${getResultTypeLabel(record.type).toLowerCase()} category`);
  if (record.description.toLowerCase().includes(q)) where.push("description");
  if (where.length === 0 && record.keywords.some((k) => k.toLowerCase().includes(q))) where.push("related keywords");
  if (where.length === 0) return null;
  return `Matched “${query.trim()}” in ${where.join(" and ")}.`;
}

export const PUBLIC_LIMIT_NOTICE =
  "Some results are unavailable because they are not approved for public display.";

export const ABOUT_SEARCH_POINTS = [
  "Search covers CivicSure's public-safe records only — programs, providers, counties, funding, agencies, outcomes, evidence summaries, and reports.",
  "Results may be limited by public-display rules. Some records exist but are not shown here because they are not approved for public display.",
  "Search relevance in this phase is demo/frame logic — a simple keyword match, not a production search ranking policy.",
  "Private and operator records are never searched or returned here.",
  "A search result does not itself create or imply an assurance claim — it points to a record's own detail page for the authoritative context.",
  "Entity detail pages (Program, Provider, County, Funding, Agency, Outcome, Evidence) provide the full, authoritative public context — search results are a starting point, not a substitute.",
];

export const ABOUT_DATA_FIELDS = {
  scope: "Programs, Providers, Counties, Funding, Agencies, Outcomes, Evidence summaries, and Reports already published to CivicSure Explorer's public-safe demo data.",
  dataSources: "Ohio Department of Workforce Development / CivicSure Public Disclosure (demo)",
  reportingPeriods: "FY2025–FY2026 (varies by record; see each record's own reporting period)",
  lastDemoUpdate: "2026-08-28",
  limitations: "This is demo data only. Every result, count, and status on this page is illustrative and does not represent a real CivicSure search index.",
  methodology: "In production, CivicSure search would query an approved public-safe index with real relevance ranking under CivicSure/GPA authority — not implemented in this page frame.",
  dataDictionary:
    "\"Verified\" means an independent evidence sample confirmed the reported figure. \"Pending Review\" means a record is submitted but not yet independently confirmed. \"Open Exception\" means a reporting or compliance gap is still unresolved.",
};
