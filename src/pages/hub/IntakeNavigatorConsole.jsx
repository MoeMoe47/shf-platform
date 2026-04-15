import React from "react";
import HubAdminShell from "../../components/hub/HubAdminShell.jsx";

const intakeCards = [
  {
    title: "Quick Intake Search",
    value: "Ready",
    meta: "Search and participant lookup surface will connect here next.",
    badges: ["Phase 1"],
  },
  {
    title: "Create Referral",
    value: "Ready",
    meta: "Referral creation workflow is now backed by the live SHS API.",
    badges: ["Live API"],
  },
  {
    title: "Manual Follow-Up Notes",
    value: "Next",
    meta: "Navigator notes and handoff notes will be added in the next slice.",
    badges: ["Pending"],
  },
];

function Badge({ label }) {
  return <span className="shf-badge">{label}</span>;
}

export default function IntakeNavigatorConsole() {
  return (
    <HubAdminShell
      title="Intake Navigator Console"
      subtitle="Operator-facing intake, routing, and handoff workspace for the hub collaboration layer."
    >
      <div className="ar-grid">
        {intakeCards.map((card) => (
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
