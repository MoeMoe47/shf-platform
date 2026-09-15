import React from "react";

const STATUS_LABEL = {
  LOCKED: "Locked",
  AVAILABLE: "Available",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  OVERDUE: "Overdue",
  SUBMITTED: "Submitted",
  COMPLETED_SOURCE_PENDING_VERIFICATION: "Completed (pending review)",
  COMPLETED_VERIFIED_SOURCE: "Completed (verified)",
  CLOSED: "Closed",
};

// MET-7 §22/§29 — the non-spatial, keyboard/screen-reader equivalent to
// every mission a learner could otherwise reach by walking the city.
// Every mission here is real server data (props.missions comes straight
// from GET /metaverse/missions) — this component never invents one.
export default function MetaverseMissionList({ open, missions, loading, error, onSelectMission, onClose }) {
  return (
    <section className={`met-missions ${open ? "is-open" : ""}`} aria-label="Accessible mission list">
      <div className="met-missions__header">
        <h2>Missions</h2>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      {loading ? <p className="met-missions__status" role="status">Loading missions…</p> : null}
      {error ? <p className="met-missions__status" role="alert">{error}</p> : null}
      {!loading && !error && missions.length === 0 ? (
        <p className="met-missions__status">No missions are assigned right now.</p>
      ) : null}
      <ul className="met-missions__list">
        {missions.map((mission) => {
          const statusLabel = STATUS_LABEL[mission.missionStatus] || mission.missionStatus;
          const locked = mission.missionStatus === "LOCKED" || mission.missionStatus === "CLOSED";
          return (
            <li key={mission.missionProjectionId} className="met-missions__item">
              <button
                type="button"
                className={`met-missions__card met-missions__card--${mission.missionStatus.toLowerCase()}`}
                onClick={() => onSelectMission(mission)}
                aria-describedby={`mission-next-${mission.missionProjectionId}`}
              >
                <span className="met-missions__title">{mission.missionTitle}</span>
                <span className="met-missions__status-pill" data-locked={locked ? "true" : "false"}>{statusLabel}</span>
                <span className="met-missions__place">{mission.location.districtId.replace(/-district$/, "").replace(/-/g, " ")}</span>
                <span id={`mission-next-${mission.missionProjectionId}`} className="met-missions__next">
                  {mission.nextAction.label}: {mission.nextAction.reason}
                </span>
                {mission.arcadeRelations.length ? (
                  <span className="met-missions__arcade">
                    Arcade: {mission.arcadeRelations.map((r) => `${r.title} (${r.requiredOrRecommended.toLowerCase()}${r.masteryAchieved ? ", mastered" : ""})`).join(", ")}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
