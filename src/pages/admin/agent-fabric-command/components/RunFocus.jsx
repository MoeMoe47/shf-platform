// src/pages/admin/agent-fabric-command/components/RunFocus.jsx
// AFCC-3 Phase 7 — one run, four read-only views. Docked beside the list on
// wide screens; an overlay dialog (tablet) or full-screen sheet (phone)
// elsewhere. No view changes anything.
import React from "react";
import { SOURCE_STATE } from "../commandContracts.js";
import { formatTimestamp } from "../commandPresentation.js";
import {
  approvalCopy,
  display,
  evidenceCopy,
  formatBytes,
  labelFrom,
  normalizeRun,
  normalizeTimelineEvent,
  runStateCopy,
  shortHash,
  STORAGE_STATE_COPY,
  transitionText,
  TRUST_COPY,
  verificationLabel,
  VERIFICATION_COPY,
} from "../liveOperationsModel.js";
import { useRunArtifact, useRunView } from "../useLiveOperations.js";
import { EvidenceState, RunState, Val } from "./LiveOperationsParts.jsx";
import { SourceNotice } from "./SourceState.jsx";

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "evidence", label: "Evidence" },
  { id: "dependencies", label: "Dependencies" },
];

function CopyValue({ value, label }) {
  const [copied, setCopied] = React.useState(false);
  if (display(value).gap) return <Val value={value} />;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <span className="afcc-lo-copy">
      <code>{String(value)}</code>
      <button type="button" className="afcc-lo-copy-btn" onClick={copy} aria-label={`Copy ${label}`}>
        <span aria-hidden="true">⧉</span>
      </button>
      <span className="afcc-sr-only" aria-live="polite">{copied ? `${label} copied` : ""}</span>
    </span>
  );
}

// "value · Verified": the verification suffix only when there is a value to qualify.
function Verified({ value, verification }) {
  return (
    <>
      <Val value={value} />
      {display(value).gap ? null : <span className="afcc-lo-verif"> · {verificationLabel(verification)}</span>}
    </>
  );
}

