import React, { useState } from "react";
import FoundationDonationHero from "../components/FoundationDonationHero.jsx";
import FoundationDonationNav from "../components/FoundationDonationNav.jsx";
import FoundationGiftSelector from "../components/FoundationGiftSelector.jsx";
import FoundationSupportImpactPanel from "../components/FoundationSupportImpactPanel.jsx";
import FoundationWaysToGive from "../components/FoundationWaysToGive.jsx";
import FoundationGiftImpact from "../components/FoundationGiftImpact.jsx";
import FoundationTransparency from "../components/FoundationTransparency.jsx";
import FoundationDonationDialog from "../components/FoundationDonationDialog.jsx";
import "../styles/foundation-donation.css";

export default function Donation() {
  const [preview, setPreview] = useState(null);
  return (
    <div className="shf-donation-page">
      <FoundationDonationHero />
      <FoundationDonationNav />
      <section
        id="make-a-gift"
        tabIndex={-1}
        className="shf-donation-gift shf-donation-shell"
        aria-labelledby="gift-title"
      >
        <div>
          <p className="shf-donation-eyebrow">MAKE A DIFFERENCE</p>
          <h2 id="gift-title">Choose Your Impact.</h2>
          <p>
            Every gift helps remove barriers, expand opportunity, and create
            stronger, more inclusive communities.
          </p>
          <FoundationGiftSelector onPreview={setPreview} />
        </div>
        <FoundationSupportImpactPanel />
      </section>
      <FoundationWaysToGive onPreview={setPreview} />
      <FoundationGiftImpact />
      <FoundationTransparency onPreview={setPreview} />
      <FoundationDonationDialog
        content={preview}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}
