import { useEffect, useMemo } from "react";
import useTour from "./useTour";
import TourOverlay from "./TourOverlay";
import { tourSteps as defaultTourSteps } from "./tourConfig";
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
}) {
  const activeSteps = useMemo(() => {
    return Array.isArray(steps) && steps.length ? steps : defaultTourSteps;
  }, [steps]);

  const tour = useTour(activeSteps.length);

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

  return (
    <>
      {children}

      <TourOverlay
        state={tour.state}
        steps={activeSteps}
        nextStep={tour.nextStep}
        prevStep={tour.prevStep}
        endTour={tour.endTour}
      />

      {!tour.state.isActive ? (
        <button
          type="button"
          className="tour-start-btn"
          onClick={tour.startTour}
          aria-label={buttonLabel}
          data-tour-control="start"
        >
          {buttonLabel}
        </button>
      ) : null}
    </>
  );
}
