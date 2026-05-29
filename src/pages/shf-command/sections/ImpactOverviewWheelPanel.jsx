import React from "react";

const SEGMENT_CLASSES = {
  verification: "shf-flywheel-hotspot--verification",
  funding: "shf-flywheel-hotspot--funding",
  treasury: "shf-flywheel-hotspot--treasury",
  community: "shf-flywheel-hotspot--community",
  audit: "shf-flywheel-hotspot--audit",
  reporting: "shf-flywheel-hotspot--reporting",
  governance: "shf-flywheel-hotspot--governance",
};

export default function ImpactOverviewWheelPanel({
  trendPoints = [],
  onWheelClick,
  activeSegment = "reporting",
}) {
  return (
    <div className="shf-panel shf-impact-overview" data-tour-section="impact">
      <div className="shf-panel__header">
        <h2>Impact Overview</h2>
      </div>

      <div className="shf-wheel-card shf-wheel-card--branded">
        <button
          type="button"
          className="shf-branded-flywheel"
          onClick={() => onWheelClick?.()}
          aria-label="Open Impact Overview Wheel"
        >
          <img
            src="/assets/shf-command/flywheel/silicon-heartland-flywheel.png"
            alt="Silicon Heartland Institutional Ecosystem Flywheel"
            className="shf-branded-flywheel__image"
          />

          <div className="shf-branded-flywheel__overlay" aria-hidden="true">
            {Object.entries(SEGMENT_CLASSES).map(([key, cls]) => (
              <span
                key={key}
                className={[
                  "shf-flywheel-hotspot",
                  cls,
                  activeSegment === key ? "is-active" : "",
                ].join(" ")}
              />
            ))}
          </div>
        </button>
      </div>

      <div className="shf-trend-block">
        <div className="shf-trend-block__header">
          <h3>Outcome Trends</h3>
          <span>Last 12 Months</span>
        </div>
        <div className="shf-trend-block__value-row">
          <strong>12,482</strong>
          <span>+ 8.2% ↑</span>
        </div>
        <svg viewBox="0 0 320 80" className="shf-trend-svg" aria-hidden="true">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            points={trendPoints.map((p, i) => `${10 + i * 19},${70 - p}`).join(" ")}
          />
        </svg>
      </div>
    </div>
  );
}
