import React from "react";
import { Link } from "react-router-dom";
import useAuth from "@/auth/useAuth.js";
import { SHS_SECURITY_PERMISSIONS } from "@/system/security/security-permissions.js";
import { createMissionDraft, getMissionDraft, listMissionDrafts, updateMissionDraft } from "@/lib/studio/missionDraftApi.js";
import { listLeaderboardActivities } from "@/shared/arcade/leaderboard/arcadeLeaderboardClient.js";
import "@/styles/studio-mission-builder.css";

const FAMILIES = "LEARNING CLASSIC WORKFORCE CAREER_EXPLORATION SIMULATION PUBLIC_SAFETY HEALTHCARE INFRASTRUCTURE CREATOR_MEDIA LOGISTICS AUTONOMOUS_SYSTEMS".split(" ");
const DIFFICULTIES = "INTRODUCTORY BEGINNER INTERMEDIATE ADVANCED EXPERT".split(" ");
const OBJECTIVES = "REACH INTERACT ANSWER INSPECT COLLECT OPERATE REPAIR RESPOND ESCORT DELIVER CREATE DECIDE SURVIVE OBSERVE REPORT CUSTOM".split(" ");
const CONDITIONS = "OBJECTIVE_COMPLETE OBJECTIVE_COUNT STAGE_COMPLETE TIME_ELAPSED STATE_EQUALS STATE_THRESHOLD EVENT_OCCURRED".split(" ");
const SCORE = "NONE POINTS TIME OBJECTIVE_WEIGHTED".split(" ");
const lines = (text) => text.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
const copy = (value) => structuredClone(value);
const newId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

function emptyDefinition() {
  const missionId = crypto.randomUUID();
  return {
    missionId, slug: `mission-${missionId.slice(0, 8)}`, version: 1, status: "DRAFT", family: "LEARNING",
    title: "Untitled mission", summary: "", intendedAudience: [], difficulty: "INTRODUCTORY", roles: [],
    objectives: [{ objectiveId: "objective-1", title: "First objective", description: "Describe the runtime goal.", type: "OBSERVE", required: true, order: 1, completionRule: { type: "TIME_ELAPSED", seconds: 0 }, metadata: {} }],
    stages: [], successConditions: [{ type: "OBJECTIVE_COUNT", count: 1 }], failureConditions: [], environmentRefs: [],
    runtimeScorePolicy: "NONE", aiCapabilities: { missionDirector: false, adaptiveDifficulty: false, npcDialogue: false, scenarioVariation: false },
    accessibility: { reducedMotionSupported: true, captionsAvailable: false, audioDescriptionsAvailable: false, visualReliance: "OPTIONAL", audioReliance: "OPTIONAL", inputModes: ["KEYBOARD"] },
    safety: { classification: "GENERAL", contentSensitivity: [], notes: [] }, metadata: {},
  };
}

function condition(type, definition) {
  switch (type) {
    case "OBJECTIVE_COMPLETE": return { type, objectiveId: definition.objectives[0]?.objectiveId || "" };
    case "OBJECTIVE_COUNT": return { type, count: 1 };
    case "STAGE_COMPLETE": return { type, stageId: definition.stages[0]?.stageId || "" };
    case "TIME_ELAPSED": return { type, seconds: 0 };
    case "STATE_EQUALS": return { type, stateKey: "state-key", value: "" };
    case "STATE_THRESHOLD": return { type, stateKey: "state-key", operator: "GTE", value: 0 };
    default: return { type: "EVENT_OCCURRED", eventType: "event-name" };
  }
}

function shapeCondition(value) {
  const keys = {
    OBJECTIVE_COMPLETE: ["type", "objectiveId"], OBJECTIVE_COUNT: ["type", "count"], STAGE_COMPLETE: ["type", "stageId"],
    TIME_ELAPSED: ["type", "seconds"], STATE_EQUALS: ["type", "stateKey", "value"],
    STATE_THRESHOLD: ["type", "stateKey", "operator", "value"], EVENT_OCCURRED: ["type", "eventType"],
  }[value.type];
  return Object.fromEntries(keys.filter((key) => value[key] !== undefined).map((key) => [key, value[key]]));
}

