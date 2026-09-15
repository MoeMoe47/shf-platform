import React from "react";

export default function MetaverseBuildingPreview({ preview, onEnter }) {
  if (!preview) return null;
  return (
    <aside className="met-building-preview" aria-labelledby="met-building-preview-title">
      <p className="met-orch-label">{preview.status}</p>
      <h2 id="met-building-preview-title">{preview.facility_name}</h2>
      {preview.current_missions?.length ? <p>{preview.current_missions.length} current mission{preview.current_missions.length === 1 ? "" : "s"}</p> : null}
      {preview.opportunity_count ? <p>{preview.opportunity_count} eligible opportunit{preview.opportunity_count === 1 ? "y" : "ies"}</p> : null}
      {preview.active_program_or_event ? <p>{preview.active_program_or_event.title}</p> : null}
      {Number.isInteger(preview.presence_count) ? <p>{preview.presence_count} present</p> : null}
      {preview.learner_next_action ? <p>{preview.learner_next_action.title}</p> : null}
      <button type="button" onClick={() => onEnter?.(preview)}>Enter</button>
    </aside>
  );
}
