// src/pages/career/portfolio-sections/CredentialsBadges.jsx
import React from "react";
import { BrainIcon, CodeIcon, PortfolioIcon } from "@/components/curriculum/icons.jsx";

function TeamworkIcon(props) {
  return (
    <svg
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M2.5 20c.7-3.3 3-5 5.5-5s4.8 1.7 5.5 5" />
      <path d="M10.5 20c.7-3.3 3-5 5.5-5s4.8 1.7 5.5 5" />
    </svg>
  );
}

/**
 * No canonical credentials/badge catalog exists for this student in the
 * repo (checked src/data, src/shared/rewards — no matching entries).
 * Isolated as fallback content; a real credentials source can replace
 * this array without touching the rendering markup below.
 */
const BADGES = [
  { id: "ai-foundations", label: "AI Foundations", Icon: BrainIcon, tone: "tone-a" },
  { id: "web-builder", label: "Web Builder", Icon: CodeIcon, tone: "tone-b" },
  { id: "teamwork", label: "Teamwork", Icon: TeamworkIcon, tone: "tone-c" },
  { id: "career-ready", label: "Career Ready", Icon: PortfolioIcon, tone: "tone-d" },
];

export default function CredentialsBadges() {
  return (
    <section className="sp-card" aria-labelledby="sp-credentials-h">
      <div className="sp-cardHeadRow">
        <h2 id="sp-credentials-h" className="sp-cardTitle">
          Credentials &amp; Badges
        </h2>
        <button
          type="button"
          className="sp-viewLink"
          aria-disabled="true"
          title="Credential detail view coming soon"
          onClick={(e) => e.preventDefault()}
        >
          View credentials
        </button>
      </div>

      <div className="sp-badgeGrid">
        {BADGES.map((b) => (
          <div key={b.id} className="sp-badge">
            <span className={`sp-badgeIcon ${b.tone}`} aria-hidden="true">
              <b.Icon size={26} />
            </span>
            <span className="sp-badgeLabel">{b.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