function conditionLabel(value) {
  const operands = Object.entries(value).filter(([key]) => key !== "type").map(([key, item]) => `${key}: ${String(item)}`);
  return operands.length ? `${value.type} (${operands.join(", ")})` : value.type;
}

function Field({ label, hint, children }) { return <label className="mission-builder__field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }

function ConditionEditor({ value, definition, onChange, onRemove }) {
  const text = (label, key, type = "text") => <Field label={label}><input type={type} value={value[key] ?? ""} onChange={(event) => onChange(shapeCondition({ ...value, [key]: type === "number" ? Number(event.target.value) : event.target.value }))} /></Field>;
  const options = (label, key, choices) => <Field label={label}><select value={value[key] ?? ""} onChange={(event) => onChange(shapeCondition({ ...value, [key]: event.target.value }))}>{choices.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>;
  return <div className="mission-builder__condition">
    <Field label="Condition type"><select value={value.type} onChange={(event) => onChange(condition(event.target.value, definition))}>{CONDITIONS.map((item) => <option key={item}>{item}</option>)}</select></Field>
    {value.type === "OBJECTIVE_COMPLETE" && options("Objective", "objectiveId", definition.objectives.map((item) => ({ value: item.objectiveId, label: item.title })))}
    {value.type === "OBJECTIVE_COUNT" && text("Completed objective count", "count", "number")}
    {value.type === "STAGE_COMPLETE" && options("Stage", "stageId", definition.stages.map((item) => ({ value: item.stageId, label: item.title })))}
    {value.type === "TIME_ELAPSED" && text("Elapsed seconds", "seconds", "number")}
    {value.type === "STATE_EQUALS" && <>{text("State key", "stateKey")}{text("Value", "value")}</>}
    {value.type === "STATE_THRESHOLD" && <>{text("State key", "stateKey")}{options("Operator", "operator", ["EQ", "GTE", "LTE"].map((item) => ({ value: item, label: item })))}{text("Numeric value", "value", "number")}</>}
    {value.type === "EVENT_OCCURRED" && text("Event type", "eventType")}
    <button className="studio-secondaryButton" type="button" onClick={onRemove}>Remove</button>
  </div>;
}

function Conditions({ title, values, definition, onChange }) {
  return <section className="mission-builder__subsection"><div className="mission-builder__subhead"><h4>{title}</h4><button type="button" className="studio-secondaryButton" onClick={() => onChange([...values, condition("OBJECTIVE_COMPLETE", definition)])}>Add condition</button></div>
    {values.map((value, index) => <ConditionEditor key={`${title}-${index}`} value={value} definition={definition} onChange={(next) => onChange(values.map((item, i) => i === index ? next : item))} onRemove={() => onChange(values.filter((_, i) => i !== index))} />)}
    {!values.length && <p className="mission-builder__muted">No conditions added.</p>}
  </section>;
}

function reorder(list, index, by, update) {
  const target = index + by;
  if (target < 0 || target >= list.length) return;
  const next = [...list]; [next[index], next[target]] = [next[target], next[index]];
  update(next.map((item, i) => ({ ...item, order: i + 1 })));
}

export default function StudioMissionBuilder() {
  const auth = useAuth();
  const permitted = auth.hasPermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_CREATE) && !auth.hasRole("student");
  const [drafts, setDrafts] = React.useState([]);
  const [activities, setActivities] = React.useState([]);
  const [definition, setDefinition] = React.useState(null);
  const [draftId, setDraftId] = React.useState(null);
  const [revision, setRevision] = React.useState(null);
  const [dirty, setDirty] = React.useState(false);
  const [view, setView] = React.useState({ loading: true, saving: false, error: null, validation: [], saved: false });

  const loadList = React.useCallback(async () => {
    setView((state) => ({ ...state, loading: true, error: null }));
    try { setDrafts(await listMissionDrafts()); setView((state) => ({ ...state, loading: false })); }
    catch (error) { setView((state) => ({ ...state, loading: false, error })); }
  }, []);
  React.useEffect(() => {
    if (!permitted) { setView((state) => ({ ...state, loading: false })); return; }
    loadList();
    listLeaderboardActivities().then(setActivities).catch(() => setActivities([]));
  }, [permitted, loadList]);

  function beginNew() {
    setDraftId(null); setRevision(null); setDefinition(emptyDefinition()); setDirty(true);
    setView({ loading: false, saving: false, error: null, validation: [], saved: false });
  }
  async function chooseDraft(item) {
    setView((state) => ({ ...state, loading: true, error: null }));
    try {
      const draft = await getMissionDraft(item.draftId);
      setDraftId(draft.draftId); setRevision(draft.revision); setDefinition(draft.definition); setDirty(false);
      setView({ loading: false, saving: false, error: null, validation: [], saved: false });
    } catch (error) { setView((state) => ({ ...state, loading: false, error })); }
  }
  function setAt(path, value) {
    setDefinition((current) => { const next = copy(current); let target = next; for (const key of path.slice(0, -1)) target = target[key]; target[path.at(-1)] = value; return next; });
    setDirty(true); setView((state) => ({ ...state, saved: false, error: null, validation: [] }));
  }
  async function save(event) {
    event.preventDefault(); if (!definition) return;
    setView((state) => ({ ...state, saving: true, error: null, validation: [], saved: false }));
    try {
      const saved = draftId ? await updateMissionDraft(draftId, revision, definition) : await createMissionDraft(definition);
      setDraftId(saved.draftId); setRevision(saved.revision); setDefinition(saved.definition); setDirty(false);
      setDrafts((items) => [saved, ...items.filter((item) => item.draftId !== saved.draftId)]);
      setView({ loading: false, saving: false, error: null, validation: [], saved: true });
    } catch (error) { setView((state) => ({ ...state, saving: false, error, validation: error.details?.errors || [] })); }
  }
  async function reloadLatest() { if (draftId) await chooseDraft({ draftId }); }

  if (!permitted) return <div className="studio-page mission-builder"><h1 className="ld-h1">Mission Builder</h1><p role="alert">Mission authoring is limited to authorized Studio creators.</p></div>;

  return <div className="studio-page mission-builder">
    <header className="studio-pageHeader"><p className="studio-eyebrow">Creator Studio · Mission content</p><h1 className="ld-h1">Mission Builder</h1><p className="studio-lede">Construct and validate a scenario definition without hand-editing JSON.</p></header>
    <div className="mission-builder__notice" role="note"><strong>Draft authoring only</strong><span>Valid and saved content is not approved, published, or launchable. The Builder does not establish learning outcomes.</span></div>
    <div className="mission-builder__layout">
      <aside className="mission-builder__drafts" aria-label="Mission drafts"><div className="mission-builder__subhead"><h2>Your drafts</h2><button type="button" className="studio-primaryButton" onClick={beginNew}>New draft</button></div>
        {view.loading && !definition && <p role="status">Loading drafts…</p>}{view.error && !definition && <p role="alert" className="studio-error">Drafts are unavailable. {view.error.message}</p>}
        {!view.loading && !drafts.length && <p className="mission-builder__muted">No drafts yet.</p>}
        <ul>{drafts.map((item) => <li key={item.draftId}><button type="button" className={item.draftId === draftId ? "is-active" : ""} onClick={() => { if (!dirty || window.confirm("Discard unsaved changes and load this draft?")) chooseDraft(item); }}><strong>{item.definition.title}</strong><span>{item.definition.family} · v{item.missionVersion} · r{item.revision}</span></button></li>)}</ul>
      </aside>
      {!definition ? <div className="mission-builder__empty"><h2>Build a scenario definition</h2><p>Start a draft or select one you authored.</p><Link className="studio-textLink" to="/studio">Back to Studio</Link></div> : <form className="mission-builder__editor" onSubmit={save}>
        <div className="mission-builder__editorHeader"><div><p className="studio-eyebrow">{draftId ? `Draft revision ${revision}` : "New draft"}</p><h2>{definition.title || "Untitled mission"}</h2></div><span className="mission-builder__status">DRAFT</span></div>
        {dirty && <p className="mission-builder__unsaved" role="status">Unsaved changes</p>}
        {view.error && <div className="mission-builder__error" role="alert"><strong>{view.error.code === "MISSION_DRAFT_REVISION_CONFLICT" ? "This draft changed since you loaded it." : "Draft could not be saved."}</strong><span>{view.error.message}</span>{view.error.code === "MISSION_DRAFT_REVISION_CONFLICT" && <button type="button" className="studio-secondaryButton" onClick={reloadLatest}>Reload latest</button>}{view.error.details?.currentRevision && <span>Server revision: {view.error.details.currentRevision}</span>}</div>}
        {view.validation.length > 0 && <div className="mission-builder__error" role="alert"><strong>Validation needs attention</strong><ul>{view.validation.map((message, i) => <li key={`${i}-${message}`}>{message}</li>)}</ul></div>}
        {view.saved && <p role="status" className="mission-builder__saved">Draft saved at revision {revision}.</p>}
        <details open><summary>1. Basics</summary><div className="mission-builder__grid">
          <Field label="Mission ID" hint={draftId ? "Identity is fixed for this draft." : "Stable identity, independent of routes and Activity IDs."}><input value={definition.missionId} disabled={Boolean(draftId)} onChange={(e) => setAt(["missionId"], e.target.value)} /></Field>
          <Field label="Mission version" hint={draftId ? "Create a separate draft to author another Mission version." : "Content version is distinct from draft revision."}><input type="number" min="1" value={definition.version} disabled={Boolean(draftId)} onChange={(e) => setAt(["version"], Number(e.target.value))} /></Field>
          <Field label="Slug"><input value={definition.slug} onChange={(e) => setAt(["slug"], e.target.value)} /></Field>
          <Field label="Title"><input value={definition.title} onChange={(e) => setAt(["title"], e.target.value)} /></Field>
          <Field label="Family"><select value={definition.family} onChange={(e) => setAt(["family"], e.target.value)}>{FAMILIES.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Difficulty"><select value={definition.difficulty} onChange={(e) => setAt(["difficulty"], e.target.value)}>{DIFFICULTIES.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Summary"><textarea rows="3" value={definition.summary} onChange={(e) => setAt(["summary"], e.target.value)} /></Field>
          <Field label="Intended audience" hint="One item per line."><textarea rows="3" value={definition.intendedAudience.join("\n")} onChange={(e) => setAt(["intendedAudience"], lines(e.target.value))} /></Field>
          <Field label="Scenario roles" hint="Scenario roles are not real credentials."><textarea rows="3" value={definition.roles.join("\n")} onChange={(e) => setAt(["roles"], lines(e.target.value))} /></Field>
          <Field label="Canonical Arcade Activity" hint="Optional reference only; choosing an Activity does not create or change it."><select value={definition.arcadeActivityId || ""} onChange={(e) => setAt(["arcadeActivityId"], e.target.value || undefined)}><option value="">No Activity reference</option>{activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.title} · {activity.id}</option>)}</select></Field>
        </div></details>
        <details open><summary>2. Objectives</summary><div className="mission-builder__subhead"><p>Runtime goals only; objectives are not mastery claims.</p><button type="button" className="studio-secondaryButton" onClick={() => setAt(["objectives"], [...definition.objectives, { objectiveId: newId("objective"), title: "New objective", description: "", type: "OBSERVE", required: true, order: definition.objectives.length + 1, completionRule: { type: "EVENT_OCCURRED", eventType: "objective_observed" }, metadata: {} }])}>Add objective</button></div>
          {definition.objectives.map((objective, index) => <section className="mission-builder__item" key={objective.objectiveId}><div className="mission-builder__subhead"><h3>{objective.title || `Objective ${index + 1}`}</h3><div><button type="button" className="studio-secondaryButton" aria-label="Move objective up" disabled={!index} onClick={() => reorder(definition.objectives, index, -1, (next) => setAt(["objectives"], next))}>Move up</button><button type="button" className="studio-secondaryButton" aria-label="Move objective down" disabled={index === definition.objectives.length - 1} onClick={() => reorder(definition.objectives, index, 1, (next) => setAt(["objectives"], next))}>Move down</button><button type="button" className="studio-secondaryButton" onClick={() => setAt(["objectives"], definition.objectives.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i + 1 })))}>Remove</button></div></div>
            <div className="mission-builder__grid"><Field label="Objective ID"><input value={objective.objectiveId} onChange={(e) => setAt(["objectives", index, "objectiveId"], e.target.value)} /></Field><Field label="Type"><select value={objective.type} onChange={(e) => setAt(["objectives", index, "type"], e.target.value)}>{OBJECTIVES.map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Title"><input value={objective.title} onChange={(e) => setAt(["objectives", index, "title"], e.target.value)} /></Field><Field label="Description"><textarea value={objective.description} onChange={(e) => setAt(["objectives", index, "description"], e.target.value)} /></Field><label className="mission-builder__check"><input type="checkbox" checked={objective.required} onChange={(e) => setAt(["objectives", index, "required"], e.target.checked)} />Required objective</label></div>
            <Conditions title="Completion rule" values={[objective.completionRule]} definition={definition} onChange={(next) => setAt(["objectives", index, "completionRule"], next[0] || objective.completionRule)} />
          </section>)}
        </details>
        <details open><summary>3. Stages</summary><p className="mission-builder__muted">Optional-stage bypass execution is not yet implemented.</p><div className="mission-builder__subhead"><span>Stage order is content metadata; runtime skip behavior is deferred.</span><button type="button" className="studio-secondaryButton" onClick={() => setAt(["stages"], [...definition.stages, { stageId: newId("stage"), title: "New stage", description: "", order: definition.stages.length + 1, objectiveIds: [], entryConditions: [], exitConditions: [], optional: false, timeLimitSeconds: null }])}>Add stage</button></div>
          {definition.stages.map((stage, index) => <section className="mission-builder__item" key={stage.stageId}><div className="mission-builder__subhead"><h3>{stage.title}</h3><div><button type="button" className="studio-secondaryButton" aria-label="Move stage up" disabled={!index} onClick={() => reorder(definition.stages, index, -1, (next) => setAt(["stages"], next))}>Move up</button><button type="button" className="studio-secondaryButton" aria-label="Move stage down" disabled={index === definition.stages.length - 1} onClick={() => reorder(definition.stages, index, 1, (next) => setAt(["stages"], next))}>Move down</button><button type="button" className="studio-secondaryButton" onClick={() => setAt(["stages"], definition.stages.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i + 1 })))}>Remove</button></div></div>
            <div className="mission-builder__grid"><Field label="Stage ID"><input value={stage.stageId} onChange={(e) => setAt(["stages", index, "stageId"], e.target.value)} /></Field><Field label="Title"><input value={stage.title} onChange={(e) => setAt(["stages", index, "title"], e.target.value)} /></Field><Field label="Description"><textarea value={stage.description} onChange={(e) => setAt(["stages", index, "description"], e.target.value)} /></Field><Field label="Time limit seconds" hint="Blank means no limit."><input type="number" min="0" value={stage.timeLimitSeconds ?? ""} onChange={(e) => setAt(["stages", index, "timeLimitSeconds"], e.target.value === "" ? null : Number(e.target.value))} /></Field><label className="mission-builder__check"><input type="checkbox" checked={stage.optional} onChange={(e) => setAt(["stages", index, "optional"], e.target.checked)} />Optional stage</label></div>
            <Field label="Included objectives"><div className="mission-builder__checkList">{definition.objectives.map((objective) => <label key={objective.objectiveId}><input type="checkbox" checked={stage.objectiveIds.includes(objective.objectiveId)} onChange={(e) => setAt(["stages", index, "objectiveIds"], e.target.checked ? [...stage.objectiveIds, objective.objectiveId] : stage.objectiveIds.filter((id) => id !== objective.objectiveId))} />{objective.title}</label>)}</div></Field>
            <Conditions title="Entry conditions" values={stage.entryConditions} definition={definition} onChange={(value) => setAt(["stages", index, "entryConditions"], value)} /><Conditions title="Exit conditions" values={stage.exitConditions} definition={definition} onChange={(value) => setAt(["stages", index, "exitConditions"], value)} />
          </section>)}
        </details>
        <details open><summary>4. Success and failure conditions</summary><Conditions title="Success conditions" values={definition.successConditions} definition={definition} onChange={(value) => setAt(["successConditions"], value)} /><Conditions title="Failure conditions" values={definition.failureConditions} definition={definition} onChange={(value) => setAt(["failureConditions"], value)} /></details>
        <details><summary>5. Runtime and scoring</summary><Field label="Runtime score policy"><select value={definition.runtimeScorePolicy} onChange={(e) => setAt(["runtimeScorePolicy"], e.target.value)}>{SCORE.map((x) => <option key={x}>{x}</option>)}</select></Field><p className="mission-builder__muted">Runtime scoring metadata does not create a canonical Arcade Result or leaderboard score.</p></details>
        <details><summary>6. Environment references</summary><p className="mission-builder__muted">Reference fields do not create or modify environments.</p>{definition.environmentRefs.map((ref, index) => <div className="mission-builder__condition" key={`env-${index}`}><Field label="System"><select value={ref.system} onChange={(e) => setAt(["environmentRefs", index, "system"], e.target.value)}>{["metaverse", "arcade", "simulation"].map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Environment ID"><input value={ref.environmentId} onChange={(e) => setAt(["environmentRefs", index, "environmentId"], e.target.value)} /></Field><Field label="Location ID"><input value={ref.locationId || ""} onChange={(e) => setAt(["environmentRefs", index, "locationId"], e.target.value || undefined)} /></Field><Field label="Scene ID"><input value={ref.sceneId || ""} onChange={(e) => setAt(["environmentRefs", index, "sceneId"], e.target.value || undefined)} /></Field><button type="button" className="studio-secondaryButton" onClick={() => setAt(["environmentRefs"], definition.environmentRefs.filter((_, i) => i !== index))}>Remove reference</button></div>)}<button type="button" className="studio-secondaryButton" onClick={() => setAt(["environmentRefs"], [...definition.environmentRefs, { system: "simulation", environmentId: "" }])}>Add environment reference</button></details>
        <details><summary>7. AI capability declarations</summary><p className="mission-builder__boundary">Capability declaration only. Governed AI execution is not enabled in 4C.</p><div className="mission-builder__grid">{Object.keys(definition.aiCapabilities).map((key) => <label className="mission-builder__check" key={key}><input type="checkbox" checked={definition.aiCapabilities[key]} onChange={(e) => setAt(["aiCapabilities", key], e.target.checked)} />{key}</label>)}</div></details>
        <details><summary>8. Accessibility and safety</summary><div className="mission-builder__grid"><label className="mission-builder__check"><input type="checkbox" checked={definition.accessibility.reducedMotionSupported} onChange={(e) => setAt(["accessibility", "reducedMotionSupported"], e.target.checked)} />Reduced motion supported</label><label className="mission-builder__check"><input type="checkbox" checked={definition.accessibility.captionsAvailable} onChange={(e) => setAt(["accessibility", "captionsAvailable"], e.target.checked)} />Captions available</label><label className="mission-builder__check"><input type="checkbox" checked={definition.accessibility.audioDescriptionsAvailable} onChange={(e) => setAt(["accessibility", "audioDescriptionsAvailable"], e.target.checked)} />Audio descriptions available</label><Field label="Visual reliance"><select value={definition.accessibility.visualReliance} onChange={(e) => setAt(["accessibility", "visualReliance"], e.target.value)}>{["NONE", "OPTIONAL", "REQUIRED"].map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Audio reliance"><select value={definition.accessibility.audioReliance} onChange={(e) => setAt(["accessibility", "audioReliance"], e.target.value)}>{["NONE", "OPTIONAL", "REQUIRED"].map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Input modes" hint="One item per line."><textarea rows="2" value={definition.accessibility.inputModes.join("\n")} onChange={(e) => setAt(["accessibility", "inputModes"], lines(e.target.value))} /></Field><Field label="Safety classification"><select value={definition.safety.classification} onChange={(e) => setAt(["safety", "classification"], e.target.value)}>{["GENERAL", "SENSITIVE", "SUPERVISED"].map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Content sensitivity" hint="One item per line."><textarea rows="2" value={definition.safety.contentSensitivity.join("\n")} onChange={(e) => setAt(["safety", "contentSensitivity"], lines(e.target.value))} /></Field><Field label="Safety notes" hint="One note per line."><textarea rows="3" value={definition.safety.notes.join("\n")} onChange={(e) => setAt(["safety", "notes"], lines(e.target.value))} /></Field></div></details>
        <details open><summary>9. Draft preview</summary><div className="mission-builder__preview"><strong>DRAFT PREVIEW</strong><h3>{definition.title}</h3><p>{definition.summary}</p><p>{definition.family} · {definition.difficulty} · Mission version {definition.version}</p><p>Audience: {definition.intendedAudience.join(", ") || "Not specified"}</p><p>Roles: {definition.roles.join(", ") || "None specified"}</p><h4>Objectives</h4><ol>{definition.objectives.map((item) => <li key={item.objectiveId}>{item.title} <small>{item.type} · {item.required ? "required" : "optional"} · completion: {conditionLabel(item.completionRule)}</small></li>)}</ol><h4>Stages</h4>{definition.stages.length ? <ol>{definition.stages.map((item) => <li key={item.stageId}>{item.title}{item.optional ? " · optional" : ""}<small>Entry: {item.entryConditions.map(conditionLabel).join("; ") || "none"} · Exit: {item.exitConditions.map(conditionLabel).join("; ") || "none"}</small></li>)}</ol> : <p>No stages defined.</p>}<h4>Conditions</h4><p>Success: {definition.successConditions.map(conditionLabel).join("; ") || "None"}</p><p>Failure: {definition.failureConditions.map(conditionLabel).join("; ") || "None"}</p><h4>Runtime score policy</h4><p>{definition.runtimeScorePolicy}</p><h4>Environment references</h4><p>{definition.environmentRefs.map((item) => `${item.system}:${item.environmentId}${item.locationId ? ` · location ${item.locationId}` : ""}${item.sceneId ? ` · scene ${item.sceneId}` : ""}`).join("; ") || "None"}</p><h4>AI capability declarations</h4><p>{Object.entries(definition.aiCapabilities).map(([key, enabled]) => `${key}: ${enabled ? "declared allowed" : "off"}`).join("; ")}</p><h4>Accessibility</h4><p>Reduced motion: {definition.accessibility.reducedMotionSupported ? "supported" : "not declared"}; captions: {definition.accessibility.captionsAvailable ? "available" : "not declared"}; audio descriptions: {definition.accessibility.audioDescriptionsAvailable ? "available" : "not declared"}; visual reliance: {definition.accessibility.visualReliance}; audio reliance: {definition.accessibility.audioReliance}; input modes: {definition.accessibility.inputModes.join(", ") || "none"}</p><h4>Safety</h4><p>{definition.safety.classification} · sensitivities: {definition.safety.contentSensitivity.join(", ") || "none"} · notes: {definition.safety.notes.join("; ") || "none"}</p><p className="mission-builder__boundary">This preview is not executable and cannot be launched. Save does not publish or approve content.</p></div></details>
        <div className="mission-builder__actions"><span>{dirty ? "Unsaved changes" : draftId ? `Draft revision ${revision}` : "Not saved"}</span><button className="studio-primaryButton" type="submit" disabled={view.saving || !dirty}>{view.saving ? "Saving…" : "Save Draft"}</button></div>
      </form>}
    </div>
  </div>;
}
