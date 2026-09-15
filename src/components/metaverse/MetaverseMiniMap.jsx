import React from "react";

export default function MetaverseMiniMap({ currentDistrictId, pulses = [], destinations = [], onTravel }) {
  return (
    <section className="met-minimap" aria-labelledby="met-minimap-title">
      <h2 id="met-minimap-title">Mini Map</h2>
      <p>Current district: {currentDistrictId ? currentDistrictId.replace(/-district$/, "").replace(/-/g, " ") : "City overview"}</p>
      <ul aria-label="Text equivalent district activity">
        {pulses.slice(0, 9).map((pulse) => (
          <li key={pulse.district_id} data-current={pulse.district_id === currentDistrictId ? "true" : "false"}>
            {pulse.district_id.replace(/-district$/, "").replace(/-/g, " ")}: {pulse.status_summary}
          </li>
        ))}
      </ul>
      <div className="met-minimap__destinations">
        {destinations.slice(0, 4).map((destination) => (
          <button key={destination.destination_id} type="button" onClick={() => onTravel?.(destination)} disabled={!destination.available}>
            {destination.label}
          </button>
        ))}
      </div>
    </section>
  );
}
