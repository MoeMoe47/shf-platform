import React from "react";
import { COMMAND_ENDPOINTS, GAP, KNOWN_DATA_GAPS, SOURCE_STATE } from "../commandContracts.js";
import { derivePosture } from "../commandAdapters.js";
import { failureLayerLabel, formatAge, formatTimestamp, isDataState, POSTURE_COPY, VERDICT_TONE } from "../commandPresentation.js";
import { dependencyPaths, directEdges, HUB_ID, NODE_BY_ID, TOPOLOGY_EDGES } from "../ecosystemTopology.js";
import { EDGE_STATE, NODE_STATUS_TONE, PRIORITY, PRIORITY_COPY } from "../operationalModel.js";
import { GapMarker, GapValue, SourceNotice, StateChip, ToneChip } from "./SourceState.jsx";

// Context drawer: the investigation workspace. Five views per selection —
// Overview, Authority, Timeline, Evidence, Dependencies — each filled only from
// admitted sources, the canonical topology, or an explicit gap. Read-only.

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const DRAWER_VIEWS = Object.freeze([
  { id: "overview", label: "Overview" },
  { id: "authority", label: "Authority" },
  { id: "timeline", label: "Timeline" },
  { id: "evidence", label: "Evidence" },
  { id: "dependencies", label: "Dependencies" },
]);

const AUTH_COPY = {
  ADMIN_KEY: "Fabric admin credential, checked server-side; not available to the browser",
  PUBLIC_PROBE: "Public probe",
  COMMAND_READ: "Fabric session with bos.governance.read",
  SHS_BRIDGE: "SHS session with SHS bos.governance.read; the SHS API reads Fabric server-side with its service identity (no credential in the browser)",
};

const ACCESS_COPY = {
  session: "Fabric session",
  shs_bridge: "SHS bridge (server-side service identity)",
};

