import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { createStudentIdeaProject } from "@/lib/studio/api.js";
import { projectTypeLabel } from "./experience.js";

export default function StudioNewProject() {
  const { role } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedType = new URLSearchParams(location.search).get("type");
  const [projectType, setProjectType] = React.useState(requestedType === "AI_AGENT" ? "AI_AGENT" : "WEBSITE");
  const [title, setTitle] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [goal, setGoal] = React.useState("");
  const [step, setStep] = React.useState(1);
  const [state, setState] = React.useState({ saving: false, error: null });

  async function submit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setState({ saving: true, error: null });
    try {
      const project = await createStudentIdeaProject(role, { projectType, title: title.trim() });
      navigate(`/studio/projects/${encodeURIComponent(project.projectId)}`);
    } catch (error) {
      setState({ saving: false, error });
    }
  }

  return <div className="studio-page studio-page--narrow"><Link className="studio-backLink" to="/studio">← Back to Studio</Link><header className="studio-pageHeader"><p className="studio-eyebrow">Start a project · Step {step} of 3</p><h1 className="ld-h1">{step === 1 ? "What do you want to create?" : step === 2 ? "What are you making?" : "Who is it for?"}</h1><p className="studio-lede">{step === 1 ? "Choose a direction. You can refine the details later." : step === 2 ? "Give your idea a name and a simple purpose." : "A little context helps you keep the project focused."}</p></header><form className="studio-form" onSubmit={(event) => { event.preventDefault(); if (step < 3) { setStep(step + 1); return; } submit(event); }}>{step === 1 && <fieldset><legend>Project type</legend><div className="studio-typeChoices"><label className={projectType === "WEBSITE" ? "is-selected" : ""}><input type="radio" name="projectType" value="WEBSITE" checked={projectType === "WEBSITE"} onChange={() => setProjectType("WEBSITE")} /> <strong>Website</strong><span>A site, portfolio, or digital experience.</span></label><label className={projectType === "AI_AGENT" ? "is-selected" : ""}><input type="radio" name="projectType" value="AI_AGENT" checked={projectType === "AI_AGENT"} onChange={() => setProjectType("AI_AGENT")} /> <strong>AI Agent</strong><span>A guided agent concept for a future governed build.</span></label></div></fieldset>}{step === 2 && <><label className="studio-field"><span>Project name</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder={`Name your ${projectTypeLabel(projectType).toLowerCase()}`} required /></label><label className="studio-field"><span>What should it help someone do?</span><textarea value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={500} placeholder="Describe the purpose in a sentence" rows="4" /></label></>}{step === 3 && <label className="studio-field"><span>Who is it for? <em>(optional)</em></span><input value={audience} onChange={(event) => setAudience(event.target.value)} maxLength={200} placeholder="A person, group, or community" /></label>}{state.error && <p className="studio-error" role="alert">We could not start that project. Please try again.</p>}<div className="studio-formActions"><Link className="studio-secondaryButton" to="/studio">Cancel</Link>{step > 1 && <button className="studio-secondaryButton" type="button" onClick={() => setStep(step - 1)}>Back</button>}<button className="studio-primaryButton" type="submit" disabled={state.saving || (step === 2 && !title.trim())}>{state.saving ? "Starting…" : step < 3 ? "Continue" : "Start Project"}</button></div></form></div>;
}
