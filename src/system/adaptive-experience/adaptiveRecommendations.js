import { getAdaptiveEvents, summarizeAdaptiveEvents } from "./adaptiveTracker";

export function buildFeatureUsageMap(events = getAdaptiveEvents()) {
  const summary = summarizeAdaptiveEvents(events);

  return Object.entries(summary.byTarget)
    .map(([target, count]) => ({
      target,
      count,
      strength: count >= 10 ? "high" : count >= 4 ? "medium" : "low",
    }))
    .sort((a, b) => b.count - a.count);
}

export function detectFrictionSignals(events = getAdaptiveEvents()) {
  const signals = [];

  const abandonedForms = events.filter(
    (event) => event.eventType === "form_abandoned"
  );

  const ignoredRecommendations = events.filter(
    (event) => event.eventType === "recommendation_ignored"
  );

  const dismissedAlerts = events.filter(
    (event) => event.eventType === "alert_dismissed"
  );

  if (abandonedForms.length >= 2) {
    signals.push({
      type: "form_friction",
      severity: "medium",
      message:
        "Users are abandoning forms. Review field clarity, required steps, and guidance text.",
      count: abandonedForms.length,
    });
  }

  if (ignoredRecommendations.length >= 3) {
    signals.push({
      type: "recommendation_trust_gap",
      severity: "medium",
      message:
        "Users are ignoring recommendations. Review explanation quality, confidence labels, and timing.",
      count: ignoredRecommendations.length,
    });
  }

  if (dismissedAlerts.length >= 3) {
    signals.push({
      type: "alert_noise",
      severity: "low",
      message:
        "Users are dismissing alerts. Review whether alerts are too frequent or not urgent enough.",
      count: dismissedAlerts.length,
    });
  }

  return signals;
}

export function buildAdaptiveRecommendations(events = getAdaptiveEvents()) {
  const usageMap = buildFeatureUsageMap(events);
  const frictionSignals = detectFrictionSignals(events);
  const recommendations = [];

  const topFeature = usageMap[0];

  if (topFeature && topFeature.count >= 5) {
    recommendations.push({
      type: "layout_priority",
      confidence: 0.82,
      recommendation: `Consider making "${topFeature.target}" more visible in the next dashboard version.`,
      reason: `This feature has the highest recorded usage with ${topFeature.count} interactions.`,
    });
  }

  frictionSignals.forEach((signal) => {
    recommendations.push({
      type: "friction_reduction",
      confidence: signal.severity === "medium" ? 0.78 : 0.65,
      recommendation: signal.message,
      reason: `Detected ${signal.count} related friction events.`,
    });
  });

  if (!recommendations.length) {
    recommendations.push({
      type: "baseline",
      confidence: 0.6,
      recommendation:
        "Continue collecting usage data before making major dashboard changes.",
      reason:
        "Not enough strong usage or friction patterns have been detected yet.",
    });
  }

  return recommendations;
}

export function buildNextVersionUpgradeMemo(
  events = getAdaptiveEvents(),
  surface = "system"
) {
  return {
    title: "Adaptive Experience Next-Version Upgrade Memo",
    surface,
    generatedAt: new Date().toISOString(),
    featureUsageMap: buildFeatureUsageMap(events),
    frictionSignals: detectFrictionSignals(events),
    recommendations: buildAdaptiveRecommendations(events),
  };
}
