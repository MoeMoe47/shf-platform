// src/components/RecentActivityCard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function RecentActivityCard({
  items = [],
  max = 10,
  showMoreHref = null,
  onItemClick, // (item) => void
}) {
  const list = Array.isArray(items) ? items.slice(0, max) : [];

  if (list.length === 0) {
    return (
      <div className="sh-muted" role="status">
        No recent activity yet — complete a lesson or submit an assignment to see updates here.
      </div>
    );
  }

  return (
    <div>
      <ul className="sh-activity" role="list">
        {list.map((it, i) => {
          const key = it.id ?? `${it.kind || "evt"}_${i}`;
          const icon = getIcon(it.kind);
          const when = formatWhen(it.when);

          const RowInner = (
            <>
              <div className="sh-activityIcon" aria-hidden>{icon}</div>
              <div className="sh-activityMain">
                <div className="sh-activityLabel">{it.label}</div>
                {it.detail ? (
                  <div className="sh-activityDetail">{it.detail}</div>
                ) : null}
              </div>
              <time className="sh-activityWhen" dateTime={isoDate(it.when)}>{when}</time>
            </>
          );

          // Prefer link → then button → then plain row
          if (it.href) {
            return (
              <li key={key} className="sh-activityItem">
                <Link to={canonicalize(it.href)} className="sh-activityRow">
                  {RowInner}
                </Link>
              </li>
            );
          }
          if (typeof onItemClick === "function") {
            return (
              <li key={key} className="sh-activityItem">
                <button type="button" className="sh-activityRow" onClick={() => onItemClick(it)}>
                  {RowInner}
                </button>
              </li>
            );
          }
          return (
            <li key={key} className="sh-activityItem">
              <div className="sh-activityRow" role="group" aria-label={it.label}>
                {RowInner}
              </div>
            </li>
          );
        })}
      </ul>

      {showMoreHref && (
        <div style={{ marginTop: 8 }}>
          <Link className="sh-btn sh-btn--tiny sh-btn--secondary" to={showMoreHref}>
            View all activity
          </Link>
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function canonicalize(href = "") {
  // keep routes consistent: /lessons/:slug (plural)
  return href.replace(/\/lesson\//, "/lessons/");
}

function isoDate(when) {
  const d = toDate(when);
  return d ? d.toISOString() : "";
}

function toDate(when) {
  if (!when && when !== 0) return null;
  if (when instanceof Date) return when;
  if (typeof when === "number") return new Date(when);
  if (typeof when === "string") {
    const n = Number(when);
    if (!Number.isNaN(n) && String(n).length >= 10) return new Date(n);
    const d = new Date(when);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatWhen(when) {
  const d = toDate(when);
  if (!d) return String(when ?? "");
  const diff = Date.now() - d.getTime();
  if (diff < 0) return d.toLocaleString(); // future-safe

  const s = Math.floor(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;

  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;

  const days = Math.floor(h / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString();
}

function getIcon(kind) {
  switch ((kind || "").toLowerCase()) {
    case "lesson":
    case "learning":
      return "📖";
    case "assignment":
    case "submission":
      return "📝";
    case "badge":
    case "award":
      return "🏅";
    case "cert":
    case "certificate":
      return "🎓";
    case "wallet":
    case "payment":
      return "👛";
    case "zoom":
    case "meeting":
      return "🎥";
    case "coach":
    case "ai":
      return "✨";
    case "alert":
    case "warning":
      return "⚠️";
    default:
      return "•";
  }
}
