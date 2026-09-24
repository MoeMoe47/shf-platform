import React from "react";
import ShsHeader from "@/components/solutions/ShsHeader.jsx";
import ShsFooter from "@/components/solutions/ShsFooter.jsx";
import "./shs-product-page.css";

const PILLARS = [
  ["Policy", "Codified rules and permissions that define what systems and people are allowed to do."],
  ["Evidence", "Verified, source-linked records that support every claim and decision."],
  ["Security", "Identity, access, and data protections applied consistently across systems."],
  ["Controls", "Approval workflows and checks that keep operations inside defined boundaries."],
  ["Compliance", "Alignment with institutional, funder, and regulatory requirements."],
  ["Auditability", "A complete, reviewable trail of what happened, when, and why."],
];

export default function ShsGovernPage() {
  return (
    <div className="shs-home shs-product-page">
      <ShsHeader />
      <main>
        <section className="shs-product-hero">
          <p className="shs-eyebrow">Solutions &middot; Govern</p>
          <h1>Policy, Evidence &amp; Security</h1>
          <p className="shs-product-sub">
            SHS Govern ensures alignment, compliance, and verified institutional outcomes —
            applying policy, security, and evidence discipline across every SHS solution.
          </p>
          <div className="shs-hero-actions">
            <a className="shs-home-btn shs-home-btn-primary" href="/solutions.html#/contact">
              Work With SHS <span aria-hidden="true">&rarr;</span>
            </a>
            <a className="shs-home-btn shs-home-btn-outline" href="/solutions.html#/home">
              Back to SHS Home
            </a>
          </div>
        </section>

        <section className="shs-section">
          <div className="shs-section-heading">
            <div>
              <p className="shs-eyebrow">The Pillars</p>
              <h2>Governance built into every layer.</h2>
            </div>
          </div>
          <div className="shs-product-grid">
            {PILLARS.map(([title, text]) => (
              <article className="shs-product-card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <ShsFooter />
    </div>
  );
}
