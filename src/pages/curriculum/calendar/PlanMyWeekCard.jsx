// src/pages/curriculum/calendar/PlanMyWeekCard.jsx
//
// Safe V1 (per the build brief's explicit guardrail — no autonomous
// scheduling agent, never silently move institutional events): this
// derives a plain list of this week's real open assignments/portfolio
// items and shows them as a review checklist. Checking an item is local
// UI state only — it does NOT mark the assignment complete (Assignments
// remains the sole owner of submission/completion truth) and nothing
// here is persisted; reloading the page resets it. No fabricated minute
// -duration estimates are shown (the mock's "25 min" examples are
// illustrative only — no real duration-estimate field exists on any
// source in this repo), only the real item and its real due date.
//
// SHF Ecosystem Phase 10: when the canonical backend Calendar Intelligence
// Engine has loaded, this card shows its deterministic, explainable
// recommendations (conflicts, deadline concentration, deadlines/renewals
// coming up soon) instead of the plain checklist — every recommendation
// traces to a real event id and stays advisory in language ("Review",
// "Consider"), never "You must." Nothing here is ever a personal free-time
// claim (see calendar-intelligence-service.ts's own §22-23 boundary) and
// nothing is saved or persisted. If Intelligence hasn't loaded (or
// failed), this card falls back to the original local checklist rather
// than showing nothing.
import React from "react";
import { parseLocalDate, startOfDay, addDays, formatDayLabel } from "@/pages/career/calendar/dateUtils.js";

function eventForRecommendation(events, recommendation) {
  const id = recommendation.relatedEventIds?.[0];
  return id ? events.find((evt) => evt.id === id) : null;
}

export default function PlanMyWeekCard({ events, today, intelligence, onOpenEvent }) {
  const [generated, setGenerated] = React.useState(false);
  const [checked, setChecked] = React.useState({});

  const weekItems = React.useMemo(() => {
    const start = startOfDay(today);
    const end = addDays(start, 7);
    return events
      .filter((evt) => (evt.type === "assignment" || evt.type === "portfolio") && !evt.completed)
      .filter((evt) => {
        const d = parseLocalDate(evt.dueDate || evt.start);
        return d && startOfDay(d) >= start && startOfDay(d) < end;
      })
      .sort((a, b) => parseLocalDate(a.dueDate || a.start) - parseLocalDate(b.dueDate || b.start));
  }, [events, today]);

  function toggle(id) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const recommendations = intelligence?.recommendations;

  return (
    <section className="lc-railCard lc-planCard" aria-labelledby="lc-plan-title">
      <div className="lc-railCardHead">
        <h2 id="lc-plan-title" className="lc-railCardTitle">Plan My Week</h2>
        {generated && (
          <button type="button" className="lc-railViewAll" onClick={() => { setGenerated(false); setChecked({}); }}>
            Clear
          </button>
        )}
      </div>

      {generated && (
        <>
          {recommendations ? (
            recommendations.length === 0 ? (
              <p className="lc-railEmpty">No conflicts or deadline pressure detected this week — you're ahead.</p>
            ) : (
              <ul className="lc-planList">
                {recommendations.map((rec, idx) => {
                  const relatedEvent = eventForRecommendation(events, rec);
                  return (
                    <li key={`${rec.reasonCode}-${idx}`} className="lc-planItem">
                      <button
                        type="button"
                        className="lc-plainRow lc-planRecommendation"
                        onClick={relatedEvent && onOpenEvent ? () => onOpenEvent(relatedEvent) : undefined}
                        disabled={!relatedEvent || !onOpenEvent}
                      >
                        <span className={rec.severity === "HIGH" ? "lc-typeDot lc-typeDot--high" : "lc-typeDot"} aria-hidden="true" />
                        <span className="lc-planItemTitle">{rec.message}</span>
                        <span className="lc-planItemDue">{rec.recommendedAction}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          ) : weekItems.length === 0 ? (
            <p className="lc-railEmpty">Nothing open is due this week — you're ahead.</p>
          ) : (
            <ul className="lc-planList">
              {weekItems.map((evt) => {
                const d = parseLocalDate(evt.dueDate || evt.start);
                return (
                  <li key={evt.id} className="lc-planItem">
                    <label className="lc-planCheckRow">
                      <input
                        type="checkbox"
                        checked={!!checked[evt.id]}
                        onChange={() => toggle(evt.id)}
                      />
                      <span className={checked[evt.id] ? "lc-planItemTitle is-checked" : "lc-planItemTitle"}>
                        {evt.title}
                      </span>
                      <span className="lc-planItemDue">{d ? formatDayLabel(d).replace(/^\w+,\s/, "") : ""}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <button type="button" className="lc-planBtn" onClick={() => setGenerated(true)}>
        Plan My Week ✨
      </button>
    </section>
  );
}
