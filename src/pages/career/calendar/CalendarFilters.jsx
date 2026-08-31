// src/pages/career/calendar/CalendarFilters.jsx
import React from "react";
import { FILTER_GROUPS } from "./eventContract.js";

export default function CalendarFilters({ activeFilter, onFilterChange, search, onSearchChange, groups = FILTER_GROUPS, hideSearch = false }) {
  return (
    <div className="cal-filters">
      <div className="cal-filterChips" role="group" aria-label="Filter events by type">
        {groups.map((group) => {
          const isActive = activeFilter === group.id;
          return (
            <button
              key={group.id}
              type="button"
              className={`cal-filterChip ${isActive ? "is-active" : ""}`}
              aria-pressed={isActive}
              onClick={() => onFilterChange(group.id)}
            >
              {isActive && <span aria-hidden="true" className="cal-filterCheck">✓</span>}
              {group.label}
            </button>
          );
        })}
      </div>
      {!hideSearch && (
        <label className="cal-search">
          <span className="sr-only">Search events</span>
          <span aria-hidden="true" className="cal-searchIcon">🔎</span>
          <input
            type="search"
            placeholder="Search events…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>
      )}
    </div>
  );
}
