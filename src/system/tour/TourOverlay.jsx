import { useLayoutEffect, useState } from "react";
import TourStepCard from "./TourStepCard";

function findTarget(selector) {
  if (!selector || typeof document === "undefined") return null;

  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

function buildRectForStep(step) {
  const el = findTarget(step?.target);
  if (!el) return null;

  const r = el.getBoundingClientRect();

  return {
    top: Math.max(8, r.top - 8),
    left: Math.max(8, r.left - 8),
    width: Math.max(40, r.width + 16),
    height: Math.max(40, r.height + 16),
  };
}

export default function TourOverlay({
  state,
  steps = [],
  nextStep,
  prevStep,
  endTour,
  context = null,
}) {
  const step = steps[state.currentStep];
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!state.isActive || !step) return undefined;

    const target = findTarget(step.target);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }

    const updateRect = () => {
      setRect(buildRectForStep(step));
    };

    const t1 = window.setTimeout(updateRect, 80);
    const t2 = window.setTimeout(updateRect, 280);

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [state.isActive, state.currentStep, step]);

  if (!state.isActive || !step) return null;

  const totalSteps = steps.length || 1;
  const stepNumber = state.currentStep + 1;

  return (
    <div className="tour-overlayRoot" data-tour-overlay="active" data-dgal-guidance-id={context?.guidanceId || undefined}>
      <div className="tour-dim" onClick={endTour} />

      {rect ? (
        <div
          className="tour-spotlight"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      ) : null}

      <TourStepCard
        step={step}
        rect={rect}
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        nextStep={nextStep}
        prevStep={prevStep}
        endTour={endTour}
      />
    </div>
  );
}
