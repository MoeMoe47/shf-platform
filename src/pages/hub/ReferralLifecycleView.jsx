import React from "react";
import HubAdminShell from "../../components/hub/HubAdminShell.jsx";

const lifecycleCards = [
  {
    title: "Created → Open",
    value: "Live",
    meta: "Referrals are now entering the system as open referral cases.",
    badges: ["Operational"],
  },
  {
    title: "Under Review",
    value: "Next",
    meta: "Review-state routing and operator status progression will be added next.",
    badges: ["Pending"],
  },
  {
    title: "Accepted / Assigned",
    value: "Next",
    meta: "Partner acceptance and assignment workflow will connect to existing case transitions.",
    badges: ["Pending"],
  },
  {
    title: "Completed / Verified",
    value: "Future",
    meta: "Outcome capture and verification-weighted lifecycle stages will be added after transitions.",
    badges: ["Planned"],
  },
];

function Badge({ label }) {
  return <span className="shf-badge">{label}</span>;
}

export default function ReferralLifecycleView() {
  return (
    <HubAdminShell
      title="Referral Lifecycle View"
      subtitle="Lifecycle surface for tracking referral movement from intake through routing, service progression, and verified completion."
    >
      <div className="ar-grid">
        {lifecycleCards.map((card) => (
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
