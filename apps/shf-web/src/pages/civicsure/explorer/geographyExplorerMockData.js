// apps/shf-web/src/pages/civicsure/explorer/geographyExplorerMockData.js
//
// DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA.
//
// Static view-model fixtures for the CivicSure Geography Explorer
// page FRAME (visual/UI build only — see
// docs/ui/CIVICSURE_GEOGRAPHY_EXPLORER_FRAME.md). Nothing here is
// wired to GPA data models, the Truth Spine, Evidence authority,
// Metric Registry, Public Disclosure, or any other CivicSure
// assurance system. Every number, name, and status below is a
// placeholder chosen to reproduce the approved mock's layout — none
// of it is a real CivicSure fact. Do not import this file from
// anything outside the Explorer/Geography Explorer page frame, and do
// not let it drift into real reporting/assurance code paths.
//
// Franklin County's numbers intentionally match
// countyDetailMockData.js's "franklin-county" record (imported below)
// so the two pages never show conflicting demo figures for the same
// county, and so Franklin's map marker/quick-list row can link to the
// real, already-built County Detail frame.
import { getCountyDetail } from "./countyDetailMockData.js";

const franklin = getCountyDetail("franklin-county");

export const GEO_SUMMARY_METRICS = [
  { key: "programs", label: "Ohio Programs", value: "1,248", icon: "grid" },
  { key: "funding", label: "Total Funding", value: "$2.8B", icon: "bank" },
  { key: "providers", label: "Providers", value: "1,104", icon: "people" },
  { key: "outcomes", label: "Verified Outcomes", value: "74%", icon: "shieldCheck", tone: "green" },
];

export const DEFAULT_CONTEXT_CHIPS = {
  state: { key: "state", label: "Ohio", removable: false },
  category: { key: "category", label: "All Program Categories", removable: true },
  period: { key: "period", label: "FY2026", removable: true },
  status: { key: "status", label: "Active", removable: true },
};

export const PROGRAM_CATEGORY_OPTIONS = [
  { key: "education", label: "Education" },
  { key: "housing", label: "Housing" },
  { key: "health", label: "Health" },
  { key: "workforce", label: "Workforce" },
  { key: "community", label: "Community Development" },
];

export const FUNDING_SOURCE_OPTIONS = [
  { key: "all", label: "All Sources" },
  { key: "state", label: "State" },
  { key: "county", label: "County" },
  { key: "federal", label: "Federal" },
  { key: "local", label: "Local" },
  { key: "other", label: "Other" },
];

// Values match the shared StatusBadge vocabulary where one exists
// (verified / pending-review / open-exception / corrective-action) —
// "on-track" and "not-yet-evaluated" are additional states specific
// to this page's Assurance Status filter, styled locally.
export const ASSURANCE_STATUS_OPTIONS = [
  { key: "all", label: "All" },
  { key: "verified", label: "Verified" },
  { key: "on-track", label: "On Track" },
  { key: "evidence-pending", label: "Evidence Pending" },
  { key: "open-exception", label: "Open Exception" },
  { key: "corrective-action", label: "Corrective Action" },
  { key: "not-yet-evaluated", label: "Not Yet Evaluated" },
];

export const REPORTING_PERIOD_OPTIONS = [
  { key: "fy2026", label: "FY2026" },
  { key: "fy2025", label: "FY2025" },
  { key: "custom", label: "Custom range (coming soon)" },
];

export const CITY_OPTIONS = [
  { key: "columbus", label: "Columbus" },
  { key: "dublin", label: "Dublin" },
  { key: "westerville", label: "Westerville" },
  { key: "hilliard", label: "Hilliard" },
  { key: "gahanna", label: "Gahanna" },
  { key: "bexley", label: "Bexley" },
  { key: "upper-arlington", label: "Upper Arlington" },
  { key: "whitehall", label: "Whitehall" },
];

export const MAP_VIEW_MODES = [
  { key: "programs", label: "Programs" },
  { key: "funding", label: "Funding" },
  { key: "outcomes", label: "Outcomes" },
  { key: "evidence", label: "Evidence" },
];

