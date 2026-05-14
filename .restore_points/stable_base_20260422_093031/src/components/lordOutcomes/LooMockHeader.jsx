import React, { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

/**
 * MOCK-STRUCTURE HEADER (Copper Cosmic Glass)
 * This is the DOM structure your CSS expects:
 * - .looTopHeader
 * - .looTabs (tabs row)
 * - .looFiltersRow (pill row)
 * - dropdown panels using [role="menu"]
 *
 * NOTE: Paths below are conservative guesses. If your routes differ,
 * update the `tabs` list to match your actual LOO routes.
 */
export default function LooMockHeader() {
  const [openMenu, setOpenMenu] = useState(false);

  const tabs = useMemo(
    () => [
      { label: "Overview", to: "/loo" },
      { label: "States", to: "/loo/states" },
      { label: "Programs", to: "/loo/programs" },
      { label: "Employers", to: "/loo/employers" },
      { label: "Funding", to: "/loo/funding" },
      { label: "Pilots", to: "/loo/pilots" },
    ],
    []
  );

  return (
    <div className="looTopHeader">
      {/* Brand row */}
      <div className="looBrand">
        <div className="looBrandTitle">Lord of Outcomes™</div>
      </div>

      {/* Tabs row */}
      <nav className="looTabs" aria-label="LOO sections">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/loo"}
            className={({ isActive }) => (isActive ? "loo-tab is-active" : "loo-tab")}
          >
            {t.label}
          </NavLink>
        ))}

        <div className="looTopMenuWrap" style={{ position: "relative", marginLeft: "auto" }}>
          <button
            className="looMenuBtn"
            type="button"
            aria-label="Menu"
            aria-expanded={openMenu ? "true" : "false"}
            onClick={() => setOpenMenu((v) => !v)}
          >
            ☰ Menu
          </button>

          {openMenu && (
            <div className="looMenuPanel" role="menu" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", minWidth: 260, padding: 10 }}>
              <button className="looTopActionBtn" role="menuitem" style={{ width: "100%", justifyContent: "flex-start" }}>
                ▦ Cards
              </button>
              <button className="looTopActionBtn" role="menuitem" style={{ width: "100%", justifyContent: "flex-start" }}>
                📈 Charts
              </button>
              <button className="looTopActionBtn" role="menuitem" style={{ width: "100%", justifyContent: "flex-start" }}>
                ▤ Table
              </button>
              <button className="looTopActionBtn" role="menuitem" style={{ width: "100%", justifyContent: "flex-start" }}>
                📍 Map
              </button>
              <button className="looTopActionBtn" role="menuitem" style={{ width: "100%", justifyContent: "flex-start" }}>
                ⧉ Compare (A vs B)
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Filters row (pill look) */}
      <div className="looFiltersRow" aria-label="LOO filters">
        <select className="looPill" defaultValue="live" aria-label="Mode">
          <option value="live">Mode: Live</option>
          <option value="last90">Last: 90 Days</option>
          <option value="last30">Last: 30 Days</option>
        </select>

        <select className="looPill" defaultValue="us-oh" aria-label="Region">
          <option value="us-oh">Region: US-OH</option>
          <option value="us-mi">Region: US-MI</option>
          <option value="us-pa">Region: US-PA</option>
        </select>

        <select className="looPill" defaultValue="wioa-perkins" aria-label="Stream">
          <option value="wioa-perkins">Stream: WIOA + Perkins</option>
          <option value="perkins">Stream: Perkins</option>
          <option value="wioa">Stream: WIOA</option>
        </select>

        <div className="looActions">
          <button type="button">⟲ Reset Filters</button>
          <button type="button">⤓ Export</button>
          <button type="button">💾 Save View</button>
        </div>
      </div>
    </div>
  );
}
