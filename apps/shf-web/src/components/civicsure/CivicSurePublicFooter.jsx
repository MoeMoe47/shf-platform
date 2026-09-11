// apps/shf-web/src/components/civicsure/CivicSurePublicFooter.jsx
//
// Reusable public-facing footer for CivicSure's citizen-facing surfaces
// (Explorer today; intended for future public pages too — hence the
// generic name and the fact this file has no Explorer-specific
// imports/logic). Deliberately separate from CivicSureShell.jsx (the
// internal operator console chrome), same precedent as
// CivicSurePublicNav.jsx.
//
// Frame/visual only: the newsletter form preventDefault()s on submit
// (no email provider wired, no fake success state), and every nav
// link either points to the one real public route (#/explorer) or
// renders as an inert, visually-identical placeholder when no real
// destination exists yet — never a fabricated route.
import React from "react";

const EXPLORE_LINKS = ["Programs", "Funding", "Providers", "Outcomes", "Evidence", "Geography"];
const LEARN_LINKS = ["Overview", "How It Works", "Reports", "For Government", "Public Trust"];
const RESOURCES_LINKS = ["Help Center", "Data Sources", "Methodology", "About This Data", "FAQs", "Contact"];
const LEGAL_LINKS = ["Terms of Use", "Privacy Policy", "Data Governance", "Accessibility", "Open Data", "Responsible Use"];

// Real, working destination — every Explore item corresponds to a
// category on the one live public page. Not deep-linked to a specific
// category tab (that's local UI state, not a route), but never a dead
// or fabricated link either.
function FooterNavLink({ label }) {
  return (
    <li>
      <a href="#/explorer">{label}</a>
    </li>
  );
}

// No real destination exists yet for these — rendered visually
// identical to a link but inert (aria-disabled, no navigation), so
// the footer looks complete without pretending a page exists.
function FooterPlaceholderLink({ label }) {
  return (
    <li>
      <span className="csf-link--placeholder" aria-disabled="true" title="Coming soon">
        {label}
      </span>
    </li>
  );
}

function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 3.2 19 6v5.3c0 4.8-3 7.8-7 8.5-4-.7-7-3.7-7-8.5V6l7-2.8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 3.2v16.6" stroke="currentColor" strokeWidth="1.6" opacity="0.35" />
      <path d="M9.3 12.4l2 2 3.4-3.7" stroke="var(--cse-success, #15804a)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4.5 7 12 12.5 19.5 7" />
    </svg>
  );
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 10.5v6M8 7.8v.01M12 16.5v-3.7c0-1.3.9-2.3 2.2-2.3 1.2 0 2 .9 2 2.2v3.8" />
    </svg>
  );
}

function YouTubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="6" width="18" height="12" rx="3.5" />
      <path d="M10.5 9.8v4.4l4-2.2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}

// A simplified Ohio state outline — decorative, not surveyed/precise.
function OhioIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M5 4.5 9 5l1 2 2.5-.5.5 2 2-1 1.5 1.5-1 2 2 1-1 2.5 1.5 2-2 1.5-3-.5-1 2-3-1-1 1.5-3-1-1-2.5 1.5-2-2-2 1.5-2.5L5 8z" />
    </svg>
  );
}

