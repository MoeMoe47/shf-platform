import React from "react";
import { Link } from "react-router-dom";
import { useCompanionContext } from "@/companion/CompanionProvider.jsx";
import { useEffectiveAccessibilityContext } from "@/context/EffectiveAccessibilityContext.jsx";
import { STUDIO_EXPERIENCE_MODES, deriveLearningProgress, deriveStudioProgress, resolveLearningNextAction, resolveStudioNextAction, toStudioCompanionContext } from "./experience.js";

const StudioExperienceContext = React.createContext(null);

export function StudioExperienceProvider({ project, context = null, packet = null, route, resources = [], children }) {
  const [mode, setMode] = React.useState(STUDIO_EXPERIENCE_MODES.BEGINNER);
  const nextAction = React.useMemo(() => context ? resolveLearningNextAction(context) : resolveStudioNextAction(project), [context, project]);
  const progress = React.useMemo(() => context ? deriveLearningProgress(context) : deriveStudioProgress(project), [context, project]);
  const companionContext = React.useMemo(() => toStudioCompanionContext({ project, context, route, nextAction, progress, resources }), [project, context, route, nextAction, progress, resources]);
  const value = React.useMemo(() => ({ mode, setMode, nextAction, progress, companionContext, context, packet }), [mode, nextAction, progress, companionContext, context, packet]);
  return <StudioExperienceContext.Provider value={value}>{children}</StudioExperienceContext.Provider>;
}

export function StudioLearningContext({ className = "" }) {
  const { context, progress, nextAction } = useStudioExperience();
  if (!context) return null;
  const project = context.project || {};
  return <section className={`studio-learningContext ${className}`} aria-labelledby="studio-learning-context-heading">
    <div className="studio-learningIntro"><div><p className="studio-eyebrow">What you’re building</p><h2 id="studio-learning-context-heading">{project.title}</h2><p className="studio-muted">{project.type === "AI_AGENT" ? "AI Agent" : "Website"}{project.ownerType === "TEAM" && project.teamName ? ` · Team Project · ${project.teamName}` : ""}</p></div>{context.currentRevision && <p className="studio-revisionBadge">Revision {context.currentRevision.number} · {context.currentRevision.status}</p>}</div>
    <div className="studio-learningGrid">
      <section aria-labelledby="studio-assignment-context-heading"><h3 id="studio-assignment-context-heading">{context.assignment ? "Assignment" : "Project context"}</h3>{context.assignment ? <><p><strong>{context.assignment.title}</strong></p>{context.assignment.course?.title && <p className="studio-muted">Course: {context.assignment.course.title}</p>}{context.assignment.unit?.title && <p className="studio-muted">Unit: {context.assignment.unit.title}</p>}{context.assignment.lesson?.title && <p className="studio-muted">Lesson: {context.assignment.lesson.title}</p>}</> : <p>Personal Project</p>}{project.ownerType === "TEAM" && <p className="studio-muted">Team Project{project.teamName ? ` · ${project.teamName}` : ""}</p>}</section>
      <section aria-labelledby="studio-learning-progress-heading"><h3 id="studio-learning-progress-heading">Progress</h3><ol className="studio-learningSteps" aria-label={`Current progress step: ${progress.currentStage}`}>{progress.stages.map((stage) => { const complete = progress.completedStages.includes(stage); const current = stage === progress.currentStage; return <li key={stage} className={complete ? "is-complete" : current ? "is-current" : ""} aria-current={current ? "step" : undefined}><span>{complete ? "Complete" : current ? "Current" : "Next"}</span> {stage}</li>; })}</ol></section>
      <section aria-labelledby="studio-learning-requirements-heading"><h3 id="studio-learning-requirements-heading">Requirements</h3>{context.requirements?.length ? <ul className="studio-learningRequirements">{context.requirements.map((item) => <li key={item.id}><span aria-hidden="true">{item.status === "COMPLETE" ? "✓" : "○"}</span><strong>{item.label}</strong><span>{item.status === "COMPLETE" ? "Complete" : item.status === "BLOCKED" ? "Blocked" : item.status === "NEEDS_REVIEW" ? "Needs review" : "Remaining"}</span>{item.detail && <small>{item.detail}</small>}</li>)}</ul> : <p className="studio-muted">No formal requirements are available yet.</p>}</section>
    </div>
    <section className="studio-learningNext" aria-labelledby="studio-learning-next-heading"><p className="studio-eyebrow">Next step</p><h3 id="studio-learning-next-heading">{nextAction.label}</h3><p>{nextAction.description}</p></section>
  </section>;
}

