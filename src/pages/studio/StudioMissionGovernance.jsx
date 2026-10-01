import React from "react";
import { Link } from "react-router-dom";
import useAuth from "@/auth/useAuth.js";
import { SHS_SECURITY_PERMISSIONS } from "@/system/security/security-permissions.js";
import {
  decideMissionReviewSubmission,
  getMissionReviewSubmission,
  listMissionReviewSubmissions,
  listMissionReleases,
  listApprovedMissionsForPublication,
  publishMissionSubmission,
  retireMissionRelease,
} from "@/lib/studio/missionDraftApi.js";

const dateLabel = (value) => value ? new Date(value).toLocaleString() : "Not recorded";

export function StudioMissionReview() {
  const auth = useAuth();
  const allowed = auth.hasPermission(SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_QUEUE_VIEW) && auth.hasPermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW) && !auth.hasRole("student");
  const canPublish = auth.hasPermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_PUBLISH);
  const [items, setItems] = React.useState([]);
  const [approved, setApproved] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [note, setNote] = React.useState("");
  const [state, setState] = React.useState({ busy: false, error: "", message: "" });

  const reload = React.useCallback(async () => {
    setState((current) => ({ ...current, busy: true, error: "" }));
    try { setItems(await listMissionReviewSubmissions()); setState((current) => ({ ...current, busy: false })); }
    catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  }, []);
  React.useEffect(() => { if (allowed) reload(); }, [allowed, reload]);

  async function open(item) {
    setState({ busy: true, error: "", message: "" });
    try { setSelected(await getMissionReviewSubmission(item.submissionId)); setNote(""); setState({ busy: false, error: "", message: "" }); }
    catch (error) { setState({ busy: false, error: error.message, message: "" }); }
  }
  async function decide(decision) {
    setState({ busy: true, error: "", message: "" });
    try {
      await decideMissionReviewSubmission(selected.submissionId, decision, note);
      const next = await getMissionReviewSubmission(selected.submissionId);
      setSelected(next); setItems(await listMissionReviewSubmissions());
      setState({ busy: false, error: "", message: `Submission ${decision.toLowerCase()}.` });
    } catch (error) { setState({ busy: false, error: error.message, message: "" }); }
  }
  async function publish() {
    setState({ busy: true, error: "", message: "" });
    try {
      await publishMissionSubmission(selected.submissionId);
      setSelected(await getMissionReviewSubmission(selected.submissionId));
      setItems(await listMissionReviewSubmissions("APPROVED"));
      setState({ busy: false, error: "", message: "Immutable release published." });
    } catch (error) { setState({ busy: false, error: error.message, message: "" }); }
  }

  if (!allowed) return <main className="studio-page"><h1 className="ld-h1">Mission Review</h1><p role="alert">Authorized reviewers only.</p></main>;
  const definition = selected?.definition;
  return <main className="studio-page mission-governance">
    <header className="studio-pageHeader"><p className="studio-eyebrow">Creator Studio · Governance</p><h1 className="ld-h1">Mission Review</h1><p className="studio-lede">Review the frozen submitted revision. A decision does not publish the Mission.</p></header>
    <p><Link to="/studio">Studio</Link> · <Link to="/studio/missions">Mission Builder</Link> · <Link to="/studio/missions/releases">Mission releases</Link></p>
    {state.error && <p role="alert">{state.error}</p>}{state.message && <p role="status">{state.message}</p>}
    <section aria-labelledby="mission-review-queue"><h2 id="mission-review-queue">Submitted for review</h2>
      {state.busy && <p role="status">Loading Mission review…</p>}{!state.busy && !items.length && <p>No Mission submissions in this queue.</p>}
      <ul>{items.map((item) => <li key={item.submissionId}><button type="button" className="studio-secondaryButton" onClick={() => open(item)}>{item.status} · {item.definition.title} · v{item.missionVersion} · submitted revision {item.draftRevision} · {dateLabel(item.submittedAt)}</button></li>)}</ul>
    </section>
    {selected && definition && <section aria-labelledby="mission-review-detail">
      <h2 id="mission-review-detail">Frozen submission · {selected.status}</h2>
      <p>Mission {selected.missionId} · version {selected.missionVersion} · submitted draft revision {selected.draftRevision} · {dateLabel(selected.submittedAt)}</p>
      <p>Validation: {selected.validation?.valid ? "VALID" : "INVALID"}</p>
      <article className="mission-builder__preview"><strong>FROZEN REVIEW SNAPSHOT</strong><h3>{definition.title}</h3><p>{definition.summary}</p><p>{definition.family} · {definition.difficulty}</p><h4>Objectives</h4><ol>{definition.objectives.map((objective) => <li key={objective.objectiveId}>{objective.title} · {objective.type}</li>)}</ol><h4>Stages</h4><ol>{definition.stages.map((stage) => <li key={stage.stageId}>{stage.title}{stage.optional ? " · optional" : ""}</li>)}</ol><h4>AI capability declaration</h4><p>{Object.entries(definition.aiCapabilities).map(([key, value]) => `${key}: ${value ? "allowed declaration" : "off"}`).join("; ")}</p></article>
      {selected.decisionNote && <p>Decision note: {selected.decisionNote}</p>}
      {selected.status === "SUBMITTED" && <><label className="mission-builder__field"><span>Reviewer note</span><textarea value={note} maxLength={10000} onChange={(event) => setNote(event.target.value)} /><small>Plain text. Required for rejection; optional for approval.</small></label><div className="mission-builder__actions"><button type="button" className="studio-primaryButton" disabled={state.busy} onClick={() => decide("APPROVED")}>Approve</button><button type="button" className="studio-secondaryButton" disabled={state.busy || !note.trim()} onClick={() => decide("REJECTED")}>Reject</button></div></>}
      {selected.status === "APPROVED" && <p>Approved, not runtime-authorized. {canPublish ? <button type="button" className="studio-primaryButton" disabled={state.busy} onClick={publish}>Publish immutable release</button> : "Publisher permission is required for release."}</p>}
      {selected.status === "REJECTED" && <p>Rejected. The author’s draft remains editable; this frozen submission is unchanged.</p>}
    </section>}
  </main>;
}

