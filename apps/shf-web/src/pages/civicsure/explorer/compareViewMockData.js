// apps/shf-web/src/pages/civicsure/explorer/compareViewMockData.js
//
// DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA.
//
// Static view-model fixtures (and the small pure comparison-logic
// helpers that operate on them) for the CivicSure Compare View page
// FRAME (visual/UI build only — see
// docs/ui/CIVICSURE_COMPARE_VIEW_FRAME.md). Nothing here is wired to
// GPA data models, the Truth Spine, Evidence authority, Metric
// Registry, Public Disclosure, Shared Reporting, or any other
// CivicSure assurance system. Every number, name, status, and
// comparability judgment below is a placeholder chosen to demonstrate
// the approved brief's comparison logic — none of it is a real
// program, provider, county, or outcome result, and the comparability
// heuristic in `computeComparability` is explicitly DEMO logic, not a
// production CivicSure policy.
//
// Every entity uses one uniform shape regardless of compare type
// (Program / Provider / County / Outcome) so every comparison panel
// can be written once and reused across all four types rather than
// branching per type. Entities intentionally reuse ids and numbers
// already established elsewhere in the suite
// (clean-energy-workforce-training, community-future-network,
// franklin-county, employment-placement) so their "View →" links land
// on already-built pages instead of placeholders.
export const COMPARE_TYPES = [
  { key: "programs", label: "Programs", routeBase: "#/explorer/programs" },
  { key: "providers", label: "Providers", routeBase: "#/explorer/providers" },
  { key: "counties", label: "Counties", routeBase: "#/explorer/counties" },
  { key: "outcomes", label: "Outcomes", routeBase: "#/explorer/outcomes" },
];

export const MAX_COMPARE_ITEMS = 4;
export const MIN_COMPARE_ITEMS = 2;

export const COMPARE_SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "funding", label: "Funding" },
  { key: "delivery", label: "Delivery" },
  { key: "outcomes", label: "Outcomes" },
  { key: "evidence", label: "Evidence" },
  { key: "assurance", label: "Assurance" },
  { key: "methodology", label: "Methodology" },
];

