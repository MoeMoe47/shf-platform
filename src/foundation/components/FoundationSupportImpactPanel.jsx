import React from "react";
import Icon from "./FoundationDonationIcon.jsx";

export default function FoundationSupportImpactPanel() {
  return (
    <aside className="shf-support-panel" aria-labelledby="support-panel-title">
      <img
        className="shf-support-panel__image"
        data-photo-slot="support-impact"
        data-photo-status="owner-approved"
        src="/assets/foundation/donation/donation-impact-support.webp"
        alt="Two young people looking toward the city at sunset"
        loading="lazy"
      />
      <div>
        <h3 id="support-panel-title" className="shf-donation-eyebrow">
          YOUR SUPPORT HELPS
        </h3>
        <ul>
          {[
            ["cap", "Expand access to education and technology"],
            ["briefcase", "Create real workforce and career opportunities"],
            ["access", "Support inclusive programs for all learners"],
            ["people", "Strengthen Ohio and Midwest communities"],
          ].map(([icon, text]) => (
            <li key={icon}>
              <span>
                <Icon name={icon} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
