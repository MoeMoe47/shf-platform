import React from "react";
import { Outlet, NavLink } from "react-router-dom";

/**
 * LordOutcomesLayout — MOCK HEADER SHELL
 * Goal: Put nav + filters INSIDE the copper cinematic header container.
 * This is the structural fix that allows your locked CSS to work.
 */
export default function LordOutcomesLayout() {
  return (
    <div className="loo-dymApp">
      
      
      {/* Deep-space FX layers (mock) */}
      <div className="looSpaceFx" aria-hidden="true">
        <div className="looStarsA" />
        <div className="looStarsB" />
        <div className="looGridFaint" />
        <div className="looRings" />
        <div className="looRingThin" />
        <div className="looVignetteDeep" />
      </div>
{/* === LOO SPACE STACK (mock match) === */}
      <div className="looSpaceStack" aria-hidden="true">
        <div className="looSpaceNebula" />
        <div className="looSpaceStars" />
        <div className="looSpaceGrid" />
        <div className="looSpaceRing looSpaceRing--a" />
        <div className="looSpaceRing looSpaceRing--b" />
        <div className="looSpaceRing looSpaceRing--c" />
      </div>
      {/* Cinematic layers */}
      <div className="loo-dymGrid" aria-hidden="true" />
      <div className="loo-dymNoise" aria-hidden="true" />
      <div className="loo-vignette" aria-hidden="true" />

      <div className="looPage">
        {/* MOCK HEADER */}
        <header className="looTopHeader">
      <div className="looHeaderInner">

          <div className="looBrand">
            <div className="looBrandTitle">Lord of Outcomes™</div>
            <div role="note" className="looDemoNotice">Demonstration data - not verified SHF outcomes.</div>
          </div>

          {/* Tabs row */}
          <nav className="looNav" aria-label="Lord of Outcomes navigation">
            <NavLink end to="." className={({ isActive }) => (isActive ? "active" : "")}>
              Overview
            </NavLink>
            <NavLink to="states" className={({ isActive }) => (isActive ? "active" : "")}>
              States
            </NavLink>
            <NavLink to="programs" className={({ isActive }) => (isActive ? "active" : "")}>
              Programs
            </NavLink>
            <NavLink to="employers" className={({ isActive }) => (isActive ? "active" : "")}>
              Employers
            </NavLink>
            <NavLink to="funding" className={({ isActive }) => (isActive ? "active" : "")}>
              Funding
            </NavLink>
            <NavLink to="pilots" className={({ isActive }) => (isActive ? "active" : "")}>
              Pilots
            </NavLink>

            <button className="looMenuBtn" type="button" aria-label="Menu">
              ☰ Menu
            </button>
          </nav>

          {/* Filter row */}
          <div className="looFiltersRow" role="group" aria-label="Filters">
            <select className="looPill" defaultValue="live">
              <option value="live">Mode: Live</option>
              <option value="sandbox">Mode: Sandbox</option>
            </select>

            <select className="looPill" defaultValue="us-oh">
              <option value="us-oh">Region: US-OH</option>
              <option value="us-mi">Region: US-MI</option>
              <option value="us-pa">Region: US-PA</option>
            </select>

            <select className="looPill" defaultValue="wioa-perkins">
              <option value="wioa-perkins">Stream: WIOA + Perkins</option>
              <option value="essa">Stream: ESSA</option>
              <option value="medicaid">Stream: Medicaid</option>
            </select>

            <div className="looActions">
              <button type="button">⟲ Reset Filters</button>
              <button type="button" disabled title="Demo data is not exportable as an official report">⇩ Export unavailable</button>
              <button type="button">💾 Save View</button>
            </div>
          </div>
              </div>
</header>

        {/* Page content */}
        <main className="looMain">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ============================= */
