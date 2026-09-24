import React from "react";
import ShsHeader from "@/components/solutions/ShsHeader.jsx";
import ShsFooter from "@/components/solutions/ShsFooter.jsx";
import "./shs-product-page.css";

const PRINCIPLES = [
  ["Governed by Design", "Every agent operates inside defined policy boundaries — no unsupervised or open-ended action."],
  ["Human Oversight", "Institutional reviewers and approval workflows sit in the loop for consequential decisions."],
  ["Secure Inputs", "Agent access to data and systems is scoped, logged, and auditable."],
  ["Defined Agent Boundaries", "Each agent is built for a specific operational role, not general-purpose autonomy."],
];

export default function ShsAIWorkforcePage() {
  return (
    <div className="shs-home shs-product-page">
      <ShsHeader />
      <main>
        <section className="shs-product-hero">
          <p className="shs-eyebrow">Solutions &middot; AI Workforce</p>
          <h1>Governed AI &amp; Agents</h1>
          <p className="shs-product-sub">
            SHS AI Workforce brings governed AI agents into institutional operations —
            orchestrated, policy-controlled, and overseen, so organizations can put automation to
            work without giving up accountability.
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
              <p className="shs-eyebrow">How It's Governed</p>
              <h2>Oversight built in, not bolted on.</h2>
            </div>
          </div>
          <div className="shs-product-grid">
            {PRINCIPLES.map(([title, text]) => (
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
