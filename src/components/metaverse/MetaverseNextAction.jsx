import React from "react";

export default function MetaverseNextAction({ action, onSelect }) {
  if (!action) return null;
  return (
    <section className="met-orch-next" aria-labelledby="met-orch-next-title" data-required={action.is_required ? "true" : "false"}>
      <p className="met-orch-label">Guided Next Action</p>
      <h2 id="met-orch-next-title">{action.title}</h2>
      <p>{action.summary}</p>
      <p className="met-orch-reason">{action.reason}</p>
      {action.district_id || action.facility_id ? (
        <p className="met-orch-destination">{[action.district_id, action.facility_id].filter(Boolean).join(" / ").replace(/-/g, " ")}</p>
      ) : null}
      <button type="button" onClick={() => onSelect?.(action)} disabled={!action.is_available} aria-disabled={!action.is_available}>
        {action.is_available ? "Fast travel" : action.blocked_reason || "Unavailable"}
      </button>
    </section>
  );
}
