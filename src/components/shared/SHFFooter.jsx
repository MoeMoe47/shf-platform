// src/components/shared/SHFFooter.jsx
//
// Canonical Silicon Heartland Foundation footer, shared by the Curriculum
// and Career applications (see src/layouts/CurriculumLayout.jsx and
// src/layouts/CareerLayout.jsx). One component, one stylesheet
// (./shf-footer.css) — replaces the app-specific
// src/components/curriculum/CurriculumFooter.jsx (left in place, unused,
// rather than deleted) so a future third app can adopt the same footer by
// adding a `variant` below instead of forking a new implementation.
//
// Link honesty (carried forward from CurriculumFooter.jsx, which this
// component supersedes): every link below resolves to a real, already
// -registered route (see src/router/CurriculumRoutes.jsx /
// src/router/CareerRoutes.jsx / src/router/paths.js for the cross-app
// href.career()/href.curriculum() helpers). Destinations with no real
// route anywhere in the repo (Privacy Policy, Terms of Use, Report an
// Issue, Contact Support — checked: no such page/route exists in either
// app) are omitted entirely rather than shown as disabled/faded fake
// links. The one real piece of contact data available for these two apps
// is the org's canonical email, info@siliconheartland.org (used
// identically in src/foundation/pages/About.jsx, Mission.jsx,
// FoundationMissionPage.jsx) — surfaced as a real mailto: link, not a
// fabricated phone/address like FoundationFooter.jsx's placeholder data.
import React from "react";
import { Link } from "react-router-dom";
import { href } from "@/router/paths.js";
import footerLandscapeLight from "@/assets/brand/shf-footer-landscape-light.webp";
import footerLandscapeDark from "@/assets/brand/shf-footer-landscape-dark.webp";
import "./shf-footer.css";

function HeartMark({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.5s-7.5-4.6-10-9.6C.4 7 2.6 3.5 6.3 3.5c2.1 0 3.7 1.1 5.7 3.4C14 4.6 15.6 3.5 17.7 3.5 21.4 3.5 23.6 7 22 10.9c-2.5 5-10 9.6-10 9.6Z" />
    </svg>
  );
}

// Approved Heartland landscape artwork (fields, barn, silo, trees, bridge,
// city skyline, windmill), extracted directly from the approved reference
// footer mockups (light + dark) rather than redrawn — see
// docs note in the correction report: no isolated source asset existed
// anywhere in the repo, only the composed reference screenshots, so the
// illustration band was cropped from those exact images. Two real assets
// (one per theme, matching the reference's own light/dark treatments)
// live at src/assets/brand/shf-footer-landscape-{light,dark}.webp. CSS
// below shows/hides the correct one per the app's existing data-theme
// mechanism; geometry is untouched, only visibility switches.
function HeartlandLandscape() {
  return (
    <div className="shf-footerLandscape" aria-hidden="true">
      <img src={footerLandscapeLight} alt="" className="shf-footerLandscape__img shf-footerLandscape__img--light" />
      <img src={footerLandscapeDark} alt="" className="shf-footerLandscape__img shf-footerLandscape__img--dark" />
    </div>
  );
}

// Real, canonical SHF email only — see CONTACT_EMAIL below. Purely
// decorative envelope glyph, not a stand-in for unverified data.
function MailGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3 6 9 6.5L21 6" />
    </svg>
  );
}

function FooterLink({ to, external, children }) {
  if (external) {
    return (
      <a className="shf-footerLink" href={to}>
        {children}
      </a>
    );
  }
  return (
    <Link className="shf-footerLink" to={to}>
      {children}
    </Link>
  );
}

// Canonical SHF contact email — verified against src/foundation/pages/
// About.jsx, Mission.jsx, and FoundationMissionPage.jsx, where it appears
// identically. There is no real phone number or mailing address for SHF
// anywhere in the repo, so those fields are simply not shown (not
// invented) — see the correction report for the exhaustive search.
const CONTACT_EMAIL = "info@siliconheartland.org";