const ENTITIES_BY_TYPE = {
  programs: [
    {
      id: "clean-energy-workforce-training",
      name: "Clean Energy Workforce Training",
      entityTypeLabel: "Program",
      detailRoute: "#/explorer/programs/clean-energy-workforce-training",
      category: "Workforce",
      geography: "Franklin County",
      organization: "Community Future Network",
      reportingPeriod: "FY2026",
      activeStatus: "on-track",
      totalFunding: "$4.0M",
      evidenceCoveragePercent: 94,
      openExceptions: "0",
      funding: { authorized: "$4.5M", obligated: "$4.2M", expended: "$3.6M", remaining: "$0.9M", fundingSource: "Ohio Workforce Innovation Fund", reportingPeriod: "FY2026" },
      delivery: { measureLabel: "Participants Trained", target: "500", actual: "527", unit: "participants", reportingPeriod: "FY2026", evidenceCoverage: "94%" },
      outcome: { name: "Employment Placement", target: "55%", actual: "59.3%", numerator: "356", denominator: "600", reportingPeriod: "FY2026", methodologyName: "Employment Placement Methodology", methodologyVersion: "2.1", evidenceCoverage: "94%", verificationStatus: "verified" },
      evidence: { coverage: "94%", verifiedCount: "564", pendingReview: "36", missing: "0", restricted: "1 record", lastReviewDate: "2026-08-28" },
      assurance: { reportingStatus: "verified", reconciliationStatus: "verified", evidenceStatus: "evidence-pending", openExceptions: "0", correctiveActions: "None", lastEvaluationDate: "2026-08-15" },
      methodology: { name: "Employment Placement Methodology", version: "2.1", effectiveDate: "Jul 1, 2025", measurementWindow: "90-day window", numeratorRule: "Verified employment placements", denominatorRule: "Eligible participants meeting program rules", evidenceThreshold: "90%" },
      comparability: { reportingPeriod: "FY2026", populationDefinition: "workforce-adult-general", geographicScope: "county", evidenceThresholdValue: 90, category: "Workforce", fundingType: "State/Federal Workforce Grant" },
    },
    {
      id: "summer-stem-initiative",
      name: "Summer STEM Initiative",
      entityTypeLabel: "Program",
      detailRoute: null,
      category: "Workforce",
      geography: "Delaware County",
      organization: "Central Ohio Workforce Collaborative",
      reportingPeriod: "FY2026",
      activeStatus: "on-track",
      totalFunding: "$1.8M",
      evidenceCoveragePercent: 78,
      openExceptions: "1",
      funding: { authorized: "$2.0M", obligated: "$1.9M", expended: "$1.5M", remaining: "$0.4M", fundingSource: "Ohio STEM Education Fund (demo)", reportingPeriod: "FY2026" },
      delivery: { measureLabel: "Students Served", target: "300", actual: "312", unit: "students", reportingPeriod: "FY2026", evidenceCoverage: "78%" },
      outcome: { name: "Credential Attainment", target: "60%", actual: "54%", numerator: "168", denominator: "312", reportingPeriod: "FY2026", methodologyName: "Credential Attainment Methodology", methodologyVersion: "1.4", evidenceCoverage: "78%", verificationStatus: "evidence-pending" },
      evidence: { coverage: "78%", verifiedCount: "243", pendingReview: "61", missing: "8", restricted: "0 records", lastReviewDate: "2026-08-20" },
      assurance: { reportingStatus: "verified", reconciliationStatus: "evidence-pending", evidenceStatus: "evidence-pending", openExceptions: "1", correctiveActions: "1 corrective action in progress", lastEvaluationDate: "2026-08-10" },
      methodology: { name: "Credential Attainment Methodology", version: "1.4", effectiveDate: "Jan 1, 2025", measurementWindow: "120-day window", numeratorRule: "Participants earning a recognized credential", denominatorRule: "Students completing eligible STEM coursework", evidenceThreshold: "85%" },
      comparability: { reportingPeriod: "FY2026", populationDefinition: "youth-stem", geographicScope: "county", evidenceThresholdValue: 85, category: "Workforce", fundingType: "State Education Grant" },
    },
    {
      id: "community-mental-health-access",
      name: "Community Mental Health Access",
      entityTypeLabel: "Program",
      detailRoute: null,
      category: "Health & Human Services",
      geography: "Licking County",
      organization: "Licking County Behavioral Health Partners (demo)",
      reportingPeriod: "FY2026",
      activeStatus: "open-exception",
      totalFunding: "$2.6M",
      evidenceCoveragePercent: 81,
      openExceptions: "2",
      funding: { authorized: "$3.0M", obligated: "$2.8M", expended: "$2.1M", remaining: "$0.7M", fundingSource: "Ohio Behavioral Health Fund (demo)", reportingPeriod: "FY2026" },
      delivery: { measureLabel: "People Served", target: "900", actual: "845", unit: "people", reportingPeriod: "FY2026", evidenceCoverage: "81%" },
      outcome: { name: "Access to Care within 14 Days", target: "70%", actual: "66%", numerator: "558", denominator: "845", reportingPeriod: "FY2026", methodologyName: "Access Timeliness Methodology", methodologyVersion: "1.0", evidenceCoverage: "81%", verificationStatus: "open-exception" },
      evidence: { coverage: "81%", verifiedCount: "685", pendingReview: "120", missing: "40", restricted: "3 records", lastReviewDate: "2026-08-05" },
      assurance: { reportingStatus: "open-exception", reconciliationStatus: "evidence-pending", evidenceStatus: "open-exception", openExceptions: "2", correctiveActions: "2 corrective actions in progress", lastEvaluationDate: "2026-07-30" },
      methodology: { name: "Access Timeliness Methodology", version: "1.0", effectiveDate: "Mar 1, 2025", measurementWindow: "14-day window", numeratorRule: "Clients seen within 14 days of referral", denominatorRule: "Clients referred during the reporting period", evidenceThreshold: "80%" },
      comparability: { reportingPeriod: "FY2026", populationDefinition: "health-general-population", geographicScope: "county", evidenceThresholdValue: 80, category: "Health & Human Services", fundingType: "State Behavioral Health Grant" },
    },
    {
      id: "supportive-housing-program",
      name: "Supportive Housing Program",
      entityTypeLabel: "Program",
      detailRoute: null,
      category: "Housing",
      geography: "Franklin County",
      organization: "Franklin County Housing Alliance (demo)",
      reportingPeriod: "FY2025",
      activeStatus: "verified",
      totalFunding: "$5.4M",
      evidenceCoveragePercent: 88,
      openExceptions: "0",
      funding: { authorized: "$6.0M", obligated: "$5.7M", expended: "$5.0M", remaining: "$0.7M", fundingSource: "Federal Housing Stability Fund (demo)", reportingPeriod: "FY2025" },
      delivery: { measureLabel: "Housing Placements", target: "200", actual: "214", unit: "placements", reportingPeriod: "FY2025", evidenceCoverage: "88%" },
      outcome: { name: "Housing Retention (12-month)", target: "75%", actual: "79%", numerator: "169", denominator: "214", reportingPeriod: "FY2025", methodologyName: "Housing Retention Methodology", methodologyVersion: "1.2", evidenceCoverage: "88%", verificationStatus: "verified" },
      evidence: { coverage: "88%", verifiedCount: "188", pendingReview: "20", missing: "6", restricted: "2 records", lastReviewDate: "2025-12-15" },
      assurance: { reportingStatus: "verified", reconciliationStatus: "verified", evidenceStatus: "verified", openExceptions: "0", correctiveActions: "None", lastEvaluationDate: "2025-12-20" },
      methodology: { name: "Housing Retention Methodology", version: "1.2", effectiveDate: "Jul 1, 2024", measurementWindow: "12-month window", numeratorRule: "Households retaining housing at 12 months", denominatorRule: "Households placed during the reporting period", evidenceThreshold: "85%" },
      comparability: { reportingPeriod: "FY2025", populationDefinition: "housing-insecure-population", geographicScope: "county", evidenceThresholdValue: 85, category: "Housing", fundingType: "Federal Housing Grant" },
    },
  ],

  providers: [
    {
      id: "community-future-network",
      name: "Community Future Network",
      entityTypeLabel: "Provider",
      detailRoute: "#/explorer/providers/community-future-network",
      category: "Nonprofit Provider",
      geography: "Franklin County",
      organization: "Ohio Department of Workforce Development (demo)",
      reportingPeriod: "FY2026",
      activeStatus: "verified",
      totalFunding: "$3.25M",
      evidenceCoveragePercent: 94,
      openExceptions: "0",
      funding: { authorized: "$3.5M", obligated: "$3.3M", expended: "$2.9M", remaining: "$0.4M", fundingSource: "Ohio Workforce Innovation Fund", reportingPeriod: "FY2026" },
      delivery: { measureLabel: "Participants Served", target: "600", actual: "527", unit: "participants", reportingPeriod: "FY2026", evidenceCoverage: "94%" },
      outcome: { name: "Employment Placement", target: "55%", actual: "59.3%", numerator: "356", denominator: "600", reportingPeriod: "FY2026", methodologyName: "Employment Placement Methodology", methodologyVersion: "2.1", evidenceCoverage: "94%", verificationStatus: "verified" },
      evidence: { coverage: "94%", verifiedCount: "564", pendingReview: "36", missing: "0", restricted: "1 record", lastReviewDate: "2026-08-28" },
      assurance: { reportingStatus: "verified", reconciliationStatus: "verified", evidenceStatus: "evidence-pending", openExceptions: "0", correctiveActions: "None", lastEvaluationDate: "2026-08-15" },
      methodology: { name: "Employment Placement Methodology", version: "2.1", effectiveDate: "Jul 1, 2025", measurementWindow: "90-day window", numeratorRule: "Verified employment placements", denominatorRule: "Eligible participants meeting program rules", evidenceThreshold: "90%" },
      comparability: { reportingPeriod: "FY2026", populationDefinition: "workforce-adult-general", geographicScope: "county", evidenceThresholdValue: 90, category: "Nonprofit Provider", fundingType: "State/Federal Workforce Grant" },
    },
    {
      id: "central-ohio-workforce-collaborative",
      name: "Central Ohio Workforce Collaborative",
      entityTypeLabel: "Provider",
      detailRoute: null,
      category: "Nonprofit Provider",
      geography: "Delaware County",
      organization: "Ohio Department of Workforce Development (demo)",
      reportingPeriod: "FY2026",
      activeStatus: "on-track",
      totalFunding: "$1.9M",
      evidenceCoveragePercent: 88,
      openExceptions: "0",
      funding: { authorized: "$2.1M", obligated: "$2.0M", expended: "$1.7M", remaining: "$0.3M", fundingSource: "Ohio Workforce Innovation Fund", reportingPeriod: "FY2026" },
      delivery: { measureLabel: "Participants Served", target: "240", actual: "198", unit: "participants", reportingPeriod: "FY2026", evidenceCoverage: "88%" },
      outcome: { name: "Employment Placement", target: "55%", actual: "51%", numerator: "101", denominator: "198", reportingPeriod: "FY2026", methodologyName: "Employment Placement Methodology", methodologyVersion: "2.1", evidenceCoverage: "88%", verificationStatus: "on-track" },
      evidence: { coverage: "88%", verifiedCount: "174", pendingReview: "24", missing: "0", restricted: "0 records", lastReviewDate: "2026-08-18" },
      assurance: { reportingStatus: "verified", reconciliationStatus: "verified", evidenceStatus: "evidence-pending", openExceptions: "0", correctiveActions: "None", lastEvaluationDate: "2026-08-12" },
      methodology: { name: "Employment Placement Methodology", version: "2.1", effectiveDate: "Jul 1, 2025", measurementWindow: "90-day window", numeratorRule: "Verified employment placements", denominatorRule: "Eligible participants meeting program rules", evidenceThreshold: "90%" },
      comparability: { reportingPeriod: "FY2026", populationDefinition: "workforce-adult-general", geographicScope: "county", evidenceThresholdValue: 90, category: "Nonprofit Provider", fundingType: "State/Federal Workforce Grant" },
    },
    {
      id: "youth-opportunity-network",
      name: "Youth Opportunity Network",
      entityTypeLabel: "Provider",
      detailRoute: null,
      category: "Nonprofit Provider",
      geography: "Fairfield County",
      organization: "Ohio Department of Workforce Development (demo)",
      reportingPeriod: "FY2026",
      activeStatus: "open-exception",
      totalFunding: "$1.1M",
      evidenceCoveragePercent: 76,
      openExceptions: "1",
      funding: { authorized: "$1.3M", obligated: "$1.2M", expended: "$0.9M", remaining: "$0.3M", fundingSource: "Ohio Workforce Innovation Fund", reportingPeriod: "FY2026" },
      delivery: { measureLabel: "Participants Served", target: "150", actual: "112", unit: "participants", reportingPeriod: "FY2026", evidenceCoverage: "76%" },
      outcome: { name: "Employment Placement", target: "55%", actual: "44%", numerator: "49", denominator: "112", reportingPeriod: "FY2026", methodologyName: "Employment Placement Methodology", methodologyVersion: "1.8", evidenceCoverage: "76%", verificationStatus: "open-exception" },
      evidence: { coverage: "76%", verifiedCount: "85", pendingReview: "20", missing: "7", restricted: "0 records", lastReviewDate: "2026-07-28" },
      assurance: { reportingStatus: "open-exception", reconciliationStatus: "evidence-pending", evidenceStatus: "open-exception", openExceptions: "1", correctiveActions: "1 corrective action in progress", lastEvaluationDate: "2026-07-25" },
      methodology: { name: "Employment Placement Methodology", version: "1.8", effectiveDate: "Jan 1, 2024", measurementWindow: "120-day window", numeratorRule: "Employer-confirmed placements", denominatorRule: "Enrolled participants completing program activity", evidenceThreshold: "80%" },
      comparability: { reportingPeriod: "FY2026", populationDefinition: "workforce-youth-population", geographicScope: "county", evidenceThresholdValue: 80, category: "Nonprofit Provider", fundingType: "State/Federal Workforce Grant" },
    },
  ],

  counties: [
    {
      id: "franklin-county",
      name: "Franklin County",
      entityTypeLabel: "County",
      detailRoute: "#/explorer/counties/franklin-county",
      category: "County",
      geography: "Franklin County",
      organization: "Franklin County Board of Commissioners (demo)",
      reportingPeriod: "FY2026",
      activeStatus: "verified",
      totalFunding: "$428M",
      evidenceCoveragePercent: 76,
      openExceptions: "14",
      funding: { authorized: "$460M", obligated: "$440M", expended: "$390M", remaining: "$50M", fundingSource: "Multiple State & Federal Sources (aggregate)", reportingPeriod: "FY2026" },
      delivery: { measureLabel: "Programs Delivered", target: "240", actual: "248", unit: "programs", reportingPeriod: "FY2026", evidenceCoverage: "76%" },
      outcome: { name: "Countywide Verified Outcomes Rate", target: "80%", actual: "76%", numerator: "948", denominator: "1,248", reportingPeriod: "FY2026", methodologyName: "County Aggregate Outcomes Methodology", methodologyVersion: "1.0", evidenceCoverage: "76%", verificationStatus: "verified" },
      evidence: { coverage: "76%", verifiedCount: "948", pendingReview: "220", missing: "80", restricted: "12 records", lastReviewDate: "2026-08-01" },
      assurance: { reportingStatus: "verified", reconciliationStatus: "verified", evidenceStatus: "evidence-pending", openExceptions: "14", correctiveActions: "3 corrective actions in progress", lastEvaluationDate: "2026-08-01" },
      methodology: { name: "County Aggregate Outcomes Methodology", version: "1.0", effectiveDate: "Jan 1, 2025", measurementWindow: "Fiscal year aggregate", numeratorRule: "Sum of verified program-level outcomes", denominatorRule: "Sum of eligible participants across county programs", evidenceThreshold: "75%" },
      comparability: { reportingPeriod: "FY2026", populationDefinition: "countywide-aggregate", geographicScope: "county", evidenceThresholdValue: 75, category: "County", fundingType: "Aggregate (Multiple Sources)" },
    },
    {
      id: "delaware-county",
      name: "Delaware County",
      entityTypeLabel: "County",
      detailRoute: null,
      category: "County",
      geography: "Delaware County",
      organization: "Delaware County Board of Commissioners (demo)",
      reportingPeriod: "FY2026",
      activeStatus: "on-track",
      totalFunding: "$96M",
      evidenceCoveragePercent: 82,
      openExceptions: "3",
      funding: { authorized: "$105M", obligated: "$99M", expended: "$88M", remaining: "$11M", fundingSource: "Multiple State & Federal Sources (aggregate)", reportingPeriod: "FY2026" },
      delivery: { measureLabel: "Programs Delivered", target: "60", actual: "63", unit: "programs", reportingPeriod: "FY2026", evidenceCoverage: "82%" },
      outcome: { name: "Countywide Verified Outcomes Rate", target: "80%", actual: "82%", numerator: "258", denominator: "315", reportingPeriod: "FY2026", methodologyName: "County Aggregate Outcomes Methodology", methodologyVersion: "1.0", evidenceCoverage: "82%", verificationStatus: "verified" },
      evidence: { coverage: "82%", verifiedCount: "258", pendingReview: "40", missing: "17", restricted: "2 records", lastReviewDate: "2026-08-03" },
      assurance: { reportingStatus: "verified", reconciliationStatus: "verified", evidenceStatus: "verified", openExceptions: "3", correctiveActions: "1 corrective action in progress", lastEvaluationDate: "2026-08-03" },
      methodology: { name: "County Aggregate Outcomes Methodology", version: "1.0", effectiveDate: "Jan 1, 2025", measurementWindow: "Fiscal year aggregate", numeratorRule: "Sum of verified program-level outcomes", denominatorRule: "Sum of eligible participants across county programs", evidenceThreshold: "75%" },
      comparability: { reportingPeriod: "FY2026", populationDefinition: "countywide-aggregate", geographicScope: "county", evidenceThresholdValue: 75, category: "County", fundingType: "Aggregate (Multiple Sources)" },
    },
    {
      id: "licking-county",
      name: "Licking County",
      entityTypeLabel: "County",
      detailRoute: null,
      category: "County",
      geography: "Licking County",
      organization: "Licking County Board of Commissioners (demo)",
      reportingPeriod: "FY2025",
      activeStatus: "open-exception",
      totalFunding: "$54M",
      evidenceCoveragePercent: 69,
      openExceptions: "6",
      funding: { authorized: "$60M", obligated: "$57M", expended: "$49M", remaining: "$8M", fundingSource: "Multiple State & Federal Sources (aggregate)", reportingPeriod: "FY2025" },
      delivery: { measureLabel: "Programs Delivered", target: "40", actual: "36", unit: "programs", reportingPeriod: "FY2025", evidenceCoverage: "69%" },
      outcome: { name: "Countywide Verified Outcomes Rate", target: "80%", actual: "69%", numerator: "132", denominator: "191", reportingPeriod: "FY2025", methodologyName: "County Aggregate Outcomes Methodology", methodologyVersion: "0.9", evidenceCoverage: "69%", verificationStatus: "open-exception" },
      evidence: { coverage: "69%", verifiedCount: "132", pendingReview: "41", missing: "18", restricted: "4 records", lastReviewDate: "2026-07-10" },
      assurance: { reportingStatus: "open-exception", reconciliationStatus: "evidence-pending", evidenceStatus: "open-exception", openExceptions: "6", correctiveActions: "3 corrective actions in progress", lastEvaluationDate: "2026-07-10" },
      methodology: { name: "County Aggregate Outcomes Methodology", version: "0.9", effectiveDate: "Jan 1, 2024", measurementWindow: "Fiscal year aggregate", numeratorRule: "Sum of verified program-level outcomes", denominatorRule: "Sum of eligible participants across county programs", evidenceThreshold: "70%" },
      comparability: { reportingPeriod: "FY2025", populationDefinition: "countywide-aggregate", geographicScope: "county", evidenceThresholdValue: 70, category: "County", fundingType: "Aggregate (Multiple Sources)" },
    },
  ],

  outcomes: [
    {
      id: "employment-placement",
      name: "Employment Placement",
      entityTypeLabel: "Outcome",
      detailRoute: "#/explorer/outcomes/employment-placement",
      category: "Workforce Outcome",
      geography: "Franklin County",
      organization: "Clean Energy Workforce Training",
      reportingPeriod: "FY2026",
      activeStatus: "verified",
      totalFunding: "$4.0M (producing program)",
      evidenceCoveragePercent: 94,
      openExceptions: "0",
      funding: { authorized: "$4.5M", obligated: "$4.2M", expended: "$3.6M", remaining: "$0.9M", fundingSource: "Ohio Workforce Innovation Fund", reportingPeriod: "FY2026" },
      delivery: { measureLabel: "Participants Trained", target: "500", actual: "527", unit: "participants", reportingPeriod: "FY2026", evidenceCoverage: "94%" },
      outcome: { name: "Employment Placement", target: "55%", actual: "59.3%", numerator: "356", denominator: "600", reportingPeriod: "FY2026", methodologyName: "Employment Placement Methodology", methodologyVersion: "2.1", evidenceCoverage: "94%", verificationStatus: "verified" },
      evidence: { coverage: "94%", verifiedCount: "564", pendingReview: "36", missing: "0", restricted: "1 record", lastReviewDate: "2026-08-28" },
      assurance: { reportingStatus: "verified", reconciliationStatus: "verified", evidenceStatus: "evidence-pending", openExceptions: "0", correctiveActions: "None", lastEvaluationDate: "2026-08-15" },
      methodology: { name: "Employment Placement Methodology", version: "2.1", effectiveDate: "Jul 1, 2025", measurementWindow: "90-day window", numeratorRule: "Verified employment placements", denominatorRule: "Eligible participants meeting program rules", evidenceThreshold: "90%" },
      comparability: { reportingPeriod: "FY2026", populationDefinition: "workforce-adult-general", geographicScope: "county", evidenceThresholdValue: 90, category: "Workforce Outcome", fundingType: "State/Federal Workforce Grant" },
    },
    {
      id: "credential-attainment",
      name: "Credential Attainment",
      entityTypeLabel: "Outcome",
      detailRoute: null,
      category: "Workforce Outcome",
      geography: "Delaware County",
      organization: "Summer STEM Initiative",
      reportingPeriod: "FY2026",
      activeStatus: "evidence-pending",
      totalFunding: "$1.8M (producing program)",
      evidenceCoveragePercent: 78,
      openExceptions: "1",
      funding: { authorized: "$2.0M", obligated: "$1.9M", expended: "$1.5M", remaining: "$0.4M", fundingSource: "Ohio STEM Education Fund (demo)", reportingPeriod: "FY2026" },
      delivery: { measureLabel: "Students Served", target: "300", actual: "312", unit: "students", reportingPeriod: "FY2026", evidenceCoverage: "78%" },
      outcome: { name: "Credential Attainment", target: "60%", actual: "54%", numerator: "168", denominator: "312", reportingPeriod: "FY2026", methodologyName: "Credential Attainment Methodology", methodologyVersion: "1.4", evidenceCoverage: "78%", verificationStatus: "evidence-pending" },
      evidence: { coverage: "78%", verifiedCount: "243", pendingReview: "61", missing: "8", restricted: "0 records", lastReviewDate: "2026-08-20" },
      assurance: { reportingStatus: "verified", reconciliationStatus: "evidence-pending", evidenceStatus: "evidence-pending", openExceptions: "1", correctiveActions: "1 corrective action in progress", lastEvaluationDate: "2026-08-10" },
      methodology: { name: "Credential Attainment Methodology", version: "1.4", effectiveDate: "Jan 1, 2025", measurementWindow: "120-day window", numeratorRule: "Participants earning a recognized credential", denominatorRule: "Students completing eligible STEM coursework", evidenceThreshold: "85%" },
      comparability: { reportingPeriod: "FY2026", populationDefinition: "youth-stem", geographicScope: "county", evidenceThresholdValue: 85, category: "Workforce Outcome", fundingType: "State Education Grant" },
    },
    {
      id: "training-completion",
      name: "Training Completion",
      entityTypeLabel: "Outcome",
      detailRoute: null,
      category: "Workforce Outcome",
      geography: "Franklin County",
      organization: "Ohio Department of Workforce Development (aggregate)",
      reportingPeriod: "FY2026",
      activeStatus: "verified",
      totalFunding: "$684M (agency aggregate)",
      evidenceCoveragePercent: 90,
      openExceptions: "0",
      funding: { authorized: "$720M", obligated: "$611M", expended: "$498M", remaining: "$113M", fundingSource: "Ohio Workforce Innovation Fund + Federal Grants (aggregate)", reportingPeriod: "FY2026" },
      delivery: { measureLabel: "Participants Completing Training", target: "4,912", actual: "5,096", unit: "participants", reportingPeriod: "FY2026", evidenceCoverage: "90%" },
      outcome: { name: "Training Completion", target: "80%", actual: "83%", numerator: "5,096", denominator: "6,140", reportingPeriod: "FY2026", methodologyName: "Training Completion Methodology", methodologyVersion: "1.0", evidenceCoverage: "90%", verificationStatus: "verified" },
      evidence: { coverage: "90%", verifiedCount: "5,096", pendingReview: "700", missing: "344", restricted: "20 records", lastReviewDate: "2026-08-15" },
      assurance: { reportingStatus: "verified", reconciliationStatus: "verified", evidenceStatus: "verified", openExceptions: "0", correctiveActions: "None", lastEvaluationDate: "2026-08-15" },
      methodology: { name: "Training Completion Methodology", version: "1.0", effectiveDate: "Jul 1, 2025", measurementWindow: "Fiscal year aggregate", numeratorRule: "Participants completing eligible training activity", denominatorRule: "Participants enrolled across agency programs", evidenceThreshold: "85%" },
      comparability: { reportingPeriod: "FY2026", populationDefinition: "workforce-adult-general", geographicScope: "agency-aggregate", evidenceThresholdValue: 85, category: "Workforce Outcome", fundingType: "Aggregate (Multiple Sources)" },
    },
  ],
};

