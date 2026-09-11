// EvidenceCoveragePanel.jsx — Coverage tab: how the 94% coverage
// figure is constructed, a coverage bar (labeled with text, never
// color-only), a per-source breakdown reconciled to avoid double-
// counting, and the required coverage limitations disclosure. DEMO /
// FRAME DATA (see ../../evidenceSummaryMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function EvidenceCoveragePanel({ evidence }) {
  const { coverage } = evidence;

  return (
    <div className="cse-evs-panel" role="tabpanel" id="cse-evs-tabpanel-coverage" aria-labelledby="cse-evs-tab-coverage">
      <section className="cse-card cse-evs-coverage-summary" aria-labelledby="cse-evs-coverage-summary-heading">
        <h3 id="cse-evs-coverage-summary-heading">Evidence Coverage</h3>
        <dl className="cse-evs-coverage-summary__grid">
          <div>
            <dt>Eligible population</dt>
            <dd>{coverage.eligiblePopulation}</dd>
          </div>
          <div>
            <dt>Accepted verified evidence</dt>
            <dd>{coverage.acceptedVerified}</dd>
          </div>
          <div>
            <dt>Pending/unverified</dt>
            <dd>{coverage.pendingUnverified}</dd>
          </div>
          <div>
            <dt>Coverage</dt>
            <dd>{coverage.coverageLabel}</dd>
          </div>
        </dl>

        <div
          className="cse-evs-coverage-bar"
          role="img"
          aria-label={`Coverage: ${coverage.coverageLabel} of the eligible population has accepted verified evidence`}
        >
          <div className="cse-evs-coverage-bar__track">
            <div className="cse-evs-coverage-bar__fill" style={{ width: `${coverage.coveragePercent}%` }} />
          </div>
          <p className="cse-evs-coverage-bar__label">{coverage.coverageLabel} covered by accepted verified evidence</p>
        </div>
      </section>

      <section className="cse-card cse-evs-coverage-source" aria-labelledby="cse-evs-coverage-source-heading">
        <h3 id="cse-evs-coverage-source-heading">Coverage by Source</h3>
        <ul className="cse-evs-coverage-source__list">
          {coverage.bySource.map((s) => (
            <li key={s.key} className={s.isResult ? "cse-evs-coverage-source__item--result" : undefined}>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
            </li>
          ))}
        </ul>
        <p className="cse-evs-coverage-source__note">{coverage.reconciliationNote}</p>
      </section>

      <section className="cse-card cse-evs-coverage-limitations" aria-labelledby="cse-evs-coverage-limitations-heading">
        <h3 id="cse-evs-coverage-limitations-heading">Coverage Limitations</h3>
        <ul className="cse-evs-coverage-limitations__list">
          {coverage.limitations.map((item, i) => (
            <li key={i}>
              <ExplorerIcon name="infoCircle" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
