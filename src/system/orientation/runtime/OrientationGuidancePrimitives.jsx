import React, { useEffect, useId, useRef } from "react";

function renderStepContent(step) {
  const content = step?.body ?? step?.content;
  if (typeof content === "string") return <p>{content}</p>;
  if (Array.isArray(content)) return content.map((item, index) => <p key={index}>{item}</p>);
  if (content && typeof content === "object") {
    return <div className="ogl-alternative__content">
      {content.primary ? <p>{content.primary}</p> : null}
      {content.why ? <p><strong>Why it matters: </strong>{content.why}</p> : null}
      {content.action ? <p><strong>What to do: </strong>{content.action}</p> : null}
    </div>;
  }
  return null;
}

export function OrientationWelcome({ title, purpose, outcome, onStart, onDismiss, onAlternative }) {
  return <section className="ogl-welcome" aria-labelledby="ogl-welcome-title"><p className="ogl-eyebrow">Orientation</p><h2 id="ogl-welcome-title">{title}</h2>{purpose ? <p>{purpose}</p> : null}{outcome ? <p className="ogl-muted">{outcome}</p> : null}<div className="ogl-actions"><button type="button" className="is-primary" onClick={onStart}>Start orientation</button><button type="button" onClick={onAlternative}>Read the step-by-step guide</button><button type="button" onClick={onDismiss}>Maybe later</button></div></section>;
}

export function OrientationCoachmark({ step, stepNumber, totalSteps, rect, onNext, onPrevious, onClose, onAlternative }) {
  const titleId = useId(); const descriptionId = useId(); const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, [step?.stepId]);
  if (!step) return null;
  return <aside ref={ref} tabIndex={-1} className={`ogl-coachmark${rect ? "" : " ogl-coachmark--unanchored"}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} onKeyDown={(event) => { if (event.key === "Escape") onClose?.(); }}><div className="ogl-coachmark__meta">Step {stepNumber} of {totalSteps}</div><h2 id={titleId}>{step.title}</h2><div id={descriptionId}>{typeof step.body === "string" ? <p>{step.body}</p> : null}</div>{!rect ? <p role="status" className="ogl-coachmark__notice">This step is shown without a highlighted target on this screen.</p> : null}<div className="ogl-actions"><button type="button" onClick={onPrevious} disabled={stepNumber <= 1}>Back</button><button type="button" onClick={onAlternative}>Step list</button><button type="button" className="is-primary" onClick={onNext}>{stepNumber === totalSteps ? "Finish" : "Next"}</button></div></aside>;
}

export function OrientationAccessibleAlternative({ title, steps = [], checklist = [], onClose, onAction }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return <section ref={ref} tabIndex={-1} className="ogl-alternative" aria-labelledby="ogl-alternative-title"><div className="ogl-alternative__header"><h2 id="ogl-alternative-title">{title || "Orientation step list"}</h2><button type="button" onClick={onClose} aria-label="Close step list">Close</button></div><ol>{steps.map((step, index) => <li key={step.stepId || index}><h3>{step.title}</h3>{renderStepContent(step)}{step.action ? <button type="button" onClick={() => onAction?.(step.action)}>Open next step</button> : null}</li>)}</ol>{checklist.length ? <div aria-label="Orientation checklist"><h3>Next steps</h3><ul>{checklist.map((item) => <li key={item.id}>{item.title}{item.required ? " (required)" : " (optional)"}</li>)}</ul></div> : null}</section>;
}

export function InlineGuidance({ title = "Why?", explanation, documentationLabel = "Learn more", onDocumentation, onCompanion, onTour }) {
  return <aside className="ogl-inline-guidance" aria-label="Contextual guidance"><strong>{title}</strong>{explanation ? <p>{explanation}</p> : null}<div className="ogl-actions">{onDocumentation ? <button type="button" onClick={onDocumentation}>{documentationLabel}</button> : null}{onCompanion ? <button type="button" onClick={onCompanion}>Ask Companion</button> : null}{onTour ? <button type="button" onClick={onTour}>Show me</button> : null}</div></aside>;
}

export function OrientationChecklist({ items = [], collapsed = false, onToggle, onOpen }) {
  return <section className={`ogl-checklist${collapsed ? " ogl-checklist--collapsed" : ""}`} aria-labelledby="ogl-checklist-title"><div className="ogl-checklist__header"><h2 id="ogl-checklist-title">Your next steps</h2><button type="button" onClick={onToggle} aria-expanded={!collapsed}>{collapsed ? "Open" : "Collapse"}</button></div>{!collapsed ? <ul>{items.map((item) => <li key={item.id} data-state={item.state}><span><strong>{item.title}</strong><small>{item.responsibility ? `Next: ${item.responsibility}` : "Status from the owning service"}</small></span>{item.actionTarget ? <button type="button" onClick={() => onOpen?.(item.actionTarget)}>Open</button> : null}</li>)}</ul> : null}</section>;
}

export function WhatsChangedPanel({ currentVersion, priorVersion, changeClassification, onStart, onDismiss }) {
  return <section className="ogl-whats-changed" aria-labelledby="ogl-whats-changed-title"><p className="ogl-eyebrow">What's changed</p><h2 id="ogl-whats-changed-title">This orientation has been updated</h2><p>Version {priorVersion || "previous"} is now version {currentVersion}. Change type: {String(changeClassification || "updated").toLowerCase().replaceAll("_", " ")}.</p><div className="ogl-actions"><button type="button" className="is-primary" onClick={onStart}>Review changes</button><button type="button" onClick={onDismiss}>Dismiss</button></div></section>;
}
