// src/pages/admin/agent-fabric-command/AgentFabricCommandCenter.jsx
// AFCC Visual V3 — operational topology. Read-only projection over existing
// Agent Fabric authorities; see commandContracts.js for the admitted endpoints
// and ecosystemTopology.js for the canonical relationships.
//
// Workflow: prioritize (strip) -> locate (map) -> inspect (drawer: overview,
// authority, evidence, dependencies) -> navigate to the owning authority.
import React from "react";
import { Link } from "react-router-dom";
import "./agent-fabric-command.css";
import useCommandOverview from "./useCommandOverview.js";
import { buildStatusStrip, formatTimestamp } from "./commandPresentation.js";
import { buildOperationalModel, buildSearchIndex, PRIORITY_COPY } from "./operationalModel.js";
import CommandSidebar from "./components/CommandSidebar.jsx";
import CommandStatusStrip from "./components/CommandStatusStrip.jsx";
import CommandOverview from "./components/CommandOverview.jsx";
import CommandDrawer, { nodeForSelection } from "./components/CommandDrawer.jsx";
import CommandSearch from "./components/CommandSearch.jsx";
import EcosystemMap from "./components/EcosystemMap.jsx";
import { ToneChip } from "./components/SourceState.jsx";

// Layout follows the width available to the Command Center, not the raw
// viewport. Drawer: docked only when the canvas can keep the map at full size.
export function layoutForWidth(width) {
  if (width >= 1760) return "ultra";
  if (width >= 1180) return "wide";
  if (width >= 780) return "medium";
  return "narrow";
}

export const DRAWER_MODE = Object.freeze({ ultra: "docked", wide: "overlay", medium: "overlay", narrow: "sheet" });

function useLayout(ref) {
  const [layout, setLayout] = React.useState("wide");
  React.useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const update = () => setLayout(layoutForWidth(node.getBoundingClientRect().width));
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return layout;
}

