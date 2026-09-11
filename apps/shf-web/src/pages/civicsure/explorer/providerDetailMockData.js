// apps/shf-web/src/pages/civicsure/explorer/providerDetailMockData.js
//
// DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA.
//
// Static view-model fixtures for the CivicSure Provider Detail page
// FRAME (visual/UI build only — see
// docs/ui/CIVICSURE_PROVIDER_DETAIL_FRAME.md). Nothing here is wired
// to GPA data models, the Truth Spine, Evidence authority, Metric
// Registry, Public Disclosure, or any other CivicSure assurance
// system. Every number, name, and status below is a placeholder
// chosen to reproduce the approved mock's layout — none of it is a
// real CivicSure fact, and none of it should be read as a real
// finding about any real organization. Do not import this file from
// anything outside the Explorer/Provider Detail page frames, and do
// not let it drift into real reporting/assurance code paths.
//
// "programs[].programId" values intentionally reuse ids from
// civicsureExplorerMockData.js's PROGRAM_RESULTS so the Programs tab's
// "Explore Program" action is a real, working link to the already
// built Program Detail frame (#/explorer/programs/:programId) rather
// than a dead placeholder.

export const PROVIDER_DETAIL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "programs", label: "Programs" },
  { key: "funding", label: "Funding" },
  { key: "outcomes", label: "Outcomes" },
  { key: "evidence", label: "Evidence" },
  { key: "compliance", label: "Compliance" },
];

// Human-plain-English labels for what a wider Programs listing would
// eventually show — used by the "showing N of M" note so the frame is
// honest about being a sample, not the full roster.
const PROVIDER_DETAILS_BY_ID = {
  "community-future-network": {
    id: "community-future-network",
    name: "Community Future Network",
    status: "Verified",
    providerType: "Nonprofit Provider",
    providerIdLabel: "CFN-001",
    headquarters: "Columbus, OH",
    description:
      "A community-focused nonprofit dedicated to expanding educational opportunities and workforce readiness for underserved youth.",
    heroIcon: "building",

    orgType: "Nonprofit 501(c)(3)",
    serviceAreas: "Franklin County",
    website: "www.communityfuturenetwork.org",
    yearEstablished: "2010",
    mission: "To create opportunities for youth and families through education, mentorship, and workforce development.",

    metrics: {
      activePrograms: "12",
      totalFunding: "$18.4M",
      peopleServed: "4,320",
      verifiedOutcomes: "84%",
    },

    assurance: {
      status: "Verified",
      summary: "Provider meets all current reporting and compliance requirements.",
    },

    programs: [
      {
        programId: "summer-stem-initiative",
        name: "Summer STEM Initiative",
        category: "Education",
        county: "Franklin County",
        funding: "$4.2M",
        status: "Active",
        verifiedOutcomeSummary: "1,240 verified outcomes",
      },
      {
        programId: "clean-energy-workforce-training",
        name: "Clean Energy Workforce Training",
        category: "Workforce Development",
        county: "Franklin County",
        funding: "$5.1M",
        status: "Active",
        verifiedOutcomeSummary: "441 verified outcomes",
      },
      {
        programId: "supportive-housing-program",
        name: "Supportive Housing Program",
        category: "Housing",
        county: "Franklin County",
        funding: "$18.6M",
        status: "Active",
        verifiedOutcomeSummary: "612 verified outcomes",
      },
      {
        programId: "community-mental-health-access",
        name: "Community Mental Health Access",
        category: "Health",
        county: "Franklin County",
        funding: "$7.8M",
        status: "Active",
        verifiedOutcomeSummary: "938 verified outcomes",
      },
    ],
    programsShownNote: "Showing 4 of 12 active programs in this demo frame.",

    funding: {
      totalReceived: "$18.4M",
      activeAwards: "6",
      obligated: "$16.9M",
      expended: "$11.2M",
      reportingPeriod: "FY2026 (Jul 2025 – Jun 2026)",
      sources: [
        { key: "county", label: "Franklin County Job and Family Services", amount: "$9.1M" },
        { key: "state", label: "Ohio Department of Education", amount: "$5.3M" },
        { key: "federal", label: "Federal Workforce Innovation Grant", amount: "$4.0M" },
      ],
      allocations: [
        { key: "stem", label: "Summer STEM Initiative", amount: "$4.2M" },
        { key: "clean-energy", label: "Clean Energy Workforce Training", amount: "$5.1M" },
        { key: "other", label: "All other active programs", amount: "$9.1M" },
      ],
    },

    outcomes: [
      {
        key: "completion",
        name: "Program Completion Rate",
        target: "80%",
        actual: "86%",
        period: "FY2026",
        evidenceCoverage: "92% of participants",
        verification: "verified",
      },
      {
        key: "placement",
        name: "Job Placement Rate",
        target: "60%",
        actual: "58%",
        period: "FY2026",
        evidenceCoverage: "78% of participants",
        verification: "pending-review",
      },
      {
        key: "credential",
        name: "Credential Attainment",
        target: "70%",
        actual: "74%",
        period: "FY2026",
        evidenceCoverage: "85% of participants",
        verification: "verified",
      },
    ],

    evidence: [
      {
        key: "site-visit",
        type: "Independent Site Visit",
        relatedProgram: "Summer STEM Initiative",
        period: "Q2 FY2026",
        verification: "verified",
        lastUpdated: "2026-06-14",
        availability: "Public Summary Available",
      },
      {
        key: "outcome-sample",
        type: "Participant Outcome Sample",
        relatedProgram: "Clean Energy Workforce Training",
        period: "Q3 FY2026",
        verification: "verified",
        lastUpdated: "2026-07-02",
        availability: "Public Summary Available",
      },
      {
        key: "financial-recon",
        type: "Financial Reconciliation Record",
        relatedProgram: "All Programs",
        period: "FY2026",
        verification: "pending-review",
        lastUpdated: "2026-08-01",
        availability: "Restricted (Operator Only)",
      },
    ],

    compliance: {
      reportingCurrent: { label: "Reporting Current", state: "current" },
      reconciliation: { label: "Reconciliation Status", state: "verified", note: "Reconciled through Q3 FY2026" },
      openExceptions: [
        { key: "ex-late-report", label: "Late Q3 delivery report — Clean Energy Workforce Training", state: "open-exception" },
      ],
      correctiveActions: [
        { key: "ca-cadence", label: "Delivery reporting cadence corrective action plan", state: "corrective-action" },
      ],
      auditFindings: { label: "Most Recent Audit Findings", state: "verified", note: "No material findings — FY2025 annual review" },
      documentation: { label: "Documentation Status", state: "current" },
    },

    aboutData: {
      sourceAuthority: "Franklin County Job and Family Services / CivicSure Public Disclosure (demo)",
      reportingPeriod: "FY2026 (Jul 2025 – Jun 2026)",
      lastSourceUpdate: "2026-08-01",
      evaluationDate: "2026-08-15",
      evidenceCoverage: "Partial — independent sampling, not a full-population review.",
      limitations:
        "This is demo data only. Every figure on this page is illustrative and does not represent real funding, outcomes, or compliance activity for any real organization.",
      methodology:
        "In production, CivicSure figures are derived from provider self-reporting reconciled against independent verification records under CivicSure/GPA authority — not implemented in this page frame.",
    },
  },
};

// Merges nothing beyond the record itself (unlike programDetailMockData.js,
// providers aren't split across a shared list + per-page extras) —
// returns null for an unknown id so the page can render a plain-
// English "not found" state instead of guessing.
export function getProviderDetail(providerId) {
  return PROVIDER_DETAILS_BY_ID[providerId] || null;
}
