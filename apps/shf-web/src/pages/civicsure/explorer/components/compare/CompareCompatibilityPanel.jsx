// CompareCompatibilityPanel.jsx — the signature "Comparison
// Compatibility" trust feature. Shows one of four DEMO statuses
// (Compatible / Mostly Compatible / Limited Comparison / Not Directly
// Comparable), a plain-English explanation, explicit pass/warn
// checks, a comparability rules table, and a real "Why does this
// matter?" expand-in-place explanation — same interaction pattern as
// every other detail page's assurance/verification panel in this
// suite. The status is rendered as text, never color-only. DEMO /
// FRAME DATA (see ../../compareViewMockData.js — computeComparability
// is explicitly DEMO logic, not a production CivicSure policy).
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

const STATUS_TONE = {
  compatible: "green",
  "mostly-compatible": "blue",
  limited: "amber",
  "not-comparable": "amber",
};

export default function CompareCompatibilityPanel({ comparability }) {
  const [expanded, setExpanded] = useState(false);
  const tone = STATUS_TONE[comparability.status] || "blue";

  return (
    <section className="cse-card cse-cmp-compatibility" aria-labelledby="cse-cmp-compatibility-heading">
      <div className="cse-cmp-compatibility__head">
        <h2 id="cse-cmp-compatibility-heading">Comparison Compatibility</h2>
        <span className={`cse-cmp-compatibility__status cse-cmp-compatibility__status--${tone}`}>{comparability.statusLabel}</span>
      </div>

      <p className="cse-cmp-compatibility__explanation">{comparability.explanation}</p>

      <ul className="cse-cmp-compatibility__checks">
        {comparability.checks.map((check) => (
          <li key={check.key} className={`cse-cmp-compatibility__check cse-cmp-compatibility__check--${check.state}`}>
            <ExplorerIcon name={check.state === "pass" ? "shieldCheck" : "infoCircle"} aria-hidden="true" />
            <span>{check.label}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="cse-cmp-compatibility__action"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="cse-cmp-compatibility-explanation"
      >
        Why does this matter?
        <ExplorerIcon name={expanded ? "chevronDown" : "arrowRight"} />
      </button>

      {expanded ? (
        <p id="cse-cmp-compatibility-explanation" className="cse-cmp-compatibility__matter">
          CivicSure shows this status so a comparison never implies more certainty than the underlying data supports. When
          populations, methodologies, or reporting periods differ, a higher number does not mean better performance — it may
          simply mean a different population, a longer measurement window, or a different definition. Use the sections below to
          see exactly which fields differ before drawing any conclusion.
        </p>
      ) : null}

      <div className="cse-table-wrap">
        <table className="cse-table cse-cmp-compatibility__table">
          <caption className="cse-visually-hidden">Comparability rules for the selected items (demo data)</caption>
          <thead>
            <tr>
              <th scope="col">Rule</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {comparability.rules.map((rule) => (
              <tr key={rule.key}>
                <th scope="row">{rule.label}</th>
                <td>{rule.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
