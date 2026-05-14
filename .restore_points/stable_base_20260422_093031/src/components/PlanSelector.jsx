// src/components/PlanSelector.jsx
import React from "react";
import PropTypes from "prop-types";
import { track } from "@/utils/analytics.js";

export default function PlanSelector({
  plans = [],
  loading = false,
  error = "",
  // New props
  selectedId: selectedIdProp = null,
  onPick,
  onViewPath,
  // Legacy props (compat)
  selectedIndex,            // legacy selection by index
  onSelect,                 // legacy pick
  onView,                   // legacy view
  // Other
  onStart,                  // (plan) => void
  onStartPersonalizer,      // () => void
  showHeader = true,
  compact = false,
}) {
  // --- compat: prefer new, fallback to legacy ---
  const pickHandler = onPick || onSelect || null;
  const viewHandler = onViewPath || onView || null;

  // derive selected id
  const legacyIdFromIndex =
    Number.isInteger(selectedIndex) && plans[selectedIndex]
      ? plans[selectedIndex].id
      : null;

  const [internalSelected, setInternalSelected] = React.useState(null);
  const selectedId =
    selectedIdProp ??
    legacyIdFromIndex ??
    internalSelected ??
    (plans[0]?.id || null);

  React.useEffect(() => {
    // if parent controls selection, clear local
    if (selectedIdProp != null || legacyIdFromIndex != null) setInternalSelected(null);
  }, [selectedIdProp, legacyIdFromIndex]);

  const onSelectPlan = (plan, index) => {
    const pid = plan?.id;
    if (!pid) return;
    if (selectedIdProp == null && legacyIdFromIndex == null) setInternalSelected(pid);
    try {
      track("pathway_plan_selected", {
        planId: pid,
        strategy: plan?.strategy,
        pathwayId: plan?.pathwayId,
        index
      });
    } catch {}
    pickHandler?.(pid, plan);
  };

  const selectedPlan = React.useMemo(
    () => plans.find((p) => p.id === selectedId) || null,
    [plans, selectedId]
  );

  // ---- formatters ----
  const usd = React.useMemo(
    () => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
    []
  );
  const dateFmt = (iso) => {
    if (!iso) return "TBD";
    const d = new Date(iso);
    if (Number.isNaN(+d)) return "TBD";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  // ---- helpers ----
  const labelForStrategy = (s, fallbackIndex) => {
    if (!s) return `Plan ${String.fromCharCode(65 + (fallbackIndex || 0))}`;
    switch (s) {
      case "fastest": return "Plan A · Fastest";
      case "least_cost": return "Plan B · Least Cost";
      case "highest_placement": return "Plan C · Highest Placement";
      default: return `Plan ${String.fromCharCode(65 + (fallbackIndex || 0))}`;
    }
  };

  const kpiRow = (p) => {
    const weeks = Number(p.estWeeks) || 0;
    const cost = Number.isFinite(p.netCostAfterAid) ? p.netCostAfterAid : Number(p.estCost) || 0;
    const cohort = p.nextCohortDate ? dateFmt(p.nextCohortDate) : "TBD";
    return (
      <div className="sh-row" style={{ gap: 8, flexWrap: "wrap" }}>
        <span className="sh-chip">{weeks} wks</span>
        <span className="sh-chip">{usd.format(cost)} <span className="sh-muted">after aid</span></span>
        <span className="sh-chip sh-chip--soft">Next cohort: {cohort}</span>
      </div>
    );
  };

  const firstSteps = (p) => {
    const mods = p?.pathway?.modules || []; // legacy/new embed
    if (!Array.isArray(mods) || mods.length === 0) return null;
    const three = mods.slice(0, 3);
    return (
      <ul className="sh-listReset" aria-label="First modules">
        {three.map((m, i) => (
          <li key={m.slug || i} className="sh-row">
            <span className="sh-chip sh-chip--soft">Step {i + 1}</span>
            <span>{m.title || m.slug}</span>
          </li>
        ))}
      </ul>
    );
  };

  // ---- skeleton / empty ----
  if (loading) {
    return (
      <section className="sh-card" role="group" aria-labelledby="plan-sel-title">
        <div className="sh-cardStripe" />
        <div className="sh-cardBody">
          {showHeader && <h2 id="plan-sel-title" className="sh-cardTitle">Recommended Plans</h2>}
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card card--pad">
                <div className="skel skel--row" />
                <div className="skel skel--row" />
                <div className="skel skel--row" />
                <div className="skel skel--button" style={{ marginTop: 8 }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="sh-card" role="group" aria-labelledby="plan-sel-title">
        <div className="sh-cardStripe" />
        <div className="sh-cardBody">
          {showHeader && <h2 id="plan-sel-title" className="sh-cardTitle">Recommended Plans</h2>}
          <div className="sh-alert sh-alert--warn">⚠ {error}</div>
        </div>
      </section>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <section className="sh-card" role="group" aria-labelledby="plan-sel-title">
        <div className="sh-cardStripe" />
        <div className="sh-cardBody">
          {showHeader && <h2 id="plan-sel-title" className="sh-cardTitle">Recommended Plans</h2>}
          <p className="sh-muted" style={{ marginTop: 4 }}>
            No recommendations yet. Start the personalizer to generate Plan A/B/C.
          </p>
          {typeof onStartPersonalizer === "function" && (
            <div className="sh-actionsRow" style={{ marginTop: 8 }}>
              <button className="sh-btn sh-btn--primary" onClick={onStartPersonalizer}>Start Personalizer</button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ---- main render ----
  return (
    <section className="sh-card" role="group" aria-labelledby="plan-sel-title">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        {showHeader && <h2 id="plan-sel-title" className="sh-cardTitle">Recommended Plans</h2>}

        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}
          role="list"
          aria-label="Recommended plans"
        >
          {plans.map((p, idx) => {
            const active = p.id === selectedId;
            const title = p.title || p?.pathway?.title || labelForStrategy(p.strategy, idx);
            const cred = p?.pathway?.firstCredential?.name;
            const letter = String.fromCharCode(65 + idx); // A, B, C

            return (
              <article
                key={p.id}
                role="listitem"
                className={`card card--pad sh-selectable ${active ? "is-active" : ""}`}
                aria-pressed={active ? "true" : "false"}
                aria-current={active ? "true" : "false"}
                onClick={() => onSelectPlan(p, idx)}
                onKeyDown={(e) => (e.key === "Enter" ? onSelectPlan(p, idx) : null)}
                tabIndex={0}
                title={`Select ${title}`}
                style={{ cursor: "pointer" }}
              >
                <div className="sh-row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                  <div className="sh-chip sh-chip--accent" aria-hidden>
                    Plan {letter}
                  </div>
                  <div className="sh-muted" style={{ textTransform: "capitalize" }}>
                    {humanStrategy(p.strategy)}
                  </div>
                </div>

                <h3 className="h3" style={{ margin: "8px 0 6px" }}>{title}</h3>

                {kpiRow(p)}

                {cred && (
                  <div className="sh-muted" style={{ marginTop: 8 }}>
                    First credential: <strong>{cred}</strong>
                  </div>
                )}

                {!compact && <div style={{ marginTop: 10 }}>{firstSteps(p)}</div>}

                <div className="sh-actionsRow" style={{ marginTop: 10 }}>
                  <button
                    className={`sh-btn ${active ? "sh-btn--primary" : ""}`}
                    onClick={(e) => { e.stopPropagation(); onSelectPlan(p, idx); }}
                    title="Select plan"
                  >
                    {active ? "Selected" : "Select"}
                  </button>
                  {typeof viewHandler === "function" && (
                    <button
                      className="sh-btn sh-btn--secondary"
                      onClick={(e) => { e.stopPropagation(); viewHandler(p); }}
                      title="View pathway details"
                    >
                      View Path
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {selectedPlan && <div className="sh-divider" style={{ margin: "16px 0" }} aria-hidden />}
        {selectedPlan && (
          <SelectedPlanDetails
            plan={selectedPlan}
            usd={usd}
            dateFmt={dateFmt}
            onStart={onStart}
          />
        )}
      </div>
    </section>
  );
}

/* ---------- Subcomponent ---------- */
function SelectedPlanDetails({ plan, usd, dateFmt, onStart }) {
  const weeks = Number(plan.estWeeks) || 0;
  const cost = Number.isFinite(plan.netCostAfterAid) ? plan.netCostAfterAid : Number(plan.estCost) || 0;
  const cohort = plan.nextCohortDate ? dateFmt(plan.nextCohortDate) : "TBD";
  const pathwayTitle = plan?.pathway?.title || plan.title || "Selected Path";
  const steps = Array.isArray(plan.steps) ? plan.steps : [];

  return (
    <div className="sh-row" style={{ gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div className="card card--pad" style={{ flex: "1 1 360px" }}>
        <div className="sh-row" style={{ gap: 8, flexWrap: "wrap" }}>
          <span className="sh-chip">{weeks} wks</span>
          <span className="sh-chip">{usd.format(cost)} <span className="sh-muted">after aid</span></span>
          <span className="sh-chip sh-chip--soft">Next cohort: {cohort}</span>
        </div>

        {steps.length > 0 ? (
          <ol className="sh-listReset" style={{ marginTop: 10 }}>
            {steps.slice(0, 5).map((s, i) => (
              <li key={s.id || i} className="sh-row">
                <span className="sh-chip sh-chip--soft">Step {i + 1}</span>
                <span>{s.title || s.type}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="sh-muted" style={{ marginTop: 10 }}>
            Your first three modules are shown in the cards above. A full step-by-step checklist will be generated after funding info is added.
          </p>
        )}
      </div>

      <div className="card card--pad" style={{ flex: "1 1 260px" }}>
        <h4 className="h4" style={{ marginTop: 0 }}>{pathwayTitle}</h4>
        <p className="sh-muted" style={{ marginTop: 6 }}>
          Ready to lock this in? You can always adjust after talking with a coach.
        </p>
        <div className="sh-actionsRow" style={{ marginTop: 8 }}>
          {typeof onStart === "function" ? (
            <button className="sh-btn sh-btn--primary" onClick={() => onStart(plan)} title="Start this plan">
              Start Plan
            </button>
          ) : (
            <button className="sh-btn" disabled title="Start unavailable">
              Start Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- utils ---------- */
function humanStrategy(s) {
  switch (s) {
    case "fastest": return "fastest";
    case "least_cost": return "least cost";
    case "highest_placement": return "highest placement";
    default: return "recommended";
  }
}

/* ---------- PropTypes ---------- */
PlanSelector.propTypes = {
  plans: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    strategy: PropTypes.string,
    pathwayId: PropTypes.string,
    title: PropTypes.string,
    estWeeks: PropTypes.number,
    netCostAfterAid: PropTypes.number,
    nextCohortDate: PropTypes.string,
    steps: PropTypes.array,
    pathway: PropTypes.shape({
      title: PropTypes.string,
      firstCredential: PropTypes.shape({ name: PropTypes.string }),
      modules: PropTypes.arrayOf(PropTypes.shape({
        slug: PropTypes.string,
        title: PropTypes.string,
        minutes: PropTypes.number,
      })),
    }),
  })),
  loading: PropTypes.bool,
  error: PropTypes.string,
  selectedId: PropTypes.string,   // new
  selectedIndex: PropTypes.number, // legacy
  onPick: PropTypes.func,          // new
  onSelect: PropTypes.func,        // legacy
  onStart: PropTypes.func,
  onViewPath: PropTypes.func,      // new
  onView: PropTypes.func,          // legacy
  onStartPersonalizer: PropTypes.func,
  showHeader: PropTypes.bool,
  compact: PropTypes.bool,
};

SelectedPlanDetails.propTypes = {
  plan: PropTypes.object.isRequired,
  usd: PropTypes.object.isRequired,
  dateFmt: PropTypes.func.isRequired,
  onStart: PropTypes.func,
};
