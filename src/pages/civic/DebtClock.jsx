// src/pages/civic/DebtClock.jsx
// Redesigned per the approved Debt Clock mock (light + dark, supplied
// directly during this task). Shell/theme/shared design tokens are
// inherited unchanged from the Civic Lab Dashboard/Elections/Proposals/
// Grant Story redesigns — see src/styles/civic-dashboard.css and
// src/styles/civic-debtclock.css (this page's own additions only).
//
// Data truthfulness (Phase 4 of the brief): the displayed debt figure is
// a literal hardcoded string in the pre-redesign source — not fetched,
// not computed, not derived from any real data source. Classification:
// STATIC EDUCATIONAL / SIMULATED. The existing disclaimer text already
// hedges this honestly ("visualized for education (simulated)", "Public
// treasury data (educational use)") and is preserved verbatim — not
// strengthened into a live-data claim, not weakened. See Final Report §3.
//
// Mission logging (missionId, chapter, defaultDuration, fundingStreams)
// and the shared MissionLogButtons component are unchanged from the
// pre-redesign page — only presentation/wrapper styling changed.
import React from "react";
import MissionLogButtons from "@/components/civic/MissionLogButtons.jsx";
import { useCompanion } from "@/hooks/useCompanion.js";
import CompanionFace from "@/components/companion/CompanionFace.jsx";

const CURRENT_DEBT = "$89,420,000,000"; // STATIC EDUCATIONAL / SIMULATED — see file header

function FiscalIllustration() {
  return (
    <svg viewBox="0 0 320 220" role="img" aria-hidden="true" focusable="false">
      <g opacity="0.9">
        <rect x="20" y="150" width="26" height="50" rx="2" fill="var(--civic-gold)" opacity="0.35" />
        <rect x="54" y="120" width="26" height="80" rx="2" fill="var(--civic-gold)" opacity="0.5" />
        <rect x="88" y="90" width="26" height="110" rx="2" fill="var(--civic-gold)" opacity="0.65" />
      </g>
      <g stroke="var(--civic-ink-muted)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M138 90 L172 60 L206 90 Z" />
        <rect x="138" y="90" width="68" height="8" />
        <line x1="148" y1="98" x2="148" y2="150" />
        <line x1="164" y1="98" x2="164" y2="150" />
        <line x1="180" y1="98" x2="180" y2="150" />
        <line x1="196" y1="98" x2="196" y2="150" />
        <rect x="136" y="150" width="72" height="8" />
      </g>
      <circle cx="258" cy="120" r="52" fill="var(--civic-card-bg)" stroke="var(--civic-gold)" strokeWidth="4" />
      <circle cx="258" cy="120" r="4" fill="var(--civic-gold)" />
      <line x1="258" y1="120" x2="258" y2="88" stroke="var(--civic-gold)" strokeWidth="3" strokeLinecap="round" />
      <line x1="258" y1="120" x2="278" y2="128" stroke="var(--civic-gold)" strokeWidth="3" strokeLinecap="round" />
      <text x="258" y="152" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--civic-gold)">$</text>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1={258 + 46 * Math.cos((deg * Math.PI) / 180)}
          y1={120 + 46 * Math.sin((deg * Math.PI) / 180)}
          x2={258 + 40 * Math.cos((deg * Math.PI) / 180)}
          y2={120 + 40 * Math.sin((deg * Math.PI) / 180)}
          stroke="var(--civic-ink-muted)"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

export default function DebtClock() {
  const companion = useCompanion();

  return (
    <div className="dc-page">
      <h1 className="cv-srOnly">Debt Clock</h1>

      <header className="dc-header" aria-labelledby="dc-title">
        <p className="dc-header__h1" id="dc-title">Debt Clock</p>
        <p className="dc-header__sub">State/County debt visualized for education (simulated).</p>
      </header>

      <div className="dc-heroRow">
        <section className="dc-card dc-hero" aria-label="Current Debt">
          <span className="dc-hero__icon" aria-hidden="true">🏛️</span>
          <div>
            <p className="dc-hero__label">Current Debt</p>
            {CURRENT_DEBT ? (
              <p className="dc-hero__value">{CURRENT_DEBT}</p>
            ) : (
              <p className="dc-hero__unavailable">Debt data unavailable</p>
            )}
            <p className="dc-hero__source">Source: Public treasury data (educational use)</p>
          </div>
        </section>
        <div className="dc-illustration">
          <FiscalIllustration />
        </div>
      </div>

      <section className="dc-missionLog" aria-label="Mission Log">
        <MissionLogButtons
          missionId="debt-clock-mission"
          missionTitle="Debt Clock Proposal Mission"
          chapter="Fiscal Policy 1"
          defaultDuration={45}
          defaultSummary=""
          defaultOutcome=""
          fundingStreams={["essa", "civics"]}
        />
      </section>

      <div className="dc-coachRow">
        <div className="dc-card dc-coach">
          <span className="dc-coach__art" aria-hidden="true">
            <CompanionFace animation="idle" size={44} />
          </span>
          <div>
            <p className="dc-coach__title">Need help?</p>
            <button type="button" className="dc-coach__link" onClick={() => companion.openCoach()}>
              Ask Coach!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
