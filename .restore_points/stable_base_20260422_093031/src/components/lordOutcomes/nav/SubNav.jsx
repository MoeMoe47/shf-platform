// src/components/lordOutcomes/nav/SubNav.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSubnavForTopTab, STATES, PROGRAMS } from "./subnav.config.js";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function useQueryState() {
  const loc = useLocation();
  const nav = useNavigate();

  const params = React.useMemo(() => new URLSearchParams(loc.search || ""), [loc.search]);

  const get = (k, fallback = "") => params.get(k) ?? fallback;

  const set = (patch, { replace = true } = {}) => {
    const next = new URLSearchParams(loc.search || "");
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    nav(`${loc.pathname}${next.toString() ? `?${next.toString()}` : ""}`, { replace });
  };

  return { get, set, params };
}

function topFromPath(pathname) {
  const p = (pathname || "/").replace(/^\/+/, "");
  const k = p.split("/")[0] || "home";
  // Your routes use "" for home, but in this helper we map to "home"
  if (k === "") return "home";
  if (k === "states") return "states";
  if (k === "programs") return "programs";
  if (k === "employers") return "employers";
  if (k === "funding") return "funding";
  if (k === "pilots") return "pilots";
  return "home";
}

export default function SubNav() {
  const loc = useLocation();
  const nav = useNavigate();
  const { get, set } = useQueryState();

  const top = topFromPath(loc.pathname);
  const spec = getSubnavForTopTab(top);
  if (!spec) return null;

  // Ensure default param exists for chips/rail types
  React.useEffect(() => {
    if (spec.type === "chips" || spec.type === "stateRail") {
      const cur = get(spec.param, "");
      if (!cur && spec.defaultKey) set({ [spec.param]: spec.defaultKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top]);

  // Render helpers
  const renderChips = () => {
    const cur = get(spec.param, spec.defaultKey || "");
    return (
      <div className="looSubnavRail" role="navigation" aria-label="Section sub-navigation">
        {spec.items.map((it) => (
          <button
            key={it.key}
            type="button"
            className={cx("looSubnavChip", cur === it.key && "is-active")}
            onClick={() => set({ [spec.param]: it.key })}
          >
            {it.label}
          </button>
        ))}
      </div>
    );
  };

  const renderStateRail = () => {
    const cur = get("state", spec.defaultKey || "OH");
    const visible = spec.items.slice(0, 5);
    const extra = spec.items.slice(5);

    return (
      <div className="looSubnavRail" role="navigation" aria-label="State selection">
        {visible.map((s) => (
          <button
            key={s.key}
            type="button"
            className={cx("looSubnavChip", cur === s.key && "is-active")}
            onClick={() => set({ state: s.key })}
          >
            {s.label}
          </button>
        ))}
        {extra.length ? (
          <details className="looSubnavMore">
            <summary className="looSubnavMoreBtn">More ▾</summary>
            <div className="looSubnavMoreMenu">
              {extra.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={cx("looSubnavMenuItem", cur === s.key && "is-active")}
                  onClick={() => set({ state: s.key })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    );
  };

  const renderRoutes = () => {
    // "routes" are real paths (pilots)
    const path = (loc.pathname || "/").replace(/^\/+/, "");
    const tail = path.split("/")[1] || spec.defaultKey || "launch";
    return (
      <div className="looSubnavRail" role="navigation" aria-label="Pilot sub-navigation">
        {spec.items.map((it) => (
          <button
            key={it.key}
            type="button"
            className={cx("looSubnavChip", tail === it.key && "is-active")}
            onClick={() => nav(it.path)}
          >
            {it.label}
          </button>
        ))}
      </div>
    );
  };

  const stateKey = get("state", "All");
  const programKey = get("program", "All");
  const range = get("range", "90d");
  const view = get("view", "charts");

  const stateLabel = STATES.find((s) => s.key === stateKey)?.label || (stateKey === "All" ? "All States" : stateKey);
  const programLabel =
    PROGRAMS.find((p) => p.key === programKey)?.label || (programKey === "All" ? "All Programs" : programKey);

  return (
    <div className="looSubnavWrap">
      {/* SUBNAV ROW */}
      <div className="looSubnavRow">
        {spec.type === "chips" ? renderChips() : null}
        {spec.type === "stateRail" ? renderStateRail() : null}
        {spec.type === "routes" ? renderRoutes() : null}

        {/* Right-side quick filters (range + view) */}
        <div className="looSubnavRight">
          <select className="looSubnavSelect" value={range} onChange={(e) => set({ range: e.target.value })}>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="ytd">Year to Date</option>
            <option value="all">All Time</option>
          </select>

          <select className="looSubnavSelect" value={view} onChange={(e) => set({ view: e.target.value })}>
            <option value="cards">Cards</option>
            <option value="charts">Charts</option>
            <option value="table">Table</option>
            <option value="map">Map</option>
            <option value="compare">Compare</option>
          </select>
        </div>
      </div>

      {/* CONTEXT BAR ROW */}
      <div className="looContextBar" aria-label="Context bar">
        <div className="looContextLeft">
          <span className="looContextDot" aria-hidden />
          <span className="looContextText">
            {stateLabel} · {programLabel} · {range === "all" ? "All Time" : range.toUpperCase()} · View: {view}
          </span>
        </div>
        <div className="looContextRight">
          <button className="looContextLink" type="button" onClick={() => set({ state: "", program: "" })}>
            Reset Context
          </button>
        </div>
      </div>
    </div>
  );
}
