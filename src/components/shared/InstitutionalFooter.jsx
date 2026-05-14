import React from "react";
import "./institutional-footer.css";

export default function InstitutionalFooter({
  brandName = "Silicon Heartland Solutions",
  subtitle = "Infrastructure for verified outcomes, coordination, reporting, and institutional operations.",
  version = "Growth Engine V2C",
  env = "Local / Development",
  logoSrc = "/assets/shs/shs-logo-mark.svg",
}) {
  return (
    <footer className="institutional-footer">
      <div className="institutional-footer__glow" />

      <div className="institutional-footer__inner">
        <section className="institutional-footer__brand">
          <div className="institutional-footer__brandRow">
            <img
              src={logoSrc}
              alt="Silicon Heartland Solutions logo"
              className="institutional-footer__logo"
            />
            <div>
              <h3>{brandName}</h3>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="institutional-footer__badges">
            <span>Secure Infrastructure</span>
            <span>Audit Ready</span>
            <span>Institutional Reporting</span>
            <span>Adaptive Growth Intelligence</span>
          </div>
        </section>

        <nav className="institutional-footer__links" aria-label="Institutional footer links">
          <div className="institutional-footer__column">
            <h4>Growth</h4>
            <a href="admin.html#/growth">Growth Engine</a>
            <a href="admin.html#/hub/referrals">Referrals</a>
            <a href="admin.html#/hub">Hub Network</a>
            <a href="admin.html#/hub/reports">Hub Reports</a>
          </div>

          <div className="institutional-footer__column">
            <h4>Infrastructure</h4>
            <a href="capital.html#/exchange/command">Command Surface</a>
            <a href="admin.html#/aggregation">Aggregation</a>
            <a href="admin.html#/verification-audit">Verification</a>
            <a href="admin.html#/reporting">Reporting</a>
          </div>

          <div className="institutional-footer__column">
            <h4>Trust Layer</h4>
            <a href="admin.html#/audit">Audit Ledger</a>
            <a href="admin.html#/identity">Identity</a>
            <a href="admin.html#/imports">Files & Imports</a>
            <a href="admin.html#/alignment">Alignment</a>
          </div>
        </nav>

        <section className="institutional-footer__meta">
          <div className="institutional-footer__metaCard">
            <span className="institutional-footer__metaLabel">Version</span>
            <strong>{version}</strong>
          </div>

          <div className="institutional-footer__metaCard">
            <span className="institutional-footer__metaLabel">Environment</span>
            <strong>{env}</strong>
          </div>

          <div className="institutional-footer__metaCard">
            <span className="institutional-footer__metaLabel">Status</span>
            <strong className="is-live">Operational</strong>
          </div>

          <div className="institutional-footer__copyright">
            © 2026 Silicon Heartland Solutions
          </div>
        </section>
      </div>
    </footer>
  );
}