export function useStudioExperience() {
  const context = React.useContext(StudioExperienceContext);
  if (!context) throw new Error("useStudioExperience must be used inside StudioExperienceProvider");
  return context;
}

export function StudioNextAction({ className = "" }) {
  const { nextAction } = useStudioExperience();
  return <section className={`studio-guidance ${className}`} aria-labelledby="studio-next-action-heading"><div><p className="studio-eyebrow">Recommended next step</p><h2 id="studio-next-action-heading">{nextAction.label}</h2><p>{nextAction.description}</p></div>{nextAction.href && <Link className="studio-primaryButton" to={nextAction.href}>Continue</Link>}</section>;
}

export function StudioProgress() {
  const { progress } = useStudioExperience();
  return <section className="studio-progress" aria-labelledby="studio-progress-heading"><div className="studio-sectionHeading"><h2 id="studio-progress-heading">Your progress</h2><span>{progress.explanation}</span></div><ol className="studio-stageList" aria-label={`Current stage: ${progress.currentStage}`}>{progress.stages.map((stage) => <li key={stage} className={stage === progress.currentStage ? "is-current" : progress.completedStages.includes(stage) ? "is-complete" : ""}><span aria-hidden="true">{progress.completedStages.includes(stage) ? "✓" : ""}</span>{stage}</li>)}</ol></section>;
}

export function StudioOrientation({ project }) {
  const label = project?.projectType === "AI_AGENT" ? "You're building an AI agent." : "You're building a website.";
  const detail = project?.projectType === "AI_AGENT" ? "You'll define what it should do, test it, improve it, and prepare it for review." : "This project will guide you from your idea through building, checking, and submitting.";
  return <aside className="studio-orientation" aria-labelledby="studio-orientation-heading"><div><p className="studio-eyebrow">Welcome to Studio</p><h2 id="studio-orientation-heading">{label}</h2><p>{detail}</p></div><span className="studio-orientationMark" aria-hidden="true">{project?.projectType === "AI_AGENT" ? "A" : "W"}</span></aside>;
}

export function StudioModeControl() {
  const { mode, setMode } = useStudioExperience();
  return <fieldset className="studio-mode"><legend>Experience mode</legend><label><input type="radio" name="studio-mode" checked={mode === STUDIO_EXPERIENCE_MODES.BEGINNER} onChange={() => setMode(STUDIO_EXPERIENCE_MODES.BEGINNER)} /> Beginner</label><label><input type="radio" name="studio-mode" checked={mode === STUDIO_EXPERIENCE_MODES.ADVANCED} onChange={() => setMode(STUDIO_EXPERIENCE_MODES.ADVANCED)} /> Advanced</label><p>Mode changes presentation only. Your project and permissions stay the same.</p></fieldset>;
}

export function StudioHelp() {
  const { openCoach } = useCompanionContext();
  const { companionContext } = useStudioExperience();
  function openHelp() { try { window.dispatchEvent(new CustomEvent("studio:help:opened", { detail: { route: companionContext.route } })); } catch {} openCoach(); }
  return <button type="button" className="studio-helpButton" onClick={openHelp} aria-label="Open Studio help">Need help?</button>;
}

export function StudioExperienceSummary() {
  const { companionContext } = useStudioExperience();
  const { reducedMotion } = useEffectiveAccessibilityContext();
  return <p className="studio-assistNote" role="note">Studio help is read-only guidance. {reducedMotion ? "Reduced motion is on." : "You can use the Companion for help."} <span className="studio-srOnly">Current stage: {companionContext.currentStage}. Recommended action: {companionContext.nextAction}.</span></p>;
}
