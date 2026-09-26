import React from "react";
import { dependencyPaths, directEdges, HUB_ID, TOPOLOGY_NODES, UNCONNECTED_AUTHORITIES } from "../ecosystemTopology.js";
import { EDGE_STATE, NODE_STATUS_TONE, nodesForCategory, PRIORITY_COPY } from "../operationalModel.js";
import { computeLayout, edgePath } from "../topologyLayout.js";

// Ecosystem Operations Map. Structure is the canonical topology; status is the
// operational model's. Nodes are buttons (keyboard + screen reader native);
// edges are an SVG layer underneath that never takes focus.

const MODES = [
  { id: "operations", label: "Operations View" },
  { id: "dependency", label: "Dependency View" },
];

const EDGE_STATE_COPY = {
  [EDGE_STATE.OBSERVED]: "upstream observed healthy",
  [EDGE_STATE.DEGRADED]: "upstream degraded",
  [EDGE_STATE.BLOCKED]: "upstream unavailable or blocked",
  [EDGE_STATE.UNOBSERVED]: "not observed (no admitted status at one end)",
};

function useWidth(ref) {
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.floor(el.getBoundingClientRect().width));
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

// Which nodes/edges are emphasised, and why. Selection wins over hover, hover
// over the priority filter. Returns null when nothing is emphasised.
function emphasis({ selectedId, hoverId, filterNodes, edges }) {
  if (selectedId) {
    const { upstream, downstream } = dependencyPaths(selectedId);
    const nodes = new Set([selectedId, ...upstream.nodes, ...downstream.nodes]);
    const edgeIds = new Set([...upstream.edgeIds, ...downstream.edgeIds]);
    const role = {};
    for (const id of upstream.nodes) role[id] = "upstream";
    for (const id of downstream.nodes) role[id] = role[id] ? "both" : "downstream";
    return { nodes, edgeIds, role, kind: "path" };
  }
  if (hoverId) {
    const direct = directEdges(hoverId);
    const nodes = new Set([hoverId, ...direct.map((e) => e.from), ...direct.map((e) => e.to)]);
    return { nodes, edgeIds: new Set(direct.map((e) => e.id)), role: {}, kind: "hover" };
  }
  if (filterNodes) {
    const edgeIds = new Set(edges.filter((e) => filterNodes.has(e.from) && filterNodes.has(e.to)).map((e) => e.id));
    return { nodes: filterNodes, edgeIds, role: {}, kind: "filter" };
  }
  return null;
}

const ROLE_COPY = { upstream: "Upstream", downstream: "Downstream", both: "Up + downstream" };

function NodeButton({ node, box, info, mode, selected, dimmed, matched, role, onSelect, onHover, tooltipId, compact }) {
  const tone = NODE_STATUS_TONE[info.status] || "neutral";
  const attention = info.attention.length;
  const second = info.short;
  const label = [
    node.name,
    node.domain,
    `Status ${info.status}`,
    info.freshness?.text,
    info.metric,
    attention ? `${attention} item${attention === 1 ? "" : "s"} need attention` : null,
    role ? `${ROLE_COPY[role]} of the selected system` : null,
    matched ? "Matches the priority filter" : null,
  ].filter(Boolean).join(". ");
  return (
    <button
      type="button"
      className={`afcc-node afcc-tone-${tone}${node.hub ? " is-hub" : ""}${selected ? " is-selected" : ""}${dimmed ? " is-dimmed" : ""}${matched ? " is-matched" : ""}`}
      style={{ left: box.x - box.w / 2, top: box.y - box.h / 2, width: box.w, height: box.h }}
      data-node={node.id}
      data-node-status={info.status}
      aria-pressed={selected}
      aria-label={label}
      aria-describedby={tooltipId || undefined}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id, e.currentTarget); }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
    >
      <span className="afcc-node-name" title={node.name}>{node.name}</span>
      <span className="afcc-node-line">
        <span className="afcc-dot" aria-hidden="true" />
        <span className="afcc-node-state">{info.status}</span>
        {second ? <span className="afcc-node-sub">· {second}</span> : null}
      </span>
      {attention ? <span className="afcc-node-flag" aria-hidden="true">{attention}</span> : null}
      {role && compact ? <span className="afcc-node-role" aria-hidden="true">{ROLE_COPY[role]}</span> : null}
    </button>
  );
}

