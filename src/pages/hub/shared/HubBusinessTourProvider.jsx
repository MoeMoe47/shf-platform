import React from "react";
import { getHubTourSteps } from "./hubTourSteps";
import "./hubBusinessTour.css";

function getStepContent(content) {
  if (!content) return null;

  if (typeof content === "string") {
    return <p>{content}</p>;
  }

  if (Array.isArray(content)) {
    return content.map((item, index) => <p key={index}>{item}</p>);
  }

  if (typeof content === "object") {
    return (
      <div className="hubTour-content">
        {content.primary ? <p>{content.primary}</p> : null}

        {content.why ? (
          <div className="hubTour-contentBlock">
            <strong>Why it matters</strong>
            <span>{content.why}</span>
          </div>
        ) : null}

        {content.action ? (
          <div className="hubTour-contentBlock">
            <strong>Operator action</strong>
            <span>{content.action}</span>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}

function findTarget(selector) {
  if (!selector || typeof document === "undefined") return null;

  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

function getHighlightRect(step) {
  const target = findTarget(step?.target);
  if (!target) return null;

  const rect = target.getBoundingClientRect();

  return {
    top: Math.max(8, rect.top - 8),
    left: Math.max(8, rect.left - 8),
    width: Math.max(44, rect.width + 16),
    height: Math.max(44, rect.height + 16),
  };
}

function getCardPosition(rect) {
  if (typeof window === "undefined") {
    return { top: 90, left: 24 };
  }

  const cardWidth = Math.min(390, window.innerWidth - 40);
  const gap = 18;

  if (!rect) {
    return {
      top: 90,
      left: Math.max(20, window.innerWidth - cardWidth - 24),
    };
  }

  let top = rect.top;
  let left = rect.left + rect.width + gap;

  if (left + cardWidth > window.innerWidth - 18) {
    left = rect.left - cardWidth - gap;
  }

  if (left < 18) {
    left = Math.max(18, window.innerWidth - cardWidth - 24);
  }

  if (top + 340 > window.innerHeight - 20) {
    top = Math.max(18, window.innerHeight - 360);
  }

  return { top, left };
}

function HubTourOverlay({
  steps,
  currentIndex,
  onNext,
  onBack,
  onEnd,
}) {
  const step = steps[currentIndex];
  const [rect, setRect] = React.useState(null);

  React.useLayoutEffect(() => {
    if (!step) return undefined;

    const target = findTarget(step.target);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }

    const update = () => {
      setRect(getHighlightRect(step));
    };

    const t1 = window.setTimeout(update, 80);
    const t2 = window.setTimeout(update, 280);
    const t3 = window.setTimeout(update, 520);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step, currentIndex]);

  if (!step) return null;

  const total = steps.length;
  const stepNumber = currentIndex + 1;
  const isLast = stepNumber >= total;
  const cardPosition = getCardPosition(rect);

  return (
    <div className="hubTour-root" data-hub-tour-active="true">
      <div className="hubTour-dim" onClick={onEnd} />

      {rect ? (
        <div
          className="hubTour-highlight"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      ) : null}

      <aside
        className="hubTour-card"
        style={{
          top: cardPosition.top,
          left: cardPosition.left,
        }}
        role="dialog"
        aria-label={step.title || "Hub guided tour"}
      >
        <div className="hubTour-top">
          <span>SHS Hub Guided Tour</span>
          <button type="button" onClick={onEnd} aria-label="Close tour">
            ×
          </button>
        </div>

        <div className="hubTour-progress">
          Step {stepNumber} of {total}
        </div>

        <h3>{step.title || "Tour Step"}</h3>

        {getStepContent(step.content)}

        {!rect ? (
          <div className="hubTour-missing">
            This step target is not visible on the page. You can continue to the next step.
          </div>
        ) : null}

        <div className="hubTour-actions">
          <button type="button" onClick={onBack} disabled={currentIndex <= 0}>
            Back
          </button>

          <button type="button" onClick={onEnd}>
            End
          </button>

          <button className="is-primary" type="button" onClick={isLast ? onEnd : onNext}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function HubBusinessTourProvider({ pageKey, children }) {
  const steps = React.useMemo(() => getHubTourSteps(pageKey) || [], [pageKey]);
  const [isActive, setIsActive] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  function startTour() {
    if (!steps.length) {
      console.warn(`[Hub Tour] No tour steps found for pageKey: ${pageKey}`);
      return;
    }

    setCurrentIndex(0);
    setIsActive(true);
  }

  function endTour() {
    setIsActive(false);
    setCurrentIndex(0);
  }

  function nextStep() {
    setCurrentIndex((value) => Math.min(value + 1, steps.length - 1));
  }

  function prevStep() {
    setCurrentIndex((value) => Math.max(value - 1, 0));
  }

  return (
    <>
      {children}

      <button
        type="button"
        className="hubTour-startButton"
        onClick={startTour}
        data-tour-control="start"
      >
        Start Tour
      </button>

      {isActive ? (
        <HubTourOverlay
          steps={steps}
          currentIndex={currentIndex}
          onNext={nextStep}
          onBack={prevStep}
          onEnd={endTour}
        />
      ) : null}
    </>
  );
}