export const MAP_MODE_LEGENDS = {
  programs: [
    { key: "active", label: "Active", tone: "blue" },
    { key: "verified", label: "Verified", tone: "green" },
    { key: "open-exception", label: "Open Exception", tone: "amber" },
  ],
  funding: [
    { key: "lower", label: "Lower funding", tone: "blue-light" },
    { key: "higher", label: "Higher funding", tone: "blue-dark" },
  ],
  outcomes: [
    { key: "below", label: "Below target", tone: "blue-light" },
    { key: "on", label: "On target", tone: "blue" },
    { key: "above", label: "Above target", tone: "green" },
  ],
  evidence: [
    { key: "verified", label: "Verified", tone: "green" },
    { key: "partial", label: "Partial", tone: "blue" },
    { key: "pending", label: "Pending", tone: "amber" },
    { key: "missing", label: "Missing", tone: "red" },
  ],
};

// One marker per county — the same six counties as the County Quick
// List, so a map cluster and its quick-list row always refer to the
// same place. Only Franklin County has a real County Detail page;
// the rest carry small illustrative metrics of their own so the
// Selected Geography Panel has something honest to show for any of
// them, without implying a working detail page exists yet.
export const GEO_COUNTIES = [
  {
    key: "franklin-county",
    name: "Franklin County",
    x: 52,
    y: 56,
    clusterCount: 48,
    fundingIntensity: "high",
    outcomePerformance: "on",
    evidenceStatus: "verified",
    programsStatus: "active",
    hasDetailPage: true,
    metrics: {
      activePrograms: franklin.metrics.activePrograms,
      totalFunding: franklin.metrics.totalFunding,
      providers: franklin.metrics.providers,
      verifiedOutcomes: franklin.metrics.verifiedOutcomes,
      openExceptions: franklin.metrics.openExceptions,
    },
  },
  {
    key: "delaware-county",
    name: "Delaware County",
    x: 50,
    y: 20,
    clusterCount: 12,
    fundingIntensity: "mid",
    outcomePerformance: "above",
    evidenceStatus: "partial",
    programsStatus: "verified",
    hasDetailPage: false,
    metrics: { activePrograms: "36", totalFunding: "$52M", providers: "44", verifiedOutcomes: "81%", openExceptions: "1" },
  },
  {
    key: "licking-county",
    name: "Licking County",
    x: 80,
    y: 40,
    clusterCount: 23,
    fundingIntensity: "mid",
    outcomePerformance: "on",
    evidenceStatus: "verified",
    programsStatus: "active",
    hasDetailPage: false,
    metrics: { activePrograms: "58", totalFunding: "$74M", providers: "61", verifiedOutcomes: "75%", openExceptions: "3" },
  },
  {
    key: "fairfield-county",
    name: "Fairfield County",
    x: 62,
    y: 82,
    clusterCount: 8,
    fundingIntensity: "low",
    outcomePerformance: "below",
    evidenceStatus: "pending",
    programsStatus: "open-exception",
    hasDetailPage: false,
    metrics: { activePrograms: "27", totalFunding: "$31M", providers: "29", verifiedOutcomes: "62%", openExceptions: "2" },
  },
  {
    key: "pickaway-county",
    name: "Pickaway County",
    x: 42,
    y: 84,
    clusterCount: 14,
    fundingIntensity: "low",
    outcomePerformance: "on",
    evidenceStatus: "missing",
    programsStatus: "open-exception",
    hasDetailPage: false,
    metrics: { activePrograms: "19", totalFunding: "$22M", providers: "21", verifiedOutcomes: "68%", openExceptions: "4" },
  },
  {
    key: "madison-county",
    name: "Madison County",
    x: 18,
    y: 54,
    clusterCount: 9,
    fundingIntensity: "low",
    outcomePerformance: "above",
    evidenceStatus: "partial",
    programsStatus: "verified",
    hasDetailPage: false,
    metrics: { activePrograms: "15", totalFunding: "$16M", providers: "17", verifiedOutcomes: "79%", openExceptions: "0" },
  },
];

