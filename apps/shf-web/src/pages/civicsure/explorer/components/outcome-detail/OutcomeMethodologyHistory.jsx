// OutcomeMethodologyHistory.jsx — methodology name/version/effective
// date/status card with a real "View methodology history" expand-in-
// place panel. Supports future durable versioning without pretending
// a full version-control system exists yet. DEMO / FRAME DATA (see
// ../../outcomeDetailMockData.js).
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function OutcomeMethodologyHistory({ methodology }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="cse-card cse-otc-methodology-version" aria-labelledby="cse-otc-methodology-version-heading">
      <h3 id="cse-otc-methodology-version-heading">Methodology Versioning</h3>
      <dl className="cse-otc-methodology-version__grid">
        <div>
          <dt>Methodology</dt>
          <dd>{methodology.name}</dd>
        </div>
        <div>
          <dt>Version</dt>
          <dd>{methodology.version}</dd>
        </div>
        <div>
          <dt>Effective date</dt>
          <dd>{methodology.effectiveDate}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <StatusBadge state={methodology.status} />
          </dd>
        </div>
      </dl>

      <button
        type="button"
        className="cse-otc-methodology-version__action"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="cse-otc-methodology-history-list"
      >
        View methodology history
        <ExplorerIcon name={expanded ? "chevronDown" : "arrowRight"} />
      </button>

      {expanded ? (
        <ol id="cse-otc-methodology-history-list" className="cse-otc-methodology-version__history">
          {methodology.history.map((h) => (
            <li key={h.key}>
              <p className="cse-otc-methodology-version__history-label">{h.label}</p>
              <p className="cse-otc-methodology-version__history-note">{h.note}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
