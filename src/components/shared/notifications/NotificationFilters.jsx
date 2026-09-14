import React from "react";
import { NOTIFICATION_FILTERS } from "./useNotifications.js";

const FILTER_OPTIONS = [
  { value: NOTIFICATION_FILTERS.ALL, label: "All" },
  { value: NOTIFICATION_FILTERS.UNREAD, label: "Unread" },
  { value: NOTIFICATION_FILTERS.ACTION_REQUIRED, label: "Action required" },
];

// NCA-3 §9/§26: keep first release simple — a small set of accessible
// buttons (not a folder/tab system) plus an organization <select> that
// only renders when the user actually has more than one authorized
// organization with notifications, per §10 (never force an organization
// choice on a single-org user).
export default function NotificationFilters({ filter, onFilterChange, organizations = [], organizationId, onOrganizationChange }) {
  return (
    <div className="nca-notif-filters" role="group" aria-label="Filter notifications">
      <div className="nca-notif-filters__buttons">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="nca-notif-filters__button"
            aria-pressed={filter === option.value}
            onClick={() => onFilterChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {organizations.length > 1 ? (
        <div className="nca-notif-filters__org">
          <label htmlFor="nca-notif-org-filter" className="nca-srOnly">
            Filter by organization
          </label>
          <select
            id="nca-notif-org-filter"
            value={organizationId || ""}
            onChange={(e) => onOrganizationChange(e.target.value || undefined)}
          >
            <option value="">Current organization</option>
            {organizations.map((org) => (
              <option key={org.organizationId} value={org.organizationId}>
                {org.organizationId}
                {org.unreadCount ? ` (${org.unreadCount} unread)` : ""}
                {org.isActive ? " — current" : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
