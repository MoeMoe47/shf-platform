import { NEED_CATEGORIES, SERVICE_LANES, SIGNAL_TYPES } from "./growthSignalTypes.js";

export const mockHubGrowthSignals = [
  {
    id: "signal_cic_youth_family",
    source: "hub",
    sourceSurface: "Community Impact Hub",
    sourcePartnerId: "partner_cic_001",
    sourcePartnerName: "Community Impact Center Partner",
    signalType: SIGNAL_TYPES.unmetNeedCluster,
    needCategory: NEED_CATEGORIES.youthFamilyCheckin,
    description: "Repeated youth and family support referrals show a need for check-ins, caregiver support, and coordinated follow-up.",
    priority: "high",
    estimatedValue: 25000,
    volume: 18,
    consentStatus: "mixed",
    partnerResponseRate: 82,
    completionHistory: 74,
    createdAt: "2026-05-05T12:00:00.000Z",
  },
  {
    id: "signal_med_access_barrier",
    source: "hub",
    sourceSurface: "Hub Referral Queue",
    sourcePartnerId: "partner_health_access_002",
    sourcePartnerName: "Community Care Co.",
    signalType: SIGNAL_TYPES.pharmacyAccessNeed,
    needCategory: NEED_CATEGORIES.medicationAccess,
    description: "Multiple partner referrals mention medication access and delivery barriers that may fit VerifiedRx Logistics.",
    priority: "high",
    estimatedValue: 50000,
    volume: 11,
    consentStatus: "confirmed",
    partnerResponseRate: 76,
    completionHistory: 68,
    createdAt: "2026-05-05T12:05:00.000Z",
  },
  {
    id: "signal_workforce_readiness",
    source: "hub",
    sourceSurface: "Hub Lifecycle Tracker",
    sourcePartnerId: "partner_workforce_003",
    sourcePartnerName: "Workforce Nonprofit Partner",
    signalType: SIGNAL_TYPES.employerDemand,
    needCategory: NEED_CATEGORIES.workforceReadiness,
    description: "Referral activity shows several participants are stable enough for training, employer matching, and retention tracking.",
    priority: "medium",
    estimatedValue: 35000,
    volume: 15,
    consentStatus: "confirmed",
    partnerResponseRate: 71,
    completionHistory: 63,
    createdAt: "2026-05-05T12:10:00.000Z",
  },
  {
    id: "signal_reporting_coordination",
    source: "hub",
    sourceSurface: "Hub Reports",
    sourcePartnerId: "partner_reporting_004",
    sourcePartnerName: "Collaborative Reporting Partner",
    signalType: SIGNAL_TYPES.reportingNeed,
    needCategory: NEED_CATEGORIES.reportingCoordination,
    description: "Partners need shared referral tracking, unmet-needs reporting, and funder-ready proof across organizations.",
    priority: "high",
    estimatedValue: 75000,
    volume: 7,
    consentStatus: "not_required",
    partnerResponseRate: 88,
    completionHistory: 79,
    createdAt: "2026-05-05T12:15:00.000Z",
  },
  {
    id: "signal_recovery_support",
    source: "hub",
    sourceSurface: "Hub Partner Action Queue",
    sourcePartnerId: "partner_recovery_005",
    sourcePartnerName: "Recovery Housing Partner",
    signalType: SIGNAL_TYPES.pilotCandidate,
    needCategory: NEED_CATEGORIES.recoverySupport,
    description: "A recovery housing partner needs participant check-ins, missed-contact alerts, and staff follow-up visibility.",
    priority: "medium",
    estimatedValue: 18000,
    volume: 24,
    consentStatus: "confirmed",
    partnerResponseRate: 84,
    completionHistory: 72,
    createdAt: "2026-05-05T12:20:00.000Z",
  },
];