function Row({ label, children }) {
  return (
    <div className="afcc-kv">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Gap({ gap = GAP.NOT_PUBLISHED, children }) {
  return (
    <p className="afcc-view-gap">
      <GapMarker gap={gap} /> {children}
    </p>
  );
}

function ChecksList({ checks }) {
  if (!checks?.length) return <p className="afcc-quiet">No named checks in the response.</p>;
  return (
    <ul className="afcc-plain-list">
      {checks.map((check) => (
        <li key={check.name}>
          <ToneChip tone={check.ok === true ? "ok" : check.ok === false ? "fail" : "neutral"}>
            {check.ok === true ? "Pass" : check.ok === false ? "Fail" : "No result"}
          </ToneChip>{" "}
          <code>{check.name}</code>
          {check.error ? <span className="afcc-quiet"> {check.error}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function SourceMeta({ projectionKey, projection }) {
  const contract = COMMAND_ENDPOINTS[projectionKey];
  if (!projection) return null;
  return (
    <dl className="afcc-kvs">
      <Row label="State"><StateChip state={projection.state} /></Row>
      <Row label="Endpoint"><code>{contract?.method} {projection.source.endpoint}</code></Row>
      <Row label="Authority">{projection.source.authority}</Row>
      <Row label="Backend auth">{AUTH_COPY[contract?.auth] || "None found"}</Row>
      {projection.data?.access ? <Row label="Read via">{ACCESS_COPY[projection.data.access] || projection.data.access}</Row> : null}
      <Row label="Router"><code>{contract?.router}</code></Row>
      {contract?.fabricRead ? <Row label="Fabric projection"><code>GET {contract.fabricRead}</code></Row> : null}
      {failureLayerLabel(projection.source.failedLayer) ? <Row label="Failed at">{failureLayerLabel(projection.source.failedLayer)}</Row> : null}
      {projection.source.httpStatus ? <Row label="HTTP status">{projection.source.httpStatus}</Row> : null}
      <Row label="Observed">{formatTimestamp(projection.source.observedAt) || <GapMarker gap={GAP.NOT_AVAILABLE} />}</Row>
    </dl>
  );
}

function NodeLink({ id, onSelect, children }) {
  const node = NODE_BY_ID[id];
  if (!node) return <span>{children || id}</span>;
  return (
    <button type="button" className="afcc-inline-button" onClick={(e) => onSelect({ type: "node", key: id }, e.currentTarget)}>
      {children || node.name}
    </button>
  );
}

// ================================================================ legacy details
// (AFCC-2/2A detail views; they are the Overview of source-type selections.)

function WatchtowerDetail({ data }) {
  return (
    <>
      {data.worstRiskBand ? (
        <dl className="afcc-kvs">
          <Row label="Worst band (latest evaluation)"><ToneChip tone={data.worstRiskBand === "GREEN" ? "ok" : "warn"}>{data.worstRiskBand}</ToneChip></Row>
          <Row label="Last evaluated">{formatTimestamp(data.latestEvaluatedAt) || <GapMarker gap={GAP.NOT_CAPTURED} />}{formatAge(data.ageSeconds) ? ` · ${formatAge(data.ageSeconds)}` : ""}</Row>
          <Row label="Freshness threshold">Not defined by Watchtower; age is shown as recorded</Row>
        </dl>
      ) : null}
      <h3 className="afcc-subhead">Programs</h3>
      <ul className="afcc-plain-list">
        {data.programs.map((p) => (
          <li key={p.programId}>
            <code>{p.programId}</code>{" "}
            {p.state === "EVALUATED" ? (
              <>
                <ToneChip tone={p.riskBand === "GREEN" ? "ok" : "warn"}>{p.riskBand}</ToneChip>
                {p.action ? <span className="afcc-quiet"> action {p.action}</span> : null}
                {p.reasons.length ? <span className="afcc-quiet"> · {p.reasons.join(", ")}</span> : null}
                {p.evaluatedAt ? <span className="afcc-quiet"> · {formatTimestamp(p.evaluatedAt)}</span> : null}
              </>
            ) : <GapMarker gap={GAP.NOT_PUBLISHED} />}
          </li>
        ))}
      </ul>
      <dl className="afcc-kvs">
        <Row label="Manual quarantine">{data.manualQuarantine.activeCount ?? <GapMarker gap={GAP.NOT_AVAILABLE} />} active</Row>
        <Row label="Alerts"><GapMarker gap={GAP.NOT_PUBLISHED} /> Watchtower computes alerts during evaluation and does not persist them.</Row>
        <Row label="Integrity rates"><GapMarker gap={GAP.NOT_PUBLISHED} /> Not persisted by Watchtower.</Row>
        <Row label="Latest attestation">{data.attestation.recorded ? `${data.attestation.kind || "attestation"} · ${formatTimestamp(data.attestation.createdAt) || ""}` : "None recorded"}</Row>
        {data.nonCatalogSnapshotPrograms ? <Row label="Outside catalog">{data.nonCatalogSnapshotPrograms} program(s) with snapshots are not in the current catalog and are not shown.</Row> : null}
      </dl>
      <p className="afcc-quiet">Read from Watchtower's persisted store. This view never evaluates risk or writes Watchtower state.</p>
    </>
  );
}

function SourceDetail({ projectionKey, snapshot }) {
  const projection = snapshot[projectionKey];
  if (!projection) return <p>Source not found.</p>;
  const data = isDataState(projection.state) ? projection.data : null;
  return (
    <>
      <SourceMeta projectionKey={projectionKey} projection={projection} />
      {!data ? <SourceNotice projection={projection} /> : null}
      {data && (projectionKey === "healthReady" || projectionKey === "healthDegraded") ? (
        <>
          <h3 className="afcc-subhead">Checks</h3>
          <ChecksList checks={data.checks} />
          {data.warnings?.length ? (
            <>
              <h3 className="afcc-subhead">Warnings</h3>
              <ul className="afcc-plain-list">{data.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            </>
          ) : null}
        </>
      ) : null}
      {data && projectionKey === "status" ? (
        <dl className="afcc-kvs">
          <Row label="Runtime mode">{data.mode}</Row>
          <Row label="Security service">{data.security ? `${data.security.mode || "mode not reported"} · ${data.security.ok ? "responding" : "not responding"}` : <GapMarker gap={GAP.NOT_CAPTURED} />}</Row>
        </dl>
      ) : null}
      {data && (projectionKey === "infrastructure" || projectionKey === "observability") ? (
        <>
          <p><ToneChip tone={VERDICT_TONE[data.verdict]}>Last recorded {data.verdict}</ToneChip></p>
          <dl className="afcc-kvs">
            <Row label="Verified">{formatTimestamp(data.lastVerifiedAt) || <GapMarker gap={GAP.NOT_CAPTURED} />}{formatAge(data.ageSeconds) ? ` · ${formatAge(data.ageSeconds)}` : ""}</Row>
            <Row label="Freshness threshold">Not defined by the Fabric; age is shown as recorded</Row>
            <Row label="Recorded by">{data.trigger ? <code>{data.trigger}</code> : <GapMarker gap={GAP.NOT_CAPTURED} />}</Row>
          </dl>
          <h3 className="afcc-subhead">Checks</h3>
          <ChecksList checks={data.checks.map((c) => ({ name: c.name, ok: c.ok, error: c.ok === true ? null : c.reasonCode }))} />
          <p className="afcc-quiet">This is the last result recorded by the privileged verification action. Reading it runs nothing.</p>
        </>
      ) : null}
      {projection.state === SOURCE_STATE.NOT_YET_VERIFIED ? (
        <p className="afcc-quiet">An administrator records a result by running the privileged verification action. The Command Center does not offer that action.</p>
      ) : null}
      {data && projectionKey === "recentRuns" ? <p>{data.runs.length} run event(s) returned. Select a row in Recent operations to inspect one.</p> : null}
      {projectionKey === "watchtower" && projection.data ? <WatchtowerDetail data={projection.data} /> : null}
    </>
  );
}

const POSTURE_KEYS = ["healthLive", "healthReady", "healthDegraded", "status", "infrastructure", "observability"];

function PostureDetail({ snapshot }) {
  const posture = derivePosture(snapshot);
  const copy = POSTURE_COPY[posture.posture];
  return (
    <>
      <p><ToneChip tone={copy.tone}>{copy.headline}</ToneChip></p>
      <p className="afcc-quiet">
        Composed in this view: offline when liveness fails; degraded when readiness or the degraded probe reports a
        problem or cannot be read, or when the last recorded verification is not PASS (shown with its age); otherwise
        operational. Operational is not verified and not approved. Missing verification results are listed as not included.
      </p>
      {posture.reasons.length ? <ul className="afcc-plain-list afcc-reasons">{posture.reasons.map((r) => <li key={r}>{r}</li>)}</ul> : null}
      {posture.excluded.length ? <p className="afcc-quiet">Not included: {posture.excluded.join("; ")}.</p> : null}
      <h3 className="afcc-subhead">Contributing sources</h3>
      <ul className="afcc-plain-list">
        {POSTURE_KEYS.map((key) => (
          <li key={key}><StateChip state={snapshot[key].state} /> <code>{snapshot[key].source.endpoint}</code></li>
        ))}
      </ul>
    </>
  );
}

function findRun(snapshot, runKey) {
  const p = snapshot.recentRuns;
  return isDataState(p.state) ? p.data.runs.find((r) => r.rowKey === runKey) || null : null;
}

function RunDetail({ runKey, snapshot }) {
  const projection = snapshot.recentRuns;
  const run = findRun(snapshot, runKey);
  if (!run) {
    return isDataState(projection.state)
      ? <p>This run is no longer in the recent run window read through the SHS bridge.</p>
      : <SourceNotice projection={projection} />;
  }
  return (
    <>
      <dl className="afcc-kvs">
        <Row label="Run id"><GapValue field={run.runId} render={(v) => <code>{v}</code>} /></Row>
        <Row label="Plan id"><GapValue field={run.planId} render={(v) => <code>{v}</code>} /></Row>
        <Row label="Agent"><GapValue field={run.agentName} /></Row>
        <Row label="Agent id"><GapValue field={run.agentId} render={(v) => <code>{v}</code>} /></Row>
        <Row label="Layer"><GapValue field={run.layer} /></Row>
        <Row label="Event kind"><GapValue field={run.kind} /></Row>
        <Row label="Recorded outcome"><GapValue field={run.outcome} /></Row>
        <Row label="Message"><GapValue field={run.message} /></Row>
        <Row label="Recorded"><GapValue field={run.timestamp} render={formatTimestamp} /></Row>
        <Row label="Request id"><GapValue field={run.requestId} render={(v) => <code>{v}</code>} /></Row>
        <Row label="Run state"><GapValue field={run.lifecycleState} /></Row>
      </dl>
      <p className="afcc-quiet">
        Run events record kind and outcome only. There is no canonical run state machine, so no live run state is shown.
      </p>
    </>
  );
}

function findAgent(snapshot, agentId) {
  const health = isDataState(snapshot.agentHealth.state) ? snapshot.agentHealth.data.agents.find((a) => a.agentId === agentId) : null;
  const ready = isDataState(snapshot.agentReadiness.state) ? snapshot.agentReadiness.data.agents.find((a) => a.agentId === agentId) : null;
  return { health, ready };
}

function AgentDetail({ agentId, snapshot }) {
  const { health, ready } = findAgent(snapshot, agentId);
  if (!health && !ready) {
    return (
      <>
        <p>This agent is not in the current registry responses.</p>
        {!isDataState(snapshot.agentHealth.state) ? <SourceNotice projection={snapshot.agentHealth} compact /> : null}
      </>
    );
  }
  const hGap = health ? null : GAP.NOT_AVAILABLE;
  const rGap = ready ? null : GAP.NOT_AVAILABLE;
  return (
    <>
      <dl className="afcc-kvs">
        <Row label="Agent id"><code>{agentId}</code></Row>
        <Row label="Layer">{health?.layer || <GapMarker gap={hGap || GAP.NOT_CAPTURED} />}</Row>
        <Row label="Lifecycle">{health?.lifecycle || <GapMarker gap={hGap || GAP.NOT_CAPTURED} />}</Row>
        <Row label="Enabled">{health && health.enabled !== null ? (health.enabled ? "Yes" : "No") : <GapMarker gap={hGap || GAP.NOT_CAPTURED} />}</Row>
        <Row label="Health status">{health?.status || <GapMarker gap={hGap || GAP.NOT_CAPTURED} />}</Row>
        <Row label="Execution status">{ready?.executionStatus || <GapMarker gap={rGap || GAP.NOT_CAPTURED} />}</Row>
      </dl>
      {ready?.blockers.length ? (<><h3 className="afcc-subhead">Execution blockers</h3><ul className="afcc-plain-list">{ready.blockers.map((m) => <li key={m}><code>{m}</code></li>)}</ul></>) : null}
      {ready?.warnings.length ? (<><h3 className="afcc-subhead">Execution warnings</h3><ul className="afcc-plain-list">{ready.warnings.map((m) => <li key={m}><code>{m}</code></li>)}</ul></>) : null}
      {ready?.recommendedNextStep ? <p className="afcc-quiet">Registry note: {ready.recommendedNextStep}</p> : null}
      <p className="afcc-quiet">Agent changes stay with the Fabric agent registry. This view is read-only.</p>
    </>
  );
}

function AgentsDetail({ snapshot }) {
  const health = snapshot.agentHealth;
  const readiness = snapshot.agentReadiness;
  return (
    <>
      <h3 className="afcc-subhead">Health summary</h3>
      <SourceMeta projectionKey="agentHealth" projection={health} />
      {!isDataState(health.state) ? <SourceNotice projection={health} compact /> : null}
      {isDataState(health.state) && health.data.canonicalSource ? <p className="afcc-quiet">Registry source: <code>{health.data.canonicalSource}</code></p> : null}
      <h3 className="afcc-subhead">Execution readiness</h3>
      <SourceMeta projectionKey="agentReadiness" projection={readiness} />
      {!isDataState(readiness.state) ? <SourceNotice projection={readiness} compact /> : null}
      {isDataState(readiness.state) ? (
        <dl className="afcc-kvs">
          <Row label="Auto-ready">{readiness.data.summary.autoReady ?? <GapMarker gap={GAP.NOT_CAPTURED} />}</Row>
          <Row label="Approval required by policy">{readiness.data.summary.approvalRequired ?? <GapMarker gap={GAP.NOT_CAPTURED} />}</Row>
          <Row label="Blocked">{readiness.data.summary.blocked ?? <GapMarker gap={GAP.NOT_CAPTURED} />}</Row>
        </dl>
      ) : null}
    </>
  );
}

function GateDetail({ snapshot }) {
  const gate = snapshot.layerGate;
  if (!isDataState(gate.state)) return <><SourceMeta projectionKey="layerGate" projection={gate} /><SourceNotice projection={gate} /></>;
  const data = gate.data;
  return (
    <>
      <p><ToneChip tone={data.gatePass ? "ok" : "fail"}>{data.gatePass ? "Gate pass" : "Gate blocked"}</ToneChip></p>
      {data.auditorOneLiner ? <p><code className="afcc-hash">{data.auditorOneLiner}</code></p> : null}
      <h3 className="afcc-subhead">Blockers</h3>
      {data.blockers.length ? (
        <ul className="afcc-plain-list">{data.blockers.map((b, i) => <li key={`${b.layer}-${i}`}><code>{b.layer || "layer not named"}</code> {b.reason || "no reason given"}</li>)}</ul>
      ) : <p>No blockers reported.</p>}
      <h3 className="afcc-subhead">Required layers</h3>
      <ul className="afcc-pill-row">{data.requiredLayers.map((l) => <li key={l}><code>{l}</code></li>)}</ul>
    </>
  );
}

function GapsDetail() {
  return (
    <dl className="afcc-kvs afcc-kvs--stacked">
      {KNOWN_DATA_GAPS.map((gap) => (
        <Row key={gap.id} label={gap.label}><GapMarker gap={gap.gap} /> {gap.detail}</Row>
      ))}
    </dl>
  );
}

// ================================================================ node views

function attentionItems(model, nodeId) {
  return model.items.filter((i) => i.nodeId === nodeId && i.category !== PRIORITY.NORMAL);
}

function AlertList({ items, onSelect }) {
  if (!items.length) return <p className="afcc-quiet">No source reports an item needing attention for this system.</p>;
  return (
    <ul className="afcc-alert-list">
      {items.map((i) => (
        <li key={i.id}>
          <ToneChip tone={PRIORITY_COPY[i.category].tone}>{PRIORITY_COPY[i.category].label}</ToneChip>
          <div>
            {i.selection && i.selection.type !== "node" ? (
              <button type="button" className="afcc-inline-button" onClick={(e) => onSelect(i.selection, e.currentTarget)}>{i.label}</button>
            ) : <strong>{i.label}</strong>}
            <p className="afcc-quiet">{i.reason}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function NodeOverview({ node, info, snapshot, model, onSelect }) {
  const infra = snapshot.infrastructure;
  const wt = snapshot.watchtower;
  const runs = isDataState(snapshot.recentRuns.state) ? snapshot.recentRuns.data.runs : null;
  const lastEvaluated = node.id === "watchtower" && isDataState(wt.state) ? formatTimestamp(wt.data.latestEvaluatedAt) : null;
  const lastVerified = node.hub && isDataState(infra.state) ? formatTimestamp(infra.data.lastVerifiedAt) : null;
  return (
    <>
      <p>{node.summary}</p>
      <dl className="afcc-kvs">
        <Row label="Domain">{node.domain}</Row>
        <Row label="Status"><ToneChip tone={NODE_STATUS_TONE[info.status]}>{info.status}</ToneChip></Row>
        <Row label="Health / risk">{info.metric || <GapMarker gap={info.sourceKey ? GAP.NOT_AVAILABLE : GAP.NOT_PUBLISHED} />}</Row>
        <Row label="Last evaluated">{lastEvaluated || <GapMarker gap={node.id === "watchtower" ? GAP.NOT_AVAILABLE : GAP.NOT_PUBLISHED} />}</Row>
        <Row label="Last verified">{lastVerified ? `${lastVerified}${formatAge(infra.data.ageSeconds) ? ` · ${formatAge(infra.data.ageSeconds)}` : ""} (infrastructure)` : node.hub ? <StateChip state={infra.state} /> : <GapMarker gap={GAP.NOT_PUBLISHED} />}</Row>
        <Row label="Freshness">{info.freshness ? info.freshness.text : <GapMarker gap={GAP.NOT_PUBLISHED} />}</Row>
      </dl>
      {!info.sourceKey ? (
        <p className="afcc-view-gap">
          <GapMarker gap={GAP.NOT_PUBLISHED} /> No admitted Command Center source publishes this system's status. It is not inferred from Agent Fabric health.
        </p>
      ) : null}
      <h3 className="afcc-subhead">Alerts and review items</h3>
      <AlertList items={attentionItems(model, node.id)} onSelect={onSelect} />
      {node.hub ? (
        <>
          <h3 className="afcc-subhead">Posture</h3>
          <PostureDetail snapshot={snapshot} />
          <h3 className="afcc-subhead">Recent operations</h3>
          {runs ? (
            runs.length ? (
              <ul className="afcc-plain-list">
                {runs.slice(0, 5).map((r) => (
                  <li key={r.rowKey}>
                    <button type="button" className="afcc-inline-button" onClick={(e) => onSelect({ type: "run", key: r.rowKey }, e.currentTarget)}>
                      <code>{r.runId.value || r.rowKey}</code>
                    </button>{" "}
                    <span className="afcc-quiet">{[r.agentName.value, r.kind.value, r.outcome.value].filter(Boolean).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="afcc-quiet">No recorded run events.</p>
          ) : <SourceNotice projection={snapshot.recentRuns} compact />}
        </>
      ) : null}
      {node.id === "watchtower" ? (isDataState(wt.state) || wt.data ? <WatchtowerDetail data={wt.data} /> : <SourceNotice projection={wt} compact />) : null}
    </>
  );
}

function NodeAuthority({ node, snapshot }) {
  const dest = node.destination;
  const gate = snapshot.layerGate;
  const readiness = snapshot.agentReadiness;
  const wt = snapshot.watchtower;
  return (
    <>
      <dl className="afcc-kvs">
        <Row label="Authority owner">{node.authority}</Row>
        <Row label="Policy / auth boundary">{node.authBoundary}</Row>
        <Row label="Required permission">
          {dest.kind === "admin" ? (dest.permission ? <><code>{dest.permission}</code> to open <code>{dest.route}</code></> : <>Admin route default for <code>{dest.route}</code></>) : dest.kind === "app" ? `Governed by the ${dest.label}` : <GapMarker gap={GAP.NOT_PUBLISHED} />}
        </Row>
        <Row label="Governance layer">
          {node.hub ? (isDataState(gate.state) ? `${gate.data.requiredLayers.length} required layers · ${gate.data.gatePass ? "gate pass" : "gate blocked"}` : <StateChip state={gate.state} />) : <GapMarker gap={GAP.NOT_PUBLISHED} />}
        </Row>
        <Row label="Approval requirement">
          {node.hub ? (isDataState(readiness.state) ? `${readiness.data.summary.approvalRequired ?? "—"} agent(s) require human approval by policy; no pending queue is published` : <StateChip state={readiness.state} />) : <GapMarker gap={GAP.NOT_PUBLISHED} />}
        </Row>
        <Row label="Containment / gate">
          {node.hub ? (isDataState(gate.state) ? (gate.data.gatePass ? "Gate pass" : `Gate blocked (${gate.data.blockers.length} blocker${gate.data.blockers.length === 1 ? "" : "s"})`) : <StateChip state={gate.state} />)
            : node.id === "watchtower" ? (isDataState(wt.state) ? `${wt.data.quarantinedCount ?? 0} quarantined at last evaluation · ${wt.data.manualQuarantine.activeCount ?? 0} manual` : <StateChip state={wt.state} />)
              : <GapMarker gap={GAP.NOT_PUBLISHED} />}
        </Row>
        <Row label="Read / write">Command Center reads only. Writes stay with {node.name}.</Row>
        <Row label="Source system">
          {node.liveSource === "posture" ? <code>/health/live · /health/ready · /health/degraded</code> : node.liveSource === "watchtower" ? <code>{COMMAND_ENDPOINTS.watchtower.path}</code> : <GapMarker gap={GAP.NOT_PUBLISHED} />}
        </Row>
        <Row label="Documented in">Master plan · Ecosystem Connection Matrix</Row>
      </dl>
      <p className="afcc-quiet">Informational only. No action in this view changes authority, policy, containment or approval.</p>
    </>
  );
}

function Timeline({ events, empty }) {
  const sorted = events.filter((e) => e.ts).sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  if (!sorted.length) return empty;
  return (
    <ol className="afcc-timeline">
      {sorted.map((e, i) => (
        <li key={`${e.ts}-${i}`}>
          <span className="afcc-timeline-time">{formatTimestamp(e.ts) || e.ts}</span>
          <span>{e.label}</span>
          {e.detail ? <span className="afcc-quiet">{e.detail}</span> : null}
        </li>
      ))}
    </ol>
  );
}

function runEvents(snapshot, filter = () => true) {
  const p = snapshot.recentRuns;
  if (!isDataState(p.state)) return [];
  return p.data.runs.filter(filter).map((r) => ({
    ts: r.timestamp.value,
    label: `Run ${r.runId.value || "id not captured"} · ${r.kind.value || "kind not captured"} · ${r.outcome.value || "outcome not captured"}`,
    detail: r.agentName.value,
  }));
}

function verificationEvents(snapshot) {
  const events = [];
  for (const [key, label] of [["infrastructure", "Infrastructure"], ["observability", "Observability"]]) {
    const p = snapshot[key];
    if (isDataState(p.state) && p.data.lastVerifiedAt) events.push({ ts: p.data.lastVerifiedAt, label: `${label} verification recorded ${p.data.verdict}`, detail: p.data.trigger });
  }
  return events;
}

function watchtowerEvents(snapshot) {
  const wt = snapshot.watchtower;
  if (!wt?.data) return [];
  const events = (wt.data.programs || []).filter((p) => p.evaluatedAt).map((p) => ({ ts: p.evaluatedAt, label: `Risk evaluated: ${p.programId} ${p.riskBand || ""} ${p.action || ""}`.trim(), detail: p.reasons.join(", ") }));
  for (const q of wt.data.manualQuarantine?.programs || []) if (q.since) events.push({ ts: q.since, label: `Manual quarantine: ${q.programId}`, detail: q.reason });
  if (wt.data.attestation?.recorded && wt.data.attestation.createdAt) events.push({ ts: wt.data.attestation.createdAt, label: `Attestation recorded (${wt.data.attestation.kind || "kind not captured"})` });
  return events;
}

function NodeTimeline({ node, snapshot }) {
  if (node.hub) {
    return (
      <>
        <Timeline
          events={[...runEvents(snapshot), ...verificationEvents(snapshot)]}
          empty={<Gap gap={GAP.NOT_AVAILABLE}>No run events or recorded verifications are readable from this browser.</Gap>}
        />
        <p className="afcc-quiet">Run events, recorded verifications. Gate changes and alerts are not published as events.</p>
      </>
    );
  }
  if (node.id === "watchtower") {
    return <Timeline events={watchtowerEvents(snapshot)} empty={<Gap gap={isDataState(snapshot.watchtower.state) ? GAP.NOT_CAPTURED : GAP.NOT_AVAILABLE}>No persisted Watchtower evaluations, quarantines or attestations are readable.</Gap>} />;
  }
  return <Gap>{node.name} publishes no event history to the Command Center.</Gap>;
}

function NodeEvidence({ node, snapshot }) {
  const truthEdges = TOPOLOGY_EDGES.filter((e) => (e.from === node.id && e.to === "truth") || (e.to === node.id && e.from === "truth"));
  const runs = isDataState(snapshot.recentRuns.state) ? snapshot.recentRuns.data.runs : null;
  const artifacts = runs ? runs.reduce((n, r) => n + (r.artifacts?.length || 0), 0) : null;
  const wt = snapshot.watchtower;
  return (
    <>
      <dl className="afcc-kvs">
        <Row label="Evidence produced">{node.evidenceProduced} <span className="afcc-quiet">(documented in the master plan; not a live read)</span></Row>
        <Row label="Truth Spine relationship">
          {node.id === "truth" ? "This is the Truth authority." : truthEdges.length ? truthEdges.map((e) => `${NODE_BY_ID[e.from].name} → ${NODE_BY_ID[e.to].name}: ${e.label}`).join("; ") : "No direct Truth relationship in the matrix."}
        </Row>
        <Row label="Verification state">
          {node.hub ? <>{[snapshot.infrastructure, snapshot.observability].map((p, i) => (
            <span key={i} className="afcc-inline-state">{i ? "Observability " : "Infrastructure "}{isDataState(p.state) ? <ToneChip tone={VERDICT_TONE[p.data.verdict]}>{p.data.verdict}</ToneChip> : <StateChip state={p.state} />}</span>
          ))}</> : <GapMarker gap={GAP.NOT_PUBLISHED} />}
        </Row>
        {node.hub ? <Row label="Run artifacts (recent window)">{artifacts === null ? <StateChip state={snapshot.recentRuns.state} /> : `${artifacts} artifact(s) with recorded SHA-256`}</Row> : null}
        {node.id === "watchtower" ? <Row label="Attestation">{isDataState(wt.state) ? (wt.data.attestation.recorded ? `${wt.data.attestation.kind || "attestation"} · ${formatTimestamp(wt.data.attestation.createdAt) || "time not captured"}` : "None recorded") : <StateChip state={wt.state} />}</Row> : null}
        <Row label="Report / proof">{node.id === "reporting" ? "Reports and proof packs are this authority's output; none are read here." : <GapMarker gap={GAP.NOT_PUBLISHED} />}</Row>
        <Row label="Provenance">Topology: master plan Ecosystem Connection Matrix. Status: {node.liveSource ? "admitted Command Center source" : "none"}.</Row>
      </dl>
      <p className="afcc-quiet">Recorded hashes are shown as recorded; they are not a Truth verification. Truth verifies claims; this view does not.</p>
    </>
  );
}

const EDGE_STATE_WORD = {
  [EDGE_STATE.OBSERVED]: ["ok", "Observed"],
  [EDGE_STATE.DEGRADED]: ["warn", "Degraded"],
  [EDGE_STATE.BLOCKED]: ["fail", "Blocked"],
  [EDGE_STATE.UNOBSERVED]: ["neutral", "Not observed"],
};

function NodeDependencies({ nodeId, model, onSelect }) {
  const node = NODE_BY_ID[nodeId];
  if (!node) return <Gap>This selection has no position in the canonical topology.</Gap>;
  const { upstream, downstream } = dependencyPaths(nodeId);
  const stateOf = Object.fromEntries(model.edges.map((e) => [e.id, e.state]));
  const direct = directEdges(nodeId);
  const chains = (walk, reverse) => [...walk.nodes]
    .sort((a, b) => walk.depthOf.get(a) - walk.depthOf.get(b))
    .map((id) => { const c = walk.chainTo(id); return reverse ? c.reverse() : c; })
    .filter((c) => c.length > 2);
  const Chain = ({ chain }) => (
    <li className="afcc-chain">
      {chain.map((id, i) => (
        <React.Fragment key={id}>
          {i ? <span aria-hidden="true" className="afcc-chain-arrow">→</span> : null}
          {id === nodeId ? <strong>{NODE_BY_ID[id].name}</strong> : <NodeLink id={id} onSelect={onSelect} />}
        </React.Fragment>
      ))}
    </li>
  );
  return (
    <>
      <h3 className="afcc-subhead">Direct relationships</h3>
      {direct.length ? (
        <ul className="afcc-edge-list">
          {direct.map((e) => {
            const [tone, word] = EDGE_STATE_WORD[stateOf[e.id]];
            const other = e.from === nodeId ? e.to : e.from;
            return (
              <li key={e.id}>
                <span className="afcc-quiet">{e.from === nodeId ? "Feeds" : "Depends on"}</span>
                <NodeLink id={other} onSelect={onSelect} />
                <span className="afcc-quiet">{e.label}</span>
                <ToneChip tone={tone}>{word}</ToneChip>
              </li>
            );
          })}
        </ul>
      ) : <Gap>No confirmed relationship.</Gap>}
      <h3 className="afcc-subhead">Upstream ({upstream.nodes.size})</h3>
      {upstream.nodes.size ? <ul className="afcc-plain-list">{[...upstream.nodes].filter((id) => upstream.depthOf.get(id) === 1).map((id) => <Chain key={`d-${id}`} chain={[id, nodeId]} />)}{chains(upstream, true).map((c) => <Chain key={c.join(">")} chain={c} />)}</ul> : <p className="afcc-quiet">Nothing upstream in the canonical topology.</p>}
      <h3 className="afcc-subhead">Downstream ({downstream.nodes.size})</h3>
      {downstream.nodes.size ? <ul className="afcc-plain-list">{[...downstream.nodes].filter((id) => downstream.depthOf.get(id) === 1).map((id) => <Chain key={`d-${id}`} chain={[nodeId, id]} />)}{chains(downstream, false).map((c) => <Chain key={c.join(">")} chain={c} />)}</ul> : <p className="afcc-quiet">Nothing downstream in the canonical topology.</p>}
      <p className="afcc-quiet">
        Paths follow typed lineage (events → evidence → risk), so hosted services are not counted as downstream of every producer.
        A relationship is "Observed" only when both ends publish a healthy status to this view.
      </p>
    </>
  );
}

// ======================================================= selection routing

// The topology node a selection belongs to (for Dependencies and map sync).
export function nodeForSelection(selection) {
  if (!selection) return null;
  if (selection.type === "node") return selection.key;
  if (selection.type === "gaps") return null;
  if (selection.type === "source" && selection.key === "watchtower") return "watchtower";
  return HUB_ID;
}

export function drawerTitle(selection) {
  switch (selection?.type) {
    case "node": return NODE_BY_ID[selection.key]?.name || "System";
    case "posture": return "System posture";
    case "run": return "Run event";
    case "agent": return "Agent";
    case "agents": return "Agent fleet";
    case "gate": return "Governance gate";
    case "gaps": return "Known data gaps";
    case "source": {
      const endpoint = COMMAND_ENDPOINTS[selection.key];
      return endpoint ? `Source ${endpoint.path.split("?")[0]}` : "Source";
    }
    default: return "";
  }
}

function sourceKeysFor(selection) {
  switch (selection.type) {
    case "posture": return POSTURE_KEYS;
    case "gate": return ["layerGate"];
    case "agents": case "agent": return ["agentHealth", "agentReadiness"];
    case "run": return ["recentRuns"];
    case "source": return [selection.key];
    default: return [];
  }
}

function OverviewView({ selection, snapshot, model, onSelect }) {
  switch (selection.type) {
    case "node": return <NodeOverview node={NODE_BY_ID[selection.key]} info={model.statusById[selection.key]} snapshot={snapshot} model={model} onSelect={onSelect} />;
    case "posture": return <PostureDetail snapshot={snapshot} />;
    case "run": return <RunDetail runKey={selection.key} snapshot={snapshot} />;
    case "agent": return <AgentDetail agentId={selection.key} snapshot={snapshot} />;
    case "agents": return <AgentsDetail snapshot={snapshot} />;
    case "gate": return <GateDetail snapshot={snapshot} />;
    case "gaps": return <GapsDetail />;
    case "source": return <SourceDetail projectionKey={selection.key} snapshot={snapshot} />;
    default: return null;
  }
}

function AuthorityView({ selection, snapshot }) {
  if (selection.type === "node") return <NodeAuthority node={NODE_BY_ID[selection.key]} snapshot={snapshot} />;
  if (selection.type === "gaps") return <p>These limits are published by the master plan's Data Gap Report. No authority publishes the missing data yet.</p>;
  const keys = sourceKeysFor(selection);
  return (
    <>
      {selection.type === "run" ? (() => {
        const run = findRun(snapshot, selection.key);
        return (
          <dl className="afcc-kvs">
            <Row label="Authority owner">Agent Fabric run ledger</Row>
            <Row label="Initiated by">{run ? <GapValue field={run.actor} /> : <GapMarker gap={GAP.NOT_AVAILABLE} />}</Row>
            <Row label="Organization">{run ? <GapValue field={run.organization} /> : <GapMarker gap={GAP.NOT_AVAILABLE} />}</Row>
            <Row label="Model / provider">{run ? <GapValue field={run.modelProvider} /> : <GapMarker gap={GAP.NOT_AVAILABLE} />}</Row>
            <Row label="Work order">{run ? <GapValue field={run.workOrderId} /> : <GapMarker gap={GAP.NOT_AVAILABLE} />}</Row>
            <Row label="Approval">Plan approval is enforced at execution; the approval flag is <GapMarker gap={GAP.NOT_CAPTURED} /> on run events.</Row>
          </dl>
        );
      })() : null}
      {selection.type === "agent" ? (() => {
        const { health, ready } = findAgent(snapshot, selection.key);
        return (
          <dl className="afcc-kvs">
            <Row label="Authority owner">Agent Fabric agent registry</Row>
            <Row label="Human approval">{ready && ready.humanApproval !== null ? (ready.humanApproval ? "Required by policy" : "Not required by policy") : <GapMarker gap={ready ? GAP.NOT_CAPTURED : GAP.NOT_AVAILABLE} />}</Row>
            <Row label="Auto-execute">{ready && ready.canAutoExecute !== null ? (ready.canAutoExecute ? "Allowed by registry" : "Not allowed by registry") : <GapMarker gap={ready ? GAP.NOT_CAPTURED : GAP.NOT_AVAILABLE} />}</Row>
            <Row label="Enabled">{health && health.enabled !== null ? (health.enabled ? "Yes" : "No") : <GapMarker gap={health ? GAP.NOT_CAPTURED : GAP.NOT_AVAILABLE} />}</Row>
            <Row label="Resource permissions"><GapMarker gap={GAP.NOT_PUBLISHED} /></Row>
          </dl>
        );
      })() : null}
      {keys.map((key) => (
        <React.Fragment key={key}>
          {keys.length > 1 ? <h3 className="afcc-subhead"><code>{COMMAND_ENDPOINTS[key].path.split("?")[0]}</code></h3> : null}
          <SourceMeta projectionKey={key} projection={snapshot[key]} />
        </React.Fragment>
      ))}
      <p className="afcc-quiet">Informational only. The Command Center reads; every change stays with the owning authority.</p>
    </>
  );
}

function TimelineView({ selection, snapshot }) {
  if (selection.type === "node") return <NodeTimeline node={NODE_BY_ID[selection.key]} snapshot={snapshot} />;
  if (selection.type === "run") {
    const run = findRun(snapshot, selection.key);
    if (!run) return <Gap gap={GAP.NOT_AVAILABLE}>This run is not in the readable recent window.</Gap>;
    const same = (r) => (run.runId.value && r.runId.value === run.runId.value) || (run.planId.value && r.planId.value === run.planId.value);
    return (
      <>
        <Timeline events={runEvents(snapshot, same)} empty={<Gap gap={GAP.NOT_CAPTURED}>No timestamped events for this run.</Gap>} />
        <p className="afcc-quiet">Events sharing this run or plan id in the recent window. No lifecycle transitions are persisted.</p>
      </>
    );
  }
  if (selection.type === "agent") {
    const { health } = findAgent(snapshot, selection.key);
    const events = runEvents(snapshot, (r) => r.agentId.value === selection.key || (health?.name && r.agentName.value === health.name));
    return <Timeline events={events} empty={<Gap gap={isDataState(snapshot.recentRuns.state) ? GAP.NOT_CAPTURED : GAP.NOT_AVAILABLE}>No run events for this agent are readable in the recent window.</Gap>} />;
  }
  const keys = sourceKeysFor(selection);
  const events = [];
  for (const key of keys) {
    const p = snapshot[key];
    if (p?.source?.observedAt) events.push({ ts: p.source.observedAt, label: `Read ${COMMAND_ENDPOINTS[key].path.split("?")[0]}: ${p.state.replace(/_/g, " ").toLowerCase()}` });
    if (p?.lastAvailableAt) events.push({ ts: p.lastAvailableAt, label: `Last available ${COMMAND_ENDPOINTS[key].path.split("?")[0]}` });
  }
  if (keys.includes("watchtower")) events.push(...watchtowerEvents(snapshot));
  if (keys.includes("infrastructure") || keys.includes("observability")) events.push(...verificationEvents(snapshot).filter((e) => keys.some((k) => e.label.toLowerCase().startsWith(k))));
  return <Timeline events={events} empty={<Gap gap={GAP.NOT_PUBLISHED}>No timestamped events for this selection.</Gap>} />;
}

function EvidenceView({ selection, snapshot }) {
  if (selection.type === "node") return <NodeEvidence node={NODE_BY_ID[selection.key]} snapshot={snapshot} />;
  if (selection.type === "run") {
    const run = findRun(snapshot, selection.key);
    if (!run) return <Gap gap={GAP.NOT_AVAILABLE}>This run is not in the readable recent window.</Gap>;
    return (
      <>
        <dl className="afcc-kvs">
          <Row label="Plan snapshot SHA-256"><GapValue field={run.snapshotSha256} render={(v) => <code className="afcc-hash">{v}</code>} /></Row>
          <Row label="Artifacts"><GapValue field={run.artifactCount} /></Row>
          <Row label="Evidence lineage"><GapMarker gap={GAP.NOT_PUBLISHED} /> Plan execution is not linked to evidence or Truth by default.</Row>
        </dl>
        {run.artifacts.length ? (
          <ul className="afcc-plain-list">
            {run.artifacts.map((a, i) => (
              <li key={a.artifactId || i}><code>{a.artifactId || "artifact id not recorded"}</code>{a.sha256 ? <span className="afcc-quiet afcc-hash"> sha256 {a.sha256}</span> : null}</li>
            ))}
          </ul>
        ) : null}
        <p className="afcc-quiet">The recorded hash is shown as recorded; it is not a Truth verification. Server file paths are never shown.</p>
      </>
    );
  }
  if (selection.type === "agent") {
    const health = snapshot.agentHealth;
    const { health: row } = findAgent(snapshot, selection.key);
    return (
      <dl className="afcc-kvs">
        <Row label="Registry source">{isDataState(health.state) && health.data.canonicalSource ? <code>{health.data.canonicalSource}</code> : <StateChip state={health.state} />}</Row>
        <Row label="Missing registry fields">{row ? (row.missing.length ? row.missing.map((m) => <code key={m}>{m} </code>) : "None reported") : <GapMarker gap={GAP.NOT_AVAILABLE} />}</Row>
        <Row label="Attestation"><GapMarker gap={GAP.NOT_PUBLISHED} /></Row>
      </dl>
    );
  }
  if (selection.type === "source" && (selection.key === "infrastructure" || selection.key === "observability" || selection.key === "healthReady" || selection.key === "healthDegraded")) {
    const p = snapshot[selection.key];
    if (!isDataState(p.state)) return <SourceNotice projection={p} compact />;
    const checks = p.data.checks.map((c) => ({ name: c.name, ok: c.ok, error: c.ok === true ? null : c.reasonCode || c.error }));
    return <><h3 className="afcc-subhead">Recorded checks</h3><ChecksList checks={checks} /></>;
  }
  if (selection.type === "source" && selection.key === "watchtower") {
    const wt = snapshot.watchtower;
    if (!wt.data) return <SourceNotice projection={wt} compact />;
    return (
      <dl className="afcc-kvs">
        <Row label="Attestation">{wt.data.attestation.recorded ? `${wt.data.attestation.kind || "attestation"} · ${formatTimestamp(wt.data.attestation.createdAt) || "time not captured"}` : "None recorded"}</Row>
        <Row label="Integrity"><GapMarker gap={GAP.NOT_PUBLISHED} /></Row>
      </dl>
    );
  }
  return <Gap>No evidence artifact is published for this selection.</Gap>;
}

function ViewContent({ view, selection, snapshot, model, onSelect }) {
  switch (view) {
    case "overview": return <OverviewView selection={selection} snapshot={snapshot} model={model} onSelect={onSelect} />;
    case "authority": return <AuthorityView selection={selection} snapshot={snapshot} />;
    case "timeline": return <TimelineView selection={selection} snapshot={snapshot} />;
    case "evidence": return <EvidenceView selection={selection} snapshot={snapshot} />;
    case "dependencies": {
      const nodeId = nodeForSelection(selection);
      if (!nodeId) return <Gap>Known data gaps have no position in the topology.</Gap>;
      return (
        <>
          {selection.type !== "node" ? <p className="afcc-quiet">This selection belongs to <NodeLink id={nodeId} onSelect={onSelect} />.</p> : null}
          {selection.type === "run" ? <p className="afcc-quiet">Runs feed LOO payloads and run reports through the Fabric run ledger.</p> : null}
          <NodeDependencies nodeId={nodeId} model={model} onSelect={onSelect} />
        </>
      );
    }
    default: return null;
  }
}

// mode: "docked" (non-modal side panel), "overlay" (modal side panel), "sheet" (modal full screen).
export default function CommandDrawer({ selection, snapshot, model, mode, onClose, onSelect }) {
  const panelRef = React.useRef(null);
  const headingRef = React.useRef(null);
  const [view, setView] = React.useState("overview");
  const modal = mode !== "docked";
  const titleId = "afcc-drawer-title";
  const selectionKey = `${selection.type}:${selection.key || ""}`;

  React.useEffect(() => {
    setView(selection.view || "overview");
    headingRef.current?.focus();
  }, [selectionKey, selection.view]);

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (!modal || event.key !== "Tab") return;
    const focusable = [...(panelRef.current?.querySelectorAll(FOCUSABLE) || [])];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === headingRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  // Arrow keys move between views (WAI-ARIA tabs pattern, automatic activation).
  const onViewKey = (event) => {
    const index = DRAWER_VIEWS.findIndex((v) => v.id === view);
    let next = null;
    if (event.key === "ArrowRight") next = (index + 1) % DRAWER_VIEWS.length;
    if (event.key === "ArrowLeft") next = (index - 1 + DRAWER_VIEWS.length) % DRAWER_VIEWS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = DRAWER_VIEWS.length - 1;
    if (next === null) return;
    event.preventDefault();
    setView(DRAWER_VIEWS[next].id);
    panelRef.current?.querySelector(`#afcc-view-${DRAWER_VIEWS[next].id}`)?.focus();
  };

  const node = selection.type === "node" ? NODE_BY_ID[selection.key] : null;
  const info = node ? model.statusById[node.id] : null;

  const panel = (
    <aside
      ref={panelRef}
      className={`afcc-drawer afcc-drawer--${mode}`}
      role={modal ? "dialog" : "complementary"}
      aria-modal={modal ? "true" : undefined}
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      data-drawer-mode={mode}
      data-selection={selectionKey}
    >
      <div className="afcc-drawer-head">
        <div>
          <p className="afcc-eyebrow">{node ? `System context · ${node.domain}` : "Context · read-only"}</p>
          <h2 id={titleId} ref={headingRef} tabIndex={-1}>{drawerTitle(selection)}</h2>
          {info ? <p className="afcc-drawer-state"><ToneChip tone={NODE_STATUS_TONE[info.status]}>{info.status}</ToneChip>{info.freshness ? <span className="afcc-quiet">{info.freshness.text}</span> : null}</p> : null}
        </div>
        <button type="button" className="afcc-close" onClick={onClose} aria-label="Close context drawer">Close</button>
      </div>
      <div className="afcc-drawer-views" role="tablist" aria-label="Context views" onKeyDown={onViewKey}>
        {DRAWER_VIEWS.map((v) => (
          <button
            key={v.id}
            id={`afcc-view-${v.id}`}
            type="button"
            role="tab"
            className="afcc-view-button"
            aria-selected={view === v.id}
            aria-controls="afcc-view-body"
            tabIndex={view === v.id ? 0 : -1}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="afcc-drawer-body" id="afcc-view-body" role="tabpanel" aria-labelledby={`afcc-view-${view}`} tabIndex={0} data-view={view}>
        <ViewContent view={view} selection={selection} snapshot={snapshot} model={model} onSelect={onSelect} />
      </div>
    </aside>
  );

  if (!modal) return panel;
  return (
    <div className="afcc-drawer-host">
      <div className="afcc-scrim" onClick={onClose} aria-hidden="true" />
      {panel}
    </div>
  );
}
