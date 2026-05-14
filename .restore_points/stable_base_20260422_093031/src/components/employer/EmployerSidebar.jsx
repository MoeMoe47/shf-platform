// src/components/employer/EmployerSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const KEY = "employer:rail:collapsed";

const Item = ({ to, icon, children, end = false }) => (
  <li>
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => (isActive ? "crb-link is-active" : "crb-link")}
      title={typeof children === "string" ? children : undefined}
      aria-label={typeof children === "string" ? children : undefined}
    >
      <span className="crb-linkIcon" aria-hidden>
        {icon}
      </span>
      <span className="crb-linkLabel">{children}</span>
    </NavLink>
  </li>
);

const ItemExt = ({ href, icon, children }) => (
  <li>
    <a
      className="crb-link"
      href={href}
      title={typeof children === "string" ? children : undefined}
      aria-label={typeof children === "string" ? children : undefined}
    >
      <span className="crb-linkIcon" aria-hidden>
        {icon}
      </span>
      <span className="crb-linkLabel">{children}</span>
    </a>
  </li>
);

export default function EmployerSidebar() {
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(KEY, collapsed ? "1" : "0");
    } catch {}

    // Scope collapse to the Employer app only
    const html = document.documentElement;
    if (collapsed) html.setAttribute("data-rail", "collapsed");
    else html.removeAttribute("data-rail");
  }, [collapsed]);

  return (
    <nav className="crb-nav" aria-label="Employer Navigation">
      {/* OVERVIEW */}
      <div className="crb-navSection">
        <div className="crb-navTitle">OVERVIEW</div>
        <ul className="crb-list">
          <Item to="/dashboard" icon="🧭" end>
            Dashboard
          </Item>
          <Item to="/pipeline" icon="📊">
            Pipeline
          </Item>
          <Item to="/portfolio" icon="🗂️">
            Portfolio
          </Item>
          <Item to="/funding" icon="💵">
            Funding Finder
          </Item>
        </ul>
      </div>

      {/* TALENT */}
      <div className="crb-navSection">
        <div className="crb-navTitle">TALENT</div>
        <ul className="crb-list">
          <Item to="/candidates" icon="🧠">
            Candidates
          </Item>
          <Item to="/reimburse" icon="💸">
            Reimbursements
          </Item>
          <Item to="/jobs" icon="💼">
            Jobs
          </Item>
          <Item to="/interviews" icon="🗓️">
            Interviews
          </Item>
          <Item to="/offers" icon="✍️">
            Offers
          </Item>
        </ul>
      </div>

      {/* ANALYTICS & EXPORTS */}
      <div className="crb-navSection">
        <div className="crb-navTitle">ANALYTICS & REPORTS</div>
        <ul className="crb-list">
          <Item to="/analytics" icon="📈">
            Analytics
          </Item>
          <Item to="/exports" icon="📑">
            Exports
          </Item>
        </ul>
      </div>

      {/* CROSS APPS */}
      <div className="crb-navSection">
        <div className="crb-navTitle">CROSS APPS</div>
        <ul className="crb-list">
          <ItemExt href="/career.html#/dashboard" icon="🧭">
            Career
          </ItemExt>
          <ItemExt href="/treasury.html#/dashboard" icon="🏦">
            Treasury
          </ItemExt>
          <ItemExt href="/credit.html#/report" icon="🧾">
            Credit
          </ItemExt>
          <ItemExt href="/debt.html#/dashboard" icon="⏱️">
            Debt Clock
          </ItemExt>
        </ul>
      </div>

      {/* APP */}
      <div className="crb-navSection">
        <div className="crb-navTitle">APP</div>
        <ul className="crb-list">
          <Item to="/settings" icon="⚙️">
            Settings
          </Item>
          <Item to="/help" icon="❓">
            Help
          </Item>
        </ul>
      </div>

      {/* Collapse control */}
      <div className="crb-railToggleWrap">
        <button
          type="button"
          className="crb-railToggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="lbl-emoji" aria-hidden>
            {collapsed ? "➡️" : "⬅️"}
          </span>
          <span className="lbl-text">{collapsed ? "Expand" : "Collapse"}</span>
        </button>
      </div>
    </nav>
  );
}
