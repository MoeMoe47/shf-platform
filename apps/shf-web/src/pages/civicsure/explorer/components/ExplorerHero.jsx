// ExplorerHero.jsx — split hero: readable left copy over a pale wash,
// Columbus downtown photo on the right with a live text overlay (not
// baked into the image — see docs/ui/CIVICSURE_EXPLORER_FRAME.md).
import React from "react";

export default function ExplorerHero() {
  return (
    <section className="cse-hero" aria-labelledby="cse-hero-heading">
      <div className="cse-hero__grid">
        <div className="cse-hero__copy">
          <p className="cse-eyebrow">Explore Real Impact</p>
          <h1 id="cse-hero-heading" className="cse-hero__heading cse-serif">
            A clear view of public programs and proven results.
          </h1>
          <p className="cse-hero__body">
            Explore how public funds are used, what gets delivered, and the outcomes that matter — with
            verified data you can trust.
          </p>
        </div>

        <div className="cse-hero__visual">
          {/* Decorative Columbus, OH downtown photo — no information
              depends on it; the same message is also live text below. */}
          <img
            className="cse-hero__bg"
            src="/assets/civicsure/explorer/civicsure-columbus-downtown-hero-v2.png"
            alt=""
            aria-hidden="true"
          />
          <div className="cse-hero__scrim" aria-hidden="true" />
          <div className="cse-hero__overlay-copy">
            <p className="cse-hero__overlay-heading">
              Transparent government.
              <br />
              Stronger communities.
            </p>
            <hr className="cse-hero__overlay-rule" />
            <p className="cse-hero__overlay-micro">
              Real data.
              <br />
              Real progress.
              <br />
              A stronger tomorrow.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
