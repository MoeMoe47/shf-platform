import React from "react";
import "./shs-footer.css";

const NAV_LINKS = [
  { label: "About", href: "/solutions.html#/team" },
  { label: "Solutions", href: "#solutions" },
  { label: "Industries", href: "#industries" },
  { label: "Our Work", href: "#our-work" },
  { label: "Technology", href: "#capabilities" },
  { label: "Resources", href: "#resources" },
  { label: "News", href: "/solutions.html#/transparency" },
  { label: "Contact", href: "/solutions.html#/contact" },
];

const SOCIAL = [
  { label: "LinkedIn", glyph: "in" },
  { label: "YouTube", glyph: "▶" },
  { label: "X", glyph: "X" },
];

export default function ShsFooter() {
  return (
    <footer className="shs-footer">
      <div className="shs-footer-row">
        <a href="/solutions.html#/home" className="shs-footer-brand" aria-label="Silicon Heartland Systems home">
          <img src="/assets/shs/shs-orbiter-logo.png" alt="" width="30" height="30" />
          <span>
            <strong>SILICON HEARTLAND</strong>
            <em>SYSTEMS</em>
          </span>
        </a>

        <nav className="shs-footer-nav" aria-label="Footer">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="shs-footer-social" aria-label="Social links (not yet configured)">
          {SOCIAL.map((item) => (
            <span key={item.label} className="shs-footer-social-item" aria-disabled="true" title={`${item.label} — not yet configured`}>
              {item.glyph}
            </span>
          ))}
        </div>
      </div>

      <div className="shs-footer-bottom">
        <span>Technology &middot; Infrastructure &middot; Operational Solutions</span>
        <span>&copy; {new Date().getFullYear()} Silicon Heartland Systems. All rights reserved.</span>
      </div>
    </footer>
  );
}
