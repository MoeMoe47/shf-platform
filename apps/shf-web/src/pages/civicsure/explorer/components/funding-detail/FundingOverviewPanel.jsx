// FundingOverviewPanel.jsx — Overview tab: funding facts + Key
// Financial Position (with an always-visible plain-English definition
// under every accounting term — the locked CivicSure UX principle,
// see FINANCIAL_TERM_DEFINITIONS in ../../fundingDetailMockData.js)
// and the Data Quality Notice on the left; Assurance Snapshot, Report
// Card, and Geography Panel on the right. DEMO / FRAME DATA (see
// ../../fundingDetailMockData.js).
import React from "react";
import { FINANCIAL_TERM_DEFINITIONS } from "../../fundingDetailMockData.js";
import FundingAssuranceSnapshot from "./FundingAssuranceSnapshot.jsx";
import FundingDataQualityNotice from "./FundingDataQualityNotice.jsx";
import FundingReportCard from "./FundingReportCard.jsx";
import FundingGeographyPanel from "./FundingGeographyPanel.jsx";

function FinancialTerm({ label, termKey, value }) {
  return (
    <div className="cse-fnd-financial-term">
      <div className="cse-fnd-financial-term__row">
        <span className="cse-fnd-financial-term__label">{label}</span>
        <span className="cse-fnd-financial-term__value">{value}</span>
      </div>
      <p className="cse-fnd-financial-term__definition">{FINANCIAL_TERM_DEFINITIONS[termKey]}</p>
    </div>
  );
}

export default function FundingOverviewPanel({ funding }) {
  const { overview } = funding;

  return (
    <div className="cse-fnd-overview" role="tabpanel" id="cse-fnd-tabpanel-overview" aria-labelledby="cse-fnd-tab-overview">
      <div className="cse-fnd-overview__main">
        <section className="cse-card cse-fnd-facts">
          <h2 className="cse-fnd-facts__heading">Funding Overview</h2>
          <dl className="cse-fnd-facts__grid">
            <div>
              <dt>Funding source</dt>
              <dd>{overview.fundingSource}</dd>
            </div>
            <div>
              <dt>Funding type</dt>
              <dd>{overview.fundingType}</dd>
            </div>
            <div>
              <dt>Authorization period</dt>
              <dd>{overview.authorizationPeriod}</dd>
            </div>
            <div>
              <dt>Reporting period</dt>
              <dd>{overview.reportingPeriod}</dd>
            </div>
            <div>
              <dt>Geographic scope</dt>
              <dd>{overview.geographicScope}</dd>
            </div>
            <div>
              <dt>Administering agency</dt>
              <dd>{overview.administeringAgency}</dd>
            </div>
          </dl>

          <div className="cse-fnd-facts__purpose">
            <h3>Purpose</h3>
            <p>{overview.purpose}</p>
          </div>
        </section>

        <section className="cse-card cse-fnd-financial-position">
          <h2 className="cse-fnd-financial-position__heading">Key Financial Position</h2>
          <FinancialTerm label="Authorized" termKey="authorized" value={overview.financialPosition.authorized} />
          <FinancialTerm label="Awarded" termKey="awarded" value={overview.financialPosition.awarded} />
          <FinancialTerm label="Obligated" termKey="obligated" value={overview.financialPosition.obligated} />
          <FinancialTerm label="Expended" termKey="expended" value={overview.financialPosition.expended} />
          <FinancialTerm label="Unawarded" termKey="remaining" value={overview.financialPosition.unawarded} />
          <FinancialTerm label="Unspent obligated" termKey="remaining" value={overview.financialPosition.unspentObligated} />
        </section>

        <FundingDataQualityNotice notice={funding.dataQualityNotice} />
      </div>

      <div className="cse-fnd-overview__side">
        <FundingAssuranceSnapshot funding={funding} />
        <FundingReportCard report={funding.report} />
        <FundingGeographyPanel geography={funding.geography} />
      </div>
    </div>
  );
}
