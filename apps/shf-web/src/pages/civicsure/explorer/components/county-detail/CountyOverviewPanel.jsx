// CountyOverviewPanel.jsx — Overview tab: county facts, plain-English
// program landscape summary, and a restrained category distribution
// on the left; the county map and assurance snapshot on the right.
// DEMO / FRAME DATA (see ../../countyDetailMockData.js). Category
// distribution is simple CSS bars — no chart library.
import React from "react";
import CountyMapPanel from "./CountyMapPanel.jsx";
import CountyAssuranceSnapshot from "./CountyAssuranceSnapshot.jsx";

export default function CountyOverviewPanel({ county, onNavigateTab }) {
  const { overview } = county;
  const maxCategoryCount = Math.max(...overview.categories.map((c) => c.count));

  return (
    <div className="cse-cty-overview" role="tabpanel" id="cse-cty-tabpanel-overview" aria-labelledby="cse-cty-tab-overview">
      <div className="cse-cty-overview__main">
        <section className="cse-card cse-cty-facts">
          <h2 className="cse-cty-facts__heading">County Overview</h2>
          <dl className="cse-cty-facts__grid">
            <div>
              <dt>Population</dt>
              <dd>{overview.population}</dd>
            </div>
            <div>
              <dt>County seat</dt>
              <dd>{overview.countySeat}</dd>
            </div>
            <div>
              <dt>Region</dt>
              <dd>{overview.region}</dd>
            </div>
            <div>
              <dt>Reporting period</dt>
              <dd>{overview.reportingPeriod}</dd>
            </div>
            <div>
              <dt>Programs tracked</dt>
              <dd>{overview.programsTracked}</dd>
            </div>
            <div>
              <dt>Providers</dt>
              <dd>{overview.providersCount}</dd>
            </div>
          </dl>
        </section>

        <section className="cse-card cse-cty-landscape">
          <h2 className="cse-cty-landscape__heading">Public Program Landscape</h2>
          <p className="cse-cty-landscape__body">{overview.landscapeSummary}</p>
        </section>

        <section className="cse-card cse-cty-categories">
          <h2 className="cse-cty-categories__heading">Program Categories</h2>
          <ul className="cse-cty-categories__list">
            {overview.categories.map((cat) => (
              <li key={cat.key} className="cse-cty-categories__row">
                <span className="cse-cty-categories__label">{cat.label}</span>
                <span className="cse-cty-categories__bar-track">
                  <span
                    className="cse-cty-categories__bar-fill"
                    style={{ width: `${Math.round((cat.count / maxCategoryCount) * 100)}%` }}
                  />
                </span>
                <span className="cse-cty-categories__count">{cat.count} programs</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="cse-cty-overview__side">
        <CountyMapPanel county={county} />
        <CountyAssuranceSnapshot county={county} onNavigateTab={onNavigateTab} />
      </div>
    </div>
  );
}
