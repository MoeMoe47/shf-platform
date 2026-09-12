import { useCallback, useEffect, useMemo, useState } from "react";

export default function useTour(totalSteps = 0, context = null) {
  const [state, setState] = useState({
    isActive: false,
    currentStep: 0,
    mode: "guided",
    completed: false,
    dismissed: false,
    context,
  });

  useEffect(() => {
    setState((current) => ({ ...current, context }));
  }, [context]);

  const startTour = useCallback(() => {
    setState((s) => ({
      ...s,
      isActive: true,
      currentStep: 0,
      completed: false,
      dismissed: false,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState((s) => {
      const next = s.currentStep + 1;
      if (totalSteps > 0 && next >= totalSteps) {
        return {
          ...s,
          isActive: false,
          currentStep: totalSteps - 1,
          completed: true,
        };
      }
      return { ...s, currentStep: next };
    });
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setState((s) => ({
      ...s,
      currentStep: Math.max(0, s.currentStep - 1),
    }));
  }, []);

  const goToStep = useCallback((index) => {
    setState((s) => ({
      ...s,
      isActive: true,
      currentStep: Math.max(0, index),
    }));
  }, []);

  const endTour = useCallback(() => {
    setState((s) => ({
      ...s,
      isActive: false,
      completed: true,
    }));
  }, []);

  const dismissTour = useCallback(() => {
    setState((s) => ({
      ...s,
      isActive: false,
      dismissed: true,
    }));
  }, []);

  const api = useMemo(
    () => ({
      state,
      startTour,
      nextStep,
      prevStep,
      goToStep,
      endTour,
      dismissTour,
    }),
    [state, startTour, nextStep, prevStep, goToStep, endTour, dismissTour]
  );

  return api;
}
