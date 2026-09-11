// ProgramAssuranceChecklist.jsx — "Why this status?" explainable
// checklist. Locked UX principle (see task brief): never show a
// status like "Active" or "Verified" without a path to "Why this
// status?" — this panel is that path. DEMO / FRAME DATA — checks come
// from programDetailMockData.js, not a real assurance engine.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function ProgramAssuranceChecklist({ program }) {
  return (
    <section className="cse-card cse-pd-why" aria-labelledby="cse-pd-why-heading">
      <h3 id="cse-pd-why-heading" className="cse-pd-why__heading">
        Why this status?
      </h3>
      <p className="cse-pd-why__intro">
        This program is marked <strong>{program.status}</strong> based on the checks below.
      </p>

      <ul className="cse-pd-why__list">
        {program.assuranceChecks.map((check) => (
          <li key={check.key} className={`cse-pd-why__item cse-pd-why__item--${check.state}`}>
            <span className="cse-pd-why__icon" aria-hidden="true">
              <ExplorerIcon name={check.state === "verified" ? "shieldCheck" : "infoCircle"} />
            </span>
            <span className="cse-pd-why__label">{check.label}</span>
            <span className="cse-pd-why__status">
              {check.state === "verified" ? "Verified" : check.note || "Needs review"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
