// AgencyFundingPanel.jsx — Funding tab: totals (with the same
// always-visible plain-English term definitions Funding Detail
// established — imported from fundingDetailMockData.js via
// agencyDetailMockData.js's FINANCIAL_TERM_DEFINITIONS re-export, not
// redefined here), three breakdown lists, a real "Explore Funding"
// link to the already-built Funding Detail frame, and a compact
// agency-level lineage. DEMO / FRAME DATA (see
// ../../agencyDetailMockData.js).
//
// The lineage reuses the .cse-ftm__* CSS classes already shared in
// civicsure-explorer.css (same primitive Funding Detail's own
// FundingMoneyFlowPanel.jsx reused) with this agency's own 7-step
// sequence (Federal/State Source → Agency → Program → Provider →
// Delivery → Evidence → Outcome) — a genuinely different sequence
// than either the generic FollowTheMoneyCard or Funding Detail's
// award-level lineage, so it's a third, deliberate reuse of the
// visual language rather than a copy of either component.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import { FINANCIAL_TERM_DEFINITIONS } from "../../agencyDetailMockData.js";

function FinancialTerm({ label, termKey, value }) {
  return (
    <div className="cse-agy-financial-term">
      <div className="cse-agy-financial-term__row">
        <span className="cse-agy-financial-term__label">{label}</span>
        <span className="cse-agy-financial-term__value">{value}</span>
      </div>
      <p className="cse-agy-financial-term__definition">{FINANCIAL_TERM_DEFINITIONS[termKey]}</p>
    </div>
  );
}

export default function AgencyFundingPanel({ agency }) {
  const { funding } = agency;

  return (
    <div className="cse-agy-panel" role="tabpanel" id="cse-agy-tabpanel-funding" aria-labelledby="cse-agy-tab-funding">
      <section className="cse-card cse-agy-financial-position">
        <div className="cse-agy-financial-position__head">
          <h2>Funding Administered</h2>
          {funding.fundingDetailId ? (
            <a className="cse-agy-financial-position__explore" href={`#/explorer/funding/${encodeURIComponent(funding.fundingDetailId)}`}>
              Explore Funding
              <ExplorerIcon name="arrowRight" />
            </a>
          ) : null}
        </div>
        <FinancialTerm label="Authorized" termKey="authorized" value={funding.authorized} />
        <FinancialTerm label="Awarded" termKey="awarded" value={funding.awarded} />
        <FinancialTerm label="Obligated" termKey="obligated" value={funding.obligated} />
        <FinancialTerm label="Expended" termKey="expended" value={funding.expended} />
        <FinancialTerm label="Remaining" termKey="remaining" value={funding.remaining} />
      </section>

      <div className="cse-agy-funding-grid">
        <section className="cse-card">
          <h3 className="cse-agy-funding-section__heading">Top Funding Sources</h3>
          <p className="cse-agy-funding-section__period">Reporting period: {funding.reportingPeriod}</p>
          <ul className="cse-agy-funding-list">
            {funding.topSources.map((s) => (
              <li key={s.key}>
                <span>{s.label}</span>
                <strong>{s.amount}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="cse-card">
          <h3 className="cse-agy-funding-section__heading">Funding by Program</h3>
          <ul className="cse-agy-funding-list">
            {funding.byProgram.map((p) => (
              <li key={p.key}>
                <span>{p.label}</span>
                <strong>{p.amount}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="cse-card">
          <h3 className="cse-agy-funding-section__heading">Funding by County</h3>
          <ul className="cse-agy-funding-list">
            {funding.byCounty.map((c) => (
              <li key={c.key}>
                <span>{c.label}</span>
                <strong>{c.amount}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="cse-card" aria-labelledby="cse-agy-lineage-heading">
        <div className="cse-ftm__head">
          <span className="cse-ftm__head-icon" aria-hidden="true">
            <ExplorerIcon name="bank" />
          </span>
          <div className="cse-ftm__head-text">
            <h3 id="cse-agy-lineage-heading">How funding flows through this agency</h3>
            <p>From a federal or state source to a verified outcome.</p>
          </div>
          <span className="cse-ftm__head-arrow" aria-hidden="true">
            <ExplorerIcon name="arrowRight" />
          </span>
        </div>

        <ol className="cse-ftm__flow" aria-label={`${agency.name} funding lineage stages (illustrative)`}>
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
      </section>
    </div>
  );
}
