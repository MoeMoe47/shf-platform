// src/components/QuickActionsCard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function QuickActionsCard({
  // You can pass either an href or an onClick for each action
  startHref,
  uploadHref,
  officeHoursHref,

  onStartNextLesson,
  onUploadAssignment,
  onBookOfficeHours,

  // Optional UI controls
  disabled = false,
  loading = false,
  className = "",
}) {
  const canonicalize = (href = "") => href.replace(/\/lesson\//, "/lessons/");

  return (
    <div className={`sh-actionsRow ${className}`}>
      <Action
        label={loading ? "Loading…" : "Start Next Lesson"}
        primary
        href={startHref && canonicalize(startHref)}
        onClick={onStartNextLesson}
        disabled={disabled || loading}
      />
      <Action
        label="Upload Assignment"
        href={uploadHref}
        onClick={onUploadAssignment}
        disabled={disabled || loading}
      />
      <Action
        label="Book Office Hours"
        href={officeHoursHref}
        onClick={onBookOfficeHours}
        disabled={disabled || loading}
      />
    </div>
  );
}

function Action({ label, href, onClick, disabled = false, primary = false }) {
  const cls = `sh-btn ${primary ? "sh-btn--primary" : ""}`.trim();

  if (href) {
    return (
      <Link
        to={href}
        className={cls}
        aria-disabled={disabled ? "true" : undefined}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        tabIndex={disabled ? -1 : 0}
      >
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
