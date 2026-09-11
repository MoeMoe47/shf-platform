// apps/shf-web/src/pages/civicsure/explorer/agencyDetailMockData.js
//
// DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA.
//
// Static view-model fixtures for the CivicSure Agency / Department
// Detail page FRAME (visual/UI build only — see
// docs/ui/CIVICSURE_AGENCY_DETAIL_FRAME.md). Nothing here is wired to
// GPA data models, the Truth Spine, Evidence authority, Metric
// Registry, Public Disclosure, Shared Reporting, or any other
// CivicSure assurance system. Every number, name, and status below is
// a placeholder chosen to reproduce the approved mock's layout — none
// of it is a real Ohio agency fact. Do not import this file from
// anything outside the Explorer/Agency Detail page frame, and do not
// let it drift into real reporting/assurance code paths.
//
// This agency intentionally is the same "Ohio Department of Workforce
// Development" that fundingDetailMockData.js's "ohio-workforce-
// innovation-fund" record already names as its administering agency —
// so this page's Funding tab links to that real, already-built
// Funding Detail page rather than a placeholder, and its Programs/
// Providers tabs reuse the same three program branches (Clean Energy
// Workforce Training / Youth Career Launch / Infrastructure Skills
// Initiative) and the same three providers, keeping every number and
// name consistent across pages instead of inventing a parallel set.
import { FINANCIAL_TERM_DEFINITIONS } from "./fundingDetailMockData.js";

export { FINANCIAL_TERM_DEFINITIONS };

export const AGENCY_DETAIL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "programs", label: "Programs" },
  { key: "funding", label: "Funding" },
  { key: "providers", label: "Providers" },
  { key: "outcomes", label: "Outcomes" },
  { key: "evidence", label: "Evidence" },
  { key: "reports", label: "Reports" },
];