const VARIANTS = {
  curriculum: {
    homeLabel: "Curriculum",
    homeTo: "/curriculum/asl/dashboard",
    tagline: "Learning pathways • Student support • Career readiness",
    quickLinks: [
      { label: "Dashboard", to: "/curriculum/asl/dashboard" },
      { label: "My Learning", to: "/curriculum/lessons" },
      { label: "Portfolio", to: "/curriculum/asl/portfolio" },
      { label: "Career Center", to: href.career("/dashboard"), external: true },
    ],
    programs: [
      { label: "Live Learning", to: "/curriculum/live-sessions" },
      { label: "Accessibility", to: "/curriculum/accessibility" },
      { label: "Career Pathways", to: href.career("/explore"), external: true },
    ],
    help: [{ label: "Help Center", to: "/curriculum/help" }],
    accessibilityTo: "/curriculum/accessibility",
  },
  career: {
    homeLabel: "Career Center",
    homeTo: "/dashboard",
    tagline: "Career pathways • Resume • Employer connections",
    quickLinks: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Portfolio", to: "/portfolio" },
      { label: "Resume Builder", to: "/resume" },
      { label: "Curriculum", to: href.curriculum("/asl/dashboard"), external: true },
    ],
    programs: [
      { label: "Pathways Explore", to: "/explore" },
      { label: "Career Planner", to: "/planner" },
      { label: "Marketplace", to: "/marketplace" },
    ],
    help: [{ label: "Help Center", to: "/help" }],
    accessibilityTo: null, // no accessibility route registered in CareerRoutes.jsx
  },
  arcade: {
    homeLabel: "Arcade",
    homeTo: "/dashboard",
    tagline: "Learning games • Skill building • Rewards",
    quickLinks: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Classical Arcade Room", to: "/classical-arcade" },
      { label: "Games", to: "/games" },
      { label: "History", to: "/history" },
    ],
    programs: [
      { label: "Leaderboard", to: "/leaderboard" },
      { label: "Rewards", to: "/rewards" },
      { label: "Tournaments", to: "/tournaments" },
    ],
    help: [{ label: "Help Center", to: "/help" }],
    accessibilityTo: null, // no accessibility route registered in ArcadeRoutes.jsx
  },
  store: {
    homeLabel: "Store",
    homeTo: "/catalog",
    tagline: "Programs • Solutions • Add-ons",
    quickLinks: [
      { label: "Catalog", to: "/catalog" },
      { label: "Marketplace", to: "/marketplace" },
    ],
    programs: [
      { label: "My Items", to: "/my" },
      { label: "Verify", to: "/verify" },
    ],
    help: [
      { label: "FAQ", to: "/faq" },
      { label: "About", to: "/about" },
    ],
    accessibilityTo: null, // no accessibility route registered in StoreRoutes.jsx
  },
};

export default function SHFFooter({ variant = "curriculum" }) {
  const config = VARIANTS[variant] || VARIANTS.curriculum;

  return (
    <footer className="shf-footer" aria-label="Silicon Heartland Foundation footer" data-shf-footer-variant={variant}>
      <div className="shf-footerInner">
        <HeartlandLandscape />
        <div className="shf-footerGrid">
          <div className="shf-footerBrand">
            <span className="shf-footerBrandMark" aria-hidden="true">
              <HeartMark size={28} />
            </span>
            <div>
              <p className="shf-footerBrandName">Silicon Heartland Foundation</p>
              <p className="shf-footerMission">
                Empowering youth. Building futures.
                <br />
                Strengthening communities.
              </p>
            </div>
          </div>

          <nav className="shf-footerCol" aria-label="Quick links">
            <h4>Quick Links</h4>
            {config.quickLinks.map((item) => (
              <FooterLink key={item.label} to={item.to} external={item.external}>
                {item.label}
              </FooterLink>
            ))}
          </nav>

          <nav className="shf-footerCol" aria-label="Programs and resources">
            <h4>Programs &amp; Resources</h4>
            {config.programs.map((item) => (
              <FooterLink key={item.label} to={item.to} external={item.external}>
                {item.label}
              </FooterLink>
            ))}
          </nav>

          <nav className="shf-footerCol" aria-label="Help and support">
            <h4>Help &amp; Support</h4>
            {config.help.map((item) => (
              <FooterLink key={item.label} to={item.to} external={item.external}>
                {item.label}
              </FooterLink>
            ))}
            {config.accessibilityTo && (
              <FooterLink to={config.accessibilityTo}>Accessibility</FooterLink>
            )}
          </nav>

          <nav className="shf-footerCol shf-footerColContact" aria-label="Contact">
            <h4>Contact Us</h4>
            <a className="shf-footerLink shf-footerContactRow" href={`mailto:${CONTACT_EMAIL}`}>
              <MailGlyph />
              <span>{CONTACT_EMAIL}</span>
            </a>
          </nav>
        </div>
      </div>

      <div className="shf-footerLegal">
        <span>&copy; {new Date().getFullYear()} Silicon Heartland Foundation</span>
        {config.accessibilityTo && (
          <FooterLink to={config.accessibilityTo}>Accessibility</FooterLink>
        )}
        <a className="shf-footerLink" href={`mailto:${CONTACT_EMAIL}`}>
          Contact Us
        </a>
      </div>

      <div className="shf-footerBand" role="note">
        <p>INVESTING IN PEOPLE. STRENGTHENING COMMUNITIES. BUILDING OUR FUTURE.</p>
      </div>
    </footer>
  );
}
