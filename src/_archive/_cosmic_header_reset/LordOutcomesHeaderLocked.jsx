import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const cx = (...a) => a.filter(Boolean).join(" ");

const TABS = [
  { label: "Overview", to: "/lord-outcomes" },
  { label: "States", to: "/lord-outcomes/states" },
  { label: "Programs", to: "/lord-outcomes/programs" },
  { label: "Employers", to: "/lord-outcomes/employers" },
  { label: "Funding", to: "/lord-outcomes/funding" },
  { label: "Pilots", to: "/lord-outcomes/pilots" },
];

const DEFAULT_FILTERS = {
  mode: "Live",
  region: "US-OH",
  stream: "WIOA + Perkins",
  range: "Last 90 Days",
  updated: "—",
};

function usePersistedState(key, initialValue) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal];
}

function useCloseDetailsOnClickOutside(ref) {
  useEffect(() => {
    const onDoc = (e) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target)) el.removeAttribute("open");
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [ref]);
}

function FilterPill({ label, value, options, onChange }) {
  return (
    <label className="looHdrPill">
      <span style={{ opacity: 0.75, marginRight: 6 }}>{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "transparent",
          border: 0,
          color: "inherit",
          outline: "none",
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ color: "#0b0b0f" }}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function LordOutcomesHeaderLocked() {
  const nav = useNavigate();

  const [filters, setFilters] = usePersistedState("loo:filters", DEFAULT_FILTERS);
  const [viewMode, setViewMode] = usePersistedState("loo:viewMode", "Cards");

  const menuRef = useRef(null);
  const exportRef = useRef(null);
  useCloseDetailsOnClickOutside(menuRef);
  useCloseDetailsOnClickOutside(exportRef);

  const viewModes = useMemo(
    () => ["Cards", "Charts", "Table", "Map", "Compare (A vs B)"],
    []
  );

  useEffect(() => {
    if (filters.updated && filters.updated !== "—") return;
    setFilters((f) => ({ ...f, updated: new Date().toLocaleString() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFilters = () => {
    setFilters(() => ({ ...DEFAULT_FILTERS, updated: new Date().toLocaleString() }));
  };

  return (
    <header className="looHeaderSlim" role="banner">
      <div className="looHeaderSlimInner">
        <div
          className="looHdrBrand"
          role="button"
          tabIndex={0}
          onClick={() => nav("/lord-outcomes")}
          onKeyDown={(e) => e.key === "Enter" && nav("/lord-outcomes")}
        >
          <div className="looHdrBrandTitle">Lord of Outcomes™</div>
          <div className="looHdrBrandSub">Outcome Intelligence Dashboard</div>
        </div>

        <nav className="looHdrTabs" aria-label="Primary">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === "/lord-outcomes"}
              className={({ isActive }) => cx("looHdrTab", isActive && "is-active")}
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="looHdrActions">
          <details className="looTopMenuWrap" ref={menuRef}>
            <summary className="looTopMenuBtn">
              <span aria-hidden="true">☰</span> Menu
            </summary>
            <div className="looTopMenuPop" role="menu" aria-label="Menu">
              <div className="looTopMenuGroup">
                <div className="looTopMenuTitle">View Mode</div>
                {viewModes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={cx("looTopMenuItem", viewMode === m && "is-checked")}
                    onClick={() => {
                      setViewMode(m);
                      menuRef.current?.removeAttribute("open");
                    }}
                  >
                    <span className="looTopMenuCheck" aria-hidden="true">
                      {viewMode === m ? "✓" : ""}
                    </span>
                    {m}
                  </button>
                ))}
              </div>

              <div className="looTopMenuGroup">
                <div className="looTopMenuTitle">Admin</div>
                <button type="button" className="looTopMenuItem" onClick={() => nav("/admin/grant-binder")}>
                  Grant Binder
                </button>
                <button type="button" className="looTopMenuItem" onClick={() => nav("/admin/investor-northstar")}>
                  Investor View
                </button>
                <button type="button" className="looTopMenuItem" onClick={() => nav("/admin/tool-dashboard")}>
                  Admin Tools
                </button>
                <button type="button" className="looTopMenuItem" onClick={() => nav("/settings")}>
                  Settings
                </button>
              </div>
            </div>
          </details>

          <details className="looTopMenuWrap" ref={exportRef}>
            <summary className="looTopActionBtn">
              <span aria-hidden="true">⤓</span> Export
            </summary>
            <div className="looTopMenuPop" role="menu" aria-label="Export">
              <div className="looTopMenuGroup">
                <div className="looTopMenuTitle">Quick Export</div>
                {["PDF", "CSV", "JSON", "Share Link"].map((x) => (
                  <button
                    key={x}
                    type="button"
                    className="looTopMenuItem"
                    onClick={() => exportRef.current?.removeAttribute("open")}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="looHdrFilters">
        <FilterPill
          label="Mode"
          value={filters.mode}
          options={["Live", "Sandbox", "Audit"]}
          onChange={(v) => setFilters((f) => ({ ...f, mode: v }))}
        />
        <FilterPill
          label="Region"
          value={filters.region}
          options={["US-OH", "US-MI", "US-IN", "US-PA", "US-WV"]}
          onChange={(v) => setFilters((f) => ({ ...f, region: v }))}
        />
        <FilterPill
          label="Stream"
          value={filters.stream}
          options={["WIOA + Perkins", "Perkins Only", "WIOA Only", "Medicaid", "Private"]}
          onChange={(v) => setFilters((f) => ({ ...f, stream: v }))}
        />
        <FilterPill
          label="Range"
          value={filters.range}
          options={["Last 30 Days", "Last 90 Days", "Last 12 Months", "All Time"]}
          onChange={(v) => setFilters((f) => ({ ...f, range: v }))}
        />

        <button type="button" className="looTopActionBtn" onClick={resetFilters}>
          ↻ Reset Filters
        </button>

        <div style={{ marginLeft: "auto" }} />
      </div>

      <div className="looHdrMeta">
        <span className="looDot" aria-hidden="true" />
        <span>{filters.region}</span>
        <span style={{ opacity: 0.55 }}>·</span>
        <span>{filters.range}</span>
        <span style={{ opacity: 0.55 }}>·</span>
        <span>{filters.stream}</span>

        <span style={{ marginLeft: "auto" }}>Updated: {filters.updated}</span>
      </div>
    </header>
  );
}
