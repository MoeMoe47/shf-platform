function normalize(value) {
  return String(value || "").toLowerCase().trim().replace(/[-\s]+/g, "_");
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((number(numerator) / number(denominator, 1)) * 100);
}

function isClosed(status) {
  const s = normalize(status);
  return s === "closed" || s === "completed";
}

function isResolved(status) {
  const s = normalize(status);
  return s === "resolved" || s === "closed" || s === "completed";
}

function isReview(status) {
  const s = normalize(status);
  return s === "in_review" || s === "review" || s === "started_review";
}

function isHold(status) {
  const s = normalize(status);
  return s === "on_hold" || s === "hold" || s === "blocked";
}

function isAssigned(item = {}) {
  const assigned =
    item.assigned ||
    item.assigned_user_id ||
    item.assignedUserId ||
    item.assigned_to ||
    item.assignee ||
    item.assignment;

  return Boolean(assigned) && normalize(assigned) !== "unassigned";
}

function isHighPriority(item = {}) {
  const priority = normalize(item.priority || item.urgency || item.urgency_level);
  return priority === "high" || priority === "urgent" || priority === "critical";
}

function getCreatedDate(item = {}) {
  const raw = item.created_at || item.createdAt || item.created || item.createdDate;
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function ageDays(item = {}, now = new Date()) {
  const created = getCreatedDate(item);
  if (!created) return 0;
  return Math.max(0, Math.floor((now.getTime() - created.getTime()) / 86400000));
}

export function buildHubWorkflowReadiness({
  referrals = [],
  partners = [],
  reports = [],
  truthSummary = null,
  source = "hub",
  now = new Date(),
} = {}) {
  const totalReferrals = referrals.length;
  const openReferrals = referrals.filter((item) => !isClosed(item.status));
  const assignedReferrals = referrals.filter(isAssigned);
  const unassignedReferrals = referrals.filter((item) => !isAssigned(item));
  const reviewReferrals = referrals.filter((item) => isReview(item.status));
  const holdReferrals = referrals.filter((item) => isHold(item.status));
  const resolvedReferrals = referrals.filter((item) => isResolved(item.status));
  const highPriorityReferrals = referrals.filter(isHighPriority);
  const agingReferrals = referrals.filter((item) => !isResolved(item.status) && ageDays(item, now) >= 7);

  const capacityRiskPartners = partners.filter((partner) => number(partner.capacity, 100) < 75);
  const lowResponsePartners = partners.filter((partner) => number(partner.responseSpeed, 100) < 80);
  const lowOutcomePartners = partners.filter((partner) => number(partner.verifiedOutcomeRate, 100) < 80);

  const reportReadyCount = number(truthSummary?.reportReadyCount);
  const pendingCount = number(truthSummary?.pendingCount);
  const verifiedCount = number(truthSummary?.verifiedCount);
  const readinessPercent = truthSummary
    ? number(truthSummary.readinessPercent)
    : pct(resolvedReferrals.length, totalReferrals);

  const assignmentCoverage = pct(assignedReferrals.length, totalReferrals);
  const completionRate = pct(resolvedReferrals.length, totalReferrals);
  const partnerCapacityScore = partners.length ? 100 - pct(capacityRiskPartners.length, partners.length) : 0;

  const blockers = [];

  if (unassignedReferrals.length) blockers.push("unassigned_referrals");
  if (holdReferrals.length) blockers.push("referrals_on_hold");
  if (agingReferrals.length) blockers.push("aging_referrals");
  if (capacityRiskPartners.length) blockers.push("partner_capacity_risk");
  if (lowResponsePartners.length) blockers.push("partner_response_risk");
  if (pendingCount) blockers.push("reporting_pending_records");

  const steps = [
    {
      key: "intake",
      label: "Referral Intake",
      status: totalReferrals > 0 ? "complete" : "pending",
      detail: `${totalReferrals} referrals available.`,
    },
    {
      key: "assignment",
      label: "Assignment Coverage",
      status: assignmentCoverage >= 80 ? "complete" : assignmentCoverage >= 50 ? "review" : "blocked",
      detail: `${assignmentCoverage}% assigned coverage.`,
    },
    {
      key: "review",
      label: "Review Flow",
      status: reviewReferrals.length || holdReferrals.length ? "review" : "complete",
      detail: `${reviewReferrals.length} in review, ${holdReferrals.length} on hold.`,
    },
    {
      key: "aging",
      label: "Aging Pressure",
      status: agingReferrals.length ? "blocked" : "complete",
      detail: `${agingReferrals.length} aging referrals need attention.`,
    },
    {
      key: "capacity",
      label: "Partner Capacity",
      status: capacityRiskPartners.length ? "review" : "complete",
      detail: `${capacityRiskPartners.length} partners below capacity threshold.`,
    },
    {
      key: "verified_outcomes",
      label: "Verified Outcomes",
      status: verifiedCount > 0 || completionRate >= 60 ? "complete" : "review",
      detail: `${verifiedCount} verified records / ${completionRate}% completion.`,
    },
    {
      key: "reporting",
      label: "Reporting Ready",
      status: readinessPercent >= 80 ? "complete" : readinessPercent >= 50 ? "review" : "blocked",
      detail: `${readinessPercent}% reporting readiness.`,
    },
  ];

  const completeCount = steps.filter((step) => step.status === "complete").length;
  const reviewCount = steps.filter((step) => step.status === "review").length;
  const blockedCount = steps.filter((step) => step.status === "blocked").length;
  const workflowReadinessPercent = Math.round((completeCount / steps.length) * 100);

  let headlineStatus = "ready";
  let headline = "Hub Workflow Ready";
  let recommendedNextAction = "Continue operating the Hub workflow and generate reports when needed.";

  if (blockedCount > 0) {
    headlineStatus = "blocked";
    headline = "Hub Workflow Blocked";
    recommendedNextAction =
      "Start with unassigned, aging, or on-hold referrals before reporting this workflow externally.";
  } else if (reviewCount > 0) {
    headlineStatus = "review";
    headline = "Hub Workflow Needs Review";
    recommendedNextAction =
      "Review partner capacity, active referrals, and report-readiness before final publication.";
  }

  if (highPriorityReferrals.length > 0 && headlineStatus !== "blocked") {
    headlineStatus = "review";
    headline = "High Priority Referral Attention";
    recommendedNextAction = "Review high-priority referrals in the Action Queue before moving to reports.";
  }

  return {
    source,
    headline,
    headlineStatus,
    workflowReadinessPercent,
    recommendedNextAction,
    blockers,
    steps,
    metrics: {
      totalReferrals,
      openReferrals: openReferrals.length,
      assignedReferrals: assignedReferrals.length,
      unassignedReferrals: unassignedReferrals.length,
      highPriorityReferrals: highPriorityReferrals.length,
      reviewReferrals: reviewReferrals.length,
      holdReferrals: holdReferrals.length,
      agingReferrals: agingReferrals.length,
      resolvedReferrals: resolvedReferrals.length,
      assignmentCoverage,
      completionRate,
      partnerCount: partners.length,
      capacityRiskPartners: capacityRiskPartners.length,
      lowResponsePartners: lowResponsePartners.length,
      lowOutcomePartners: lowOutcomePartners.length,
      partnerCapacityScore,
      reportReadyCount,
      pendingCount,
      verifiedCount,
      readinessPercent,
      reportsCount: reports.length,
    },
  };
}

export function hubWorkflowStatusClass(status) {
  const s = normalize(status);
  if (s === "ready" || s === "complete") return "hub-workflow-readiness--ready";
  if (s === "review") return "hub-workflow-readiness--review";
  if (s === "blocked") return "hub-workflow-readiness--blocked";
  return "hub-workflow-readiness--pending";
}

export function hubWorkflowStepClass(status) {
  const s = normalize(status);
  if (s === "complete") return "is-complete";
  if (s === "review") return "is-review";
  if (s === "blocked") return "is-blocked";
  return "is-pending";
}