const AGENCY_DETAILS_BY_ID = {
  "ohio-department-workforce-development": {
    id: "ohio-department-workforce-development",
    name: "Ohio Department of Workforce Development",
    agencyTypeLabel: "State Agency",
    jurisdictionLabel: "Ohio",
    agencyIdLabel: "ODW-001",
    description:
      "Oversees workforce development programs, funding, provider relationships, and performance initiatives across Ohio.",

    metrics: {
      activePrograms: "42",
      fundingAdministered: "$684M",
      providers: "118",
      verifiedOutcomes: "81%",
      openExceptions: "9",
    },

    overview: {
      agencyType: "State Agency",
      jurisdiction: "Ohio",
      headquarters: "Columbus, OH",
      established: "2012",
      reportingPeriod: "FY2026",
      mission: "Expand workforce access, improve employer alignment, and support evidence-backed career pathways across Ohio.",
      responsibilities: [
        {
          key: "workforce-programs",
          label: "Workforce Programs",
          description: "Designs and runs training programs that help people build job skills and find work.",
        },
        {
          key: "grant-administration",
          label: "Grant Administration",
          description: "Manages the money the state and federal government set aside for workforce programs.",
        },
        {
          key: "provider-oversight",
          label: "Provider Oversight",
          description: "Checks in on the organizations delivering programs to make sure they're doing what they promised.",
        },
        {
          key: "employer-partnerships",
          label: "Employer Partnerships",
          description: "Builds relationships with local employers so training leads to real job openings.",
        },
        {
          key: "outcome-monitoring",
          label: "Outcome Monitoring",
          description: "Tracks whether programs actually lead to credentials, interviews, and jobs.",
        },
        {
          key: "public-reporting",
          label: "Public Reporting",
          description: "Publishes what it funds, what gets delivered, and what results are verified.",
        },
      ],
    },

    dataQualityNotice: {
      heading: "Data Quality Notice",
      items: [
        "Four provider outcome submissions remain under review for the current reporting period.",
        "$1.2M in expenditure detail remains pending final reconciliation.",
      ],
    },

    assurance: {
      checks: [
        { key: "program-reporting", label: "Program reporting current", state: "verified" },
        { key: "funding-reconciliation", label: "Funding reconciliation current", state: "verified" },
        { key: "provider-submissions", label: "Provider submissions received", state: "verified" },
        { key: "public-reports", label: "Required public reports available", state: "verified" },
        { key: "open-exceptions", label: "Open exceptions", state: "open-exception", note: "9 open" },
        { key: "pending-evidence", label: "Outcome measures pending evidence", state: "evidence-pending", note: "4 pending" },
      ],
      explanation:
        "This agency is marked in good standing with two open items: 9 open exceptions across its funded programs and providers, and 4 outcome measures still awaiting independent evidence review. Neither item changes the agency's reported funding totals — they reflect verification still in progress, not missing money or failed programs.",
    },

    programsShownNote: "Showing 3 of 42 active programs in this demo frame.",
    programs: [
      {
        key: "clean-energy",
        name: "Clean Energy Workforce Training",
        category: "Workforce Development",
        county: "Franklin County",
        funding: "$4.0M",
        providerCount: "1",
        assuranceStatus: "verified",
        outcomeSummary: "356 verified placements",
        programId: "clean-energy-workforce-training",
      },
      {
        key: "youth-career",
        name: "Youth Career Launch",
        category: "Workforce Development",
        county: "Licking County",
        funding: "$2.3M",
        providerCount: "1",
        assuranceStatus: "verified",
        outcomeSummary: "126 verified placements",
        programId: null,
      },
      {
        key: "infra-skills",
        name: "Infrastructure Skills Initiative",
        category: "Workforce Development",
        county: "Fairfield County",
        funding: "$1.5M",
        providerCount: "1",
        assuranceStatus: "open-exception",
        outcomeSummary: "71 verified placements",
        programId: null,
      },
    ],

    providersShownNote: "Showing 3 of 118 providers in this demo frame.",
    providers: [
      {
        key: "community-future-network",
        name: "Community Future Network",
        orgType: "Nonprofit Provider",
        activePrograms: "1",
        contracted: "$3.25M",
        deliveryStatus: "527 of 600 participants served",
        evidenceCoverage: "94%",
        assuranceStatus: "on-track",
        providerId: "community-future-network",
      },
      {
        key: "licking-valley",
        name: "Licking Valley Career Partners",
        orgType: "Nonprofit Provider",
        activePrograms: "1",
        contracted: "$1.9M",
        deliveryStatus: "198 of 240 participants served",
        evidenceCoverage: "88%",
        assuranceStatus: "on-track",
        providerId: null,
      },
      {
        key: "fairfield-trades",
        name: "Fairfield Trades Alliance",
        orgType: "Nonprofit Provider",
        activePrograms: "1",
        contracted: "$1.1M",
        deliveryStatus: "112 of 150 participants served",
        evidenceCoverage: "76%",
        assuranceStatus: "open-exception",
        providerId: null,
      },
    ],

    funding: {
      totalAdministered: "$684M",
      authorized: "$720M",
      awarded: "$684M",
      obligated: "$611M",
      expended: "$498M",
      remaining: "$113M",
      reportingPeriod: "FY2026 (Jul 2025 – Jun 2026)",
      fundingDetailId: "ohio-workforce-innovation-fund",
      topSources: [
        { key: "state-grf", label: "State General Revenue Fund", amount: "$280M" },
        { key: "federal-workforce", label: "Federal Workforce Grants", amount: "$214M" },
        { key: "special-initiatives", label: "Special Workforce Initiatives", amount: "$118M" },
        { key: "local-matching", label: "Local/Matching Funds", amount: "$72M" },
      ],
      byProgram: [
        { key: "clean-energy", label: "Clean Energy Workforce Training", amount: "$4.0M" },
        { key: "youth-career", label: "Youth Career Launch", amount: "$2.3M" },
        { key: "infra-skills", label: "Infrastructure Skills Initiative", amount: "$1.5M" },
        { key: "other", label: "All other active programs", amount: "$676.2M" },
      ],
      byCounty: [
        { key: "franklin", label: "Franklin County", amount: "$196M" },
        { key: "cuyahoga", label: "Cuyahoga County", amount: "$142M" },
        { key: "hamilton", label: "Hamilton County", amount: "$118M" },
        { key: "montgomery", label: "Montgomery County", amount: "$79M" },
        { key: "other", label: "Other Ohio counties", amount: "$149M" },
      ],
      lineage: [
        { key: "source", label: "Federal / State Source", icon: "bank" },
        { key: "agency", label: "Agency", icon: "building" },
        { key: "program", label: "Program", icon: "grid" },
        { key: "provider", label: "Provider", icon: "people" },
        { key: "delivery", label: "Delivery", icon: "box" },
        { key: "evidence", label: "Evidence", icon: "userCheck" },
        { key: "outcome", label: "Outcome", icon: "shieldCheck", tone: "green" },
      ],
    },

    geography: {
      distribution: [
        { key: "franklin", label: "Franklin County", count: "12 programs" },
        { key: "cuyahoga", label: "Cuyahoga County", count: "8 programs" },
        { key: "hamilton", label: "Hamilton County", count: "7 programs" },
        { key: "montgomery", label: "Montgomery County", count: "5 programs" },
        { key: "other", label: "Other counties", count: "10 programs" },
      ],
    },

    outcomes: [
      {
        key: "training-completion",
        name: "Training Completion",
        target: "80%",
        actual: "83%",
        denominator: "6,140 participants across all agency programs",
        period: "FY2026 (through Q3)",
        evidenceCoverage: "90% of participants",
        verification: "verified",
      },
      {
        key: "credential-attainment",
        name: "Credential Attainment",
        target: "65%",
        actual: "63%",
        denominator: "6,140 participants across all agency programs",
        period: "FY2026 (through Q3)",
        evidenceCoverage: "88% of participants",
        verification: "on-track",
      },
      {
        key: "employer-placement",
        name: "Employer Placement",
        target: "50%",
        actual: "47%",
        denominator: "6,140 participants across all agency programs",
        period: "FY2026 (through Q3)",
        evidenceCoverage: "92% of participants",
        verification: "verified",
      },
      {
        key: "employer-satisfaction",
        name: "Employer Satisfaction",
        target: "75%",
        actual: "78%",
        denominator: "412 participating employers surveyed",
        period: "FY2026 (through Q3)",
        evidenceCoverage: "81% of employers",
        verification: "verified",
      },
      {
        key: "provider-compliance",
        name: "Provider Reporting Compliance",
        target: "95%",
        actual: "91%",
        denominator: "118 contracted providers",
        period: "FY2026 (through Q3)",
        evidenceCoverage: "91% of providers",
        verification: "evidence-pending",
      },
    ],

    evidence: {
      verified: "2,614 records",
      pendingReview: "318 records",
      missing: "142 records",
      notPublic: "486 records",
      lastEvaluationDate: "2026-08-15",
      limitations:
        "Evidence coverage reflects independent sampling across programs and providers, not a full-population review of every participant record.",
      dataQualityNotices: [
        "4 provider outcome submissions remain under review for the current reporting period.",
        "1 county-level funding reconciliation is pending final review.",
        "142 evidence records are outstanding across 6 programs and are not yet scheduled for review.",
      ],
    },

    reports: [
      {
        key: "assurance-report",
        name: "FY2026 Agency Assurance Report",
        status: "Final",
        version: "R3",
        reportingPeriod: "FY2026",
      },
      {
        key: "portfolio-report",
        name: "Workforce Program Portfolio Report",
        status: "Final",
        version: "R2",
        reportingPeriod: "FY2026",
      },
      {
        key: "delivery-summary",
        name: "Provider Delivery Summary",
        status: "Final",
        version: "R1",
        reportingPeriod: "FY2026",
      },
    ],

    aboutData: {
      sourceAuthority: "Ohio Department of Workforce Development / CivicSure Public Disclosure (demo)",
      agencyAuthority: "Ohio Revised Code, Chapter 6301 (demo)",
      reportingPeriod: "FY2026 (Jul 2025 – Jun 2026)",
      lastSourceUpdate: "2026-08-01",
      evaluationDate: "2026-08-15",
      evidenceCoverage: "Partial — independent sampling across programs and providers, not a full-population review.",
      reconciliationStatus: "In progress — $1.2M of provider-reported expenditure is not yet independently reconciled.",
      limitations:
        "This is demo data only. Every figure, program, and status on this page is illustrative and does not represent real funding, delivery, or outcome activity for any real agency.",
      methodology:
        "In production, CivicSure agency figures are aggregated from program, provider, and funding-level self-reporting reconciled against independent verification records under CivicSure/GPA authority — not implemented in this page frame.",
      dataDictionary:
        "\"Verified\" means an independent evidence sample confirmed the reported figure. \"On Track\" means progressing as expected but not yet fully verified. \"Open Exception\" means a reporting or compliance gap is still unresolved.",
    },
  },
};

// Returns null for an unknown id so the page can render a plain-
// English "not found" state instead of guessing.
export function getAgencyDetail(agencyId) {
  return AGENCY_DETAILS_BY_ID[agencyId] || null;
}
