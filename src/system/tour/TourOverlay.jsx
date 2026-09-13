import { useLayoutEffect, useRef, useState } from "react";
import TourStepCard from "./TourStepCard";
import { waitForTarget } from "../orientation/runtime/routeOrchestration";

function findTarget(target) {
  if (!target || typeof document === "undefined") return null;
  const selector = typeof target === "string"
    ? target
    : target.mode === "SEMANTIC_ANCHOR"
      ? `[data-ogl-anchor="${String(target.anchorId).replace(/"/g, "\\\"")}"]`
      : target.mode === "UNANCHORED" ? null : target.selector;
  if (!selector) return null;

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
  skipTour,
  context = null,
  onAlternative,
}) {
  const step = steps[state.currentStep];
  const [rect, setRect] = useState(null);
  const [anchorMissing, setAnchorMissing] = useState(false);
  const [targetWaiting, setTargetWaiting] = useState(false);
  const previousFocus = useRef(null);
  const cardRef = useRef(null);

  useLayoutEffect(() => {
    if (!state.isActive || !step) return undefined;

    let cancelled = false;
    setTargetWaiting(true);
    setAnchorMissing(false);
    setRect(null);
    waitForTarget(() => findTarget(step.target)).then(({ target, state: readiness }) => {
      if (cancelled) return;
      setTargetWaiting(false);
      setAnchorMissing(readiness === "TARGET_TIMEOUT");
      if (target) target.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center", inline: "nearest" });
      setRect(buildRectForStep(step));
    });
    const updateRect = () => setRect(buildRectForStep(step));

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [state.isActive, state.currentStep, step]);

  useLayoutEffect(() => {
    if (!state.isActive) return undefined;
    previousFocus.current = document.activeElement;
    cardRef.current?.focus({ preventScroll: true });
    const handleEscape = (event) => {
      if (event.key === "Escape") endTour();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      if (previousFocus.current && typeof previousFocus.current.focus === "function") previousFocus.current.focus({ preventScroll: true });
    };
  }, [state.isActive, endTour]);

  if (!state.isActive || !step) return null;

  if (targetWaiting) return <div className="tour-overlayRoot" data-tour-overlay="waiting" aria-live="polite"><div className="tour-dim" aria-hidden="true" /><div className="tour-card tour-card--waiting" role="status" tabIndex={-1}>Waiting for this step to load…</div></div>;

  if (anchorMissing && step.missingAnchorPolicy === "SKIP_STEP") {
    window.setTimeout(nextStep, 0);
    return null;
  }
  if (anchorMissing && step.missingAnchorPolicy === "END_TOUR") {
    window.setTimeout(endTour, 0);
    return null;
  }

  const totalSteps = steps.length || 1;
  const stepNumber = state.currentStep + 1;

  return (
    <div className="tour-overlayRoot" data-tour-overlay="active" data-dgal-guidance-id={context?.guidanceId || undefined}>
      <div className="tour-dim" onClick={endTour} aria-hidden="true" />

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
        skipTour={skipTour}
        missingAnchorPolicy={step.missingAnchorPolicy}
        cardRef={cardRef}
        onAlternative={onAlternative}
      />
    </div>
  );
}
