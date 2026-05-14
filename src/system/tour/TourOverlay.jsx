import { useLayoutEffect, useState } from "react";
import TourStepCard from "./TourStepCard";

function findTarget(selector) {
  return selector ? document.querySelector(selector) : null;
}

function buildRectForStep(step) {
  const el = findTarget(step.target);
  if (!el) return null;

  if (step.id === "kpis") {
    const cards = [...el.querySelectorAll(".shf-kpi-card")];
    const drawer = document.querySelector(".shf-drawer");

    if (cards.length) {
      const first = cards[0].getBoundingClientRect();
      const drawerLeft = drawer
        ? drawer.getBoundingClientRect().left
        : window.innerWidth;

      const visibleCards = cards.filter((card) => {
        const r = card.getBoundingClientRect();
        return r.right < drawerLeft - 8;
      });

      const lastCard =
        visibleCards.length > 0
          ? visibleCards[visibleCards.length - 1]
          : cards[0];

      const last = lastCard.getBoundingClientRect();

      return {
        top: Math.max(8, first.top - 6),
        left: Math.max(8, first.left - 6),
        width: Math.max(40, last.right - first.left + 12),
        height: Math.max(40, first.height + 12),
      };
    }
  }

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
}) {
  const step = steps[state.currentStep];
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!state.isActive || !step) return;

    const target = findTarget(step.target);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    const updateRect = () => {
      setRect(buildRectForStep(step));
    };

    const t1 = setTimeout(updateRect, 80);
    const t2 = setTimeout(updateRect, 260);

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [state.isActive, state.currentStep, step]);

  if (!state.isActive || !step) return null;

  return (
    <>
      <div className="tour-backdrop" />

      {rect && (
        <div
          className="tour-highlight"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}

      <div className="tour-card-wrap">
        <TourStepCard
          step={step}
          stepIndex={state.currentStep}
          total={steps.length}
          onNext={nextStep}
          onBack={prevStep}
          onClose={endTour}
        />
      </div>
    </>
  );
}
