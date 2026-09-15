import React from "react";

export default function MetaverseParticipantList({ participantCount, participants }) {
  return (
    <section className="met-participants" aria-label="Participants in this location">
      <h2 className="met-participants__heading">
        Participants <span aria-hidden="true">({participantCount ?? 0})</span>
        <span className="met-sr-only">{participantCount ?? 0} participants visible here</span>
      </h2>
      {(participants || []).length === 0 ? (
        <p className="met-participants__empty">No participants are currently visible here.</p>
      ) : (
        <ul className="met-participants__list">
          {(participants || []).map((participant) => (
            <li key={participant.presence_session_id} className="met-participants__item">
              <span className={`met-status-dot met-status-dot--${String(participant.status || "").toLowerCase()}`} aria-hidden="true" />
              <span className="met-participants__name">
                {participant.display_name}
                {participant.role_label !== "Participant" ? <em className="met-participants__role"> · {participant.role_label}</em> : null}
              </span>
              <span className="met-sr-only"> status: {participant.status}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="met-participants__note">Use message safety options in the chat tray to mute, block, or report a specific participant.</p>
    </section>
  );
}