export function getEntitiesByType(compareType) {
  return ENTITIES_BY_TYPE[compareType] || [];
}

export function getEntity(compareType, id) {
  return getEntitiesByType(compareType).find((e) => e.id === id) || null;
}

export const STARTING_SHORTCUTS = [
  { key: "workforce-programs", label: "Compare workforce programs", compareType: "programs", selectedIds: ["clean-energy-workforce-training", "summer-stem-initiative"] },
  { key: "funding-across-counties", label: "Compare funding across counties", compareType: "counties", selectedIds: ["franklin-county", "delaware-county", "licking-county"] },
  { key: "provider-evidence-coverage", label: "Compare provider evidence coverage", compareType: "providers", selectedIds: ["community-future-network", "central-ohio-workforce-collaborative", "youth-opportunity-network"] },
  { key: "compatible-employment-outcomes", label: "Compare compatible employment outcomes", compareType: "outcomes", selectedIds: ["employment-placement", "training-completion"] },
];

export const QUICK_ACTIONS = [
  { key: "programs", label: "Compare programs", compareType: "programs" },
  { key: "providers", label: "Compare providers", compareType: "providers" },
  { key: "counties", label: "Compare counties", compareType: "counties" },
  { key: "outcomes", label: "Compare outcomes", compareType: "outcomes" },
];

