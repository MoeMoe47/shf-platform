import React from "react";
import AppLink from "@/components/nav/AppLink.jsx";

const KEY = "treasury:rail:collapsed";

const Item = ({ to, icon, children, end = false }) => (
  <li>
    <AppLink
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
    </AppLink>
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

export default function TreasurySidebar() {
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

    // Scope collapse to the Treasury app only
    const html = document.documentElement;
    if (collapsed) html.setAttribute("data-rail", "collapsed");
    else html.removeAttribute("data-rail");
  }, [collapsed]);

  return (
    <nav className="crb-nav" aria-label="Treasury Navigation">
      {/* OVERVIEW */}
      <div className="crb-navSection">
        <div className="crb-navTitle">OVERVIEW</div>
        <ul className="crb-list">
          <Item to="/dashboard" icon="📊" end>
            Dashboard
          </Item>

          <Item to="/dashboard-ns" icon="⭐">
            Northstar Dashboard
          </Item>

          <li>
            <AppLink to="/dashboard-northstar" className="crb-link">
              <span className="crb-linkIcon" aria-hidden>
                🧭
              </span>
              <span className="crb-linkLabel">Northstar</span>
            </AppLink>
          </li>

          <li>
            <AppLink to="/lessons" className="crb-link">
              <span className="crb-linkIcon" aria-hidden>
                📚
              </span>
              <span className="crb-linkLabel">Lessons</span>
            </AppLink>
          </li>

          <li>
            <AppLink to="/assignments" className="crb-link">
              <span className="crb-linkIcon" aria-hidden>
                📝
              </span>
              <span className="crb-linkLabel">Assignments</span>
            </AppLink>
          </li>

          <li>
            <AppLink to="/portfolio" className="crb-link">
              <span className="crb-linkIcon" aria-hidden>
                🗂️
              </span>
              <span className="crb-linkLabel">Portfolio</span>
            </AppLink>
          </li>
        </ul>
      </div>

      {/* ASSETS & LEDGER */}
      <div className="crb-navSection">
        <div className="crb-navTitle">ASSETS & LEDGER</div>
        <ul className="crb-list">
          <Item to="/assets" icon="💼">
            Assets
          </Item>
          <Item to="/ledger" icon="📜">
            Ledger
          </Item>
          <Item to="/proofs" icon="🔗">
            Chain Proofs
          </Item>
        </ul>
      </div>

      {/* PROGRAMS (ledger views filtered via query) */}
      <div className="crb-navSection">
        <div className="crb-navTitle">PROGRAMS</div>
        <ul className="crb-list">
          <Item to="/ledger?view=grants" icon="🎓">
            Grants
          </Item>
          <Item to="/ledger?view=donations" icon="💝">
            Donations
          </Item>
          <Item to="/assets?type=ip" icon="📚">
            Curriculum IP
          </Item>
          <Item to="/assets?type=metaverse" icon="🌐">
            Metaverse
          </Item>
          <Item to="/assets?type=impact" icon="📈">
            Impact Data
          </Item>
        </ul>
      </div>

      {/* BATCHES & CHAIN */}
      <div className="crb-navSection">
        <div className="crb-navTitle">BATCHES & CHAIN</div>
        <ul className="crb-list">
          <Item to="/proofs?tab=batches" icon="🗂️">
            Batches
          </Item>
          <Item to="/proofs?tab=health" icon="🩺">
            Proof Health
          </Item>
          <Item to="/settings?tab=keys" icon="🔑">
            Keys & Integrations
          </Item>
          <ItemExt href="/treasury.html#/__docs" icon="📖">
            Developer Docs
          </ItemExt>
        </ul>
      </div>

      {/* CROSS APPS */}
      <div className="crb-navSection">
        <div className="crb-navTitle">CROSS APPS</div>
        <ul className="crb-list">
          <ItemExt href="/debt.html#/clock" icon="🕒">
            Debt Clock
          </ItemExt>
          <ItemExt href="/credit.html#/report" icon="🧾">
            Credit Reports
          </ItemExt>
          <ItemExt href="/career.html#/" icon="🧭">
            Career
          </ItemExt>
          <ItemExt href="/sales.html#/dashboard" icon="🛍️">
            Sales
          </ItemExt>
          <ItemExt href="/employer.html#/dashboard" icon="🏢">
            Employer
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
