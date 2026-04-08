import { useEffect, useMemo, useState } from "react";
import { tourSteps } from "./tourConfig";
import TourStepCard from "./TourStepCard";

function pickTarget(step) {
  if (!step?.target) return null;
  const selectors = step.target
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function getPlacementStyle(rect, placement) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardWidth = Math.min(380, vw - 32);
  const gap = 16;

  if (!rect || placement === "center") {
    return {
      left: Math.max(16, (vw - cardWidth) / 2),
      top: Math.max(24, (vh - 260) / 2),
      width: cardWidth,
    };
  }

  if (placement === "left") {
    return {
      left: Math.max(16, rect.left - cardWidth - gap),
      top: Math.max(24, rect.top),
      width: cardWidth,
    };
  }

  if (placement === "right") {
    return {
      left: Math.min(vw - cardWidth - 16, rect.right + gap),
      top: Math.max(24, rect.top),
      width: cardWidth,
    };
  }

  if (placement === "top") {
    return {
      left: Math.min(vw - cardWidth - 16, Math.max(16, rect.left)),
      top: Math.max(24, rect.top - 240 - gap),
      width: cardWidth,
    };
  }

  return {
    left: Math.min(vw - cardWidth - 16, Math.max(16, rect.left)),
    top: Math.min(vh - 260 - 16, rect.bottom + gap),
    width: cardWidth,
  };
}

export default function TourOverlay({ state, nextStep, prevStep, endTour }) {
  const step = tourSteps[state.currentStep];
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!state.isActive || !step) return;

    const el = pickTarget(step);
    if (!el || step.target === "body") {
      setRect(null);
      return;
    }

    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({
        top: Math.max(8, r.top - 8),
        left: Math.max(8, r.left - 8),
        width: Math.max(0, r.width + 16),
        height: Math.max(0, r.height + 16),
        right: r.right + 8,
        bottom: r.bottom + 8,
      });
    };

    update();
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [state.isActive, state.currentStep, step]);

  const cardStyle = useMemo(
    () => getPlacementStyle(rect, step?.placement || "bottom"),
    [rect, step]
  );

  if (!state.isActive || !step) return null;

  return (
    <>
      <div className="tour-backdrop" />
      {rect ? (
        <div
          className="tour-highlight"
          style={{
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }}
        />
      ) : null}

      <div
        className="tour-card-wrap"
        style={{
          left: `${cardStyle.left}px`,
          top: `${cardStyle.top}px`,
          width: `${cardStyle.width}px`,
        }}
      >
        <TourStepCard
          step={step}
          stepIndex={state.currentStep}
          total={tourSteps.length}
          onNext={nextStep}
          onBack={prevStep}
          onClose={endTour}
        />
      </div>
    </>
  );
}
