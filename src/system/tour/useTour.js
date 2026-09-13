import { useCallback, useMemo } from "react";
import useOrientationRuntime from "../orientation/runtime/useOrientationRuntime";

function normalizeSteps(steps) {
  return (steps || []).map((step, index) => ({
    ...step,
    stepId: step.stepId || step.id || `step-${index + 1}`,
    order: Number.isInteger(step.order) ? step.order : index,
    body: step.body || step.content || step.description || null,
    target: step.target || { mode: "UNANCHORED" },
    missingAnchorPolicy: step.missingAnchorPolicy || "SHOW_UNANCHORED",
  }));
}

export default function useTour(totalSteps = 0, context = null, steps = []) {
  const normalizedSteps = useMemo(() => normalizeSteps(steps).slice(0, totalSteps || undefined), [steps, totalSteps]);
  const orientation = useMemo(() => ({ orientationId: context?.orientationId || `legacy:${context?.tourId || "shared"}`, version: Number(context?.orientationVersion || 1) }), [context?.orientationId, context?.tourId, context?.orientationVersion]);
  const tour = useMemo(() => ({ tourId: context?.tourId || "legacy-tour", version: Number(context?.tourVersion || 1), steps: normalizedSteps }), [context?.tourId, context?.tourVersion, normalizedSteps]);
  const runtime = useOrientationRuntime({ orientation, tour, scope: { userId: context?.userId, organizationId: context?.organizationId } });
  const startTour = useCallback((index = 0) => runtime.start(index), [runtime]);
  const nextStep = useCallback(() => runtime.next(), [runtime]);
  const prevStep = useCallback(() => runtime.previous(), [runtime]);
  const goToStep = useCallback((index) => runtime.start(index), [runtime]);
  const endTour = useCallback(() => runtime.complete(), [runtime]);
  const skipTour = useCallback(() => runtime.skip(), [runtime]);
  const dismissTour = useCallback(() => runtime.dismiss(), [runtime]);
  const state = useMemo(() => ({ isActive: runtime.active, currentStep: runtime.currentIndex, mode: "guided", completed: runtime.experience.status === "COMPLETED", dismissed: runtime.experience.status === "DISMISSED", skipped: runtime.experience.status === "SKIPPED", context, experience: runtime.experience }), [runtime.active, runtime.currentIndex, runtime.experience, context]);
  return useMemo(() => ({ state, startTour, nextStep, prevStep, goToStep, endTour, skipTour, dismissTour, pauseTour: runtime.pause, resumeTour: runtime.resume, restartTour: runtime.restart }), [state, startTour, nextStep, prevStep, goToStep, endTour, skipTour, dismissTour, runtime.pause, runtime.resume, runtime.restart]);
}
