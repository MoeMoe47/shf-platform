// src/components/lordOutcomes/shell/LordOutcomesSidebar.jsx
import React from "react";

/**
 * Sidebar is router-free:
 * - uses plain <button>
 * - calls onChange("home" | "states" | "programs" | "employers" | "funding")
 */
const Item = ({ id, active, icon, label, onChange }) => (
  <li>
    <button
      type="button"
      onClick={() => onChange(id)}
      className={
        active === id ? "civic-navLink is-active" : "civic-navLink"
      }
      title={label}
      aria-label={label}
    >
      <span
        className="crb-linkIcon"
        aria-hidden
        style={{ marginRight: 6 }}
      >
        {icon}
      </span>
      <span className="crb-linkLabel">{label}</span>
    </button>
  </li>
);

export default function LordOutcomesSidebar({ view, onChange }) {
  return (
    <aside className="civic-rail lord-rail">
      <nav aria-label="Lord of Outcomes navigation">
        <ul className="civic-navList">
          <Item
            id="home"
            active={view}
            icon="⭐"
            label="Regional North Star"
            onChange={onChange}
          />
          <Item
            id="states"
            active={view}
            icon="🗺️"
            label="State Outcomes"
            onChange={onChange}
          />
          <Item
            id="programs"
            active={view}
            icon="📘"
            label="Program Outcomes"
            onChange={onChange}
          />
          <Item
            id="employers"
            active={view}
            icon="🏢"
            label="Employer Impact"
            onChange={onChange}
          />
          <Item
            id="funding"
            active={view}
            icon="💵"
            label="Funding Impact"
            onChange={onChange}
          />
        </ul>
      </nav>
    </aside>
  );
}
