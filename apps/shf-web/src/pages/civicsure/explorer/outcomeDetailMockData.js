// apps/shf-web/src/pages/civicsure/explorer/outcomeDetailMockData.js
//
// DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA.
//
// Static view-model fixtures for the CivicSure Outcome Detail /
// Methodology page FRAME (visual/UI build only — see
// docs/ui/CIVICSURE_OUTCOME_DETAIL_FRAME.md). Nothing here is wired to
// GPA data models, the Truth Spine, Evidence authority, Metric
// Registry, Public Disclosure, Shared Reporting, or any other
// CivicSure assurance system. Every number, name, and status below is
// a placeholder chosen to reproduce the approved brief's content —
// none of it is a real outcome result.
//
// This outcome intentionally reuses entities already established
// elsewhere in the suite rather than inventing a parallel set: the
// producing program is "clean-energy-workforce-training" (Program
// Detail), the delivering provider is "community-future-network"
// (Provider Detail), and the funding source is
// "ohio-workforce-innovation-fund" (Funding Detail) / administered by
// the "ohio-department-workforce-development" agency (Agency Detail)
// — so every "Explore" link on this page that names one of those
// three lands on an already-built, already-working page instead of a
// placeholder.
export const OUTCOME_DETAIL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "methodology", label: "Methodology" },
  { key: "evidence", label: "Evidence" },
  { key: "population", label: "Population" },
  { key: "related-programs", label: "Related Programs" },
  { key: "timeline", label: "Timeline" },
];

