// CountyFundingPanel.jsx — Funding tab: authorized/awarded/obligated/
// expended/remaining, top sources, funding by category, funding by
// program, and a prominent "Follow the Money" lineage card. DEMO /
// FRAME DATA (see ../../countyDetailMockData.js).
//
// The lineage card reuses the .cse-ftm__* CSS classes already defined
// in civicsure-explorer.css for the Explorer main page's
// FollowTheMoneyCard.jsx — but NOT that component itself, because
// County Detail's lineage is a genuinely different sequence (it
// includes "County" as its own step: Funding Source → County →
// Program → Provider → Delivery → Evidence → Outcome). Reusing the
// generic component here would either misrepresent that sequence or
// duplicate a near-identical second widget on the same tab; reusing
// just the visual classes with this county's own step list avoids
// both.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function CountyFundingPanel({ county }) {
  const { funding } = county;

  const stats = [
    { key: "totalAuthorized", label: "Total Authorized", value: funding.totalAuthorized },
    { key: "awarded", label: "Awarded", value: funding.awarded },
    { key: "obligated", label: "Obligated", value: funding.obligated },
    { key: "expended", label: "Expended", value: funding.expended },
    { key: "remaining", label: "Remaining", value: funding.remaining },
  ];

  return (
    <div className="cse-cty-panel" role="tabpanel" id="cse-cty-tabpanel-funding" aria-labelledby="cse-cty-tab-funding">
      <div className="cse-metrics" role="list" aria-label={`Funding summary for ${county.name} (demo data)`}>
        {stats.map((s) => (
          <div className="cse-metric-card" role="listitem" key={s.key}>
            <div>
              <p className="cse-metric-card__value">{s.value}</p>
              <p className="cse-metric-card__label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="cse-cty-funding-grid">
        <section className="cse-card">
          <h3 className="cse-cty-funding-section__heading">Top Funding Sources</h3>
          <p className="cse-cty-funding-section__period">Reporting period: {funding.reportingPeriod}</p>
          <ul className="cse-cty-funding-list">
            {funding.topSources.map((s) => (
              <li key={s.key}>
                <span>{s.label}</span>
                <strong>{s.amount}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="cse-card">
          <h3 className="cse-cty-funding-section__heading">Funding by Category</h3>
          <ul className="cse-cty-funding-list">
            {funding.byCategory.map((c) => (
              <li key={c.key}>
                <span>{c.label}</span>
                <strong>{c.amount}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="cse-card">
          <h3 className="cse-cty-funding-section__heading">Funding by Program</h3>
          <ul className="cse-cty-funding-list">
            {funding.byProgram.map((p) => (
              <li key={p.key}>
                <span>{p.label}</span>
                <strong>{p.amount}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="cse-card" aria-labelledby="cse-cty-ftm-heading">
        <div className="cse-ftm__head">
          <span className="cse-ftm__head-icon" aria-hidden="true">
            <ExplorerIcon name="bank" />
          </span>
          <div className="cse-ftm__head-text">
            <h3 id="cse-cty-ftm-heading">Follow the Money</h3>
            <p>How public funding flows through {county.name} to a verified outcome.</p>
          </div>
          <span className="cse-ftm__head-arrow" aria-hidden="true">
            <ExplorerIcon name="arrowRight" />
          </span>
        </div>

        <ol className="cse-ftm__flow" aria-label={`${county.name} funding lineage stages (illustrative)`}>
          {funding.lineage.map((step, i) => (
            <React.Fragment key={step.key}>
              <li className={`cse-ftm__step${step.tone === "green" ? " cse-ftm__step--green" : ""}`}>
                <span className="cse-ftm__step-icon" aria-hidden="true">
                  <ExplorerIcon name={step.icon} />
                </span>
                <span className="cse-ftm__step-label">{step.label}</span>
              </li>
              {i < funding.lineage.length - 1 ? (
                <li className="cse-ftm__arrow" aria-hidden="true">
                  <ExplorerIcon name="arrowRight" />
                </li>
              ) : null}
            </React.Fragment>
          ))}
        </ol>

        <a href="#/explorer" className="cse-ftm__footer">
          Explore a real example
          <ExplorerIcon name="arrowRight" />
        </a>
      </section>
    </div>
  );
}