function PriorityMatches({ counts, filter, onOpen, onClear }) {
  const entry = counts.find((c) => c.category === filter);
  if (!entry) return null;
  const copy = PRIORITY_COPY[filter];
  return (
    <section className="afcc-matches" aria-labelledby="afcc-matches-title">
      <div className="afcc-matches-head">
        <h2 id="afcc-matches-title">
          <ToneChip tone={copy.tone}>{copy.label}</ToneChip>{" "}
          {entry.count === null ? entry.unavailable : `${entry.count} item${entry.count === 1 ? "" : "s"}`}
        </h2>
        <button type="button" className="afcc-link-button" onClick={onClear}>Clear filter</button>
      </div>
      <p className="afcc-quiet afcc-fine">{copy.rule} {entry.detail}</p>
      {entry.items.length ? (
        <ul className="afcc-matches-list">
          {entry.items.slice(0, 12).map((item) => (
            <li key={item.id}>
              <button type="button" className="afcc-match" onClick={(e) => onOpen(item.nodeId && item.selection.type === "node" ? { type: "node", key: item.nodeId } : item.selection, e.currentTarget)}>
                <span className="afcc-match-label">{item.label}</span>
                <span className="afcc-match-reason">{item.reason}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : entry.count === 0 ? <p className="afcc-quiet">No readable source reports an item in this category.</p> : null}
      {entry.items.length > 12 ? <p className="afcc-quiet afcc-fine">{entry.items.length - 12} more; search (⌘K) lists every alert.</p> : null}
    </section>
  );
}

export default function AgentFabricCommandCenter() {
  const rootRef = React.useRef(null);
  const searchTriggerRef = React.useRef(null);
  const layout = useLayout(rootRef);
  const { snapshot, refresh, refreshing } = useCommandOverview();
  const strip = buildStatusStrip(snapshot);
  const model = React.useMemo(() => buildOperationalModel(snapshot), [snapshot]);
  const searchIndex = React.useMemo(() => buildSearchIndex(snapshot, model), [snapshot, model]);
  const [selection, setSelection] = React.useState(null);
  const [mapSelected, setMapSelected] = React.useState(null);
  const [priorityFilter, setPriorityFilter] = React.useState(null);
  const [mapMode, setMapMode] = React.useState("operations");
  const [navOpen, setNavOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const returnFocusRef = React.useRef(null);

  const drawerMode = DRAWER_MODE[layout];
  const modalOpen = (Boolean(selection) && drawerMode !== "docked") || searchOpen;

  const openDrawer = React.useCallback((next, trigger) => {
    if (!next) return;
    // Moving between selections inside the drawer keeps the original trigger.
    if (!trigger?.closest?.(".afcc-drawer")) returnFocusRef.current = trigger || document.activeElement;
    setSelection(next);
    const node = nodeForSelection(next);
    if (node) setMapSelected(node);
  }, []);

  const restoreFocus = React.useCallback(() => {
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    // After the dialog unmounts and the background is no longer inert.
    requestAnimationFrame(() => {
      if (target && target.isConnected) target.focus();
    });
  }, []);

  const closeDrawer = React.useCallback(() => {
    setSelection(null);
    restoreFocus();
  }, [restoreFocus]);

  const clearMap = React.useCallback(() => {
    if (mapSelected) setMapSelected(null);
    else setPriorityFilter(null);
  }, [mapSelected]);

  const openSearch = React.useCallback(() => {
    returnFocusRef.current = searchTriggerRef.current;
    setSearchOpen(true);
  }, []);

  React.useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (searchOpen) return;
        setSelection(null);
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, openSearch]);

  const chooseResult = (entry) => {
    setSearchOpen(false);
    requestAnimationFrame(() => openDrawer(entry.selection, searchTriggerRef.current));
  };

  const lastObserved = Object.values(snapshot)
    .map((p) => p.source?.observedAt)
    .filter(Boolean)
    .sort()
    .pop();

  const docked = Boolean(selection) && drawerMode === "docked";
  return (
    <div ref={rootRef} className={`afcc-root afcc-mode-${layout}${docked ? " has-docked-drawer" : ""}`} data-layout={layout}>
      <div className="afcc-frame" inert={modalOpen || undefined}>
        <CommandSidebar collapsible={layout === "medium" || layout === "narrow"} open={navOpen} onToggle={() => setNavOpen((v) => !v)} />
        {/* The admin shell already provides <main>; this is a labelled region inside it. */}
        <section className="afcc-canvas" aria-labelledby="afcc-title">
          <div className="afcc-top">
            <div className="afcc-top-title">
              <h1 id="afcc-title">Agent Fabric Command Center</h1>
              <p className="afcc-quiet">Read-only projection over Agent Fabric authorities. It reads recorded state and changes nothing.</p>
            </div>
            <div className="afcc-top-actions">
              <div className="afcc-top-buttons">
                <button ref={searchTriggerRef} type="button" className="afcc-button afcc-find-trigger" onClick={openSearch} aria-keyshortcuts="Meta+K Control+K">
                  Search systems, agents, runs<kbd aria-hidden="true">⌘K</kbd>
                </button>
                <button type="button" className="afcc-button" onClick={refresh} disabled={refreshing} aria-describedby="afcc-last-observed">
                  {refreshing ? "Refreshing…" : "Refresh sources"}
                </button>
              </div>
              <p id="afcc-last-observed" className="afcc-quiet afcc-fine">
                {lastObserved ? `Last response ${formatTimestamp(lastObserved)}` : "Waiting for first response"}
                {" · "}
                <Link className="afcc-text-link" to="/agent-fabric">Agent Fabric registry page</Link>
              </p>
            </div>
          </div>
          <CommandStatusStrip strip={strip} counts={model.counts} priorityFilter={priorityFilter} onFilter={setPriorityFilter} onOpen={openDrawer} />
          {priorityFilter ? (
            <PriorityMatches counts={model.counts} filter={priorityFilter} onOpen={openDrawer} onClear={() => setPriorityFilter(null)} />
          ) : null}
          <EcosystemMap
            model={model}
            selectedId={mapSelected}
            onSelect={(id, trigger) => openDrawer({ type: "node", key: id }, trigger)}
            onClear={clearMap}
            priorityFilter={priorityFilter}
            mode={mapMode}
            onModeChange={setMapMode}
          />
          <CommandOverview snapshot={snapshot} onOpen={openDrawer} selectedNode={mapSelected} />
        </section>
      </div>
      {selection ? (
        <CommandDrawer selection={selection} snapshot={snapshot} model={model} mode={drawerMode} onClose={closeDrawer} onSelect={openDrawer} />
      ) : null}
      <CommandSearch open={searchOpen} entries={searchIndex} onClose={() => { setSearchOpen(false); restoreFocus(); }} onChoose={chooseResult} />
    </div>
  );
}
