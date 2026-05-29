function normalize(value) {
  return String(value || "").toLowerCase().trim().replace(/[-\s]+/g, "_");
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getAgeDays(item = {}, now = new Date()) {
  const raw = item.created_at || item.createdAt || item.created;
  const created = parseDate(raw);
  if (!created) return 0;
  return Math.max(0, Math.floor((now.getTime() - created.getTime()) / 86400000));
}

function isAssigned(item = {}) {
  const assigned =
    item.assigned_user_id ||
    item.assignedUserId ||
    item.assigned_to ||
    item.assignee ||
    item.assigned ||
    item.assignment;

  const value = normalize(assigned);
  return Boolean(assigned) && value !== "unassigned" && value !== "none" && value !== "—";
}

function isHighPriority(item = {}) {
  const priority = normalize(item.priority || item.urgency || item.urgency_level);
  return priority === "high" || priority === "urgent" || priority === "critical";
}

export function buildLifecycleReferralSignal(item = {}, options = {}) {
  const now = options.now || new Date();
  const status = normalize(item.status);
  const ageDays = getAgeDays(item, now);
  const assigned = isAssigned(item);
  const highPriority = isHighPriority(item);

  if (!assigned && !["closed", "completed"].includes(status)) {
    return {
      label: "Needs Assignment",
      tone: "blocked",
      stageMeaning: "This referral needs an owner before the workflow can move cleanly.",
      nextAction: "Assign a responsible operator or partner.",
      blockers: ["missing_assignment"],
      ageDays,
    };
  }

  if (ageDays >= 7 && !["resolved", "closed", "completed"].includes(status)) {
    return {
      label: "Aging Risk",
      tone: "blocked",
      stageMeaning: "This referral is getting old before resolution.",
      nextAction: "Review immediately and document the next action.",
      blockers: ["aging_referral"],
      ageDays,
    };
  }

  if (status === "on_hold" || status === "hold" || status === "blocked") {
    return {
      label: "On Hold",
      tone: "review",
      stageMeaning: "This referral is paused and needs a hold reason or release decision.",
      nextAction: "Review the hold reason and decide whether to resolve, escalate, or continue hold.",
      blockers: ["hold_review_required"],
      ageDays,
    };
  }

  if (status === "in_review" || status === "review") {
    return {
      label: highPriority ? "Needs Review" : "Moving Cleanly",
      tone: highPriority ? "review" : "ready",
      stageMeaning: highPriority
        ? "This high-priority referral is under review and should stay near the top of the workflow."
        : "This referral is moving through review.",
      nextAction: "Finish review and move toward resolution.",
      blockers: highPriority ? ["high_priority_review"] : [],
      ageDays,
    };
  }

  if (status === "assigned" || status === "open" || status === "new") {
    return {
      label: highPriority ? "Needs Review" : "Moving Cleanly",
      tone: highPriority ? "review" : "ready",
      stageMeaning: "This referral has entered the workflow and should move into review.",
      nextAction: "Start review and document the next action.",
      blockers: highPriority ? ["high_priority_review"] : [],
      ageDays,
    };
  }

  if (status === "resolved") {
    return {
      label: "Ready to Close",
      tone: "ready",
      stageMeaning: "This referral appears resolved and can move to closure after confirmation.",
      nextAction: "Confirm completion and close the referral.",
      blockers: [],
      ageDays,
    };
  }

  if (status === "closed" || status === "completed") {
    return {
      label: "Reportable",
      tone: "reportable",
      stageMeaning: "This referral is closed and can support reporting when evidence is available.",
      nextAction: "Include this item in Hub reporting if trace and outcome evidence are present.",
      blockers: [],
      ageDays,
    };
  }

  return {
    label: "Needs Review",
    tone: "review",
    stageMeaning: "This referral status needs operator review.",
    nextAction: "Review status, assignment, priority, and notes.",
    blockers: ["status_review_required"],
    ageDays,
  };
}

export function buildLifecycleStageSignal(stageTitle = "", items = [], options = {}) {
  const signals = items.map((item) => buildLifecycleReferralSignal(item, options));
  const blocked = signals.filter((signal) => signal.tone === "blocked");
  const review = signals.filter((signal) => signal.tone === "review");
  const reportable = signals.filter((signal) => signal.tone === "reportable");

  let label = "Moving Cleanly";
  let tone = "ready";
  let nextAction = "Continue monitoring this stage.";

  if (blocked.length) {
    label = "Stage Blocked";
    tone = "blocked";
    nextAction = "Start with aging or unassigned referrals in this stage.";
  } else if (review.length) {
    label = "Stage Needs Review";
    tone = "review";
    nextAction = "Review high-priority or on-hold referrals before reporting.";
  } else if (reportable.length && reportable.length === signals.length && signals.length > 0) {
    label = "Stage Reportable";
    tone = "reportable";
    nextAction = "This stage can support Hub reporting if evidence and trace are present.";
  }

  return {
    stageTitle,
    label,
    tone,
    count: items.length,
    blockedCount: blocked.length,
    reviewCount: review.length,
    reportableCount: reportable.length,
    nextAction,
  };
}

export function lifecycleSignalClass(tone) {
  const normalized = normalize(tone);
  if (normalized === "ready") return "rt-lifecycleSignal--ready";
  if (normalized === "reportable") return "rt-lifecycleSignal--reportable";
  if (normalized === "review") return "rt-lifecycleSignal--review";
  if (normalized === "blocked") return "rt-lifecycleSignal--blocked";
  return "rt-lifecycleSignal--neutral";
}
