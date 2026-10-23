import React from "react";
import Icon from "./FoundationDonationIcon.jsx";

export default function FoundationGiftImpact() {
  return (
    <section
      id="where-it-goes"
      tabIndex={-1}
      className="shf-gift-impact"
      aria-labelledby="gift-impact-title"
    >
      <div className="shf-gift-impact__visual">
        <img
          className="shf-gift-impact__image"
          data-photo-slot="gift-impact"
          data-photo-status="owner-approved"
          src="/assets/foundation/donation/donation-impact-banner.webp"
          alt="Four young people overlooking a sunset city skyline. Real skills. Real people. Real impact. Opportunity changes lives."
          loading="lazy"
        />
        <p className="shf-donation-sr-only">
          REAL
          <br />
          SUPPORT.
          <br />
          REAL
          <br />
          OPPORTUNITY.
        </p>
      </div>
      <div className="shf-gift-impact__copy">
        <p className="shf-donation-eyebrow">WHERE YOUR GIFT GOES</p>
        <h2 id="gift-impact-title">Focused on Lasting Impact.</h2>
        <p>
          Your support helps fund programs, resources, and community initiatives
          that create real education and workforce opportunities.
        </p>
        <a className="shf-donation-outline" href="#impact">
          Our Impact <Icon name="arrow" />
        </a>
      </div>
      <ul aria-label="Impact and support categories">
        {[
          "Education & Youth Programs",
          "Workforce Development",
          "Technology & Innovation",
          "Inclusive Learning",
          "Community Initiatives",
          "Program Support & Operations",
        ].map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </section>
  );
}