const laneBaseWeights = {
  [NEED_CATEGORIES.youthFamilyCheckin]: {
    "Kermit": 38,
    "SHF Programs": 30,
    "SHS Infrastructure": 22,
  },
  [NEED_CATEGORIES.recoverySupport]: {
    "Kermit": 42,
    "SHS Infrastructure": 20,
    "SHF Programs": 16,
  },
  [NEED_CATEGORIES.medicationAccess]: {
    "VerifiedRx Logistics": 45,
    "SHS Infrastructure": 20,
    "Kermit": 8,
  },
  [NEED_CATEGORIES.workforceReadiness]: {
    "Workforce Pipeline": 44,
    "SHF Programs": 20,
    "SHS Infrastructure": 18,
  },
  [NEED_CATEGORIES.reportingCoordination]: {
    "SHS Infrastructure": 48,
    "SHF Programs": 14,
    "Workforce Pipeline": 8,
  },
  [NEED_CATEGORIES.fundingSupport]: {
    "SHF Programs": 38,
    "SHS Infrastructure": 28,
    "Kermit": 10,
  },
  [NEED_CATEGORIES.employerPlacement]: {
    "Workforce Pipeline": 46,
    "SHS Infrastructure": 18,
  },
  [NEED_CATEGORIES.hubCoordination]: {
    "SHS Infrastructure": 50,
    "SHF Programs": 12,
    "Kermit": 8,
  },
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizePriority(priority) {
  if (priority === "high") return 18;
  if (priority === "medium") return 10;
  return 4;
}

function consentPenalty(consentStatus) {
  if (consentStatus === "confirmed" || consentStatus === "not_required") return 0;
  if (consentStatus === "mixed") return 12;
  if (consentStatus === "pending") return 20;
  return 8;
}

function estimateLaneFit(signal) {
  const weights = laneBaseWeights[signal.needCategory] || {};
  const lanes = SERVICE_LANES.map((lane) => {
    const base = weights[lane] || 0;
    const responseBoost = Math.max(0, (signal.partnerResponseRate || 0) - 60) * 0.18;
    const completionBoost = Math.max(0, (signal.completionHistory || 0) - 55) * 0.14;
    const volumeBoost = Math.min(12, (signal.volume || 0) * 0.45);
    const fit = clamp(base + responseBoost + completionBoost + volumeBoost + 34);
    return { lane, fit };
  });

  return lanes.sort((a, b) => b.fit - a.fit);
}

function recommendedActionFor(signal, topLanes) {
  const primary = topLanes[0]?.lane || "SHS Infrastructure";
  const secondary = topLanes[1]?.lane;

  if (signal.needCategory === NEED_CATEGORIES.medicationAccess) {
    return "Prepare a VerifiedRx medication access workflow and compliance proof-packet brief.";
  }

  if (signal.needCategory === NEED_CATEGORIES.youthFamilyCheckin) {
    return "Create a 90-day Kermit + SHF youth/family support pilot with SHS reporting.";
  }

  if (signal.needCategory === NEED_CATEGORIES.recoverySupport) {
    return "Convert this into a Kermit recovery check-in pilot with missed-contact alerts.";
  }

  if (signal.needCategory === NEED_CATEGORIES.workforceReadiness) {
    return "Create a Workforce Pipeline opportunity and confirm employer demand, wage bands, and retention goals.";
  }

  if (signal.needCategory === NEED_CATEGORIES.reportingCoordination) {
    return "Create an SHS infrastructure opportunity for shared referral tracking and funder-ready reporting.";
  }

  return `Review for ${primary}${secondary ? ` + ${secondary}` : ""} activation.`;
}

function explanationsFor(signal, topLanes, frictionRisk, conversionProbability) {
  const primary = topLanes[0]?.lane || "SHS Infrastructure";
  const reasons = [
    `${primary} has the strongest lane fit based on need category and Hub activity.`,
    `Partner response history is ${signal.partnerResponseRate || 0}%, which supports a ${conversionProbability}% conversion probability.`,
  ];

  if ((signal.volume || 0) >= 12) {
    reasons.push("Signal volume is high enough to justify a pilot or service-lane review.");
  }

  if (frictionRisk > 35) {
    reasons.push("Friction risk is elevated; confirm owner, consent, and next step before routing.");
  } else {
    reasons.push("Friction risk is manageable for Growth Engine review.");
  }

  if (topLanes[1]?.fit >= 70) {
    reasons.push(`Multi-lane fit detected: ${topLanes.slice(0, 3).map((l) => l.lane).join(" + ")}.`);
  }

  return reasons;
}

export function scoreHubSignal(signal) {
  const laneFit = estimateLaneFit(signal);
  const topLanes = laneFit.slice(0, 3);

  const priorityBase = 42 + normalizePriority(signal.priority);
  const volumeScore = Math.min(18, (signal.volume || 0) * 0.7);
  const responseScore = Math.max(0, (signal.partnerResponseRate || 0) - 55) * 0.28;
  const completionScore = Math.max(0, (signal.completionHistory || 0) - 50) * 0.22;

  const frictionRisk = clamp(
    18 +
    consentPenalty(signal.consentStatus) +
    (signal.partnerResponseRate < 70 ? 12 : 0) +
    (signal.completionHistory < 65 ? 8 : 0) -
    Math.min(8, (signal.volume || 0) * 0.2)
  );

  const priorityScore = clamp(priorityBase + volumeScore + responseScore + completionScore);
  const conversionProbability = clamp(
    38 +
    (topLanes[0]?.fit || 0) * 0.28 +
    (signal.partnerResponseRate || 0) * 0.14 +
    (signal.completionHistory || 0) * 0.1 -
    frictionRisk * 0.16
  );

  const reportReadinessPotential = clamp(
    45 +
    (signal.completionHistory || 0) * 0.18 +
    (signal.volume || 0) * 0.7 +
    (topLanes.some((l) => l.lane === "SHS Infrastructure") ? 16 : 5)
  );

  const recommendedAction = recommendedActionFor(signal, topLanes);
  const explanation = explanationsFor(signal, topLanes, frictionRisk, conversionProbability);

  return {
    signalId: signal.id,
    source: signal.source,
    sourceSurface: signal.sourceSurface,
    sourcePartnerId: signal.sourcePartnerId,
    sourcePartnerName: signal.sourcePartnerName,
    signalType: signal.signalType,
    needCategory: signal.needCategory,
    description: signal.description,
    recommendedLanes: topLanes,
    allLaneFit: laneFit,
    priorityScore,
    conversionProbability,
    frictionRisk,
    estimatedValue: signal.estimatedValue || 0,
    reportReadinessPotential,
    recommendedAction,
    explanation,
    status: "ready_for_growth_review",
    createdAt: signal.createdAt,
    scoredAt: new Date().toISOString(),
  };
}

export function scoreHubSignals(signals = mockHubGrowthSignals) {
  return signals.map(scoreHubSignal).sort((a, b) => b.priorityScore - a.priorityScore);
}