// ---------------------------------------------------------------
// DEMO comparison logic only — illustrates the kind of compatibility
// reasoning CivicSure will apply in production, not a production
// policy. Operates purely on the comparability fields above.
// ---------------------------------------------------------------
function allEqual(values) {
  return values.every((v) => v === values[0]);
}

export function computeComparability(entities) {
  const periods = entities.map((e) => e.comparability.reportingPeriod);
  const fundingTypes = entities.map((e) => e.comparability.fundingType);
  const populations = entities.map((e) => e.comparability.populationDefinition);
  const geoScopes = entities.map((e) => e.comparability.geographicScope);
  const categories = entities.map((e) => e.comparability.category);
  const methodologies = entities.map((e) => `${e.methodology.name} v${e.methodology.version}`);
  const coveragePercents = entities.map((e) => e.evidenceCoveragePercent);
  const coverageSpread = Math.max(...coveragePercents) - Math.min(...coveragePercents);

  const samePeriod = allEqual(periods);
  const sameFundingType = allEqual(fundingTypes);
  const samePopulation = allEqual(populations);
  const sameGeoScope = allEqual(geoScopes);
  const sameCategory = allEqual(categories);
  const sameMethodology = allEqual(methodologies);
  const similarCoverage = coverageSpread <= 10;

  let status = "compatible";
  if (!sameCategory) {
    status = "not-comparable";
  } else if (!sameMethodology || !samePopulation) {
    status = "limited";
  } else if (!samePeriod || !sameFundingType || !similarCoverage) {
    status = "mostly-compatible";
  }

  const STATUS_LABELS = {
    compatible: "Compatible",
    "mostly-compatible": "Mostly Compatible",
    limited: "Limited Comparison",
    "not-comparable": "Not Directly Comparable",
  };

  const EXPLANATIONS = {
    compatible:
      "These entities share the same category, reporting period, population definition, and methodology. Funding, delivery, and outcome comparisons can be interpreted directly.",
    "mostly-compatible":
      "These entities share the same category, population, and methodology, but differ in reporting period, funding type, or evidence coverage. Compare outcome rates with that context in mind.",
    limited:
      "These entities serve different populations and/or use different outcome measurement methodologies. Funding and delivery can be compared, but outcome rates should not be interpreted as direct performance rankings.",
    "not-comparable":
      "These entities are different categories and are not directly comparable. Use this view to see each entity's own figures side by side, not to rank them against each other.",
  };

  const checks = [
    { key: "period", state: samePeriod ? "pass" : "warn", label: samePeriod ? "Same reporting period" : "Different reporting periods" },
    { key: "funding-type", state: sameFundingType ? "pass" : "warn", label: sameFundingType ? "Similar funding type" : "Different funding types" },
    { key: "population", state: samePopulation ? "pass" : "warn", label: samePopulation ? "Same participant populations" : "Different participant populations" },
    { key: "methodology", state: sameMethodology ? "pass" : "warn", label: sameMethodology ? "Same outcome definitions" : "Different outcome definitions" },
    { key: "coverage", state: similarCoverage ? "pass" : "warn", label: similarCoverage ? "Similar evidence coverage" : "Different evidence coverage" },
  ];

  const rules = [
    { key: "period", label: "Reporting period", value: samePeriod ? "Same" : "Different" },
    { key: "methodology", label: "Outcome methodology", value: sameMethodology ? "Same" : "Different" },
    { key: "population", label: "Population definition", value: samePopulation ? "Compatible" : "Different" },
    { key: "geography", label: "Geographic scope", value: sameGeoScope ? "Compatible" : "Different" },
    { key: "evidence-threshold", label: "Evidence threshold", value: similarCoverage ? "Compatible" : "Different" },
    { key: "category", label: `${entities[0]?.entityTypeLabel || "Entity"} category`, value: sameCategory ? "Same" : "Different" },
  ];

  return { status, statusLabel: STATUS_LABELS[status], explanation: EXPLANATIONS[status], checks, rules, sameMethodology, coverageSpread };
}