function Tooltip({ id, node, box, info, layout, links }) {
  const above = box.y > layout.height / 2;
  const style = {
    left: Math.min(Math.max(box.x - 130, 4), layout.width - 264),
    top: above ? box.y - box.h / 2 - 8 : box.y + box.h / 2 + 8,
    transform: above ? "translateY(-100%)" : undefined,
  };
  return (
    <div id={id} role="tooltip" className="afcc-tip" style={style}>
      <strong>{node.name}</strong>
      <span className="afcc-quiet">{node.domain}</span>
      <span>{info.status}{info.freshness ? ` · ${info.freshness.text}` : ""}</span>
      {info.metric ? <span>{info.metric}</span> : null}
      <span className="afcc-quiet">{links} canonical relationship{links === 1 ? "" : "s"}</span>
    </div>
  );
}

const STATE_WORD = {
  [EDGE_STATE.OBSERVED]: "observed",
  [EDGE_STATE.DEGRADED]: "degraded",
  [EDGE_STATE.BLOCKED]: "blocked",
  [EDGE_STATE.UNOBSERVED]: "not observed",
};

// Dependency View: the focused system's relationships as readable text, instead
// of labels drawn on converging edges where they would collide.
function RelationshipList({ focusId, edges }) {
  const node = TOPOLOGY_NODES.find((n) => n.id === focusId);
  if (!node) return <p className="afcc-rel-line afcc-quiet">Select or hover a system to list its canonical relationships. Arrows point from upstream to dependent.</p>;
  const name = (id) => TOPOLOGY_NODES.find((n) => n.id === id)?.name || id;
  const own = edges.filter((e) => e.from === focusId || e.to === focusId);
  return (
    <div className="afcc-rel-line">
      <strong>{node.name}</strong>
      <ul className="afcc-rel-list" aria-label={`${node.name} relationships`}>
        {own.map((e) => (
          <li key={e.id} data-rel={e.id}>
            {e.to === focusId ? `← ${name(e.from)}` : `→ ${name(e.to)}`}
            <span className="afcc-quiet"> {e.label} · {STATE_WORD[e.state]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function EcosystemMap({ model, selectedId, onSelect, onClear, priorityFilter, mode, onModeChange }) {
  const hostRef = React.useRef(null);
  const width = useWidth(hostRef);
  const [hoverId, setHoverId] = React.useState(null);
  const [geoNote, setGeoNote] = React.useState(false);
  const layout = React.useMemo(() => (width ? computeLayout(width) : null), [width]);
  const filterNodes = React.useMemo(() => nodesForCategory(model, priorityFilter), [model, priorityFilter]);
  const emph = emphasis({ selectedId, hoverId, filterNodes, edges: model.edges });
  const pairs = React.useMemo(() => {
    const set = new Set(model.edges.map((e) => `${e.from}>${e.to}`));
    return (e) => (set.has(`${e.to}>${e.from}`) ? (e.from < e.to ? 1 : -1) : 0);
  }, [model.edges]);
  const tooltipNode = hoverId && hoverId !== selectedId ? TOPOLOGY_NODES.find((n) => n.id === hoverId) : null;
  const compact = layout?.kind === "grid";

  const onKeyDown = (event) => {
    if (event.key === "Escape" && (selectedId || priorityFilter)) {
      event.stopPropagation();
      onClear();
    }
  };

  return (
    <section id="afcc-map" className="afcc-map" aria-labelledby="afcc-map-title" data-map-mode={mode} onKeyDown={onKeyDown}>
      <div className="afcc-map-head">
        <div>
          <h2 id="afcc-map-title">Ecosystem Operations Map</h2>
          <p className="afcc-quiet">
            Canonical relationships from the master plan. Live status only where an admitted source exists.
          </p>
        </div>
        <div className="afcc-modes" role="group" aria-label="Map view">
          {MODES.map((m) => (
            <button key={m.id} type="button" className="afcc-mode" aria-pressed={mode === m.id} onClick={() => onModeChange(m.id)}>
              {m.label}
            </button>
          ))}
          <button
            type="button"
            className="afcc-mode is-unavailable"
            aria-disabled="true"
            aria-expanded={geoNote}
            aria-controls="afcc-geo-note"
            onClick={() => setGeoNote((v) => !v)}
          >
            Geography<span className="afcc-sr-only"> (not available)</span>
          </button>
        </div>
      </div>
      {geoNote ? (
        <p id="afcc-geo-note" className="afcc-inline-note" role="note">
          Geography is not available: no canonical geographic data is published for these systems, so none is drawn.
        </p>
      ) : null}

      <div
        ref={hostRef}
        className={`afcc-map-canvas${compact ? " is-compact" : ""}`}
        style={layout ? { height: layout.height } : undefined}
        onClick={() => (selectedId ? onClear() : null)}
        data-emphasis={emph?.kind || "none"}
      >
        {layout ? (
          <>
            {layout.drawsEdges ? (
              <svg className="afcc-edges" width={layout.width} height={layout.height} aria-hidden="true" focusable="false">
                <defs>
                  {["observed", "degraded", "blocked", "unobserved", "path"].map((k) => (
                    <marker key={k} id={`afcc-arrow-${k}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M0,0 L8,4 L0,8 z" className={`afcc-arrow afcc-arrow--${k}`} />
                    </marker>
                  ))}
                </defs>
                {model.edges.map((edge) => {
                  const geo = edgePath(edge, layout, { pair: pairs(edge) });
                  if (!geo) return null;
                  const on = emph?.edgeIds.has(edge.id);
                  const dim = emph && !on;
                  const showArrow = mode === "dependency" || (on && emph.kind === "path");
                  return (
                    <g key={edge.id} className={`afcc-edge afcc-edge--${edge.state}${on ? " is-on" : ""}${dim ? " is-dim" : ""}${edge.flow === "OBSERVES" ? " is-weak" : ""}`} data-edge={edge.id} data-edge-state={edge.state}>
                      <path d={geo.d} markerEnd={showArrow ? `url(#afcc-arrow-${on && emph.kind === "path" ? "path" : edge.state})` : undefined} />
                    </g>
                  );
                })}
              </svg>
            ) : null}
            {TOPOLOGY_NODES.map((node) => {
              const box = layout.nodes[node.id];
              if (!box) return null;
              const on = !emph || emph.nodes.has(node.id);
              return (
                <NodeButton
                  key={node.id}
                  node={node}
                  box={box}
                  info={model.statusById[node.id]}
                  mode={mode}
                  compact={compact}
                  selected={selectedId === node.id}
                  dimmed={!on}
                  matched={Boolean(filterNodes?.has(node.id))}
                  role={emph?.kind === "path" ? emph.role[node.id] : null}
                  onSelect={onSelect}
                  onHover={setHoverId}
                  tooltipId={tooltipNode?.id === node.id ? "afcc-map-tip" : null}
                />
              );
            })}
            {tooltipNode && layout.nodes[tooltipNode.id] ? (
              <Tooltip id="afcc-map-tip" node={tooltipNode} box={layout.nodes[tooltipNode.id]} info={model.statusById[tooltipNode.id]} layout={layout} links={directEdges(tooltipNode.id).length} />
            ) : null}
          </>
        ) : null}
      </div>

      {mode === "dependency" ? <RelationshipList focusId={selectedId || hoverId} edges={model.edges} /> : null}

      <div className="afcc-legend">
        <ul className="afcc-legend-list" aria-label="Node status legend">
          {[["ok", "Operational / Healthy"], ["warn", "Degraded / Needs Review"], ["fail", "Blocked / Unavailable"], ["gap", "Restricted / Not published"]].map(([tone, text]) => (
            <li key={tone}><span className={`afcc-dot afcc-tone-${tone}`} aria-hidden="true" />{text}</li>
          ))}
        </ul>
        {!compact ? (
          <ul className="afcc-legend-list" aria-label="Relationship legend">
            {Object.entries(EDGE_STATE_COPY).map(([state, text]) => (
              <li key={state}><span className={`afcc-swatch afcc-edge--${state}`} aria-hidden="true" />{text[0].toUpperCase() + text.slice(1)}</li>
            ))}
            <li><span className="afcc-swatch is-path" aria-hidden="true" />Selected path</li>
          </ul>
        ) : (
          <p className="afcc-quiet">Select a system to label its upstream and downstream systems.</p>
        )}
        <p className="afcc-quiet afcc-legend-note">
          Data-flow telemetry is not published, so no edge is shown as actively flowing.
          {UNCONNECTED_AUTHORITIES.length ? ` Not drawn: ${UNCONNECTED_AUTHORITIES.map((a) => a.name).join(", ")} (no confirmed Fabric connection).` : ""}
          {priorityFilter ? ` Filter: ${PRIORITY_COPY[priorityFilter].label}.` : ""}
        </p>
      </div>
      <p className="afcc-sr-only" aria-live="polite">
        {selectedId ? `${TOPOLOGY_NODES.find((n) => n.id === selectedId)?.name} selected; its dependency path is highlighted.` : ""}
      </p>
    </section>
  );
}

export { HUB_ID };
