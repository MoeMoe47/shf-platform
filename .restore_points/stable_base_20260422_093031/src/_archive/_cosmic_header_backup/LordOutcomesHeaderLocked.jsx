// src/components/lordOutcomes/shell/LordOutcomesHeaderLocked.jsx
import React, { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";

/**
 * Cosmic Header (locked filename for compatibility)
 * - Tabs centered
 * - Menu + Export dropdowns (details/summary)
 * - Filter pills with styled selects
 */
export default function LordOutcomesHeaderLocked({
  title = "Lord of Outcomes™",
  subtitle = "Outcome Intelligence Dashboard",
}) {
  const location = useLocation();

  const filters = useMemo(
    () => ({
      mode: "Live",
      region: "US-OH",
      stream: "WIOA + Perkins",
      range: "Last 90 Days",
      updated: "1/2/2026, 3:04:58 PM",
    }),
    []
  );

  const tabClass = ({ isActive }) => (isActive ? "looTab is-active" : "looTab");

  // close any open <details> when route changes (keeps UI clean)
  React.useEffect(() => {
    document.querySelectorAll(".looDrop[open]").forEach((d) => d.removeAttribute("open"));
  }, [location.pathname]);

  return (
    <header className="looHeader">
      <div className="looHdrPanel">
        {/* TOP ROW */}
        <div className="looHdrTop">
          <div className="looHdrBrand">
            <div className="looHdrBrandTitle">{title}</div>
            <div className="looHdrBrandSub">{subtitle}</div>
          </div>

          <nav className="looHdrTabs" aria-label="Primary">
            <NavLink to="/lord-of-outcomes" end className={tabClass}>
              Overview
            </NavLink>
            <NavLink to="/lord-of-outcomes/states" className={tabClass}>
              States
            </NavLink>
            <NavLink to="/lord-of-outcomes/programs" className={tabClass}>
              Programs
            </NavLink>
            <NavLink to="/lord-of-outcomes/employers" className={tabClass}>
              Employers
            </NavLink>
            <NavLink to="/lord-of-outcomes/funding" className={tabClass}>
              Funding
            </NavLink>
            <NavLink to="/lord-of-outcomes/pilots/launch" className={tabClass}>
              Pilots
            </NavLink>
          </nav>

          <div className="looHdrActions">
            {/* MENU */}
            <details className="looDrop">
              <summary className="looBtn">
                ☰ <span>Menu</span> <span className="looCaret">▾</span>
              </summary>

              <div className="looMenu" role="menu" aria-label="Menu">
                <div className="looMenuHeader">View Mode</div>
                <button className="looMenuItem" type="button" role="menuitem">
                  Cards <small>✓</small>
                </button>
                <button className="looMenuItem" type="button" role="menuitem">
                  Charts
                </button>
                <button className="looMenuItem" type="button" role="menuitem">
                  Table
                </button>
                <button className="looMenuItem" type="button" role="menuitem">
                  Map
                </button>
                <button className="looMenuItem" type="button" role="menuitem">
                  Compare <small>(A vs B)</small>
                </button>

                <div className="looMenuSep" />

                <div className="looMenuHeader">Admin</div>
                <button className="looMenuItem" type="button" role="menuitem">
                  Grant Binder
                </button>
                <button className="looMenuItem" type="button" role="menuitem">
                  Investor View
                </button>
                <button className="looMenuItem" type="button" role="menuitem">
                  Admin Tools
                </button>
                <button className="looMenuItem" type="button" role="menuitem">
                  Settings
                </button>
              </div>
            </details>

            {/* EXPORT */}
            <details className="looDrop">
              <summary className="looBtn">
                ⬇ <span>Export</span> <span className="looCaret">▾</span>
              </summary>

              <div className="looMenu" role="menu" aria-label="Export">
                <div className="looMenuHeader">Export</div>
                <button className="looMenuItem" type="button" role="menuitem">
                  PDF <small>Executive Summary</small>
                </button>
                <button className="looMenuItem" type="button" role="menuitem">
                  PDF <small>Full Appendix</small>
                </button>
                <div className="looMenuSep" />
                <button className="looMenuItem" type="button" role="menuitem">
                  CSV <small>Current View</small>
                </button>
                <button className="looMenuItem" type="button" role="menuitem">
                  JSON <small>Current View</small>
                </button>
                <div className="looMenuSep" />
                <button className="looMenuItem" type="button" role="menuitem">
                  Copy link <small>to snapshot</small>
                </button>
              </div>
            </details>
          </div>
        </div>

        {/* FILTER ROW */}
        <div className="looHdrFilters" aria-label="Filters">
          <div className="looPill">
            <span className="looPillLabel">Mode:</span>
            <span className="looSelectWrap">
              <select className="looSelect" defaultValue={filters.mode}>
                <option>Live</option>
                <option>Draft</option>
                <option>Sandbox</option>
              </select>
            </span>
          </div>

          <div className="looPill">
            <span className="looPillLabel">Region:</span>
            <span className="looSelectWrap">
              <select className="looSelect" defaultValue={filters.region}>
                <option>US-OH</option>
                <option>US-MI</option>
                <option>US-PA</option>
                <option>US-IN</option>
                <option>US-WV</option>
              </select>
            </span>
          </div>

          <div className="looPill">
            <span className="looPillLabel">Stream:</span>
            <span className="looSelectWrap">
              <select className="looSelect" defaultValue={filters.stream}>
                <option>WIOA + Perkins</option>
                <option>ESSA + Title I</option>
                <option>IDEA</option>
                <option>Employer Direct</option>
              </select>
            </span>
          </div>

          <div className="looPill">
            <span className="looPillLabel">Range:</span>
            <span className="looSelectWrap">
              <select className="looSelect" defaultValue={filters.range}>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Last 12 Months</option>
              </select>
            </span>
          </div>

          <div className="looHdrSpacer" />

          <button className="looReset" type="button" title="Reset Filters">
            ↻ Reset Filters
          </button>
        </div>

        {/* META */}
        <div className="looHdrMeta">
          <span className="looDot" aria-hidden="true" />
          <span>{filters.region}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>{filters.range}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>{filters.stream}</span>

          <span style={{ marginLeft: "auto" }}>
            Updated: {filters.updated}
          </span>
        </div>
      </div>
    </header>
  );
}
