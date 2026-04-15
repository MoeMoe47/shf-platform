import React from "react";
import HubAdminShell from "../../components/hub/HubAdminShell.jsx";

const unmetNeedCards = [
  {
    title: "Transportation Gap",
    value: "Monitor",
    meta: "Current pilot referral indicates transportation as an active unmet-need category candidate.",
    badges: ["Early Signal"],
  },
  {
    title: "Provider Capacity",
    value: "Pending",
    meta: "Capacity-aware unmet-need logic will be added once partner response states are active.",
    badges: ["Pending"],
  },
  {
    title: "Consent / Access Barrier",
    value: "Pending",
    meta: "Consent-limited collaboration pathways will be surfaced here in a later build slice.",
    badges: ["Planned"],
  },
];

function Badge({ label }) {
  return <span className="shf-badge">{label}</span>;
}

export default function UnmetNeedsQueue() {
  return (
    <HubAdminShell
      title="Unmet Needs Queue"
      subtitle="Operational queue for unmet-need signals, unresolved barriers, capacity gaps, and funder-relevant demand visibility."
    >
      <div className="ar-grid">
        {unmetNeedCards.map((card) => (
          <div className="ar-card" key={card.title}>
            <div className="ar-top">
              <div className="ar-nameRow">
                <div className="ar-name">{card.title}</div>
              </div>

              <div className="ar-meta">
                <span className="ar-mono">{card.value}</span>
              </div>

              <div className="ar-badges">
                {card.badges.map((badge) => (
                  <Badge key={badge} label={badge} />
                ))}
              </div>
            </div>

            <div className="ar-body">
              <div className="ar-row">
                <div className="ar-label">Summary</div>
                <div className="ar-value">{card.meta}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </HubAdminShell>
  );
}
