import React from "react";

export default function FoundationDonationHero() {
  return (
    <section className="shf-donation-hero" aria-labelledby="donation-title">
      <img
        className="shf-donation-hero__image"
        data-photo-slot="hero"
        data-photo-status="owner-approved"
        src="/assets/foundation/donation/donation-hero.webp"
        alt="Student looking toward a city skyline at sunset"
        fetchPriority="high"
      />
      <div className="shf-donation-shell shf-donation-hero__inner">
        <div className="shf-donation-hero__copy">
          <p className="shf-donation-eyebrow">SUPPORT SHF</p>
          <h1 id="donation-title">
            Invest in People.
            <br />
            Build Brighter
            <br />
            Tomorrows.
          </h1>
          <p>
            Your support helps expand education, workforce development,
            technology, and career opportunity for individuals and communities
            across Ohio and the Midwest.
          </p>
        </div>
        <p className="shf-donation-handwritten">
          OPPORTUNITY
          <br />
          CHANGES
          <br />
          LIVES.
        </p>
      </div>
    </section>
  );
}
