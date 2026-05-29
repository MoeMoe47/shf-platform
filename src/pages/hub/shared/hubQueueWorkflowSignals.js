function normalize(value) {
  return String(value || "").toLowerCase().trim().replace(/[-\s]+/g, "_");
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getAgeDays(item = {}, now = new Date()) {
  const created =
    parseDate(item.created_at) ||
    parseDate(item.createdAt) ||
    parseDate(item.created);

  if (!created) return 0;

  return Math.max(0, Math.floor((now.getTime() - created.getTime()) / 86400000));
}

function isAssigned(item = {}) {
  const assigned =
    item.assigned ||
    item.assigned_user_id ||
    item.assignedUserId ||
    item.assigned_to ||
    item.assignee ||
    item.assignment;

  const value = normalize(assigned);

  return Boolean(assigned) && value !== "unassigned" && value !== "none" && value !== "—";
}

function isHighPriority(item = {}) {
  const priority = normalize(item.priority || item.urgency || item.urgency_level);
  return priority === "high" || priority === "urgent" || priority === "critical" || priority === "high_priority";
}

export function buildQueueWorkflowSignal(item = {}, options = {}) {
  const now = options.now || new Date();
  const status = normalize(item.status);
  const assignment = normalize(item.assignment);
  const age = getAgeDays(item, now);
  const assigned = isAssigned(item);
  const highPriority = isHighPriority(item);

  if (!assigned) {
    return {
      label: "Needs Assignment",
      tone: "blocked",
      reason: "No owner is attached to this referral.",
      nextAction: "Assign this referral before review or closure.",
      blockers: ["missing_assignment"],
      ageDays: age,
    };
  }

  if (age >= 7 && !["resolved", "closed", "completed"].includes(status)) {
    return {
      label: "Aging Risk",
      tone: "blocked",
      reason: "This referral is aging before resolution.",
      nextAction: "Review immediately, contact the receiver, or place a documented hold.",
      blockers: ["aging_referral"],
      ageDays: age,
    };
  }

  if (status === "on_hold" || status === "hold" || status === "blocked") {
    return {
      label: "Needs Review",
      tone: "review",
      reason: "This referral is currently on hold or blocked.",
      nextAction: "Review hold reason and decide whether to resolve, escalate, or close.",
      blockers: ["hold_review_required"],
      ageDays: age,
    };
  }

  if (status === "assigned" || assignment === "assigned") {
    return {
      label: highPriority ? "Needs Review" : "Ready for Review",
      tone: highPriority ? "review" : "ready",
      reason: highPriority
        ? "High-priority assigned referral should be reviewed next."
        : "Referral has an owner and can move into review.",
      nextAction: "Start review and document next action.",
      blockers: highPriority ? ["high_priority_review"] : [],
      ageDays: age,
    };
  }

  if (status === "in_review" || status === "review") {
    return {
      label: "Ready to Resolve",
      tone: "ready",
      reason: "Referral is actively under review.",
      nextAction: "Resolve if service was completed or place on hold with a reason.",
      blockers: [],
      ageDays: age,
    };
  }

  if (status === "resolved") {
    return {
      label: "Ready to Close",
      tone: "ready",
      reason: "Referral is resolved and ready for closure.",
      nextAction: "Close the referral after final confirmation.",
      blockers: [],
      ageDays: age,
    };
  }

  if (status === "closed" || status === "completed") {
    return {
      label: "Reportable",
      tone: "reportable",
      reason: "Referral is closed and can support reporting.",
      nextAction: "Include in Hub reports when trace and outcome evidence are available.",
      blockers: [],
      ageDays: age,
    };
  }

  return {
    label: "Needs Review",
    tone: "review",
    reason: "Referral status needs operator review.",
    nextAction: "Review status, assignment, and next action.",
    blockers: ["status_review_required"],
    ageDays: age,
  };
}

export function queueWorkflowSignalClass(tone) {
  const normalized = normalize(tone);
  if (normalized === "ready") return "paq2-workflowSignal--ready";
  if (normalized === "reportable") return "paq2-workflowSignal--reportable";
  if (normalized === "review") return "paq2-workflowSignal--review";
  if (normalized === "blocked") return "paq2-workflowSignal--blocked";
  return "paq2-workflowSignal--neutral";
}
