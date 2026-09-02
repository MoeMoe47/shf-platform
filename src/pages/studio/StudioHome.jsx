import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { listStudioProjects } from "@/lib/studio/api.js";
import { BriefcaseIcon, ChevronRightIcon, SparkleIcon } from "@/components/curriculum/icons.jsx";
import { StudioExperienceProvider, StudioNextAction } from "./StudioExperience.jsx";

function typeLabel(type) { return type === "AI_AGENT" ? "AI Agent" : "Website"; }

export default function StudioHome() {
  const { role } = useUser();
  const [state, setState] = React.useState({ loading: true, error: null, projects: [] });

  React.useEffect(() => {
    let active = true;
    listStudioProjects(role)
      .then((data) => active && setState({ loading: false, error: null, projects: data?.items || [] }))
      .catch((error) => active && setState({ loading: false, error, projects: [] }));
    return () => { active = false; };
  }, [role]);

  return (
    <div className="studio-page">
      <header className="studio-hero">
        <div>
          <p className="studio-eyebrow">Student creation space</p>
          <h1 className="ld-h1">Studio</h1>
          <p className="studio-lede">Choose something to create, then keep your work connected to the learning that inspired it.</p>
        </div>
        <SparkleIcon size={54} className="studio-heroIcon" aria-hidden="true" />
      </header>

      <section className="studio-section" aria-labelledby="studio-create-heading">
        <div className="studio-sectionHeading"><h2 id="studio-create-heading">Create Something</h2><span>Choose a starting point</span></div>
        <div className="studio-createGrid">
          <Link className="studio-choice" to="/studio/new?type=WEBSITE"><span className="studio-choiceIcon" aria-hidden="true">W</span><span><strong>Website</strong><small>Plan and shape a website project.</small></span><ChevronRightIcon size={18} /></Link>
          <Link className="studio-choice" to="/studio/new?type=AI_AGENT"><span className="studio-choiceIcon studio-choiceIcon--agent" aria-hidden="true">A</span><span><strong>AI Agent</strong><small>Define an agent idea for a governed build.</small></span><ChevronRightIcon size={18} /></Link>
        </div>
      </section>

      <section className="studio-section" aria-labelledby="studio-projects-heading">
        <div className="studio-sectionHeading"><h2 id="studio-projects-heading">Continue Working</h2><Link to="/studio/projects">My Projects <ChevronRightIcon size={15} /></Link></div>
        {state.loading ? <p className="studio-muted" role="status">Loading your projects…</p> : state.error ? <p className="studio-error" role="alert">Your Studio projects are unavailable right now. Please try again.</p> : state.projects.length === 0 ? <div className="studio-empty"><BriefcaseIcon size={24} /><p><strong>No projects yet</strong><span>Start with a Website or AI Agent above.</span></p></div> : <div className="studio-projectGrid">{state.projects.slice(0, 3).map((project) => <Link className="studio-projectCard" key={project.projectId} to={`/studio/projects/${encodeURIComponent(project.projectId)}`}><span className="studio-cardType">{typeLabel(project.projectType)}</span><strong>{project.title}</strong><span>{project.status === "DRAFT" ? "Ready to plan" : project.status}</span></Link>)}</div>}
      </section>

      <StudioExperienceProvider project={state.projects[0] || null} route="/studio">
        <StudioNextAction className="studio-homeGuidance" />
      </StudioExperienceProvider>

      <section className="studio-section studio-section--split" aria-labelledby="studio-start-heading">
        <div><h2 id="studio-start-heading">Assigned to You</h2><p className="studio-muted">Studio-ready assignments will appear here when your course connects one to a project.</p><Link className="studio-textLink" to="/studio/assignments">View assignments <ChevronRightIcon size={15} /></Link></div>
        <div><h2>Templates</h2><p className="studio-muted">Browse available starting points without changing your project until you choose one.</p><Link className="studio-textLink" to="/studio/templates">Explore templates <ChevronRightIcon size={15} /></Link></div>
      </section>
    </div>
  );
}
