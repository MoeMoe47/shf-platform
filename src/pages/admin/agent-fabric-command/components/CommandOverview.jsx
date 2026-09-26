import React from "react";
import { Link } from "react-router-dom";
import { GAP, KNOWN_DATA_GAPS, SOURCE_STATE } from "../commandContracts.js";
import {
  agentsNeedingAttention,
  formatAge,
  formatTimestamp,
  gapForState,
  isDataState,
  shortId,
  VERDICT_TONE,
} from "../commandPresentation.js";
import { GapMarker, GapValue, SourceFooter, SourceNotice, StateChip, ToneChip } from "./SourceState.jsx";

// Operational panels below the map. Each reads one or two snapshot sources and
// nothing else; `related` marks the panels that belong to the selected system.

function Lane({ id, title, eyebrow, children, className = "", related = false, actions = null }) {
  const headingId = `afcc-lane-${id}-title`;
  return (
    <section id={`afcc-lane-${id}`} className={`afcc-lane ${className}${related ? " is-related" : ""}`} aria-labelledby={headingId} data-lane={id}>
      <div className="afcc-lane-head">
        <div>
          {eyebrow ? <p className="afcc-eyebrow">{eyebrow}</p> : null}
          <h2 id={headingId} tabIndex={-1}>{title}</h2>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Count({ label, value, gap, tone }) {
  return (
    <div className="afcc-count">
      <dt>{label}</dt>
      <dd className={tone ? `afcc-tone-${tone}` : undefined}>{value === null || value === undefined ? <GapMarker gap={gap} /> : value}</dd>
    </div>
  );
}

function DetailButton({ children, onClick }) {
  return <button type="button" className="afcc-link-button" onClick={onClick}>{children}</button>;
}

// ------------------------------------------------------ Recent operations
const RUN_PREVIEW = 6;

function RecentOperationsLane({ projection, onOpen, related }) {
  const [showAll, setShowAll] = React.useState(false);
  const runs = isDataState(projection.state) ? projection.data.runs : [];
  const visible = showAll ? runs : runs.slice(0, RUN_PREVIEW);
  return (
    <Lane id="operations" eyebrow="Run ledger" title="Recent operations" className="afcc-lane--operations" related={related}>
      <p className="afcc-quiet">
        Recorded run events, newest first. Events carry kind and outcome only; no live run state is published.
      </p>
      {projection.state === SOURCE_STATE.EMPTY ? (
        <p className="afcc-empty">The run ledger responded with no recorded run events.</p>
      ) : !isDataState(projection.state) ? (
        <SourceNotice projection={projection} compact />
      ) : (
        <div className="afcc-ledger-wrap">
          <table className="afcc-ledger">
            <caption className="afcc-sr-only">Recent run events from the Agent Fabric run ledger</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Run ID</th>
                <th scope="col">Agent</th>
                <th scope="col">Operation</th>
                <th scope="col">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((run) => (
                <tr key={run.rowKey} onClick={(e) => onOpen({ type: "run", key: run.rowKey }, e.currentTarget.querySelector("button"))}>
                  <td data-label="Time"><GapValue field={run.timestamp} render={formatTimestamp} /></td>
                  <td data-label="Run ID">
                    <button type="button" className="afcc-row-button" onClick={(e) => { e.stopPropagation(); onOpen({ type: "run", key: run.rowKey }, e.currentTarget); }}>
                      <span className="afcc-sr-only">Open run </span>
                      <GapValue field={run.runId} render={(v) => <code>{shortId(v, 12)}</code>} />
                    </button>
                  </td>
                  <td data-label="Agent"><GapValue field={run.agentName} /></td>
                  <td data-label="Operation"><GapValue field={run.kind} /></td>
                  <td data-label="Outcome">
                    <GapValue field={run.outcome} render={(v) => <ToneChip tone={v === "ok" ? "ok" : "warn"}>{v}</ToneChip>} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {runs.length > RUN_PREVIEW ? (
            <button type="button" className="afcc-link-button" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
              {showAll ? `Show latest ${RUN_PREVIEW}` : `Show all ${runs.length} returned events`}
            </button>
          ) : null}
          {projection.data.droppedCount ? (
            <p className="afcc-quiet">{projection.data.droppedCount} malformed event(s) in the response were not shown.</p>
          ) : null}
        </div>
      )}
      <p className="afcc-quiet afcc-fine">Publication status is not in this view: the published-report registry is not an admitted source.</p>
      <SourceFooter projection={projection} />
    </Lane>
  );
}

// ------------------------------------------------------ Watchtower + LOO
function WatchtowerLane({ watchtower, onOpen, related }) {
  const data = isDataState(watchtower.state) ? watchtower.data : null;
  const age = data ? formatAge(data.ageSeconds) : null;
  const evaluated = data ? data.programs.filter((p) => p.state === "EVALUATED") : [];
  return (
    <Lane
      id="watchtower"
      eyebrow="Watchtower · LOO"
      title="Watchtower & LOO"
      className="afcc-lane--watchtower"
      related={related}
      actions={<DetailButton onClick={(e) => onOpen({ type: "source", key: "watchtower" }, e.currentTarget)}>Watchtower detail</DetailButton>}
    >
      <div className="afcc-split">
        <div className="afcc-split-part">
          <h3 className="afcc-subhead">Watchtower — risk authority</h3>
          {data ? (
            <>
              <p className="afcc-lane-verdict">
                <ToneChip tone={data.worstRiskBand === "GREEN" ? "ok" : data.worstRiskBand === "QUARANTINE" ? "fail" : "warn"}>{data.worstRiskBand}</ToneChip>
                <span className="afcc-age" data-age-seconds={data.ageSeconds ?? ""}>{age ? `Last evaluated ${age}` : "Evaluation time not captured"}</span>
              </p>
              <dl className="afcc-counts">
                <Count label="Programs evaluated" value={data.evaluatedProgramCount} />
                <Count label="Not yet evaluated" value={data.notEvaluatedProgramCount} />
                <Count label="Quarantined (last evaluation)" value={data.quarantinedCount} tone={data.quarantinedCount ? "fail" : null} />
                <Count label="Manual quarantine active" value={data.manualQuarantine.activeCount} gap={GAP.NOT_AVAILABLE} />
                <Count label="Alerts" value={null} gap={GAP.NOT_PUBLISHED} />
                <Count label="Integrity" value={null} gap={GAP.NOT_PUBLISHED} />
              </dl>
              {evaluated.length ? (
                <ul className="afcc-risk-list" aria-label="Risk by program (latest persisted evaluation)">
                  {evaluated.slice(0, 4).map((p) => (
                    <li key={p.programId}>
                      <code>{p.programId}</code>
                      <span className="afcc-risk-tags">
                        <ToneChip tone={p.riskBand === "GREEN" ? "ok" : p.riskBand === "QUARANTINE" ? "fail" : "warn"}>{p.riskBand || "band not recorded"}</ToneChip>
                        {p.action ? <span className="afcc-quiet">{p.action}</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <SourceNotice projection={watchtower} compact />
          )}
        </div>
        <div className="afcc-split-part">
          <h3 className="afcc-subhead">LOO — outcome ranking (advisory)</h3>
          <p className="afcc-quiet">
            LOO ranks outcomes after Watchtower's gate; quarantined programs score 0. LOO rankings are not an admitted
            Command Center source, so no score is shown here.
          </p>
          <p><GapMarker gap={GAP.NOT_PUBLISHED} /></p>
          <Link className="afcc-link-button" to="/lord-outcomes">Open LOO</Link>
        </div>
      </div>
      <p className="afcc-quiet afcc-fine">Read from Watchtower's persisted state; this view never evaluates risk. No quarantine actions exist here.</p>
      <SourceFooter projection={watchtower} />
    </Lane>
  );
}

// ------------------------------------------- Infrastructure / Observability
function VerifierLane({ id, title, eyebrow, projection, onOpen, related, note }) {
  const data = isDataState(projection.state) ? projection.data : null;
  const age = data ? formatAge(data.ageSeconds) : null;
  return (
    <Lane id={id} eyebrow={eyebrow} title={title} className="afcc-lane--verifier" related={related}>
      <button type="button" className="afcc-item-button afcc-verifier" data-verifier={id} onClick={(e) => onOpen({ type: "source", key: id }, e.currentTarget)}>
        <span className="afcc-verifier-name">
          <span>{data ? "Last recorded result" : "Recorded result"}</span>
          <span className="afcc-age">{data ? (age ? `Verified ${age}` : "Verification time not captured") : null}</span>
        </span>
        {data ? <ToneChip tone={VERDICT_TONE[data.verdict]}>{data.verdict}</ToneChip> : <StateChip state={projection.state} />}
      </button>
      {data ? (
        <>
          <p className="afcc-quiet afcc-fine">{formatTimestamp(data.lastVerifiedAt) || "Timestamp not captured"}</p>
          <ul className="afcc-check-list" aria-label={`${title} checks`}>
            {data.checks.slice(0, 5).map((c, i) => (
              <li key={c.name || i}>
                <code>{c.name || "check not named"}</code>
                <ToneChip tone={c.ok === true ? "ok" : c.ok === false ? "fail" : "neutral"}>{c.ok === true ? "Pass" : c.ok === false ? "Fail" : "No result"}</ToneChip>
              </li>
            ))}
          </ul>
          {data.checks.length > 5 ? <p className="afcc-quiet afcc-fine">{data.checks.length - 5} more check(s) in detail.</p> : null}
        </>
      ) : projection.state === SOURCE_STATE.NOT_YET_VERIFIED ? (
        <p className="afcc-quiet afcc-fine">No result recorded. Verification runs only as a privileged admin action; this view never runs it.</p>
      ) : null}
      {note ? <p className="afcc-quiet afcc-fine">{note}</p> : null}
    </Lane>
  );
}

// ---------------------------------------------------------- Agent fleet
function Distribution({ parts, total }) {
  if (!total || parts.some((p) => p.value === null)) return null;
  return (
    <div className="afcc-distribution" role="img" aria-label={parts.map((p) => `${p.label} ${p.value} of ${total}`).join(", ")}>
      {parts.map((p) => (p.value ? <span key={p.label} className={`afcc-distribution-part afcc-tone-${p.tone}`} style={{ flexGrow: p.value }} /> : null))}
    </div>
  );
}

function AgentFleetLane({ health, readiness, onOpen, related }) {
  const hs = isDataState(health.state) ? health.data.summary : null;
  const rs = isDataState(readiness.state) ? readiness.data.summary : null;
  const hGap = gapForState(health.state);
  const rGap = gapForState(readiness.state);
  const attention = agentsNeedingAttention(health, readiness);
  return (
    <Lane
      id="agents"
      eyebrow="Agent registry"
      title="Agent fleet"
      className="afcc-lane--agents"
      related={related}
      actions={<DetailButton onClick={(e) => onOpen({ type: "agents" }, e.currentTarget)}>Fleet detail</DetailButton>}
    >
      {hs ? (
        <Distribution
          total={hs.total}
          parts={[
            { label: "Healthy", value: hs.ready, tone: "ok" },
            { label: "Health warnings", value: hs.warning, tone: "warn" },
            { label: "Other", value: hs.total !== null && hs.ready !== null && hs.warning !== null ? Math.max(hs.total - hs.ready - hs.warning, 0) : null, tone: "neutral" },
          ]}
        />
      ) : null}
      <dl className="afcc-counts">
        <Count label="Registered" value={hs?.total} gap={hGap} />
        <Count label="Enabled" value={isDataState(health.state) ? health.data.enabledCount : null} gap={isDataState(health.state) ? GAP.NOT_CAPTURED : hGap} />
        <Count label="Healthy" value={hs?.ready} gap={hGap} />
        <Count label="Health warnings" value={hs?.warning} gap={hGap} />
        <Count label="Execution blocked" value={rs?.blocked} gap={rGap} />
        <Count label="Approval required by policy" value={rs?.approvalRequired} gap={rGap} />
      </dl>
      {!isDataState(health.state) ? <SourceNotice projection={health} compact /> : null}
      {!isDataState(readiness.state) && readiness.state !== health.state ? <SourceNotice projection={readiness} compact /> : null}
      {attention.length ? (
        <ul className="afcc-item-list" aria-label="Agents flagged by the registry">
          {attention.slice(0, 4).map((agent) => (
            <li key={agent.agentId}>
              <button type="button" className="afcc-item-button" onClick={(e) => onOpen({ type: "agent", key: agent.agentId }, e.currentTarget)}>
                <span>{agent.name || agent.agentId}</span>
                <span className="afcc-item-tags">
                  {agent.health ? <ToneChip tone="warn">health: {agent.health}</ToneChip> : null}
                  {agent.execution ? <ToneChip tone="warn">execution: {agent.execution}</ToneChip> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="afcc-quiet afcc-fine">
        Approval required is a policy setting per agent, not a pending queue. Per-agent activity ranking is not published.
      </p>
      <Link className="afcc-link-button" to="/agent-fabric">Open agent registry page</Link>
    </Lane>
  );
}

// ------------------------------------------------ Governance & alignment
function GovernanceLane({ gate, onOpen, related }) {
  const data = isDataState(gate.state) ? gate.data : null;
  const disabled = data ? data.blockers.filter((b) => b.reason === "layer_disabled").length : null;
  return (
    <Lane
      id="gate"
      eyebrow="Layer registry · policy"
      title="Governance & alignment"
      className="afcc-lane--gate"
      related={related}
      actions={<DetailButton onClick={(e) => onOpen({ type: "gate" }, e.currentTarget)}>Gate detail</DetailButton>}
    >
      <h3 className="afcc-subhead">Policy state (not system health)</h3>
      {data ? (
        <>
          <p className="afcc-lane-verdict">
            <ToneChip tone={data.gatePass ? "ok" : "fail"}>{data.gatePass ? "Gate pass" : "Gate blocked"}</ToneChip>
          </p>
          <dl className="afcc-counts">
            <Count label="Required layers" value={data.requiredLayers.length} />
            <Count label="Required layers enabled" value={data.requiredLayers.length - disabled} />
            <Count label="Blockers" value={data.blockers.length} tone={data.blockers.length ? "fail" : null} />
          </dl>
          {data.blockers.length ? (
            <ul className="afcc-plain-list">
              {data.blockers.slice(0, 3).map((b, i) => (
                <li key={`${b.layer}-${i}`}><code>{b.layer || "layer not named"}</code> {b.reason || "no reason given"}</li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <SourceNotice projection={gate} compact />
      )}
      <dl className="afcc-counts">
        <Count label="In review" value={null} gap={GAP.NOT_PUBLISHED} />
        {/* Endpoints exist (/admin/align/containment, /ai-guardrails/*) but are not admitted to this view. */}
        <Count label="Containment" value={null} gap={GAP.AUTH_HARDENING_REQUIRED} />
        <Count label="Guardrail posture" value={null} gap={GAP.AUTH_HARDENING_REQUIRED} />
      </dl>
      <p className="afcc-quiet afcc-fine">Read-only. Layer, containment and policy changes stay with their authorities.</p>
      <SourceFooter projection={gate} />
    </Lane>
  );
}

// ----------------------------------------------------------- Known data gaps
function DataGapsLane({ onOpen }) {
  return (
    <Lane
      id="gaps"
      eyebrow="Published limits"
      title="Known data gaps"
      className="afcc-lane--gaps"
      actions={<DetailButton onClick={(e) => onOpen({ type: "gaps" }, e.currentTarget)}>Gap detail</DetailButton>}
    >
      <ul className="afcc-gap-list">
        {KNOWN_DATA_GAPS.map((gap) => (
          <li key={gap.id}>
            <span className="afcc-gap-name">{gap.label}</span>
            <GapMarker gap={gap.gap} />
          </li>
        ))}
      </ul>
    </Lane>
  );
}

// Panels that belong to each map node (for "update lower panels" on selection).
const LANES_FOR_NODE = {
  "agent-fabric": ["operations", "agents", "gate", "infrastructure", "observability"],
  watchtower: ["watchtower"],
  loo: ["watchtower"],
};

export default function CommandOverview({ snapshot, onOpen, selectedNode }) {
  const related = new Set(LANES_FOR_NODE[selectedNode] || []);
  return (
    <div className="afcc-board">
      <RecentOperationsLane projection={snapshot.recentRuns} onOpen={onOpen} related={related.has("operations")} />
      <WatchtowerLane watchtower={snapshot.watchtower} onOpen={onOpen} related={related.has("watchtower")} />
      <VerifierLane
        id="infrastructure"
        eyebrow="Fabric verifier"
        title="Infrastructure"
        projection={snapshot.infrastructure}
        onOpen={onOpen}
        related={related.has("infrastructure")}
      />
      <VerifierLane
        id="observability"
        eyebrow="Fabric verifier"
        title="Observability"
        projection={snapshot.observability}
        onOpen={onOpen}
        related={related.has("observability")}
        note="Logs, metrics, tracing and alerting are reported only as the named checks the verifier recorded."
      />
      <AgentFleetLane health={snapshot.agentHealth} readiness={snapshot.agentReadiness} onOpen={onOpen} related={related.has("agents")} />
      <GovernanceLane gate={snapshot.layerGate} onOpen={onOpen} related={related.has("gate")} />
      <DataGapsLane onOpen={onOpen} />
    </div>
  );
}