export function StudioMissionReleases() {
  const auth = useAuth();
  const canPublish = auth.hasPermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_PUBLISH) && !auth.hasRole("student");
  const canRetire = auth.hasPermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_RETIRE) && !auth.hasRole("student");
  const [items, setItems] = React.useState([]);
  const [notes, setNotes] = React.useState({});
  const [confirmId, setConfirmId] = React.useState("");
  const [state, setState] = React.useState({ busy: false, error: "", message: "" });
  const reload = React.useCallback(async () => {
    setState((current) => ({ ...current, busy: true, error: "" }));
    try {
      const [releases, pending] = await Promise.all([listMissionReleases(), listApprovedMissionsForPublication()]);
      setItems(releases); setApproved(pending); setState((current) => ({ ...current, busy: false }));
    }
    catch (error) { setState((current) => ({ ...current, busy: false, error: error.message })); }
  }, []);
  React.useEffect(() => { if (canPublish) reload(); }, [canPublish, reload]);
  async function retire(release) {
    if (confirmId !== release.releaseId || !notes[release.releaseId]?.trim()) return;
    setState({ busy: true, error: "", message: "" });
    try { await retireMissionRelease(release.releaseId, notes[release.releaseId]); setConfirmId(""); await reload(); setState((current) => ({ ...current, message: "Release retired. Existing runtime sessions are unchanged." })); }
    catch (error) { setState({ busy: false, error: error.message, message: "" }); }
  }
  async function publish(submission) {
    setState({ busy: true, error: "", message: "" });
    try {
      await publishMissionSubmission(submission.submissionId);
      await reload();
      setState((current) => ({ ...current, message: "Immutable release published." }));
    } catch (error) { setState({ busy: false, error: error.message, message: "" }); }
  }
  if (!canPublish) return <main className="studio-page"><h1 className="ld-h1">Mission Releases</h1><p role="alert">Authorized publishers only.</p></main>;
  return <main className="studio-page mission-governance">
    <header className="studio-pageHeader"><p className="studio-eyebrow">Creator Studio · Governance</p><h1 className="ld-h1">Mission Releases</h1><p className="studio-lede">Published definition snapshots are immutable. Retirement prevents new starts and preserves existing runtime history.</p></header>
    <p><Link to="/studio">Studio</Link> · <Link to="/studio/missions">Mission Builder</Link> · <Link to="/studio/missions/review">Mission review</Link></p>
    {state.error && <p role="alert">{state.error}</p>}{state.message && <p role="status">{state.message}</p>}{state.busy && <p role="status">Loading releases…</p>}
    {approved.length > 0 && <section aria-labelledby="approved-publication-queue"><h2 id="approved-publication-queue">Approved · awaiting publication</h2><p>Approval is not publication or runtime authorization.</p><ul>{approved.map((submission) => <li key={submission.submissionId}><strong>{submission.definition.title}</strong><span> · v{submission.missionVersion} · frozen draft revision {submission.draftRevision}</span><button type="button" className="studio-primaryButton" disabled={state.busy} onClick={() => publish(submission)}>Publish immutable release</button></li>)}</ul></section>}
    {!state.busy && items.length === 0 && <p>No Mission releases are available in this organization.</p>}
    <ul>{items.map((release) => <li key={release.releaseId} className="mission-governance__release"><h2>{release.definition.title}</h2><p>{release.status} · {release.missionId} · version {release.missionVersion} · published {dateLabel(release.publishedAt)}</p><p>IMMUTABLE RELEASE · Editing is unavailable. Create a new Mission version for changes.</p>{release.status === "RETIRED" && <p>Retired {dateLabel(release.retiredAt)} · Note: {release.retirementNote}</p>}{release.status === "PUBLISHED" && canRetire && <div><label className="mission-builder__field"><span>Retirement note</span><textarea value={notes[release.releaseId] || ""} maxLength={10000} onChange={(event) => setNotes((current) => ({ ...current, [release.releaseId]: event.target.value }))} /></label>{confirmId !== release.releaseId ? <button type="button" className="studio-secondaryButton" onClick={() => setConfirmId(release.releaseId)}>Review retirement</button> : <div role="group" aria-label={`Confirm retirement of ${release.definition.title}`}><p>Confirm retirement of this immutable release. Active Mission Runtime sessions will continue unchanged.</p><button type="button" className="studio-secondaryButton" disabled={!notes[release.releaseId]?.trim() || state.busy} onClick={() => retire(release)}>Confirm retirement</button><button type="button" className="studio-secondaryButton" onClick={() => setConfirmId("")}>Cancel</button></div>}</div>}</li>)}</ul>
  </main>;
}
