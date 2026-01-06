import React from "react";

export default function MetricTile({
  label,
  value,
  hint,
  variant = "default",
  align = "left",
  className = "",
}) {
  return (
    <section
      className={[
        "looTile",
        "looMetricTile",
        `is-${variant}`,
        `is-${align}`,
        className,
      ].join(" ")}
    >
      <div className="looMetricLabel">{label}</div>
      <div className="looMetricValue">{value}</div>
      {hint ? <div className="looMetricHint">{hint}</div> : null}
    </section>
  );
}