export default function CivicSurePublicFooter() {
  return (
    <footer className="civicsure-public-footer csf-footer">
      {/* ---------------------------- Skyline banner ---------------------------- */}
      <div className="csf-skyline">
        <img
          className="csf-skyline__bg"
          src="/assets/civicsure/footer/civicsure-columbus-footer-skyline.png"
          alt=""
          aria-hidden="true"
        />
        <div className="csf-skyline__scrim" aria-hidden="true" />
        <div className="csf-skyline__content">
          <div className="csf-skyline__left">
            <h2 className="csf-skyline__heading">
              A stronger
              <br />
              Ohio starts with
              <br />
              open data.
            </h2>
            <hr className="csf-skyline__rule" />
            <p className="csf-skyline__body">
              Real data. Real progress.
              <br />
              Stronger communities.
            </p>
          </div>
          <div className="csf-skyline__right">
            <p className="csf-skyline__micro-heading">Columbus, Ohio</p>
            <p className="csf-skyline__micro-body">
              A safer,
              <br />
              stronger,
              <br />
              more transparent
              <br />
              tomorrow.
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------- Footer body ---------------------------- */}
      <div className="csf-body">
        <div className="csf-container csf-grid">
          <div className="csf-brand-col">
            <div className="csf-brand">
              <ShieldIcon className="csf-brand__icon" />
              <div className="csf-brand__text">
                <span className="csf-brand__wordmark">CivicSure</span>
                <span className="csf-brand__tagline">Public Trust. Proven.</span>
              </div>
            </div>
            <p className="csf-mission">
              CivicSure brings clarity to public programs, funding, and outcomes — so every community can
              see what works and build a stronger tomorrow.
            </p>

            <hr className="csf-divider" />

            <div className="csf-newsletter">
              <h3>Stay Informed</h3>
              <p>Get updates on new data, features, and public insights.</p>
              <form className="csf-newsletter__form" onSubmit={(e) => e.preventDefault()}>
                <span className="csf-newsletter__icon">
                  <MailIcon />
                </span>
                <label htmlFor="csf-newsletter-email" className="csf-visually-hidden">
                  Email address
                </label>
                <input id="csf-newsletter-email" type="email" placeholder="Enter your email address" autoComplete="email" />
                <button type="submit" className="csf-btn csf-btn--primary">
                  Subscribe
                </button>
              </form>
              <p className="csf-newsletter__privacy">We respect your privacy. No spam. Unsubscribe anytime.</p>
            </div>
          </div>

          <nav className="csf-col" aria-labelledby="csf-col-explore">
            <h3 id="csf-col-explore">Explore</h3>
            <ul>
              {EXPLORE_LINKS.map((label) => (
                <FooterNavLink label={label} key={label} />
              ))}
            </ul>
          </nav>

          <nav className="csf-col" aria-labelledby="csf-col-learn">
            <h3 id="csf-col-learn">Learn</h3>
            <ul>
              {LEARN_LINKS.map((label) => (
                <FooterPlaceholderLink label={label} key={label} />
              ))}
            </ul>
          </nav>

          <nav className="csf-col" aria-labelledby="csf-col-resources">
            <h3 id="csf-col-resources">Resources</h3>
            <ul>
              {RESOURCES_LINKS.map((label) => (
                <FooterPlaceholderLink label={label} key={label} />
              ))}
            </ul>
          </nav>

          <nav className="csf-col" aria-labelledby="csf-col-legal">
            <h3 id="csf-col-legal">Legal</h3>
            <ul>
              {LEGAL_LINKS.map((label) => (
                <FooterPlaceholderLink label={label} key={label} />
              ))}
            </ul>
          </nav>
        </div>

        <hr className="csf-container csf-bottom-divider" />

        <div className="csf-container csf-bottom">
          <div className="csf-bottom__left">
            <p>© 2026 CivicSure. All rights reserved.</p>
            <p>Built for stronger communities, starting with Columbus, Ohio.</p>
          </div>

          <div className="csf-bottom__right">
            <div className="csf-social">
              <a href="#/explorer" aria-label="CivicSure on LinkedIn">
                <LinkedInIcon />
              </a>
              <a href="#/explorer" aria-label="CivicSure on YouTube">
                <YouTubeIcon />
              </a>
              <a href="#/explorer" aria-label="CivicSure on X">
                <XIcon />
              </a>
            </div>
            <span className="csf-bottom__rule" aria-hidden="true" />
            <div className="csf-ohio">
              <OhioIcon className="csf-ohio__icon" />
              <p>
                A safer, stronger,
                <br />
                more transparent Ohio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
