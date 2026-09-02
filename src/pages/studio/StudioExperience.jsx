import React from "react";
import { Link } from "react-router-dom";
import { useCompanionContext } from "@/companion/CompanionProvider.jsx";
import { useEffectiveAccessibilityContext } from "@/context/EffectiveAccessibilityContext.jsx";
import { STUDIO_EXPERIENCE_MODES, deriveStudioProgress, resolveStudioNextAction, toStudioCompanionContext } from "./experience.js";

const StudioExperienceContext = React.createContext(null);

export function StudioExperienceProvider({ project, route, resources = [], children }) {
  const [mode, setMode] = React.useState(STUDIO_EXPERIENCE_MODES.BEGINNER);
  const nextAction = React.useMemo(() => resolveStudioNextAction(project), [project]);
  const progress = React.useMemo(() => deriveStudioProgress(project), [project]);
  const companionContext = React.useMemo(() => toStudioCompanionContext({ project, route, nextAction, progress, resources }), [project, route, nextAction, progress, resources]);
  const value = React.useMemo(() => ({ mode, setMode, nextAction, progress, companionContext }), [mode, nextAction, progress, companionContext]);
  return <StudioExperienceContext.Provider value={value}>{children}</StudioExperienceContext.Provider>;
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