function Field({ term, children }) {
  return (
    <div className="afcc-lo-field">
      <dt>{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ViewState({ result, what }) {
  if (result.state === SOURCE_STATE.LOADING) return <p className="afcc-quiet" role="status">Loading {what}…</p>;
  if (result.state !== SOURCE_STATE.AVAILABLE) return <SourceNotice projection={{ state: result.state, source: result.source }} compact />;
  return null;
}

function NoRunYet({ what }) {
  return <p className="afcc-quiet">This plan has not executed, so it has no {what}. Its overview shows the recorded plan and approval.</p>;
}

// ------------------------------------------------------------------ overview

function OverviewView({ run, detail }) {
  const failedState = ["FAILED", "TIMED_OUT", "ORPHANED"].includes(run.state);
  return (
    <div className="afcc-lo-view-body">
      {run.runId ? <ViewState result={detail} what="run detail" /> : null}
      <section aria-labelledby="afcc-lo-glance">
        <h3 id="afcc-lo-glance" className="afcc-lo-h3">At a glance</h3>
        <dl className="afcc-lo-fields">
          <Field term="Current state"><RunState state={run.state} reason={run.stateReason} /></Field>
          <Field term="Evidence"><EvidenceState evidence={run.evidence} /></Field>
          <Field term="Operation"><Val value={run.operation} /></Field>
          <Field term="Agent"><Val value={run.agent.name} /> <span className="afcc-quiet afcc-fine"><Val value={run.agent.id} /></span></Field>
          <Field term="Initiator"><Verified value={run.initiator.id} verification={run.initiator.verification} /></Field>
          <Field term="Organization"><Verified value={run.organization.id} verification={run.organization.verification} /></Field>
          <Field term="Approval">
            {approvalCopy(run.approval.state).label}
            {run.approval.approver ? <> · by <code>{run.approval.approver}</code> ({verificationLabel(run.approval.approverVerification)})</> : null}
          </Field>
          <Field term="Correlation ID"><CopyValue value={run.correlation.id} label="correlation ID" /></Field>
        </dl>
      </section>
      <section aria-labelledby="afcc-lo-times">
        <h3 id="afcc-lo-times" className="afcc-lo-h3">Timing</h3>
        <dl className="afcc-lo-fields">
          <Field term="Created"><Val value={formatTimestamp(run.times.created)} /></Field>
          <Field term="Started"><Val value={formatTimestamp(run.times.started)} /></Field>
          <Field term="Last changed"><Val value={formatTimestamp(run.times.lastChanged)} /></Field>
          {run.state === "COMPLETED" ? <Field term="Completed"><Val value={formatTimestamp(run.times.completed)} /></Field> : null}
          {run.state === "FAILED" ? <Field term="Failed"><Val value={formatTimestamp(run.times.failed)} /></Field> : null}
          {run.state === "TIMED_OUT" ? <Field term="Timed out"><Val value={formatTimestamp(run.times.timedOut)} /></Field> : null}
        </dl>
      </section>
      {failedState ? (
        <section aria-labelledby="afcc-lo-failure" className="afcc-lo-failure">
          <h3 id="afcc-lo-failure" className="afcc-lo-h3">Failure</h3>
          <dl className="afcc-lo-fields">
            <Field term="Code"><Val value={run.failure.code} /></Field>
            <Field term="Summary"><Val value={run.failure.summary} /></Field>
          </dl>
        </section>
      ) : null}
      <details className="afcc-lo-more">
        <summary>More details</summary>
        <dl className="afcc-lo-fields">
          <Field term="Run ID"><CopyValue value={run.runId} label="run ID" /></Field>
          <Field term="Plan ID"><CopyValue value={run.planId} label="plan ID" /></Field>
          <Field term="Agent version"><Val value={run.agent.version} /></Field>
          <Field term="Initiator type"><Val value={run.initiator.type} /></Field>
          <Field term="Tenant"><Verified value={run.tenant.id} verification={run.tenant.verification} /></Field>
          <Field term="Source system"><Val value={run.sourceSystem} /></Field>
          <Field term="Entry point"><Val value={run.initiator.entryPoint} /></Field>
          <Field term="Approval basis"><Val value={run.approval.basis} /></Field>
          <Field term="Approval decided"><Val value={formatTimestamp(run.approval.decidedAt)} /></Field>
          <Field term="Provider"><Val value={run.execution.provider} /></Field>
          <Field term="Model"><Val value={run.execution.model} /></Field>
          <Field term="Adapter"><Val value={run.execution.adapter} /></Field>
          <Field term="Retry lineage">
            {run.retry ? <>Retry count <Val value={run.retry.retry_count} />; parent <Val value={run.retry.parent_run_id} /></> : <Val value={null} />}
          </Field>
          <Field term="Execution lease"><Val value={run.lease?.status} /></Field>
          <Field term="State derivation"><Val value={run.stateReason} /></Field>
          {run.initiator.declared && run.initiator.declared.verification ? (
            <Field term="Declared (unverified) identity"><Val value={run.initiator.declared.actor_id} /></Field>
          ) : null}
        </dl>
      </details>
    </div>
  );
}

// ------------------------------------------------------------------ timeline

function TimelineView({ run }) {
  const timeline = useRunView("timeline", run.runId);
  if (!run.runId) return <div className="afcc-lo-view-body"><NoRunYet what="execution timeline" /></div>;
  const events = (timeline.payload?.events || []).map(normalizeTimelineEvent);
  return (
    <div className="afcc-lo-view-body">
      <ViewState result={timeline} what="timeline" />
      {timeline.payload && timeline.payload.state !== "AVAILABLE" ? <p className="afcc-quiet">The run authority has no lifecycle events for this run.</p> : null}
      {events.length ? (
        <ol className="afcc-lo-tl" aria-label="Lifecycle events, oldest first">
          {events.map((e, i) => (
            <li key={`${e.id}-${i}`} className={`afcc-lo-tl-item${e.provenance.legacy ? " is-legacy" : ""}`} data-provenance={e.provenance.label}>
              <p className="afcc-lo-tl-title">
                <span className="afcc-lo-tl-dot" aria-hidden="true" />
                <strong>{e.label}</strong>
                <span className="afcc-lo-tl-when"><Val value={formatTimestamp(e.at)} /></span>
              </p>
              <p className="afcc-lo-tl-line">{transitionText(e.from, e.to)}</p>
              <dl className="afcc-lo-tl-meta">
                <div><dt>Actor</dt><dd><Val quiet value={e.actor} /></dd></div>
                <div><dt>Authority</dt><dd><Val quiet value={e.authority} /></dd></div>
                <div><dt>Reason</dt><dd><Val quiet value={e.reasonCode} />{!display(e.reasonSummary).gap ? <> — {e.reasonSummary}</> : null}</dd></div>
                <div><dt>Evidence</dt><dd>{e.evidenceCount} reference{e.evidenceCount === 1 ? "" : "s"}</dd></div>
                <div><dt>Source</dt><dd>{e.provenance.label}</dd></div>
              </dl>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ evidence

function JsonValue({ value, depth = 0 }) {
  if (value === null || value === undefined) return <span className="afcc-quiet">empty</span>;
  if (typeof value !== "object") return <span className="afcc-lo-json-scalar">{String(value)}</span>;
  const entries = Array.isArray(value) ? value.map((v, i) => [String(i + 1), v]) : Object.entries(value);
  if (!entries.length) return <span className="afcc-quiet">{Array.isArray(value) ? "no items" : "no fields"}</span>;
  const body = (
    <dl className="afcc-lo-json">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt>{Array.isArray(value) ? `#${k}` : k}</dt>
          <dd><JsonValue value={v} depth={depth + 1} /></dd>
        </div>
      ))}
    </dl>
  );
  if (depth === 0) return body;
  return (
    <details className="afcc-lo-json-group" open={depth < 2}>
      <summary>{Array.isArray(value) ? `${entries.length} item${entries.length === 1 ? "" : "s"}` : `${entries.length} field${entries.length === 1 ? "" : "s"}`}</summary>
      {body}
    </details>
  );
}

function ArtifactViewer({ runId, artifactId, onClose }) {
  const result = useRunArtifact(runId, artifactId);
  const p = result.payload;
  const trust = TRUST_COPY[p?.trust] || TRUST_COPY.NOT_AVAILABLE;
  const body = p?.body && typeof p.body === "object" ? p.body : null;
  const headline = body ? { type: body.type, title: body.title } : null;
  const contents = body ? Object.fromEntries(Object.entries(body).filter(([k]) => !["type", "title"].includes(k))) : null;
  return (
    <section className="afcc-lo-artifact" aria-labelledby="afcc-lo-artifact-title">
      <div className="afcc-lo-artifact-head">
        <h4 id="afcc-lo-artifact-title" className="afcc-lo-artifact-title">Artifact<code>{artifactId}</code></h4>
        <button type="button" className="afcc-link-button" onClick={onClose}>Close artifact</button>
      </div>
      <ViewState result={result} what="artifact" />
      {p && p.state === "NOT_AVAILABLE" ? <p className="afcc-quiet">This artifact is not part of this run's recorded evidence.</p> : null}
      {p && p.state === "AVAILABLE" ? (
        <>
          <p className="afcc-lo-trust"><span className={`afcc-pill afcc-tone-${trust.tone}`} data-trust={p.trust}>{trust.label}</span></p>
          {!trust.trusted ? (
            <p className="afcc-lo-warning" role="note">
              {p.trust === "INTEGRITY_FAILED"
                ? "The stored body does not match its recorded digest, so it is not shown and must not be relied on."
                : p.trust === "NOT_TRUSTED_REPLICA_LOCAL"
                  ? "This copy lives on one replica's disk and cannot be verified. It is shown for reference only and is not trusted evidence."
                  : "No verified body is available for this artifact."}
            </p>
          ) : null}
          <dl className="afcc-lo-fields">
            <Field term="Artifact ID"><CopyValue value={p.artifact?.artifact_id} label="artifact ID" /></Field>
            <Field term="SHA-256"><CopyValue value={p.artifact?.sha256} label="SHA-256 digest" /></Field>
            <Field term="Type"><Val value={p.artifact?.type} /></Field>
            <Field term="Size"><Val value={formatBytes(p.artifact?.size)} /></Field>
            <Field term="Completeness"><Val value={p.artifact?.completeness} /></Field>
          </dl>
          {body ? (
            <div className={`afcc-lo-artifact-body${trust.trusted ? "" : " is-untrusted"}`}>
              {headline?.title || headline?.type ? (
                <p className="afcc-lo-artifact-sum"><strong><Val value={headline.title} /></strong> · <Val value={headline.type} /></p>
              ) : null}
              <JsonValue value={contents} />
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function EvidenceView({ run }) {
  const evidence = useRunView("evidence", run.runId);
  const [openArtifact, setOpenArtifact] = React.useState(null);
  if (!run.runId) return <div className="afcc-lo-view-body"><NoRunYet what="evidence" /></div>;
  const e = evidence.payload?.evidence;
  const status = e?.evidence_status || run.evidence;
  const artifacts = Array.isArray(e?.artifact_refs) ? e.artifact_refs : [];
  const exec = runStateCopy(run.state);
  const ev = evidenceCopy(status);
  return (
    <div className="afcc-lo-view-body">
      <ViewState result={evidence} what="evidence" />
      <dl className="afcc-lo-split-facts" aria-label="Execution result and evidence are separate facts">
        <div><dt>Execution result</dt><dd><RunState state={run.state} /></dd></div>
        <div><dt>Evidence</dt><dd><EvidenceState evidence={status} /></dd></div>
      </dl>
      <p className="afcc-quiet afcc-fine">
        {exec.label} describes what the run did. {ev.label} describes whether its artifacts are durably stored{status?.verified ? " and their digests re-verified on this read" : ""}.
      </p>
      {evidence.payload && artifacts.length === 0 ? <p className="afcc-quiet">This run recorded no artifacts.</p> : null}
      {artifacts.length ? (
        <ul className="afcc-lo-artifacts" aria-label="Artifacts">
          {artifacts.map((a) => {
            const storage = labelFrom(STORAGE_STATE_COPY, a.storage_state);
            const verification = labelFrom(VERIFICATION_COPY, a.verification_state);
            return (
              <li key={a.artifact_id} className="afcc-lo-artifact-row" data-storage-state={a.storage_state} data-verification-state={a.verification_state}>
                <p className="afcc-lo-artifact-id"><code>{display(a.artifact_id).text}</code> <span className="afcc-quiet afcc-fine"><Val value={a.type} /></span></p>
                <p className="afcc-lo-artifact-flags">
                  <span className={`afcc-pill afcc-tone-${storage.tone}`}><span className="afcc-sr-only">Storage: </span>{storage.label}</span>
                  <span className={`afcc-pill afcc-tone-${verification.tone}`}><span className="afcc-sr-only">Verification: </span>{verification.label}</span>
                </p>
                <dl className="afcc-lo-tl-meta">
                  <div><dt>Size</dt><dd>{formatBytes(a.size)}</dd></div>
                  <div><dt>SHA-256</dt><dd><code title={a.sha256}>{shortHash(a.sha256)}</code></dd></div>
                  <div><dt>Created</dt><dd><Val quiet value={formatTimestamp(a.created_at)} /></dd></div>
                </dl>
                <button type="button" className="afcc-link-button" aria-expanded={openArtifact === a.artifact_id} onClick={() => setOpenArtifact(openArtifact === a.artifact_id ? null : a.artifact_id)}>
                  {openArtifact === a.artifact_id ? "Hide artifact" : "View artifact"}<span className="afcc-sr-only"> {a.artifact_id}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {openArtifact ? <ArtifactViewer runId={run.runId} artifactId={openArtifact} onClose={() => setOpenArtifact(null)} /> : null}
    </div>
  );
}

// ------------------------------------------------------------------ dependencies

function RunRef({ id, runs, onSelect }) {
  if (display(id).gap) return <Val value={id} />;
  const target = runs.find((r) => r.runId === id);
  if (!target) return <code>{id}</code>;
  return <button type="button" className="afcc-link-button" onClick={(e) => onSelect(target, e.currentTarget)}>{id}<span className="afcc-sr-only"> (open run)</span></button>;
}

function DependenciesView({ run, runs, onSelect }) {
  const deps = useRunView("dependencies", run.runId);
  if (!run.runId) return <div className="afcc-lo-view-body"><NoRunYet what="dependencies" /></div>;
  const p = deps.payload || {};
  const retry = p.retry_lineage || run.retry || {};
  const samePlan = Array.isArray(retry.same_plan_run_ids) ? retry.same_plan_run_ids : [];
  const dependencies = Array.isArray(p.dependency_run_ids) ? p.dependency_run_ids : run.dependencyRunIds;
  return (
    <div className="afcc-lo-view-body">
      <ViewState result={deps} what="dependencies" />
      <dl className="afcc-lo-fields">
        <Field term="Plan"><CopyValue value={run.planId} label="plan ID" /></Field>
        <Field term="Parent run"><RunRef id={p.parent_run_id ?? retry.parent_run_id} runs={runs} onSelect={onSelect} /></Field>
        <Field term="Root run"><RunRef id={retry.root_run_id} runs={runs} onSelect={onSelect} /></Field>
        <Field term="Retry of"><RunRef id={retry.retry_of_run_id} runs={runs} onSelect={onSelect} /></Field>
        <Field term="Retry count"><Val value={retry.retry_count} /></Field>
        <Field term="Retries supported"><Val value={retry.retry_supported} /></Field>
        <Field term="Dependency runs">
          {dependencies.length ? <ul className="afcc-lo-inline">{dependencies.map((id) => <li key={id}><RunRef id={id} runs={runs} onSelect={onSelect} /></li>)}</ul> : "None recorded"}
        </Field>
        <Field term="Correlation"><CopyValue value={p.correlation_id ?? run.correlation.id} label="correlation ID" /></Field>
        <Field term="Correlation source"><Val value={run.correlation.source} /></Field>
        <Field term="Correlation continuity"><Val value={run.correlation.continuity} /></Field>
      </dl>
      {samePlan.length ? (
        <p className="afcc-lo-warning" role="note">
          Other runs are recorded against the same plan: {samePlan.map((id, i) => <React.Fragment key={id}>{i ? ", " : ""}<RunRef id={id} runs={runs} onSelect={onSelect} /></React.Fragment>)}.
          Execution is single-flight per plan, so this is an anomaly or a reclaimed run — not a retry chain.
        </p>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ container

export default function RunFocus({ run: listRun, runs, view, onView, onClose, onSelect, mode }) {
  // One detail read per focused run: the header and every view show the same,
  // freshly re-verified facts (the list read only records digests).
  const detail = useRunView("detail", listRun.runId);
  const run = detail.payload?.run ? normalizeRun(detail.payload.run) : listRun;
  const titleRef = React.useRef(null);
  const tabRefs = React.useRef({});
  const modal = mode !== "docked";
  const current = VIEWS.some((v) => v.id === view) ? view : "overview";

  React.useEffect(() => {
    if (modal) titleRef.current?.focus();
  }, [modal, run.key]);

  React.useEffect(() => {
    if (!modal) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, onClose]);

  const onTabKey = (e) => {
    const i = VIEWS.findIndex((v) => v.id === current);
    const next = e.key === "ArrowRight" ? (i + 1) % VIEWS.length : e.key === "ArrowLeft" ? (i - 1 + VIEWS.length) % VIEWS.length : e.key === "Home" ? 0 : e.key === "End" ? VIEWS.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    onView(VIEWS[next].id);
    requestAnimationFrame(() => tabRefs.current[VIEWS[next].id]?.focus());
  };

  const titleId = `afcc-lo-focus-title`;
  const label = run.kind === "run" ? run.runId : `Plan ${run.planId || ""}`;
  const content = (
    <>
      <div className="afcc-lo-focus-head">
        <div>
          <p className="afcc-eyebrow">{run.kind === "run" ? "Run" : "Plan (no run yet)"}</p>
          <h2 id={titleId} ref={titleRef} tabIndex={-1} className="afcc-lo-mono">{label}</h2>
          <p className="afcc-lo-focus-line"><RunState state={run.state} reason={run.stateReason} /> <EvidenceState evidence={run.evidence} /></p>
        </div>
        <button type="button" className="afcc-close" onClick={onClose} aria-label="Close run focus">
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div className="afcc-lo-views" role="tablist" aria-label="Run views" onKeyDown={onTabKey}>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            ref={(el) => { tabRefs.current[v.id] = el; }}
            type="button"
            role="tab"
            id={`afcc-lo-view-${v.id}`}
            aria-selected={current === v.id}
            aria-controls={`afcc-lo-pane-${v.id}`}
            tabIndex={current === v.id ? 0 : -1}
            className={`afcc-lo-view-btn${current === v.id ? " is-active" : ""}`}
            onClick={() => onView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`afcc-lo-pane-${current}`} aria-labelledby={`afcc-lo-view-${current}`} className="afcc-lo-pane" tabIndex={0}>
        {current === "overview" ? <OverviewView key={run.key} run={run} detail={detail} /> : null}
        {current === "timeline" ? <TimelineView key={run.key} run={run} /> : null}
        {current === "evidence" ? <EvidenceView key={run.key} run={run} /> : null}
        {current === "dependencies" ? <DependenciesView key={run.key} run={run} runs={runs} onSelect={onSelect} /> : null}
      </div>
    </>
  );

  if (!modal) return <div className="afcc-lo-focus is-docked" aria-labelledby={titleId}>{content}</div>;
  return (
    <>
      <div className="afcc-scrim" aria-hidden="true" onClick={onClose} />
      <div className={`afcc-lo-focus is-${mode}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {content}
      </div>
    </>
  );
}
