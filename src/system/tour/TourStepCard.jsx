function renderContent(content) {
  if (!content) return null;

  if (typeof content === "string") {
    return <p>{content}</p>;
  }

  if (Array.isArray(content)) {
    return content.map((item, index) => <p key={index}>{item}</p>);
  }

  if (typeof content === "object") {
    return (
      <div className="tour-cardContent">
        {content.primary ? <p>{content.primary}</p> : null}
        {content.why ? (
          <div className="tour-contentBlock">
            <strong>Why it matters</strong>
            <span>{content.why}</span>
          </div>
        ) : null}
        {content.action ? (
          <div className="tour-contentBlock">
            <strong>Operator action</strong>
            <span>{content.action}</span>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}

function getCardPosition(rect) {
  if (typeof window === "undefined" || !rect) {
    return {
      top: 96,
      left: 24,
    };
  }

  const cardWidth = 380;
  const gap = 18;

  let top = rect.top;
  let left = rect.left + rect.width + gap;

  if (left + cardWidth > window.innerWidth - 20) {
    left = Math.max(20, rect.left - cardWidth - gap);
  }

  if (left < 20) {
    left = 20;
  }

  if (top + 320 > window.innerHeight - 20) {
    top = Math.max(20, window.innerHeight - 340);
  }

  return { top, left };
}

export default function TourStepCard({
  step,
  rect,
  stepNumber,
  totalSteps,
  nextStep,
  prevStep,
  endTour,
}) {
  const position = getCardPosition(rect);
  const isLast = stepNumber >= totalSteps;

  return (
    <aside
      className="tour-card"
      style={{
        top: position.top,
        left: position.left,
      }}
      role="dialog"
      aria-label={step?.title || "Guided tour step"}
    >
      <div className="tour-cardTop">
        <span>Guided Tour</span>
        <button type="button" onClick={endTour} aria-label="Close tour">
          ×
        </button>
      </div>

      <div className="tour-progress">
        Step {stepNumber} of {totalSteps}
      </div>

      <h3>{step?.title || "Tour Step"}</h3>

      {renderContent(step?.content)}

      {!rect ? (
        <div className="tour-missingTarget">
          Target section not visible. Use Next to continue.
        </div>
      ) : null}

      <div className="tour-actions">
        <button type="button" onClick={prevStep} disabled={stepNumber <= 1}>
          Back
        </button>

        <button type="button" onClick={endTour}>
          End
        </button>

        <button className="is-primary" type="button" onClick={isLast ? endTour : nextStep}>
          {isLast ? "Finish" : "Next"}
        </button>
      </div>
    </aside>
  );
}
