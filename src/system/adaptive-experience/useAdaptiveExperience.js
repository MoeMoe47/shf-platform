import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAdaptiveEvents,
  summarizeAdaptiveEvents,
  trackAdaptiveEvent,
} from "./adaptiveTracker";
import { calculateDashboardExperienceScore } from "./adaptiveScoring";
import {
  buildAdaptiveRecommendations,
  buildFeatureUsageMap,
  buildNextVersionUpgradeMemo,
  detectFrictionSignals,
} from "./adaptiveRecommendations";

export function useAdaptiveExperience({
  surface,
  role = "unknown",
  dashboardVersion = "v1",
  userId = "demo-user",
  organizationId = "demo-org",
} = {}) {
  const [events, setEvents] = useState(() => getAdaptiveEvents());

  useEffect(() => {
    const handler = () => setEvents(getAdaptiveEvents());

    window.addEventListener("shs:adaptive-experience-event", handler);

    return () => {
      window.removeEventListener("shs:adaptive-experience-event", handler);
    };
  }, []);

  const track = useCallback(
    ({ eventType, target, metadata = {} }) => {
      return trackAdaptiveEvent({
        eventType,
        surface,
        target,
        role,
        dashboardVersion,
        userId,
        organizationId,
        metadata,
      });
    },
    [surface, role, dashboardVersion, userId, organizationId]
  );

  const scopedEvents = useMemo(() => {
    return surface ? events.filter((event) => event.surface === surface) : events;
  }, [events, surface]);

  const summary = useMemo(
    () => summarizeAdaptiveEvents(scopedEvents),
    [scopedEvents]
  );

  const experienceScore = useMemo(
    () => calculateDashboardExperienceScore(events, surface),
    [events, surface]
  );

  const featureUsageMap = useMemo(
    () => buildFeatureUsageMap(scopedEvents),
    [scopedEvents]
  );

  const frictionSignals = useMemo(
    () => detectFrictionSignals(scopedEvents),
    [scopedEvents]
  );

  const recommendations = useMemo(
    () => buildAdaptiveRecommendations(scopedEvents),
    [scopedEvents]
  );

  const upgradeMemo = useMemo(
    () => buildNextVersionUpgradeMemo(scopedEvents, surface),
    [scopedEvents, surface]
  );

  return {
    track,
    events: scopedEvents,
    summary,
    experienceScore,
    featureUsageMap,
    frictionSignals,
    recommendations,
    upgradeMemo,
  };
}
