export default function TourStepCard({
  step,
  stepIndex,
  total,
  onNext,
  onBack,
  onClose,
}) {
  return (
    <div className="tour-card" role="dialog" aria-modal="true" aria-label={step.title}>
      <div className="tour-header">
        <span className="tour-title">{step.title}</span>
        <span className="tour-count">
          {stepIndex + 1}/{total}
        </span>
      </div>

      <div className="tour-body">
        <p className="tour-primary">{step.content.primary}</p>
        <p className="tour-why">{step.content.why}</p>
        <p className="tour-action">{step.content.action}</p>
      </div>

      <div className="tour-controls">
        <button type="button" className="tour-btn tour-btn-ghost" onClick={onBack}>
          Back
        </button>
        <button type="button" className="tour-btn tour-btn-primary" onClick={onNext}>
          {stepIndex + 1 === total ? "Finish" : "Next"}
        </button>
        <button type="button" className="tour-btn tour-btn-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
