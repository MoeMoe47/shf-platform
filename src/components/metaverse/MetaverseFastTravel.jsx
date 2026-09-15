import React from "react";

export default function MetaverseFastTravel({ destinations = [], onTravel }) {
  if (!destinations.length) return null;
  return (
    <nav className="met-fast-travel" aria-label="Fast travel destinations">
      {destinations.slice(0, 7).map((destination) => (
        <button
          key={destination.destination_id}
          type="button"
          onClick={() => onTravel?.(destination)}
          disabled={!destination.available}
          aria-disabled={!destination.available}
          title={destination.protected_entry_required ? "Protected entry recheck required" : undefined}
        >
          {destination.label}
        </button>
      ))}
    </nav>
  );
}
