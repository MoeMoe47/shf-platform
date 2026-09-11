// apps/shf-web/src/pages/civicsure/explorer/countyDetailMockData.js
//
// DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA.
//
// Static view-model fixtures for the CivicSure County Detail page
// FRAME (visual/UI build only — see
// docs/ui/CIVICSURE_COUNTY_DETAIL_FRAME.md). Nothing here is wired to
// GPA data models, the Truth Spine, Evidence authority, Metric
// Registry, Public Disclosure, or any other CivicSure assurance
// system. Every number, name, and status below is a placeholder
// chosen to reproduce the approved mock's layout — none of it is a
// real CivicSure fact, and none of it should be read as a real
// finding about any real jurisdiction. Do not import this file from
// anything outside the Explorer/County Detail page frames, and do not
// let it drift into real reporting/assurance code paths.
//
// "programs[].programId" and "providers[].providerId" values that
// have a real demo detail page intentionally reuse ids already
// defined in civicsureExplorerMockData.js / programDetailMockData.js /
// providerDetailMockData.js, so the Programs/Providers tabs' "Explore"
// actions are real, working links rather than placeholders. Entries
// with no matching demo id (programId/providerId omitted) render as
// inert "not yet available" rows instead of dead links.

export const COUNTY_DETAIL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "programs", label: "Programs" },
  { key: "funding", label: "Funding" },
  { key: "providers", label: "Providers" },
  { key: "outcomes", label: "Outcomes" },
  { key: "evidence", label: "Evidence" },
];

