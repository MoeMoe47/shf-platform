// src/components/ui/KpiCard.jsx
import React from "react";

/**
 * KpiCard
 * - brand-consistent KPI tile with trend, delta, and caption
 * - uses CSS variables from theme-shf.css
 *
 * Props:
 *  - label        (string)  header text
 *  - value        (string|number) main metric
 *  - unit         (string)  optional suffix (%, EVU, $)
 *  - delta        (string|number) change value (e.g., +12%, -3.1)
 *  - trend        ("up"|"down"|"flat") trend indicator
 *  - caption      (string)  sublabel/footer (e.g., "vs last 7d")
 *  - sub          (string)  alias for caption (some callers, e.g.
 *                  CreditReport.jsx / AttendanceCard.jsx, pass this name —
 *                  accepted directly rather than silently dropped)
 *  - icon         (string)  optional leading glyph shown next to the label
 *  - washClass    (string)  a "wash--*" class from src/utils/getWashClass.js
 *                  (e.g. "wash--celebrate-10"); applied together with the
 *                  base "wash" class from util-wash.css so the card's
 *                  background actually tints instead of the class being a
 *                  no-op on this component
 *  - intent       ("good"|"warn"|"bad") color accent for trend
 *  - onClick      (fn)      optional click handler
 *  - compact      (bool)    tighter padding
 */
export default function KpiCard({
  label,
  value,
  unit,
  delta,
  trend = "flat",
  caption,
  sub,
  icon,
  washClass,
  intent,
  onClick,
  compact = false,
}) {
  const cls = [
    "kpi",
    washClass ? "wash" : "",
    washClass || "",
    compact ? "kpi--compact" : "",
    intent ? `kpi--${intent}` : "",
    trend ? `kpi--${trend}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const subline = caption ?? sub;

  const Arrow = () => {
    if (trend === "up")
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4l7 7h-4v9h-6v-9H5z" fill="currentColor" />
        </svg>
      );
    if (trend === "down")
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20l-7-7h4V4h6v9h4z" fill="currentColor" />
        </svg>
      );
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12h16v2H4z" fill="currentColor" />
      </svg>
    );
  };

  return (
    <button type="button" className={cls} onClick={onClick} aria-label={label}>
      <div className="kpi__head">
        <span className="kpi__label">
          {icon ? <span className="kpi__icon" aria-hidden="true">{icon}</span> : null}
          {label}
        </span>
        <span className="kpi__chip">
          {trend === "up" ? "Good" : trend === "down" ? "Watch" : "Stable"}
        </span>
      </div>

      <div className="kpi__main">
        <span className="kpi__value">{format(value)}</span>
        {unit ? <span className="kpi__unit">{unit}</span> : null}
      </div>

      {delta !== undefined && delta !== null && (
        <div className="kpi__delta">
          <span className="kpi__arrow">
            <Arrow />
          </span>
          <span className="kpi__deltaValue">{delta}</span>
        </div>
      )}

      {subline ? <div className="kpi__cap">{subline}</div> : null}
    </button>
  );
}

function format(v) {
  if (typeof v === "number") {
    // simple formatting; avoids noisy decimals and keeps thousands grouped
    return Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : v.toString();
    }
  return v ?? "—";
}
