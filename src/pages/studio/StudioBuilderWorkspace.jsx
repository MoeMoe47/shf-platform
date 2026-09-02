import React from "react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { getStudioProject, getStudioWorkspace, updateStudioWorkspace } from "@/lib/studio/api.js";
import { projectTypeLabel } from "./experience.js";
import StudioProjectCheck from "./StudioProjectCheck.jsx";
import StudioReviewStatus from "./StudioReviewStatus.jsx";
import StudioDeliveryStatus from "./StudioDeliveryStatus.jsx";
import StudioInstitutionalStatus from "./StudioInstitutionalStatus.jsx";

function initialWork(type) {
  return type === "AI_AGENT" ? { name: "", instructions: "", tools: [] } : { pages: [{ path: "/", title: "Home", content: "" }] };
}

export default function StudioBuilderWorkspace() {
  const { role } = useUser();
  const { projectId } = useParams();
  const [state, setState] = React.useState({ loading: true, error: null, project: null, workspace: null, saving: false, saved: false });
  React.useEffect(() => {
    let active = true;
    Promise.all([getStudioProject(role, projectId), getStudioWorkspace(role, projectId)])
      .then(([project, workspace]) => active && setState({ loading: false, error: null, project, workspace, saving: false, saved: false }))
      .catch((error) => active && setState((current) => ({ ...current, loading: false, error })));
    return () => { active = false; };
  }, [role, projectId]);

  function setWork(next) {
    setState((current) => ({ ...current, workspace: { ...current.workspace, work: next }, saved: false }));
  }
  async function save(event) {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, saved: false, error: null }));
    try {
      const workspace = await updateStudioWorkspace(role, projectId, { revision: state.workspace.revision, work: state.workspace.work });
      setState((current) => ({ ...current, workspace, saving: false, saved: true }));
      window.dispatchEvent(new CustomEvent("studio:workspace-updated", { detail: { projectId } }));
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error }));
    }
  }
  if (state.loading) return <div className="studio-page"><p className="studio-muted" role="status">Loading your workspace…</p></div>;
  if (!state.project || !state.workspace) return <div className="studio-page studio-page--narrow"><Link className="studio-backLink" to={`/studio/projects/${encodeURIComponent(projectId)}`}>← Back to My Project</Link><div className="studio-empty studio-empty--large"><p><strong>This workspace is not available.</strong><span>Check your project access and try again.</span></p></div></div>;
  const type = state.project.projectType;
  const work = state.workspace.work || initialWork(type);
  const websitePage = type === "WEBSITE" ? (work.pages?.[0] || initialWork(type).pages[0]) : null;
  return <div className="studio-page studio-builderPage">
    <Link className="studio-backLink" to={`/studio/projects/${encodeURIComponent(projectId)}`}>← Back to My Project</Link>
    <header className="studio-projectHeader"><div><p className="studio-eyebrow">Build workspace</p><h1 className="ld-h1">{state.project.title}</h1><p className="studio-muted">{projectTypeLabel(type)} work in progress</p></div><span className="studio-status">Draft work</span></header>
    <div className="studio-builderNotice" role="note"><strong>You are building your project.</strong><span>Saving work does not mark it complete, pass QA, approve review, or create evidence.</span></div>
    <StudioProjectCheck role={role} projectId={projectId} workspace={state.workspace} />
    <StudioReviewStatus role={role} projectId={projectId} workspace={state.workspace} />
    <StudioDeliveryStatus role={role} projectId={projectId} workspace={state.workspace} />
    <StudioInstitutionalStatus role={role} projectId={projectId} />
    <form className="studio-builderForm" onSubmit={save}>
      {type === "WEBSITE" ? <section className="studio-panel" aria-labelledby="website-work-heading"><h2 id="website-work-heading">Build Your Website</h2><p className="studio-muted">Start with the content for your Home page. More page tools will be added in a later build phase.</p><label className="studio-field"><span>Page title</span><input value={websitePage.title} maxLength={200} onChange={(event) => setWork({ pages: [{ ...websitePage, title: event.target.value }] })} /></label><label className="studio-field"><span>Page content</span><textarea rows="12" value={websitePage.content} maxLength={50000} onChange={(event) => setWork({ pages: [{ ...websitePage, content: event.target.value }] })} /></label></section> : <section className="studio-panel" aria-labelledby="agent-work-heading"><h2 id="agent-work-heading">Build Your AI Agent</h2><p className="studio-muted">Describe what your agent should do. Testing, approvals, and registry actions are separate future workflows.</p><label className="studio-field"><span>Agent name</span><input value={work.name || ""} maxLength={200} onChange={(event) => setWork({ ...work, name: event.target.value })} /></label><label className="studio-field"><span>Instructions</span><textarea rows="12" value={work.instructions || ""} maxLength={50000} onChange={(event) => setWork({ ...work, instructions: event.target.value })} /></label></section>}
      {state.error && <p className="studio-error" role="alert">{state.error.code === "WORKSPACE_REVISION_CONFLICT" ? "This project changed in another tab. Reload the latest version before saving again." : "Your draft could not be saved. Please try again."}</p>}
      <div className="studio-builderActions"><span className="studio-muted" role="status">{state.saving ? "Saving…" : state.saved ? "Saved" : "Draft changes are not saved yet"}</span><button className="studio-primaryButton" type="submit" disabled={state.saving}>{state.saving ? "Saving…" : "Save draft"}</button></div>
    </form>
  </div>;
}
