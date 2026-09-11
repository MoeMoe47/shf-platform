// src/components/curriculum/CurriculumFooter.jsx
//
// Shared SHF Curriculum Footer — rendered once by CurriculumLayout.jsx so
// every Curriculum route inherits it automatically (never duplicated per
// page). Institutional in-app footer, not a public marketing footer: no
// social icons, newsletter signup, donor CTA, or mission-statement copy —
// matches the approved footer mock exactly.
//
// Link honesty: "Curriculum" (dashboard), "Accessibility", "Live
// Sessions", and "Help" all resolve to real, already-registered routes
// (see src/router/CurriculumRoutes.jsx). "Career Center" is a real,
// existing cross-app link (src/router/paths.js's href.career()). "Privacy",
// "Terms", and "Report an issue" have no real destination anywhere in this
// repo (checked: no Privacy/Terms page or route exists in any app; even
// Foundation's own footer's "Privacy Policy" link points at a route that
// doesn't resolve to anything). Per the explicit "do not fabricate
// destinations" instruction, these render as plain, non-interactive,
// visibly de-emphasized labels — not fake links — rather than routing
// anywhere.
import React from "react";
import { Link } from "react-router-dom";
import { href } from "@/router/paths.js";
import { HeartMark, ChevronUpIcon } from "@/components/curriculum/icons.jsx";

const NOT_YET_AVAILABLE = ["Privacy", "Terms", "Report an issue"];

function FooterLink({ to, external, children }) {
  if (external) {
    return (
      <a className="ld-footerLink" href={to}>
        {children}
      </a>
    );
  }
  return (
    <Link className="ld-footerLink" to={to}>
      {children}
    </Link>
  );
}

export default function CurriculumFooter() {
  function handleBackToTop() {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    // Same focus-management pattern this shell's own skip link uses —
    // #curriculum-main is already a real, existing tabIndex={-1} landmark
    // (see CurriculumLayout.jsx), not a new affordance invented here.
    document.getElementById("curriculum-main")?.focus({ preventScroll: true });
  }

  return (
    <footer className="ld-footer" aria-label="Curriculum footer">
      <div className="ld-footerInner">
        <div className="ld-footerPrimary">
          <div className="ld-footerBrand">
            <span className="ld-footerBrandMark" aria-hidden="true">
              <HeartMark size={24} />
            </span>
            <div>
              <p className="ld-footerBrandName">Silicon Heartland Foundation</p>
              <p className="ld-footerTagline">Learning pathways &bull; Student support &bull; Career readiness</p>
            </div>
          </div>

          <nav className="ld-footerNav" aria-label="Curriculum links">
            <FooterLink to="/curriculum/asl/dashboard">Curriculum</FooterLink>
            <FooterLink to="/curriculum/accessibility">Accessibility</FooterLink>
            <FooterLink to="/curriculum/live-sessions">Live Sessions</FooterLink>
            <FooterLink to={href.career("/")} external>Career Center</FooterLink>
          </nav>

          <nav className="ld-footerNav" aria-label="Support links">
            <FooterLink to="/curriculum/help">Help</FooterLink>
            {NOT_YET_AVAILABLE.map((label) => (
              <span key={label} className="ld-footerLink is-unavailable" title="Not yet available">
                {label}
              </span>
            ))}
          </nav>
        </div>

        <div className="ld-footerSecondary">
          <p className="ld-footerCopyright">&copy; {new Date().getFullYear()} Silicon Heartland Foundation</p>
          <button type="button" className="ld-footerBackToTop" onClick={handleBackToTop} aria-label="Back to top">
            <span aria-hidden="true">Back to top</span>
            <ChevronUpIcon size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