const COUNTY_DETAILS_BY_ID = {
  "franklin-county": {
    id: "franklin-county",
    name: "Franklin County",
    state: "Ohio",
    fips: "39049",
    description: "Explore public programs, funding, providers, outcomes, and evidence across Franklin County.",

    metrics: {
      activePrograms: "248",
      totalFunding: "$428M",
      providers: "312",
      verifiedOutcomes: "76%",
      openExceptions: "14",
    },

    mapOverlayStats: [
      { key: "programs", label: "Active Programs", value: "248" },
      { key: "funding", label: "Total Funding", value: "$428M" },
      { key: "verified", label: "Verified Outcomes", value: "76%" },
      { key: "exceptions", label: "Open Exceptions", value: "14" },
    ],

    overview: {
      population: "1.34M",
      countySeat: "Columbus",
      region: "Central Ohio",
      reportingPeriod: "FY2026",
      programsTracked: "248",
      providersCount: "312",
      landscapeSummary:
        "Franklin County funds and oversees a broad portfolio of public programs across education, housing, health, workforce development, and community services.",
      categories: [
        { key: "education", label: "Education", count: 62 },
        { key: "health", label: "Health", count: 54 },
        { key: "housing", label: "Housing", count: 48 },
        { key: "workforce", label: "Workforce", count: 44 },
        { key: "community", label: "Community Development", count: 40 },
      ],
    },

    programsShownNote: "Showing 4 of 248 active programs in this demo frame.",
    programs: [
      {
        programId: "summer-stem-initiative",
        name: "Summer STEM Initiative",
        category: "Education",
        provider: "Community Future Network",
        funding: "$4.2M",
        assurance: "verified",
        evidence: "verified",
      },
      {
        programId: "clean-energy-workforce-training",
        name: "Clean Energy Workforce Training",
        category: "Workforce Development",
        provider: "Community Future Network",
        funding: "$5.1M",
        assurance: "verified",
        evidence: "verified",
      },
      {
        programId: "supportive-housing-program",
        name: "Supportive Housing Program",
        category: "Housing",
        provider: "Franklin Housing Partners",
        funding: "$18.6M",
        assurance: "verified",
        evidence: "pending-review",
      },
      {
        programId: "community-mental-health-access",
        name: "Community Mental Health Access",
        category: "Health",
        provider: "Central Ohio Behavioral Health Alliance",
        funding: "$7.8M",
        assurance: "open-exception",
        evidence: "verified",
      },
    ],

    funding: {
      totalAuthorized: "$460M",
      awarded: "$428M",
      obligated: "$402M",
      expended: "$318M",
      remaining: "$84M",
      reportingPeriod: "FY2026 (Jul 2025 – Jun 2026)",
      topSources: [
        { key: "state-education", label: "Ohio Department of Education", amount: "$118M" },
        { key: "federal-hhs", label: "Federal Health & Human Services Grants", amount: "$96M" },
        { key: "state-jfs", label: "Ohio Department of Job & Family Services", amount: "$84M" },
        { key: "county-general", label: "Franklin County General Fund", amount: "$71M" },
        { key: "federal-workforce", label: "Federal Workforce Innovation Grant", amount: "$59M" },
      ],
      byCategory: [
        { key: "education", label: "Education", amount: "$112M" },
        { key: "health", label: "Health", amount: "$98M" },
        { key: "housing", label: "Housing", amount: "$86M" },
        { key: "workforce", label: "Workforce", amount: "$74M" },
        { key: "community", label: "Community Development", amount: "$58M" },
      ],
      byProgram: [
        { key: "supportive-housing", label: "Supportive Housing Program", amount: "$18.6M" },
        { key: "clean-energy", label: "Clean Energy Workforce Training", amount: "$5.1M" },
        { key: "stem", label: "Summer STEM Initiative", amount: "$4.2M" },
        { key: "other", label: "All other active programs", amount: "$400.1M" },
      ],
      lineage: [
        { key: "funding-source", label: "Funding Source", icon: "bank" },
        { key: "county", label: "County", icon: "pin" },
        { key: "program", label: "Program", icon: "building" },
        { key: "provider", label: "Provider", icon: "people" },
        { key: "delivery", label: "Delivery", icon: "box" },
        { key: "evidence", label: "Evidence", icon: "userCheck" },
        { key: "outcome", label: "Outcome", icon: "shieldCheck", tone: "green" },
      ],
    },

    providersShownNote: "Showing 4 of 312 providers in this demo frame.",
    providers: [
      {
        providerId: "community-future-network",
        name: "Community Future Network",
        orgType: "Nonprofit Provider",
        activePrograms: "2",
        funding: "$9.3M",
        verifiedOutcomeSummary: "1,681 verified outcomes",
        assurance: "verified",
      },
      {
        name: "Franklin Housing Partners",
        orgType: "Nonprofit Provider",
        activePrograms: "3",
        funding: "$18.6M",
        verifiedOutcomeSummary: "612 verified outcomes",
        assurance: "verified",
      },
      {
        name: "Central Ohio Behavioral Health Alliance",
        orgType: "Nonprofit Provider",
        activePrograms: "4",
        funding: "$7.8M",
        verifiedOutcomeSummary: "938 verified outcomes",
        assurance: "open-exception",
      },
      {
        name: "Franklin County Job & Family Services",
        orgType: "Government Agency",
        activePrograms: "6",
        funding: "$22.4M",
        verifiedOutcomeSummary: "2,905 verified outcomes",
        assurance: "verified",
      },
    ],

    outcomes: [
      {
        key: "completion",
        name: "Program Completion Rate",
        target: "80%",
        actual: "84%",
        denominator: "18,420 participants",
        period: "FY2026",
        evidenceCoverage: "88% of participants",
        verification: "verified",
      },
      {
        key: "placement",
        name: "Job Placement Rate",
        target: "60%",
        actual: "57%",
        denominator: "6,210 participants",
        period: "FY2026",
        evidenceCoverage: "71% of participants",
        verification: "pending-review",
      },
      {
        key: "housing-stability",
        name: "Housing Stability at 12 Months",
        target: "75%",
        actual: "79%",
        denominator: "1,180 households",
        period: "FY2026",
        evidenceCoverage: "95% of households",
        verification: "verified",
      },
      {
        key: "credential",
        name: "Credential Attainment",
        target: "65%",
        actual: "68%",
        denominator: "3,340 participants",
        period: "FY2026",
        evidenceCoverage: "80% of participants",
        verification: "verified",
      },
    ],

    evidence: {
      verified: "1,842 records",
      pendingReview: "212 records",
      missing: "96 records",
      notPublic: "340 records",
      lastEvaluationDate: "2026-08-15",
      dataQualityNotices: [
        "3 providers have overdue delivery reports for Q3 FY2026.",
        "1 funding source reconciliation is pending final review.",
        "96 evidence records are outstanding across 14 programs and are not yet scheduled for review.",
      ],
    },

    assurance: {
      checks: [
        { key: "reporting", label: "Reporting coverage current", state: "verified" },
        { key: "reconciliation", label: "Funding reconciliation complete", state: "verified" },
        { key: "submissions", label: "Provider submissions current", state: "verified" },
        { key: "exceptions", label: "Open exceptions", state: "open-exception", note: "14 open" },
        { key: "pending-evidence", label: "Outcome measures pending evidence", state: "pending-review", note: "6 pending" },
      ],
    },

    aboutData: {
      sourceAuthority: "Franklin County Job and Family Services / CivicSure Public Disclosure (demo)",
      reportingPeriod: "FY2026 (Jul 2025 – Jun 2026)",
      lastSourceUpdate: "2026-08-01",
      evaluationDate: "2026-08-15",
      evidenceCoverage: "Partial — independent sampling across providers, not a full-population review.",
      limitations:
        "This is demo data only. Every figure on this page is illustrative and does not represent real funding, outcomes, or compliance activity for any real jurisdiction.",
      methodology:
        "In production, CivicSure county figures are aggregated from provider and program-level self-reporting reconciled against independent verification records under CivicSure/GPA authority — not implemented in this page frame.",
      dataDictionary:
        "\"Verified\" means an independent evidence sample confirmed the reported figure. \"Pending Review\" means reported but not yet independently confirmed. \"Open Exception\" means a reporting or compliance gap is still unresolved.",
    },
  },
};

// Returns null for an unknown id so the page can render a plain-
// English "not found" state instead of guessing.
export function getCountyDetail(countyId) {
  return COUNTY_DETAILS_BY_ID[countyId] || null;
}
