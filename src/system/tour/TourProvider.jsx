import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useTour from "./useTour";
import TourOverlay from "./TourOverlay";
import { tourSteps as defaultTourSteps } from "./tourConfig";
import { createTourContext } from "./tourContext";
import { OrientationAccessibleAlternative } from "../orientation/runtime/OrientationGuidancePrimitives";
import "./tourStyles.css";

function clearTourBodyClasses() {
  if (typeof document === "undefined") return;

  document.body.classList.remove("tour-active");

  [...document.body.classList]
    .filter((className) => className.startsWith("tour-step-"))
    .forEach((className) => document.body.classList.remove(className));
}

export default function TourProvider({
  children,
  steps = defaultTourSteps,
  buttonLabel = "Guided Tour",
  context = null,
  onNext = null,
}) {
  const activeSteps = useMemo(() => {
    return Array.isArray(steps) && steps.length ? steps : defaultTourSteps;
  }, [steps]);

  const tourContext = createTourContext(context || {});
  const tour = useTour(activeSteps.length, tourContext, activeSteps);
  const [alternativeOpen, setAlternativeOpen] = useState(false);
  const alternativeReturnFocus = useRef(null);

  useEffect(() => {
    const handleGuidanceTourRequest = (event) => {
      const requestedTourId = event.detail?.tourId;
      if (tour.state.context?.tourId && requestedTourId && requestedTourId !== tour.state.context.tourId) return;
      if (event.detail?.action === "RESUME") tour.resumeTour();
      else if (event.detail?.action === "RESTART") tour.restartTour();
      else if (event.detail?.action === "ALTERNATIVE") setAlternativeOpen(true);
      else if (Number.isInteger(event.detail?.stepIndex)) tour.goToStep(event.detail.stepIndex);
      else tour.startTour();
    };
    window.addEventListener("dgal:tour-request", handleGuidanceTourRequest);
    return () => window.removeEventListener("dgal:tour-request", handleGuidanceTourRequest);
  }, [tour.state.context?.tourId, tour.goToStep, tour.startTour, tour.resumeTour, tour.restartTour]);

  useEffect(() => {
    clearTourBodyClasses();

    if (tour.state.isActive) {
      document.body.classList.add("tour-active");

      const step = activeSteps[tour.state.currentStep];
      if (step?.id) {
        document.body.classList.add(`tour-step-${step.id}`);
      }
    }

    return () => {
      clearTourBodyClasses();
    };
  }, [tour.state.isActive, tour.state.currentStep, activeSteps]);

  useEffect(() => {
    if (!alternativeOpen) {
      alternativeReturnFocus.current?.focus?.({ preventScroll: true });
      alternativeReturnFocus.current = null;
    }
  }, [alternativeOpen]);

  const openAlternative = () => {
    alternativeReturnFocus.current = document.activeElement;
    setAlternativeOpen(true);
  };
  const handleNext = () => {
    const nextIndex = tour.state.currentStep + 1;
    tour.nextStep();
    onNext?.({ currentIndex: tour.state.currentStep, nextIndex, step: activeSteps[nextIndex] || null });
  };
  const launchLabel = tour.state.completed ? "Replay tour" : tour.state.experience?.status === "STARTED" || tour.state.experience?.status === "PAUSED" ? "Resume tour" : buttonLabel;
  const runtimeSurface = (
    <>
      <TourOverlay
        state={tour.state}
        steps={activeSteps}
        nextStep={handleNext}
        prevStep={tour.prevStep}
        endTour={tour.endTour}
        skipTour={tour.skipTour}
        context={tour.state.context}
        onAlternative={openAlternative}
      />

      {alternativeOpen ? (
        <OrientationAccessibleAlternative
          title={`${buttonLabel} step list`}
          steps={activeSteps}
          onClose={() => setAlternativeOpen(false)}
        />
      ) : null}

      {!tour.state.isActive ? (
        <button
          type="button"
          className="tour-start-btn"
          onClick={() => {
            if (tour.state.completed) tour.restartTour();
            else if (tour.state.experience?.status === "STARTED" || tour.state.experience?.status === "PAUSED") tour.resumeTour();
            else tour.startTour();
          }}
          aria-label={launchLabel}
          data-tour-control={tour.state.completed ? "replay" : tour.state.experience?.status === "STARTED" || tour.state.experience?.status === "PAUSED" ? "resume" : "start"}
        >
          {launchLabel}
        </button>
      ) : null}
    </>
  );

  return (
    <>
      {children}
      {typeof document === "undefined" ? null : createPortal(runtimeSurface, document.body)}
    </>
  );
}
