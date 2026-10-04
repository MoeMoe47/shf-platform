// src/pages/admin/agent-fabric-command/components/LiveOperations.jsx
// AFCC-3 Phase 7 — read-only Live Operations. Progressive disclosure:
//   overview (counts + attention-ordered list) -> run focus -> views
//   (overview / timeline / evidence / dependencies) -> artifact viewer.
// Every value is a backend fact read through the SHS bridge; nothing here
// changes state, and there are no action controls.
import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../agent-fabric-command.css";
import "../live-operations.css";
import { SOURCE_STATE } from "../commandContracts.js";
import { formatTimestamp, stateCopy } from "../commandPresentation.js";
import {
  applyFilters,
  approvalCopy,
  attentionReason,
  display,
  filterOptions,
  runStateCopy,
  sortByAttention,
  summarize,
} from "../liveOperationsModel.js";
import { useLiveRuns } from "../useLiveOperations.js";
import CommandSidebar from "./CommandSidebar.jsx";
import RunFocus from "./RunFocus.jsx";
import { EvidenceState, RunState, Val } from "./LiveOperationsParts.jsx";
import { SourceNotice } from "./SourceState.jsx";

// Layout follows the width available to the page (not the raw viewport).
export function liveLayoutForWidth(width) {
  if (width >= 1180) return "wide"; // list + docked context
  if (width >= 780) return "medium"; // list + overlay detail
  return "narrow"; // stacked items + full-screen sheet
}

function useLayout(ref) {
  const [layout, setLayout] = React.useState("wide");
  React.useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const update = () => setLayout(liveLayoutForWidth(node.getBoundingClientRect().width));
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return layout;
}

function ApprovalState({ approval }) {
  const copy = approvalCopy(approval.state);
  return (
    <span className={`afcc-lo-approval afcc-tone-${copy.tone}`} data-approval-state={approval.state || "NOT_AVAILABLE"}>
      <span className="afcc-sr-only">Approval: </span>
      {copy.label}
    </span>
  );
}

const runLabel = (run) => (run.kind === "run" ? run.runId : `Plan ${run.planId || "not captured"}`);

