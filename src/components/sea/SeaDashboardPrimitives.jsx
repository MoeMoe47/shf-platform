import React from "react";
import "./sea-dashboard-primitives.css";

const ATTENTION_LABELS = {
  ACTION_REQUIRED: "Action required",
  WAITING: "Waiting",
  BLOCKED: "Blocked",
  AT_RISK: "At risk",
  DEADLINE: "Deadline",
  REVIEW_REQUIRED: "Review required",
  APPROVAL_REQUIRED: "Approval required",
};

export function SeaDashboardSection({ as: Element = "section", title, eyebrow, children, className = "", ...props }) {
  return <Element className={`sea-dashboardSection ${className}`.trim()} {...props}>
    {eyebrow ? <p className="sea-dashboardEyebrow">{eyebrow}</p> : null}
    {title ? <h2 className="sea-dashboardSectionTitle">{title}</h2> : null}
    {children}
  </Element>;
}

export function SeaAttention({ items = [], sourceStatus = "AVAILABLE" }) {
  if (sourceStatus === "UNAVAILABLE" || sourceStatus === "PARTIAL" || sourceStatus === "STALE") {
    return <SeaDashboardSection title="Attention" className="sea-attention sea-attention--source" aria-live="polite">
      <p><strong>Attention data {sourceStatus.toLowerCase()}.</strong> The owning service has not confirmed a clean state.</p>
    </SeaDashboardSection>;
  }
  return <SeaDashboardSection title="Attention" className="sea-attention" aria-label="Current attention">
    {items.length ? <ul className="sea-attentionList">{items.map((item, index) => <li className={`sea-attentionItem sea-attentionItem--${String(item.type || "ACTION_REQUIRED").toLowerCase()}`} key={`${item.type || "attention"}-${index}`}>
      <span className="sea-attentionMarker" aria-hidden="true">!</span>
      <div><strong>{ATTENTION_LABELS[item.type] || "Attention"}</strong><p>{item.label || item.reason || "Review the current service state."}</p>{item.owner ? <small>Owner: {item.owner}</small> : null}</div>
      {item.href ? <a className="sea-inlineAction" href={item.href}>{item.actionLabel || "Open"}</a> : null}
    </li>)}</ul> : <p className="sea-emptyState">No action is currently required from you.</p>}
  </SeaDashboardSection>;
}

export function SeaNextAction({ label, description, href, source = "DOMAIN_PROJECTION", state = "AVAILABLE" }) {
  const unavailable = ["UNAVAILABLE", "PARTIAL", "STALE"].includes(state);
  return <SeaDashboardSection title="Next action" className={`sea-nextAction sea-nextAction--${state.toLowerCase()}`}>
    <div className="sea-nextActionBody"><p className="sea-sourceLabel">Source: {source}</p><strong>{unavailable ? "Next action unavailable" : label}</strong><p>{unavailable ? "The owning service has not supplied an actionable projection yet." : description}</p></div>
    {!unavailable && href ? <a className="sea-primaryAction" href={href}>{label}</a> : null}
  </SeaDashboardSection>;
}

export function SeaSourceStatus({ status = "AVAILABLE", children }) {
  const labels = { AVAILABLE: "Available", PARTIAL: "Partially available", UNAVAILABLE: "Unavailable", STALE: "Stale", NOT_APPLICABLE: "Not applicable" };
  return <span className={`sea-sourceStatus sea-sourceStatus--${status.toLowerCase()}`} data-source-status={status}>{children || labels[status] || status}</span>;
}

export function SeaHelpRegion({ children, sourceStatus = "AVAILABLE" }) {
  return <SeaDashboardSection title="Help" className="sea-helpRegion"><p>Guidance and documentation remain separate from service authority.</p>{sourceStatus === "UNAVAILABLE" ? <p className="sea-muted">Help source unavailable. The service remains usable.</p> : children}</SeaDashboardSection>;
}
