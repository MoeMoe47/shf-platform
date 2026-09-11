// ProviderIdentityPanel.jsx — hero identity card: logo/building image
// placeholder + a compact fact strip (type, headquarters, service
// area, website, year established) + mission statement. Visible on
// every tab (not just Overview), same idea as a masthead. DEMO / FRAME
// DATA (see ../../providerDetailMockData.js). The website is rendered
// as plain text, not a hyperlink — it's a fabricated demo domain, not
// a real destination, so it should never look clickable.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function ProviderIdentityPanel({ provider }) {
  return (
    <section className="cse-card cse-pvd-hero" aria-label="Provider identity">
      <div className="cse-pvd-hero__image" aria-hidden="true">
        <ExplorerIcon name={provider.heroIcon} />
      </div>

      <div className="cse-pvd-hero__body">
        <dl className="cse-pvd-hero__facts">
          <div>
            <dt>Organization Type</dt>
            <dd>{provider.orgType}</dd>
          </div>
          <div>
            <dt>Headquarters</dt>
            <dd>{provider.headquarters}</dd>
          </div>
          <div>
            <dt>Service Area</dt>
            <dd>{provider.serviceAreas}</dd>
          </div>
          <div>
            <dt>Website</dt>
            <dd>{provider.website}</dd>
          </div>
          <div>
            <dt>Year Established</dt>
            <dd>{provider.yearEstablished}</dd>
          </div>
        </dl>

        <p className="cse-pvd-hero__mission">
          <strong>Mission: </strong>
          {provider.mission}
        </p>
      </div>
    </section>
  );
}
