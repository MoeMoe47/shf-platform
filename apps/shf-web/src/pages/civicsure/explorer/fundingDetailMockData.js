// apps/shf-web/src/pages/civicsure/explorer/fundingDetailMockData.js
//
// DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA.
//
// Static view-model fixtures for the CivicSure Funding Detail /
// Follow the Money page FRAME (visual/UI build only — see
// docs/ui/CIVICSURE_FUNDING_DETAIL_FRAME.md). Nothing here is wired
// to GPA data models, the Truth Spine, Evidence authority, Metric
// Registry, Public Disclosure, Shared Reporting, or any other
// CivicSure assurance system. Every number, name, and status below is
// a placeholder chosen to reproduce the approved mock's layout — none
// of it is a real Ohio funding fact. Do not import this file from
// anything outside the Explorer/Funding Detail page frame, and do not
// let it drift into real reporting/assurance code paths.
//
// The "clean-energy" program branch intentionally reuses
// Community Future Network (providerId "community-future-network")
// and Clean Energy Workforce Training (programId
// "clean-energy-workforce-training") — both already-built demo
// detail pages, and already linked to each other in
// providerDetailMockData.js — so this page's Money Flow, Programs,
// and Providers tabs can link to real, working pages rather than
// placeholders. The other two program branches are fictional and
// intentionally have no matching demo id, so their "Explore" actions
// render as honest, inert placeholders.

export const FUNDING_DETAIL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "money-flow", label: "Money Flow" },
  { key: "programs", label: "Programs" },
  { key: "providers", label: "Providers" },
  { key: "delivery", label: "Delivery" },
  { key: "evidence", label: "Evidence" },
  { key: "outcomes", label: "Outcomes" },
  { key: "timeline", label: "Timeline" },
];

// Locked CivicSure UX principle: every accounting term gets a plain-
// English, always-visible explanation — never a hover-only tooltip.
export const FINANCIAL_TERM_DEFINITIONS = {
  authorized: "The total amount the law or budget allows to be spent — the outer limit, not a guarantee it will all be used.",
  awarded: "Money formally committed to this specific fund through an award decision, out of what was authorized.",
  obligated: "Money the government has legally committed to pay, even if all of it has not yet been spent.",
  expended: "Money that has actually been paid out so far.",
  remaining: "Money that has been obligated but not yet spent — still owed, not yet paid.",
};