export function buildDifferenceExplanations(entities) {
  const c = computeComparability(entities);
  const reasons = [];
  if (c.rules.find((r) => r.key === "period").value === "Different") reasons.push("These entities report on different reporting periods.");
  if (c.rules.find((r) => r.key === "population").value === "Different") reasons.push("These entities serve different populations.");
  if (!c.sameMethodology) reasons.push("These entities use different outcome measurement methodologies or windows.");
  if (c.coverageSpread > 10) reasons.push("Evidence coverage differs meaningfully between these entities.");
  if (c.rules.find((r) => r.key === "geography").value === "Different") reasons.push("These entities operate at different geographic scopes.");
  const fundingTypes = entities.map((e) => e.comparability.fundingType);
  if (!allEqual(fundingTypes)) reasons.push("These entities are funded through different funding types or sources.");
  if (reasons.length === 0) {
    reasons.push("No major definitional differences were found among the selected entities for the fields tracked in this demo.");
  }
  return reasons;
}

export function buildComparisonLimitations(entities) {
  const limitations = [];
  const pendingCount = entities.filter((e) => e.assurance.evidenceStatus === "evidence-pending" || e.assurance.evidenceStatus === "open-exception").length;
  if (pendingCount > 0) {
    limitations.push(`${pendingCount} of ${entities.length} selected entities have outcome evidence still under review.`);
  }
  const periods = entities.map((e) => e.comparability.reportingPeriod);
  if (!allEqual(periods)) {
    limitations.push("One or more selected entities use a different reporting period.");
  }
  const coveragePercents = entities.map((e) => e.evidenceCoveragePercent);
  const min = Math.min(...coveragePercents);
  const max = Math.max(...coveragePercents);
  if (min !== max) {
    limitations.push(`Evidence coverage ranges from ${min}% to ${max}% across the selected entities.`);
  }
  if (limitations.length === 0) {
    limitations.push("No comparison limitations were identified among the selected entities for the fields tracked in this demo.");
  }
  return limitations;
}

