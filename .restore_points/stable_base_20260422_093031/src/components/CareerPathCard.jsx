// src/components/CareerPathCard.jsx
import React from "react";
import PropTypes from "prop-types";

export default function CareerPathCard({
  career = {},
  compact = true,
  onView,        // () => void
  onStart,       // () => void
  onCoachClick,  // () => void
}) {
  if (!career || typeof career !== "object") return null;

  /* ---------- formatters ---------- */
  const usd = React.useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    []
  );
  const pctFmt = React.useCallback((n) => {
    const v = Number(n ?? 0);
    if (!Number.isFinite(v)) return "0%";
    const s = v.toFixed(1).replace(/\.0$/, "");
    return `${s}%`;
  }, []);

  /* ---------- sizing (compact vs full) ---------- */
  const CHART_W_STEP = 40;
  const CHART_H      = compact ? 110 : 140;
  const PAD_TOP      = compact ? 14 : 20;
  const PAD_BOTTOM   = compact ? 14 : 20;
  const AXIS_Y0      = CHART_H - PAD_BOTTOM;
  const AXIS_Y1      = PAD_TOP;
  const PLOT_H       = Math.max(AXIS_Y0 - AXIS_Y1, 1);

  /* ---------- projection (memo) ---------- */
  const projection = React.useMemo(() => {
    const years = Math.max(0, toNumber(career.years, 8));         // default: 8 yrs
    const base  = Math.max(0, toNumber(career.avgIncome, 0));
    const g     = toNumber(career.annualGrowthPct, 0) / 100;

    return Array.from({ length: years + 1 }, (_, i) => ({
      year: i,
      income: Math.round(base * Math.pow(1 + g, i)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [career.years, career.avgIncome, career.annualGrowthPct]);

  const maxIncome = Math.max(1, ...projection.map((p) => p.income));
  const width = Math.max(30 + projection.length * CHART_W_STEP, 160);

  const xAt = (i) => 30 + i * CHART_W_STEP;
  const yAt = (income) => AXIS_Y0 - (income / maxIncome) * PLOT_H;

  const growth = toNumber(career.annualGrowthPct, 0);
  const growthClass =
    growth > 0 ? "sh-chip sh-chip--accent" : growth < 0 ? "sh-chip sh-chip--warn" : "sh-chip";

  // unique gradient per card
  const gradId = React.useId();
  const titleId = `cp-title-${gradId}`;
  const descId  = `cp-desc-${gradId}`;

  /* ---------- derived labels ---------- */
  const title = String(career.name || "Career Path");
  const baseIncomeLabel = usd.format(toNumber(career.avgIncome, 0));
  const growthLabel = `${growth >= 0 ? "+" : ""}${pctFmt(growth)}/yr`;
  const progress = clamp(career.progressPct);

  /* ---------- render ---------- */
  return (
    <div className={`sh-career ${compact ? "is-compact" : "is-full"}`}>
      {/* Top summary */}
      <div className="sh-careerTop">
        <div className="sh-careerTitle">{title}</div>
        <div className="sh-chip" title="Estimated average income">
          Avg Income: {baseIncomeLabel}
        </div>
        <div className={growthClass} title="Estimated annual growth">
          Growth: {growthLabel}
        </div>
        {isTruthy(career.demand) && (
          <div className="sh-chip sh-chip--soft" title="Market demand">
            Demand: {String(career.demand)}
          </div>
        )}
      </div>

      {/* Student progress */}
      <div className="sh-careerProgressWrap">
        <div
          className="sh-careerProgressTrack"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Progress toward career readiness"
        >
          <div className="sh-careerProgressFill" style={{ width: `${progress}%` }} />
        </div>
        <div className="sh-careerProgressLabel">
          {progress}% progress toward career readiness
        </div>
      </div>

      {/* Chart */}
      <div className="sh-chartBox" style={{ overflowX: "auto" }}>
        <svg
          className="sh-chartSVG"
          viewBox={`0 0 ${width} ${CHART_H}`}
          preserveAspectRatio="xMidYMax meet"
          role="img"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <title id={titleId}>{title} — income projection</title>
          <desc id={descId}>
            Projected income from year 0 to year {Math.max(0, projection.length - 1)} based on
            base income {baseIncomeLabel} and growth {growthLabel}.
          </desc>

          {/* Axes */}
          <line x1="30" y1={AXIS_Y1} x2="30" y2={AXIS_Y0} className="sh-axis" />
          <line x1="30" y1={AXIS_Y0} x2={width} y2={AXIS_Y0} className="sh-axis" />

          {/* Income line */}
          {projection.length > 0 && (
            <polyline
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="3"
              points={projection.map((p, i) => `${xAt(i)},${yAt(p.income)}`).join(" ")}
            />
          )}

          {/* Gradient */}
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF7C43" />
              <stop offset="100%" stopColor="#FFB703" />
            </linearGradient>
          </defs>

          {/* Points */}
          {projection.map((p, i) => (
            <circle key={i} cx={xAt(i)} cy={yAt(p.income)} r="4" className="sh-progressDot" />
          ))}

          {/* X labels (years) — compact: fewer ticks */}
          {projection.map((p, i) => {
            const showTick = compact ? i % 2 === 0 || i === projection.length - 1 : true;
            if (!showTick) return null;
            return (
              <text
                key={`t${i}`}
                x={xAt(i)}
                y={AXIS_Y0 + 12}
                textAnchor="middle"
                className="sh-axisLabel"
              >
                Y{i}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="sh-legend">
        <div className="sh-legendItem">
          <span className="sh-legendSwatch sh-legendSwatch--line" /> Income projection
        </div>
        <div className="sh-legendItem">
          <span className="sh-legendSwatch sh-legendSwatch--progress" /> Student progress
        </div>
      </div>

      {/* Optional extras when not compact */}
      {!compact && (
        <>
          {Array.isArray(career.skills) && career.skills.length > 0 && (
            <div className="sh-skills">
              <strong>Core skills:</strong>{" "}
              {career.skills.slice(0, 8).map((s, i) => (
                <span key={i} className="sh-chip sh-chip--soft" style={{ marginRight: 6 }}>
                  {s}
                </span>
              ))}
              {career.skills.length > 8 && (
                <span className="sh-muted"> +{career.skills.length - 8} more</span>
              )}
            </div>
          )}

          {Array.isArray(career.badges) && career.badges.length > 0 && (
            <div className="sh-badgesRow">
              {career.badges.map((b, i) => (
                <span key={i} className="sh-chip sh-chip--accent" style={{ marginRight: 6 }}>
                  {b}
                </span>
              ))}
            </div>
          )}

          <div className="sh-actionsRow" style={{ marginTop: 8 }}>
            {typeof onView === "function" && (
              <button className="sh-btn" onClick={onView} title="View full pathway">
                View Path
              </button>
            )}
            {typeof onStart === "function" && (
              <button className="sh-btn sh-btn--primary" onClick={onStart} title="Start this pathway">
                Start Now
              </button>
            )}
            {typeof onCoachClick === "function" && (
              <button className="sh-btn sh-btn--secondary" onClick={onCoachClick} title="Talk to a coach">
                Talk to Coach
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- utils ---------- */
function clamp(n) {
  const x = Number(n ?? 0);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}
function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function isTruthy(v) {
  return !(v == null || v === "" || v === false);
}

/* ---------- prop types ---------- */
CareerPathCard.propTypes = {
  career: PropTypes.shape({
    name: PropTypes.string,
    avgIncome: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    annualGrowthPct: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    years: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    progressPct: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    demand: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    skills: PropTypes.arrayOf(PropTypes.string),
    badges: PropTypes.arrayOf(PropTypes.string),
  }),
  compact: PropTypes.bool,
  onView: PropTypes.func,
  onStart: PropTypes.func,
  onCoachClick: PropTypes.func,
};