const FUNDING_DETAILS_BY_ID = {
  "ohio-workforce-innovation-fund": {
    id: "ohio-workforce-innovation-fund",
    name: "Ohio Workforce Innovation Fund",
    status: "Active",
    fundingTypeLabel: "State Funding",
    reportingPeriodLabel: "FY2026",
    awardIdLabel: "OWIF-2026-001",
    description:
      "Public funding supporting workforce training, career pathways, and employer-connected programs across participating Ohio communities.",

    metrics: {
      authorized: "$25.0M",
      awarded: "$22.4M",
      obligated: "$18.8M",
      expended: "$14.6M",
      remainingObligated: "$3.8M",
    },

    overview: {
      fundingSource: "State of Ohio",
      fundingType: "Workforce Development",
      authorizationPeriod: "Jul 1, 2025 – Jun 30, 2027",
      reportingPeriod: "FY2026",
      geographicScope: "Ohio",
      administeringAgency: "Ohio Department of Workforce Development",
      purpose: "Support workforce training, career pathways, employer partnerships, and verified employment outcomes.",
      financialPosition: {
        authorized: "$25.0M",
        awarded: "$22.4M",
        obligated: "$18.8M",
        expended: "$14.6M",
        unawarded: "$2.6M",
        unspentObligated: "$4.2M",
      },
    },

    dataQualityNotice: {
      heading: "Data Quality Notice",
      items: [
        "$410,000 of provider expenditure detail remains under reconciliation for the current reporting period.",
        "Two provider evidence submissions remain pending review.",
      ],
    },

    assurance: {
      checks: [
        { key: "totals", label: "Award totals reconciled", state: "verified" },
        { key: "allocations", label: "Provider allocations accounted for", state: "verified" },
        { key: "reporting", label: "Required reporting received", state: "verified" },
        { key: "delivery-evidence", label: "Delivery evidence available", state: "verified" },
        { key: "pending-submissions", label: "Provider submissions pending review", state: "open-exception", note: "2 pending" },
        { key: "pending-reconciliation", label: "Expenditure detail pending reconciliation", state: "open-exception", note: "$410K pending" },
      ],
      explanation:
        "This funding is marked Active with two open items: two provider quarterly submissions have not yet completed review, and $410,000 of reported expenditure is still being reconciled against provider financial records. Neither item changes the award's authorized, awarded, or obligated totals — only the final expended breakdown for a subset of providers.",
    },

    moneyFlow: {
      fundingSource: {
        name: "State of Ohio",
        amount: "$25.0M authorized",
        detail: {
          name: "State of Ohio",
          amount: "$25.0M authorized",
          sourceAuthority: "Ohio General Assembly, FY2026–FY2027 biennial budget",
          reportingPeriod: "FY2026",
          status: "verified",
          explanation: "The state legislature authorized up to $25.0M for workforce innovation funding across the biennium.",
        },
      },
      award: {
        name: "Ohio Workforce Innovation Fund",
        amount: "$22.4M awarded",
        detail: {
          name: "Ohio Workforce Innovation Fund",
          amount: "$22.4M awarded",
          sourceAuthority: "Ohio Department of Workforce Development",
          reportingPeriod: "FY2026",
          status: "verified",
          explanation: "Of the $25.0M authorized, $22.4M has been formally awarded to this fund; the remaining $2.6M has not yet been awarded.",
        },
      },
      programsShownNote: "Showing 3 of 12 programs funded by this award in this demo frame.",
      programs: [
        {
          key: "clean-energy",
          name: "Clean Energy Workforce Training",
          allocation: "$4.0M allocation",
          programId: "clean-energy-workforce-training",
          category: "Workforce Development",
          county: "Franklin County",
          detail: {
            name: "Clean Energy Workforce Training",
            amount: "$4.0M allocation",
            sourceAuthority: "Ohio Department of Workforce Development",
            reportingPeriod: "FY2026",
            status: "verified",
            explanation: "This award allocates $4.0M of its $22.4M to Clean Energy Workforce Training, one of 12 programs it funds.",
          },
          provider: {
            name: "Community Future Network",
            amount: "$3.25M contracted",
            providerId: "community-future-network",
            orgType: "Nonprofit Provider",
            contracted: "$3.25M",
            expended: "$2.61M",
            evidenceCoverage: "94%",
            assuranceStatus: "on-track",
            detail: {
              name: "Community Future Network",
              amount: "$3.25M contracted",
              sourceAuthority: "Ohio Department of Workforce Development",
              reportingPeriod: "FY2026",
              status: "on-track",
              explanation: "Community Future Network is contracted to deliver this program's training and employer-connection services.",
            },
          },
          obligation: {
            label: "Train 600 participants",
            target: "600 participants",
            detail: {
              name: "Delivery Obligation",
              amount: null,
              sourceAuthority: "Program contract, Community Future Network",
              reportingPeriod: "FY2026",
              status: "on-track",
              explanation: "The provider is contractually obligated to train 600 participants under this program during FY2026.",
            },
          },
          delivery: {
            label: "527 participants served",
            actual: "527 participants",
            detail: {
              name: "Delivery to Date",
              amount: null,
              sourceAuthority: "Community Future Network quarterly delivery report",
              reportingPeriod: "FY2026 (through Q3)",
              status: "on-track",
              explanation: "527 of the 600 contracted participants have been served so far this reporting period.",
            },
          },
          evidence: {
            label: "498 service records verified",
            actual: "498 records",
            detail: {
              name: "Evidence Coverage",
              amount: null,
              sourceAuthority: "Independent evidence review, CivicSure demo",
              reportingPeriod: "FY2026 (through Q3)",
              status: "verified",
              explanation: "498 of the 527 reported participant service records have been independently verified — 94% coverage.",
            },
          },
          outcome: {
            label: "356 verified employment placements",
            actual: "356 placements",
            detail: {
              name: "Verified Outcome",
              amount: null,
              sourceAuthority: "Employer placement confirmation, CivicSure demo",
              reportingPeriod: "FY2026",
              status: "verified",
              explanation: "356 participants have a verified employment placement confirmed by their employer of record.",
            },
          },
        },
        {
          key: "youth-career",
          name: "Youth Career Launch",
          allocation: "$2.3M allocation",
          programId: null,
          category: "Workforce Development",
          county: "Licking County",
          detail: {
            name: "Youth Career Launch",
            amount: "$2.3M allocation",
            sourceAuthority: "Ohio Department of Workforce Development",
            reportingPeriod: "FY2026",
            status: "verified",
            explanation: "This award allocates $2.3M of its $22.4M to Youth Career Launch, one of 12 programs it funds.",
          },
          provider: {
            name: "Licking Valley Career Partners",
            amount: "$1.9M contracted",
            providerId: null,
            orgType: "Nonprofit Provider",
            contracted: "$1.9M",
            expended: "$1.4M",
            evidenceCoverage: "88%",
            assuranceStatus: "on-track",
            detail: {
              name: "Licking Valley Career Partners",
              amount: "$1.9M contracted",
              sourceAuthority: "Ohio Department of Workforce Development",
              reportingPeriod: "FY2026",
              status: "on-track",
              explanation: "Licking Valley Career Partners is contracted to deliver this program's youth career-readiness services.",
            },
          },
          obligation: {
            label: "Train 240 participants",
            target: "240 participants",
            detail: {
              name: "Delivery Obligation",
              amount: null,
              sourceAuthority: "Program contract, Licking Valley Career Partners",
              reportingPeriod: "FY2026",
              status: "on-track",
              explanation: "The provider is contractually obligated to train 240 participants under this program during FY2026.",
            },
          },
          delivery: {
            label: "198 participants served",
            actual: "198 participants",
            detail: {
              name: "Delivery to Date",
              amount: null,
              sourceAuthority: "Licking Valley Career Partners quarterly delivery report",
              reportingPeriod: "FY2026 (through Q3)",
              status: "on-track",
              explanation: "198 of the 240 contracted participants have been served so far this reporting period.",
            },
          },
          evidence: {
            label: "180 service records verified",
            actual: "180 records",
            detail: {
              name: "Evidence Coverage",
              amount: null,
              sourceAuthority: "Independent evidence review, CivicSure demo",
              reportingPeriod: "FY2026 (through Q3)",
              status: "verified",
              explanation: "180 of the 198 reported participant service records have been independently verified — 91% coverage.",
            },
          },
          outcome: {
            label: "126 verified employment placements",
            actual: "126 placements",
            detail: {
              name: "Verified Outcome",
              amount: null,
              sourceAuthority: "Employer placement confirmation, CivicSure demo",
              reportingPeriod: "FY2026",
              status: "verified",
              explanation: "126 participants have a verified employment placement confirmed by their employer of record.",
            },
          },
        },
        {
          key: "infra-skills",
          name: "Infrastructure Skills Initiative",
          allocation: "$1.5M allocation",
          programId: null,
          category: "Workforce Development",
          county: "Fairfield County",
          detail: {
            name: "Infrastructure Skills Initiative",
            amount: "$1.5M allocation",
            sourceAuthority: "Ohio Department of Workforce Development",
            reportingPeriod: "FY2026",
            status: "open-exception",
            explanation: "This award allocates $1.5M of its $22.4M to Infrastructure Skills Initiative, one of 12 programs it funds.",
          },
          provider: {
            name: "Fairfield Trades Alliance",
            amount: "$1.1M contracted",
            providerId: null,
            orgType: "Nonprofit Provider",
            contracted: "$1.1M",
            expended: "$0.85M",
            evidenceCoverage: "76%",
            assuranceStatus: "open-exception",
            detail: {
              name: "Fairfield Trades Alliance",
              amount: "$1.1M contracted",
              sourceAuthority: "Ohio Department of Workforce Development",
              reportingPeriod: "FY2026",
              status: "open-exception",
              explanation: "Fairfield Trades Alliance is contracted to deliver this program's trades-training services; two quarterly submissions are pending review.",
            },
          },
          obligation: {
            label: "Train 150 participants",
            target: "150 participants",
            detail: {
              name: "Delivery Obligation",
              amount: null,
              sourceAuthority: "Program contract, Fairfield Trades Alliance",
              reportingPeriod: "FY2026",
              status: "open-exception",
              explanation: "The provider is contractually obligated to train 150 participants under this program during FY2026.",
            },
          },
          delivery: {
            label: "112 participants served",
            actual: "112 participants",
            detail: {
              name: "Delivery to Date",
              amount: null,
              sourceAuthority: "Fairfield Trades Alliance quarterly delivery report",
              reportingPeriod: "FY2026 (through Q3)",
              status: "open-exception",
              explanation: "112 of the 150 contracted participants have been served; the most recent quarterly report is pending review.",
            },
          },
          evidence: {
            label: "104 service records verified",
            actual: "104 records",
            detail: {
              name: "Evidence Coverage",
              amount: null,
              sourceAuthority: "Independent evidence review, CivicSure demo",
              reportingPeriod: "FY2026 (through Q3)",
              status: "pending-review",
              explanation: "104 of the 112 reported participant service records have been independently verified so far — review is ongoing.",
            },
          },
          outcome: {
            label: "71 verified employment placements",
            actual: "71 placements",
            detail: {
              name: "Verified Outcome",
              amount: null,
              sourceAuthority: "Employer placement confirmation, CivicSure demo",
              reportingPeriod: "FY2026",
              status: "pending-review",
              explanation: "71 participants have a verified employment placement so far; final-quarter placements are still being confirmed.",
            },
          },
        },
      ],
    },

    reconciliation: {
      authorized: "$25.0M",
      awarded: "$22.4M",
      allocatedToPrograms: "$21.8M",
      providerContracts: "$18.8M",
      expended: "$14.6M",
      unreconciled: "$410K",
      explanation:
        "Authorized is the legal ceiling; awarded is what was formally committed to this fund. Allocated to programs and provider contracts narrow that commitment down to specific programs and the providers delivering them. Expended is what has actually been paid so far. The $410K unreconciled amount is provider-reported expenditure that CivicSure has not yet independently matched against financial records — it is not missing money, just not yet confirmed.",
    },

    delivery: [
      {
        key: "participants",
        label: "Participants to be trained",
        target: "600 participants",
        actual: "527 participants",
        period: "FY2026 (through Q3)",
        status: "on-track",
        evidenceCoverage: "94% of participants",
      },
      {
        key: "credentials",
        label: "Credentials",
        target: "400 credentials",
        actual: "368 credentials",
        period: "FY2026 (through Q3)",
        status: "on-track",
        evidenceCoverage: "91% of credentials",
      },
      {
        key: "interviews",
        label: "Employer interviews",
        target: "300 interviews",
        actual: "274 interviews",
        period: "FY2026 (through Q3)",
        status: "verified",
        evidenceCoverage: "89% of interviews",
      },
    ],

    evidence: [
      {
        key: "service-records",
        type: "Participant service records",
        related: "Clean Energy Workforce Training / Community Future Network",
        period: "FY2026 (Q3)",
        covers: "Attendance, service hours, and completion status",
        verification: "verified",
        availability: "Public Summary Available",
        lastReviewed: "2026-07-28",
      },
      {
        key: "quarterly-report",
        type: "Provider quarterly report",
        related: "Youth Career Launch / Licking Valley Career Partners",
        period: "FY2026 (Q3)",
        covers: "Delivery counts and program status narrative",
        verification: "verified",
        availability: "Public Summary Available",
        lastReviewed: "2026-07-15",
      },
      {
        key: "credential-verification",
        type: "Credential verification records",
        related: "Clean Energy Workforce Training / Community Future Network",
        period: "FY2026 (Q3)",
        covers: "Issued credentials matched to accredited programs",
        verification: "verified",
        availability: "Public Summary Available",
        lastReviewed: "2026-07-28",
      },
      {
        key: "placement-confirmation",
        type: "Employer placement confirmation",
        related: "All funded programs",
        period: "FY2026 (Q3)",
        covers: "Employer-confirmed hire and retention status",
        verification: "verified",
        availability: "Public Summary Available",
        lastReviewed: "2026-08-01",
      },
      {
        key: "financial-reconciliation",
        type: "Financial reconciliation packet",
        related: "Infrastructure Skills Initiative / Fairfield Trades Alliance",
        period: "FY2026 (Q3)",
        covers: "Provider-reported expenditure matched to financial records",
        verification: "pending-review",
        availability: "Restricted (Operator Only)",
        lastReviewed: "2026-08-05",
      },
    ],

    outcomes: [
      {
        key: "training-completion",
        name: "Training Completion",
        target: "80%",
        actual: "83%",
        denominator: "837 participants across all funded programs",
        period: "FY2026 (through Q3)",
        evidenceCoverage: "92% of participants",
        verification: "verified",
      },
      {
        key: "credential-attainment",
        name: "Credential Attainment",
        target: "65%",
        actual: "62%",
        denominator: "837 participants across all funded programs",
        period: "FY2026 (through Q3)",
        evidenceCoverage: "91% of participants",
        verification: "on-track",
      },
      {
        key: "interview-placement",
        name: "Interview Placement",
        target: "55%",
        actual: "58%",
        denominator: "837 participants across all funded programs",
        period: "FY2026 (through Q3)",
        evidenceCoverage: "89% of participants",
        verification: "verified",
      },
      {
        key: "employment-placement",
        name: "Employment Placement",
        target: "45%",
        actual: "42%",
        denominator: "837 participants across all funded programs",
        period: "FY2026 (through Q3)",
        evidenceCoverage: "94% of participants",
        verification: "verified",
      },
      {
        key: "employment-retention",
        name: "Employment Retention (6 months)",
        target: "75%",
        actual: "n/a — not yet due",
        denominator: "553 participants placed as of FY2026 Q3",
        period: "First measured FY2027 Q1",
        evidenceCoverage: "Not yet applicable",
        verification: "not-yet-evaluated",
      },
    ],

    timeline: [
      { key: "authorization", date: "2025-06-15", event: "Authorization approved", actor: "Ohio General Assembly", status: "verified", related: "$25.0M authorized" },
      { key: "award-issued", date: "2025-07-01", event: "Award issued", actor: "Ohio Department of Workforce Development", status: "verified", related: "$22.4M awarded" },
      { key: "programs-selected", date: "2025-08-12", event: "Programs selected", actor: "Ohio Department of Workforce Development", status: "verified", related: "12 programs" },
      { key: "providers-contracted", date: "2025-09-20", event: "Providers contracted", actor: "Ohio Department of Workforce Development", status: "verified", related: "$18.8M in provider contracts" },
      { key: "delivery-began", date: "2025-10-01", event: "Delivery began", actor: "Funded providers", status: "verified", related: "FY2026 Q2" },
      { key: "first-reporting", date: "2026-01-15", event: "First reporting period closed", actor: "Funded providers", status: "verified", related: "FY2026 Q2 report" },
      { key: "evidence-review", date: "2026-04-10", event: "Evidence review completed", actor: "CivicSure independent review", status: "verified", related: "FY2026 Q2–Q3" },
      { key: "reconciliation", date: "2026-08-05", event: "Funding reconciliation (in progress)", actor: "CivicSure independent review", status: "open-exception", related: "$410K pending" },
      { key: "outcome-verification", date: "2026-08-01", event: "Outcome verification (in progress)", actor: "CivicSure independent review", status: "on-track", related: "553 placements confirmed" },
      { key: "current-status", date: "2026-08-15", event: "Current status: Active", actor: "CivicSure", status: "verified", related: "FY2026" },
    ],

    geography: {
      distribution: [
        { key: "franklin", label: "Franklin County", amount: "$8.2M" },
        { key: "delaware", label: "Delaware County", amount: "$3.1M" },
        { key: "licking", label: "Licking County", amount: "$2.8M" },
        { key: "other", label: "Other Ohio counties", amount: "$7.7M" },
      ],
    },

    report: {
      name: "FY2026 Funding Assurance Report",
      version: "R3",
      reportingPeriod: "FY2026",
      status: "Final",
    },

    aboutData: {
      sourceAuthority: "Ohio Department of Workforce Development / CivicSure Public Disclosure (demo)",
      fundingAuthority: "Ohio General Assembly, FY2026–FY2027 biennial budget",
      reportingPeriod: "FY2026 (Jul 2025 – Jun 2026)",
      lastFinancialUpdate: "2026-08-01",
      evaluationDate: "2026-08-15",
      evidenceCoverage: "Partial — independent sampling across providers, not a full-population review.",
      reconciliationStatus: "In progress — $410,000 of provider-reported expenditure is not yet independently reconciled.",
      limitations:
        "This is demo data only. Every figure, node, and status on this page is illustrative and does not represent real funding, delivery, or outcome activity for any real jurisdiction, program, or organization.",
      methodology:
        "In production, CivicSure funding figures are aggregated from award records, provider self-reporting, and independent evidence review reconciled under CivicSure/GPA authority — not implemented in this page frame.",
      dataDictionary:
        "\"Authorized\" is the legal ceiling. \"Awarded\" is what's formally committed to this fund. \"Obligated\" is what's legally promised to providers. \"Expended\" is what's actually been paid. \"Verified\" means an independent evidence sample confirmed the figure.",
    },
  },
};

// Returns null for an unknown id so the page can render a plain-
// English "not found" state instead of guessing.
export function getFundingDetail(fundingId) {
  return FUNDING_DETAILS_BY_ID[fundingId] || null;
}
