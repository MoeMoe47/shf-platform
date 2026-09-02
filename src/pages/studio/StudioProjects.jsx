import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { listStudioProjects } from "@/lib/studio/api.js";

export default function StudioProjects() {
  const { role } = useUser();
  const [state, setState] = React.useState({ loading: true, error: null, items: [] });
  React.useEffect(() => { let active = true; listStudioProjects(role).then((data) => active && setState({ loading: false, error: null, items: data?.items || [] })).catch((error) => active && setState({ loading: false, error, items: [] })); return () => { active = false; }; }, [role]);
  return <div className="studio-page"><header className="studio-pageHeader"><p className="studio-eyebrow">Your work</p><h1 className="ld-h1">My Projects</h1><p className="studio-lede">Projects returned by your authorized Studio workspace.</p></header>{state.loading ? <p className="studio-muted" role="status">Loading your projects…</p> : state.error ? <p className="studio-error" role="alert">Your projects are unavailable right now. Please try again.</p> : state.items.length === 0 ? <div className="studio-empty studio-empty--large"><p><strong>You have no Studio projects yet.</strong><span>Start a project to see it here.</span></p><Link className="studio-primaryButton" to="/studio/new">Start Project</Link></div> : <div className="studio-projectGrid studio-projectGrid--full">{state.items.map((project) => <Link className="studio-projectCard" key={project.projectId} to={`/studio/projects/${encodeURIComponent(project.projectId)}`}><span className="studio-cardType">{project.projectType === "AI_AGENT" ? "AI Agent" : "Website"}</span><strong>{project.title}</strong><span>{project.origin === "ASSIGNMENT" ? "Assigned project" : "Independent project"} · {project.status}</span></Link>)}</div>}</div>;
}
