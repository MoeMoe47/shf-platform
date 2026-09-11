// AgencyOverviewPanel.jsx — Overview tab: agency facts + mission +
// Responsibilities (plain-English, each with a one-line explanation —
// "do not use internal bureaucratic language without explanation") +
// Data Quality Notice on the left; Assurance Snapshot, Geography, and
// Funding Sources on the right. DEMO / FRAME DATA (see
// ../../agencyDetailMockData.js).
import React from "react";
import AgencyAssuranceSnapshot from "./AgencyAssuranceSnapshot.jsx";
import AgencyDataQualityNotice from "./AgencyDataQualityNotice.jsx";
import AgencyGeographyPanel from "./AgencyGeographyPanel.jsx";
import AgencyFundingSourcesPanel from "./AgencyFundingSourcesPanel.jsx";

export default function AgencyOverviewPanel({ agency }) {
  const { overview } = agency;

  return (
    <div className="cse-agy-overview" role="tabpanel" id="cse-agy-tabpanel-overview" aria-labelledby="cse-agy-tab-overview">
      <div className="cse-agy-overview__main">
        <section className="cse-card cse-agy-facts">
          <h2 className="cse-agy-facts__heading">Agency Overview</h2>
          <dl className="cse-agy-facts__grid">
            <div>
              <dt>Agency type</dt>
              <dd>{overview.agencyType}</dd>
            </div>
            <div>
              <dt>Jurisdiction</dt>
              <dd>{overview.jurisdiction}</dd>
            </div>
            <div>
              <dt>Headquarters</dt>
              <dd>{overview.headquarters}</dd>
            </div>
            <div>
              <dt>Established</dt>
              <dd>{overview.established}</dd>
            </div>
            <div>
              <dt>Reporting period</dt>
              <dd>{overview.reportingPeriod}</dd>
            </div>
          </dl>

          <div className="cse-agy-facts__mission">
            <h3>Mission</h3>
            <p>{overview.mission}</p>
          </div>
        </section>

        <section className="cse-card cse-agy-responsibilities">
          <h2 className="cse-agy-responsibilities__heading">Responsibilities</h2>
          <div className="cse-agy-responsibilities__grid">
            {overview.responsibilities.map((r) => (
              <div className="cse-agy-responsibility" key={r.key}>
                <h3>{r.label}</h3>
                <p>{r.description}</p>
              </div>
            ))}
          </div>
        </section>

        <AgencyDataQualityNotice notice={agency.dataQualityNotice} />
      </div>

      <div className="cse-agy-overview__side">
        <AgencyAssuranceSnapshot agency={agency} />
        <AgencyGeographyPanel geography={agency.geography} />
        <AgencyFundingSourcesPanel sources={agency.funding.topSources} />
      </div>
    </div>
  );
}
