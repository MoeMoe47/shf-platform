import React from "react";

export default function MetaverseFastTravel({ destinations = [], onTravel }) {
  if (!destinations.length) return null;
  return (
    <nav className="met-fast-travel" aria-label="Fast travel destinations">
      <span className="met-fast-travel__label">Fast Travel</span>
      {destinations.slice(0, 7).map((destination) => (
        <button
          key={destination.destination_id}
          type="button"
          onClick={() => onTravel?.(destination)}
          disabled={!destination.available}
          aria-disabled={!destination.available}
          title={destination.protected_entry_required ? "Protected entry recheck required" : undefined}
          data-protected-entry={destination.protected_entry_required ? "true" : "false"}
        >
          {destination.label}
        </button>
      ))}
    </nav>
  );
}
