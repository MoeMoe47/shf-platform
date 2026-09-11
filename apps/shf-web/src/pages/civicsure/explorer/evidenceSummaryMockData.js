// apps/shf-web/src/pages/civicsure/explorer/evidenceSummaryMockData.js
//
// DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA.
//
// Static view-model fixtures for the CivicSure Evidence Summary page
// FRAME (visual/UI build only — see
// docs/ui/CIVICSURE_EVIDENCE_SUMMARY_FRAME.md). Nothing here is wired
// to GPA data models, the Truth Spine, Evidence authority, Metric
// Registry, Public Disclosure, Shared Reporting, or any other
// CivicSure assurance system. Every number, name, and status below is
// a placeholder chosen to reproduce the approved brief's content —
// none of it is a real evidence record. This page is a public-safe
// projection only: it never carries participant names, SSNs, payroll
// details, protected wage records, private case files, confidential
// employer records, or raw restricted evidence documents — only
// verification metadata and aggregate counts.
//
// This evidence record intentionally reuses entities already
// established elsewhere in the suite rather than inventing a parallel
// set: the outcome it supports is "employment-placement" (Outcome
// Detail), the producing program is "clean-energy-workforce-training"
// (Program Detail), the delivering provider is
// "community-future-network" (Provider Detail), the funding source is
// "ohio-workforce-innovation-fund" (Funding Detail), and the related
// assurance report is the same "FY2026 Workforce Outcome Assurance
// Report" (R3, Final) that Outcome Detail already references — so
// every "View" link on this page lands on an already-built,
// already-working page instead of a placeholder.
export const EVIDENCE_DETAIL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "sources", label: "Sources" },
  { key: "coverage", label: "Coverage" },
  { key: "verification", label: "Verification" },
  { key: "related-claims", label: "Related Claims" },
  { key: "timeline", label: "Timeline" },
];

export const PUBLIC_AVAILABILITY_EXPLANATION =
  "Public availability describes what CivicSure can display publicly. It does not change the underlying evidence record or access authority.";

