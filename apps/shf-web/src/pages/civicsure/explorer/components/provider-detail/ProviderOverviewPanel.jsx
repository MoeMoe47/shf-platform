// ProviderOverviewPanel.jsx — Overview tab: a plain-English fact
// sheet on the left (mission + organization facts), Assurance Status
// on the right. DEMO / FRAME DATA (see ../../providerDetailMockData.js).
import React from "react";
import ProviderAssuranceStatus from "./ProviderAssuranceStatus.jsx";

export default function ProviderOverviewPanel({ provider, onNavigateTab }) {
  return (
    <div className="cse-pvd-overview" role="tabpanel" id="cse-pvd-tabpanel-overview" aria-labelledby="cse-pvd-tab-overview">
      <div className="cse-pvd-overview__main">
        <section className="cse-card cse-pvd-facts">
          <h2 className="cse-pvd-facts__heading">Provider Overview</h2>

          <dl className="cse-pvd-facts__grid">
            <div>
              <dt>Organization type</dt>
              <dd>{provider.orgType}</dd>
            </div>
            <div>
              <dt>Headquarters</dt>
              <dd>{provider.headquarters}</dd>
            </div>
            <div>
              <dt>Service areas</dt>
              <dd>{provider.serviceAreas}</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>{provider.website}</dd>
            </div>
            <div>
              <dt>Year established</dt>
              <dd>{provider.yearEstablished}</dd>
            </div>
          </dl>

          <div className="cse-pvd-facts__mission">
            <h3>Mission</h3>
            <p>{provider.mission}</p>
          </div>
        </section>
      </div>

      <div className="cse-pvd-overview__side">
        <ProviderAssuranceStatus provider={provider} onNavigateTab={onNavigateTab} />
      </div>
    </div>
  );
}
