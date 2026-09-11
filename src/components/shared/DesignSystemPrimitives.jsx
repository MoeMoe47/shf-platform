import React from "react";

const STATUS_TONES = {
  approved: "success",
  active: "success",
  complete: "success",
  pending: "warning",
  review: "warning",
  blocked: "danger",
  failed: "danger",
  suspended: "danger",
  archived: "info",
  draft: "info",
};

function toneForStatus(status) {
  return STATUS_TONES[String(status || "").toLowerCase()] || "info";
}

export function Button({ variant = "primary", className = "", children, ...props }) {
  return <button className={`ds-button ds-button--${variant} ${className}`.trim()} {...props}>{children}</button>;
}

export function IconButton({ label, className = "", children, ...props }) {
  return <button className={`ds-iconButton ${className}`.trim()} aria-label={label} title={label} {...props}>{children}</button>;
}

export function StatusBadge({ status, tone, children = status }) {
  const resolvedTone = tone || toneForStatus(status);
  return <span className={`ds-status ds-status--${resolvedTone}`} data-status={String(status || "").toLowerCase()}>{children}</span>;
}

export function PageHeader({ eyebrow, title, description, actions, className = "" }) {
  return (
    <header className={`ds-pageHeader ${className}`.trim()}>
      <div className="ds-pageHeader__copy">
        {eyebrow ? <p className="ds-pageHeader__eyebrow">{eyebrow}</p> : null}
        <h1 className="ds-pageHeader__title">{title}</h1>
        {description ? <p className="ds-pageHeader__description">{description}</p> : null}
      </div>
      {actions ? <div className="ds-pageHeader__actions">{actions}</div> : null}
    </header>
  );
}

export function Surface({ variant = "default", className = "", children, ...props }) {
  return <section className={`ds-surface${variant === "subtle" ? " ds-surface--subtle" : ""} ${className}`.trim()} {...props}>{children}</section>;
}

export function EmptyState({ title = "Nothing here yet", description, children }) {
  return <section className="ds-empty" role="status"><h2 className="ds-empty__title">{title}</h2>{description ? <p className="ds-empty__description">{description}</p> : null}{children}</section>;
}

export function LoadingState({ label = "Loading" }) {
  return <p className="ds-state" role="status" aria-live="polite">{label}</p>;
}

export function ErrorState({ title = "Something went wrong", description, children }) {
  return <section className="ds-state" role="alert"><h2 className="ds-state__title">{title}</h2>{description ? <p className="ds-state__description">{description}</p> : null}{children}</section>;
}