const EVIDENCE_RECORDS_BY_ID = {
  "employment-placement-evidence-fy2026": {
    id: "employment-placement-evidence-fy2026",
    name: "Employment Placement Evidence — FY2026",
    statusState: "verified",
    categoryLabel: "Outcome Evidence",
    reportingPeriodLabel: "FY2026",
    evidenceIdLabel: "EVD-EMP-2026-001",
    description: "Public-safe verification summary for the evidence supporting the Employment Placement outcome.",

    metrics: {
      recordsCovered: "564",
      eligiblePopulation: "600",
      coverage: "94%",
      evidenceSources: "5",
      notYetVerified: "36",
    },

    overview: {
      purpose: "Support verification of the Employment Placement outcome",
      category: "Outcome Verification",
      reportingPeriod: "FY2026",
      verificationStatus: "verified",
      coverage: "94%",
      recordsCovered: "564",
      eligiblePopulation: "600",
      notYetVerified: "36",
      lastReviewed: "Aug 28, 2026",
      whatItSupports:
        "This evidence is used to confirm whether eligible participants had qualifying employment placements during the reporting period.",
      whatVerifiedMeans:
        "Verified means the accepted evidence set met the current demo methodology requirements for source, coverage, review, and reconciliation.",
      verifiedMeaningDisclaimer: "This is demo-frame methodology, not production Evidence authority policy.",
    },

    verificationSnapshot: {
      checks: [
        { key: "types-identified", label: "Required evidence types identified", state: "verified" },
        { key: "source-received", label: "Source records received", state: "verified" },
        { key: "period-complete", label: "Reporting period complete", state: "verified" },
        { key: "duplicates-reconciled", label: "Duplicate records reconciled", state: "verified" },
        { key: "coverage-threshold", label: "Coverage above required demo threshold", state: "verified" },
        { key: "review-completed", label: "Review completed", state: "verified" },
        { key: "outstanding-records", label: "Records outside the verified evidence set", state: "open-exception", note: "36 records" },
      ],
      explanation:
        "This evidence set is marked Verified because every required check above coverage has passed and coverage (94%) is above the demo threshold required for Verified status. The 36 records outside the verified evidence set are pending supplemental review — they do not change the accepted coverage figure, and their status does not mean the underlying employment activity did not occur.",
    },

    sources: {
      rows: [
        {
          key: "employer-confirmations",
          name: "Employer Placement Confirmations",
          type: "External Verification",
          source: "Participating Employers",
          period: "FY2026",
          recordsCovered: "224",
          verification: "verified",
          availability: "Summary Public",
          lastReviewed: "2026-08-10",
        },
        {
          key: "provider-records",
          name: "Provider Placement Records",
          type: "Provider Record",
          source: "Community Future Network",
          period: "FY2026",
          recordsCovered: "186",
          verification: "verified",
          availability: "Metadata Public",
          lastReviewed: "2026-08-10",
        },
        {
          key: "quarterly-report",
          name: "Quarterly Participant Report",
          type: "Program Report",
          source: "Clean Energy Workforce Training",
          period: "FY2026 Q1–Q3",
          recordsCovered: "96",
          verification: "verified",
          availability: "Public Summary",
          lastReviewed: "2026-08-05",
        },
        {
          key: "credential-crosscheck",
          name: "Credential-to-Placement Cross-Check",
          type: "Reconciliation",
          source: "CivicSure Demo Projection",
          period: "FY2026",
          recordsCovered: "58",
          verification: "verified",
          availability: "Metadata Public",
          lastReviewed: "2026-08-12",
        },
        {
          key: "supplemental-records",
          name: "Supplemental Placement Records",
          type: "Supporting Evidence",
          source: "CivicSure Demo Projection",
          period: "FY2026",
          recordsCovered: "36",
          verification: "pending-review",
          availability: "Not Public",
          lastReviewed: "2026-08-20",
        },
      ],
    },

    coverage: {
      eligiblePopulation: "600",
      acceptedVerified: "564",
      pendingUnverified: "36",
      coveragePercent: 94,
      coverageLabel: "94%",
      bySource: [
        { key: "employer", label: "Employer confirmations", value: "224" },
        { key: "provider", label: "Provider records", value: "186" },
        { key: "quarterly", label: "Quarterly program report", value: "96" },
        { key: "crosscheck", label: "Cross-check records", value: "58" },
        { key: "total", label: "Total unique verified", value: "564", isResult: true },
      ],
      reconciliationNote:
        "Source totals are reconciled to avoid double-counting participants represented in more than one evidence source.",
      limitations: [
        "Coverage does not mean every underlying record is publicly viewable.",
        "Missing evidence does not automatically mean the claimed activity did not occur.",
        "Coverage reflects accepted verification evidence available for this reporting period.",
      ],
    },

    verificationProcess: {
      stages: [
        {
          key: "requirement-identified",
          label: "Evidence requirement identified",
          status: "verified",
          date: "2025-07-01",
          explanation: "CivicSure identified which evidence types are required to verify the Employment Placement outcome.",
        },
        {
          key: "submitted-received",
          label: "Evidence submitted/received",
          status: "verified",
          date: "2026-07-15",
          explanation: "Employer, provider, and program source records were received for the FY2026 reporting period.",
        },
        {
          key: "source-validation",
          label: "Source validation",
          status: "verified",
          date: "2026-07-22",
          explanation: "Each source was checked against its accepted evidence type before matching began.",
        },
        {
          key: "record-matching",
          label: "Record matching",
          status: "verified",
          date: "2026-07-30",
          explanation: "Records across sources were matched to individual eligible participants.",
        },
        {
          key: "duplicate-reconciliation",
          label: "Duplicate reconciliation",
          status: "verified",
          date: "2026-08-05",
          explanation: "Participants represented in more than one source were reconciled to a single record so coverage is not double-counted.",
        },
        {
          key: "coverage-calculation",
          label: "Coverage calculation",
          status: "verified",
          date: "2026-08-10",
          explanation: "Coverage was calculated as accepted verified records divided by the eligible population.",
        },
        {
          key: "review-decision",
          label: "Review decision",
          status: "verified",
          date: "2026-08-25",
          explanation: "CivicSure Assurance Review confirmed the evidence set met demo-frame source, period, reconciliation, and coverage requirements.",
        },
        {
          key: "status-assigned",
          label: "Verification status assigned",
          status: "verified",
          date: "2026-08-28",
          explanation: "The evidence set was assigned Verified status effective the review decision date.",
        },
      ],
      decision: {
        decision: "verified",
        decisionDate: "Aug 28, 2026",
        coverage: "94%",
        authority: "CivicSure Assurance Review",
        reason: "Accepted evidence met the demo frame's source, period, reconciliation, and coverage requirements.",
      },
    },

    relatedClaims: {
      outcome: {
        name: "Employment Placement",
        actual: "59.3%",
        target: "55%",
        evidenceCoverage: "94%",
        status: "verified",
        outcomeId: "employment-placement",
      },
      program: {
        name: "Clean Energy Workforce Training",
        programId: "clean-energy-workforce-training",
      },
      provider: {
        name: "Community Future Network",
        providerId: "community-future-network",
      },
      funding: {
        name: "Ohio Workforce Innovation Fund",
        fundingId: "ohio-workforce-innovation-fund",
      },
    },

    claimChain: [
      { key: "sources", label: "Employer + Provider Records", icon: "userCheck" },
      { key: "evidence-set", label: "FY2026 Employment Evidence Set", icon: "box" },
      { key: "decision", label: "Verified", icon: "shieldCheck", tone: "green" },
      { key: "outcome", label: "356 Employment Placements", icon: "trend" },
      { key: "program", label: "Clean Energy Workforce Training", icon: "grid" },
      { key: "funding", label: "Ohio Workforce Innovation Fund", icon: "bank" },
    ],

    timeline: [
      { key: "requirement-opened", date: "2025-07-01", event: "Evidence requirement opened", status: "current", authority: "Employment Placement Methodology v2.1" },
      { key: "provider-submission", date: "2026-07-15", event: "Provider submission received", status: "verified", authority: "Community Future Network" },
      { key: "employer-confirmations", date: "2026-07-18", event: "Employer confirmations received", status: "verified", authority: "Participating employers" },
      { key: "initial-matching", date: "2026-07-30", event: "Initial matching complete", status: "verified", authority: "CivicSure evidence matching (demo)" },
      { key: "duplicate-reconciliation", date: "2026-08-05", event: "Duplicate reconciliation complete", status: "verified", authority: "CivicSure reconciliation (demo)" },
      { key: "coverage-calculated", date: "2026-08-10", event: "Coverage calculated", status: "verified", authority: "CivicSure calculation engine (demo)" },
      { key: "supplemental-requested", date: "2026-08-15", event: "Supplemental records requested", status: "evidence-pending", authority: "36 outstanding records" },
      { key: "verification-review", date: "2026-08-25", event: "Verification review completed", status: "verified", authority: "CivicSure Assurance Review" },
      { key: "status-assigned", date: "2026-08-28", event: "Evidence status assigned", status: "current", authority: "Verified" },
    ],

    pending: {
      count: "36",
      statement: "36 eligible participant records do not yet have accepted verification evidence.",
      explanation: "These records are not included in the verified evidence set. Their status does not automatically mean the employment outcome did not occur.",
    },

    dataQualityNotice: {
      heading: "Data Quality Notice",
      items: [
        "Some source records use different employer naming conventions and required reconciliation before matching.",
        "Supplemental evidence for 36 records remains under review.",
      ],
    },

    privacyBoundary: {
      heading: "What CivicSure does not show publicly",
      items: [
        "Participant names",
        "Social Security numbers",
        "Payroll details",
        "Protected wage records",
        "Private case files",
        "Confidential employer records",
        "Raw restricted evidence documents",
      ],
      supportingText: "CivicSure can show verification metadata and public-safe summaries without exposing restricted underlying records.",
    },

    report: {
      name: "FY2026 Workforce Outcome Assurance Report",
      version: "R3",
      status: "Final",
      reportingPeriod: "FY2026",
    },

    aboutData: {
      evidenceAuthority: "CivicSure Evidence Verification (demo)",
      sourceAuthority: "Ohio Department of Workforce Development / CivicSure Public Disclosure (demo)",
      reportingPeriod: "FY2026 (Jul 2025 – Jun 2026)",
      decisionDate: "2026-08-28",
      methodologyNameVersion: "Employment Placement Methodology, v2.1",
      evidenceCoverage: "94% — 564 of 600 eligible participants supported by accepted verification evidence.",
      publicAvailabilityRule: PUBLIC_AVAILABILITY_EXPLANATION,
      limitations: "This is demo data only. Every figure, status, and record on this page is illustrative and does not represent a real evidence record.",
      lastReviewDate: "2026-08-28",
      dataDictionary:
        "\"Verified\" means the accepted evidence set met demo-frame requirements. \"Pending Review\" means a source is submitted but not yet independently confirmed. \"Not Public\" means CivicSure holds the record but does not display it publicly.",
    },
  },
};

// Returns null for an unknown id so the page can render a plain-
// English "not found" state instead of guessing.
export function getEvidenceSummary(evidenceId) {
  return EVIDENCE_RECORDS_BY_ID[evidenceId] || null;
}
