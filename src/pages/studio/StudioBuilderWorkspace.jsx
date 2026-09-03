import React from "react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { getStudioLearningContext, getStudioProject, getStudioRevisions, getStudioWorkspace, updateStudioWorkspace } from "@/lib/studio/api.js";
import { projectTypeLabel } from "./experience.js";
import StudioProjectCheck from "./StudioProjectCheck.jsx";
import StudioReviewStatus from "./StudioReviewStatus.jsx";
import StudioDeliveryStatus from "./StudioDeliveryStatus.jsx";
import StudioInstitutionalStatus from "./StudioInstitutionalStatus.jsx";
import StudioDeploymentStatus from "./StudioDeploymentStatus.jsx";
import StudioAgentPackageStatus from "./StudioAgentPackageStatus.jsx";
import { StudioExperienceProvider, StudioLearningContext } from "./StudioExperience.jsx";
import StudioCollaborationPanel from "./StudioCollaborationPanel.jsx";
import { useStudioCollaboration } from "@/lib/studio/collaboration.js";

function initialWork(type) {
  return type === "AI_AGENT" ? { name: "", instructions: "", tools: [] } : { pages: [{ path: "/", title: "Home", content: "" }] };
}

export default function StudioBuilderWorkspace() {
  const { role } = useUser();
  const { projectId } = useParams();
  const [state, setState] = React.useState({ loading: true, error: null, project: null, workspace: null, revisions: [], context: null, contextError: false, saving: false, saved: false });
  const collaboration = useStudioCollaboration({ role, projectId, enabled: state.project?.ownerType === "TEAM", onRemoteWork: (work) => setState((current) => ({ ...current, workspace: { ...current.workspace, work }, saved: false })) });
  React.useEffect(() => {
    let active = true;
    Promise.all([getStudioProject(role, projectId), getStudioWorkspace(role, projectId), getStudioRevisions(role, projectId), getStudioLearningContext(role, projectId).catch(() => ({ __error: true }))])
      .then(([project, workspace, revisions, context]) => active && setState({ loading: false, error: null, project, workspace, revisions: revisions?.items || [], context: context?.__error ? null : context, contextError: Boolean(context?.__error), saving: false, saved: false }))
      .catch((error) => active && setState((current) => ({ ...current, loading: false, error })));
    return () => { active = false; };
  }, [role, projectId]);

  function setWork(next) {
    setState((current) => ({ ...current, workspace: { ...current.workspace, work: next }, saved: false }));
    collaboration.publish(next);
  }
  async function save(event) {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, saved: false, error: null }));
    try {
      const workspace = await updateStudioWorkspace(role, projectId, { revision: state.workspace.revision, work: state.workspace.work });
      const revisions = await getStudioRevisions(role, projectId);
      setState((current) => ({ ...current, workspace, revisions: revisions?.items || current.revisions, context: current.context ? { ...current.context, currentRevision: { ...(current.context.currentRevision || {}), number: workspace.revision, status: "WORKING" } } : current.context, saving: false, saved: true }));
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
  return <StudioExperienceProvider project={state.project} context={state.context} route={`/studio/projects/${projectId}/build`}><div className="studio-page studio-builderPage">
    <Link className="studio-backLink" to={`/studio/projects/${encodeURIComponent(projectId)}`}>← Back to My Project</Link>
    <header className="studio-projectHeader"><div><p className="studio-eyebrow">Build workspace</p><h1 className="ld-h1">{state.project.title}</h1><p className="studio-muted">{projectTypeLabel(type)} work in progress</p></div><span className="studio-status">Draft work</span></header>
    <StudioLearningContext />
    <StudioCollaborationPanel ownerType={state.project.ownerType} state={collaboration} />
    {state.contextError && <p className="studio-error" role="alert">Learning context is unavailable. Your saved work remains available. Please try again later.</p>}
    <div className="studio-builderNotice" role="note"><strong>You are building your project.</strong><span>Saving work does not mark it complete, pass QA, approve review, or create evidence.</span></div>
    <StudioProjectCheck role={role} projectId={projectId} workspace={state.workspace} />
    <StudioReviewStatus role={role} projectId={projectId} workspace={state.workspace} />
    <StudioDeliveryStatus role={role} projectId={projectId} workspace={state.workspace} />
    <StudioInstitutionalStatus role={role} projectId={projectId} />
    <StudioDeploymentStatus role={role} projectId={projectId} projectType={type} />
    <StudioAgentPackageStatus role={role} projectId={projectId} projectType={type} />
    <section className="studio-panel" aria-labelledby="studio-revision-history-heading">
      <div className="studio-sectionHeading"><div><p className="studio-eyebrow">Version history</p><h2 id="studio-revision-history-heading">Revision history</h2></div><span>{state.revisions.length ? `${state.revisions.length} saved` : "No saved revisions"}</span></div>
      {state.revisions.length ? <ol className="studio-historyList">{state.revisions.map((revision) => <li key={revision.revisionId}><strong>Revision {revision.revisionNumber}</strong><span>{revision.status} · {new Date(revision.createdAt).toLocaleDateString()}</span><span>Contributor attribution recorded</span></li>)}</ol> : <p className="studio-muted" role="status">Save your first draft to create a revision.</p>}
    </section>
    <form className="studio-builderForm" onSubmit={save}>
      {type === "WEBSITE" ? <section className="studio-panel" aria-labelledby="website-work-heading"><h2 id="website-work-heading">Build Your Website</h2><p className="studio-muted">Start with the content for your Home page. More page tools will be added in a later build phase.</p><label className="studio-field"><span>Page title</span><input value={websitePage.title} maxLength={200} onChange={(event) => setWork({ pages: [{ ...websitePage, title: event.target.value }] })} /></label><label className="studio-field"><span>Page content</span><textarea rows="12" value={websitePage.content} maxLength={50000} onChange={(event) => setWork({ pages: [{ ...websitePage, content: event.target.value }] })} /></label></section> : <section className="studio-panel" aria-labelledby="agent-work-heading"><h2 id="agent-work-heading">Build Your AI Agent</h2><p className="studio-muted">Describe what your agent should do. Testing, approvals, and registry actions are separate future workflows.</p><label className="studio-field"><span>Agent name</span><input value={work.name || ""} maxLength={200} onChange={(event) => setWork({ ...work, name: event.target.value })} /></label><label className="studio-field"><span>Instructions</span><textarea rows="12" value={work.instructions || ""} maxLength={50000} onChange={(event) => setWork({ ...work, instructions: event.target.value })} /></label></section>}
      {state.error && <p className="studio-error" role="alert">{state.error.code === "WORKSPACE_REVISION_CONFLICT" ? "This project changed in another tab. Reload the latest version before saving again." : "Your draft could not be saved. Please try again."}</p>}
      <div className="studio-builderActions"><span className="studio-muted" role="status">{state.saving ? "Saving…" : state.saved ? "Saved" : "Draft changes are not saved yet"}</span><button className="studio-primaryButton" type="submit" disabled={state.saving}>{state.saving ? "Saving…" : "Save draft"}</button></div>
    </form>
  </div></StudioExperienceProvider>;
}