const OUTCOME_DETAILS_BY_ID = {
  "employment-placement": {
    id: "employment-placement",
    name: "Employment Placement",
    statusState: "verified",
    categoryLabel: "Workforce Outcome",
    reportingPeriodLabel: "FY2026",
    outcomeIdLabel: "EMP-PLACEMENT-001",
    description:
      "Measures the share of eligible program participants who obtained verified employment within the defined reporting period.",

    metrics: {
      verifiedPlacements: "356",
      eligibleParticipants: "600",
      actual: "59.3%",
      target: "55%",
      evidenceCoverage: "94%",
    },

    overview: {
      category: "Workforce",
      reportingPeriod: "FY2026",
      target: "55%",
      actual: "59.3%",
      difference: "+4.3 percentage points",
      status: "verified",
      denominatorLabel: "600 eligible participants",
      numeratorLabel: "356 verified employment placements",
      evidenceCoverage: "94%",
      meaning:
        "Of the participants who met the eligibility rules for this outcome, 356 had verified employment placements during the reporting period.",
      whyItMatters:
        "Employment placement is one indicator of whether workforce training translated into a measurable transition into work.",
    },

    formula: {
      numeratorValue: "356",
      denominatorValue: "600",
      resultValue: "59.3%",
      numeratorLabel: "Numerator",
      numeratorExplanation: "The number of eligible participants with verified employment placements.",
      denominatorLabel: "Denominator",
      denominatorExplanation: "The number of participants who met the defined eligibility rules for the reporting period.",
    },

    verification: {
      checks: [
        { key: "definition-approved", label: "Outcome definition approved", state: "verified" },
        { key: "numerator-source", label: "Numerator source identified", state: "verified" },
        { key: "denominator-source", label: "Denominator source identified", state: "verified" },
        { key: "period-complete", label: "Reporting period complete", state: "verified" },
        { key: "coverage-threshold", label: "Evidence coverage above required threshold", state: "verified" },
        { key: "duplicates-reconciled", label: "Duplicate participant records reconciled", state: "verified" },
        { key: "outstanding-records", label: "Records outside the verified evidence set", state: "open-exception", note: "36 records" },
      ],
      explanation:
        "This outcome is marked Verified because every required check above evidence coverage has passed and evidence coverage (94%) is above the 90% threshold required for Verified status in this demo frame. The 36 records outside the verified evidence set do not change the reported rate — they reflect participants whose employment has not yet been independently confirmed, not participants known to have failed to find work.",
    },

    methodology: {
      name: "Employment Placement Methodology",
      version: "2.1",
      effectiveDate: "Jul 1, 2025",
      status: "current",
      outcomeDefinition:
        "A participant counts as an employment placement when the participant meets the program's eligibility rules and an accepted employment-verification source confirms qualifying employment within the defined measurement window.",
      numeratorRule:
        "Counts each eligible participant exactly once, the first time an accepted evidence source confirms qualifying employment within the measurement window — regardless of how many jobs the participant held afterward.",
      denominatorRule:
        "Includes every participant who completed eligible program activity and met the program's age and eligibility rules during the reporting period. Excludes participants who withdrew before reaching the eligibility threshold, duplicate enrollments, and participants outside the reporting window.",
      measurementWindow: "Employment must be verified within 90 days of program completion.",
      inclusionRules: [
        "Completed eligible program activity",
        "Meets age/program eligibility",
        "Outcome reporting period includes completion date",
      ],
      exclusionRules: [
        "Participant withdrew before eligibility threshold",
        "Duplicate enrollment",
        "Participant outside reporting window",
      ],
      evidenceRequirements: [
        "Employer confirmation",
        "Payroll/wage record where authorized",
        "Approved placement verification record",
        "Other accepted evidence under methodology",
      ],
      calculationSteps: "356 ÷ 600 × 100 = 59.3%",
      verificationThreshold: "At least 90% evidence coverage is required for Verified status in this demo frame.",
      thresholdDisclaimer: "This is demo methodology for this page frame, not a production CivicSure policy.",
      history: [
        {
          key: "v2.1",
          version: "2.1",
          label: "v2.1 — current",
          note: "Clarified 90-day placement window",
        },
        {
          key: "v2.0",
          version: "2.0",
          label: "v2.0",
          note: "Updated denominator eligibility rule",
        },
        {
          key: "v1.0",
          version: "1.0",
          label: "v1.0",
          note: "Initial methodology",
        },
      ],
    },

    evidence: {
      rows: [
        {
          key: "employer-confirmations",
          type: "Employer placement confirmations",
          source: "Participating employers (verified)",
          period: "FY2026",
          recordsCovered: "241",
          verification: "verified",
          availability: "Public (aggregate)",
          lastReviewed: "2026-08-10",
        },
        {
          key: "provider-records",
          type: "Provider placement records",
          source: "Community Future Network",
          period: "FY2026",
          recordsCovered: "198",
          verification: "verified",
          availability: "Public (aggregate)",
          lastReviewed: "2026-08-10",
        },
        {
          key: "quarterly-report",
          type: "Quarterly participant report",
          source: "Ohio Department of Workforce Development",
          period: "FY2026 Q1–Q3",
          recordsCovered: "600",
          verification: "verified",
          availability: "Public (aggregate)",
          lastReviewed: "2026-08-05",
        },
        {
          key: "credential-crosscheck",
          type: "Credential-to-placement cross-check",
          source: "CivicSure evidence sampling",
          period: "FY2026",
          recordsCovered: "125",
          verification: "evidence-pending",
          availability: "Public (aggregate)",
          lastReviewed: "2026-08-12",
        },
        {
          key: "financial-reconciliation",
          type: "Financial/service delivery reconciliation reference",
          source: "Ohio Workforce Innovation Fund",
          period: "FY2026",
          recordsCovered: "1 fund record",
          verification: "not-yet-evaluated",
          availability: "Restricted (Operator Only)",
          lastReviewed: "2026-07-28",
        },
      ],
      coverage: {
        totalEligible: "600",
        withAcceptedEvidence: "564",
        coveragePercent: "94%",
        notYetVerified: "36",
        explanation: "Evidence coverage describes how much of the outcome population is supported by accepted verification evidence.",
      },
    },

    population: {
      steps: [
        { key: "total-served", label: "Total participants served", value: "725" },
        { key: "excluded-eligibility", label: "Excluded before outcome eligibility", value: "85" },
        { key: "outside-window", label: "Outside reporting window", value: "24" },
        { key: "duplicates", label: "Duplicate/reconciled records", value: "16" },
        { key: "eligible-denominator", label: "Eligible denominator", value: "600", isResult: true },
      ],
      breakdown: [
        { key: "franklin", label: "Franklin County", value: "240 eligible" },
        { key: "delaware", label: "Delaware County", value: "110 eligible" },
        { key: "licking", label: "Licking County", value: "96 eligible" },
        { key: "other", label: "Other counties", value: "154 eligible" },
      ],
    },

    relatedPrograms: {
      rows: [
        {
          key: "clean-energy",
          program: "Clean Energy Workforce Training",
          provider: "Community Future Network",
          eligibleParticipants: "600",
          verifiedPlacements: "356",
          outcomeRate: "59.3%",
          evidenceCoverage: "94%",
          status: "verified",
          programId: "clean-energy-workforce-training",
        },
      ],
      note: "Showing 1 of 3 agency programs that report this outcome in this demo frame.",
    },

    relatedFunding: {
      fundingId: "ohio-workforce-innovation-fund",
      programId: "clean-energy-workforce-training",
      chain: [
        { key: "fund", label: "Ohio Workforce Innovation Fund", icon: "bank" },
        { key: "program", label: "Clean Energy Workforce Training", icon: "grid" },
        { key: "outcome", label: "Employment Placement", icon: "shieldCheck", tone: "green" },
      ],
    },

    relatedProvider: {
      providerId: "community-future-network",
      name: "Community Future Network",
    },

    timeline: [
      { key: "methodology-effective", date: "2025-07-01", event: "Methodology version effective", status: "current", authority: "Employment Placement Methodology v2.1" },
      { key: "period-opened", date: "2025-07-01", event: "Reporting period opened", status: "verified", authority: "FY2026" },
      { key: "eligibility-established", date: "2025-09-15", event: "Participant eligibility established", status: "verified", authority: "Program enrollment records" },
      { key: "evidence-window", date: "2025-10-01", event: "Evidence submission window", status: "verified", authority: "Provider + employer submissions" },
      { key: "initial-calc", date: "2026-06-30", event: "Initial calculation", status: "verified", authority: "CivicSure calculation engine (demo)" },
      { key: "evidence-review", date: "2026-07-20", event: "Evidence review", status: "verified", authority: "CivicSure evidence review (demo)" },
      { key: "reconciliation", date: "2026-08-05", event: "Reconciliation", status: "verified", authority: "Duplicate/withdrawal reconciliation" },
      { key: "outcome-verification", date: "2026-08-12", event: "Outcome verification", status: "verified", authority: "CivicSure assurance (demo)" },
      { key: "report-finalized", date: "2026-08-15", event: "Report finalized", status: "current", authority: "FY2026 Workforce Outcome Assurance Report R3" },
    ],

    limitations: [
      "36 eligible participant records do not yet have accepted verification evidence.",
      "Employment placement does not measure job quality, wage growth, or long-term retention unless those are separately defined outcomes.",
      "Outcome comparisons across programs may be inappropriate when eligibility rules, populations, or measurement windows differ.",
    ],

    comparability: {
      question: "Can I compare this outcome to another program?",
      answer: "Only when the compared outcomes use compatible definitions, populations, reporting periods, and methodologies.",
      actionLabel: "Compare compatible outcomes",
    },

    report: {
      name: "FY2026 Workforce Outcome Assurance Report",
      version: "R3",
      status: "Final",
      reportingPeriod: "FY2026",
    },

    aboutData: {
      outcomeAuthority: "Employment Placement Methodology v2.1 (demo)",
      sourceAuthority: "Ohio Department of Workforce Development / CivicSure Public Disclosure (demo)",
      reportingPeriod: "FY2026 (Jul 2025 – Jun 2026)",
      methodologyNameVersion: "Employment Placement Methodology, v2.1",
      lastSourceUpdate: "2026-08-10",
      evaluationDate: "2026-08-15",
      evidenceCoverage: "94% — 564 of 600 eligible participants supported by accepted verification evidence.",
      limitations: "This is demo data only. Every figure, status, and record on this page is illustrative and does not represent a real outcome result.",
      calculationRule: "Verified employment placements ÷ eligible participants × 100. See the Methodology tab for full numerator/denominator rules.",
      dataDictionary:
        "\"Verified\" means an independent evidence sample confirmed the reported figure. \"Evidence Pending\" means a record is submitted but not yet independently confirmed. \"Not Yet Evaluated\" means CivicSure has not yet reviewed the record.",
    },
  },
};

// Returns null for an unknown id so the page can render a plain-
// English "not found" state instead of guessing.
export function getOutcomeDetail(outcomeId) {
  return OUTCOME_DETAILS_BY_ID[outcomeId] || null;
}