export const ABOUT_COMPARISON_POINTS = [
  "Comparisons depend on compatible definitions — the same outcome, the same population, and the same measurement window.",
  "A higher number is not automatically better. Different programs serve different populations under different constraints.",
  "Different populations may make outcome comparisons misleading, even when the underlying numbers look similar.",
  "Evidence coverage must be considered alongside any rate — a rate built on low coverage is less certain than one built on high coverage.",
  "Methodology matters. Two outcomes with the same name can be measured differently.",
  "Reporting periods matter. Comparing a full fiscal year to a partial year can distort the comparison.",
  "CivicSure does not create rankings from incomparable data — this page shows differences, not winners.",
];

export const ABOUT_DATA_FIELDS = {
  sourceAuthority: "Ohio Department of Workforce Development / CivicSure Public Disclosure (demo)",
  reportingPeriod: "FY2025–FY2026 (varies by selected entity; see each entity's own reporting period)",
  methodologyVersions: "Varies by entity — see the Methodology comparison section for each selected entity's methodology name and version.",
  lastSourceUpdate: "2026-08-28",
  evaluationDate: "2026-08-28",
  evidenceCoverage: "Varies by entity — see the Evidence comparison section for each selected entity's coverage figure.",
  limitations: "This is demo data only. Every figure, status, and comparability judgment on this page is illustrative and does not represent real programs, providers, counties, or outcomes.",
  dataDictionary:
    "\"Compatible\" means the compared entities share the fields this demo tracks (category, reporting period, population, methodology). \"Not Directly Comparable\" means at least one of those fields differs in a way that makes a rate comparison misleading.",
};
