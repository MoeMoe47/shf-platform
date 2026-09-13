import { useCallback, useEffect, useMemo, useState } from "react";
import { createExperienceState, readExperienceState, transitionExperienceState, writeExperienceState } from "./experienceState";
import { emitOrientationExperienceEvent } from "./telemetry";

const EXPERIENCE_API_BASE = import.meta.env?.VITE_SHS_API_BASE || "/api";

function stepId(step, index) { return step?.stepId || step?.id || `step-${index + 1}`; }

export default function useOrientationRuntime({ orientation, tour = null, resolution = null, scope = {}, onTelemetry = null } = {}) {
  const steps = useMemo(() => [...(tour?.steps || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [tour]);
  const stateScope = useMemo(() => ({ userId: scope.userId || "anonymous", organizationId: scope.organizationId || "unknown-org", orientationId: orientation?.orientationId || "unknown", orientationVersion: orientation?.version || 1, tourId: tour?.tourId || null, tourVersion: tour?.version || 1 }), [scope.userId, scope.organizationId, orientation?.orientationId, orientation?.version, tour?.tourId, tour?.version]);
  const [experience, setExperience] = useState(() => createExperienceState(readExperienceState(stateScope) || {}));
  const [active, setActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setExperience(createExperienceState(readExperienceState(stateScope) || {})); setActive(false); setCurrentIndex(0);
    if (!scope.userId || !scope.organizationId || typeof fetch !== "function") return undefined;
    const params = new URLSearchParams({ orientationId: stateScope.orientationId, orientationVersion: String(stateScope.orientationVersion) });
    if (stateScope.tourId) { params.set("tourId", stateScope.tourId); params.set("tourVersion", String(stateScope.tourVersion)); }
    fetch(`${EXPERIENCE_API_BASE}/orientation/experience?${params.toString()}`, { credentials: "include" }).then((response) => response.ok ? response.json() : null).then((payload) => {
      if (cancelled || !payload?.data?.state) return;
      const serverState = createExperienceState(payload.data.state);
      setExperience(serverState);
      writeExperienceState(stateScope, serverState);
      const restoredIndex = steps.findIndex((step, index) => stepId(step, index) === serverState.currentStepId);
      if (restoredIndex >= 0 && (serverState.status === "STARTED" || serverState.status === "PAUSED")) setCurrentIndex(restoredIndex);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [stateScope, scope.userId, scope.organizationId, steps]);
  const persist = useCallback((action, patch = {}) => {
    const next = transitionExperienceState(experience, action, patch);
    setExperience(next); writeExperienceState(stateScope, next);
    emitOrientationExperienceEvent({ OFFER: "orientation.offered", START: "orientation.started", PROGRESS: "tour.step_viewed", PAUSE: "orientation.dismissed", RESUME: "orientation.resumed", SKIP: "orientation.skipped", DISMISS: "orientation.dismissed", COMPLETE: "orientation.completed", RESTART: "orientation.started", WHATS_CHANGED_SEEN: "whats_changed.viewed" }[action], { ...stateScope, stepId: patch.currentStepId }, onTelemetry);
    if (scope.userId && scope.organizationId && typeof fetch === "function") fetch(`${EXPERIENCE_API_BASE}/orientation/experience`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, orientationId: stateScope.orientationId, orientationVersion: stateScope.orientationVersion, tourId: stateScope.tourId, tourVersion: stateScope.tourVersion, currentStepId: patch.currentStepId, lastRoute: patch.lastRoute, lastDestinationId: patch.lastDestinationId }) }).catch(() => undefined);
    return next;
  }, [experience, stateScope, onTelemetry]);
  const start = useCallback((index = 0) => { setCurrentIndex(Math.max(0, index)); setActive(true); persist("START", { currentStepId: stepId(steps[index], index), lastRoute: typeof window !== "undefined" ? window.location.pathname : null }); }, [persist, steps]);
  const next = useCallback(() => { if (currentIndex >= steps.length - 1) { setActive(false); persist("COMPLETE", { currentStepId: stepId(steps[currentIndex], currentIndex) }); return; } const index = currentIndex + 1; setCurrentIndex(index); persist("PROGRESS", { currentStepId: stepId(steps[index], index) }); }, [currentIndex, persist, steps]);
  const previous = useCallback(() => setCurrentIndex((index) => Math.max(0, index - 1)), []);
  const close = useCallback((action = "DISMISS") => { setActive(false); persist(action); }, [persist]);
  const api = useMemo(() => ({ active, currentIndex, currentStep: steps[currentIndex] || null, steps, experience, resolution, start, resume: () => { setActive(true); persist("RESUME", { currentStepId: experience.currentStepId }); }, pause: () => close("PAUSE"), next, previous, skip: () => close("SKIP"), dismiss: () => close("DISMISS"), restart: () => { setCurrentIndex(0); setActive(true); persist("RESTART", { currentStepId: stepId(steps[0], 0) }); }, complete: () => close("COMPLETE"), markWhatsChangedSeen: () => persist("WHATS_CHANGED_SEEN") }), [active, currentIndex, steps, experience, resolution, start, persist, close, next, previous]);
  return api;
}
