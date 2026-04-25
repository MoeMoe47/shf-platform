import React from "react";
import "./shs-command-header.css";

const statusChips = [
  {
    tone: "green",
    icon: "◎",
    label: "Oracle Active",
    subtext: "All Systems Operational",
  },
  {
    tone: "blue",
    icon: "⌘",
    label: "Verification 91%",
    subtext: "↑ 4% vs 7d",
  },
  {
    tone: "orange",
    icon: "◇",
    label: "Contradictions 3 Open",
    subtext: "↓ 1 vs 7d",
  },
  {
    tone: "green",
    icon: "⬡",
    label: "Reporting Readiness High",
    subtext: "↑ 5% vs 7d",
  },
];

export default function SHSCommandHeader() {
  return (
    <header className="shs-command-header" aria-label="SHS command surface header">
      <section className="shs-command-header__brand" aria-label="Brand">
        <div className="shs-command-header__mark" aria-hidden="true">
          SH
        </div>

        <div className="shs-command-header__title-block">
          <h1>Silicon Heartland Solutions Unified Truth Command Surface</h1>
          <p>
            <span>Unified Truth Pipeline</span>
            <b>•</b>
            <span>Verification</span>
            <b>•</b>
            <span>Oracle Intelligence</span>
            <b>•</b>
            <span>Reporting Readiness</span>
          </p>
        </div>
      </section>

      <section className="shs-command-header__status" aria-label="System status">
        {statusChips.map((chip) => (
          <article
            key={chip.label}
            className={`shs-command-header__chip shs-command-header__chip--${chip.tone}`}
          >
            <span className="shs-command-header__chip-icon" aria-hidden="true">
              {chip.icon}
            </span>
            <span className="shs-command-header__chip-copy">
              <strong>{chip.label}</strong>
              <small>{chip.subtext}</small>
            </span>
          </article>
        ))}
      </section>

      <section className="shs-command-header__actions" aria-label="Header actions">
        <button className="shs-command-header__export" type="button">
          Export
          <span aria-hidden="true">⌄</span>
        </button>

        <div className="shs-command-header__operator" aria-label="Operator status">
          <div className="shs-command-header__operator-copy">
            <strong>Operator</strong>
            <small>10:42 AM ET</small>
          </div>

          <div className="shs-command-header__avatar" aria-hidden="true">
            <span>O</span>
            <i />
          </div>
        </div>
      </section>
    </header>
  );
}
