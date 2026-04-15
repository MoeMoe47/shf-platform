import React from "react";
import HubAdminShell from "../../components/hub/HubAdminShell.jsx";

const summaryCards = [
  {
    title: "Referrals This Week",
    value: "1",
    meta: "Live referral intake now connected",
    badges: ["Operational"],
  },
  {
    title: "Acceptance Rate",
    value: "—",
    meta: "Will populate after referral transitions are added",
    badges: ["Pending"],
  },
  {
    title: "Unmet Needs",
    value: "—",
    meta: "Will populate after unmet-needs capture is wired",
    badges: ["Pending"],
  },
  {
    title: "Verified Outcomes",
    value: "—",
    meta: "Will populate after verification workflow is live",
    badges: ["Pending"],
  },
  {
    title: "Organizations Online",
    value: "2",
    meta: "SHF + Franklin County Workforce Partner",
    badges: ["Pilot"],
  },
  {
    title: "Hub Status",
    value: "Phase 1",
    meta: "Hub foundation and trust spine are now live",
    badges: ["Build Active"],
  },
];

function Badge({ label }) {
  return <span className="shf-badge">{label}</span>;
}

export default function HubLeadershipDashboard() {
  return (
    <HubAdminShell
      title="Hub Leadership Dashboard"
      subtitle="Leadership view for network coordination, referral activity, unmet-need visibility, and verified collaboration outcomes."
    >
      <div className="ar-grid">
        {summaryCards.map((card) => (
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