export const RESULTS_TOTAL_COUNT = 24;

// "programId"/"providerId" values that match ids already built in
// programDetailMockData.js / providerDetailMockData.js get a REAL
// "Explore" link; the rest render an inert "Not yet available"
// placeholder rather than a dead link, same convention used on
// County Detail's Programs/Providers tabs.
export const GEO_RESULTS = [
  {
    key: "summer-stem-initiative",
    type: "program",
    name: "Summer STEM Initiative",
    category: "Education",
    countyKey: "franklin-county",
    countyLabel: "Franklin County",
    status: "verified",
    funding: "$4.2M",
    programId: "summer-stem-initiative",
  },
  {
    key: "community-future-network",
    type: "provider",
    name: "Community Future Network",
    category: "Nonprofit Provider",
    countyKey: "franklin-county",
    countyLabel: "Franklin County",
    status: "verified",
    funding: "$9.3M",
    providerId: "community-future-network",
  },
  {
    key: "clean-energy-workforce-training",
    type: "program",
    name: "Clean Energy Workforce Training",
    category: "Workforce Development",
    countyKey: "franklin-county",
    countyLabel: "Franklin County",
    status: "verified",
    funding: "$5.1M",
    programId: "clean-energy-workforce-training",
  },
  {
    key: "delaware-youth-mentoring",
    type: "program",
    name: "Delaware County Youth Mentoring",
    category: "Community Development",
    countyKey: "delaware-county",
    countyLabel: "Delaware County",
    status: "on-track",
    funding: "$1.8M",
  },
  {
    key: "licking-health-outreach",
    type: "program",
    name: "Licking County Health Outreach",
    category: "Health",
    countyKey: "licking-county",
    countyLabel: "Licking County",
    status: "verified",
    funding: "$2.4M",
  },
  {
    key: "fairfield-housing-collaborative",
    type: "provider",
    name: "Fairfield Housing Collaborative",
    category: "Nonprofit Provider",
    countyKey: "fairfield-county",
    countyLabel: "Fairfield County",
    status: "evidence-pending",
    funding: "$3.1M",
  },
  {
    key: "pickaway-workforce-alliance",
    type: "provider",
    name: "Pickaway Workforce Alliance",
    category: "Nonprofit Provider",
    countyKey: "pickaway-county",
    countyLabel: "Pickaway County",
    status: "open-exception",
    funding: "$1.2M",
  },
  {
    key: "madison-family-services",
    type: "program",
    name: "Madison County Family Services",
    category: "Health",
    countyKey: "madison-county",
    countyLabel: "Madison County",
    status: "verified",
    funding: "$0.9M",
  },
];

export const GEO_ABOUT_DATA = {
  sourceAuthority: "Ohio county Job and Family Services agencies / CivicSure Public Disclosure (demo)",
  geographicCoverage: "Central Ohio counties (demo subset) — Franklin, Delaware, Licking, Fairfield, Pickaway, and Madison.",
  reportingPeriod: "FY2026 (Jul 2025 – Jun 2026)",
  lastSourceUpdate: "2026-08-01",
  evaluationDate: "2026-08-15",
  evidenceCoverage: "Partial — independent sampling across counties, not a full-population review.",
  limitations:
    "This is demo data only. Every figure, marker, and cluster on this page is illustrative and does not represent real funding, outcomes, or compliance activity for any real jurisdiction.",
  methodology:
    "In production, CivicSure geography figures are aggregated from county and provider-level self-reporting reconciled against independent verification records under CivicSure/GPA authority — not implemented in this page frame.",
  dataDictionary:
    "\"Verified\" means an independent evidence sample confirmed the reported figure. \"Evidence Pending\" means reported but not yet independently confirmed. \"Open Exception\" means a reporting or compliance gap is still unresolved.",
};
