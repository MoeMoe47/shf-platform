// apps/shf-web/src/pages/civicsure/explorer/programDetailMockData.js
//
// DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA.
//
// Static view-model fixtures for the CivicSure Program Detail page
// FRAME (visual/UI build only — see docs/ui/CIVICSURE_EXPLORER_FRAME.md
// and docs/ui/CIVICSURE_PROGRAM_DETAIL_FRAME.md). Nothing here is
// wired to GPA data models, the Truth Spine, Evidence authority,
// Metric Registry, Public Disclosure, or any other CivicSure
// assurance system. Every number, name, and status below is a
// placeholder chosen to reproduce the approved mock's layout — none
// of it is a real CivicSure fact. Do not import this file from
// anything outside the Explorer/Program Detail page frames, and do
// not let it drift into real reporting/assurance code paths.
import { PROGRAM_RESULTS } from "./civicsureExplorerMockData.js";

export const PROGRAM_DETAIL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "money", label: "Money" },
  { key: "delivery", label: "Delivery" },
  { key: "outcomes", label: "Outcomes" },
  { key: "evidence", label: "Evidence" },
  { key: "providers", label: "Providers" },
  { key: "timeline", label: "Timeline" },
];

// Human-plain-English labels for what each non-Overview tab will
// eventually show, used by the placeholder panel so the frame reads
// as an honest "not built yet" rather than a dead click.
export const PROGRAM_DETAIL_TAB_PREVIEWS = {
  money: "a full funding breakdown by source, obligations, and spend-down over time",
  delivery: "what was actually delivered — sites, sessions, caseloads, and provider activity",
  outcomes: "verified outcome measures and how this program compares to its targets",
  evidence: "the underlying evidence records and independent samples reviewed for this program",
  providers: "every provider delivering this program, with their own assurance status",
  timeline: "a chronological record of funding, delivery, and reporting events for this program",
};

const PROGRAM_DETAIL_EXTRAS = {
  "summer-stem-initiative": {
    programIdLabel: "PRG-2026-0114",
    period: "Jun 2026 – Aug 2026",
    heroIcon: "book",
    whatIsThis:
      "Summer STEM Initiative provides hands-on science, technology, engineering, and math learning for underserved youth across Franklin County, delivered through six-week summer sessions at community and school sites.",
    whoBenefits:
      "Students in grades 6–12 from households that qualify for free or reduced lunch, with priority enrollment for youth in Franklin County Job and Family Services case management.",
    whoRuns: "Franklin County Department of Job and Family Services, in partnership with three community-based education providers.",
    metrics: { totalFunding: "$4.2M", spentToDate: "$2.9M", verifiedOutcomes: "1,240", openExceptions: "1" },
    assuranceChecks: [
      { key: "funding", label: "Funding disbursed on schedule", state: "verified" },
      { key: "delivery", label: "Provider delivery reports submitted", state: "verified" },
      { key: "outcomes", label: "Outcomes data reconciled", state: "verified" },
      { key: "evidence", label: "Independent evidence sample reviewed", state: "verified" },
      { key: "exceptions", label: "Open exceptions reviewed", state: "warning", note: "1 open" },
    ],
  },
  "supportive-housing-program": {
    programIdLabel: "PRG-2026-0087",
    period: "Jan 2026 – Dec 2026",
    heroIcon: "home",
    whatIsThis:
      "Supportive Housing Program funds permanent, service-enriched housing units for individuals and families experiencing homelessness in Franklin County, pairing stable housing with case management and health services.",
    whoBenefits: "Individuals and families experiencing chronic homelessness, referred through the county's coordinated entry system.",
    whoRuns: "Franklin County Department of Job and Family Services, in partnership with two supportive housing providers.",
    metrics: { totalFunding: "$18.6M", spentToDate: "$11.3M", verifiedOutcomes: "612", openExceptions: "0" },
    assuranceChecks: [
      { key: "funding", label: "Funding disbursed on schedule", state: "verified" },
      { key: "delivery", label: "Provider delivery reports submitted", state: "verified" },
      { key: "outcomes", label: "Outcomes data reconciled", state: "verified" },
      { key: "evidence", label: "Independent evidence sample reviewed", state: "verified" },
      { key: "exceptions", label: "Open exceptions reviewed", state: "verified", note: "0 open" },
    ],
  },
  "community-mental-health-access": {
    programIdLabel: "PRG-2026-0142",
    period: "Mar 2026 – Feb 2027",
    heroIcon: "userCheck",
    whatIsThis:
      "Community Mental Health Access expands outpatient mental health services through community partnerships, reducing wait times and closing coverage gaps in underserved parts of the county.",
    whoBenefits: "County residents without existing mental health coverage, including uninsured and underinsured adults and youth.",
    whoRuns: "Franklin County Department of Job and Family Services, in partnership with four community mental health providers.",
    metrics: { totalFunding: "$7.8M", spentToDate: "$4.1M", verifiedOutcomes: "938", openExceptions: "2" },
    assuranceChecks: [
      { key: "funding", label: "Funding disbursed on schedule", state: "verified" },
      { key: "delivery", label: "Provider delivery reports submitted", state: "warning", note: "1 provider late" },
      { key: "outcomes", label: "Outcomes data reconciled", state: "verified" },
      { key: "evidence", label: "Independent evidence sample reviewed", state: "verified" },
      { key: "exceptions", label: "Open exceptions reviewed", state: "warning", note: "2 open" },
    ],
  },
  "clean-energy-workforce-training": {
    programIdLabel: "PRG-2026-0161",
    period: "Sep 2025 – Aug 2026",
    heroIcon: "building",
    whatIsThis:
      "Clean Energy Workforce Training provides certification-track training for clean energy careers, delivered in partnership with local employers to connect graduates directly to open positions.",
    whoBenefits: "Adult jobseekers and underemployed workers in Franklin County, with priority for participants referred through workforce development partners.",
    whoRuns: "Franklin County Department of Job and Family Services, in partnership with a regional workforce training provider and local employers.",
    metrics: { totalFunding: "$5.1M", spentToDate: "$3.6M", verifiedOutcomes: "441", openExceptions: "0" },
    assuranceChecks: [
      { key: "funding", label: "Funding disbursed on schedule", state: "verified" },
      { key: "delivery", label: "Provider delivery reports submitted", state: "verified" },
      { key: "outcomes", label: "Outcomes data reconciled", state: "verified" },
      { key: "evidence", label: "Independent evidence sample reviewed", state: "verified" },
      { key: "exceptions", label: "Open exceptions reviewed", state: "verified", note: "0 open" },
    ],
  },
};

// Merges the shared Explorer result fields (name/status/county/
// category/description/tags) with the extended detail-page fields
// above. Returns null for an unknown id so the page can render a
// plain-English "not found" state instead of guessing.
export function getProgramDetail(programId) {
  const base = PROGRAM_RESULTS.find((p) => p.id === programId);
  const extra = PROGRAM_DETAIL_EXTRAS[programId];
  if (!base || !extra) return null;
  return { ...base, ...extra };
}