function Totals({ summary, active, onPick }) {
  const items = [...summary.primary, ...summary.secondary];
  if (!items.length) return null;
  return (
    <section className="afcc-lo-totals-wrap" aria-labelledby="afcc-lo-totals-title">
      <h2 id="afcc-lo-totals-title" className="afcc-sr-only">Run counts by state</h2>
      <ul className="afcc-lo-totals">
        {items.map((item) => (
          <li key={item.state}>
            <button
              type="button"
              className={`afcc-lo-count afcc-tone-${item.tone}${active === item.state ? " is-active" : ""}`}
              aria-pressed={active === item.state}
              onClick={() => onPick(active === item.state ? "" : item.state)}
              data-count-state={item.state}
            >
              <span className="afcc-lo-count-value">{item.count}</span>
              <span className="afcc-lo-count-label"><span aria-hidden="true">{item.glyph} </span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="afcc-quiet afcc-fine">Counts cover the {summary.total} most recent records the run authority returned. Selecting a count filters the list.</p>
    </section>
  );
}

const FILTER_LABELS = { state: "State", agent: "Agent", organization: "Organization", approval: "Approval", evidence: "Evidence" };
const optionLabel = (field, value) => (field === "state" ? runStateCopy(value).label : value);

function Filters({ options, filters, onChange, collapsed = false }) {
  const activeCount = Object.values(filters).filter(Boolean).length;
  const active = activeCount > 0;
  const form = (
    <form className="afcc-lo-filters" aria-label="Filter runs" onSubmit={(e) => e.preventDefault()}>
      {Object.keys(FILTER_LABELS).map((field) => (
        <label key={field} className="afcc-lo-filter">
          <span>{FILTER_LABELS[field]}</span>
          <select value={filters[field] || ""} onChange={(e) => onChange({ ...filters, [field]: e.target.value })}>
            <option value="">All</option>
            {(options[field] || []).map((value) => (
              <option key={value} value={value}>{optionLabel(field, value)}</option>
            ))}
          </select>
        </label>
      ))}
      <button type="button" className="afcc-link-button" onClick={() => onChange({})} disabled={!active}>Clear filters</button>
    </form>
  );
  if (!collapsed) return form;
  // Phones: filters stay one tap away instead of pushing the runs below the fold.
  return (
    <details className="afcc-lo-filters-toggle">
      <summary>Filters{active ? ` (${activeCount} active)` : ""}</summary>
      {form}
    </details>
  );
}

function AttentionTag({ run }) {
  const reason = attentionReason(run);
  if (!reason) return null;
  return <span className="afcc-lo-attn" data-attention={reason}>Needs attention</span>;
}

function RunTable({ runs, selectedKey, onSelect }) {
  return (
    <div className="afcc-lo-scroll" role="region" aria-label="Run list" tabIndex={0}>
    <table className="afcc-lo-grid">
      <caption className="afcc-sr-only">Runs and plans, ordered by attention then most recent change. Select a run to open its focus view.</caption>
      <thead>
        <tr>
          <th scope="col">Run</th>
          <th scope="col">State · approval</th>
          <th scope="col">Agent · operation</th>
          <th scope="col" className="afcc-lo-col-who">Initiator · organization</th>
          <th scope="col">Evidence</th>
          <th scope="col" className="afcc-lo-col-when">Last updated</th>
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => {
          const selected = run.key === selectedKey;
          return (
            <tr key={run.key} className={selected ? "is-selected" : undefined} data-run-key={run.key} onClick={(e) => onSelect(run, e.currentTarget.querySelector("button"))}>
              <th scope="row">
                <button type="button" className="afcc-lo-row-open" aria-current={selected ? "true" : undefined} onClick={(e) => { e.stopPropagation(); onSelect(run, e.currentTarget); }}>
                  <span className="afcc-lo-mono">{runLabel(run)}</span>
                  <span className="afcc-sr-only">, {runStateCopy(run.state).label}</span>
                </button>
                <span className="afcc-lo-sub afcc-lo-clip" title={display(run.correlation.id).text}>Correlation <Val quiet value={run.correlation.id} /></span>
              </th>
              <td>
                <RunState state={run.state} reason={run.stateReason} />
                <span className="afcc-lo-sub">Approval <ApprovalState approval={run.approval} /></span>
                <AttentionTag run={run} />
              </td>
              <td>
                <Val quiet value={run.agent.name} />
                <span className="afcc-lo-sub"><Val quiet value={run.operation} /></span>
                <span className="afcc-lo-sub afcc-lo-who-inline">By <Val quiet value={run.initiator.id} /> · <Val quiet value={run.organization.id} /></span>
              </td>
              <td className="afcc-lo-col-who">
                <Val quiet value={run.initiator.id} />
                <span className="afcc-lo-sub"><Val quiet value={run.organization.id} /></span>
              </td>
              <td>
                <EvidenceState evidence={run.evidence} />
                <span className="afcc-lo-sub afcc-lo-when-inline">Updated <Val quiet value={formatTimestamp(run.times.lastChanged)} /></span>
              </td>
              <td className="afcc-lo-when afcc-lo-col-when"><Val quiet value={formatTimestamp(run.times.lastChanged)} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
}

function RunItems({ runs, selectedKey, onSelect }) {
  return (
    <ul className="afcc-lo-items" aria-label="Runs and plans, ordered by attention">
      {runs.map((run) => (
        <li key={run.key} data-run-key={run.key}>
          <button type="button" className={`afcc-lo-item${run.key === selectedKey ? " is-selected" : ""}`} aria-current={run.key === selectedKey ? "true" : undefined} onClick={(e) => onSelect(run, e.currentTarget)}>
            <span className="afcc-lo-item-top">
              <span className="afcc-lo-mono">{runLabel(run)}</span>
              <RunState state={run.state} />
            </span>
            <span className="afcc-lo-item-line"><Val quiet value={run.agent.name} /> · <Val quiet value={run.operation} /></span>
            <span className="afcc-lo-item-line afcc-quiet">By <Val quiet value={run.initiator.id} /> · <Val quiet value={run.organization.id} /></span>
            <span className="afcc-lo-item-line">
              <ApprovalState approval={run.approval} /> · <EvidenceState evidence={run.evidence} />
            </span>
            <span className="afcc-lo-item-line afcc-quiet">Updated <Val quiet value={formatTimestamp(run.times.lastChanged)} /> · Correlation <Val quiet value={run.correlation.id} /></span>
            <AttentionTag run={run} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function SourceLine({ live }) {
  const safety = live.executionSafety;
  const observed = formatTimestamp(live.source.observedAt);
  return (
    <details className="afcc-lo-source">
      <summary>Source &amp; freshness</summary>
      <dl>
        <div><dt>Authority</dt><dd><Val value={live.projectionSource?.authority} /></dd></div>
        <div><dt>Run authority</dt><dd><Val value={live.projectionSource?.run_authority} /></dd></div>
        <div><dt>Read through</dt><dd>SHS bridge <code>{live.source.endpoint}</code></dd></div>
        <div><dt>Last record change</dt><dd><Val value={formatTimestamp(live.freshness?.last_updated)} /></dd></div>
        <div><dt>Observed</dt><dd><Val value={observed} /></dd></div>
        <div><dt>Execution safety</dt><dd><Val value={safety?.summary} /></dd></div>
      </dl>
    </details>
  );
}

export default function LiveOperations() {
  const rootRef = React.useRef(null);
  const layout = useLayout(rootRef);
  const live = useLiveRuns();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = React.useState({});
  const [navOpen, setNavOpen] = React.useState(false);
  const returnFocusRef = React.useRef(null);

  const ordered = React.useMemo(() => sortByAttention(live.runs), [live.runs]);
  const visible = React.useMemo(() => applyFilters(ordered, filters), [ordered, filters]);
  const options = React.useMemo(() => filterOptions(live.runs), [live.runs]);
  const summary = React.useMemo(() => summarize(live.runs, live.supportedStates), [live.runs, live.supportedStates]);
  const selectedKey = params.get("run");
  const selected = live.runs.find((r) => r.key === selectedKey) || null;
  const view = params.get("view") || "overview";

  const select = (run, trigger) => {
    returnFocusRef.current = trigger || document.activeElement;
    setParams({ run: run.key, view: "overview" });
  };
  const setView = (next) => selected && setParams({ run: selected.key, view: next });
  const restorePending = React.useRef(false);
  const close = () => {
    restorePending.current = true;
    setParams({});
  };
  // Return focus after the close has rendered (and the list is no longer inert).
  React.useEffect(() => {
    if (selected || !restorePending.current) return;
    restorePending.current = false;
    const target = returnFocusRef.current;
    if (target && target.isConnected) target.focus();
  }, [selected]);

  const modal = Boolean(selected) && layout !== "wide";
  const loading = live.state === SOURCE_STATE.LOADING;
  const failed = !loading && live.state !== SOURCE_STATE.AVAILABLE;
  const needAttention = ordered.filter((r) => attentionReason(r)).length;

  return (
    <div ref={rootRef} className={`afcc-root afcc-lo afcc-mode-${layout}${layout === "wide" ? " has-lo-dock" : ""}`} data-layout={layout}>
      <div className="afcc-frame" inert={modal || undefined}>
        <CommandSidebar current="live" collapsible={layout !== "wide"} open={navOpen} onToggle={() => setNavOpen((v) => !v)} />
        <section className="afcc-canvas afcc-lo-canvas" aria-labelledby="afcc-lo-title">
          <div className="afcc-top">
            <div className="afcc-top-title">
              <p className="afcc-eyebrow">Agent Fabric Command Center</p>
              <h1 id="afcc-lo-title">Live Operations</h1>
              <p className="afcc-quiet">What is running, what needs attention, and what evidence exists. Read-only: this page changes nothing.</p>
            </div>
            <div className="afcc-top-actions">
              <div className="afcc-top-buttons">
                <button type="button" className="afcc-button" onClick={live.refresh}>Refresh</button>
              </div>
              <p className="afcc-quiet afcc-fine">
                <Link className="afcc-text-link" to="/agent-fabric/command">Topology view</Link>
              </p>
            </div>
          </div>

          {loading ? <p className="afcc-quiet" role="status">Loading runs…</p> : null}
          {failed ? (
            <SourceNotice projection={{ state: live.state, source: live.source }} />
          ) : null}

          {!loading && !failed ? (
            <>
              <Totals summary={summary} active={filters.state || ""} onPick={(state) => setFilters({ ...filters, state })} />
              {live.runs.length ? (
                <>
                  <Filters options={options} filters={filters} onChange={setFilters} collapsed={layout === "narrow"} />
                  <p className="afcc-lo-attn-line" role="status">
                    {needAttention ? `${needAttention} need${needAttention === 1 ? "s" : ""} attention` : "Nothing needs attention"}
                    {" · "}
                    Showing {visible.length} of {live.runs.length}
                  </p>
                  {visible.length === 0 ? (
                    <p className="afcc-quiet afcc-lo-empty">No runs match these filters.</p>
                  ) : layout === "narrow" ? (
                    <RunItems runs={visible} selectedKey={selectedKey} onSelect={select} />
                  ) : (
                    <RunTable runs={visible} selectedKey={selectedKey} onSelect={select} />
                  )}
                </>
              ) : (
                <p className="afcc-quiet afcc-lo-empty">The run authority has no runs or plans recorded yet.</p>
              )}
              <SourceLine live={live} />
            </>
          ) : null}
        </section>
      </div>

      {layout === "wide" ? (
        <aside className="afcc-lo-dock" aria-label="Run focus">
          {selected ? (
            <RunFocus run={selected} runs={live.runs} view={view} onView={setView} onClose={close} onSelect={select} mode="docked" />
          ) : (
            <div className="afcc-lo-dock-empty">
              <p className="afcc-quiet">Select a run to see its overview, timeline, evidence and dependencies.</p>
              {live.state !== SOURCE_STATE.AVAILABLE ? <p className="afcc-quiet afcc-fine">{stateCopy(live.state).label}</p> : null}
            </div>
          )}
        </aside>
      ) : selected ? (
        <RunFocus run={selected} runs={live.runs} view={view} onView={setView} onClose={close} onSelect={select} mode={layout === "narrow" ? "sheet" : "overlay"} />
      ) : null}
    </div>
  );
}
