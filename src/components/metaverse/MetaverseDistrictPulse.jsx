import React from "react";

export default function MetaverseDistrictPulse({ pulses = [] }) {
  if (!pulses.length) return null;
  return (
    <section className="met-pulse" aria-labelledby="met-pulse-title">
      <h2 id="met-pulse-title">District Pulse</h2>
      <ul>
        {pulses.filter((pulse) => pulse.learner_relevant_count > 0 || pulse.has_next_action).slice(0, 6).map((pulse) => (
          <li key={pulse.district_id} data-required={pulse.has_required_action ? "true" : "false"}>
            <span>{pulse.district_id.replace(/-district$/, "").replace(/-/g, " ")}</span>
            <small>{pulse.status_summary}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
